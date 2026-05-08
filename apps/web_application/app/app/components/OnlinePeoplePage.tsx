"use client";

import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { MessageCircle, Search, UsersRound, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnlineUser } from "./OnlinePresenceProvider";
import { useOnlinePresence } from "./OnlinePresenceProvider";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { chatRequested, selectChatPhase } from "@/lib/redux/slices/chatSlice";
import dynamic from "next/dynamic";

// Lazy-load chat UI — zero bundle cost until first interaction.
const ChatInvitePopup = dynamic(() => import("./ChatInvitePopup"), { ssr: false });
const ChatWindow = dynamic(() => import("./ChatWindow"), { ssr: false });

type PresenceFilter = "all" | "others" | "you";

const statusLabels: Record<ReturnType<typeof useOnlinePresence>["status"], string> = {
  "resolving-user": "Resolving user",
  unauthenticated: "Not signed in",
  connecting: "Connecting",
  connected: "Live",
  disconnected: "Reconnecting",
  error: "Connection issue",
};

function statusMessage(status: ReturnType<typeof useOnlinePresence>["status"], error: string | null) {
  if (status === "connected") return "Realtime presence is synced from websocket_service.";
  if (status === "connecting" || status === "resolving-user") return "Connecting to websocket_service...";
  if (status === "unauthenticated") return "Sign in or continue as a guest to appear in the online list.";
  return error || "Start websocket_service and this page will reconnect automatically.";
}

// ── UserCard ──────────────────────────────────────────────────────────────────

