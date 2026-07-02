"use client";

import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import MessageRow from "./MessageRow";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { chatClosed, selectChannelMessages, selectChatChannel, selectChatPeer, selectChatPhase, selectIsPeerTyping } from "@/lib/redux/slices/chatSlice";
import { selectCurrentUserId } from "@/lib/redux/slices/presenceSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useOnlinePresenceActions } from "./OnlinePresenceProvider";

import { usePathname } from "next/navigation";

const TYPING_IDLE_MS = 1000

const ChatWindow: React.FC = memo(() => {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const phase = useAppSelector(selectChatPhase);
  const peer = useAppSelector(selectChatPeer);
  const channel = useAppSelector(selectChatChannel);
  const messages = useAppSelector(selectChannelMessages(channel));
  const selectPeerTyping = useMemo(() => selectIsPeerTyping(channel, peer?.id), [channel, peer?.id]);
  const isPeerTyping = useAppSelector(selectPeerTyping);
  const currentUserId = useAppSelector(selectCurrentUserId);
  const { sendMessage, sendTypingStatus, endChat } = useOnlinePresenceActions();

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
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
    activeChannelRef.current = phase === "open" ? channel : null;
    if (phase === "open") closeSentRef.current = false;
    if (phase !== "open") stopTyping();
  }, [channel, phase, stopTyping]);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [channel, stopTyping]);

  useEffect(() => {
    const endActiveChat = () => {
      stopTyping();
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
  }, [endChat, stopTyping]);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !channel) return;
    stopTyping();
    const sent = sendMessage(channel, text);
    if (sent) setDraft("");
  }, [channel, draft, sendMessage, stopTyping]);

  const handleDraftChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setDraft(value);

      if (!channel || phase !== "open") return;
      if (value.trim()) {
        startTyping(channel);
      } else {
        stopTyping();
      }
    },
    [channel, phase, startTyping, stopTyping],
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

  if (phase !== "open" || !peer || !channel || pathname?.includes("/discover")) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] flex flex-col rounded-[2.5rem] border border-border bg-background/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-in slide-in-from-right-8 duration-500 overflow-hidden ring-1 ring-border/50">
      <div className="flex items-center justify-between px-6 py-5 bg-linear-to-b from-foreground/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              <AvatarImage src={peer.avatarUrl} />
              <AvatarFallback className="bg-muted text-muted-foreground font-medium">{peer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-[3px] border-background" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tracking-tight">{peer.name}</span>
            <span className={`text-[10px] font-semibold uppercase tracking-widest ${isPeerTyping ? "text-primary" : "text-emerald-600 dark:text-emerald-400"}`}>{isPeerTyping ? "Typing..." : "Online"}</span>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6">
          <div className="space-y-6 pb-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-20 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center border border-border">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground font-medium max-w-[160px]">This is the start of your encrypted conversation.</p>
              </div>
            ) : (
              messages.map((msg) => <MessageRow key={msg.id} msg={msg} isMine={msg.fromId !== "__system__" && msg.fromId === currentUserId} />)
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="p-5 pt-2">
        <div className="relative flex items-center gap-2 bg-muted/50 border border-border rounded-[1.8rem] p-2 pr-2.5 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
          <Textarea rows={1} value={draft} onChange={handleDraftChange} onKeyDown={handleKeyDown} placeholder="Write a message..." className="min-h-[44px] max-h-[120px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground py-3 px-4 scrollbar-hide text-[15px]" />
          <Button size="icon" onClick={handleSend} disabled={!draft.trim()} className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground transition-all active:scale-90">
            <ArrowUp className="h-5 w-5 stroke-[2.5px]" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-3 font-medium">Press Enter to send</p>
      </div>
    </div>
  );
});

ChatWindow.displayName = "ChatWindow";

export default ChatWindow;
