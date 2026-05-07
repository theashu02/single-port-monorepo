import type { LucideIcon } from "lucide-react";

export type DashboardTab = "Discover" | "Friend List" | "Online People" | "Notifications" | "Settings";

export interface SidebarNavItemData {
  label: DashboardTab;
  icon: LucideIcon;
  href: string;
  badge?: string | number;
  badgeType?: "live" | "default";
}
