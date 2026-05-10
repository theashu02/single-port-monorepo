"use client";

import { motion } from "framer-motion";
import { ChevronLeft, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ACCOUNT_NAV_ITEMS, MAIN_NAV_ITEMS } from "./left-sidebar/constants";
import { SidebarNavItem } from "./left-sidebar/nav-item";
import type { DashboardTab } from "./left-sidebar/types";
import { useSidebarController } from "./left-sidebar/use-sidebar-controller";
import { ModeToggle } from "@/components/ui/ModeToggle";

export type { DashboardTab } from "./left-sidebar/types";

interface SidebarProps {
  activeTab: DashboardTab;
}

function SidebarAccountDivider({ isCollapsed }: { isCollapsed: boolean }) {
  if (isCollapsed) {
    return <div className="mx-2 mt-8 mb-2 h-px bg-sidebar-border" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-8 mb-2 overflow-hidden whitespace-nowrap px-2 text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50"
    >
      Account
    </motion.div>
  );
}

export function Sidebar({ activeTab }: SidebarProps) {
  const { isCollapsed, toggleCollapsed, handleLogout, isLoggingOut } = useSidebarController();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, restDelta: 0.5 }}
      className="relative z-30 hidden h-screen flex-col overflow-hidden border-r border-sidebar-border bg-sidebar will-change-[width] md:flex"
    >
      <div className="flex h-16 shrink-0 items-center overflow-hidden border-b border-sidebar-border px-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
        </div>

        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="ml-3 flex flex-col overflow-hidden whitespace-nowrap"
          >
            <span className="text-lg font-black tracking-tight text-sidebar-foreground">Vibez</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Beta v1.0</span>
          </motion.div>
        )}

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleCollapsed}
          className={cn("rounded-full bg-sidebar-accent text-sidebar-foreground/50 hover:bg-sidebar-accent/80", isCollapsed ? "mx-auto" : "ml-auto")}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </motion.div>
        </Button>
      </div>

      <nav className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <TooltipProvider delayDuration={120}>
          {MAIN_NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.label}
              {...item}
              isCollapsed={isCollapsed}
              isActive={activeTab === item.label}
            />
          ))}

          <SidebarAccountDivider isCollapsed={isCollapsed} />

          {ACCOUNT_NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.label}
              {...item}
              isCollapsed={isCollapsed}
              isActive={activeTab === item.label}
            />
          ))}
        </TooltipProvider>
      </nav>

      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mb-3 shrink-0 overflow-hidden rounded-xl border border-primary/20 bg-primary/10 p-4"
        >
          <div className="text-xs font-semibold text-primary">Go Pro</div>
          <div className="mt-1 text-[11px] leading-snug text-muted-foreground">Unlimited matches, no ads.</div>
          <Button size="sm" className="mt-3 h-8 w-full rounded-lg bg-primary text-xs text-primary-foreground hover:bg-primary/90">
            Upgrade
          </Button>
        </motion.div>
      )}

      <div className="mt-auto shrink-0 border-t border-sidebar-border p-3">
        <div className="mb-2">
          <ModeToggle isCollapsed={isCollapsed} />
        </div>
        <Button
          variant="destructive"
          className={cn(
            "flex h-11 w-full items-center justify-start rounded-xl border-0 bg-destructive/10 px-3 text-destructive hover:bg-destructive/20",
            isCollapsed && "justify-center px-0",
          )}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-destructive/15">
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </span>

          {!isCollapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-3 overflow-hidden whitespace-nowrap text-sm font-medium">
              {isLoggingOut ? "Logging out..." : "Logout"}
            </motion.span>
          )}
        </Button>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
