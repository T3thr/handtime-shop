// app/api/auth/line/register/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import User from "@/backend/models/User";

export async function POST(request) {
  try {
    await dbConnect();

    const { userId, displayName, pictureUrl, idToken } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "LINE user ID is required" }, { status: 400 });
    }

    let user = await User.findOne({ lineId: userId });

    if (!user) {
      user = new User({
        lineId: userId,
        name: displayName || `LINE User ${userId.slice(0, 4)}`,
        avatar: pictureUrl && /^(https?:\/\/).+/.test(pictureUrl) ? pictureUrl : null, // Validate URL or set null
        role: "user",
        email: null,
        username: null,
        password: null,
        cart: [],
        wishlist: [],
        orders: [], // Empty array, orderId defaults will apply when orders are added
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
      await user.save();
    } else {
      user.lastLogin = new Date();
      if (!user.avatar && pictureUrl && /^(https?:\/\/).+/.test(pictureUrl)) {
        user.avatar = pictureUrl;
      }
      if (!user.name && displayName) {
        user.name = displayName;
      }
      await user.save();
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        lineId: user.lineId,
        avatar: user.avatar,
        role: user.role,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("LINE registration error:", error);
    return NextResponse.json(
      { error: "Failed to register LINE user", details: error.message },
      { status: 500 }
    );
  }
}