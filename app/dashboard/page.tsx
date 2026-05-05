"use client";

import { useState } from "react";

import { useAppSelector } from "@/lib/redux/hooks";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { logoutGuestSession } from "@/core/apis/General_API";
import { customToast } from "@/components/ui/toast";

export default function DashboardPage() {
  const reduxMessage = useAppSelector((state) => state.test.message);
  const { data: session } = useSession();
  const [guestUser] = useState<{
    name: string;
    email: string;
    id: string;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    const guestStr = localStorage.getItem("guest_session");
    if (!guestStr) return null;
    try {
      const guestData = JSON.parse(guestStr);
      if (guestData.is_guest) {
        return {
          name: guestData.nickname,
          email: "Anonymous Guest",
          id: guestData.guest_id,
        };
      }
    } catch {
      return null;
    }
    return null;
  });

  const activeUser = session?.user || guestUser;

  const handleLogout = async () => {
    localStorage.removeItem("guest_session");
    try {
      await logoutGuestSession();
    } catch {
      console.error("Failed to clear guest cookies");
    }

    if (session?.user) {
      await signOut({ callbackUrl: "/auth" });
    } else {
      window.location.href = "/auth";
    }
  };

  const handleclick = () => {
    customToast("Welcome back!", "info", "Your session has been restored.");
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Dashboard Page</h1>
        <Button variant="destructive" onClick={handleLogout}>
          Log Out
        </Button>
      </div>

      {activeUser && (
        <div style={{ marginTop: "20px", padding: "15px", background: "#e0f7fa", borderRadius: "8px", color: "#006064" }}>
          <h3>Welcome, {activeUser.name || "User"}!</h3>
          <p>Email: {activeUser.email}</p>
          <p>User ID: {activeUser.id}</p>
        </div>
      )}

      <div style={{ marginTop: "20px", padding: "15px", background: "#f0f0f0", borderRadius: "8px", color: "#000" }}>
        <p>This data is retrieved from the Redux Store:</p>
        <h2 style={{ color: "#0070f3" }}>{reduxMessage}</h2>
        <Button onClick={handleclick}>Click me!</Button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <Link href="/" style={{ color: "blue", textDecoration: "underline" }}>
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
