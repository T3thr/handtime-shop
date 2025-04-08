import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/mongodb';
import Order from '@/backend/models/Order';
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
    const status = searchParams.get("status") || null;

    await dbConnect();
    
    // Build query
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Get total count for pagination
    const total = await Order.countDocuments(query);
    
    // Get paginated orders
    const orders = await Order.find(query)
      .select('orderId userId totalAmount status createdAt updatedAt items')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      orders,
      total,
      totalPages,
      page,
      limit
    });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
