"use client";

import { X, MessageCircle, ArrowUp } from "lucide-react";
import { useDiscoverChat } from "@/lib/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MessageRow from "../components/online-people/MessageRow";

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

export default function DiscoverChatView({
  peer,
  channel,
  currentUserId,
}: DiscoverChatViewProps) {
  const {
    messages,
    isPeerTyping,
    draft,
    bottomRef,
    textareaRef,
    handleSend,
    handleDraftChange,
    handleKeyDown,
    handleClose,
  } = useDiscoverChat(peer, channel);

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground animate-in fade-in duration-300">
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6 bg-white/2 backdrop-blur-md">
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
            <span className="text-sm font-semibold tracking-tight">
              {peer.name}
            </span>
            <span
              className={`text-xs ${isPeerTyping ? "text-primary animate-pulse font-medium" : "text-muted-foreground"}`}
            >
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

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.length === 0 ? (
            <div className="my-auto flex flex-col items-center justify-center py-24 text-center opacity-70">
              <MessageCircle
                className="mb-4 h-12 w-12 text-muted-foreground animate-pulse"
                strokeWidth={1.5}
              />
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
                isMine={
                  msg.fromId !== "__system__" && msg.fromId === currentUserId
                }
              />
            ))
          )}
          <div ref={bottomRef} className="h-1 shrink-0" />
        </div>
      </div>

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
