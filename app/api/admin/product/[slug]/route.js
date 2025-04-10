import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import Product from "@/backend/models/Product";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request, { params }) {
  const { slug } = params;
  const session = await getServerSession(options);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const product = await Product.findOne({ slug }).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { slug } = params;
  const session = await getServerSession(options);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const productData = await request.json();

    // Validate required fields
    if (!productData.name || !productData.slug || !productData.price) {
      return NextResponse.json(
        { error: "Missing required fields", details: "Name, slug, and price are required" },
        { status: 400 }
      );
    }

    // Check if the new slug is already taken by another product
    const existingProduct = await Product.findOne({ slug: productData.slug });
    if (existingProduct && existingProduct._id.toString() !== productData._id) {
      return NextResponse.json({ error: "Slug already in use by another product" }, { status: 400 });
    }

    // Update the product
    const updatedProduct = await Product.findOneAndUpdate(
      { slug },
      {
        ...productData,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Failed to update product", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { slug } = params;
  const session = await getServerSession(options);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const deletedProduct = await Product.findOneAndDelete({ slug });
    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
