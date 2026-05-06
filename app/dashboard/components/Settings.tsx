import React, { useState } from "react";
import Image from "next/image";
import { Settings as SettingsIcon, User, Sparkles, Lock, Bell, Palette, Camera, Save } from "lucide-react";

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
            {/* Tab: Profile (Currently the only mapped out view) */}
            {activeTab === "profile" && (
              <>
                <div className="pb-2 border-b border-white/5">
                  <h3 className="text-lg font-black">Profile</h3>
                  <p className="text-xs text-white/50">How others see you on Vibez</p>
                </div>

                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <span className="relative flex shrink-0 overflow-hidden rounded-full h-20 w-20 ring-2 ring-violet-400/40">
                      <Image className="aspect-square h-full w-full object-cover" src="https://api.dicebear.com/7.x/adventurer/svg?seed=you-vibez&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear" alt="Your Avatar" fill />
                    </span>
                    <button className="absolute -bottom-1 -right-1 grid place-items-center h-8 w-8 rounded-full bg-linear-to-br from-violet-500 to-cyan-400 ring-2 ring-[#0c0a18]" aria-label="Upload new avatar">
                      <Camera className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                    </button>
                  </div>
                  <div>
                    <p className="font-bold">Your Avatar</p>
                    <p className="text-xs text-white/50">Powered by DiceBear • randomize anytime</p>
                    <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-primary-foreground shadow px-3 mt-2 h-8 rounded-full bg-white/10 hover:bg-white/15 text-xs">🎲 Re-roll Avatar</button>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-xs uppercase tracking-wider text-white/50">Display Name</label>
                    <input type="text" defaultValue="You" className="flex w-full border px-3 py-1 text-base shadow-sm transition-colors placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm mt-1.5 h-10 bg-white/5 border-white/10 rounded-xl focus-visible:ring-violet-500/50" />
                  </div>
                  <div>
                    <label className="font-medium text-xs uppercase tracking-wider text-white/50">Handle</label>
                    <input type="text" defaultValue="@you-vibez" className="flex w-full border px-3 py-1 text-base shadow-sm transition-colors placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm mt-1.5 h-10 bg-white/5 border-white/10 rounded-xl focus-visible:ring-violet-500/50" />
                  </div>
                  <div>
                    <label className="font-medium text-xs uppercase tracking-wider text-white/50">Age</label>
                    <input type="number" defaultValue="22" className="flex w-full border px-3 py-1 text-base shadow-sm transition-colors placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm mt-1.5 h-10 bg-white/5 border-white/10 rounded-xl focus-visible:ring-violet-500/50" />
                  </div>
                  <div>
                    <label className="font-medium text-xs uppercase tracking-wider text-white/50">Country</label>
                    <input type="text" defaultValue="🇺🇸 United States" className="flex w-full border px-3 py-1 text-base shadow-sm transition-colors placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm mt-1.5 h-10 bg-white/5 border-white/10 rounded-xl focus-visible:ring-violet-500/50" />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="font-medium text-xs uppercase tracking-wider text-white/50">Bio</label>
                  <textarea rows={3} defaultValue="✨ vibing through life • lo-fi enthusiast • collector of memes" className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder:text-white/30 resize-none" />
                </div>

                {/* Actions */}
                <div className="pt-3 flex gap-2">
                  <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow hover:bg-primary/90 px-4 py-2 h-10 rounded-xl bg-linear-to-r from-violet-500 to-cyan-400 text-white font-semibold">
                    <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                    Save changes
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground px-4 py-2 h-10 rounded-xl bg-white/5 hover:bg-white/10">Cancel</button>
                </div>
              </>
            )}

            {/* Placeholder for other tabs */}
            {activeTab !== "profile" && <div className="h-40 flex items-center justify-center text-white/40 text-sm">{navItems.find((item) => item.id === activeTab)?.label} settings coming soon...</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
