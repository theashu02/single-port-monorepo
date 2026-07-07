'use client';

import React, { memo } from 'react';
import { ArrowUp, Sparkles, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

import MessageRow from './MessageRow';
import { useChatWindowLogic } from '@/lib/hooks/useChatWindowLogic';
import { cn } from '@/lib/utils';

const ChatWindow: React.FC = memo(() => {
  const {
    pathname,
    phase,
    peer,
    channel,
    messages,
    isPeerTyping,
    currentUserId,
    draft,
    bottomRef,
    handleDraftChange,
    handleKeyDown,
    handleSend,
    handleClose,
  } = useChatWindowLogic();

  if (phase !== 'open' || !peer || !channel || pathname?.includes('/discover')) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] flex flex-col rounded-3xl border border-border/80 bg-background/85 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] animate-in slide-in-from-right-12 fade-in duration-500 overflow-hidden ring-1 ring-border/30">
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              <AvatarImage src={peer.avatarUrl} />
              <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                {peer.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-[3px] border-background" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tracking-tight">{peer.name}</span>
            <span
              className={cn(
                'text-[9px] font-extrabold uppercase tracking-wider transition-colors',
                isPeerTyping ? 'text-primary animate-pulse' : 'text-emerald-500'
              )}
            >
              {isPeerTyping ? 'Typing...' : 'Online'}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6">
          <div className="space-y-6 pb-6 pt-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-24 text-center space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground font-semibold max-w-[180px] leading-relaxed">
                  This is the start of your encrypted conversation.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageRow
                  key={msg.id}
                  msg={msg}
                  isMine={msg.fromId !== '__system__' && msg.fromId === currentUserId}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 pt-1.5 border-t border-border/25">
        <div className="relative flex items-center gap-2 bg-muted/50 border border-border/80 rounded-2xl p-1.5 pr-2 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">
          <Textarea
            rows={1}
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            className="min-h-[40px] max-h-[100px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground/80 py-2.5 px-3.5 scrollbar-hide text-sm"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="h-8.5 w-8.5 shrink-0 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground/50 transition-all active:scale-95 shadow-sm"
          >
            <ArrowUp className="h-4.5 w-4.5 stroke-[2.5px]" />
          </Button>
        </div>
        <p className="text-[9px] text-center text-muted-foreground mt-2 font-bold uppercase tracking-wider">
          Press Enter to send
        </p>
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;
