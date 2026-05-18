import { REDIS_BUS_TOPIC, REDIS_URL } from "../config";
import { logInfo, logWarn } from "../logger";
import type { OnlinePresenceUser, OnlineUser } from "../types";

const USERS_KEY = "presence:users";
const ONLINE_KEY = "presence:online";
const BUSY_KEY = "presence:busy";
const CHANNELS_KEY = "presence:channels";
const CONNECTION_PREFIX = "presence:connection:";
const CHANNEL_STATE_PREFIX = "presence:channel-state:";

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

export const connectRealtimeStore = async () => {
  await redis.connect();
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
};
