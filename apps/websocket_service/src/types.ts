export interface OnlineUser {
  id: string;
  name: string;
}

export interface OnlinePresenceUser extends OnlineUser {
  isBusy: boolean;
}

export type ClientMessage =
  | ChatRequestMessage
  | AcceptChatMessage
  | RejectChatMessage
  | ChatMessagePayload
  | ChatTypingStatusMessage
  | EndChatMessage;

export interface ChatRequestMessage {
  type: "chat_request";
  targetId: string;
}

export interface AcceptChatMessage {
  type: "accept_chat";
  targetId: string;
}

/** Sent when the callee clicks Cancel on the invite popup. */
export interface RejectChatMessage {
  type: "reject_chat";
  /** The userId of the person who sent the original chat_request. */
  fromId: string;
}

export interface ChatMessagePayload {
  type: "chat_message";
  channel: string;
  text: string;
}

export interface ChatTypingStatusMessage {
  type: "chat_typing";
  channel: string;
  isTyping: boolean;
}

export interface EndChatMessage {
  type: "end_chat";
  channel: string;
}

export interface OnlineUsersSnapshotEvent {
  type: "online_users_snapshot";
  users: OnlinePresenceUser[];
}

export interface UserJoinedEvent {
  type: "user_joined";
  user: OnlinePresenceUser;
}

export interface UserLeftEvent {
  type: "user_left";
  userId: string;
}

export interface UserStatusChangedEvent {
  type: "user_status_changed";
  userId: string;
  isBusy: boolean;
}

export interface ChatInviteEvent {
  type: "chat_invite";
  from: OnlineUser;
  channel: string;
}

export interface ChatReadyEvent {
  type: "chat_ready";
  channel: string;
}

export interface ChatRejectedEvent {
  type: "chat_rejected";
  /** The userId of the callee who rejected. */
  byId: string;
}

export interface ChatBusyEvent {
  type: "chat_busy";
  /** The userId of the busy callee. */
  byId: string;
}

export interface ChatExpiredEvent {
  type: "chat_expired";
  /** The userId of the callee who didn't respond in time. */
  byId: string;
}

export interface ChatMessageEvent {
  type: "chat_message";
  channel: string;
  fromId: string;
  text: string;
}

export interface ChatTypingEvent {
  type: "chat_typing";
  channel: string;
  fromId: string;
  isTyping: boolean;
}
