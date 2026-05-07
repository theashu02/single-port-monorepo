import { Bell, Compass, Settings, Users, Wifi } from "lucide-react";
import type { SidebarNavItemData } from "./types";

export const GUEST_MARKER_KEY = "guest_session_present";

export const MAIN_NAV_ITEMS: ReadonlyArray<SidebarNavItemData> = [
  { label: "Discover", icon: Compass, href: "/app/discover", badge: "Live", badgeType: "live" },
  { label: "Friend List", icon: Users, href: "/app/friend-list", badge: 7 },
  { label: "Online People", icon: Wifi, href: "/app/online-people", badge: 248 },
];

export const ACCOUNT_NAV_ITEMS: ReadonlyArray<SidebarNavItemData> = [
  { label: "Notifications", icon: Bell, href: "/app/notifications", badge: 3 },
  { label: "Settings", icon: Settings, href: "/app/settings" },
];
