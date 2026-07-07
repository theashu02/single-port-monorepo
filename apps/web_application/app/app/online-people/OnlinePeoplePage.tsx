'use client';

import React from 'react';
import { Search, UsersRound, Wifi, WifiOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { getStatusMessage } from '@/lib/utils/presenceUtils';
import { useOnlinePeopleFilters, type PresenceFilter } from '@/lib/hooks/useOnlinePeopleFilters';
import UserCard from './UserCard';
import StatCard from './StatCard';
import EmptyState from './EmptyState';
import FilterTabs from './FilterTabs';

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
    { id: 'all', label: `Loaded (${loadedUserCount})` },
    { id: 'others', label: `Others (${otherUsersCount})` },
    { id: 'you', label: 'You' },
  ];

  const statusMsg = getStatusMessage(status, error);

  return (
    <div className="flex h-full w-full min-w-0 flex-col gap-6 overflow-hidden bg-background/50 p-4 text-foreground lg:p-6">
      {/* Header Panel with Glassmorphism and Ambient Glow */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/75 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-52 w-52 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={cn(
                    'relative inline-flex h-2 w-2 rounded-full',
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                />
              </span>
              <span
                className={cn(
                  'text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border',
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                )}
              >
                {isConnected ? 'Live Presence' : 'Connecting'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              <span className="text-primary">{userCount}</span> {userCount === 1 ? 'User' : 'Users'}{' '}
              Online
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              {statusMsg} Showing {loadedUserCount} active profiles to keep the realtime view fast.
            </p>
          </div>

          <div className="grid min-w-64 grid-cols-2 gap-4">
            <StatCard
              label="Others"
              value={otherUsersCount}
              icon={<UsersRound className="h-4 w-4 text-muted-foreground" aria-hidden />}
            />
            <StatCard
              label="Busy"
              value={busyUsersCount}
              icon={
                isConnected ? (
                  <Wifi className="h-4 w-4 text-emerald-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-500" />
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[320px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            className="pl-10 h-11 rounded-2xl bg-muted/40 border border-border/40 focus-visible:bg-background focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all duration-300 shadow-sm"
          />
        </div>

        <FilterTabs filters={filters} active={activeFilter} onChange={setActiveFilter} />
      </div>

      {/* Grid of Users */}
      <ScrollArea className="min-h-0 flex-1 px-1">
        {filteredUsers.length === 0 ? (
          <EmptyState message={search ? `No results found for "${search}"` : statusMsg} />
        ) : (
          <div className="grid grid-cols-1 gap-5 pb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
