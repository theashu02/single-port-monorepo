import { Elysia } from "elysia";
import type {
  AcceptChatMessage,
  ChatInviteEvent,
  ChatMessageEvent,
  ChatMessagePayload,
  ChatReadyEvent,
  ChatRejectedEvent,
  ChatRequestMessage,
  ClientMessage,
  OnlineUser,
  OnlinePresenceUser,
  OnlineUsersSnapshotEvent,
  RejectChatMessage,
  UserStatusChangedEvent,
  UserJoinedEvent,
  UserLeftEvent,
} from "./types";

interface OnlinePresence {
  user: OnlineUser;
  connectionCount: number;
}

const onlineUsers = new Map<string, OnlinePresence>();

// Capture identity once per WS connection instead of re-reading query on every event.
const connectionIdentity = new Map<object, OnlineUser>();

// Track who is busy. A user is busy if they are in a chat or have a pending invite.
// Map<userId, channelId>
const userBusyWith = new Map<string, string>();

// Track pending invite timers to avoid subscription leaks.
// Map<channelId, timeout handle>
const inviteTimers = new Map<string, ReturnType<typeof setTimeout>>();

// Room channels are opaque to clients. Keep participants server-side instead of
// parsing channel names, because user ids can contain ":".
const channelMembers = new Map<string, readonly [string, string]>();

const INVITE_TIMEOUT_MS = 15000;

const roomId = (a: string, b: string) =>
  `room:${[a, b].sort().map(encodeURIComponent).join("|")}`;

const presenceUser = (user: OnlineUser): OnlinePresenceUser => ({
  ...user,
  isBusy: userBusyWith.has(user.id),
});

const onlineUsersSnapshot = () =>
  Array.from(onlineUsers.values()).map((p) => presenceUser(p.user));

const publishBusyStatus = (
  publish: (topic: string, data: string) => unknown,
  userIds: Iterable<string>,
) => {
  const seen = new Set<string>();
  for (const userId of userIds) {
    if (seen.has(userId) || !onlineUsers.has(userId)) continue;
    seen.add(userId);

    const event: UserStatusChangedEvent = {
      type: "user_status_changed",
      userId,
      isBusy: userBusyWith.has(userId),
    };
    publish("online-users", JSON.stringify(event));
  }
};

const markChannelBusy = (channel: string, userA: string, userB: string) => {
  const members = [userA, userB] as const;
  channelMembers.set(channel, members);
  userBusyWith.set(userA, channel);
  userBusyWith.set(userB, channel);
  return members;
};

