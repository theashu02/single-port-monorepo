export const SERVICE_PORT = 3001;
export const WS_PATH = "/ws";
export const ONLINE_USERS_TOPIC = "online-users";
export const PRESENCE_SAMPLE_SIZE = Number(
  process.env.PRESENCE_SAMPLE_SIZE ?? 100,
);
export const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
export const REDIS_BUS_TOPIC = "realtime-bus";
export const INVITE_TIMEOUT_MS = 15000;
export const SOCKET_REPLACED_CODE = 4000;
export const SOCKET_REPLACED_REASON =
  "Another websocket connection opened for this user";

export const userTopic = (userId: string) => `user:${userId}`;
