import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import User from "@/backend/models/User";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(options);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const userQuery = { $or: [{ email: session.user.email }, { lineId: session.user.lineId }] };
    
    // Get user with wishlist
    const user = await User.findOne(userQuery).select("wishlist");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get total count for pagination
    const total = user.wishlist.length;
    
    // Apply pagination to wishlist
    const paginatedWishlist = user.wishlist.slice(skip, skip + limit);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ 
      wishlist: paginatedWishlist, 
      total,
      totalPages,
      page,
      limit
    }, { status: 200 });
  } catch (error) {
    console.error("Wishlist fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist", details: error.message },
      { status: 500 }
    );
  }
}
