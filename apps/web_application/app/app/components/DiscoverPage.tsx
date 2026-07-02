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
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
      {/* Decorative orb */}
      <div className="relative">
        <div className="absolute inset-0 h-32 w-32 animate-pulse rounded-full bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-400/30 blur-2xl" />
        <div className="relative grid h-32 w-32 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-violet-500/10 to-cyan-400/10">
          <Sparkles className="h-12 w-12 text-violet-400" />
        </div>
      </div>

      <div>
        <h2 className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-3xl font-black tracking-tight text-transparent">
          Discover Someone New
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-white/60">
          Get matched with a random online user for a direct anonymous conversation.
        </p>
      </div>

      {/* Online count */}
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
          {onlineCount.toLocaleString()} online now
        </span>
      </div>

      {/* Start button */}
      <button
        id="start-matching-btn"
        onClick={onStart}
        className="group relative rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-10 py-4 text-base font-bold tracking-wide text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 active:scale-95"
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
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
      {/* Animated pulse rings */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-40 w-40 animate-ping rounded-full border border-violet-500/30" style={{ animationDuration: "2s" }} />
        <div className="absolute h-32 w-32 animate-ping rounded-full border border-fuchsia-500/20" style={{ animationDuration: "2.5s" }} />
        <div className="absolute h-24 w-24 animate-ping rounded-full border border-cyan-400/20" style={{ animationDuration: "3s" }} />
        <div className="relative grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
          <RefreshCw className="h-8 w-8 animate-spin text-violet-400" style={{ animationDuration: "3s" }} />
        </div>
      </div>

      <div>
        <h2 className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-3xl font-black tracking-tight text-transparent">
          Finding Your Match
        </h2>
        <p className="mt-2 text-sm text-white/50">
          Vibing through online queues to find your partner…
        </p>
      </div>

      {/* Timer & position */}
      <div className="flex items-center justify-center gap-4">
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <span className="font-mono text-sm font-medium text-white/70">
            {formatElapsed(elapsed)}
          </span>
        </div>
        {queuePosition !== null && (
          <div className="rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2">
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
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-95"
      >
        <X className="h-4 w-4" />
        Cancel
      </button>
    </div>
  );
}

// ── Inline Minimal Chat View ──────────────────────────────────────────

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

      // Auto-grow textarea up to a reasonable max-height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
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
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={peer.avatarUrl} />
              <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                {peer.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">{peer.name}</span>
            <span className={`text-xs ${isPeerTyping ? "text-primary animate-pulse" : "text-muted-foreground"}`}>
              {isPeerTyping ? "Typing..." : "Connected"}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClose} 
          className="h-9 rounded-full px-4 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="mr-1.5 h-4 w-4" />
          Disconnect
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.length === 0 ? (
            <div className="my-auto flex flex-col items-center justify-center py-24 text-center opacity-70">
              <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
              <h3 className="text-lg font-medium">You&apos;re connected!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Say hi to start the conversation with {peer.name}.
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
          <div ref={bottomRef} className="h-1 shrink-0" />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t bg-background p-3 sm:p-4">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border bg-muted/50 p-1.5 focus-within:ring-1 focus-within:ring-ring transition-shadow">
          <Textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${peer.name}...`}
            className="min-h-[40px] max-h-[150px] w-full resize-none border-0 bg-transparent px-3 py-2 text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none scrollbar-hide"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="mb-0.5 mr-0.5 h-9 w-9 shrink-0 rounded-full transition-all"
          >
            <ArrowUp className="h-4 w-4 stroke-[2.5px]" />
          </Button>
        </div>
        <div className="mx-auto mt-2 hidden max-w-3xl text-center md:block">
          <p className="text-[10px] text-muted-foreground">
            End-to-end encrypted • Anonymous matching • Press Enter to send
          </p>
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

  const isInChat = chatPhase === "open";
  const isSearching = matchmakingPhase === "searching";

  return (
    <div className="w-full h-full min-w-0 bg-background sm:p-4 lg:p-6">
      {/* On mobile during active chat, padding goes away so the UI is flush to edges like a native app */}
      <div 
        className={`relative flex h-full w-full flex-col overflow-hidden transition-all duration-300 ${
          isInChat
            ? "sm:rounded-2xl sm:border border-border bg-background"
            : "rounded-2xl border border-white/10 glass grid-bg"
        }`}
      >
        {/* Background orbs - Hidden during chat so we get a clean minimalist chat view */}
        {!isInChat && (
          <>
            <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
          </>
        )}

        {/* Dynamic Content Views */}
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
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
  );
}