// app/api/orders/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import User from "@/backend/models/User";
import Product from "@/backend/models/Product";
import Order from "@/backend/models/Order";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function POST(request) {
  console.log("API /api/orders hit");

  try {
    await dbConnect();
    const session = await getServerSession(options);

    if (!session || !session.user) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Request body parsing error:", parseError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { cartItems, totalAmount, message, userName } = body;

    if (!cartItems || cartItems.length === 0 || !totalAmount || !userName) {
      console.log("Invalid order data received:", body);
      return NextResponse.json({ error: "Invalid order data: Missing required fields" }, { status: 400 });
    }

    const userQuery = { $or: [{ email: session.user.email }, { lineId: session.user.lineId }] };
    const user = await User.findOne(userQuery);

    if (!user) {
      console.log("User not found for session:", session.user);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check stock and update quantities
    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        console.log(`Product not found: ${item.productId}`);
        return NextResponse.json({ error: `Product ${item.name} not found` }, { status: 404 });
      }
      if (product.trackQuantity && product.quantity < item.quantity) {
        if (!product.continueSellingWhenOutOfStock) {
          console.log(`Out of stock: ${item.name}`);
          return NextResponse.json({ error: `${item.name} is out of stock` }, { status: 400 });
        }
      }
      if (product.trackQuantity) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: -item.quantity } });
      }
    }

    // Create new order with userName
    const order = new Order({
      userId: user._id,
      userName, // Add userName to the order
      items: cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || "/images/placeholder.jpg",
        variant: item.variant || {},
      })),
      totalAmount,
      paymentMethod: "line",
      message,
    });

    await order.save();

    // Update user stats and clear cart
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: { cart: [] },
        $inc: { "stats.totalOrders": 1, "stats.totalSpent": totalAmount },
        "stats.lastOrderDate": new Date(),
      }
    );

    console.log("Order processed successfully for user:", user._id, "Order ID:", order.orderId);
    return NextResponse.json({ success: true, orderId: order.orderId }, { status: 200 });
  } catch (error) {
    console.error("Order processing error:", error);
    return NextResponse.json(
      { error: "Failed to process order", details: error.message || "Unknown server error" },
      { status: 500 }
    );
  }
}

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