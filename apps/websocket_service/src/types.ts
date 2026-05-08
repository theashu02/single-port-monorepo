export interface OnlineUser {
  id: string;
  name: string;
}

export type ClientMessage = ChatRequestMessage | AcceptChatMessage | ChatMessagePayload;

export interface ChatRequestMessage {
  type: "chat_request";
  targetId: string;
}

export interface AcceptChatMessage {
  type: "accept_chat";
  targetId: string;
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

export interface ChatMessageEvent {
  type: "chat_message";
  channel: string;
  fromId: string;
  text: string;
}
