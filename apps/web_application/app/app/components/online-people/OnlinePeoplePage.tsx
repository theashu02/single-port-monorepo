"use client";

import React, { memo, useCallback, useMemo, useState } from "react";
import { MessageCircle, Search, Shield, UsersRound, Wifi, WifiOff, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type { OnlineUser } from "./OnlinePresenceProvider";
import { useOnlinePresence } from "./OnlinePresenceProvider";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { chatRequested, selectChatPeer, selectChatPhase, selectIsLocalChatLocked, type ChatPhase } from "@/lib/redux/slices/chatSlice";
import { selectBusyUsersCount, selectOtherUsersCount } from "@/lib/redux/slices/presenceSlice";

type PresenceFilter = "all" | "others" | "you";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarUrl(id: string, name: string): string {
  const seed = encodeURIComponent(id || name);
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear`;
}

function getStatusMessage(status: ReturnType<typeof useOnlinePresence>["status"], error: string | null): string {
  if (status === "connected") return "Realtime presence synced.";
  if (status === "connecting" || status === "resolving-user") return "Connecting to presence service…";
  if (status === "unauthenticated") return "Sign in or continue as a guest to appear online.";
  return error ?? "Start websocket_service — this page reconnects automatically.";
}

interface UserCardProps {
  user: OnlineUser;
  isCurrentUser: boolean;
  canChat: boolean;
  isActivePeer: boolean;
  isLocalChatLocked: boolean;
  chatPhase: ChatPhase;
  onChat: (user: OnlineUser) => void;
}

const UserCard = memo<UserCardProps>(function UserCard({ user, isCurrentUser, canChat, isActivePeer, isLocalChatLocked, chatPhase, onChat }) {
  const avatar = useMemo(() => getAvatarUrl(user.id, user.name), [user.id, user.name]);
  const isWaiting = isActivePeer && chatPhase === "awaiting-accept";
  const isChatting = isActivePeer && chatPhase === "open";
  const isBusyPhase = isActivePeer && chatPhase === "busy";
  const isExpired = isActivePeer && chatPhase === "expired";
  const isTargetBusy = !isCurrentUser && user.isBusy;

  const buttonLabel = isCurrentUser ? "You" : isWaiting ? "Waiting…" : isChatting ? "Chatting" : isBusyPhase || isTargetBusy ? "Busy" : isExpired ? "Timed out" : "Message";

  const buttonDisabled = !canChat || isCurrentUser || isTargetBusy || isBusyPhase || isWaiting || isLocalChatLocked;

  const handleChat = useCallback(() => onChat(user), [onChat, user]);

  return (
    <Card className="group relative w-full overflow-hidden border border-border bg-card shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">

      <CardContent className="p-5 pt-6">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
            <Avatar className="h-12 w-12 ring-2 ring-background">
              <AvatarImage src={avatar} alt={`${user.name}'s avatar`} className="object-cover" />
              <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground">{getInitials(user.name)}</AvatarFallback>
            </Avatar>

            <span aria-label={user.isBusy ? "Busy" : "Available"} className={cn("absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background", user.isBusy ? "bg-amber-500" : "bg-emerald-500")}>
              {!user.isBusy && <Zap className="h-2.5 w-2.5 text-white" aria-hidden />}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-base font-semibold text-foreground">{user.name}</span>
              {isCurrentUser && <Shield className="h-4 w-4 shrink-0 text-primary" aria-label="You" />}
            </div>

            <Badge variant="secondary" className={cn("h-5 w-fit rounded-md px-2 text-[10px] font-semibold uppercase tracking-wider transition-colors", user.isBusy ? "bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 dark:text-emerald-400")}>
              {user.isBusy ? "Occupied" : "Available"}
            </Badge>
          </div>
        </div>

        <Separator className="my-4 transition-colors group-hover:bg-border/60" />

        <Button type="button" size="sm" variant={isTargetBusy || isCurrentUser ? "secondary" : "default"} disabled={buttonDisabled} onClick={handleChat} className="w-full text-xs font-semibold shadow-none transition-all" aria-label={`${buttonLabel} — ${user.name}`}>
          <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden />
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
});

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-muted/30 p-3.5 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/10 p-8 text-center animate-in fade-in-50 duration-500">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border/50">
        <UsersRound className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">No users to show</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">{message}</p>
      </div>
    </div>
  );
}

