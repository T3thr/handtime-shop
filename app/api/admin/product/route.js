import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/mongodb';
import Product from '@/backend/models/Product';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';

export async function GET(request) {
  const session = await getServerSession(options);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    await dbConnect();
    
    // Get total count for pagination
    const total = await Product.countDocuments();
    
    // Get paginated products with full details
    const products = await Product.find()
      .select('name slug price description images categories status quantity trackQuantity compareAtPrice costPerItem sku barcode vendor type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      products,
      total,
      totalPages,
      page,
      limit
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
