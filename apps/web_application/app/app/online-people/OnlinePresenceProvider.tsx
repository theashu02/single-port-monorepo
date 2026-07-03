"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { fetchGuestSession } from "@/core/apis/Guest_API";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  chatBusy,
  chatExpired,
  chatReady,
  matchmakeSuccess,
  chatRejected,
  chatTypingReceived,
  inviteReceived,
  messageReceived,
} from "@/lib/redux/slices/chatSlice";
import {
  onlineUsersSnapshotReceived,
  presenceCountsReceived,
  presenceIdentityChanged,
  presenceReset,
  presenceStatusChanged,
  selectCurrentUserId,
  selectOnlineUsers,
  selectPresenceError,
  selectPresenceStatus,
  selectUserCount,
  userBusyChanged,
  type OnlineUser,
  type PresenceStatus,
} from "@/lib/redux/slices/presenceSlice";
import {
  matchmakeQueued,
  matchmakeFound,
  matchmakeCancelled,
  matchmakeStarted,
} from "@/lib/redux/slices/matchmakingSlice";

export type {
  OnlineUser,
  PresenceStatus,
} from "@/lib/redux/slices/presenceSlice";

const GUEST_MARKER_KEY = "guest_session_present";
const DEFAULT_WS_ENDPOINT = "ws://localhost:3001/ws";
const SOCKET_REPLACED_CODE = 4000;

interface OnlinePresenceActions {
  requestChat: (targetId: string) => boolean;
  acceptChat: (fromId: string) => boolean;
  rejectChat: (fromId: string) => boolean;
  sendMessage: (channel: string, text: string) => boolean;
  sendTypingStatus: (channel: string, isTyping: boolean) => boolean;
  endChat: (channel: string) => boolean;
  startMatchmaking: () => boolean;
  cancelMatchmaking: () => boolean;
}

interface OnlinePresenceContextValue extends OnlinePresenceActions {
  users: OnlineUser[];
  userCount: number;
  currentUserId: string | null;
  status: PresenceStatus;
  error: string | null;
}

const OnlinePresenceActionsContext =
  createContext<OnlinePresenceActions | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseOnlineUser(value: unknown): OnlineUser | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string"
  )
    return null;
  const id = value.id.trim();
  const name = value.name.trim();
  return id && name ? { id, name, isBusy: value.isBusy === true } : null;
}

function parseNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

type ServerEvent =
  | {
      type: "online_users_snapshot";
      users: OnlineUser[];
      totalOnline: number;
      totalBusy: number;
      sampleSize: number;
    }
  | { type: "presence_counts"; online: number; busy: number }
  | { type: "user_status_changed"; userId: string; isBusy: boolean }
  | { type: "chat_invite"; from: OnlineUser; channel: string }
  | { type: "chat_ready"; channel: string }
  | { type: "chat_rejected"; byId: string }
  | { type: "chat_busy"; byId: string }
  | { type: "chat_expired"; byId: string }
  | {
      type: "chat_message";
      channel: string;
      fromId: string;
      text: string;
      id?: string;
    }
  | {
      type: "chat_typing";
      channel: string;
      fromId: string;
      isTyping: boolean;
    }
  | { type: "matchmake_queued"; position: number }
  | { type: "matchmake_found"; peer: OnlineUser; channel: string }
  | { type: "matchmake_cancelled"; reason: string };

