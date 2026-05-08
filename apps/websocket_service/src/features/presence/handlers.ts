import {
  ONLINE_USERS_TOPIC,
  SOCKET_REPLACED_CODE,
  SOCKET_REPLACED_REASON,
  userTopic,
} from "../../config";
import { logInfo, logWarn } from "../../logger";
import { chatStore } from "../../state/chat-store";
import { presenceStore } from "../../state/presence-store";
import type { RealtimeSocket } from "../../transport/socket";
import type {
  ChatRejectedEvent,
  OnlineUser,
  UserJoinedEvent,
  UserLeftEvent,
} from "../../types";
import {
  presenceUser,
  publishBusyStatus,
  publishPresenceSnapshot,
  sendPresenceSnapshot,
} from "./events";

export const handleSocketOpen = (socket: RealtimeSocket) => {
  const query = socket.data.query;
  const userId = query.userId?.trim() ?? "";
  const name = query.name?.trim() ?? "";

  if (!userId || !name) {
    logWarn("presence.connection_rejected", {
      reason: "missing_identity",
      hasUserId: Boolean(userId),
      hasName: Boolean(name),
    });
    socket.close(1008, "Missing userId or name");
    return;
  }

  const user: OnlineUser = { id: userId, name };
  presenceStore.setConnectionIdentity(socket.raw, user);

  const previousPresence = presenceStore.getUser(userId);
  const previousConnection = presenceStore.getActiveConnection(userId);
  const shouldPublishJoin =
    !previousPresence || previousPresence.name !== user.name;

  presenceStore.setUser(user);
  presenceStore.setActiveConnection(userId, {
    raw: socket.raw,
    close: socket.close.bind(socket),
  });

  logInfo(
    previousPresence ? "presence.connection_added" : "presence.user_joined",
    {
      userId,
      name,
      userCount: presenceStore.size(),
    },
  );

  if (previousConnection && previousConnection.raw !== socket.raw) {
    const channel = chatStore.getBusyChannel(userId);
    if (channel) {
      const releasedUsers = chatStore.releaseChannel(channel);
      const otherId = releasedUsers.find((id) => id !== userId);

      if (otherId) {
        const rejectedEvent: ChatRejectedEvent = {
          type: "chat_rejected",
          byId: userId,
        };
        socket.publish(userTopic(otherId), JSON.stringify(rejectedEvent));
      }

      publishBusyStatus(socket.publish.bind(socket), releasedUsers);
      publishPresenceSnapshot(socket.publish.bind(socket));
      logInfo("chat.ended_by_socket_replacement", {
        channel,
        replacedUserId: userId,
        otherId: otherId ?? null,
      });
    }

    previousConnection.close(SOCKET_REPLACED_CODE, SOCKET_REPLACED_REASON);
    logInfo("presence.connection_replaced", {
      userId,
    });
  }

  socket.subscribe(ONLINE_USERS_TOPIC);
  socket.subscribe(userTopic(userId));

  sendPresenceSnapshot(socket.send.bind(socket), { userId });

  if (shouldPublishJoin) {
    const joined: UserJoinedEvent = {
      type: "user_joined",
      user: presenceUser(user),
    };
    socket.publish(ONLINE_USERS_TOPIC, JSON.stringify(joined));
    logInfo("presence.user_joined_published", {
      userId,
      userCount: presenceStore.size(),
    });
  }
};

export const handleSocketClose = (socket: RealtimeSocket) => {
  const identity = presenceStore.getConnectionIdentity(socket.raw);
  presenceStore.deleteConnectionIdentity(socket.raw);
  if (!identity) {
    logWarn("presence.connection_closed_unknown");
    return;
  }

  const userId = identity.id;
  const activeConnection = presenceStore.getActiveConnection(userId);
  if (!activeConnection || activeConnection.raw !== socket.raw) {
    logInfo("presence.stale_connection_closed", {
      userId,
    });
    return;
  }

  const previousPresence = presenceStore.getUser(userId);
  if (!previousPresence) {
    logWarn("presence.connection_closed_missing_presence", {
      userId,
    });
    presenceStore.deleteActiveConnection(userId);
    return;
  }

  presenceStore.deleteActiveConnection(userId);

  const channel = chatStore.getBusyChannel(userId);
  let releasedUsers: readonly string[] = [];
  if (channel) {
    releasedUsers = chatStore.releaseChannel(channel);
    const otherId = releasedUsers.find((id) => id !== userId);

    if (otherId) {
      const rejectedEvent: ChatRejectedEvent = {
        type: "chat_rejected",
        byId: userId,
      };
      socket.publish(userTopic(otherId), JSON.stringify(rejectedEvent));
      logInfo("chat.ended_by_disconnect", {
        channel,
        disconnectedUserId: userId,
        otherId,
      });
    }
  }

  presenceStore.deleteUser(userId);
  publishBusyStatus(
    socket.publish.bind(socket),
    releasedUsers.filter((id) => id !== userId),
  );
  publishPresenceSnapshot(socket.publish.bind(socket));

  const left: UserLeftEvent = { type: "user_left", userId };
  socket.publish(ONLINE_USERS_TOPIC, JSON.stringify(left));
  logInfo("presence.user_left", {
    userId,
    userCount: presenceStore.size(),
  });
};
