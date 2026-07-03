import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch } from "@/lib/redux/hooks";
import { fetchGuestSession } from "@/core/apis/Guest_API";
import {
  presenceIdentityChanged,
  presenceReset,
  presenceStatusChanged,
  onlineUsersSnapshotReceived,
  presenceCountsReceived,
  userBusyChanged,
} from "@/lib/redux/slices/presenceSlice";
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
  matchmakeQueued,
  matchmakeFound,
  matchmakeCancelled,
} from "@/lib/redux/slices/matchmakingSlice";
import {
  type Identity,
  isSameIdentity,
  buildWebSocketUrl,
  parseServerEvent,
  createClientMessageId,
} from "@/lib/utils/presenceUtils";

const GUEST_MARKER_KEY = "guest_session_present";
const DEFAULT_WS_ENDPOINT = "ws://localhost:3001/ws";
const SOCKET_REPLACED_CODE = 4000;

export function usePresenceConnection() {
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

  return { socketRef, identity };
}
