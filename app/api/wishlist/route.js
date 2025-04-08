// app/api/wishlist/route.js
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

    const { productId, action } = await request.json();

    if (!productId || !["add", "remove", "toggle"].includes(action)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const userQuery = { $or: [{ email: session.user.email }, { lineId: session.user.lineId }] };
    const user = await User.findOne(userQuery);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const wishlistItem = { productId, addedAt: new Date() };
    let message;

    if (action === "add") {
      if (!user.wishlist.some((item) => item.productId.toString() === productId)) {
        await User.updateOne(
          { _id: user._id },
          { $push: { wishlist: wishlistItem } }
        );
        message = "Added to wishlist";
      } else {
        message = "Already in wishlist";
      }
    } else if (action === "remove") {
      if (user.wishlist.some((item) => item.productId.toString() === productId)) {
        await User.updateOne(
          { _id: user._id },
          { $pull: { wishlist: { productId } } }
        );
        message = "Removed from wishlist";
      } else {
        message = "Not in wishlist";
      }
    } else if (action === "toggle") {
      const isInWishlist = user.wishlist.some((item) => item.productId.toString() === productId);
      if (isInWishlist) {
        await User.updateOne(
          { _id: user._id },
          { $pull: { wishlist: { productId } } }
        );
        message = "Removed from wishlist";
      } else {
        await User.updateOne(
          { _id: user._id },
          { $push: { wishlist: wishlistItem } }
        );
        message = "Added to wishlist";
      }
    }

    return NextResponse.json({ success: true, message }, { status: 200 });
  } catch (error) {
    console.error("Wishlist error:", error);
    return NextResponse.json(
      { error: "Failed to update wishlist", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(options);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userQuery = { $or: [{ email: session.user.email }, { lineId: session.user.lineId }] };
    const user = await User.findOne(userQuery).select("wishlist");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ wishlist: user.wishlist }, { status: 200 });
  } catch (error) {
    console.error("Wishlist fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist", details: error.message },
      { status: 500 }
    );
  }
}