function parseServerEvent(raw: string): ServerEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || typeof parsed.type !== "string") return null;

  switch (parsed.type) {
    case "online_users_snapshot": {
      if (!Array.isArray(parsed.users)) return null;
      const users = parsed.users
        .map(parseOnlineUser)
        .filter((user): user is OnlineUser => user !== null);
      return {
        type: "online_users_snapshot",
        users,
        totalOnline:
          typeof parsed.totalOnline === "number" ? parsed.totalOnline : users.length,
        totalBusy:
          typeof parsed.totalBusy === "number"
            ? parsed.totalBusy
            : users.filter((user) => user.isBusy).length,
        sampleSize:
          typeof parsed.sampleSize === "number" ? parsed.sampleSize : users.length,
      };
    }
    case "presence_counts": {
      if (typeof parsed.online !== "number" || typeof parsed.busy !== "number")
        return null;
      return {
        type: "presence_counts",
        online: Math.max(0, parsed.online),
        busy: Math.max(0, parsed.busy),
      };
    }
    case "user_status_changed": {
      const userId = parseNonEmptyString(parsed.userId);
      if (!userId || typeof parsed.isBusy !== "boolean") return null;
      return { type: "user_status_changed", userId, isBusy: parsed.isBusy };
    }
    case "chat_invite": {
      const from = parseOnlineUser(parsed.from);
      const channel = parseNonEmptyString(parsed.channel);
      return from && channel ? { type: "chat_invite", from, channel } : null;
    }
    case "chat_ready": {
      const channel = parseNonEmptyString(parsed.channel);
      return channel ? { type: "chat_ready", channel } : null;
    }
    case "chat_rejected": {
      const byId = parseNonEmptyString(parsed.byId);
      return byId ? { type: "chat_rejected", byId } : null;
    }
    case "chat_busy": {
      const byId = parseNonEmptyString(parsed.byId);
      return byId ? { type: "chat_busy", byId } : null;
    }
    case "chat_expired": {
      const byId = parseNonEmptyString(parsed.byId);
      return byId ? { type: "chat_expired", byId } : null;
    }
    case "chat_message": {
      const channel = parseNonEmptyString(parsed.channel);
      const fromId = parseNonEmptyString(parsed.fromId);
      if (!channel || !fromId || typeof parsed.text !== "string") return null;
      const id = parseNonEmptyString(parsed.id);
      return { type: "chat_message", channel, fromId, text: parsed.text, id: id ?? undefined };
    }
    case "chat_typing": {
      const channel = parseNonEmptyString(parsed.channel);
      const fromId = parseNonEmptyString(parsed.fromId);
      if (!channel || !fromId || typeof parsed.isTyping !== "boolean")
        return null;
      return {
        type: "chat_typing",
        channel,
        fromId,
        isTyping: parsed.isTyping,
      };
    }
    case "matchmake_queued": {
      if (typeof parsed.position !== "number") return null;
      return { type: "matchmake_queued", position: parsed.position };
    }
    case "matchmake_found": {
      const peer = parseOnlineUser(parsed.peer);
      const channel = parseNonEmptyString(parsed.channel);
      return peer && channel
        ? { type: "matchmake_found", peer, channel }
        : null;
    }
    case "matchmake_cancelled": {
      const reason = parseNonEmptyString(parsed.reason);
      return reason ? { type: "matchmake_cancelled", reason } : null;
    }
    default:
      return null;
  }
}

function buildWebSocketUrl(endpoint: string, id: string, name: string): string {
  const url = new URL(endpoint, window.location.href);
  if (url.protocol === "http:") url.protocol = "ws:";
  if (url.protocol === "https:") url.protocol = "wss:";
  url.searchParams.set("userId", id);
  url.searchParams.set("name", name);
  return url.toString();
}

type Identity = { id: string; name: string };

function isSameIdentity(left: Identity | null, right: Identity): boolean {
  return left?.id === right.id && left.name === right.name;
}