interface FilterTabsProps {
  filters: Array<{ id: PresenceFilter; label: string }>;
  active: PresenceFilter;
  onChange: (id: PresenceFilter) => void;
}

function FilterTabs({ filters, active, onChange }: FilterTabsProps) {
  return (
    <div role="tablist" aria-label="Filter users" className="flex items-center gap-2 overflow-x-auto pb-1">
      {filters.map((f) => (
        <button
          key={f.id}
          role="tab"
          type="button"
          aria-selected={active === f.id}
          onClick={() => onChange(f.id)}
          className={cn("shrink-0 rounded-full px-4 h-8 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active === f.id ? "bg-primary text-primary-foreground shadow-sm" : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground")}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export const OnlinePeoplePage: React.FC = () => {
  const { users, currentUserId, status, error, requestChat } = useOnlinePresence();
  const dispatch = useAppDispatch();
  const chatPhase = useAppSelector(selectChatPhase);
  const chatPeer = useAppSelector(selectChatPeer);
  const isLocalChatLocked = useAppSelector(selectIsLocalChatLocked);
  const otherUsersCount = useAppSelector(selectOtherUsersCount);
  const busyUsersCount = useAppSelector(selectBusyUsersCount);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PresenceFilter>("all");

  const isConnected = status === "connected";

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        return a.name.localeCompare(b.name);
      }),
    [currentUserId, users],
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedUsers.filter((u) => {
      const matchesFilter = activeFilter === "all" || (activeFilter === "you" && u.id === currentUserId) || (activeFilter === "others" && u.id !== currentUserId);
      if (!matchesFilter) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    });
  }, [activeFilter, currentUserId, search, sortedUsers]);

  const handleChat = useCallback(
    (user: OnlineUser) => {
      if (!isConnected || isLocalChatLocked || user.id === currentUserId || user.isBusy) return;
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

  const statusMsg = getStatusMessage(status, error);

  return (
    <div className="flex h-full w-full min-w-0 flex-col gap-5 overflow-hidden bg-background p-4 text-foreground lg:p-6 lg:gap-6">
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {isConnected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", isConnected ? "bg-emerald-500" : "bg-amber-500")} aria-hidden />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{isConnected ? "Live Presence" : "Connecting"}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              <span className="text-primary">{users.length}</span> {users.length === 1 ? "User" : "Users"} Online
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{statusMsg}</p>
          </div>

          <div className="grid min-w-[240px] grid-cols-2 gap-3">
            <StatCard label="Others" value={otherUsersCount} icon={<UsersRound className="h-4 w-4" aria-hidden />} />
            <StatCard label="Busy" value={busyUsersCount} icon={isConnected ? <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden /> : <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[320px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or ID…" className="pl-9 h-10 rounded-full bg-muted/40 border-border focus-visible:ring-primary/50" aria-label="Search users" />
        </div>

        <FilterTabs filters={filters} active={activeFilter} onChange={setActiveFilter} />
      </div>

      <ScrollArea className="min-h-0 flex-1 px-1">
        {filteredUsers.length === 0 ? (
          <EmptyState message={search ? `No results found for "${search}"` : statusMsg} />
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} isCurrentUser={user.id === currentUserId} canChat={isConnected} isActivePeer={chatPeer?.id === user.id} isLocalChatLocked={isLocalChatLocked} chatPhase={chatPhase} onChat={handleChat} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default OnlinePeoplePage;
