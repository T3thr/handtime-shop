// app/api/orders/get/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import Order from "@/backend/models/Order";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(options);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await Order.find({ userId: session.user._id })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name price");

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders", details: error.message }, { status: 500 });
  }
}
