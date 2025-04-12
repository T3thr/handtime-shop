// app/api/cart/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import User from "@/backend/models/User";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(options);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({
      $or: [{ email: session.user?.email }, { lineId: session.user?.lineId }],
    }).select("cart");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Standardize cart item structure
    const cart = (user.cart || []).map((item) => ({
      productId: item.productId,
      name: item.name || "Unknown Product",
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      image: item.image || "/images/placeholder.jpg",
      variant: item.variant || {},
    }));

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(options);
    const { product } = await request.json();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !product ||
      !product.id ||
      !product.name ||
      product.price == null ||
      !product.quantity
    ) {
      return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
    }

    const existingUser = await User.findOne({
      $or: [{ email: session.user?.email }, { lineId: session.user?.lineId }],
      "cart.productId": product.id,
    });

    if (existingUser) {
      const existingItem = existingUser.cart.find((item) => item.productId === product.id);
      const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

      const user = await User.findOneAndUpdate(
        {
          $or: [{ email: session.user?.email }, { lineId: session.user?.lineId }],
          "cart.productId": product.id,
        },
        {
          $set: {
            "cart.$.quantity": newQuantity,
            "cart.$.lastUpdated": new Date(),
          },
        },
        { new: true }
      ).select("cart");

      return NextResponse.json({
        cart: (user.cart || []).map((item) => ({
          productId: item.productId,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          image: item.image || "/images/placeholder.jpg",
          variant: item.variant || {},
        })),
      });
    } else {
      const user = await User.findOneAndUpdate(
        {
          $or: [{ email: session.user?.email }, { lineId: session.user?.lineId }],
        },
        {
          $push: {
            cart: {
              productId: product.id,
              name: product.name,
              price: Number(product.price),
              quantity: 1,
              image: product.image || "/images/placeholder.jpg",
              variant: product.variant || {},
            },
          },
        },
        { new: true }
      ).select("cart");

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({
        cart: (user.cart || []).map((item) => ({
          productId: item.productId,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          image: item.image || "/images/placeholder.jpg",
          variant: item.variant || {},
        })),
      });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add to cart", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const session = await getServerSession(options);
    const { productId, quantity } = await request.json();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!productId || quantity == null || quantity < 0) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      {
        $or: [{ email: session.user?.email }, { lineId: session.user?.lineId }],
        "cart.productId": productId,
      },
      {
        $set: {
          "cart.$.quantity": Number(quantity),
          "cart.$.lastUpdated": new Date(),
        },
      },
      { new: true }
    ).select("cart");

    if (!user) {
      return NextResponse.json({ error: "Product not found in cart" }, { status: 404 });
    }

    return NextResponse.json({
      cart: (user.cart || []).map((item) => ({
        productId: item.productId,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.image || "/images/placeholder.jpg",
        variant: item.variant || {},
      })),
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: "Failed to update cart", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const session = await getServerSession(options);
    const { productId } = await request.json();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      {
        $or: [{ email: session.user?.email }, { lineId: session.user?.lineId }],
      },
      {
        $pull: { cart: { productId } },
      },
      { new: true }
    ).select("cart");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      cart: (user.cart || []).map((item) => ({
        productId: item.productId,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.image || "/images/placeholder.jpg",
        variant: item.variant || {},
      })),
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove from cart", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST_clear(request) {
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

    return NextResponse.json({ cart: [] });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { error: "Failed to clear cart", details: error.message },
      { status: 500 }
    );
  }
}

// Map the clear endpoint to /api/cart/clear
export const POST_clearRoute = POST_clear;