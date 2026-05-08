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

const SOCKET_REPLACED_CODE = 4000;

interface ActiveConnection {
  raw: object;
  close: (code?: number, reason?: string) => unknown;
}

const onlineUsers = new Map<string, OnlineUser>();

// Capture identity once per WS connection instead of re-reading query on every event.
const connectionIdentity = new Map<object, OnlineUser>();

// Enforce one websocket per user. A replacement socket wins; stale sockets are
// ignored in close handlers so they cannot clean up the active user's state.
const activeConnections = new Map<string, ActiveConnection>();

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

type LogMeta = Record<string, string | number | boolean | null | undefined>;

const baseLogMeta = () => ({
  onlineUsers: onlineUsers.size,
  busyUsers: userBusyWith.size,
  pendingInvites: inviteTimers.size,
  activeChannels: channelMembers.size,
});

const logInfo = (event: string, meta: LogMeta = {}) => {
  console.info(
    `[websocket_service] ${JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ...baseLogMeta(),
      ...meta,
    })}`,
  );
};

const logWarn = (event: string, meta: LogMeta = {}) => {
  console.warn(
    `[websocket_service] ${JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ...baseLogMeta(),
      ...meta,
    })}`,
  );
};

const roomId = (a: string, b: string) =>
  `room:${[a, b].sort().map(encodeURIComponent).join("|")}`;

const presenceUser = (user: OnlineUser): OnlinePresenceUser => ({
  ...user,
  isBusy: userBusyWith.has(user.id),
});

const onlineUsersSnapshot = () =>
  Array.from(onlineUsers.values()).map((user) => presenceUser(user));

const publishPresenceSnapshot = (
  publish: (topic: string, data: string) => unknown,
) => {
  const snapshot: OnlineUsersSnapshotEvent = {
    type: "online_users_snapshot",
    users: onlineUsersSnapshot(),
  };
  publish("online-users", JSON.stringify(snapshot));
  logInfo("presence.snapshot_published", {
    snapshotUsers: snapshot.users.length,
  });
};

const sendPresenceSnapshot = (
  send: (data: string) => unknown,
  meta: LogMeta = {},
) => {
  const snapshot: OnlineUsersSnapshotEvent = {
    type: "online_users_snapshot",
    users: onlineUsersSnapshot(),
  };

  try {
    send(JSON.stringify(snapshot));
    logInfo("presence.snapshot_sent", {
      snapshotUsers: snapshot.users.length,
      ...meta,
    });
  } catch (err) {
    logWarn("presence.snapshot_send_failed", {
      error: err instanceof Error ? err.message : "unknown",
      ...meta,
    });
  }
};

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
    logInfo("presence.status_changed", {
      userId,
      isBusy: event.isBusy,
    });
  }
};

const markChannelBusy = (channel: string, userA: string, userB: string) => {
  const members = [userA, userB] as const;
  channelMembers.set(channel, members);
  userBusyWith.set(userA, channel);
  userBusyWith.set(userB, channel);
  return members;
};

const usersInChannel = (channel: string): string[] => {
  const members = channelMembers.get(channel);
  if (members) return [...members];

  // Recovery path: if channelMembers was lost for any reason, derive members
  // from the busy map so we do not leave stale busy state behind.
  const inferred: string[] = [];
  for (const [userId, busyChannel] of userBusyWith) {
    if (busyChannel === channel) inferred.push(userId);
  }
  return inferred;
};

