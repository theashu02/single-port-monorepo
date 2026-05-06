import React, { useState } from "react";
import { Sparkles, ChevronLeft, Compass, Users, Wifi, Bell, Settings as SettingsIcon, LogOut, LucideIcon } from "lucide-react";

export type DashboardTab = "Discover" | "Friend List" | "Online People" | "Notifications" | "Settings";

interface NavItemData {
  label: DashboardTab;
  icon: LucideIcon;
  badge?: string | number;
  badgeType?: "live" | "default";
}

const mainNavItems: NavItemData[] = [
  { label: "Discover", icon: Compass, badge: "Live", badgeType: "live" },
  { label: "Friend List", icon: Users, badge: 7 },
  { label: "Online People", icon: Wifi, badge: 248 },
];

const accountNavItems: NavItemData[] = [
  { label: "Notifications", icon: Bell, badge: 3 },
  { label: "Settings", icon: SettingsIcon },
];

interface NavItemProps extends NavItemData {
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon: Icon, badge, isActive, badgeType, isCollapsed, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`relative w-full flex items-center transition-all duration-300 gap-3 h-12 rounded-xl ${isCollapsed ? "justify-center px-0" : "px-3"} ${isActive ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`} 
      tabIndex={0}
      title={isCollapsed ? label : ""}
    >
      <span className={`grid place-items-center h-8 w-8 rounded-lg shrink-0 ${isActive ? "bg-white/15" : "bg-white/5"}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      {!isCollapsed && (
        <span className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap">
          <span className="text-sm font-medium">{label}</span>
          {badge && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeType === "live" ? "bg-white/20" : "bg-white/10 text-white/50"}`}>{badge}</span>}
        </span>
      )}
    </button>
  );
};

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`hidden md:flex relative z-30 h-screen flex-col bg-[#0c0a18] border-r border-white/5 transition-all duration-300 ease-in-out ${isCollapsed ? "w-[80px]" : "w-[240px]"}`}>
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-white/5 overflow-hidden">
        <div className="shrink-0 grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400">
          <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        {!isCollapsed && (
          <div className="ml-3 flex flex-col overflow-hidden whitespace-nowrap transition-all duration-300">
            <span className="text-lg font-black tracking-tight">Vibez</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Beta v1.0</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`grid place-items-center h-7 w-7 rounded-full bg-white/5 hover:bg-white/10 text-white/50 transition-all duration-300 ${isCollapsed ? "mx-auto" : "ml-auto"}`} 
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 scrollbar-hide">
        {mainNavItems.map((item, index) => (
          <NavItem 
            key={index} 
            {...item} 
            isCollapsed={isCollapsed}
            isActive={activeTab === item.label} 
            onClick={() => setActiveTab(item.label)}
          />
        ))}

        {!isCollapsed && (
          <div className="mt-8 mb-2 px-2 text-[10px] uppercase tracking-[0.2em] text-white/30 overflow-hidden whitespace-nowrap">Account</div>
        )}
        {isCollapsed && <div className="mt-8 mb-2 h-px bg-white/10 mx-2" />}

        {accountNavItems.map((item, index) => (
          <NavItem 
            key={index} 
            {...item} 
            isCollapsed={isCollapsed}
            isActive={activeTab === item.label} 
            onClick={() => setActiveTab(item.label)}
          />
        ))}
      </nav>

      {/* Go Pro Promo */}
      {!isCollapsed && (
        <div className="mx-3 mb-3 rounded-xl p-4 bg-violet-500/10 border border-violet-500/20 overflow-hidden">
          <div className="text-xs font-semibold text-violet-300">Go Pro ✨</div>
          <div className="text-[11px] text-white/50 mt-1 leading-snug">Unlimited matches, no ads.</div>
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow px-3 mt-3 w-full h-8 text-xs bg-gradient-to-r from-violet-500 to-cyan-400 hover:opacity-90 text-white rounded-lg">Upgrade</button>
        </div>
      )}

      {/* Footer / Logout */}
      <div className="mt-auto p-3 border-t border-white/5">
        <button className={`group w-full flex items-center transition-all duration-300 h-11 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 ${isCollapsed ? "justify-center px-0" : "px-3 gap-3"}`}>
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-rose-500/15 shrink-0">
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </span>
          {!isCollapsed && <span className="text-sm font-medium overflow-hidden whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
