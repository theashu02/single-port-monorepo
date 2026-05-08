"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchGuestSession } from "@/core/apis/Guest_API";
import { useAppDispatch } from "@/lib/redux/hooks";
import { chatReady, chatRejected, inviteReceived, messageReceived } from "@/lib/redux/slices/chatSlice";

const GUEST_MARKER_KEY = "guest_session_present";
const DEFAULT_WS_ENDPOINT = "ws://localhost:3001/ws";

// ── Public types ─────────────────────────────────────────────────────────────

export interface OnlineUser {
  id: string;
  name: string;
}

export type PresenceStatus = "resolving-user" | "unauthenticated" | "connecting" | "connected" | "disconnected" | "error";

interface OnlinePresenceContextValue {
  // presence
  users: OnlineUser[];
  userCount: number;
  currentUserId: string | null;
  status: PresenceStatus;
  error: string | null;
  // chat actions — all reuse the single socket, return false if not connected
  requestChat: (targetId: string) => boolean;
  acceptChat: (fromId: string) => boolean;
  rejectChat: (fromId: string) => boolean;
  sendMessage: (channel: string, text: string) => boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────

const OnlinePresenceContext = createContext<OnlinePresenceContextValue | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseOnlineUser(value: unknown): OnlineUser | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return null;
  const id = value.id.trim();
  const name = value.name.trim();
  return id && name ? { id, name } : null;
}

