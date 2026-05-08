import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/core/db/mongoose";
import { GuestLoginModel } from "@/core/models/guest_login";

export async function getServerAuthSession() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const customUser = session.user as {
      id?: string;
      user_id?: string;
      name?: string | null;
      image?: string | null;
      email?: string | null;
      provider?: string;
    };

    return {
      ...session,
      user: {
        ...session.user,
        user_id: customUser.id || customUser.user_id,
        display_name: customUser.name,
        avatar: customUser.image,
        auth_type: customUser.provider || "registered",
        is_verified: true,
      },
    };
  }

  // Check guest session cookies
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;
    const guestToken = cookieStore.get("guest_session_token")?.value;

    if (guestId && guestToken) {
      await connectToDatabase();
      const guest = await GuestLoginModel.findOne({ guest_id: guestId, session_token: guestToken });

      if (guest && !guest.ban_status && new Date() <= guest.session_expires_at) {
        return {
          user: {
            // NextAuth compatibility
            id: guest.guest_id,
            name: guest.nickname,
            image: guest.avatar_id,
            email: `guest-${guest.guest_id}@guest.local`,

            // Unified User Object
            user_id: guest.guest_id,
            display_name: guest.nickname,
            avatar: guest.avatar_id,
            auth_type: "guest",
            gender: guest.gender,
            interests: guest.interests,
            is_verified: false,
            session_token: guest.session_token,
          },
        };
      }
    }
  } catch (err) {
    console.error("Error retrieving guest session:", err);
  }

  return null;
}
