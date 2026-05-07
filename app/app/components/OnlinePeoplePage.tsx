"use client";

import React from "react";
import Image from "next/image";
import { Search, Filter, MessageCircle, UserPlus } from "lucide-react";

// --- Types ---
interface User {
  id: string;
  username: string;
  location: string;
  age: number;
  tags: string[];
  seed: string;
}

// --- Mock Data ---
const tags = ["✨ All", "#anime", "#art", "#music", "#gaming", "#film", "#travel", "#fashion"];

const flags = [
  { emoji: "🇯🇵", yOffset: -3.38 },
  { emoji: "🇬🇧", yOffset: -0.56 },
  { emoji: "🇧🇷", yOffset: -2.5 },
  { emoji: "🇺🇸", yOffset: -2.88 },
  { emoji: "🇩🇪", yOffset: -0.03 },
  { emoji: "🇰🇷", yOffset: -1.72 },
];

const mockUsers: User[] = [
  { id: "1", username: "pixel_dreamer", location: "🇯🇵 JP", age: 21, tags: ["#anime", "#lo-fi"], seed: "pixel_dreamer" },
  { id: "2", username: "midnight.eko", location: "🇬🇧 UK", age: 23, tags: ["#indie", "#art"], seed: "midnight.eko" },
  { id: "3", username: "velvet_riot", location: "🇧🇷 BR", age: 19, tags: ["#samba", "#gym"], seed: "velvet_riot" },
  { id: "4", username: "static.witch", location: "🇺🇸 US", age: 22, tags: ["#memes", "#tarot"], seed: "static.witch" },
  { id: "5", username: "zero_dawn", location: "🇩🇪 DE", age: 25, tags: ["#edm", "#gaming"], seed: "zero_dawn" },
  { id: "6", username: "cosmic.bun", location: "🇰🇷 KR", age: 20, tags: ["#kpop", "#art"], seed: "cosmic.bun" },
  { id: "7", username: "soft_sabre", location: "🇨🇦 CA", age: 24, tags: ["#skate", "#film"], seed: "soft_sabre" },
  { id: "8", username: "lush_valor", location: "🇮🇳 IN", age: 22, tags: ["#poetry", "#tea"], seed: "lush_valor" },
  { id: "9", username: "glitch.queen", location: "🇫🇷 FR", age: 26, tags: ["#fashion", "#films"], seed: "glitch.queen" },
  { id: "10", username: "ember_loop", location: "🇲🇽 MX", age: 23, tags: ["#salsa", "#cooking"], seed: "ember_loop" },
  { id: "11", username: "echo_drift", location: "🇳🇱 NL", age: 24, tags: ["#techno", "#art"], seed: "echo_drift" },
  { id: "12", username: "stardust.ix", location: "🇸🇪 SE", age: 19, tags: ["#poetry", "#film"], seed: "stardust.ix" },
  { id: "13", username: "vapor_clip", location: "🇦🇺 AU", age: 25, tags: ["#surf", "#vinyl"], seed: "vapor_clip" },
  { id: "14", username: "crimson.io", location: "🇮🇹 IT", age: 21, tags: ["#food", "#dance"], seed: "crimson.io" },
  { id: "15", username: "neon_paws", location: "🇹🇭 TH", age: 22, tags: ["#cats", "#anime"], seed: "neon_paws" },
  { id: "16", username: "sable_lyre", location: "🇪🇸 ES", age: 23, tags: ["#flamenco", "#art"], seed: "sable_lyre" },
];

// --- Sub-components ---
const UserCard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="glass border border-white/10 rounded-2xl p-4 relative group overflow-hidden">
      {/* Hover Glow Effect */}
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br from-violet-500/30 to-cyan-400/20 opacity-0 group-hover:opacity-100 blur-2xl transition"></div>

      <div className="relative flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-linear-to-br from-violet-500 to-cyan-400 blur-md opacity-50 group-hover:opacity-80 transition"></div>
          <span className="flex shrink-0 overflow-hidden rounded-full relative h-20 w-20 ring-2 ring-white/20">
            <Image className="aspect-square h-full w-full object-cover" src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear`} alt={`${user.username}'s avatar`} fill />
          </span>
          {/* Online Indicator */}
          <span className="pulse-ring absolute -bottom-0.5 right-1 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-[#0c0a18]"></span>
        </div>

        {/* User Info */}
        <p className="mt-3 text-sm font-bold truncate w-full">{user.username}</p>
        <p className="text-[11px] text-white/50">
          {user.location} • {user.age}y
        </p>

        {/* Tags */}
        <div className="flex gap-1 mt-2 flex-wrap justify-center">
          {user.tags.map((tag, idx) => (
            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/60">
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-3 grid grid-cols-2 gap-1.5 w-full">
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-primary-foreground shadow hover:bg-primary/90 px-3 h-8 rounded-lg bg-linear-to-r from-violet-500 to-fuchsia-500 text-[11px] font-semibold">
            <MessageCircle className="h-3 w-3 mr-1" aria-hidden="true" />
            Chat
          </button>
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground px-3 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[11px]">
            <UserPlus className="h-3 w-3 mr-1" aria-hidden="true" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export const OnlinePeoplePage: React.FC = () => {
  return (
    <div className="flex flex-col w-full h-full p-4 lg:p-6 gap-4 min-w-0 overflow-hidden">
      {/* Hero / Globe Stats */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 glass p-6 grid-bg">
        <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-emerald-400/20 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl"></div>

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400 pulse-ring"></span>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Live Globe</span>
            </div>
            <h2 className="text-3xl font-black mt-2">
              <span className="text-gradient">384</span> humans online
            </h2>
            <p className="text-sm text-white/60 mt-1">across 47 countries • vibing right now</p>
          </div>

          <div className="flex gap-2">
            {flags.map((item, index) => (
              <div key={index} className="h-12 w-12 grid place-items-center rounded-2xl glass border border-white/10 text-2xl" style={{ transform: `translateY(${item.yOffset}px)` }}>
                {item.emoji}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" aria-hidden="true" />
          <input
            className="flex w-full border px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-9 h-10 bg-white/5 border-white/10 rounded-xl text-sm placeholder:text-white/30 focus-visible:ring-violet-500/50"
            placeholder="Search by name or vibe..."
          />
        </div>
        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-4 py-2 h-10 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white">
          <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
          Filters
        </button>
      </div>

      {/* Tags Scroll Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tags.map((tag, index) => (
          <button key={index} className={`shrink-0 px-4 h-8 rounded-full text-xs font-semibold capitalize transition ${index === 0 ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white" : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"}`}>
            {tag}
          </button>
        ))}
      </div>

      {/* User Grid Area */}
      <div className="relative overflow-y-auto flex-1 -mx-2 px-2 scrollbar-hide">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-6">
          {mockUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnlinePeoplePage;
