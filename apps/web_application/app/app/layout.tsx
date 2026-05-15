"use client";

import React from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Sidebar, { DashboardTab } from "./components/LeftSidebar";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";
import { OnlinePresenceProvider } from "./components/online-people/OnlinePresenceProvider";
import StoreProvider from "@/lib/redux/StoreProvider";
import AuthProvider from "@/components/auth/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";

const ChatInvitePopup = dynamic(() => import("./components/online-people/ChatInvitePopup"), { ssr: false });
const ChatWindow = dynamic(() => import("./components/online-people/ChatWindow"), { ssr: false });

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getActiveTab = (path: string): DashboardTab => {
    if (path.includes("/discover")) return "Discover";
    if (path.includes("/friend-list")) return "Friend List";
    if (path.includes("/notifications")) return "Notifications";
    if (path.includes("/online-people")) return "Online People";
    if (path.includes("/settings")) return "Settings";
    return "Discover";
  };

  const activeTab = getActiveTab(pathname);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <StoreProvider>
          <TooltipProvider>
            <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
              <OnlinePresenceProvider>
                <Sidebar activeTab={activeTab} />

                <main className="flex-1 flex flex-col min-w-0 h-full relative">
                  <Header activeTab={activeTab} />
                  <div className="flex-1 min-h-0 overflow-auto w-full">{children}</div>
                </main>

                <MobileNav activeTab={activeTab} />
                <ChatInvitePopup />
                <ChatWindow />
              </OnlinePresenceProvider>
            </div>
            <Toaster position="top-center" toastOptions={{ unstyled: true }} />
          </TooltipProvider>
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
