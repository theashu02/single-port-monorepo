export interface OnlineUser {
  id: string;
  name: string;
}

export type ClientMessage =
  | ChatRequestMessage
  | AcceptChatMessage
  | RejectChatMessage
  | ChatMessagePayload;

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

export interface OnlineUsersSnapshotEvent {
  type: "online_users_snapshot";
  users: OnlineUser[];
}

export interface UserJoinedEvent {
  type: "user_joined";
  user: OnlineUser;
}

export interface UserLeftEvent {
  type: "user_left";
  userId: string;
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

export interface ChatMessageEvent {
  type: "chat_message";
  channel: string;
  fromId: string;
  text: string;
}
