"use client";

import Image from "next/image";
import { Sparkles, Search, Bell } from "lucide-react";
import { DashboardTab } from "./LeftSidebar";
import { useHeaderUser } from "./header/use-header-user";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderProps {
  activeTab: DashboardTab;
}

const tabContent: Record<DashboardTab, { title: string; description: string }> = {
  "Discover": {
    title: "Discover ✨",
    description: "Random match with humans across the planet"
  },
  "Friend List": {
    title: "Your Friends 💜",
    description: "People you've added to your circle"
  },
  "Online People": {
    title: "Who's Online 🟢",
    description: "248+ strangers vibing right now"
  },
  "Notifications": {
    title: "Notifications 🔔",
    description: "Your latest vibes & alerts"
  },
  "Settings": {
    title: "Settings ⚙️",
    description: "Personalize your Vibez experience"
  }
};

export const Header = ({ activeTab }: HeaderProps) => {
  const content = tabContent[activeTab] || tabContent["Discover"];
  const { displayName, email, avatarSrc } = useHeaderUser();

  return (
    <header className="flex items-center gap-3 px-4 lg:px-6 h-16 border-b border-white/5 glass shrink-0">
      {/* Mobile Logo (Visible only on small screens) */}
      <div className="md:hidden flex items-center gap-2">
        <div className="grid place-items-center h-9 w-9 rounded-xl bg-linear-to-br from-violet-500 to-cyan-400">
          <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        <span className="font-black text-gradient text-lg">Vibez</span>
      </div>

      {/* Title & Subtitle (Hidden on mobile) */}
      <div className="hidden md:flex flex-col">
        <h1 className="text-base font-bold">{content.title}</h1>
        <p className="text-[11px] text-white/40">{content.description}</p>
      </div>

      {/* Search Bar (Visible on large screens) */}
      <div className="hidden lg:flex items-center gap-2 ml-auto px-3 h-10 w-72 rounded-full bg-white/5 border border-white/10">
        <Search className="h-4 w-4 text-white/40" aria-hidden="true" />
        <input placeholder="Search people, tags, vibes..." className="flex-1 bg-transparent text-sm placeholder:text-white/30 focus:outline-none" />
        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50 font-sans">⌘K</kbd>
      </div>

      {/* Right Actions (Notifications & Profile) */}
      <div className="ml-auto lg:ml-3 flex items-center gap-3">
        {/* Notification Button */}
        <button className="relative grid place-items-center h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors" tabIndex={0} aria-label="View notifications">
          <Bell className="h-4 w-4 text-white/70" aria-hidden="true" />
          {/* Unread Indicator Dot */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-[#0c0a18]"></span>
        </button>

        {/* User Profile Pill */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex max-w-[56vw] items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1.5 pr-1 transition-colors hover:bg-white/10 sm:max-w-[240px] sm:pl-2 cursor-pointer">
          <div className="hidden min-w-0 sm:flex flex-col text-right leading-tight">
            <span className="truncate text-xs font-semibold">{displayName}</span>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
              online
            </span>
          </div>
          <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-violet-400/40">
            <Image className="aspect-square h-full w-full object-cover" src={avatarSrc} alt={`${displayName} avatar`} fill sizes="32px" />
          </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="bg-[#0c0a18] border-white/10 text-white rounded-lg shadow-2xl p-3">
            <div className="flex flex-col gap-0.5">
              <p className="font-bold text-sm whitespace-nowrap">{displayName}</p>
              {email && <p className="text-[10px] text-white/50">{email}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
};

export default Header;
