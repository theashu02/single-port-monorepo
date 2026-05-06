import { GuestSessionData, CreateGuestPayload } from "@/core/constants/guest_constant";

export async function createGuestSession(payload: CreateGuestPayload): Promise<GuestSessionData> {
  const res = await fetch("/api/auth/guest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to create guest session");
  }
  return data;
}

export async function refreshGuestSession(guestId?: string, sessionToken?: string): Promise<GuestSessionData> {
  const res = await fetch("/api/auth/guest", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(
      guestId && sessionToken
        ? {
            guest_id: guestId,
            session_token: sessionToken,
          }
        : {},
    ),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to refresh guest session");
  }
  return data;
}

export async function fetchGuestSession(): Promise<GuestSessionData> {
  const res = await fetch("/api/auth/guest", {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch guest session");
  }
  return data;
}
