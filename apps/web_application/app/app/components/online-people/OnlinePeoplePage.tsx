"use client";

import React, { memo, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { MessageCircle, Search, UsersRound, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnlineUser } from "./OnlinePresenceProvider";
import { useOnlinePresence } from "./OnlinePresenceProvider";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  chatRequested,
  selectChatPeer,
  selectChatPhase,
  selectIsLocalChatLocked,
  type ChatPhase,
} from "@/lib/redux/slices/chatSlice";
import {
  selectBusyUsersCount,
  selectOtherUsersCount,
} from "@/lib/redux/slices/presenceSlice";

type PresenceFilter = "all" | "others" | "you";

function statusMessage(
  status: ReturnType<typeof useOnlinePresence>["status"],
  error: string | null,
) {
  if (status === "connected")
    return "Realtime presence is synced from websocket_service.";
  if (status === "connecting" || status === "resolving-user")
    return "Connecting to websocket_service...";
  if (status === "unauthenticated")
    return "Sign in or continue as a guest to appear in the online list.";
  return (
    error ||
    "Start websocket_service and this page will reconnect automatically."
  );
}

const UserCard: React.FC<{
  user: OnlineUser;
  isCurrentUser: boolean;
  canChat: boolean;
  isActivePeer: boolean;
  isLocalChatLocked: boolean;
  chatPhase: ChatPhase;
  onChat: (user: OnlineUser) => void;
}> = memo(
  ({
    user,
    isCurrentUser,
    canChat,
    isActivePeer,
    isLocalChatLocked,
    chatPhase,
    onChat,
  }) => {
    const avatar = useMemo(() => {
      const seed = encodeURIComponent(user.id || user.name);
      return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear`;
    }, [user.id, user.name]);

    const isWaitingForThisUser =
      isActivePeer && chatPhase === "awaiting-accept";
    const isChattingWithThisUser = isActivePeer && chatPhase === "open";
    const isBusyForThisUser = isActivePeer && chatPhase === "busy";
    const isExpiredForThisUser = isActivePeer && chatPhase === "expired";
    const isTargetBusy = !isCurrentUser && user.isBusy;

    const buttonLabel = isCurrentUser
      ? "This is you"
      : isWaitingForThisUser
        ? "Waiting..."
        : isChattingWithThisUser
          ? "Chatting"
          : isBusyForThisUser || isTargetBusy
            ? "Busy"
            : isExpiredForThisUser
              ? "Timed out"
              : "Chat";
    const buttonDisabled =
      !canChat ||
      isCurrentUser ||
      isTargetBusy ||
      isBusyForThisUser ||
      isWaitingForThisUser ||
      isLocalChatLocked;
    const buttonClassName = isTargetBusy
      ? "mt-3 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-70 shadow px-3 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold"
      : "mt-3 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-primary-foreground shadow hover:opacity-90 px-3 h-8 rounded-lg bg-primary text-[11px] font-semibold";

    const handleChat = useCallback(() => {
      onChat(user);
    }, [onChat, user]);

    return (
      <div className="glass border border-border rounded-2xl p-4 relative group overflow-hidden bg-card/30">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 blur-2xl transition" />

        <div className="relative flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary blur-md opacity-20 group-hover:opacity-40 transition" />
            <span className="flex shrink-0 overflow-hidden rounded-full relative h-20 w-20 ring-2 ring-border/50">
              <Image
                className="aspect-square h-full w-full object-cover"
                src={avatar}
                alt={`${user.name}'s avatar`}
                fill
                sizes="80px"
              />
            </span>
            <span
              className={`absolute -bottom-0.5 right-1 h-4 w-4 rounded-full ring-2 ring-background ${user.isBusy ? "bg-amber-500" : "bg-emerald-500 pulse-ring"}`}
            />
          </div>

          <p className="mt-3 text-sm font-bold truncate w-full text-foreground">{user.name}</p>
          <p className="text-[11px] text-muted-foreground truncate w-full">
            {isCurrentUser
              ? user.isBusy
                ? "You are in a chat"
                : "You are online"
              : user.isBusy
                ? "In a chat"
                : "Using the app now"}
          </p>

          <div className="flex gap-1 mt-2 flex-wrap justify-center">
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live
            </span>
            {!isCurrentUser && user.isBusy && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Busy
              </span>
            )}
            {isCurrentUser && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                You
              </span>
            )}
          </div>

          <Button
            type="button"
            onClick={handleChat}
            disabled={buttonDisabled}
            className={buttonClassName}
          >
            <MessageCircle className="h-3 w-3" aria-hidden="true" />
            {buttonLabel}
          </Button>
        </div>
      </div>
    );
  },
);
UserCard.displayName = "UserCard";

