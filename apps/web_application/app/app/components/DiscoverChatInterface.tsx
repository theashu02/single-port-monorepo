"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ArrowUp, Sparkles, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectDiscoverChatIsOpen,
  selectDiscoverChatPeer,
  selectDiscoverChatChannel,
  selectDiscoverChatMessages,
  selectDiscoverChatIsPeerTyping,
  selectDiscoverChatConnectionStatus,
  selectDiscoverChatError,
  discoverChatMessageSending,
  discoverChatMessageSent,
  discoverChatMessageFailed,
  discoverChatClearError,
  type DiscoverChatMessage,
} from "@/lib/redux/slices/discoverChatSlice";
import { selectCurrentUserId } from "@/lib/redux/slices/presenceSlice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useOnlinePresenceActions } from "../online-people/OnlinePresenceProvider";

const TYPING_IDLE_MS = 1000;
const MAX_MESSAGE_LENGTH = 2000;

// ── Message Component ─────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: DiscoverChatMessage;
  isMine: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(
  ({ message, isMine }) => {
    const isSystem = message.fromId === "__system__";

    if (isSystem) {
      return (
        <div className="flex justify-center py-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>{message.text}</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3`}>
        <div
          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed ${
            isMine
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          <div
            className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
              isMine ? "text-primary-foreground/60" : "text-muted-foreground"
            }`}
          >
            <span>
              {new Date(message.ts).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {isMine && message.status === "sending" && (
              <span className="text-[9px]">●</span>
            )}
            {isMine && message.status === "sent" && (
              <span className="text-[9px]">✓</span>
            )}
            {isMine && message.status === "failed" && (
              <span className="text-red-400 text-[9px]">✗</span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

MessageBubble.displayName = "MessageBubble";

// ── Main Chat Interface ───────────────────────────────────────────────────────

const DiscoverChatInterface: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectDiscoverChatIsOpen);
  const peer = useAppSelector(selectDiscoverChatPeer);
  const channel = useAppSelector(selectDiscoverChatChannel);
  const messages = useAppSelector(selectDiscoverChatMessages);
  const isPeerTyping = useAppSelector(selectDiscoverChatIsPeerTyping);
  const connectionStatus = useAppSelector(selectDiscoverChatConnectionStatus);
  const error = useAppSelector(selectDiscoverChatError);
  const currentUserId = useAppSelector(selectCurrentUserId);
  const { sendMessage, sendTypingStatus, endChat } = useOnlinePresenceActions();

  const [draft, setDraft] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingChannelRef = useRef<string | null>(null);
  const typingIdleTimerRef = useRef<number | null>(null);
  const closeSentRef = useRef(false);

  // ── Auto-scroll to bottom ─────────────────────────────────────────────────

  useLayoutEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // ── Focus textarea when chat opens ────────────────────────────────────────

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ── Typing indicator logic ────────────────────────────────────────────────

  const clearTypingTimer = useCallback(() => {
    if (typingIdleTimerRef.current) {
      window.clearTimeout(typingIdleTimerRef.current);
      typingIdleTimerRef.current = null;
    }
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
      typingIdleTimerRef.current = window.setTimeout(
        stopTyping,
        TYPING_IDLE_MS,
      );
    },
    [clearTypingTimer, sendTypingStatus, stopTyping],
  );

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopTyping();
      if (channel && !closeSentRef.current) {
        closeSentRef.current = true;
        endChat(channel);
      }
    };
  }, [channel, endChat, stopTyping]);

  // ── Reset close flag when channel changes ─────────────────────────────────

  useEffect(() => {
    closeSentRef.current = false;
  }, [channel]);

  // ── Handle page visibility change ─────────────────────────────────────────

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && channel && !closeSentRef.current) {
        stopTyping();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [channel, stopTyping]);

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !channel || !currentUserId) return;
    if (text.length > MAX_MESSAGE_LENGTH) return;

    stopTyping();

    // Generate message ID
    const messageId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${currentUserId}-${Date.now()}-${Math.random()}`;

    // Optimistic update
    dispatch(
      discoverChatMessageSending({
        id: messageId,
        text,
        fromId: currentUserId,
      }),
    );

    // Send via WebSocket
    const sent = sendMessage(channel, text);

    if (sent) {
      dispatch(discoverChatMessageSent({ id: messageId }));
      setDraft("");
    } else {
      dispatch(discoverChatMessageFailed({ id: messageId }));
    }
  }, [draft, channel, currentUserId, stopTyping, dispatch, sendMessage]);

  // ── Handle textarea change ────────────────────────────────────────────────

  const handleDraftChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length > MAX_MESSAGE_LENGTH) return;

      setDraft(value);

      if (!channel || connectionStatus !== "connected") return;

      if (value.trim()) {
        startTyping(channel);
      } else {
        stopTyping();
      }
    },
    [channel, connectionStatus, startTyping, stopTyping],
  );

  // ── Handle keyboard shortcuts ─────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape") {
        setIsExpanded(false);
        textareaRef.current?.blur();
      }
    },
    [handleSend],
  );

  // ── Clear error ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(discoverChatClearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // ── Don't render if not open ──────────────────────────────────────────────

  if (!isOpen || !peer || !channel) return null;

  const isConnected = connectionStatus === "connected";
  const isReconnecting = connectionStatus === "reconnecting";
  const remainingChars = MAX_MESSAGE_LENGTH - draft.length;
  const showCharCount = remainingChars < 100;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Chat Container */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-500">
        {/* Error Banner */}
        {error && (
          <div className="mx-auto mb-2 px-4 py-2 bg-red-500 text-white text-sm rounded-full shadow-lg animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Messages Area (expands when focused) */}
        {isExpanded && (
          <div className="flex-1 min-h-0 bg-background/95 backdrop-blur-xl border-t border-border px-4 pb-4 animate-in slide-in-from-bottom duration-300">
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold">
                      {peer.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{peer.name}</p>
                    <div className="flex items-center gap-1.5 text-xs">
                      {isConnected && (
                        <>
                          <Wifi className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {isPeerTyping ? "Typing..." : "Online"}
                          </span>
                        </>
                      )}
                      {isReconnecting && (
                        <>
                          <WifiOff className="h-3 w-3 text-amber-500 animate-pulse" />
                          <span className="text-amber-600 dark:text-amber-400">
                            Reconnecting...
                          </span>
                        </>
                      )}
                      {connectionStatus === "disconnected" && (
                        <>
                          <WifiOff className="h-3 w-3 text-red-500" />
                          <span className="text-red-600 dark:text-red-400">
                            Disconnected
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="text-xs"
                >
                  Minimize
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 py-4">
                <div className="space-y-1">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center border border-border mb-4">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Say hi to {peer.name}! You&apos;ve been matched for an
                        anonymous conversation.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isMine={
                          msg.fromId !== "__system__" &&
                          msg.fromId === currentUserId
                        }
                      />
                    ))
                  )}
                  {isPeerTyping && (
                    <div className="flex justify-start mb-3">
                      <div className="px-4 py-2.5 rounded-2xl bg-muted rounded-bl-md">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Input Area (always visible) */}
        <div className="bg-background/95 backdrop-blur-xl border-t border-border shadow-2xl">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Peer Info (when minimized) */}
            {!isExpanded && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-bold">
                      {peer.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{peer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isPeerTyping ? "Typing..." : "Online"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="text-xs"
                >
                  Expand
                </Button>
              </div>
            )}

            {/* Input Box */}
            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  rows={1}
                  value={draft}
                  onChange={handleDraftChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsExpanded(true)}
                  placeholder={
                    isConnected ? `Message ${peer.name}...` : "Reconnecting..."
                  }
                  disabled={!isConnected}
                  className="min-h-[52px] max-h-[120px] resize-none bg-muted/50 border-border focus-visible:ring-primary/20 focus-visible:border-primary/50 text-[15px] pr-12 py-3.5"
                />
                {showCharCount && (
                  <span
                    className={`absolute right-3 bottom-3 text-[10px] font-medium ${
                      remainingChars < 50
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {remainingChars}
                  </span>
                )}
              </div>

              <Button
                size="icon"
                onClick={handleSend}
                disabled={!draft.trim() || !isConnected}
                className="h-[52px] w-[52px] shrink-0 rounded-2xl bg-primary hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground transition-all active:scale-95"
              >
                <ArrowUp className="h-5 w-5 stroke-[2.5px]" />
              </Button>
            </div>

            {/* Helper Text */}
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-[11px] text-muted-foreground">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                  Enter
                </kbd>{" "}
                to send
              </p>
              {!isConnected && (
                <Badge variant="outline" className="text-[10px]">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Connection issue
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DiscoverChatInterface;