const UserCard: React.FC<{
  user: OnlineUser;
  isCurrentUser: boolean;
  canChat: boolean;
  isPending: boolean;
  onChat: () => void;
}> = memo(({ user, isCurrentUser, canChat, isPending, onChat }) => {
  const avatar = useMemo(() => {
    const seed = encodeURIComponent(user.id || user.name);
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear`;
  }, [user.id, user.name]);

  const buttonLabel = isCurrentUser ? "This is you" : isPending ? "Waiting…" : "Chat";
  const buttonDisabled = !canChat || isCurrentUser || isPending;

  return (
    <div className="glass border border-white/10 rounded-2xl p-4 relative group overflow-hidden">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br from-violet-500/30 to-cyan-400/20 opacity-0 group-hover:opacity-100 blur-2xl transition" />

      <div className="relative flex flex-col items-center text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-linear-to-br from-violet-500 to-cyan-400 blur-md opacity-50 group-hover:opacity-80 transition" />
          <span className="flex shrink-0 overflow-hidden rounded-full relative h-20 w-20 ring-2 ring-white/20">
            <Image className="aspect-square h-full w-full object-cover" src={avatar} alt={`${user.name}'s avatar`} fill sizes="80px" />
          </span>
          <span className="pulse-ring absolute -bottom-0.5 right-1 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-[#0c0a18]" />
        </div>

        <p className="mt-3 text-sm font-bold truncate w-full">{user.name}</p>
        <p className="text-[11px] text-white/50 truncate w-full">{isCurrentUser ? "You are online" : "Using the app now"}</p>

        <div className="flex gap-1 mt-2 flex-wrap justify-center">
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-300 border border-emerald-400/15">Live</span>
          {isCurrentUser && <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/60">You</span>}
        </div>

        <Button
          type="button"
          onClick={onChat}
          disabled={buttonDisabled}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-primary-foreground shadow hover:bg-primary/90 px-3 h-8 rounded-lg bg-linear-to-r from-violet-500 to-fuchsia-500 text-[11px] font-semibold"
        >
          <MessageCircle className="h-3 w-3" aria-hidden="true" />
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
});
UserCard.displayName = "UserCard";

// ── Page ──────────────────────────────────────────────────────────────────────

export const OnlinePeoplePage: React.FC = () => {
  const { users, userCount, currentUserId, status, error, requestChat } = useOnlinePresence();
  const dispatch = useAppDispatch();
  const chatPhase = useAppSelector(selectChatPhase);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PresenceFilter>("all");

  /**
   * Stable per-card handler cache. Each user gets one stable function reference,
   * created once and reused — UserCard.memo() will not re-render unless the user
   * data itself changes.
   *
   * This also prevents the "click 2-3 times" issue: the handler dispatches
   * chatRequested synchronously (optimistic UI) and sends the WS frame in the
   * same call stack, so the button disables immediately via Redux state.
   */
  const handlersRef = useRef<Map<string, () => void>>(new Map());
  const getOnChat = useCallback(
    (user: OnlineUser) => {
      const cached = handlersRef.current.get(user.id);
      if (cached) return cached;
      const handler = () => {
        // 1. Optimistic Redux update — button disables immediately (no delay).
        dispatch(chatRequested(user));
        // 2. Send the WS frame — server will respond with chat_invite to the peer.
        requestChat(user.id);
      };
      handlersRef.current.set(user.id, handler);
      return handler;
    },
    [dispatch, requestChat],
  );

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [currentUserId, users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortedUsers.filter((user) => {
      const matchesFilter = activeFilter === "all" || (activeFilter === "you" && user.id === currentUserId) || (activeFilter === "others" && user.id !== currentUserId);
      if (!matchesFilter) return false;
      if (!query) return true;
      return user.name.toLowerCase().includes(query) || user.id.toLowerCase().includes(query);
    });
  }, [activeFilter, currentUserId, search, sortedUsers]);

  const otherUsersCount = currentUserId ? userCount - (users.some((u) => u.id === currentUserId) ? 1 : 0) : userCount;
  const isConnected = status === "connected";
  const showEmptyState = filteredUsers.length === 0;

  const filters: Array<{ id: PresenceFilter; label: string }> = [
    { id: "all", label: `All (${users.length})` },
    { id: "others", label: `Others (${otherUsersCount})` },
    { id: "you", label: "You" },
  ];

  return (
    <>
      <div className="flex flex-col w-full h-full p-4 lg:p-6 gap-4 min-w-0 overflow-hidden">
        {/* Stats banner */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 glass p-6 grid-bg">
          <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`relative h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-400 pulse-ring" : "bg-amber-300"}`} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Live Presence</span>
              </div>
              <h2 className="text-3xl font-black mt-2">
                <span className="text-gradient">{users.length}</span> {users.length === 1 ? "user" : "users"} online
              </h2>
              <p className="text-sm text-white/60 mt-1">{statusMessage(status, error)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 min-w-[220px]">
              <div className="rounded-2xl glass border border-white/10 p-3">
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <UsersRound className="h-4 w-4" aria-hidden="true" />
                  Other users
                </div>
                <p className="mt-1 text-2xl font-black">{otherUsersCount}</p>
              </div>
              <div className="rounded-2xl glass border border-white/10 p-3">
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  {isConnected ? <Wifi className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : <WifiOff className="h-4 w-4 text-amber-300" aria-hidden="true" />}
                  Socket
                </div>
                <p className="mt-1 text-sm font-bold text-white/80">{statusLabels[status]}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex w-full border px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-9 h-10 bg-white/5 border-white/10 rounded-xl text-sm placeholder:text-white/30 focus-visible:ring-violet-500/50"
              placeholder="Search live users by name or id..."
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`shrink-0 px-4 h-8 rounded-full text-xs font-semibold capitalize transition ${activeFilter === filter.id ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white" : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* User grid */}
        <div className="relative overflow-y-auto flex-1 -mx-2 px-2 scrollbar-hide">
          {showEmptyState ? (
            <div className="h-full min-h-[260px] grid place-items-center text-center">
              <div className="max-w-sm rounded-3xl glass border border-white/10 p-6">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-white/5 grid place-items-center text-white/70">
                  <UsersRound className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-bold">{search ? "No matching online users" : "No online users to show"}</h3>
                <p className="mt-2 text-sm text-white/55">{statusMessage(status, error)}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-6">
              {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} isCurrentUser={user.id === currentUserId} canChat={isConnected} isPending={chatPhase === "awaiting-accept"} onChat={getOnChat(user)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* These components self-render based on Redux state — no props needed. */}
      <ChatInvitePopup />
      <ChatWindow />
    </>
  );
};

export default OnlinePeoplePage;
