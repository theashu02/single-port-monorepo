"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowUp, X } from "lucide-react";
import { useOnlinePresenceActions } from "./OnlinePresenceProvider";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  chatClosed,
  selectChannelMessages,
  selectChatChannel,
  selectChatPeer,
  selectChatPhase,
  type ChatMessage,
} from "@/lib/redux/slices/chatSlice";
import { selectCurrentUserId } from "@/lib/redux/slices/presenceSlice";

// ── Individual message row ────────────────────────────────────────────────────

/**
 * Memoized: only re-renders when its own message object changes.
 * Because Redux only appends new messages, existing rows are never
 * touched after their first paint.
 */
const MessageRow = memo(
  ({ msg, isMine }: { msg: ChatMessage; isMine: boolean }) => {
    const time = useMemo(
      () =>
        new Date(msg.ts).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        }),
      [msg.ts],
    );

    const isSystem = msg.fromId === "__system__";

    if (isSystem) {
      return (
        <div className="flex justify-center my-2">
          <span className="text-[10px] text-white/30 bg-white/5 px-3 py-1 rounded-full">
            {msg.text}
          </span>
        </div>
      );
    }

    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
        <div
          className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMine ? "bg-linear-to-r from-violet-500 to-fuchsia-500 text-white rounded-br-sm shadow-md shadow-violet-500/20" : "glass border border-white/10 text-white/90 rounded-bl-sm"}`}
        >
          <p className="wrap-break-words">{msg.text}</p>
          <p
            className={`mt-0.5 text-[10px] ${isMine ? "text-white/60 text-right" : "text-white/40"}`}
          >
            {time}
          </p>
        </div>
      </div>
    );
  },
);
MessageRow.displayName = "MessageRow";

// ── Chat window ───────────────────────────────────────────────────────────────

/**
 * Reads all state from Redux — no props, no useEffect subscriptions.
 * Renders only when phase === "open".
 *
 * Messages come in via Redux actions dispatched synchronously from the
 * WebSocket onmessage handler in OnlinePresenceProvider, so there is
 * zero latency between server delivery and UI update.
 */
const ChatWindow: React.FC = memo(() => {
  const dispatch = useAppDispatch();
  const phase = useAppSelector(selectChatPhase);
  const peer = useAppSelector(selectChatPeer);
  const channel = useAppSelector(selectChatChannel);
  // Selector is stable because channel is memoized in the slice
  const messages = useAppSelector(selectChannelMessages(channel));
  const currentUserId = useAppSelector(selectCurrentUserId);
  const { sendMessage, endChat } = useOnlinePresenceActions();

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeChannelRef = useRef<string | null>(null);
  const closeSentRef = useRef(false);

  useEffect(() => {
    activeChannelRef.current = phase === "open" ? channel : null;
    if (phase === "open") closeSentRef.current = false;
  }, [channel, phase]);

  useEffect(() => {
    const endActiveChat = () => {
      const activeChannel = activeChannelRef.current;
      if (!activeChannel || closeSentRef.current) return;
      closeSentRef.current = true;
      endChat(activeChannel);
    };

    window.addEventListener("pagehide", endActiveChat);
    return () => {
      endActiveChat();
      window.removeEventListener("pagehide", endActiveChat);
    };
  }, [endChat]);

  // Scroll to bottom after new messages — useLayoutEffect avoids flash.
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !channel) return;
    const sent = sendMessage(channel, text);
    if (sent) setDraft("");
  }, [channel, draft, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleClose = useCallback(() => {
    if (channel) {
      closeSentRef.current = true;
      endChat(channel);
    }
    dispatch(chatClosed());
  }, [channel, dispatch, endChat]);

  if (phase !== "open" || !peer || !channel) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 flex flex-col rounded-3xl overflow-hidden border border-white/10 glass shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
      role="region"
      aria-label={`Chat with ${peer.name}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex h-8 w-8 rounded-full bg-linear-to-br from-violet-500 to-cyan-400 items-center justify-center text-xs font-bold text-white select-none">
              {peer.name.charAt(0).toUpperCase()}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0c0a18]" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">{peer.name}</p>
            <p className="text-[10px] text-emerald-300 mt-0.5">Online now</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="h-7 w-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
          aria-label="Close chat"
        >
          <X className="h-4 w-4 text-white/60" aria-hidden="true" />
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto max-h-72 px-4 py-3 scrollbar-hide">
        {messages.length === 0 && (
          <p className="text-center text-xs text-white/30 mt-8">
            Say hello to {peer.name} 👋
          </p>
        )}
        {messages.map((msg) => (
          <MessageRow
            key={msg.id}
            msg={msg}
            isMine={msg.fromId !== "__system__" && msg.fromId === currentUserId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="px-3 pb-3 pt-2 border-t border-white/10 bg-white/5 flex gap-2 items-end">
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${peer.name}…`}
          className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50 scrollbar-hide"
          style={{ maxHeight: "80px" }}
          aria-label="Message input"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim()}
          className="h-9 w-9 shrink-0 rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md shadow-violet-500/30 hover:opacity-90 transition-opacity disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          aria-label="Send message"
        >
          <ArrowUp className="h-4 w-4 text-white" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});

ChatWindow.displayName = "ChatWindow";

export default ChatWindow;
