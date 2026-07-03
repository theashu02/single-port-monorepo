import type { OnlineUser } from "@/lib/redux/slices/presenceSlice";
import { type PresenceStatus } from "@/lib/redux/slices/presenceSlice";

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getAvatarUrl(id: string, name: string): string {
  const seed = encodeURIComponent(id || name);
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear`;
}

export function getStatusMessage(
  status: PresenceStatus,
  error: string | null,
): string {
  if (status === "connected") return "Realtime presence synced.";
  if (status === "connecting" || status === "resolving-user")
    return "Connecting to presence service…";
  if (status === "unauthenticated")
    return "Sign in or continue as a guest to appear online.";
  return (
    error ?? "Start websocket_service — this page reconnects automatically."
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseOnlineUser(value: unknown): OnlineUser | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string"
  )
    return null;
  const id = value.id.trim();
  const name = value.name.trim();
  return id && name ? { id, name, isBusy: value.isBusy === true } : null;
}

export function parseNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export type ServerEvent =
  | {
      type: "online_users_snapshot";
      users: OnlineUser[];
      totalOnline: number;
      totalBusy: number;
      sampleSize: number;
    }
  | { type: "presence_counts"; online: number; busy: number }
  | { type: "user_status_changed"; userId: string; isBusy: boolean }
  | { type: "chat_invite"; from: OnlineUser; channel: string }
  | { type: "chat_ready"; channel: string }
  | { type: "chat_rejected"; byId: string }
  | { type: "chat_busy"; byId: string }
  | { type: "chat_expired"; byId: string }
  | {
      type: "chat_message";
      channel: string;
      fromId: string;
      text: string;
      id?: string;
    }
  | {
      type: "chat_typing";
      channel: string;
      fromId: string;
      isTyping: boolean;
    }
  | { type: "matchmake_queued"; position: number }
  | { type: "matchmake_found"; peer: OnlineUser; channel: string }
  | { type: "matchmake_cancelled"; reason: string };

export function parseServerEvent(raw: string): ServerEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || typeof parsed.type !== "string") return null;

  switch (parsed.type) {
    case "online_users_snapshot": {
      if (!Array.isArray(parsed.users)) return null;
      const users = parsed.users
        .map(parseOnlineUser)
        .filter((user): user is OnlineUser => user !== null);
      return {
        type: "online_users_snapshot",
        users,
        totalOnline:
          typeof parsed.totalOnline === "number" ? parsed.totalOnline : users.length,
        totalBusy:
          typeof parsed.totalBusy === "number"
            ? parsed.totalBusy
            : users.filter((user) => user.isBusy).length,
        sampleSize:
          typeof parsed.sampleSize === "number" ? parsed.sampleSize : users.length,
      };
    }
    case "presence_counts": {
      if (typeof parsed.online !== "number" || typeof parsed.busy !== "number")
        return null;
      return {
        type: "presence_counts",
        online: Math.max(0, parsed.online),
        busy: Math.max(0, parsed.busy),
      };
    }
    case "user_status_changed": {
      const userId = parseNonEmptyString(parsed.userId);
      if (!userId || typeof parsed.isBusy !== "boolean") return null;
      return { type: "user_status_changed", userId, isBusy: parsed.isBusy };
    }
    case "chat_invite": {
      const from = parseOnlineUser(parsed.from);
      const channel = parseNonEmptyString(parsed.channel);
      return from && channel ? { type: "chat_invite", from, channel } : null;
    }
    case "chat_ready": {
      const channel = parseNonEmptyString(parsed.channel);
      return channel ? { type: "chat_ready", channel } : null;
    }
    case "chat_rejected": {
      const byId = parseNonEmptyString(parsed.byId);
      return byId ? { type: "chat_rejected", byId } : null;
    }
    case "chat_busy": {
      const byId = parseNonEmptyString(parsed.byId);
      return byId ? { type: "chat_busy", byId } : null;
    }
    case "chat_expired": {
      const byId = parseNonEmptyString(parsed.byId);
      return byId ? { type: "chat_expired", byId } : null;
    }
    case "chat_message": {
      const channel = parseNonEmptyString(parsed.channel);
      const fromId = parseNonEmptyString(parsed.fromId);
      if (!channel || !fromId || typeof parsed.text !== "string") return null;
      const id = parseNonEmptyString(parsed.id);
      return { type: "chat_message", channel, fromId, text: parsed.text, id: id ?? undefined };
    }
    case "chat_typing": {
      const channel = parseNonEmptyString(parsed.channel);
      const fromId = parseNonEmptyString(parsed.fromId);
      if (!channel || !fromId || typeof parsed.isTyping !== "boolean")
        return null;
      return {
        type: "chat_typing",
        channel,
        fromId,
        isTyping: parsed.isTyping,
      };
    }
    case "matchmake_queued": {
      if (typeof parsed.position !== "number") return null;
      return { type: "matchmake_queued", position: parsed.position };
    }
    case "matchmake_found": {
      const peer = parseOnlineUser(parsed.peer);
      const channel = parseNonEmptyString(parsed.channel);
      return peer && channel
        ? { type: "matchmake_found", peer, channel }
        : null;
    }
    case "matchmake_cancelled": {
      const reason = parseNonEmptyString(parsed.reason);
      return reason ? { type: "matchmake_cancelled", reason } : null;
    }
    default:
      return null;
  }
}

export function buildWebSocketUrl(endpoint: string, id: string, name: string): string {
  const url = new URL(endpoint, window.location.href);
  if (url.protocol === "http:") url.protocol = "ws:";
  if (url.protocol === "https:") url.protocol = "wss:";
  url.searchParams.set("userId", id);
  url.searchParams.set("name", name);
  return url.toString();
}

export type Identity = { id: string; name: string };

export function isSameIdentity(left: Identity | null, right: Identity): boolean {
  return left?.id === right.id && left.name === right.name;
}

export function createClientMessageId(fromId: string, ts: number): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${fromId}-${ts}-${Math.random().toString(36).slice(2)}`;
}
