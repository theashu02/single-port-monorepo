import {
  ONLINE_USERS_TOPIC,
  SOCKET_REPLACED_CODE,
  SOCKET_REPLACED_REASON,
  userTopic,
} from "../../config";
import { logInfo, logWarn } from "../../logger";
import { presenceStore } from "../../state/presence-store";
import { publishRealtime, realtimeStore } from "../../state/redis-realtime";
import type { RealtimeSocket } from "../../transport/socket";
import type {
  ChatRejectedEvent,
  OnlineUser,
  UserLeftEvent,
} from "../../types";
import {
  publishBusyStatus,
  publishPresenceCounts,
  publishUserJoined,
  sendPresenceSnapshot,
} from "./events";

const publishLocalAndRemote = async (
  socket: RealtimeSocket,
  topic: string,
  data: string,
) => {
  socket.publish(topic, data);
  await publishRealtime(topic, data);
};

export const handleSocketOpen = async (socket: RealtimeSocket) => {
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
  const connectionToken = crypto.randomUUID();
  presenceStore.setConnectionIdentity(socket.raw, user);
  presenceStore.setConnectionToken(socket.raw, connectionToken);

  const previousPresence = await realtimeStore.getUser(userId);
  const previousConnection = presenceStore.getActiveConnection(userId);
  const shouldPublishJoin =
    !previousPresence || previousPresence.name !== user.name;

  await realtimeStore.registerUser(user, connectionToken);
  presenceStore.setActiveConnection(userId, {
    raw: socket.raw,
    close: socket.close.bind(socket),
  });

  logInfo(
    previousPresence ? "presence.connection_added" : "presence.user_joined",
    {
      userId,
      name,
      userCount: (await realtimeStore.totals()).online,
    },
  );

  if (previousConnection && previousConnection.raw !== socket.raw) {
    const channel = await realtimeStore.getBusyChannel(userId);
    if (channel) {
      const releasedUsers = await realtimeStore.releaseChannel(channel);
      const otherId = releasedUsers.find((id) => id !== userId);

      if (otherId) {
        const rejectedEvent: ChatRejectedEvent = {
          type: "chat_rejected",
          byId: userId,
        };
        await publishLocalAndRemote(
          socket,
          userTopic(otherId),
          JSON.stringify(rejectedEvent),
        );
      }

      await publishBusyStatus(socket.publish.bind(socket), releasedUsers);
      await publishPresenceCounts(socket.publish.bind(socket));
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

  await sendPresenceSnapshot(socket.send.bind(socket), { userId });

  if (shouldPublishJoin) {
    await publishUserJoined(socket.publish.bind(socket), user);
  }
  await publishPresenceCounts(socket.publish.bind(socket));
};

export const handleSocketClose = async (socket: RealtimeSocket) => {
  const identity = presenceStore.getConnectionIdentity(socket.raw);
  presenceStore.deleteConnectionIdentity(socket.raw);
  const connectionToken = presenceStore.getConnectionToken(socket.raw);
  presenceStore.deleteConnectionToken(socket.raw);
  if (!identity) {
    logWarn("presence.connection_closed_unknown");
    return;
  }
  if (!connectionToken) {
    logWarn("presence.connection_closed_missing_token", {
      userId: identity.id,
    });
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

  if (!(await realtimeStore.ownsConnection(userId, connectionToken))) {
    presenceStore.deleteActiveConnection(userId);
    logInfo("presence.close_ignored_for_replaced_connection", { userId });
    return;
  }

  const previousPresence = await realtimeStore.getUser(userId);
  if (!previousPresence) {
    logWarn("presence.connection_closed_missing_presence", {
      userId,
    });
    presenceStore.deleteActiveConnection(userId);
    return;
  }

  presenceStore.deleteActiveConnection(userId);

  const channel = await realtimeStore.getBusyChannel(userId);
  let releasedUsers: readonly string[] = [];
  if (channel) {
    releasedUsers = await realtimeStore.releaseChannel(channel);
    const otherId = releasedUsers.find((id) => id !== userId);

    if (otherId) {
      const rejectedEvent: ChatRejectedEvent = {
        type: "chat_rejected",
        byId: userId,
      };
      await publishLocalAndRemote(
        socket,
        userTopic(otherId),
        JSON.stringify(rejectedEvent),
      );
      logInfo("chat.ended_by_disconnect", {
        channel,
        disconnectedUserId: userId,
        otherId,
      });
    }
  }

  const removedPresence = await realtimeStore.removeUser(userId, connectionToken);
  if (!removedPresence) {
    logInfo("presence.close_ignored_for_replaced_connection", { userId });
    return;
  }
  await publishBusyStatus(
    socket.publish.bind(socket),
    releasedUsers.filter((id) => id !== userId),
  );
  await publishPresenceCounts(socket.publish.bind(socket));

  const left: UserLeftEvent = { type: "user_left", userId };
  await publishLocalAndRemote(socket, ONLINE_USERS_TOPIC, JSON.stringify(left));
  logInfo("presence.user_left", {
    userId,
    userCount: (await realtimeStore.totals()).online,
  });
};
