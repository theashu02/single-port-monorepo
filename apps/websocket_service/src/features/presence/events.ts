import { ONLINE_USERS_TOPIC } from "../../config";
import { logInfo, logWarn, type LogMeta } from "../../logger";
import { chatStore } from "../../state/chat-store";
import { presenceStore } from "../../state/presence-store";
import type { PublishFn, SendFn } from "../../transport/socket";
import type {
  OnlinePresenceUser,
  OnlineUser,
  OnlineUsersSnapshotEvent,
  UserStatusChangedEvent,
} from "../../types";

export const presenceUser = (user: OnlineUser): OnlinePresenceUser => ({
  ...user,
  isBusy: chatStore.hasBusyUser(user.id),
});

export const onlineUsersSnapshot = () =>
  presenceStore.users().map((user) => presenceUser(user));

export const publishPresenceSnapshot = (publish: PublishFn) => {
  const snapshot: OnlineUsersSnapshotEvent = {
    type: "online_users_snapshot",
    users: onlineUsersSnapshot(),
  };
  publish(ONLINE_USERS_TOPIC, JSON.stringify(snapshot));
  logInfo("presence.snapshot_published", {
    snapshotUsers: snapshot.users.length,
  });
};

export const sendPresenceSnapshot = (send: SendFn, meta: LogMeta = {}) => {
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

export const publishBusyStatus = (
  publish: PublishFn,
  userIds: Iterable<string>,
) => {
  const seen = new Set<string>();
  for (const userId of userIds) {
    if (seen.has(userId) || !presenceStore.hasUser(userId)) continue;
    seen.add(userId);

    const event: UserStatusChangedEvent = {
      type: "user_status_changed",
      userId,
      isBusy: chatStore.hasBusyUser(userId),
    };
    publish(ONLINE_USERS_TOPIC, JSON.stringify(event));
    logInfo("presence.status_changed", {
      userId,
      isBusy: event.isBusy,
    });
  }
};
