import { REDIS_BUS_TOPIC, REDIS_URL } from "../config";
import { logInfo, logWarn } from "../logger";
import type { OnlinePresenceUser, OnlineUser } from "../types";

const USERS_KEY = "presence:users";
const ONLINE_KEY = "presence:online";
const BUSY_KEY = "presence:busy";
const CHANNELS_KEY = "presence:channels";
const CONNECTION_PREFIX = "presence:connection:";
const CHANNEL_STATE_PREFIX = "presence:channel-state:";
const MATCHMAKING_QUEUE_KEY = "matchmaking:queue";
const MATCHMAKING_WAITING_KEY = "matchmaking:waiting";
const MATCHMAKING_LOCK_KEY = "matchmaking:poller-lock";

export const instanceId = crypto.randomUUID();

const redis = new Bun.RedisClient(REDIS_URL);
const subscriber = new Bun.RedisClient(REDIS_URL);

export interface PresenceTotals {
  online: number;
  busy: number;
}

export interface PresenceSample {
  users: OnlinePresenceUser[];
  totals: PresenceTotals;
  sampleSize: number;
}

interface BusMessage {
  source: string;
  topic: string;
  data: string;
}

const parseUser = (value: string | null): OnlineUser | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<OnlineUser>;
    if (typeof parsed.id !== "string" || typeof parsed.name !== "string") {
      return null;
    }
    const id = parsed.id.trim();
    const name = parsed.name.trim();
    return id && name ? { id, name } : null;
  } catch {
    return null;
  }
};

/** Remove all presence keys so stale data from crashed/restarted instances is cleared. */
const flushPresence = async () => {
  const keysToDelete: string[] = [
    USERS_KEY, ONLINE_KEY, BUSY_KEY, CHANNELS_KEY,
    MATCHMAKING_QUEUE_KEY, MATCHMAKING_WAITING_KEY, MATCHMAKING_LOCK_KEY,
  ];

  // Collect per-user connection keys
  const userIds = await redis.hkeys(USERS_KEY);
  for (const userId of userIds) {
    keysToDelete.push(`${CONNECTION_PREFIX}${userId}`);
  }

  // Collect per-channel state keys
  const channelIds = await redis.hkeys(CHANNELS_KEY);
  for (const ch of channelIds) {
    keysToDelete.push(`${CHANNEL_STATE_PREFIX}${ch}`);
  }

  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
  }

  logInfo("redis.presence_flushed", { deletedKeys: keysToDelete.length });
};

export const connectRealtimeStore = async () => {
  await redis.connect();
  await flushPresence();
  logInfo("redis.connected", { url: REDIS_URL });
};

export const closeRealtimeStore = () => {
  redis.close();
  subscriber.close();
};

export const subscribeRealtimeBus = async (
  localPublish: (topic: string, data: string) => unknown,
) => {
  await subscriber.connect();
  await subscriber.subscribe(REDIS_BUS_TOPIC, (message) => {
    let parsed: BusMessage | null = null;
    try {
      parsed = JSON.parse(message) as BusMessage;
    } catch {
      logWarn("redis.bus_message_invalid");
      return;
    }

    if (
      !parsed ||
      parsed.source === instanceId ||
      typeof parsed.topic !== "string" ||
      typeof parsed.data !== "string"
    ) {
      return;
    }

    localPublish(parsed.topic, parsed.data);
  });
  logInfo("redis.bus_subscribed", { topic: REDIS_BUS_TOPIC, instanceId });
};

export const publishRealtime = async (topic: string, data: string) => {
  await redis.publish(
    REDIS_BUS_TOPIC,
    JSON.stringify({ source: instanceId, topic, data } satisfies BusMessage),
  );
};

let cachedSample: PresenceSample | null = null;
let lastSampleTime = 0;
const SAMPLE_CACHE_TTL_MS = 3000; // Cache for 3 seconds

