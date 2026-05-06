// "use client";

// import { useEffect, useState } from "react";

// import { useAppSelector } from "@/lib/redux/hooks";
// import Link from "next/link";
// import { signOut, useSession } from "next-auth/react";
// import { Button } from "@/components/ui/button";
// import { logoutGuestSession } from "@/core/apis/General_API";
// import { fetchGuestSession } from "@/core/apis/Guest_API";
// import { customToast } from "@/components/ui/toast";
// import HoverButton from "@/components/ui/HoverButton";
// import { ArrowUpRight } from "lucide-react";

// const GUEST_MARKER_KEY = "guest_session_present";

// export default function DashboardPage() {
//   const reduxMessage = useAppSelector((state) => state.test.message);
//   const { data: session, status } = useSession();
//   const [guestUser, setGuestUser] = useState<{
//     name: string;
//     email: string;
//     id: string;
//   } | null>(null);

//   useEffect(() => {
//     let active = true;
//     if (status === "loading") return;
//     if (session?.user) return;

//     const hasGuestMarker = localStorage.getItem(GUEST_MARKER_KEY) === "1";
//     if (!hasGuestMarker) return;

//     fetchGuestSession()
//       .then((guestData) => {
//         if (!active || !guestData?.is_guest) return;
//         localStorage.setItem(GUEST_MARKER_KEY, "1");
//         setGuestUser({
//           name: guestData.nickname ?? "Guest",
//           email: "Anonymous Guest",
//           id: guestData.guest_id,
//         });
//       })
//       .catch(() => {
//         if (!active) return;
//         localStorage.removeItem(GUEST_MARKER_KEY);
//         setGuestUser(null);
//       });

//     return () => {
//       active = false;
//     };
//   }, [session?.user, status]);

//   const activeUser = session?.user || guestUser;

//   const handleLogout = async () => {
//     localStorage.removeItem(GUEST_MARKER_KEY);
//     try {
//       await logoutGuestSession();
//     } catch {
//       console.error("Failed to clear guest cookies");
//     }

//     if (session?.user) {
//       await signOut({ callbackUrl: "/auth" });
//     } else {
//       window.location.href = "/auth";
//     }
//   };

//   const handleclick = () => {
//     customToast("Welcome back!", "info", "Your session has been restored.");
//   };

//   return (
//     <div style={{ padding: "2rem" }}>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <h1>Dashboard Page</h1>
//         <Button variant="destructive" onClick={handleLogout}>
//           Log Out
//         </Button>
//       </div>

//       {activeUser && (
//         <div style={{ marginTop: "20px", padding: "15px", background: "#e0f7fa", borderRadius: "8px", color: "#006064" }}>
//           <h3>Welcome, {activeUser.name || "User"}!</h3>
//           <p>Email: {activeUser.email}</p>
//           <p>User ID: {activeUser.id}</p>
//         </div>
//       )}

//       <div style={{ marginTop: "20px", padding: "15px", background: "#f0f0f0", borderRadius: "8px", color: "#000" }}>
//         <p>This data is retrieved from the Redux Store:</p>
//         <h2 style={{ color: "#0070f3" }}>{reduxMessage}</h2>
//         {/* <Button onClick={handleclick}>Click me!</Button> */}
//         <HoverButton onClick={handleclick} className="w-52">
//           <>
//             <span className="">Securely Logout</span>
//             <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
//           </>
//         </HoverButton>
//       </div>

//       <div style={{ marginTop: "20px" }}>
//         <Link href="/" style={{ color: "blue", textDecoration: "underline" }}>
//           &larr; Back to Home
//         </Link>
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useState } from "react";
import MobileNav from "./components/MobileNav";
import DiscoverPage from "./components/DiscoverPage";
import Header from "./components/Header";
import Sidebar, { DashboardTab } from "./components/LeftSidebar";
import FriendList from "./components/FriendList";
import Notifications from "./components/Notifications";
import OnlinePeoplePage from "./components/OnlinePeoplePage";
import Settings from "./components/Settings";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("Discover");

  const renderContent = () => {
    switch (activeTab) {
      case "Discover":
        return <DiscoverPage />;
      case "Friend List":
        return <FriendList />;
      case "Notifications":
        return <Notifications />;
      case "Online People":
        return <OnlinePeoplePage />;
      case "Settings":
        return <Settings />;
      default:
        return <DiscoverPage />;
    }
  };

  return (
    <div className="dashboard-dark flex h-screen w-screen overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header activeTab={activeTab} />

        <div className="flex-1 min-h-0 overflow-auto w-full">
          {renderContent()}
        </div>
      </main>

      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
