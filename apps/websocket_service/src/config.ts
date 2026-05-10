export const SERVICE_PORT = 3001;
export const WS_PATH = "/ws";
export const ONLINE_USERS_TOPIC = "online-users";
export const INVITE_TIMEOUT_MS = 15000;
export const SOCKET_REPLACED_CODE = 4000;
export const SOCKET_REPLACED_REASON =
  "Another websocket connection opened for this user";

export const userTopic = (userId: string) => `user:${userId}`;
