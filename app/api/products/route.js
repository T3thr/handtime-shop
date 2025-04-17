import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/mongodb';
import Product from '@/backend/models/Product';

export async function GET(request) {
  try {
    await dbConnect();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    // Fetch products with pagination
    const [products, total] = await Promise.all([
      Product.find({ status: 'active' })
        .select('name slug description shortDescription price images categories averageRating reviewCount quantity continueSellingWhenOutOfStock')
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments({ status: 'active' }),
    ]);

    // Serialize numeric fields
    const serializedProducts = products.map(product => ({
      ...product,
      price: Number(product.price),
      quantity: Number(product.quantity),
      averageRating: Number(product.averageRating || 0),
      reviewCount: Number(product.reviewCount || 0),
    }));

    return NextResponse.json({
      products: serializedProducts,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}