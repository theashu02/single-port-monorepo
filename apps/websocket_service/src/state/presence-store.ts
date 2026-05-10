import type { OnlineUser } from "../types";

export interface ActiveConnection {
  raw: object;
  close: (code?: number, reason?: string) => unknown;
}

const onlineUsers = new Map<string, OnlineUser>();
const connectionIdentity = new Map<object, OnlineUser>();
const activeConnections = new Map<string, ActiveConnection>();

export const presenceStore = {
  size: () => onlineUsers.size,
  hasUser: (userId: string) => onlineUsers.has(userId),
  getUser: (userId: string) => onlineUsers.get(userId),
  setUser: (user: OnlineUser) => onlineUsers.set(user.id, user),
  deleteUser: (userId: string) => onlineUsers.delete(userId),
  users: () => Array.from(onlineUsers.values()),

  getConnectionIdentity: (raw: object) => connectionIdentity.get(raw),
  setConnectionIdentity: (raw: object, user: OnlineUser) =>
    connectionIdentity.set(raw, user),
  deleteConnectionIdentity: (raw: object) => connectionIdentity.delete(raw),

  getActiveConnection: (userId: string) => activeConnections.get(userId),
  setActiveConnection: (userId: string, connection: ActiveConnection) =>
    activeConnections.set(userId, connection),
  deleteActiveConnection: (userId: string) => activeConnections.delete(userId),
};
