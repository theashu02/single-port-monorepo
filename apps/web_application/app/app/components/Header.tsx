"use client";

import Image from "next/image";
import { Sparkles, Search, Bell, Compass, Users, Zap, Settings, LucideIcon } from "lucide-react";
import { DashboardTab } from "./LeftSidebar";
import { useHeaderUser } from "./header/use-header-user";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

interface HeaderProps {
  activeTab: DashboardTab;
}

const tabContent: Record<DashboardTab, { title: string; description: string; icon: LucideIcon }> = {
  Discover: {
    title: "Discover",
    description: "Random match with humans across the planet",
    icon: Compass,
  },
  "Friend List": {
    title: "Your Friends",
    description: "People you've added to your circle",
    icon: Users,
  },
  "Online People": {
    title: "Who's Online",
    description: "248+ strangers vibing right now",
    icon: Zap,
  },
  Notifications: {
    title: "Notifications",
    description: "Your latest vibes & alerts",
    icon: Bell,
  },
  Settings: {
    title: "Settings",
    description: "Tweak your vibe • your space, your rules",
    icon: Settings,
  },
};

export const Header = ({ activeTab }: HeaderProps) => {
  const content = tabContent[activeTab] || tabContent["Discover"];
  const { displayName, email, avatarSrc } = useHeaderUser();

  return (
    <header className="flex items-center gap-3 px-4 lg:px-6 h-16 border-b border-border bg-background/80 backdrop-blur-xl shrink-0">
      {/* Mobile Logo (Visible only on small screens) */}
      <div className="md:hidden flex items-center gap-2">
        <div className="grid place-items-center h-9 w-9 rounded-xl bg-linear-to-br from-[#ec4899] to-[#06b6d4]">
          <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        <span className="font-black text-gradient text-lg">Vibez</span>
      </div>

      {/* Title & Subtitle (Hidden on mobile) */}
      <div className="hidden md:flex items-center gap-4">
        <div className="grid place-items-center h-12 w-12 rounded-2xl shrink-0">
          <content.icon className="h-8 w-8 text-accent-foreground" aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-bold text-foreground leading-tight">{content.title}</h1>
          <p className="text-[11px] text-muted-foreground">{content.description}</p>
        </div>
      </div>

      {/* Search Bar (Visible on large screens) */}
      <div className="hidden lg:flex items-center gap-2 ml-auto px-3 h-10 w-72 rounded-full bg-secondary/50 border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
        <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input 
          placeholder="Search people, tags, vibes..." 
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" 
        />
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </div>

      {/* Right Actions (Notifications & Profile) */}
      <div className="ml-auto lg:ml-3 flex items-center gap-3">
        {/* Notification Button */}
        <button 
          className="relative grid place-items-center h-10 w-10 rounded-full bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
          tabIndex={0} 
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {/* Unread Indicator Dot */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background"></span>
        </button>

        {/* User Profile Pill */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex max-w-[56vw] items-center gap-2 rounded-full border border-border bg-secondary py-1 pl-1.5 pr-1 transition-colors hover:bg-accent sm:max-w-[240px] sm:pl-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="hidden min-w-0 sm:flex flex-col text-right leading-tight">
                <span className="truncate text-xs font-semibold text-foreground">{displayName}</span>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 dark:text-emerald-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  </span>
                  online
                </span>
              </div>
              <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/40">
                <Image className="aspect-square h-full w-full object-cover" src={avatarSrc} alt={`${displayName} avatar`} fill sizes="32px" />
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="bg-popover border-border text-popover-foreground rounded-lg shadow-xl p-3">
            <div className="flex flex-col gap-0.5">
              <p className="font-bold text-sm whitespace-nowrap">{displayName}</p>
              {email && <p className="text-[10px] text-muted-foreground">{email}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
};

export default Header;