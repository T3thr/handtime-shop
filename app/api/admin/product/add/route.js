import { NextResponse } from "next/server";
import dbConnect from "@/backend/lib/mongodb";
import Product from "@/backend/models/Product";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function POST(request) {
  const session = await getServerSession(options);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const productData = await request.json();
    
    // Validate required fields
    if (!productData.name || !productData.slug || !productData.price) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'Name, slug, and price are required' 
      }, { status: 400 });
    }
    
    // Check if product with same slug already exists
    const existingProduct = await Product.findOne({ slug: productData.slug });
    if (existingProduct) {
      return NextResponse.json({ 
        error: 'Product with this slug already exists' 
      }, { status: 400 });
    }
    
    // Add metadata
    const newProductData = {
      ...productData,
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create new product
    const newProduct = new Product(newProductData);
    await newProduct.save();
    
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ 
      error: 'Failed to create product', 
      details: error.message 
    }, { status: 500 });
  }
}
