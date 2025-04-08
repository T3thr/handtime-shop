// app/api/cart/clear/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import User from "@/backend/models/User";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(options);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOneAndUpdate(
      {
        $or: [{ email: session.user?.email }, { lineId: session.user?.lineId }],
      },
      { $set: { cart: [] } },
      { new: true }
    ).select("cart");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ cart: user.cart });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to clear cart", details: error.message },
      { status: 500 }
    );
  }
}