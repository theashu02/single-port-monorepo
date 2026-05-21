import { INVITE_TIMEOUT_MS, userTopic } from "../../config";
import { logInfo, logWarn } from "../../logger";
import {
  parseClientMessage,
  rawMessageKind,
} from "../../messages/client-message";
import { chatStore, roomId } from "../../state/chat-store";
import { presenceStore } from "../../state/presence-store";
import { publishRealtime, realtimeStore } from "../../state/redis-realtime";
import type { RealtimeSocket } from "../../transport/socket";
import type {
  ChatInviteEvent,
  ChatMessageEvent,
  ChatReadyEvent,
  ChatRejectedEvent,
  ChatTypingEvent,
} from "../../types";
import {
  publishBusyStatus,
  sendPresenceSnapshot,
} from "../presence/events";

const publishLocalAndRemote = async (
  socket: RealtimeSocket,
  topic: string,
  data: string,
) => {
  socket.publish(topic, data);
  await publishRealtime(topic, data);
};

export const handleSocketMessage = async (
  socket: RealtimeSocket,
  rawMessage: unknown,
) => {
  const identity = presenceStore.getConnectionIdentity(socket.raw);
  if (!identity) {
    logWarn("message.rejected", {
      reason: "missing_connection_identity",
      messageType: rawMessageKind(rawMessage),
    });
    return;
  }

  const userId = identity.id;
  const connectionToken = presenceStore.getConnectionToken(socket.raw);
  if (
    !connectionToken ||
    !(await realtimeStore.ownsConnection(userId, connectionToken))
  ) {
    logWarn("message.rejected", {
      reason: "replaced_connection",
      userId,
      messageType: rawMessageKind(rawMessage),
    });
    return;
  }

  const presence = await realtimeStore.getUser(userId);
  if (!presence) {
    logWarn("message.rejected", {
      reason: "missing_presence",
      userId,
      messageType: rawMessageKind(rawMessage),
    });
    return;
  }

  const activeConnection = presenceStore.getActiveConnection(userId);
  if (!activeConnection || activeConnection.raw !== socket.raw) {
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

  if (message.type === "chat_request") {
    const targetId = message.targetId;
    logInfo("chat.request_received", {
      fromId: userId,
      targetId,
    });

    if (targetId === userId || !(await realtimeStore.hasUser(targetId))) {
      logWarn("chat.request_rejected", {
        reason: targetId === userId ? "self_request" : "target_offline",
        fromId: userId,
        targetId,
      });
      const rejectedEvent: ChatRejectedEvent = {
        type: "chat_rejected",
        byId: targetId,
      };
      socket.send(JSON.stringify(rejectedEvent));
      return;
    }

    if (await realtimeStore.getBusyChannel(targetId)) {
      logInfo("chat.request_busy", {
        reason: "target_busy",
        fromId: userId,
        targetId,
      });
      socket.send(JSON.stringify({ type: "chat_busy", byId: targetId }));
      return;
    }

    if (await realtimeStore.getBusyChannel(userId)) {
      logInfo("chat.request_busy", {
        reason: "caller_busy",
        fromId: userId,
        targetId,
      });
      socket.send(JSON.stringify({ type: "chat_busy", byId: userId }));
      return;
    }

    const channel = roomId(userId, targetId);
    const busyUsers = await realtimeStore.markChannelBusy(channel, userId, targetId);
    if (!busyUsers) {
      socket.send(JSON.stringify({ type: "chat_busy", byId: targetId }));
      return;
    }
    logInfo("chat.invite_created", {
      channel,
      fromId: userId,
      targetId,
    });
    await publishBusyStatus(socket.publish.bind(socket), busyUsers);
    await sendPresenceSnapshot(socket.send.bind(socket), {
      userId,
      reason: "chat_request",
    });

    socket.subscribe(channel);

    const inviteEvent: ChatInviteEvent = {
      type: "chat_invite",
      from: presence,
      channel,
    };
    await publishLocalAndRemote(
      socket,
      userTopic(targetId),
      JSON.stringify(inviteEvent),
    );
    logInfo("chat.invite_sent", {
      channel,
      fromId: userId,
      targetId,
      timeoutMs: INVITE_TIMEOUT_MS,
    });

    const timer = setTimeout(() => {
      void (async () => {
        if (!(await realtimeStore.isPendingChannel(channel))) return;
        const releasedUsers = await realtimeStore.releaseChannel(channel);
        logInfo("chat.invite_expired", {
          channel,
          fromId: userId,
          targetId,
        });

        const expiredEvent = { type: "chat_expired", byId: targetId };
        socket.send(JSON.stringify(expiredEvent));
        socket.unsubscribe(channel);
        await publishBusyStatus(socket.publish.bind(socket), releasedUsers);
        await sendPresenceSnapshot(socket.send.bind(socket), {
          userId,
          reason: "invite_expired",
        });
      })();
    }, INVITE_TIMEOUT_MS);

    chatStore.setInviteTimer(channel, timer);
    return;
  }

  if (message.type === "accept_chat") {
    const targetId = message.targetId;
    const channel = roomId(userId, targetId);
    const members = await realtimeStore.getChannelMembers(channel);
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

    chatStore.clearInviteTimer(channel);
    await realtimeStore.openChannel(channel);
    socket.subscribe(channel);

    const readyEvent: ChatReadyEvent = { type: "chat_ready", channel };
    socket.send(JSON.stringify(readyEvent));
    await publishLocalAndRemote(socket, channel, JSON.stringify(readyEvent));
    logInfo("chat.ready_published", {
      channel,
      acceptedById: userId,
      targetId,
    });
    return;
  }

  if (message.type === "reject_chat") {
    const fromId = message.fromId;
    const channel = roomId(userId, fromId);
    logInfo("chat.reject_received", {
      channel,
      fromId,
      rejectedById: userId,
    });

    if ((await realtimeStore.getBusyChannel(userId)) !== channel) {
      logWarn("chat.reject_ignored", {
        reason: "user_not_in_channel",
        channel,
        fromId,
        rejectedById: userId,
      });
      return;
    }

    const releasedUsers = await realtimeStore.releaseChannel(channel);

    const rejectedEvent: ChatRejectedEvent = {
      type: "chat_rejected",
      byId: userId,
    };
    await publishLocalAndRemote(
      socket,
      userTopic(fromId),
      JSON.stringify(rejectedEvent),
    );
    await publishBusyStatus(socket.publish.bind(socket), releasedUsers);
    await sendPresenceSnapshot(socket.send.bind(socket), {
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

    if ((await realtimeStore.getBusyChannel(userId)) !== channel) {
      logWarn("chat.end_ignored", {
        reason: "user_not_in_channel",
        channel,
        endedById: userId,
      });
      return;
    }

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
    await sendPresenceSnapshot(socket.send.bind(socket), {
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

  if (message.type === "chat_typing") {
    if ((await realtimeStore.getBusyChannel(userId)) !== message.channel) {
      return;
    }

    const typingEvent: ChatTypingEvent = {
      type: "chat_typing",
      channel: message.channel,
      fromId: userId,
      isTyping: message.isTyping,
    };
    await publishLocalAndRemote(
      socket,
      message.channel,
      JSON.stringify(typingEvent),
    );
    return;
  }

  if ((await realtimeStore.getBusyChannel(userId)) !== message.channel) {
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
  await publishLocalAndRemote(
    socket,
    message.channel,
    JSON.stringify(chatEvent),
  );
  logInfo("chat.message_published", {
    channel: message.channel,
    fromId: userId,
    textLength: message.text.length,
  });
};
