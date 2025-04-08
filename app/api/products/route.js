import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/mongodb';
import Product from '@/backend/models/Product';

export async function GET() {
  try {
    await dbConnect();
    const products = await Product.find({ status: 'active' })
      .select('name slug description price images categories averageRating reviewCount')
      .lean();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}