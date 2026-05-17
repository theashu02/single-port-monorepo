import { ONLINE_USERS_TOPIC, PRESENCE_SAMPLE_SIZE } from "../../config";
import { logInfo, logWarn, type LogMeta } from "../../logger";
import { publishRealtime, realtimeStore } from "../../state/redis-realtime";
import type { PublishFn, SendFn } from "../../transport/socket";
import type {
  OnlinePresenceUser,
  OnlineUser,
  PresenceCountsEvent,
  OnlineUsersSnapshotEvent,
  UserJoinedEvent,
  UserStatusChangedEvent,
} from "../../types";

export const presenceUser = async (user: OnlineUser): Promise<OnlinePresenceUser> => ({
  ...user,
  isBusy: Boolean(await realtimeStore.getBusyChannel(user.id)),
});

export const onlineUsersSnapshot = async () =>
  realtimeStore.sample(PRESENCE_SAMPLE_SIZE);

export const publishPresenceCounts = async (publish: PublishFn) => {
  const totals = await realtimeStore.totals();
  const event: PresenceCountsEvent = {
    type: "presence_counts",
    online: totals.online,
    busy: totals.busy,
  };
  const data = JSON.stringify(event);
  publish(ONLINE_USERS_TOPIC, data);
  await publishRealtime(ONLINE_USERS_TOPIC, data);
  logInfo("presence.counts_published", {
    online: totals.online,
    busy: totals.busy,
  });
};

export const publishUserJoined = async (publish: PublishFn, user: OnlineUser) => {
  const event: UserJoinedEvent = {
    type: "user_joined",
    user: await presenceUser(user),
  };
  const data = JSON.stringify(event);
  publish(ONLINE_USERS_TOPIC, data);
  await publishRealtime(ONLINE_USERS_TOPIC, data);
  logInfo("presence.user_joined_published", {
    userId: user.id,
  });
};

export const publishPresenceSnapshot = async (publish: PublishFn) => {
  const sample = await onlineUsersSnapshot();
  const snapshot: OnlineUsersSnapshotEvent = {
    type: "online_users_snapshot",
    users: sample.users,
    totalOnline: sample.totals.online,
    totalBusy: sample.totals.busy,
    sampleSize: sample.sampleSize,
  };
  const data = JSON.stringify(snapshot);
  publish(ONLINE_USERS_TOPIC, data);
  await publishRealtime(ONLINE_USERS_TOPIC, data);
  logInfo("presence.snapshot_published", {
    snapshotUsers: snapshot.users.length,
    totalOnline: snapshot.totalOnline,
  });
};

export const sendPresenceSnapshot = async (send: SendFn, meta: LogMeta = {}) => {
  const sample = await onlineUsersSnapshot();
  const snapshot: OnlineUsersSnapshotEvent = {
    type: "online_users_snapshot",
    users: sample.users,
    totalOnline: sample.totals.online,
    totalBusy: sample.totals.busy,
    sampleSize: sample.sampleSize,
  };

  try {
    send(JSON.stringify(snapshot));
    logInfo("presence.snapshot_sent", {
      snapshotUsers: snapshot.users.length,
      totalOnline: snapshot.totalOnline,
      ...meta,
    });
  } catch (err) {
    logWarn("presence.snapshot_send_failed", {
      error: err instanceof Error ? err.message : "unknown",
      ...meta,
    });
  }
};

export const publishBusyStatus = async (
  publish: PublishFn,
  userIds: Iterable<string>,
) => {
  const seen = new Set<string>();
  await Promise.all(
    Array.from(userIds, async (userId) => {
      if (seen.has(userId) || !(await realtimeStore.hasUser(userId))) return;
      seen.add(userId);

      const event: UserStatusChangedEvent = {
        type: "user_status_changed",
        userId,
        isBusy: Boolean(await realtimeStore.getBusyChannel(userId)),
      };
      const data = JSON.stringify(event);
      publish(ONLINE_USERS_TOPIC, data);
      await publishRealtime(ONLINE_USERS_TOPIC, data);
      logInfo("presence.status_changed", {
        userId,
        isBusy: event.isBusy,
      });
    }),
  );
};
