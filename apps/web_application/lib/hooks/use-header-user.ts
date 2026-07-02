"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchGuestSession } from "@/core/apis/Guest_API";

const GUEST_MARKER_KEY = "guest_session_present";
const DEFAULT_AVATAR_SEED = "you-vibez";

function buildDicebearAvatar(seed: string) {
  const safeSeed = encodeURIComponent(seed.trim() || DEFAULT_AVATAR_SEED);
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${safeSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear`;
}

export function useHeaderUser() {
  const { data: session, status } = useSession();
  const [guestName, setGuestName] = useState<string | null>(null);
  const [guestAvatarSeed, setGuestAvatarSeed] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (status === "loading") return;
    if (session?.user) return;

    const hasGuestMarker = window.localStorage.getItem(GUEST_MARKER_KEY) === "1";
    if (!hasGuestMarker) return;

    fetchGuestSession()
      .then((guestData) => {
        if (!active || !guestData?.is_guest) return;
        setGuestName(guestData.nickname?.trim() || "Guest");
        setGuestAvatarSeed(guestData.avatar_id?.trim() || guestData.guest_id || "guest");
      })
      .catch(() => {
        if (!active) return;
        window.localStorage.removeItem(GUEST_MARKER_KEY);
        setGuestName(null);
        setGuestAvatarSeed(null);
      });

    return () => {
      active = false;
    };
  }, [session?.user, status]);

  const displayName = session?.user?.name?.trim() || guestName || "You";

  const avatarSrc = session?.user?.image?.trim()
    ? session.user.image
    : buildDicebearAvatar(guestAvatarSeed || displayName || DEFAULT_AVATAR_SEED);

  return {
    displayName,
    email: session?.user?.email,
    avatarSrc,
  };
}
