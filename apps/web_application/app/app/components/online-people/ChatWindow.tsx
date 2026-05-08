"use client";

import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardFooter, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowUp, Sparkles, User, X } from "lucide-react";
import { useOnlinePresenceActions } from "./OnlinePresenceProvider";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { chatClosed, selectChannelMessages, selectChatChannel, selectChatPeer, selectChatPhase, type ChatMessage } from "@/lib/redux/slices/chatSlice";
import { selectCurrentUserId } from "@/lib/redux/slices/presenceSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

const MessageRow = memo(({ msg, isMine }: { msg: ChatMessage; isMine: boolean }) => {
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
        <span className="text-[10px] text-white/30 bg-white/5 px-3 py-1 rounded-full">{msg.text}</span>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMine ? "bg-linear-to-r from-violet-500 to-fuchsia-500 text-white rounded-br-sm shadow-md shadow-violet-500/20" : "glass border border-white/10 text-white/90 rounded-bl-sm"}`}>
        <p className="wrap-break-words">{msg.text}</p>
        <p className={`mt-0.5 text-[10px] ${isMine ? "text-white/60 text-right" : "text-white/40"}`}>{time}</p>
      </div>
    </div>
  );
});
MessageRow.displayName = "MessageRow";

const ChatWindow: React.FC = memo(() => {
  const dispatch = useAppDispatch();
  const phase = useAppSelector(selectChatPhase);
  const peer = useAppSelector(selectChatPeer);
  const channel = useAppSelector(selectChatChannel);
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
      className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] flex flex-col rounded-[2.5rem] border border-white/10 bg-zinc-950/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-in slide-in-from-right-8 duration-500 overflow-hidden ring-1 ring-white/5"
    >
      <div className="flex items-center justify-between px-6 py-5 bg-linear-to-b from-white/3 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-violet-500/20 ring-offset-2 ring-offset-zinc-950">
              <AvatarImage src={peer.avatarUrl} />
              <AvatarFallback className="bg-zinc-800 text-zinc-400 font-medium">{peer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-[3px] border-zinc-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-100 tracking-tight">{peer.name}</span>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest">Active</span>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6">
          <div className="space-y-6 pb-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-20 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5">
                  <Sparkles className="h-6 w-6 text-violet-400" />
                </div>
                <p className="text-xs text-zinc-500 font-medium max-w-[160px]">This is the start of your encrypted conversation.</p>
              </div>
            ) : (
              messages.map((msg) => <MessageRow key={msg.id} msg={msg} isMine={msg.fromId !== "__system__" && msg.fromId === currentUserId} />)
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="p-5 pt-2">
        <div className="relative flex items-end gap-2 bg-zinc-900/50 border border-white/5 rounded-[1.8rem] p-2 pr-2.5 focus-within:border-violet-500/30 focus-within:ring-4 focus-within:ring-violet-500/10 transition-all">
          <Textarea rows={1} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={handleKeyDown} placeholder="Write a message..." className="min-h-[44px] max-h-[120px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-200 placeholder:text-zinc-600 py-3 px-4 scrollbar-hide text-[15px]" />
          <Button size="icon" onClick={handleSend} disabled={!draft.trim()} className="h-9 w-9 shrink-0 rounded-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all active:scale-90">
            <ArrowUp className="h-5 w-5 stroke-[2.5px]" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-zinc-600 mt-3 font-medium">Press Enter to send</p>
      </div>
    </div>
  );
});

ChatWindow.displayName = "ChatWindow";

export default ChatWindow;
