import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import Order from "@/backend/models/Order";
import User from "@/backend/models/User";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request) {
  const session = await getServerSession(options);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "all";
    const skip = (page - 1) * limit;

    await dbConnect();
    
    // Build query based on status filter
    const query = status !== "all" ? { status } : {};
    
    // Get total count for pagination
    const total = await Order.countDocuments(query);
    
    // Get paginated orders with populated user data
    const orders = await Order.find(query)
      .populate({
        path: 'userId',
        select: 'name email avatar role',
        model: User
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      orders,
      total,
      totalPages,
      page,
      limit
    });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// Update order status endpoint
export async function PUT(request) {
  const session = await getServerSession(options);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const data = await request.json();
    
    if (!data.orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(
      data.orderId,
      { 
        status: data.status,
        updatedBy: session.user.id,
        updatedAt: new Date()
      },
      { new: true }
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
    console.error("Failed to update order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
