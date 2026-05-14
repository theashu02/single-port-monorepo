"use client";

import React, { useState } from "react";
import { User, Sparkles, Lock, Bell, Palette } from "lucide-react";
import Profile from "./settings/profile";
import { Button } from "@/components/ui/button";

type TabId = "profile" | "preferences" | "privacy" | "notifications" | "appearance";

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Sparkles },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="flex flex-col w-full h-full p-4 lg:p-6 gap-4 min-w-0 overflow-hidden">
      {/* Main Layout Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-2 h-fit space-y-1 shadow-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Button key={item.id} variant="ghost" onClick={() => setActiveTab(item.id)} className={`w-full justify-start gap-3 h-11 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="relative overflow-y-auto glass border border-border shadow-sm rounded-2xl scrollbar-hide">
          <div className="p-6 space-y-5">
            {activeTab === "profile" && <Profile />}

            {/* Placeholder for other tabs */}
            {activeTab !== "profile" && <div className="h-40 flex items-center justify-center text-white/40 text-sm">{navItems.find((item) => item.id === activeTab)?.label} settings coming soon...</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