export const realtimeStore = {
  registerUser: async (user: OnlineUser, connectionToken: string) => {
    const [existed] = await Promise.all([
      redis.hexists(USERS_KEY, user.id),
      redis.hset(USERS_KEY, user.id, JSON.stringify(user)),
      redis.zadd(ONLINE_KEY, Date.now(), user.id),
      redis.set(`${CONNECTION_PREFIX}${user.id}`, connectionToken, "EX", 86400)
    ]);
    return existed;
  },

  ownsConnection: async (userId: string, connectionToken: string) =>
    (await redis.get(`${CONNECTION_PREFIX}${userId}`)) === connectionToken,

  removeUser: async (userId: string, connectionToken: string) => {
    if (!(await realtimeStore.ownsConnection(userId, connectionToken))) {
      return false;
    }
    await Promise.all([
      redis.hdel(USERS_KEY, userId),
      redis.zrem(ONLINE_KEY, userId),
      redis.hdel(BUSY_KEY, userId),
      redis.del(`${CONNECTION_PREFIX}${userId}`)
    ]);
    return true;
  },

  hasUser: async (userId: string) => redis.hexists(USERS_KEY, userId),

  getUser: async (userId: string) => parseUser(await redis.hget(USERS_KEY, userId)),

  totals: async (): Promise<PresenceTotals> => {
    const [online, busy] = await Promise.all([
      redis.zcard(ONLINE_KEY),
      redis.hlen(BUSY_KEY),
    ]);
    return { online, busy };
  },

  sample: async (limit: number): Promise<PresenceSample> => {
    const now = Date.now();
    // Return cached sample if within TTL
    if (cachedSample && (now - lastSampleTime < SAMPLE_CACHE_TTL_MS)) {
      return cachedSample;
    }

    const sampleSize = Math.max(1, Math.min(limit, 500));
    const ids = await redis.zrevrange(ONLINE_KEY, 0, sampleSize - 1);
    const [values, busyValues] = ids.length > 0
      ? await Promise.all([
          redis.hmget(USERS_KEY, ids),
          redis.hmget(BUSY_KEY, ids),
        ])
      : [[], []];
    const users = values.flatMap((value, index) => {
      const user = parseUser(value);
      return user ? [{ ...user, isBusy: Boolean(busyValues[index]) }] : [];
    });

    const newSample = {
      users,
      totals: await realtimeStore.totals(),
      sampleSize,
    };

    // Update cache
    cachedSample = newSample;
    lastSampleTime = now;
    return newSample;
  },

  getBusyChannel: async (userId: string) => redis.hget(BUSY_KEY, userId),

  markChannelBusy: async (channel: string, userA: string, userB: string) => {
    const [userABusy, userBBusy] = await Promise.all([
      redis.hexists(BUSY_KEY, userA),
      redis.hexists(BUSY_KEY, userB),
    ]);
    if (userABusy || userBBusy) return null;

    await Promise.all([
      redis.hset(BUSY_KEY, {
        [userA]: channel,
        [userB]: channel,
      }),
      redis.hset(CHANNELS_KEY, channel, JSON.stringify([userA, userB])),
      redis.set(`${CHANNEL_STATE_PREFIX}${channel}`, "pending", "EX", 60),
    ]);
    return [userA, userB] as const;
  },

  getChannelMembers: async (channel: string) => {
    const value = await redis.hget(CHANNELS_KEY, channel);
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) &&
        typeof parsed[0] === "string" &&
        typeof parsed[1] === "string"
        ? ([parsed[0], parsed[1]] as const)
        : null;
    } catch {
      return null;
    }
  },

  openChannel: async (channel: string) => {
    await redis.set(`${CHANNEL_STATE_PREFIX}${channel}`, "open", "EX", 86400);
  },

  isPendingChannel: async (channel: string) =>
    (await redis.get(`${CHANNEL_STATE_PREFIX}${channel}`)) === "pending",

  releaseChannel: async (channel: string) => {
    const members = await realtimeStore.getChannelMembers(channel);
    await Promise.all([
      redis.hdel(CHANNELS_KEY, channel),
      redis.del(`${CHANNEL_STATE_PREFIX}${channel}`),
    ]);
    if (!members) return [];

    await redis.hdel(BUSY_KEY, ...members);
    return [...members];
  },

  // ── Matchmaking ───────────────────────────────────────────────────────────

  matchmakeJoin: async (userId: string) => {
    const timestamp = Date.now().toString();
    await Promise.all([
      redis.hset(MATCHMAKING_WAITING_KEY, userId, timestamp),
      redis.expire(MATCHMAKING_WAITING_KEY, 86400), // Refresh TTL to 24h
      redis.rpush(MATCHMAKING_QUEUE_KEY, userId),
    ]);
  },

  matchmakeLeave: async (userId: string) => {
    await Promise.all([
      redis.hdel(MATCHMAKING_WAITING_KEY, userId),
      // Remove from queue list using LREM (O(N) but typically small queue)
      // This prevents memory leaks from stale entries accumulating
      redis.lrem(MATCHMAKING_QUEUE_KEY, 1, userId),
    ]);
  },

  matchmakeIsWaiting: async (userId: string) =>
    redis.hexists(MATCHMAKING_WAITING_KEY, userId),

  /** Returns approximate queue length (may include some stale entries). */
  matchmakeQueueLength: async () => redis.llen(MATCHMAKING_QUEUE_KEY),

  /** Returns the count of users currently in the waiting state (accurate). */
  matchmakeWaitingCount: async () => redis.hlen(MATCHMAKING_WAITING_KEY),

  /** Pop userIds from queue head until we find one that is still valid. */
  matchmakePopOne: async (): Promise<string | null> => {
    const MAX_POPS = 50; // avoid infinite loop on very stale queue
    for (let i = 0; i < MAX_POPS; i++) {
      const userId = await redis.lpop(MATCHMAKING_QUEUE_KEY);
      if (!userId) return null;

      const [waiting, online, busy] = await Promise.all([
        redis.hexists(MATCHMAKING_WAITING_KEY, userId),
        redis.hexists(USERS_KEY, userId),
        redis.hexists(BUSY_KEY, userId),
      ]);

      if (waiting && online && !busy) {
        // Valid user - return without removing from waiting (caller will handle)
        return userId;
      }
      // Stale entry — remove from waiting hash if still there and continue
      if (waiting) await redis.hdel(MATCHMAKING_WAITING_KEY, userId);
    }
    return null;
  },

  /** Try to pop two valid users atomically for pairing. Returns [userA, userB] or null. */
  matchmakePopPair: async (): Promise<[string, string] | null> => {
    const userA = await realtimeStore.matchmakePopOne();
    if (!userA) return null;

    const userB = await realtimeStore.matchmakePopOne();
    if (!userB) {
      // Only one user in queue — re-add userA
      await redis.rpush(MATCHMAKING_QUEUE_KEY, userA);
      return null;
    }

    return [userA, userB];
  },

  /** Try to acquire the poller lock for this instance. Returns true if acquired. */
  matchmakeAcquireLock: async (): Promise<boolean> => {
    const result = await redis.set(
      MATCHMAKING_LOCK_KEY, instanceId, "NX", "EX", 5,
    );
    if (result === "OK") return true;
    return (await redis.get(MATCHMAKING_LOCK_KEY)) === instanceId;
  },

  /** Clean up stale queue entries (for periodic maintenance). */
  matchmakeCleanupQueue: async (): Promise<number> => {
    const queueLength = await redis.llen(MATCHMAKING_QUEUE_KEY);
    if (queueLength === 0) return 0;

    // Get all userIds from the queue
    const allUserIds = await redis.lrange(MATCHMAKING_QUEUE_KEY, 0, -1);
    if (allUserIds.length === 0) return 0;

    // Check which ones are still valid (waiting + online + not busy)
    const validChecks = await Promise.all(
      allUserIds.map(async (userId) => {
        const [waiting, online, busy] = await Promise.all([
          redis.hexists(MATCHMAKING_WAITING_KEY, userId),
          redis.hexists(USERS_KEY, userId),
          redis.hexists(BUSY_KEY, userId),
        ]);
        return waiting && online && !busy;
      }),
    );

    const validUserIds = allUserIds.filter((_, index) => validChecks[index]);
    const staleCount = allUserIds.length - validUserIds.length;

    if (staleCount > 0) {
      // Rebuild the queue with only valid entries
      await redis.del(MATCHMAKING_QUEUE_KEY);
      if (validUserIds.length > 0) {
        await redis.rpush(MATCHMAKING_QUEUE_KEY, ...validUserIds);
      }

      // Clean up stale waiting hash entries
      const staleUserIds = allUserIds.filter((_, index) => !validChecks[index]);
      if (staleUserIds.length > 0) {
        await redis.hdel(MATCHMAKING_WAITING_KEY, ...staleUserIds);
      }
    }

    return staleCount;
  },
};
