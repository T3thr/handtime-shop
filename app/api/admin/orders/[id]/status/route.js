import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import Order from "@/backend/models/Order";
import User from "@/backend/models/User";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function PUT(request, { params }) {
  const { id } = params;
  const session = await getServerSession(options);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 });
    }
    
    const data = await request.json();
    
    if (!data.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Update the order status
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: data.status,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate({
      path: 'userId',
      select: 'name email avatar role',
      model: User
    });

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Failed to update order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status", details: error.message },
      { status: 500 }
    );
  }
}