type ServerEvent =
  | { type: "online_users_snapshot"; users: OnlineUser[] }
  | { type: "user_joined"; user: OnlineUser }
  | { type: "user_left"; userId: string }
  | { type: "chat_invite"; from: OnlineUser; channel: string }
  | { type: "chat_ready"; channel: string }
  | { type: "chat_rejected"; byId: string }
  | { type: "chat_message"; channel: string; fromId: string; text: string };

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
      const users = parsed.users.map(parseOnlineUser).filter((u): u is OnlineUser => u !== null);
      return { type: "online_users_snapshot", users };
    }
    case "user_joined": {
      const user = parseOnlineUser(parsed.user);
      return user ? { type: "user_joined", user } : null;
    }
    case "user_left": {
      if (typeof parsed.userId !== "string") return null;
      const userId = parsed.userId.trim();
      return userId ? { type: "user_left", userId } : null;
    }
    case "chat_invite": {
      const from = parseOnlineUser(parsed.from);
      if (!from || typeof parsed.channel !== "string") return null;
      return { type: "chat_invite", from, channel: parsed.channel };
    }
    case "chat_ready": {
      if (typeof parsed.channel !== "string") return null;
      return { type: "chat_ready", channel: parsed.channel };
    }
    case "chat_rejected": {
      if (typeof parsed.byId !== "string") return null;
      return { type: "chat_rejected", byId: parsed.byId };
    }
    case "chat_message": {
      if (typeof parsed.channel !== "string" || typeof parsed.fromId !== "string" || typeof parsed.text !== "string") return null;
      return {
        type: "chat_message",
        channel: parsed.channel,
        fromId: parsed.fromId,
        text: parsed.text,
      };
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

function upsertUser(map: Map<string, OnlineUser>, user: OnlineUser): Map<string, OnlineUser> {
  const next = new Map(map);
  next.set(user.id, user);
  return next;
}

function removeUser(map: Map<string, OnlineUser>, userId: string): Map<string, OnlineUser> {
  if (!map.has(userId)) return map; // same ref → no re-render
  const next = new Map(map);
  next.delete(userId);
  return next;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function OnlinePresenceProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const dispatch = useAppDispatch();

  type Identity = { id: string; name: string };
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [usersMap, setUsersMap] = useState<Map<string, OnlineUser>>(new Map());
  const [status, setStatus] = useState<PresenceStatus>("resolving-user");
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  /**
   * Stable ref to the Redux dispatch function.
   * Using a ref means the onmessage closure never becomes stale —
   * we never need to recreate the socket just because dispatch changed identity.
   */
  const dispatchRef = useRef(dispatch);
  useEffect(() => {
    dispatchRef.current = dispatch;
  });

  // ── Identity resolution ──────────────────────────────────────────────────

  useEffect(() => {
    let active = true;

    async function resolveIdentity() {
      if (sessionStatus === "loading") {
        setStatus("resolving-user");
        return;
      }

      const sessionUserId = session?.user?.id?.trim();
      if (sessionUserId) {
        const name = session?.user?.name?.trim() || session?.user?.email?.split("@")[0]?.trim() || "User";
        if (active) setIdentity({ id: `user:${sessionUserId}`, name });
        return;
      }

      const hasGuestMarker = window.localStorage.getItem(GUEST_MARKER_KEY) === "1";
      if (!hasGuestMarker) {
        setIdentity(null);
        setUsersMap(new Map());
        setError(null);
        setStatus("unauthenticated");
        return;
      }

      setStatus("resolving-user");

      try {
        const guest = await fetchGuestSession();
        if (!active) return;
        const guestId = guest.guest_id?.trim();
        if (!guestId) throw new Error("Guest session is missing an id.");
        setIdentity({
          id: `guest:${guestId}`,
          name: guest.nickname?.trim() || "Guest",
        });
      } catch (err) {
        if (!active) return;
        window.localStorage.removeItem(GUEST_MARKER_KEY);
        setIdentity(null);
        setUsersMap(new Map());
        setError(err instanceof Error ? err.message : "Unable to resolve the current user.");
        setStatus("unauthenticated");
      }
    }

    void resolveIdentity();
    return () => {
      active = false;
    };
  }, [session?.user?.email, session?.user?.id, session?.user?.name, sessionStatus]);

  // ── WebSocket lifecycle ──────────────────────────────────────────────────

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
      const endpoint = process.env.NEXT_PUBLIC_WEBSOCKET_URL || DEFAULT_WS_ENDPOINT;
      let socket: WebSocket;

      try {
        socket = new WebSocket(buildWebSocketUrl(endpoint, identity.id, identity.name));
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Invalid websocket endpoint.");
        return;
      }

      socketRef.current = socket;
      setStatus("connecting");
      setError(null);

      socket.onopen = () => {
        reconnectAttempts = 0;
        setStatus("connected");
        setError(null);
      };

      /**
       * THE MULTIPLEXER — single handler, zero subscriptions to manage.
       *
       * Presence events → React local state (setUsersMap).
       * Chat events    → Redux dispatch (synchronous, no re-subscription race).
       *
       * Using dispatchRef so the closure is always current without recreating
       * the socket when dispatch identity changes.
       */
      socket.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        const msg = parseServerEvent(event.data);
        if (!msg) return;

        switch (msg.type) {
          // ── Presence ───────────────────────────────────────────────────
          case "online_users_snapshot":
            setUsersMap(new Map(msg.users.map((u) => [u.id, u])));
            return;
          case "user_joined":
            setUsersMap((prev) => upsertUser(prev, msg.user));
            return;
          case "user_left":
            setUsersMap((prev) => removeUser(prev, msg.userId));
            return;

          // ── Chat (dispatched directly → zero latency) ──────────────────
          case "chat_invite":
            dispatchRef.current(inviteReceived({ from: msg.from, channel: msg.channel }));
            return;
          case "chat_ready":
            dispatchRef.current(chatReady({ channel: msg.channel }));
            return;
          case "chat_rejected":
            dispatchRef.current(chatRejected());
            return;
          case "chat_message":
            dispatchRef.current(
              messageReceived({
                channel: msg.channel,
                fromId: msg.fromId,
                text: msg.text,
                ts: Date.now(),
              }),
            );
            return;
        }
      };

      socket.onerror = () => {
        setError("Unable to reach the websocket service.");
      };

      socket.onclose = (event) => {
        if (socketRef.current === socket) socketRef.current = null;
        if (closedByEffect) return;

        setStatus(event.code === 1008 ? "error" : "disconnected");
        setError(event.reason || "Websocket connection closed.");

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
  }, [identity]);

  // ── Socket send helpers — stable refs, never cause re-renders ────────────

  const send = useCallback((payload: object): boolean => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;
    socketRef.current.send(JSON.stringify(payload));
    return true;
  }, []);

  const requestChat = useCallback((targetId: string) => send({ type: "chat_request", targetId }), [send]);

  const acceptChat = useCallback((fromId: string) => send({ type: "accept_chat", targetId: fromId }), [send]);

  const rejectChat = useCallback((fromId: string) => send({ type: "reject_chat", fromId }), [send]);

  const sendMessage = useCallback((channel: string, text: string) => send({ type: "chat_message", channel, text }), [send]);

  // ── Derived state ────────────────────────────────────────────────────────

  const users = useMemo(() => Array.from(usersMap.values()), [usersMap]);

  const value = useMemo<OnlinePresenceContextValue>(
    () => ({
      users,
      userCount: usersMap.size,
      currentUserId: identity?.id ?? null,
      status,
      error,
      requestChat,
      acceptChat,
      rejectChat,
      sendMessage,
    }),
    [users, usersMap.size, identity?.id, status, error, requestChat, acceptChat, rejectChat, sendMessage],
  );

  return <OnlinePresenceContext.Provider value={value}>{children}</OnlinePresenceContext.Provider>;
}

export function useOnlinePresence() {
  const context = useContext(OnlinePresenceContext);
  if (!context) {
    throw new Error("useOnlinePresence must be used within OnlinePresenceProvider");
  }
  return context;
}
