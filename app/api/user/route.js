import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import User from "@/backend/models/User";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request) {
  try {
    const session = await getServerSession(options);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await dbConnect();
    
    // Find user by email or lineId
    const userQuery = { $or: [{ email: session.user.email }, { lineId: session.user.lineId }] };
    const user = await User.findOne(userQuery)
      .select("name email username avatar role isVerified stats lastLogin wishlist")
      .lean();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Count wishlist items
    const wishlistCount = user.wishlist ? user.wishlist.length : 0;
    
    // Prepare user data with stats
    const userData = {
      ...user,
      stats: {
        ...(user.stats || {}),
        wishlistCount
      }
    };
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
  }
}
