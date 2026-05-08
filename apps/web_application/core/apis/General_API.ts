export async function logoutGuestSession() {
  const res = await fetch("/api/auth/guest", { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to logout guest session");
  }
  return res.json().catch(() => ({}));
}

