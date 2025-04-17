import Product from "@/backend/models/Product";
import dbConnect from "@/backend/lib/mongodb";
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  await dbConnect();
  const { id } = params;

  // Add validation for the ID
  if (!id || id === 'undefined') {
    return NextResponse.json({ message: "Invalid product ID" }, { status: 400 });
  }

  try {
    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    // Ensure numeric fields are plain numbers, not MongoDB BSON objects
    const serializedProduct = {
      ...product,
      price: Number(product.price),
      quantity: Number(product.quantity),
      averageRating: Number(product.averageRating),
      reviewCount: Number(product.reviewCount),
      weight: product.weight ? Number(product.weight) : null,
      costPerItem: product.costPerItem ? Number(product.costPerItem) : null,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    };

    return NextResponse.json(serializedProduct, {
      headers: {
        'Cache-Control': 'no-store, max-age=0', // Prevent caching
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}