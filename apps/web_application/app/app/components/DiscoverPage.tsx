"use client";

import { useCallback } from "react";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  selectMatchmakingPhase,
  selectQueuePosition,
  selectSearchStartedAt,
} from "@/lib/redux/slices/matchmakingSlice";
import {
  selectChatPhase,
  selectChatChannel,
  selectChatPeer,
} from "@/lib/redux/slices/chatSlice";
import {
  selectCurrentUserId,
  selectUserCount,
} from "@/lib/redux/slices/presenceSlice";
import { useOnlinePresenceActions } from "../online-people/OnlinePresenceProvider";

import IdleView from "../discover/IdleView";
import SearchingView from "../discover/SearchingView";
import DiscoverChatView from "../discover/DiscoverChatView";
import { useElapsedTimer } from "@/lib/hooks";

export default function DiscoverPage() {
  const { startMatchmaking, cancelMatchmaking } = useOnlinePresenceActions();
  const matchmakingPhase = useAppSelector(selectMatchmakingPhase);
  const queuePosition = useAppSelector(selectQueuePosition);
  const searchStartedAt = useAppSelector(selectSearchStartedAt);
  const chatPhase = useAppSelector(selectChatPhase);
  const chatPeer = useAppSelector(selectChatPeer);
  const onlineCount = useAppSelector(selectUserCount);
  const currentUserId = useAppSelector(selectCurrentUserId);
  const chatChannel = useAppSelector(selectChatChannel);

  const elapsed = useElapsedTimer(searchStartedAt);

  const handleStart = useCallback(() => {
    startMatchmaking();
  }, [startMatchmaking]);

  const handleCancel = useCallback(() => {
    cancelMatchmaking();
  }, [cancelMatchmaking]);

  const isInChat = chatPhase === "open";
  const isSearching = matchmakingPhase === "searching";

  return (
    <div className="w-full h-full min-w-0 bg-background sm:p-4 lg:p-6 animate-in fade-in duration-300">
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
