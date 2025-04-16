// app/api/products/[id]/route.js
import Product from "@/backend/models/Product";
import dbConnect from "@/backend/lib/mongodb";

export async function GET(request, { params }) {
  await dbConnect();
  const { id } = params;

  // Add validation for the ID
  if (!id || id === 'undefined') {
    return new Response(JSON.stringify({ message: "Invalid product ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const product = await Product.findById(id).lean();
    if (!product) {
      return new Response(JSON.stringify({ message: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
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

    return new Response(JSON.stringify(serializedProduct), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}