"use client";

import { useCallback, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { logoutGuestSession } from "@/core/apis/General_API";
import { GUEST_MARKER_KEY } from "../../app/app/components/left-sidebar/constants";

export function useSidebarController() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: session } = useSession();

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    window.localStorage.removeItem(GUEST_MARKER_KEY);

    try {
      await logoutGuestSession();
    } catch (error) {
      console.error("Failed to clear guest cookies", error);
    }

    try {
      if (session?.user) {
        await signOut({ callbackUrl: "/auth" });
        return;
      }

      window.location.assign("/auth");
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, session?.user]);

  return {
    isCollapsed,
    isLoggingOut,
    toggleCollapsed,
    handleLogout,
  };
}