const releaseChannel = (channel: string): readonly string[] => {
  const members = usersInChannel(channel);
  const timer = inviteTimers.get(channel);

  if (timer) {
    clearTimeout(timer);
    inviteTimers.delete(channel);
  }

  if (members.length === 0) {
    channelMembers.delete(channel);
    return [];
  }

  for (const userId of members) {
    if (userBusyWith.get(userId) === channel) {
      userBusyWith.delete(userId);
    }
  }

  // Defensive sweep: ensure no stale references remain for this channel.
  for (const [userId, busyChannel] of userBusyWith) {
    if (busyChannel === channel) {
      userBusyWith.delete(userId);
    }
  }

  channelMembers.delete(channel);
  return Array.from(new Set(members));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const rawMessageKind = (raw: unknown): string => {
  if (isRecord(raw) && typeof raw.type === "string") return raw.type;
  if (typeof raw !== "string") return typeof raw;

  try {
    const parsed = JSON.parse(raw);
    return isRecord(parsed) && typeof parsed.type === "string"
      ? parsed.type
      : "string";
  } catch {
    return "string";
  }
};

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
    const msg: ChatRequestMessage = {
      type: "chat_request",
      targetId: parsed.targetId,
    };
    return msg;
  }

  if (parsed.type === "accept_chat") {
    if (typeof parsed.targetId !== "string" || !parsed.targetId) return null;
    const msg: AcceptChatMessage = {
      type: "accept_chat",
      targetId: parsed.targetId,
    };
    return msg;
  }

  if (parsed.type === "reject_chat") {
    if (typeof parsed.fromId !== "string" || !parsed.fromId) return null;
    const msg: RejectChatMessage = {
      type: "reject_chat",
      fromId: parsed.fromId,
    };
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
        logWarn("presence.connection_rejected", {
          reason: "missing_identity",
          hasUserId: Boolean(userId),
          hasName: Boolean(name),
        });
        ws.close(1008, "Missing userId or name");
        return;
      }

      // Store identity once — avoids re-parsing query on every message/close.
      const user: OnlineUser = { id: userId, name };
      connectionIdentity.set(ws.raw, user);

      const previousPresence = onlineUsers.get(userId);
      const previousConnection = activeConnections.get(userId);
      const shouldPublishJoin =
        !previousPresence || previousPresence.name !== user.name;

      onlineUsers.set(userId, user);
      activeConnections.set(userId, {
        raw: ws.raw,
        close: ws.close.bind(ws),
      });

      logInfo(
        previousPresence ? "presence.connection_added" : "presence.user_joined",
        {
          userId,
          name,
          userCount: onlineUsers.size,
        },
      );

      if (previousConnection && previousConnection.raw !== ws.raw) {
        const channel = userBusyWith.get(userId);
        if (channel) {
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
          publishPresenceSnapshot(ws.publish.bind(ws));
          logInfo("chat.ended_by_socket_replacement", {
            channel,
            replacedUserId: userId,
            otherId: otherId ?? null,
          });
        }

        previousConnection.close(
          SOCKET_REPLACED_CODE,
          "Another websocket connection opened for this user",
        );
        logInfo("presence.connection_replaced", {
          userId,
        });
      }

      ws.subscribe("online-users");
      ws.subscribe(`user:${userId}`);

      const snapshot: OnlineUsersSnapshotEvent = {
        type: "online_users_snapshot",
        users: onlineUsersSnapshot(),
      };
      ws.send(JSON.stringify(snapshot));
      logInfo("presence.snapshot_sent", {
        userId,
        snapshotUsers: snapshot.users.length,
      });

      if (shouldPublishJoin) {
        const joined: UserJoinedEvent = {
          type: "user_joined",
          user: presenceUser(user),
        };
        ws.publish("online-users", JSON.stringify(joined));
        logInfo("presence.user_joined_published", {
          userId,
          userCount: onlineUsers.size,
        });
      }
    },

    message(ws, rawMessage) {
      const identity = connectionIdentity.get(ws.raw);
      if (!identity) {
        logWarn("message.rejected", {
          reason: "missing_connection_identity",
          messageType: rawMessageKind(rawMessage),
        });
        return;
      }
      const userId = identity.id;
      const presence = onlineUsers.get(userId);
      if (!presence) {
        logWarn("message.rejected", {
          reason: "missing_presence",
          userId,
          messageType: rawMessageKind(rawMessage),
        });
        return;
      }

      const activeConnection = activeConnections.get(userId);
      if (!activeConnection || activeConnection.raw !== ws.raw) {
        logWarn("message.rejected", {
          reason: "stale_connection",
          userId,
          messageType: rawMessageKind(rawMessage),
        });
        return;
      }

      const message = parseClientMessage(rawMessage);
      if (!message) {
        logWarn("message.invalid", {
          userId,
          messageType: rawMessageKind(rawMessage),
        });
        return;
      }

      // ── chat_request ──────────────────────────────────────────────────────
      // Caller subscribes to the shared room channel, then sends an invite
      // event to the callee's personal channel. No extra state needed on the
      // server — the channel name is deterministic and derived from both ids.
      if (message.type === "chat_request") {
        const targetId = message.targetId;
        logInfo("chat.request_received", {
          fromId: userId,
          targetId,
        });

        if (targetId === userId || !onlineUsers.has(targetId)) {
          logWarn("chat.request_rejected", {
            reason: targetId === userId ? "self_request" : "target_offline",
            fromId: userId,
            targetId,
          });
          const rejectedEvent: ChatRejectedEvent = {
            type: "chat_rejected",
            byId: targetId,
          };
          ws.send(JSON.stringify(rejectedEvent));
          return;
        }

        // If callee is already busy, notify caller immediately.
        if (userBusyWith.has(targetId)) {
          logInfo("chat.request_busy", {
            reason: "target_busy",
            fromId: userId,
            targetId,
          });
          ws.send(JSON.stringify({ type: "chat_busy", byId: targetId }));
          return;
        }

        // If caller is already busy (e.g. they sent another request), ignore or notify.
        if (userBusyWith.has(userId)) {
          logInfo("chat.request_busy", {
            reason: "caller_busy",
            fromId: userId,
            targetId,
          });
          ws.send(JSON.stringify({ type: "chat_busy", byId: userId }));
          return;
        }

        const channel = roomId(userId, targetId);
        const busyUsers = markChannelBusy(channel, userId, targetId);
        logInfo("chat.invite_created", {
          channel,
          fromId: userId,
          targetId,
        });
        publishBusyStatus(ws.publish.bind(ws), busyUsers);
        publishPresenceSnapshot(ws.publish.bind(ws));
        sendPresenceSnapshot(ws.send.bind(ws), {
          userId,
          reason: "chat_request",
        });

        ws.subscribe(channel);

        const inviteEvent: ChatInviteEvent = {
          type: "chat_invite",
          from: presence,
          channel,
        };
        ws.publish(`user:${targetId}`, JSON.stringify(inviteEvent));
        logInfo("chat.invite_sent", {
          channel,
          fromId: userId,
          targetId,
          timeoutMs: INVITE_TIMEOUT_MS,
        });

        // Start timeout — if callee doesn't respond, clean up.
        const timer = setTimeout(() => {
          const releasedUsers = releaseChannel(channel);
          logInfo("chat.invite_expired", {
            channel,
            fromId: userId,
            targetId,
          });

          const expiredEvent = { type: "chat_expired", byId: targetId };
          ws.send(JSON.stringify(expiredEvent));
          ws.unsubscribe(channel);
          publishBusyStatus(ws.publish.bind(ws), releasedUsers);
          publishPresenceSnapshot(ws.publish.bind(ws));
          sendPresenceSnapshot(ws.send.bind(ws), {
            userId,
            reason: "invite_expired",
          });
        }, INVITE_TIMEOUT_MS);

        inviteTimers.set(channel, timer);
        return;
      }

      // ── accept_chat ───────────────────────────────────────────────────────
      if (message.type === "accept_chat") {
        const targetId = message.targetId;
        const channel = roomId(userId, targetId);
        const members = channelMembers.get(channel);
        logInfo("chat.accept_received", {
          channel,
          fromId: userId,
          targetId,
        });

        if (!members?.includes(userId) || !members.includes(targetId)) {
          logWarn("chat.accept_rejected", {
            reason: "channel_membership_mismatch",
            channel,
            fromId: userId,
            targetId,
          });
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
        logInfo("chat.ready_published", {
          channel,
          acceptedById: userId,
          targetId,
        });
        return;
      }

      // ── reject_chat ───────────────────────────────────────────────────────
      if (message.type === "reject_chat") {
        const fromId = message.fromId;
        const channel = roomId(userId, fromId);
        logInfo("chat.reject_received", {
          channel,
          fromId,
          rejectedById: userId,
        });

        if (userBusyWith.get(userId) !== channel) {
          logWarn("chat.reject_ignored", {
            reason: "user_not_in_channel",
            channel,
            fromId,
            rejectedById: userId,
          });
          return;
        }

        const releasedUsers = releaseChannel(channel);

        const rejectedEvent: ChatRejectedEvent = {
          type: "chat_rejected",
          byId: userId,
        };
        ws.publish(`user:${fromId}`, JSON.stringify(rejectedEvent));
        publishBusyStatus(ws.publish.bind(ws), releasedUsers);
        publishPresenceSnapshot(ws.publish.bind(ws));
        sendPresenceSnapshot(ws.send.bind(ws), {
          userId,
          reason: "chat_rejected",
        });
        logInfo("chat.rejected_published", {
          channel,
          fromId,
          rejectedById: userId,
        });
        return;
      }

      if (message.type === "end_chat") {
        const channel = message.channel;
        logInfo("chat.end_received", {
          channel,
          endedById: userId,
        });

        if (userBusyWith.get(userId) !== channel) {
          logWarn("chat.end_ignored", {
            reason: "user_not_in_channel",
            channel,
            endedById: userId,
          });
          return;
        }

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
        publishPresenceSnapshot(ws.publish.bind(ws));
        sendPresenceSnapshot(ws.send.bind(ws), {
          userId,
          reason: "chat_ended",
        });
        logInfo("chat.ended", {
          channel,
          endedById: userId,
          otherId: otherId ?? null,
        });
        return;
      }

      // ── chat_message ──────────────────────────────────────────────────────
      // Publish to the shared room channel. The sender is subscribed so they
      // also receive their own message, which lets the UI echo without a
      // separate local state append (single source of truth).
      if (userBusyWith.get(userId) !== message.channel) {
        logWarn("chat.message_ignored", {
          reason: "user_not_in_channel",
          channel: message.channel,
          fromId: userId,
        });
        return;
      }

      const chatEvent: ChatMessageEvent = {
        type: "chat_message",
        channel: message.channel,
        fromId: userId,
        text: message.text,
      };
      ws.publish(message.channel, JSON.stringify(chatEvent));
      logInfo("chat.message_published", {
        channel: message.channel,
        fromId: userId,
        textLength: message.text.length,
      });
    },

    close(ws) {
      const identity = connectionIdentity.get(ws.raw);
      connectionIdentity.delete(ws.raw);
      if (!identity) {
        logWarn("presence.connection_closed_unknown");
        return;
      }
      const userId = identity.id;

      const activeConnection = activeConnections.get(userId);
      if (!activeConnection || activeConnection.raw !== ws.raw) {
        logInfo("presence.stale_connection_closed", {
          userId,
        });
        return;
      }

      const previousPresence = onlineUsers.get(userId);
      if (!previousPresence) {
        logWarn("presence.connection_closed_missing_presence", {
          userId,
        });
        activeConnections.delete(userId);
        return;
      }

      activeConnections.delete(userId);

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
          logInfo("chat.ended_by_disconnect", {
            channel,
            disconnectedUserId: userId,
            otherId,
          });
        }
      }

      onlineUsers.delete(userId);
      publishBusyStatus(
        ws.publish.bind(ws),
        releasedUsers.filter((id) => id !== userId),
      );
      publishPresenceSnapshot(ws.publish.bind(ws));

      const left: UserLeftEvent = { type: "user_left", userId };
      ws.publish("online-users", JSON.stringify(left));
      logInfo("presence.user_left", {
        userId,
        userCount: onlineUsers.size,
      });
    },
  })
  .listen(3001);

logInfo("service.started", {
  port: app.server?.port ?? null,
  path: "/ws",
});
