"use client";

import React, { memo } from "react";
import { Phone, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatInvite } from "@/lib/hooks/useChatInvite";

const ChatInvitePopup: React.FC = memo(() => {
  const { phase, peer, handleAccept, handleReject } = useChatInvite();

  if (phase !== "incoming-invite" || !peer) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex items-center justify-center px-4 pointer-events-none">
      <Card className="pointer-events-auto w-full max-w-[380px] overflow-hidden border-border bg-background/80 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-500 zoom-in-95 rounded-2xl">
        <CardContent className="p-0">
          <div className="h-1.5 w-full bg-primary" />

          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-14 w-14 border-2 border-primary/20 p-0.5">
                  <AvatarImage src={peer.avatarUrl} alt={peer.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-background"></span>
                </span>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] uppercase tracking-wider font-bold border-none"
                  >
                    Live Request
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">
                    Just now
                  </span>
                </div>
                <h3 className="text-lg font-semibold leading-none tracking-tight text-foreground">
                  {peer.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  Started a new conversation
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleReject}
                className="flex-1 h-11 rounded-xl border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all active:scale-95"
              >
                <X className="mr-2 h-4 w-4" />
                Decline
              </Button>

              <Button
                onClick={handleAccept}
                className="flex-1 h-11 rounded-xl bg-primary hover:opacity-90 text-primary-foreground shadow-md transition-all active:scale-95"
              >
                <Phone className="mr-2 h-4 w-4 fill-current" />
                Accept
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ChatInvitePopup.displayName = "ChatInvitePopup";

export default ChatInvitePopup;
