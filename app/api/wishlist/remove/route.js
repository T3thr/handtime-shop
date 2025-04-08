import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import User from "@/backend/models/User";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(options);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const userQuery = { $or: [{ email: session.user.email }, { lineId: session.user.lineId }] };
    const user = await User.findOne(userQuery);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the product is in the wishlist before attempting to remove
    const isInWishlist = user.wishlist.some((item) => item.productId.toString() === productId);

    if (!isInWishlist) {
      return NextResponse.json({ success: false, message: "Not in wishlist" }, { status: 200 });
    }

    // Remove the product from the wishlist
    await User.updateOne(
      { _id: user._id },
      { $pull: { wishlist: { productId } } }
    );

    return NextResponse.json({ 
      success: true, 
      message: "Removed from wishlist" 
    }, { status: 200 });

  } catch (error) {
    console.error("Wishlist remove error:", error);
    return NextResponse.json(
      { error: "Failed to remove from wishlist", details: error.message },
      { status: 500 }
    );
  }
}