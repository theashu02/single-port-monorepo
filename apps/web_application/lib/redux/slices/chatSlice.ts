import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatUser {
  id: string;
  name: string;
}

export interface ChatMessage {
  /** Stable UUID — keeps React list keys stable across re-renders. */
  id: string;
  fromId: string;
  text: string;
  /** Unix ms timestamp, set client-side on receipt. */
  ts: number;
}

export type ChatPhase =
  | "idle"
  /** Local user clicked Chat — waiting for the peer to accept. */
  | "awaiting-accept"
  /** Incoming invite waiting for local user to accept/decline. */
  | "incoming-invite"
  /** Both sides accepted — chat window is open. */
  | "open"
  /** The target user is already in another chat. */
  | "busy"
  /** The invite timed out. */
  | "expired";

export interface ChatState {
  phase: ChatPhase;
  /** Peer the local user is chatting with (or has a pending request to). */
  peer: ChatUser | null;
  /** Deterministic room channel from the server (set once chat_ready fires). */
  channel: string | null;
  /** Messages keyed by channel. Kept outside `channel` so history survives reconnects. */
  messagesByChannel: Record<string, ChatMessage[]>;
}

const initialState: ChatState = {
  phase: "idle",
  peer: null,
  channel: null,
  messagesByChannel: {},
};

// ── Slice ─────────────────────────────────────────────────────────────────────

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    /**
     * Local user clicked "Chat" on a UserCard.
     * Transitions to awaiting-accept immediately — no async gap.
     */
    chatRequested(state, action: PayloadAction<ChatUser>) {
      state.phase = "awaiting-accept";
      state.peer = action.payload;
      state.channel = null;
    },

    /**
     * Server sent chat_invite — someone wants to chat with us.
     */
    inviteReceived(
      state,
      action: PayloadAction<{ from: ChatUser; channel: string }>,
    ) {
      // Only accept a new invite if we are currently idle.
      // Prevents overwriting an already-open chat or a pending request.
      if (state.phase !== "idle") return;
      state.phase = "incoming-invite";
      state.peer = action.payload.from;
      // Store channel early so accept_chat can reference it.
      state.channel = action.payload.channel;
    },

    /**
     * Server sent chat_ready — both sides are subscribed to the channel.
     * Transitions both caller and callee to the open state.
     */
    chatReady(state, action: PayloadAction<{ channel: string }>) {
      state.phase = "open";
      state.channel = action.payload.channel;
      // Ensure the message array exists for this channel.
      if (!state.messagesByChannel[action.payload.channel]) {
        state.messagesByChannel[action.payload.channel] = [];
      }
    },

    /**
     * Server delivered a chat_message on an open channel.
     */
    messageReceived(
      state,
      action: PayloadAction<{ channel: string; fromId: string; text: string; ts: number }>,
    ) {
      const { channel, fromId, text, ts } = action.payload;
      if (!state.messagesByChannel[channel]) {
        state.messagesByChannel[channel] = [];
      }
      state.messagesByChannel[channel].push({
        id: `${fromId}-${ts}-${Math.random().toString(36).slice(2)}`,
        fromId,
        text,
        ts,
      });
    },

    /**
     * Server sent chat_rejected — the peer declined our request.
     */
    chatRejected(state) {
      if (state.phase === "awaiting-accept" || state.phase === "open") {
        const channel = state.channel;
        if (channel) {
          if (!state.messagesByChannel[channel]) {
            state.messagesByChannel[channel] = [];
          }
          state.messagesByChannel[channel].push({
            id: `__rejected__${Date.now()}`,
            fromId: "__system__",
            text: "The conversation has ended.",
            ts: Date.now(),
          });
        }
        state.phase = "idle";
        state.peer = null;
        state.channel = null;
      }
    },

    /**
     * Server sent chat_busy — the target user is already in a chat.
     */
    chatBusy(state) {
      if (state.phase === "awaiting-accept") {
        state.phase = "busy";
      }
    },

    /**
     * Server sent chat_expired — the invite timed out.
     */
    chatExpired(state) {
      if (state.phase === "awaiting-accept") {
        state.phase = "expired";
      }
    },

    /**
     * Local user closed the chat window or declined an invite.
     */
    chatClosed(state) {
      state.phase = "idle";
      state.peer = null;
      state.channel = null;
    },
  },
});

export const {
  chatRequested,
  inviteReceived,
  chatReady,
  messageReceived,
  chatRejected,
  chatBusy,
  chatExpired,
  chatClosed,
} = chatSlice.actions;

export default chatSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────────

import type { RootState } from "../store";

export const selectChatPhase = (s: RootState) => s.chat.phase;
export const selectChatPeer = (s: RootState) => s.chat.peer;
export const selectChatChannel = (s: RootState) => s.chat.channel;
export const selectChannelMessages = (channel: string | null) => (s: RootState) =>
  channel ? (s.chat.messagesByChannel[channel] ?? []) : [];
