"use client";

import { useCallback, useEffect, useState, useRef, useLayoutEffect, useMemo } from "react";
import { Sparkles, Search, X, ArrowUp, RefreshCw, MessageCircle } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import {
  selectMatchmakingPhase,
  selectQueuePosition,
  selectSearchStartedAt,
} from "@/lib/redux/slices/matchmakingSlice";
import {
  selectChatPhase,
  selectChatChannel,
  selectChatPeer,
  selectChannelMessages,
  selectIsPeerTyping,
  chatClosed,
} from "@/lib/redux/slices/chatSlice";
import { selectCurrentUserId, selectUserCount } from "@/lib/redux/slices/presenceSlice";
import { useOnlinePresenceActions } from "./online-people/OnlinePresenceProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MessageRow from "./online-people/MessageRow";

const TYPING_IDLE_MS = 1000;

/** Format elapsed seconds as m:ss */
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function useElapsedTimer(startedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
}

// ── Idle State ────────────────────────────────────────────────────────────────

function IdleView({
  onStart,
  onlineCount,
}: {
  onStart: () => void;
  onlineCount: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-6 text-center h-full">
      {/* Decorative orb */}
      <div className="relative">
        <div className="h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-400/30 blur-2xl absolute inset-0 animate-pulse" />
        <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/10 to-cyan-400/10 border border-white/10 grid place-items-center">
          <Sparkles className="h-12 w-12 text-violet-400" />
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">Discover Someone New</h2>
        <p className="mt-2 text-sm text-white/50 max-w-xs mx-auto">
          Get matched with a random online user for a direct anonymous conversation.
        </p>
      </div>

      {/* Online count */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
          {onlineCount.toLocaleString()} online now
        </span>
      </div>

      {/* Start button */}
      <button
        id="start-matching-btn"
        onClick={onStart}
        className="group relative px-10 py-4 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-white font-bold text-base tracking-wide shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-105 active:scale-95"
      >
        <span className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Start Matching
        </span>
      </button>
    </div>
  );
}

// ── Searching State ───────────────────────────────────────────────────────────

function SearchingView({
  onCancel,
  elapsed,
  queuePosition,
}: {
  onCancel: () => void;
  elapsed: number;
  queuePosition: number | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-6 text-center h-full">
      {/* Animated pulse rings */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-40 w-40 rounded-full border border-violet-500/30 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute h-32 w-32 rounded-full border border-fuchsia-500/20 animate-ping" style={{ animationDuration: "2.5s" }} />
        <div className="absolute h-24 w-24 rounded-full border border-cyan-400/20 animate-ping" style={{ animationDuration: "3s" }} />
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 grid place-items-center">
          <RefreshCw className="h-8 w-8 text-violet-400 animate-spin" style={{ animationDuration: "3s" }} />
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">Finding Your Match</h2>
        <p className="mt-2 text-sm text-white/50">
          Vibing through online queues to find your partner…
        </p>
      </div>

      {/* Timer & position */}
      <div className="flex items-center gap-4 justify-center">
        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <span className="text-sm font-mono font-medium text-white/70">
            {formatElapsed(elapsed)}
          </span>
        </div>
        {queuePosition !== null && (
          <div className="px-4 py-2 rounded-full bg-violet-500/10 border border-violet-400/20">
            <span className="text-sm font-medium text-violet-300">
              #{queuePosition} in queue
            </span>
          </div>
        )}
      </div>

      {/* Cancel button */}
      <button
        id="cancel-matching-btn"
        onClick={onCancel}
        className="flex items-center gap-2 px-8 py-3 rounded-full border border-white/10 bg-white/5 text-white/70 font-medium hover:bg-white/10 hover:text-white transition-all active:scale-95"
      >
        <X className="h-4 w-4" />
        Cancel
      </button>
    </div>
  );
}

// ── Inline ChatGPT/Gemini style Chat View ──────────────────────────────────────────

interface ChatUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface DiscoverChatViewProps {
  peer: ChatUser;
  channel: string;
  currentUserId: string | null;
}

function DiscoverChatView({ peer, channel, currentUserId }: DiscoverChatViewProps) {
  const dispatch = useAppDispatch();
  const messages = useAppSelector(selectChannelMessages(channel));
  const selectPeerTyping = useMemo(() => selectIsPeerTyping(channel, peer.id), [channel, peer.id]);
  const isPeerTyping = useAppSelector(selectPeerTyping);
  const { sendMessage, sendTypingStatus, endChat } = useOnlinePresenceActions();

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeChannelRef = useRef<string | null>(null);
  const closeSentRef = useRef(false);
  const typingChannelRef = useRef<string | null>(null);
  const typingIdleTimerRef = useRef<number | null>(null);

  const clearTypingTimer = useCallback(() => {
    if (!typingIdleTimerRef.current) return;
    window.clearTimeout(typingIdleTimerRef.current);
    typingIdleTimerRef.current = null;
  }, []);

  const stopTyping = useCallback(() => {
    clearTypingTimer();
    const typingChannel = typingChannelRef.current;
    if (!typingChannel) return;

    sendTypingStatus(typingChannel, false);
    typingChannelRef.current = null;
  }, [clearTypingTimer, sendTypingStatus]);

  const startTyping = useCallback(
    (targetChannel: string) => {
      if (typingChannelRef.current !== targetChannel) {
        stopTyping();
        if (sendTypingStatus(targetChannel, true)) {
          typingChannelRef.current = targetChannel;
        }
      }

      clearTypingTimer();
      typingIdleTimerRef.current = window.setTimeout(stopTyping, TYPING_IDLE_MS);
    },
    [clearTypingTimer, sendTypingStatus, stopTyping],
  );

  useEffect(() => {
    activeChannelRef.current = channel;
    closeSentRef.current = false;
    
    return () => {
      stopTyping();
    };
  }, [channel, stopTyping]);

  // Window pagehide / unload cleanup to prevent ghost sessions
  useEffect(() => {
    const endActiveChatOnUnload = () => {
      stopTyping();
      const activeChannel = activeChannelRef.current;
      if (!activeChannel || closeSentRef.current) return;
      closeSentRef.current = true;
      endChat(activeChannel);
    };

    window.addEventListener("pagehide", endActiveChatOnUnload);
    return () => {
      window.removeEventListener("pagehide", endActiveChatOnUnload);
    };
  }, [endChat, stopTyping]);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !channel) return;
    stopTyping();
    const sent = sendMessage(channel, text);
    if (sent) {
      setDraft("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [channel, draft, sendMessage, stopTyping]);

  const handleDraftChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setDraft(value);

      // Auto-grow textarea height dynamically
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
      }

      if (!channel) return;
      if (value.trim()) {
        startTyping(channel);
      } else {
        stopTyping();
      }
    },
    [channel, startTyping, stopTyping],
  );

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
    stopTyping();
    if (channel) {
      closeSentRef.current = true;
      endChat(channel);
    }
    dispatch(chatClosed());
  }, [channel, dispatch, endChat, stopTyping]);

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-hidden bg-background/95">
      <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={peer.avatarUrl} />
              <AvatarFallback className="bg-muted text-muted-foreground font-semibold">{peer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tracking-tight">{peer.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isPeerTyping ? "text-primary animate-pulse" : "text-emerald-500"}`}>
              {isPeerTyping ? "Typing..." : "Matched"}
            </span>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={handleClose} className="h-9 rounded-full px-4 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
          Disconnect
        </Button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4 py-5 sm:px-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-24 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/40">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <p className="max-w-xs text-sm font-medium text-muted-foreground">
                  You are connected with {peer.name}. Start the conversation below.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageRow
                  key={msg.id}
                  msg={msg}
                  isMine={msg.fromId !== "__system__" && msg.fromId === currentUserId}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="w-full border-t border-border bg-background/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-[1.75rem] border border-border bg-muted/40 p-2 pl-4 shadow-sm transition-all focus-within:border-primary/50 focus-within:bg-background focus-within:ring-4 focus-within:ring-primary/10">
          <Textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${peer.name}`}
            className="max-h-[160px] min-h-[40px] flex-1 resize-none border-0 bg-transparent px-0 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-hide"
          />
          
          <div className="flex items-center gap-1.5 shrink-0 self-center pr-1">
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!draft.trim()}
              className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:bg-muted disabled:text-muted-foreground"
            >
              <ArrowUp className="h-5 w-5 stroke-[2.5px]" />
            </Button>
          </div>
        </div>

        <div className="hidden">
          <span>Anonymous pairing • Encrypted conversation • Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const { startMatchmaking, cancelMatchmaking } = useOnlinePresenceActions();
  const matchmakingPhase = useAppSelector(selectMatchmakingPhase);
  const queuePosition = useAppSelector(selectQueuePosition);
  const searchStartedAt = useAppSelector(selectSearchStartedAt);
  const chatPhase = useAppSelector(selectChatPhase);
  const chatPeer = useAppSelector(selectChatPeer);
  const onlineCount = useAppSelector(selectUserCount);
  const currentUserId = useAppSelector(selectCurrentUserId);
  const elapsed = useElapsedTimer(searchStartedAt);
  const chatChannel = useAppSelector(selectChatChannel);

  const handleStart = useCallback(() => {
    startMatchmaking();
  }, [startMatchmaking]);

  const handleCancel = useCallback(() => {
    cancelMatchmaking();
  }, [cancelMatchmaking]);

  // Determine what to show
  const isInChat = chatPhase === "open";
  const isSearching = matchmakingPhase === "searching";

  return (
    <div className="w-full h-full min-w-0">
      <div className="h-full" style={{ opacity: 1, transform: "none" }}>
        <div className="flex flex-col h-full p-4 lg:p-6 gap-4 min-w-0">
          <div className="relative flex-1 min-h-0 rounded-3xl overflow-hidden glass border border-white/10 grid-bg">
            {/* Background orbs */}
            <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute top-1/3 left-1/2 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />

            {/* Content */}
            <div className="relative z-10 h-full w-full flex flex-col items-center justify-center">
              {isInChat && chatPeer && chatChannel ? (
                <DiscoverChatView
                  peer={chatPeer}
                  channel={chatChannel}
                  currentUserId={currentUserId}
                />
              ) : isSearching ? (
                <SearchingView
                  onCancel={handleCancel}
                  elapsed={elapsed}
                  queuePosition={queuePosition}
                />
              ) : (
                <IdleView onStart={handleStart} onlineCount={onlineCount} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
