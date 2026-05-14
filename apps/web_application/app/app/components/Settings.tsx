"use client";

import React, { useState } from "react";
import { Settings as SettingsIcon, User, Sparkles, Lock, Bell, Palette } from "lucide-react";
import Profile from "./settings/profile";

// --- Types ---
type TabId = "profile" | "preferences" | "privacy" | "notifications" | "appearance";

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

// --- Navigation Data ---
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid place-items-center h-12 w-12 rounded-2xl bg-linear-to-br from-violet-500 to-cyan-400">
          <SettingsIcon className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">Settings</h2>
          <p className="text-xs text-white/50">Tweak your vibe • your space, your rules</p>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        {/* Sidebar Navigation */}
        <div className="glass border border-white/10 rounded-2xl p-2 h-fit space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition ${isActive ? "bg-linear-to-r from-violet-500/20 to-cyan-400/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="relative overflow-y-auto glass border border-white/10 rounded-2xl scrollbar-hide">
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
