// app/api/products/[id]/route.js
import Product from "@/backend/models/Product";
import dbConnect from "@/backend/lib/mongodb";

export async function GET(request, { params }) {
  await dbConnect();
  const { id } = params;

  try {
    const product = await Product.findById(id).lean();
    if (!product) {
      return new Response(JSON.stringify({ message: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const serializedProduct = {
      _id: product._id,
      id: product._id,
      productId: product._id,
      name: product.title || product.name || "Unknown Product",
      price: Number(product.price) || 0,
      quantity: Number(product.quantity) || 0,
      image: product.images?.[0]?.url || product.image || "/images/placeholder.jpg",
      variant: product.variants?.[0] || product.variant || {},
      averageRating: Number(product.averageRating) || 0,
      reviewCount: Number(product.reviewCount) || 0,
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
    return new Response(JSON.stringify({ message: "Server error", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}