import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DiscoverChatMessage {
  /** Stable UUID for React keys */
  id: string;
  fromId: string;
  text: string;
  /** Unix ms timestamp */
  ts: number;
  /** Delivery status */
  status: "sending" | "sent" | "failed";
}

export interface DiscoverChatPeer {
  id: string;
  name: string;
}

export interface DiscoverChatState {
  /** Is chat interface visible */
  isOpen: boolean;
  /** Current chat channel */
  channel: string | null;
  /** Matched peer */
  peer: DiscoverChatPeer | null;
  /** Messages for current channel */
  messages: DiscoverChatMessage[];
  /** Is peer typing */
  isPeerTyping: boolean;
  /** Connection status */
  connectionStatus: "connected" | "reconnecting" | "disconnected";
  /** Error message if any */
  error: string | null;
}

const initialState: DiscoverChatState = {
  isOpen: false,
  channel: null,
  peer: null,
  messages: [],
  isPeerTyping: false,
  connectionStatus: "connected",
  error: null,
};

// ── Slice ─────────────────────────────────────────────────────────────────────

const discoverChatSlice = createSlice({
  name: "discoverChat",
  initialState,
  reducers: {
    /**
     * Open chat interface with matched peer
     */
    discoverChatOpen(
      state,
      action: PayloadAction<{ peer: DiscoverChatPeer; channel: string }>,
    ) {
      state.isOpen = true;
      state.peer = action.payload.peer;
      state.channel = action.payload.channel;
      state.messages = [];
      state.isPeerTyping = false;
      state.error = null;
      state.connectionStatus = "connected";
    },

    /**
     * Close chat interface and cleanup
     */
    discoverChatClose(state) {
      state.isOpen = false;
      // Keep messages in memory for potential "view history" feature
      // But clear peer and channel
      state.peer = null;
      state.channel = null;
      state.isPeerTyping = false;
      state.error = null;
    },

    /**
     * Add outgoing message (optimistic)
     */
    discoverChatMessageSending(
      state,
      action: PayloadAction<{ id: string; text: string; fromId: string }>,
    ) {
      const { id, text, fromId } = action.payload;
      state.messages.push({
        id,
        fromId,
        text,
        ts: Date.now(),
        status: "sending",
      });
    },

    /**
     * Mark message as sent
     */
    discoverChatMessageSent(state, action: PayloadAction<{ id: string }>) {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg) msg.status = "sent";
    },

    /**
     * Mark message as failed
     */
    discoverChatMessageFailed(state, action: PayloadAction<{ id: string }>) {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg) msg.status = "failed";
    },

    /**
     * Incoming message from peer
     */
    discoverChatMessageReceived(
      state,
      action: PayloadAction<{
        id: string;
        channel: string;
        fromId: string;
        text: string;
        ts: number;
      }>,
    ) {
      const { id, channel, fromId, text, ts } = action.payload;
      // Only add if it's for the current channel
      if (channel !== state.channel) return;

      // Prevent duplicates
      if (state.messages.some((m) => m.id === id)) return;

      state.messages.push({
        id,
        fromId,
        text,
        ts,
        status: "sent",
      });

      // Clear typing indicator
      if (state.isPeerTyping && fromId === state.peer?.id) {
        state.isPeerTyping = false;
      }
    },

    /**
     * Peer typing status changed
     */
    discoverChatTypingChanged(
      state,
      action: PayloadAction<{
        channel: string;
        fromId: string;
        isTyping: boolean;
      }>,
    ) {
      const { channel, fromId, isTyping } = action.payload;
      if (channel !== state.channel) return;
      if (fromId !== state.peer?.id) return;

      state.isPeerTyping = isTyping;
    },

    /**
     * Chat ended by peer or system
     */
    discoverChatEnded(state, action: PayloadAction<{ reason?: string }>) {
      if (!state.channel) return;

      // Add system message
      state.messages.push({
        id: `__ended__${Date.now()}`,
        fromId: "__system__",
        text:
          action.payload.reason ||
          "The conversation has ended. Click 'Match Again' to find someone new.",
        ts: Date.now(),
        status: "sent",
      });

      state.connectionStatus = "disconnected";
      state.isPeerTyping = false;
    },

    /**
     * Connection status changed
     */
    discoverChatConnectionStatus(
      state,
      action: PayloadAction<"connected" | "reconnecting" | "disconnected">,
    ) {
      state.connectionStatus = action.payload;
    },

    /**
     * Error occurred
     */
    discoverChatError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },

    /**
     * Clear error
     */
    discoverChatClearError(state) {
      state.error = null;
    },

    /**
     * Reset entire state (for cleanup)
     */
    discoverChatReset() {
      return initialState;
    },
  },
});

export const {
  discoverChatOpen,
  discoverChatClose,
  discoverChatMessageSending,
  discoverChatMessageSent,
  discoverChatMessageFailed,
  discoverChatMessageReceived,
  discoverChatTypingChanged,
  discoverChatEnded,
  discoverChatConnectionStatus,
  discoverChatError,
  discoverChatClearError,
  discoverChatReset,
} = discoverChatSlice.actions;

export default discoverChatSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectDiscoverChatIsOpen = (s: RootState) =>
  s.discoverChat.isOpen;
export const selectDiscoverChatPeer = (s: RootState) => s.discoverChat.peer;
export const selectDiscoverChatChannel = (s: RootState) =>
  s.discoverChat.channel;
export const selectDiscoverChatMessages = (s: RootState) =>
  s.discoverChat.messages;
export const selectDiscoverChatIsPeerTyping = (s: RootState) =>
  s.discoverChat.isPeerTyping;
export const selectDiscoverChatConnectionStatus = (s: RootState) =>
  s.discoverChat.connectionStatus;
export const selectDiscoverChatError = (s: RootState) => s.discoverChat.error;
