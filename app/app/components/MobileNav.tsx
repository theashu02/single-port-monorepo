import React from "react";
import { Compass, Users, Wifi, Ellipsis } from "lucide-react";
import { DashboardTab } from "./LeftSidebar";

interface MobileNavProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

export default function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 glass border border-white/10 rounded-3xl p-2 flex items-center justify-around">
      <button 
        className="relative flex flex-col items-center gap-0.5 px-4 py-2" 
        tabIndex={0}
        onClick={() => setActiveTab("Discover")}
      >
        {activeTab === "Discover" && (
          <span className="absolute inset-0 rounded-2xl bg-linear-to-r from-violet-500/20 to-cyan-400/20 border border-violet-400/30" style={{ opacity: 1 }}></span>
        )}
        <Compass className={`relative h-5 w-5 ${activeTab === "Discover" ? "text-violet-300" : "text-white/60"}`} aria-hidden="true" />
        <span className={`relative text-[10px] font-semibold ${activeTab === "Discover" ? "text-white" : "text-white/50"}`}>Discover</span>
      </button>

      <button 
        className="relative flex flex-col items-center gap-0.5 px-4 py-2" 
        tabIndex={0}
        onClick={() => setActiveTab("Friend List")}
      >
        {activeTab === "Friend List" && (
          <span className="absolute inset-0 rounded-2xl bg-linear-to-r from-violet-500/20 to-cyan-400/20 border border-violet-400/30" style={{ opacity: 1 }}></span>
        )}
        <Users className={`relative h-5 w-5 ${activeTab === "Friend List" ? "text-violet-300" : "text-white/60"}`} aria-hidden="true" />
        <span className={`relative text-[10px] font-semibold ${activeTab === "Friend List" ? "text-white" : "text-white/50"}`}>Friends</span>
      </button>

      <button 
        className="relative flex flex-col items-center gap-0.5 px-4 py-2" 
        tabIndex={0}
        onClick={() => setActiveTab("Online People")}
      >
        {activeTab === "Online People" && (
          <span className="absolute inset-0 rounded-2xl bg-linear-to-r from-violet-500/20 to-cyan-400/20 border border-violet-400/30" style={{ opacity: 1 }}></span>
        )}
        <Wifi className={`relative h-5 w-5 ${activeTab === "Online People" ? "text-violet-300" : "text-white/60"}`} aria-hidden="true" />
        <span className={`relative text-[10px] font-semibold ${activeTab === "Online People" ? "text-white" : "text-white/50"}`}>Online</span>
      </button>

      <button 
        className="relative flex flex-col items-center gap-0.5 px-4 py-2" 
        tabIndex={0}
        onClick={() => setActiveTab("Settings")}
      >
        {activeTab === "Settings" && (
          <span className="absolute inset-0 rounded-2xl bg-linear-to-r from-violet-500/20 to-cyan-400/20 border border-violet-400/30" style={{ opacity: 1 }}></span>
        )}
        <Ellipsis className={`relative h-5 w-5 ${activeTab === "Settings" ? "text-violet-300" : "text-white/60"}`} aria-hidden="true" />
        <span className={`relative text-[10px] font-semibold ${activeTab === "Settings" ? "text-white" : "text-white/50"}`}>More</span>
      </button>
    </nav>
  );
}