const releaseChannel = (channel: string): readonly string[] => {
  const members = channelMembers.get(channel);
  const timer = inviteTimers.get(channel);

  if (timer) {
    clearTimeout(timer);
    inviteTimers.delete(channel);
  }

  if (!members) return [];

  for (const userId of members) {
    if (userBusyWith.get(userId) === channel) {
      userBusyWith.delete(userId);
    }
  }

  channelMembers.delete(channel);
  return members;
};

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
    if (typeof parsed.targetId !== "string" || !parsed.targetId) return null;
    const msg: ChatRequestMessage = { type: "chat_request", targetId: parsed.targetId };
    return msg;
  }

  if (parsed.type === "accept_chat") {
    if (typeof parsed.targetId !== "string" || !parsed.targetId) return null;
    const msg: AcceptChatMessage = { type: "accept_chat", targetId: parsed.targetId };
    return msg;
  }

  if (parsed.type === "reject_chat") {
    if (typeof parsed.fromId !== "string" || !parsed.fromId) return null;
    const msg: RejectChatMessage = { type: "reject_chat", fromId: parsed.fromId };
    return msg;
  }

  if (parsed.type === "chat_message") {
    if (typeof parsed.channel !== "string" || !parsed.channel) return null;
    if (typeof parsed.text !== "string") return null;
    const msg: ChatMessagePayload = {
      type: "chat_message",
      channel: parsed.channel,
      text: parsed.text,
    };
    return msg;
  }

  if (parsed.type === "end_chat") {
    if (typeof parsed.channel !== "string" || !parsed.channel) return null;
    return {
      type: "end_chat",
      channel: parsed.channel,
    };
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
      const shouldPublishJoin =
        !previousPresence || previousPresence.user.name !== user.name;

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
        const joined: UserJoinedEvent = { type: "user_joined", user: presenceUser(user) };
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

      // ── chat_request ──────────────────────────────────────────────────────
      // Caller subscribes to the shared room channel, then sends an invite
      // event to the callee's personal channel. No extra state needed on the
      // server — the channel name is deterministic and derived from both ids.
      if (message.type === "chat_request") {
        const targetId = message.targetId;

        if (targetId === userId || !onlineUsers.has(targetId)) {
          const rejectedEvent: ChatRejectedEvent = {
            type: "chat_rejected",
            byId: targetId,
          };
          ws.send(JSON.stringify(rejectedEvent));
          return;
        }

        // If callee is already busy, notify caller immediately.
        if (userBusyWith.has(targetId)) {
          ws.send(JSON.stringify({ type: "chat_busy", byId: targetId }));
          return;
        }

        // If caller is already busy (e.g. they sent another request), ignore or notify.
        if (userBusyWith.has(userId)) {
          ws.send(JSON.stringify({ type: "chat_busy", byId: userId }));
          return;
        }

        const channel = roomId(userId, targetId);
        const busyUsers = markChannelBusy(channel, userId, targetId);
        publishBusyStatus(ws.publish.bind(ws), busyUsers);

        ws.subscribe(channel);

        const inviteEvent: ChatInviteEvent = {
          type: "chat_invite",
          from: presence.user,
          channel,
        };
        ws.publish(`user:${targetId}`, JSON.stringify(inviteEvent));

        // Start timeout — if callee doesn't respond, clean up.
        const timer = setTimeout(() => {
          const releasedUsers = releaseChannel(channel);
          
          const expiredEvent = { type: "chat_expired", byId: targetId };
          ws.send(JSON.stringify(expiredEvent));
          ws.unsubscribe(channel);
          publishBusyStatus(ws.publish.bind(ws), releasedUsers);
        }, INVITE_TIMEOUT_MS);

        inviteTimers.set(channel, timer);
        return;
      }

      // ── accept_chat ───────────────────────────────────────────────────────
      if (message.type === "accept_chat") {
        const targetId = message.targetId;
        const channel = roomId(userId, targetId);
        const members = channelMembers.get(channel);

        if (!members?.includes(userId) || !members.includes(targetId)) {
          return;
        }

        const timer = inviteTimers.get(channel);
        if (timer) {
          clearTimeout(timer);
          inviteTimers.delete(channel);
        }

        ws.subscribe(channel);

        const readyEvent: ChatReadyEvent = { type: "chat_ready", channel };
        ws.send(JSON.stringify(readyEvent));
        ws.publish(channel, JSON.stringify(readyEvent));
        return;
      }

      // ── reject_chat ───────────────────────────────────────────────────────
      if (message.type === "reject_chat") {
        const fromId = message.fromId;
        const channel = roomId(userId, fromId);

        if (userBusyWith.get(userId) !== channel) return;

        const releasedUsers = releaseChannel(channel);

        const rejectedEvent: ChatRejectedEvent = {
          type: "chat_rejected",
          byId: userId,
        };
        ws.publish(`user:${fromId}`, JSON.stringify(rejectedEvent));
        publishBusyStatus(ws.publish.bind(ws), releasedUsers);
        return;
      }

      if (message.type === "end_chat") {
        const channel = message.channel;
        if (userBusyWith.get(userId) !== channel) return;

        const releasedUsers = releaseChannel(channel);
        const otherId = releasedUsers.find((id) => id !== userId);

        if (otherId) {
          const rejectedEvent: ChatRejectedEvent = {
            type: "chat_rejected",
            byId: userId,
          };
          ws.publish(`user:${otherId}`, JSON.stringify(rejectedEvent));
        }

        publishBusyStatus(ws.publish.bind(ws), releasedUsers);
        return;
      }

      // ── chat_message ──────────────────────────────────────────────────────
      // Publish to the shared room channel. The sender is subscribed so they
      // also receive their own message, which lets the UI echo without a
      // separate local state append (single source of truth).
      if (userBusyWith.get(userId) !== message.channel) return;

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

      // Cleanup busy status and timers if the user was in an invite/chat.
      const channel = userBusyWith.get(userId);
      let releasedUsers: readonly string[] = [];
      if (channel) {
        releasedUsers = releaseChannel(channel);
        const otherId = releasedUsers.find((id) => id !== userId);

        if (otherId) {
          const rejectedEvent: ChatRejectedEvent = {
            type: "chat_rejected",
            byId: userId,
          };
          ws.publish(`user:${otherId}`, JSON.stringify(rejectedEvent));
        }
      }

      onlineUsers.delete(userId);
      publishBusyStatus(ws.publish.bind(ws), releasedUsers.filter((id) => id !== userId));

      const left: UserLeftEvent = { type: "user_left", userId };
      ws.publish("online-users", JSON.stringify(left));
    },
  })
  .listen(3001);

console.log(`WebSocket server running at ws://localhost:${app.server?.port}/ws`);