export const OnlinePeoplePage: React.FC = () => {
  const { users, currentUserId, status, error, requestChat } =
    useOnlinePresence();
  const dispatch = useAppDispatch();
  const chatPhase = useAppSelector(selectChatPhase);
  const chatPeer = useAppSelector(selectChatPeer);
  const isLocalChatLocked = useAppSelector(selectIsLocalChatLocked);
  const otherUsersCount = useAppSelector(selectOtherUsersCount);
  const busyUsersCount = useAppSelector(selectBusyUsersCount);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PresenceFilter>("all");

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
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "you" && user.id === currentUserId) ||
        (activeFilter === "others" && user.id !== currentUserId);
      if (!matchesFilter) return false;
      if (!query) return true;
      return (
        user.name.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      );
    });
  }, [activeFilter, currentUserId, search, sortedUsers]);

  const isConnected = status === "connected";
  const showEmptyState = filteredUsers.length === 0;

  const handleChat = useCallback(
    (user: OnlineUser) => {
      if (
        !isConnected ||
        isLocalChatLocked ||
        user.id === currentUserId ||
        user.isBusy
      )
        return;
      if (requestChat(user.id)) {
        dispatch(chatRequested(user));
      }
    },
    [currentUserId, dispatch, isConnected, isLocalChatLocked, requestChat],
  );

  const filters: Array<{ id: PresenceFilter; label: string }> = [
    { id: "all", label: `All (${users.length})` },
    { id: "others", label: `Others (${otherUsersCount})` },
    { id: "you", label: "You" },
  ];

  return (
    <div className="flex flex-col w-full h-full p-4 lg:p-6 gap-4 min-w-0 overflow-hidden bg-background text-foreground">
      <div className="relative rounded-3xl overflow-hidden border border-border glass p-6 grid-bg bg-card/30">
        <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`relative h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-500 pulse-ring" : "bg-amber-500"}`}
              />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
                Live Presence
              </span>
            </div>
            <h2 className="text-3xl font-black mt-2">
              <span className="text-primary">{users.length}</span>{" "}
              {users.length === 1 ? "user" : "users"} online
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {statusMessage(status, error)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 min-w-[220px]">
            <div className="rounded-2xl glass border border-border p-3 bg-card/50">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                <UsersRound className="h-4 w-4" aria-hidden="true" />
                Other users
              </div>
              <p className="mt-1 text-2xl font-black text-foreground">{otherUsersCount}</p>
            </div>
            <div className="rounded-2xl glass border border-border p-3 bg-card/50">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                {isConnected ? (
                  <Wifi
                    className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                ) : (
                  <WifiOff
                    className="h-4 w-4 text-amber-600 dark:text-amber-400"
                    aria-hidden="true"
                  />
                )}
                Busy now
              </div>
              <p className="mt-1 text-sm font-bold text-foreground">
                {busyUsersCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex w-full border border-border px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-9 h-10 bg-secondary/50 rounded-xl text-sm placeholder:text-muted-foreground focus-visible:border-primary/50"
            placeholder="Search live users by name or id..."
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setActiveFilter(filter.id)}
            className={`shrink-0 px-4 h-8 rounded-full text-xs font-semibold capitalize transition ${activeFilter === filter.id ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground border border-border"}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="relative overflow-y-auto flex-1 -mx-2 px-2 scrollbar-hide">
        {showEmptyState ? (
          <div className="h-full min-h-[260px] grid place-items-center text-center">
            <div className="max-w-sm rounded-3xl glass border border-border p-6 bg-card/30">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary grid place-items-center text-secondary-foreground">
                <UsersRound className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">
                {search
                  ? "No matching online users"
                  : "No online users to show"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground/80">
                {statusMessage(status, error)}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-6">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUserId}
                canChat={isConnected}
                isActivePeer={chatPeer?.id === user.id}
                isLocalChatLocked={isLocalChatLocked}
                chatPhase={chatPhase}
                onChat={handleChat}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlinePeoplePage;
