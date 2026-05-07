"use client";

import React from "react";
import Image from "next/image";
import { Bell, CheckCheck, Sparkles, Heart, UserPlus, MessageCircle, Trash2, LucideIcon } from "lucide-react";

// --- Types ---
type NotificationType = "match" | "like" | "friend" | "message" | "system";

interface NotificationData {
  id: string;
  type: NotificationType;
  isUnread: boolean;
  username: string;
  actionText: string;
  time: string;
  seed: string;
}

interface FilterTab {
  label: string;
  count: number;
  isActive?: boolean;
}

// --- Mock Data ---
const filters: FilterTab[] = [
  { label: "all", count: 8, isActive: true },
  { label: "match", count: 2 },
  { label: "like", count: 2 },
  { label: "friend", count: 1 },
  { label: "message", count: 1 },
  { label: "system", count: 2 },
];

const mockNotifications: NotificationData[] = [
  { id: "1", type: "match", isUnread: true, username: "pixel_dreamer", actionText: "vibed with you for 12 minutes ✨", time: "2m ago", seed: "pixel_dreamer" },
  { id: "2", type: "like", isUnread: true, username: "midnight.eko", actionText: "liked your vibe profile", time: "15m ago", seed: "midnight.eko" },
  { id: "3", type: "friend", isUnread: true, username: "velvet_riot", actionText: "sent you a friend request", time: "1h ago", seed: "velvet_riot" },
  { id: "4", type: "message", isUnread: false, username: "Aria Vex", actionText: "yo did u see that meme?", time: "2h ago", seed: "Aria Vex" },
  { id: "5", type: "system", isUnread: false, username: "Vibez", actionText: "You unlocked the 🔥 Streak Master badge", time: "3h ago", seed: "Vibez" },
  { id: "6", type: "match", isUnread: false, username: "static.witch", actionText: "started a new vibe with you", time: "5h ago", seed: "static.witch" },
  { id: "7", type: "like", isUnread: false, username: "cosmic.bun", actionText: "super-liked your profile", time: "1d ago", seed: "cosmic.bun" },
  { id: "8", type: "system", isUnread: false, username: "Vibez", actionText: "weekly recap: 47 matches, 18 friends made 🎉", time: "2d ago", seed: "Vibez" },
];

// --- Config for Notification Types ---
const typeConfig: Record<NotificationType, { icon: LucideIcon; gradient: string; label: string }> = {
  match: { icon: Sparkles, gradient: "from-violet-500 to-fuchsia-500", label: "Match" },
  like: { icon: Heart, gradient: "from-rose-500 to-pink-500", label: "Like" },
  friend: { icon: UserPlus, gradient: "from-cyan-400 to-blue-500", label: "Friend" },
  message: { icon: MessageCircle, gradient: "from-emerald-400 to-teal-500", label: "Message" },
  system: { icon: Bell, gradient: "from-orange-400 to-amber-500", label: "System" },
};

// --- Sub-components ---
const NotificationItem: React.FC<{ notification: NotificationData }> = ({ notification }) => {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <div className={`group relative flex items-center gap-3 p-3.5 rounded-2xl border transition glass ${notification.isUnread ? "border-violet-400/20 bg-violet-500/5" : "border-white/10"}`}>
      {/* Unread Indicator Dot */}
      {notification.isUnread && <span className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-violet-400"></span>}

      {/* Type Icon */}
      <div className={`relative shrink-0 grid place-items-center h-11 w-11 rounded-xl bg-linear-to-br ${config.gradient}`}>
        <Icon className="h-4 w-4 text-white" aria-hidden="true" />
      </div>

      {/* Avatar */}
      <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10 ring-2 ring-white/10">
        <Image className="aspect-square h-full w-full object-cover" src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${notification.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear`} alt={`${notification.username}'s avatar`} fill />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-bold">{notification.username}</span> <span className="text-white/70">{notification.actionText}</span>
        </p>
        <p className="text-[11px] text-white/40 mt-0.5">
          {notification.time} • {config.label}
        </p>
      </div>

      {/* Hover Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-primary-foreground shadow hover:bg-primary/90 h-8 rounded-full bg-linear-to-r from-violet-500 to-cyan-400 text-xs px-3">View</button>
        <button className="grid place-items-center h-8 w-8 rounded-full bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-300 transition" aria-label="Delete notification">
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export const Notifications: React.FC = () => {
  const unreadCount = mockNotifications.filter((n) => n.isUnread).length;

  return (
    <div className="flex flex-col w-full h-full p-4 lg:p-6 gap-4 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative grid place-items-center h-12 w-12 rounded-2xl bg-linear-to-br from-violet-500 to-cyan-400">
            <Bell className="h-5 w-5 text-white" aria-hidden="true" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 grid place-items-center rounded-full bg-rose-500 text-[10px] font-bold ring-2 ring-[#0c0a18]">{unreadCount}</span>}
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Notifications</h2>
            <p className="text-xs text-white/50">{unreadCount} unread • stay in the loop</p>
          </div>
        </div>

        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground px-4 py-2 h-9 rounded-xl bg-white/5 border border-white/10 text-xs">
          <CheckCheck className="h-4 w-4 mr-2" aria-hidden="true" />
          Mark all read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((filter, index) => (
          <button key={index} className={`shrink-0 px-4 h-9 rounded-full text-xs font-semibold capitalize transition flex items-center gap-2 ${filter.isActive ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"}`}>
            {filter.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter.isActive ? "bg-black/10" : "bg-white/10"}`}>{filter.count}</span>
          </button>
        ))}
      </div>

      {/* Notification List Area */}
      <div className="relative overflow-y-auto flex-1 -mx-2 px-2 scrollbar-hide">
        <div className="space-y-2 max-w-3xl pb-6">
          {mockNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