function createClientMessageId(fromId: string, ts: number): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${fromId}-${ts}-${Math.random().toString(36).slice(2)}`;
}

export function OnlinePresenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const dispatch = useAppDispatch();
  const [identity, setIdentity] = useState<Identity | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const dispatchRef = useRef(dispatch);

  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  useEffect(() => {
    let active = true;

    const commitIdentity = (nextIdentity: Identity) => {
      if (!active) return;
      setIdentity((current) =>
        isSameIdentity(current, nextIdentity) ? current : nextIdentity,
      );
      dispatch(presenceIdentityChanged(nextIdentity.id));
    };

    async function resolveIdentity() {
      if (sessionStatus === "loading") {
        dispatch(
          presenceStatusChanged({ status: "resolving-user", error: null }),
        );
        return;
      }

      const sessionUserId = session?.user?.id?.trim();
      if (sessionUserId) {
        const name =
          session?.user?.name?.trim() ||
          session?.user?.email?.split("@")[0]?.trim() ||
          "User";
        commitIdentity({ id: `user:${sessionUserId}`, name });
        return;
      }

      const hasGuestMarker =
        window.localStorage.getItem(GUEST_MARKER_KEY) === "1";
      if (!hasGuestMarker) {
        if (!active) return;
        setIdentity(null);
        dispatch(presenceReset({ status: "unauthenticated", error: null }));
        return;
      }

      dispatch(
        presenceStatusChanged({ status: "resolving-user", error: null }),
      );

      try {
        const guest = await fetchGuestSession();
        if (!active) return;
        const guestId = guest.guest_id?.trim();
        if (!guestId) throw new Error("Guest session is missing an id.");
        commitIdentity({
          id: `guest:${guestId}`,
          name: guest.nickname?.trim() || "Guest",
        });
      } catch (err) {
        if (!active) return;
        window.localStorage.removeItem(GUEST_MARKER_KEY);
        setIdentity(null);
        dispatch(
          presenceReset({
            status: "unauthenticated",
            error:
              err instanceof Error
                ? err.message
                : "Unable to resolve the current user.",
          }),
        );
      }
    }

    void resolveIdentity();

    return () => {
      active = false;
    };
  }, [
    dispatch,
    session?.user?.email,
    session?.user?.id,
    session?.user?.name,
    sessionStatus,
  ]);

  useEffect(() => {
    if (!identity) {
      socketRef.current?.close(1000, "No active user identity");
      socketRef.current = null;
      return;
    }

    let closedByEffect = false;
    let reconnectAttempts = 0;
    let reconnectTimer: number | undefined;

    const connect = () => {
      const endpoint =
        process.env.NEXT_PUBLIC_WEBSOCKET_URL || DEFAULT_WS_ENDPOINT;
      let socket: WebSocket;

      try {
        socket = new WebSocket(
          buildWebSocketUrl(endpoint, identity.id, identity.name),
        );
      } catch (err) {
        dispatch(
          presenceStatusChanged({
            status: "error",
            error:
              err instanceof Error
                ? err.message
                : "Invalid websocket endpoint.",
          }),
        );
        return;
      }

      socketRef.current = socket;
      dispatch(presenceStatusChanged({ status: "connecting", error: null }));

      socket.onopen = () => {
        reconnectAttempts = 0;
        dispatch(presenceStatusChanged({ status: "connected", error: null }));
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        const msg = parseServerEvent(event.data);
        if (!msg) return;

        switch (msg.type) {
          case "online_users_snapshot":
            dispatchRef.current(
              onlineUsersSnapshotReceived({
                users: msg.users,
                totalOnline: msg.totalOnline,
                totalBusy: msg.totalBusy,
                sampleSize: msg.sampleSize,
              }),
            );
            return;
          case "presence_counts":
            dispatchRef.current(
              presenceCountsReceived({ online: msg.online, busy: msg.busy }),
            );
            return;
          case "user_status_changed":
            dispatchRef.current(
              userBusyChanged({ userId: msg.userId, isBusy: msg.isBusy }),
            );
            return;
          case "chat_invite":
            dispatchRef.current(
              inviteReceived({ from: msg.from, channel: msg.channel }),
            );
            return;
          case "chat_ready":
            dispatchRef.current(chatReady({ channel: msg.channel }));
            return;
          case "chat_rejected":
            dispatchRef.current(
              userBusyChanged({ userId: msg.byId, isBusy: false }),
            );
            dispatchRef.current(
              userBusyChanged({ userId: identity.id, isBusy: false }),
            );
            dispatchRef.current(chatRejected());
            return;
          case "chat_busy":
            dispatchRef.current(chatBusy());
            return;
          case "chat_expired":
            dispatchRef.current(
              userBusyChanged({ userId: msg.byId, isBusy: false }),
            );
            dispatchRef.current(
              userBusyChanged({ userId: identity.id, isBusy: false }),
            );
            dispatchRef.current(chatExpired());
            return;
          case "chat_message": {
            const ts = Date.now();
            const msgId = msg.id ?? createClientMessageId(msg.fromId, ts);
            dispatchRef.current(
              messageReceived({
                id: msgId,
                channel: msg.channel,
                fromId: msg.fromId,
                text: msg.text,
                ts,
              }),
            );
            return;
          }
          case "chat_typing":
            dispatchRef.current(
              chatTypingReceived({
                channel: msg.channel,
                fromId: msg.fromId,
                isTyping: msg.isTyping,
              }),
            );
            return;
          case "matchmake_queued":
            dispatchRef.current(
              matchmakeQueued({ position: msg.position }),
            );
            return;
          case "matchmake_found":
            socket.send(
              JSON.stringify({
                type: "matchmake_ready",
                channel: msg.channel,
              }),
            );
            dispatchRef.current(matchmakeFound());
            dispatchRef.current(
              matchmakeSuccess({ peer: msg.peer, channel: msg.channel }),
            );
            return;
          case "matchmake_cancelled":
            dispatchRef.current(matchmakeCancelled());
            return;
        }
      };

      socket.onerror = () => {
        dispatch(
          presenceStatusChanged({
            status: "error",
            error: "Unable to reach the websocket service.",
          }),
        );
      };

      socket.onclose = (event) => {
        if (socketRef.current === socket) socketRef.current = null;
        if (closedByEffect) return;

        const isAuthFailure = event.code === 1008;
        const isReplacedSocket = event.code === SOCKET_REPLACED_CODE;
        const error =
          event.reason ||
          (isReplacedSocket
            ? "Another active socket is already connected for this user."
            : "Websocket connection closed.");

        dispatch(
          presenceStatusChanged({
            status: isAuthFailure ? "error" : "disconnected",
            error,
          }),
        );
        dispatch(chatRejected());

        if (isAuthFailure || isReplacedSocket) return;

        const delay = Math.min(1000 * 2 ** reconnectAttempts, 5000);
        reconnectAttempts += 1;
        
        reconnectTimer = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socketRef.current?.close(1000, "Presence provider remounted");
      socketRef.current = null;
    };
  }, [dispatch, identity]);

  const send = useCallback((payload: object): boolean => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;
    socketRef.current.send(JSON.stringify(payload));
    return true;
  }, []);

  const requestChat = useCallback(
    (targetId: string) => send({ type: "chat_request", targetId }),
    [send],
  );

  const acceptChat = useCallback(
    (fromId: string) => send({ type: "accept_chat", targetId: fromId }),
    [send],
  );

  const rejectChat = useCallback(
    (fromId: string) => send({ type: "reject_chat", fromId }),
    [send],
  );

  const sendMessage = useCallback(
    (channel: string, text: string) => {
      if (!identity) return false;

      const ts = Date.now();
      const id = createClientMessageId(identity.id, ts);
      const ok = send({ type: "chat_message", channel, text, clientId: id });
      if (!ok) return false;

      dispatch(
        messageReceived({
          id,
          channel,
          fromId: identity.id,
          text,
          ts,
        }),
      );
      return true;
    },
    [dispatch, identity, send],
  );

  const sendTypingStatus = useCallback(
    (channel: string, isTyping: boolean) =>
      send({ type: "chat_typing", channel, isTyping }),
    [send],
  );

  const endChat = useCallback(
    (channel: string) => send({ type: "end_chat", channel }),
    [send],
  );

  const startMatchmaking = useCallback(() => {
    const ok = send({ type: "matchmake_join" });
    if (ok) dispatch(matchmakeStarted());
    return ok;
  }, [send, dispatch]);

  const cancelMatchmaking = useCallback(() => {
    const ok = send({ type: "matchmake_leave" });
    if (ok) dispatch(matchmakeCancelled());
    return ok;
  }, [send, dispatch]);

  const actions = useMemo<OnlinePresenceActions>(
    () => ({
      requestChat,
      acceptChat,
      rejectChat,
      sendMessage,
      sendTypingStatus,
      endChat,
      startMatchmaking,
      cancelMatchmaking,
    }),
    [
      acceptChat,
      cancelMatchmaking,
      endChat,
      rejectChat,
      requestChat,
      sendMessage,
      sendTypingStatus,
      startMatchmaking,
    ],
  );

  return (
    <OnlinePresenceActionsContext.Provider value={actions}>
      {children}
    </OnlinePresenceActionsContext.Provider>
  );
}

export function useOnlinePresenceActions() {
  const context = useContext(OnlinePresenceActionsContext);
  if (!context) {
    throw new Error(
      "useOnlinePresenceActions must be used within OnlinePresenceProvider",
    );
  }
  return context;
}

export function useOnlinePresence(): OnlinePresenceContextValue {
  const actions = useOnlinePresenceActions();
  const users = useAppSelector(selectOnlineUsers);
  const userCount = useAppSelector(selectUserCount);
  const currentUserId = useAppSelector(selectCurrentUserId);
  const status = useAppSelector(selectPresenceStatus);
  const error = useAppSelector(selectPresenceError);

  return useMemo(
    () => ({
      users,
      userCount,
      currentUserId,
      status,
      error,
      ...actions,
    }),
    [actions, currentUserId, error, status, userCount, users],
  );
}
