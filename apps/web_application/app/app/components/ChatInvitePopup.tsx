"use client";

import React, { memo, useCallback } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { useOnlinePresence } from "./OnlinePresenceProvider";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { chatClosed, chatRequested, selectChatPeer, selectChatPhase } from "@/lib/redux/slices/chatSlice";
import { Button } from "@/components/ui/button";

/**
 * Reads incoming invite state directly from Redux — zero prop drilling,
 * zero useEffect subscriptions. Renders only when phase === "incoming-invite".
 *
 * The single WebSocket in OnlinePresenceProvider dispatches inviteReceived
 * synchronously in onmessage, so this popup appears with zero extra latency.
 */
const ChatInvitePopup: React.FC = memo(() => {
  const dispatch = useAppDispatch();
  const phase = useAppSelector(selectChatPhase);
  const peer = useAppSelector(selectChatPeer);
  const { acceptChat, rejectChat } = useOnlinePresence();

  const handleAccept = useCallback(() => {
    if (!peer) return;
    acceptChat(peer.id);
    // chatReady will be dispatched by OnlinePresenceProvider when server responds.
    // chatRequested is used here only to record ourselves as the "accepter" peer
    // so that when chat_ready fires, the Redux state has the full peer object.
    dispatch(chatRequested(peer));
  }, [acceptChat, dispatch, peer]);

  const handleReject = useCallback(() => {
    if (!peer) return;
    rejectChat(peer.id);
    dispatch(chatClosed());
  }, [dispatch, peer, rejectChat]);

  if (phase !== "incoming-invite" || !peer) return null;

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300" role="dialog" aria-modal="true" aria-label={`Chat request from ${peer.name}`}>
        {/* Card */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 glass p-6 shadow-2xl">
          {/* Decorative blurs */}
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-violet-500/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Icon ring */}
            <div className="mx-auto h-14 w-14 rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <MessageCircle className="h-7 w-7 text-white" aria-hidden="true" />
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-violet-300">Chat Request</p>
              <h3 className="mt-1 text-lg font-black">
                <span className="text-gradient">{peer.name}</span>
              </h3>
              <p className="mt-1 text-sm text-white/55">wants to start a conversation with you</p>
            </div>

            <div className="mt-6 flex gap-3">
              {/* Reject */}
              <Button
                type="button"
                onClick={handleReject}
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Decline
              </Button>

              {/* Accept */}
              <Button
                type="button"
                onClick={handleAccept}
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-linear-to-r from-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-violet-500/30 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Accept
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatInvitePopup.displayName = "ChatInvitePopup";

export default ChatInvitePopup;
