"use client";

import React from "react";
import { Search, UsersRound, Wifi, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { getStatusMessage } from "@/lib/utils/presenceUtils";
import {
  useOnlinePeopleFilters,
  type PresenceFilter,
} from "@/lib/hooks/useOnlinePeopleFilters";
import UserCard from "./UserCard";
import StatCard from "./StatCard";
import EmptyState from "./EmptyState";
import FilterTabs from "./FilterTabs";

export const OnlinePeoplePage: React.FC = () => {
  const {
    userCount,
    currentUserId,
    status,
    error,
    chatPhase,
    chatPeer,
    isLocalChatLocked,
    otherUsersCount,
    busyUsersCount,
    loadedUserCount,
    search,
    setSearch,
    activeFilter,
    setActiveFilter,
    filteredUsers,
    isConnected,
    handleChat,
  } = useOnlinePeopleFilters();

  const filters: Array<{ id: PresenceFilter; label: string }> = [
    { id: "all", label: `Loaded (${loadedUserCount})` },
    { id: "others", label: `Others (${otherUsersCount})` },
    { id: "you", label: "You" },
  ];

  const statusMsg = getStatusMessage(status, error);

  return (
    <div className="flex h-full w-full min-w-0 flex-col gap-5 overflow-hidden bg-background p-4 text-foreground lg:p-6 lg:gap-6">
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {isConnected && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={cn(
                    "relative inline-flex h-2.5 w-2.5 rounded-full",
                    isConnected ? "bg-emerald-500" : "bg-amber-500",
                  )}
                />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {isConnected ? "Live Presence" : "Connecting"}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              <span className="text-primary">{userCount}</span>{" "}
              {userCount === 1 ? "User" : "Users"} Online
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {statusMsg} Showing {loadedUserCount} active profiles to keep the
              realtime view fast.
            </p>
          </div>

          <div className="grid min-w-60 grid-cols-2 gap-3">
            <StatCard
              label="Others"
              value={otherUsersCount}
              icon={<UsersRound className="h-4 w-4" aria-hidden />}
            />
            <StatCard
              label="Busy"
              value={busyUsersCount}
              icon={
                isConnected ? (
                  <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[320px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            className="pl-9 h-10 rounded-xl bg-muted/40 border-none "
          />
        </div>

        <FilterTabs
          filters={filters}
          active={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      <ScrollArea className="min-h-0 flex-1 px-1">
        {filteredUsers.length === 0 ? (
          <EmptyState
            message={search ? `No results found for "${search}"` : statusMsg}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      </ScrollArea>
    </div>
  );
};

export default OnlinePeoplePage;
