"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchGuestSession } from "@/core/apis/Guest_API";

const GUEST_MARKER_KEY = "guest_session_present";
const DEFAULT_WS_ENDPOINT = "ws://localhost:3001/ws";

export interface OnlineUser {
  id: string;
  name: string;
}

type PresenceIdentity = OnlineUser;
type PresenceStatus = "resolving-user" | "unauthenticated" | "connecting" | "connected" | "disconnected" | "error";

type PresenceServerEvent =
  | {
      type: "online_users_snapshot";
      users: OnlineUser[];
    }
  | {
      type: "user_joined";
      user: OnlineUser;
    }
  | {
      type: "user_left";
      userId: string;
    };

interface OnlinePresenceContextValue {
  users: OnlineUser[];
  userCount: number;
  currentUserId: string | null;
  status: PresenceStatus;
  error: string | null;
  requestChat: (targetId: string) => boolean;
}

const OnlinePresenceContext = createContext<OnlinePresenceContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseOnlineUser(value: unknown): OnlineUser | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }

  const id = value.id.trim();
  const name = value.name.trim();
  return id && name ? { id, name } : null;
}

function parsePresenceEvent(raw: string): PresenceServerEvent | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || typeof parsed.type !== "string") return null;

  if (parsed.type === "online_users_snapshot") {
    if (!Array.isArray(parsed.users)) return null;
    return {
      type: "online_users_snapshot",
      users: parsed.users.map(parseOnlineUser).filter((user): user is OnlineUser => Boolean(user)),
    };
  }

  if (parsed.type === "user_joined") {
    const user = parseOnlineUser(parsed.user);
    return user ? { type: "user_joined", user } : null;
  }

  if (parsed.type === "user_left" && typeof parsed.userId === "string") {
    const userId = parsed.userId.trim();
    return userId ? { type: "user_left", userId } : null;
  }

  return null;
}

function buildWebSocketUrl(endpoint: string, identity: PresenceIdentity) {
  const url = new URL(endpoint, window.location.href);

  if (url.protocol === "http:") url.protocol = "ws:";
  if (url.protocol === "https:") url.protocol = "wss:";

  url.searchParams.set("userId", identity.id);
  url.searchParams.set("name", identity.name);

  return url.toString();
}

function upsertUser(map: Map<string, OnlineUser>, user: OnlineUser): Map<string, OnlineUser> {
  const next = new Map(map);
  next.set(user.id, user);
  return next;
}

function removeUser(map: Map<string, OnlineUser>, userId: string): Map<string, OnlineUser> {
  if (!map.has(userId)) return map; // No change — return same reference to skip re-render.
  const next = new Map(map);
  next.delete(userId);
  return next;
}

export function OnlinePresenceProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [identity, setIdentity] = useState<PresenceIdentity | null>(null);
  // Map<userId, OnlineUser> — O(1) upsert/delete vs the previous filter+push O(n) approach.
  const [usersMap, setUsersMap] = useState<Map<string, OnlineUser>>(new Map());
  const [status, setStatus] = useState<PresenceStatus>("resolving-user");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

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
        if (!active) return;
        setIdentity({ id: `user:${sessionUserId}`, name });
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
        if (!guestId) {
          throw new Error("Guest session is missing an id.");
        }

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
        socket = new WebSocket(buildWebSocketUrl(endpoint, identity));
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

      socket.onmessage = (event) => {
        if (typeof event.data !== "string") return;

        const message = parsePresenceEvent(event.data);
        if (!message) return;

        if (message.type === "online_users_snapshot") {
          const map = new Map(message.users.map((u) => [u.id, u]));
          setUsersMap(map);
          return;
        }

        if (message.type === "user_joined") {
          setUsersMap((prev) => upsertUser(prev, message.user));
          return;
        }

        setUsersMap((prev) => removeUser(prev, message.userId));
      };

      socket.onerror = () => {
        setError("Unable to reach the websocket service.");
      };

      socket.onclose = (event) => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

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

  const requestChat = useCallback((targetId: string) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;

    socketRef.current.send(JSON.stringify({ type: "chat_request", targetId }));
    return true;
  }, []);

  // Derive stable array only when the map changes.
  const users = useMemo(() => Array.from(usersMap.values()), [usersMap]);

  const value = useMemo<OnlinePresenceContextValue>(
    () => ({
      users,
      userCount: usersMap.size,
      currentUserId: identity?.id ?? null,
      status,
      error,
      requestChat,
    }),
    [error, identity?.id, requestChat, status, users, usersMap.size],
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
