import type {
  AcceptChatMessage,
  ChatMessagePayload,
  ChatRequestMessage,
  ChatTypingStatusMessage,
  ClientMessage,
  RejectChatMessage,
} from "../types";
import { isRecord } from "../utils/object";

export const rawMessageKind = (raw: unknown): string => {
  if (isRecord(raw) && typeof raw.type === "string") return raw.type;
  if (typeof raw !== "string") return typeof raw;

  try {
    const parsed = JSON.parse(raw);
    return isRecord(parsed) && typeof parsed.type === "string"
      ? parsed.type
      : "string";
  } catch {
    return "string";
  }
};

export const parseClientMessage = (raw: unknown): ClientMessage | null => {
  const parsed = (() => {
    if (isRecord(raw)) return raw;
    if (typeof raw !== "string") return null;
    try {
      const data = JSON.parse(raw);
      return isRecord(data) ? data : null;
    } catch {
      return null;
    }
  })();

  if (!parsed || typeof parsed.type !== "string") return null;

  if (parsed.type === "chat_request") {
    if (typeof parsed.targetId !== "string" || !parsed.targetId) return null;
    const msg: ChatRequestMessage = {
      type: "chat_request",
      targetId: parsed.targetId,
    };
    return msg;
  }

  if (parsed.type === "accept_chat") {
    if (typeof parsed.targetId !== "string" || !parsed.targetId) return null;
    const msg: AcceptChatMessage = {
      type: "accept_chat",
      targetId: parsed.targetId,
    };
    return msg;
  }

  if (parsed.type === "reject_chat") {
    if (typeof parsed.fromId !== "string" || !parsed.fromId) return null;
    const msg: RejectChatMessage = {
      type: "reject_chat",
      fromId: parsed.fromId,
    };
    return msg;
  }

  if (parsed.type === "chat_message") {
    if (typeof parsed.channel !== "string" || !parsed.channel) return null;
    if (typeof parsed.text !== "string") return null;
    const msg: ChatMessagePayload = {
      type: "chat_message",
      channel: parsed.channel,
      text: parsed.text,
    };
    if (typeof parsed.clientId === "string" && parsed.clientId) {
      msg.clientId = parsed.clientId;
    }
    return msg;
  }

  if (parsed.type === "chat_typing") {
    if (typeof parsed.channel !== "string" || !parsed.channel) return null;
    if (typeof parsed.isTyping !== "boolean") return null;
    const msg: ChatTypingStatusMessage = {
      type: "chat_typing",
      channel: parsed.channel,
      isTyping: parsed.isTyping,
    };
    return msg;
  }

  if (parsed.type === "end_chat") {
    if (typeof parsed.channel !== "string" || !parsed.channel) return null;
    return {
      type: "end_chat",
      channel: parsed.channel,
    };
  }

  if (parsed.type === "matchmake_join") {
    return { type: "matchmake_join" };
  }

  if (parsed.type === "matchmake_leave") {
    return { type: "matchmake_leave" };
  }

  if (parsed.type === "matchmake_ready") {
    if (typeof parsed.channel !== "string" || !parsed.channel) return null;
    return { type: "matchmake_ready", channel: parsed.channel };
  }

  return null;
};
