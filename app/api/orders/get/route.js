// app/api/orders/get/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import Order from "@/backend/models/Order";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(options);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    const skip = (page - 1) * limit;
    const total = await Order.countDocuments({ userId: session.user.id });
    const orders = await Order.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("items.productId", "name price image");

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      orders,
      page,
      limit,
      total,
      totalPages,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders", details: error.message }, { status: 500 });
  }
}