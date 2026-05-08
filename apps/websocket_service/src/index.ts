import { Elysia } from "elysia";
import type {
  AcceptChatMessage,
  ChatInviteEvent,
  ChatMessageEvent,
  ChatMessagePayload,
  ChatReadyEvent,
  ChatRequestMessage,
  ClientMessage,
  OnlineUser,
  OnlineUsersSnapshotEvent,
  UserJoinedEvent,
  UserLeftEvent,
} from "./types";

interface OnlinePresence {
  user: OnlineUser;
  connectionCount: number;
}

const onlineUsers = new Map<string, OnlinePresence>();

// Capture identity once per WS connection instead of re-reading query on every event.
// WeakMap is used so entries are GC-ed automatically when the ws object is collected.
type WsContext = { server: { ws: (path: string, options: object) => unknown } };
const connectionIdentity = new Map<object, OnlineUser>();

const roomId = (a: string, b: string) => `room:${[a, b].sort().join(":")}`;

const onlineUsersSnapshot = () => Array.from(onlineUsers.values()).map((presence) => presence.user);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseClientMessage = (raw: unknown): ClientMessage | null => {
  const parsed = (() => {
    if (isRecord(raw)) return raw;
    if (typeof raw !== "string") return null;

    try {
      const data = JSON.parse(raw);
      return isRecord(data) ? data : null;
    } catch {
      return null;
    }
  })();

  if (!parsed || typeof parsed.type !== "string") return null;

  if (parsed.type === "chat_request") {
    if (typeof parsed.targetId !== "string" || parsed.targetId.length === 0) return null;
    const message: ChatRequestMessage = { type: "chat_request", targetId: parsed.targetId };
    return message;
  }

  if (parsed.type === "accept_chat") {
    if (typeof parsed.targetId !== "string" || parsed.targetId.length === 0) return null;
    const message: AcceptChatMessage = { type: "accept_chat", targetId: parsed.targetId };
    return message;
  }

  if (parsed.type === "chat_message") {
    if (typeof parsed.channel !== "string" || parsed.channel.length === 0) return null;
    if (typeof parsed.text !== "string") return null;

    const message: ChatMessagePayload = {
      type: "chat_message",
      channel: parsed.channel,
      text: parsed.text,
    };
    return message;
  }

  return null;
};

const app = new Elysia()
  .ws("/ws", {
    open(ws) {
      const query = ws.data.query as Record<string, string | undefined>;
      const userId = query.userId?.trim() ?? "";
      const name = query.name?.trim() ?? "";

      if (!userId || !name) {
        ws.close(1008, "Missing userId or name");
        return;
      }

      // Store identity once — avoids re-parsing query on every message/close.
      const user: OnlineUser = { id: userId, name };
      connectionIdentity.set(ws.raw, user);

      const previousPresence = onlineUsers.get(userId);
      const shouldPublishJoin = !previousPresence || previousPresence.user.name !== user.name;

      onlineUsers.set(userId, {
        user,
        connectionCount: (previousPresence?.connectionCount ?? 0) + 1,
      });
      ws.subscribe("online-users");
      ws.subscribe(`user:${userId}`);

      const snapshot: OnlineUsersSnapshotEvent = {
        type: "online_users_snapshot",
        users: onlineUsersSnapshot(),
      };
      ws.send(JSON.stringify(snapshot));

      if (shouldPublishJoin) {
        const joined: UserJoinedEvent = { type: "user_joined", user };
        ws.publish("online-users", JSON.stringify(joined));
      }
    },

    message(ws, rawMessage) {
      const identity = connectionIdentity.get(ws.raw);
      if (!identity) return;
      const userId = identity.id;
      const presence = onlineUsers.get(userId);
      if (!presence) return;

      const message = parseClientMessage(rawMessage);
      if (!message) return;

      if (message.type === "chat_request") {
        const channel = roomId(userId, message.targetId);
        ws.subscribe(channel);

        const inviteEvent: ChatInviteEvent = {
          type: "chat_invite",
          from: presence.user,
          channel,
        };
        ws.publish(`user:${message.targetId}`, JSON.stringify(inviteEvent));
        return;
      }

      if (message.type === "accept_chat") {
        const channel = roomId(userId, message.targetId);
        ws.subscribe(channel);

        const readyEvent: ChatReadyEvent = {
          type: "chat_ready",
          channel,
        };

        ws.send(JSON.stringify(readyEvent));
        ws.publish(channel, JSON.stringify(readyEvent));
        return;
      }

      const chatEvent: ChatMessageEvent = {
        type: "chat_message",
        channel: message.channel,
        fromId: userId,
        text: message.text,
      };
      ws.publish(message.channel, JSON.stringify(chatEvent));
    },

    close(ws) {
      const identity = connectionIdentity.get(ws.raw);
      connectionIdentity.delete(ws.raw);
      if (!identity) return;
      const userId = identity.id;

      const previousPresence = onlineUsers.get(userId);
      if (!previousPresence) return;

      if (previousPresence.connectionCount > 1) {
        onlineUsers.set(userId, {
          user: previousPresence.user,
          connectionCount: previousPresence.connectionCount - 1,
        });
        return;
      }

      onlineUsers.delete(userId);

      const left: UserLeftEvent = {
        type: "user_left",
        userId,
      };
      ws.publish("online-users", JSON.stringify(left));
    },
  })
  .listen(3001);

console.log(`WebSocket server running at ws://localhost:${app.server?.port}/ws`);
