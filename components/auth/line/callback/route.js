// app/api/auth/line/callback/route.js
import { NextResponse } from "next/server";
import { signIn } from "next-auth/react"; // Note: This is for server-side usage
import User from "@/backend/models/User";
import mongodbConnect from "@/backend/lib/mongodb";

export async function POST(request) {
  try {
    await mongodbConnect();

    const { userId, displayName, pictureUrl } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "LINE user ID is required" }, { status: 400 });
    }

    // Check if user exists in MongoDB
    let user = await User.findOne({ lineId: userId });

    if (!user) {
      // Create new LINE user
      user = await User.create({
        lineId: userId,
        name: displayName || `LINE User ${userId.slice(0, 4)}`,
        avatar: pictureUrl || null,
        role: "user",
        email: null,
        username: null,
        password: null,
        cart: [],
        wishlist: [],
        orders: [],
        addresses: [],
        isVerified: true,
        lastLogin: new Date(),
        preferences: {
          theme: "system",
          notifications: { email: true, sms: false },
        },
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
        },
      });
    } else {
      // Update lastLogin for existing user
      user.lastLogin = new Date();
      await user.save();
    }

    // Trigger NextAuth sign-in with LINE credentials
    const signInResponse = await signIn("line", {
      redirect: false,
      userId,
      displayName,
      pictureUrl,
    });

    if (!signInResponse || signInResponse.error) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        lineId: user.lineId,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LINE callback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}