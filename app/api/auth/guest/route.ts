import { NextResponse } from "next/server";
import { connectToDatabase } from "@/core/db/mongoose";
import { GuestLoginModel } from "@/core/models/guest_login";
import crypto from "crypto";

const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;
const COOKIE_OPTIONS = {
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

function isValidOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (!host) return false;
  const expectedOrigin = `${proto}://${host}`;
  return origin === expectedOrigin;
}

function validateGuestPayload(body: unknown) {
  if (!body || typeof body !== "object") {
    return { valid: false as const, message: "Invalid payload" };
  }

  const data = body as Record<string, unknown>;
  const nickname = typeof data.nickname === "string" ? data.nickname.trim() : "";
  const avatarId = typeof data.avatar_id === "string" ? data.avatar_id.trim() : "";
  const ageConfirmed = data.age_confirmed === true;
  const termsAccepted = data.terms_accepted === true;
  const gender = typeof data.gender === "string" ? data.gender.trim().toLowerCase() : null;
  const interests = Array.isArray(data.interests) ? data.interests.filter((i): i is string => typeof i === "string").slice(0, 5) : [];

  if (!nickname || nickname.length > 20) {
    return { valid: false as const, message: "Invalid nickname" };
  }
  if (!avatarId || avatarId.length > 64) {
    return { valid: false as const, message: "Invalid avatar" };
  }
  if (!ageConfirmed || !termsAccepted) {
    return { valid: false as const, message: "Age and terms confirmation required" };
  }

  return {
    valid: true as const,
    payload: {
      nickname,
      avatar_id: avatarId,
      age_confirmed: ageConfirmed,
      terms_accepted: termsAccepted,
      gender: gender || null,
      interests,
    },
  };
}

async function getGuestFromRequest(req: Request) {
  const body = await req.json().catch(() => ({}));
  const bodyGuestId = typeof body?.guest_id === "string" ? body.guest_id : null;
  const bodySessionToken = typeof body?.session_token === "string" ? body.session_token : null;

  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...rest] = part.split("=");
        return [key, decodeURIComponent(rest.join("=") ?? "")];
      }),
  );

  const guest_id = bodyGuestId ?? cookies.guest_id ?? null;
  const session_token = bodySessionToken ?? cookies.guest_session_token ?? null;
  if (!guest_id || !session_token) return null;

  await connectToDatabase();
  return GuestLoginModel.findOne({ guest_id, session_token });
}

export async function GET(req: Request) {
  try {
    const guest = await getGuestFromRequest(req);
    if (!guest || guest.ban_status || new Date() > guest.session_expires_at) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      guest_id: guest.guest_id,
      nickname: guest.nickname,
      avatar_id: guest.avatar_id,
      gender: guest.gender,
      interests: guest.interests,
      is_guest: true,
      created_at: guest.created_at.toISOString(),
      expires_at: guest.session_expires_at.toISOString(),
    });
  } catch (error: unknown) {
    console.error("Guest session fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create a new guest session
export async function POST(req: Request) {
  try {
    if (!isValidOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    await connectToDatabase();

    const parsed = validateGuestPayload(await req.json().catch(() => null));
    if (!parsed.valid) {
      return NextResponse.json({ error: parsed.message }, { status: 400 });
    }
    const { nickname, avatar_id, gender, interests, age_confirmed, terms_accepted } = parsed.payload;

    // IP Hash
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ip_hash = crypto.createHash("sha256").update(ip).digest("hex");

    const guest_id = crypto.randomUUID();
    const session_token = crypto.randomBytes(32).toString("hex");

    const now = new Date();
    const session_expires_at = new Date(now.getTime() + SESSION_MAX_AGE_MS);

    const newGuest = new GuestLoginModel({
      id: crypto.randomUUID(),
      guest_id,
      session_token,
      nickname,
      avatar_id,
      gender: gender || null,
      interests: interests || [],
      age_confirmed,
      terms_accepted,
      terms_accepted_at: now,
      ip_hash,
      created_at: now,
      last_seen_at: now,
      session_expires_at,
    });

    await newGuest.save();

    const response = NextResponse.json({
      success: true,
      guest_id,
      nickname,
      avatar_id,
      gender: newGuest.gender,
      interests: newGuest.interests,
      is_guest: true,
      created_at: now.toISOString(),
      expires_at: session_expires_at.toISOString(),
    });

    response.cookies.set("guest_session_token", session_token, COOKIE_OPTIONS);
    response.cookies.set("guest_id", guest_id, COOKIE_OPTIONS);

    return response;
  } catch (error: unknown) {
    console.error("Guest login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Refresh an existing guest session
export async function PUT(req: Request) {
  try {
    if (!isValidOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const guest = await getGuestFromRequest(req);
    if (!guest) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (guest.ban_status) {
      return NextResponse.json({ error: "Account banned" }, { status: 403 });
    }

    const now = new Date();
    
    if (now > guest.session_expires_at) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    guest.last_seen_at = now;
    guest.session_expires_at = new Date(now.getTime() + SESSION_MAX_AGE_MS);
    guest.session_token = crypto.randomBytes(32).toString("hex");

    await guest.save();

    const response = NextResponse.json({
      success: true,
      guest_id: guest.guest_id,
      nickname: guest.nickname,
      avatar_id: guest.avatar_id,
      gender: guest.gender,
      interests: guest.interests,
      is_guest: true,
      created_at: guest.created_at.toISOString(),
      expires_at: guest.session_expires_at.toISOString(),
    });

    response.cookies.set("guest_session_token", guest.session_token, COOKIE_OPTIONS);
    response.cookies.set("guest_id", guest.guest_id, COOKIE_OPTIONS);

    return response;
  } catch (error: unknown) {
    console.error("Guest refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Logout guest session
export async function DELETE(req: Request) {
  if (!isValidOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  response.cookies.delete("guest_session_token");
  response.cookies.delete("guest_id");

  return response;
}
