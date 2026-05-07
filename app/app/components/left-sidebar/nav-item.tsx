import { memo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SidebarNavItemData } from "./types";

interface SidebarNavItemProps extends SidebarNavItemData {
  isActive: boolean;
  isCollapsed: boolean;
}

const SidebarNavItemBase = ({ label, icon: Icon, href, badge, isActive, badgeType, isCollapsed }: SidebarNavItemProps) => {
  return (
    <Button
      variant="ghost"
      className={cn(
        "relative h-12 w-full items-center justify-start gap-3 rounded-xl px-0 font-normal transition-colors duration-200",
        isCollapsed && "justify-center",
        isActive ? "text-white hover:bg-transparent hover:text-white" : "text-white/50 hover:bg-white/5 hover:text-white",
      )}
      asChild
    >
      <Link href={href} aria-current={isActive ? "page" : undefined}>
        <motion.div
          className={cn("relative z-10 flex h-full w-full items-center gap-3 px-3", isCollapsed && "justify-center gap-0 px-0")}
          tabIndex={0}
          title={isCollapsed ? label : ""}
        >
          {isActive && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 z-0 rounded-xl bg-linear-to-r from-violet-600 to-cyan-500"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}

          <span className={cn("relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg", isActive ? "bg-white/15" : "bg-white/5")}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>

          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="relative z-10 flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap"
            >
              <span className="text-sm font-medium">{label}</span>
              {badge !== undefined && badge !== null && (
                <Badge
                  variant={badgeType === "live" ? "default" : "secondary"}
                  className={cn(
                    "h-5 min-w-[20px] rounded-full border-0 px-1.5 normal-case tracking-normal",
                    badgeType === "live" ? "bg-white/20 text-white" : "bg-white/10 text-white/50",
                  )}
                >
                  {badge}
                </Badge>
              )}
            </motion.span>
          )}
        </motion.div>
      </Link>
    </Button>
  );
};

export const SidebarNavItem = memo(SidebarNavItemBase);
SidebarNavItem.displayName = "SidebarNavItem";
