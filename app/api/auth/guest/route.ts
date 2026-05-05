import { NextResponse } from "next/server";
import { connectToDatabase } from "@/core/db/mongoose";
import { GuestLoginModel } from "@/core/models/guest_login";
import crypto from "crypto";

// Create a new guest session
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { nickname, avatar_id, gender, interests, age_confirmed, terms_accepted } = body;
    
    if (!nickname || !avatar_id || !age_confirmed || !terms_accepted) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // IP Hash
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ip_hash = crypto.createHash("sha256").update(ip).digest("hex");

    const guest_id = crypto.randomUUID();
    const session_token = crypto.randomBytes(32).toString("hex");
    
    const now = new Date();
    const session_expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
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
      session_token,
      nickname,
      avatar_id,
      gender: newGuest.gender,
      interests: newGuest.interests,
      is_guest: true,
      created_at: now.toISOString(),
      expires_at: session_expires_at.toISOString(),
    });

    response.cookies.set("guest_session_token", session_token, { maxAge: 24 * 60 * 60, path: "/", httpOnly: true });
    response.cookies.set("guest_id", guest_id, { maxAge: 24 * 60 * 60, path: "/", httpOnly: true });

    return response;
  } catch (error: unknown) {
    console.error("Guest login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Refresh an existing guest session
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { guest_id, session_token } = body;
    
    if (!guest_id || !session_token) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const guest = await GuestLoginModel.findOne({ guest_id, session_token });
    
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
    guest.session_expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    await guest.save();

    const response = NextResponse.json({
      success: true,
      guest_id: guest.guest_id,
      session_token: guest.session_token,
      nickname: guest.nickname,
      avatar_id: guest.avatar_id,
      gender: guest.gender,
      interests: guest.interests,
      is_guest: true,
      created_at: guest.created_at.toISOString(),
      expires_at: guest.session_expires_at.toISOString(),
    });

    response.cookies.set("guest_session_token", guest.session_token, { maxAge: 24 * 60 * 60, path: "/", httpOnly: true });
    response.cookies.set("guest_id", guest.guest_id, { maxAge: 24 * 60 * 60, path: "/", httpOnly: true });

    return response;
  } catch (error: unknown) {
    console.error("Guest refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Logout guest session
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  
  response.cookies.delete("guest_session_token");
  response.cookies.delete("guest_id");
  
  return response;
}
