import React, { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const NavItem = memo(({ label, icon: Icon, badge, isActive, badgeType, isCollapsed, onClick }: NavItemProps) => {
  return (
    <button 
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 h-12 rounded-xl transition-colors duration-200 ${isCollapsed ? "justify-center px-0" : "px-3"} ${isActive ? "text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`} 
      tabIndex={0}
      title={isCollapsed ? label : ""}
    >
      {/* Active Background Indicator */}
      {isActive && (
        <motion.div 
          layoutId="activeTab"
          className="absolute inset-0 bg-linear-to-r from-violet-600 to-cyan-500 rounded-xl z-0"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}

      <span className={`relative z-10 grid place-items-center h-8 w-8 rounded-lg shrink-0 ${isActive ? "bg-white/15" : "bg-white/5"}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      
      {!isCollapsed && (
        <motion.span 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="relative z-10 flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
        >
          <span className="text-sm font-medium">{label}</span>
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeType === "live" ? "bg-white/20" : "bg-white/10 text-white/50"}`}>
              {badge}
            </span>
          )}
        </motion.span>
      )}
    </button>
  );
});

NavItem.displayName = "NavItem";

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, restDelta: 0.5 }}
      className="hidden md:flex relative z-30 h-screen flex-col bg-[#0c0a18] border-r border-white/5 overflow-hidden will-change-[width]"
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-white/5 shrink-0 overflow-hidden">
        <div className="shrink-0 grid place-items-center h-10 w-10 rounded-xl bg-linear-to-br from-violet-500 to-cyan-400">
          <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="ml-3 flex flex-col overflow-hidden whitespace-nowrap"
          >
            <span className="text-lg font-black tracking-tight">Vibez</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Beta v1.0</span>
          </motion.div>
        )}

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`grid place-items-center h-7 w-7 rounded-full bg-white/5 hover:bg-white/10 text-white/50 transition-colors ${isCollapsed ? "mx-auto" : "ml-auto"}`} 
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </motion.div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 scrollbar-hide">
        {mainNavItems.map((item) => (
          <NavItem 
            key={item.label} 
            {...item} 
            isCollapsed={isCollapsed}
            isActive={activeTab === item.label} 
            onClick={() => setActiveTab(item.label)}
          />
        ))}

        {!isCollapsed ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 mb-2 px-2 text-[10px] uppercase tracking-[0.2em] text-white/30 overflow-hidden whitespace-nowrap"
          >
            Account
          </motion.div>
        ) : (
          <div className="mt-8 mb-2 h-px bg-white/10 mx-2" />
        )}

        {accountNavItems.map((item) => (
          <NavItem 
            key={item.label} 
            {...item} 
            isCollapsed={isCollapsed}
            isActive={activeTab === item.label} 
            onClick={() => setActiveTab(item.label)}
          />
        ))}
      </nav>

      {/* Go Pro Promo */}
      {!isCollapsed && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mb-3 rounded-xl p-4 bg-violet-500/10 border border-violet-500/20 overflow-hidden shrink-0"
        >
          <div className="text-xs font-semibold text-violet-300">Go Pro ✨</div>
          <div className="text-[11px] text-white/50 mt-1 leading-snug">Unlimited matches, no ads.</div>
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow px-3 mt-3 w-full h-8 text-xs bg-linear-to-r from-violet-500 to-cyan-400 hover:opacity-90 text-white rounded-lg">Upgrade</button>
        </motion.div>
      )}

      {/* Footer / Logout */}
      <div className="mt-auto p-3 border-t border-white/5 shrink-0">
        <button className={`group w-full flex items-center transition-colors duration-200 h-11 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 ${isCollapsed ? "justify-center px-0" : "px-3 gap-3"}`}>
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-rose-500/15 shrink-0">
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </span>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium overflow-hidden whitespace-nowrap"
            >
              Logout
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
