import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import Order from "@/backend/models/Order";
import User from "@/backend/models/User";
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
    
    // Find user by session ID
    const user = await User.findById(session.user.id).select('_id');
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const total = await Order.countDocuments({ userId: user._id });
    const orders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("items.productId", "name price images");

    // Process orders to ensure consistent data format
    const processedOrders = orders.map(order => {
      const orderObj = order.toObject ? order.toObject() : order;
      
      // Process items to ensure image URLs are consistent
      if (orderObj.items && Array.isArray(orderObj.items)) {
        orderObj.items = orderObj.items.map(item => {
          let image = item.image;
          
          // If product has images, use the first one
          if (item.productId && item.productId.images && item.productId.images.length > 0) {
            image = item.productId.images[0].url;
          }
          
          return {
            ...item,
            image: image || "/images/placeholder.jpg"
          };
        });
      }
      
      return orderObj;
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      orders: processedOrders,
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
