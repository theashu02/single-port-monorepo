"use client";

import React from "react";
import Image from "next/image";
import { Search, Grid3X3, List, UserPlus, Star, Ellipsis, MessageCircle, Phone, Video } from "lucide-react";

// --- Types ---
interface StatData {
  emoji: string;
  label: string;
  value: string | number;
  gradient: string;
}

interface FilterTab {
  label: string;
  count: number;
  isActive?: boolean;
}

interface Friend {
  id: string;
  name: string;
  handle: string;
  statusText: string;
  isOnline: boolean;
  seed: string;
  isFavorite?: boolean;
}

// --- Mock Data ---
const stats: StatData[] = [
  { emoji: "💜", label: "Total Friends", value: 7, gradient: "from-violet-500 to-fuchsia-500" },
  { emoji: "🟢", label: "Online Now", value: 4, gradient: "from-emerald-400 to-teal-500" },
  { emoji: "💬", label: "Messages Today", value: 23, gradient: "from-cyan-400 to-blue-500" },
  { emoji: "🔥", label: "Vibe Streak", value: "12 days", gradient: "from-orange-400 to-rose-500" },
];

const filters: FilterTab[] = [
  { label: "All", count: 7, isActive: true },
  { label: "Online", count: 4 },
  { label: "Offline", count: 3 },
  { label: "Favorites", count: 2 },
  { label: "Recent", count: 5 },
];

const mockFriends: Friend[] = [
  { id: "1", name: "Aria Vex", handle: "@ariavibes", statusText: "✨ chillin", isOnline: true, seed: "@ariavibes", isFavorite: true },
  { id: "2", name: "Neo Hart", handle: "@neoxx", statusText: "🎧 lofi mode", isOnline: true, seed: "@neoxx", isFavorite: true },
  { id: "3", name: "Luna Riot", handle: "@lunariot", statusText: "last seen 2h ago", isOnline: false, seed: "@lunariot", isFavorite: true },
  { id: "4", name: "Kai Storm", handle: "@kaistorm", statusText: "🔥 grindin", isOnline: true, seed: "@kaistorm", isFavorite: true },
  { id: "5", name: "Zoe Pulse", handle: "@zoepulse", statusText: "last seen 1d ago", isOnline: false, seed: "@zoepulse", isFavorite: true },
  { id: "6", name: "Rey Volt", handle: "@reyvolt", statusText: "🚀 bored af", isOnline: true, seed: "@reyvolt", isFavorite: true },
  { id: "7", name: "Mika Glow", handle: "@mikaglow", statusText: "last seen 5h ago", isOnline: false, seed: "@mikaglow", isFavorite: true },
];

// --- Sub-Components ---
const FriendCard: React.FC<{ friend: Friend }> = ({ friend }) => {
  return (
    <div className="glass border border-white/10 rounded-2xl p-4 relative group overflow-hidden">
      {/* Hover Background Effect */}
      <div className="absolute inset-0 bg-linear-to-br from-violet-500/0 via-violet-500/0 to-cyan-400/0 group-hover:from-violet-500/10 group-hover:to-cyan-400/10 transition"></div>

      <div className="relative flex items-start gap-3">
        {/* Avatar */}
        <div className="relative">
          <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14 ring-2 ring-white/10">
            <Image className="aspect-square h-full w-full object-cover" src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear`} alt={`${friend.name}'s avatar`} fill />
          </span>
          <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-[#0c0a18] ${friend.isOnline ? "bg-emerald-400 pulse-ring" : "bg-zinc-500"}`}></span>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold truncate">{friend.name}</p>
            {friend.isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" aria-hidden="true" />}
          </div>
          <p className="text-xs text-white/50 truncate">{friend.handle}</p>
          <p className="text-xs text-white/70 mt-1 truncate">{friend.statusText}</p>
        </div>

        {/* Options Menu */}
        <button className="opacity-0 group-hover:opacity-100 transition text-white/50 hover:text-white" aria-label="More options">
          <Ellipsis className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow hover:bg-primary/90 px-3 h-9 rounded-xl bg-linear-to-r from-violet-500 to-fuchsia-500 text-white text-xs hover:opacity-90">
          <MessageCircle className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Chat
        </button>
        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground px-3 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-xs" aria-label="Audio call">
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground px-3 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-xs" aria-label="Video call">
          <Video className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export const FriendList: React.FC = () => {
  return (
    <div className="flex flex-col w-full h-full p-4 lg:p-6 gap-4 min-w-0 overflow-hidden">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <div key={index} className="glass border border-white/10 rounded-2xl p-4 relative overflow-hidden">
            <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-linear-to-br ${stat.gradient} opacity-30 blur-2xl`}></div>
            <div className="relative">
              <div className="text-2xl mb-1">{stat.emoji}</div>
              <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">{stat.label}</div>
              <div className="text-2xl font-black mt-0.5">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar (Search & Actions) */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" aria-hidden="true" />
          <input
            className="flex w-full border px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-9 h-10 bg-white/5 border-white/10 rounded-xl text-sm placeholder:text-white/30 focus-visible:ring-violet-500/50"
            placeholder="Search your circle..."
          />
        </div>

        {/* View Toggles */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          <button className="grid place-items-center h-8 w-8 rounded-lg transition bg-violet-500/30 text-white" aria-label="Grid view">
            <Grid3X3 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button className="grid place-items-center h-8 w-8 rounded-lg transition text-white/50 hover:text-white" aria-label="List view">
            <List className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow hover:bg-primary/90 px-4 py-2 h-10 rounded-xl bg-linear-to-r from-violet-500 to-cyan-400 text-white font-semibold hover:opacity-90">
          <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Friend
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((filter, index) => (
          <button key={index} className={`shrink-0 px-4 h-9 rounded-full text-xs font-semibold transition flex items-center gap-2 ${filter.isActive ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"}`}>
            {filter.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter.isActive ? "bg-black/10" : "bg-white/10"}`}>{filter.count}</span>
          </button>
        ))}
      </div>

      {/* Friends Grid Area */}
      <div className="relative overflow-y-auto flex-1 -mx-2 px-2 scrollbar-hide">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pb-6">
          {mockFriends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendList;
