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
    
    // Get paginated orders with full details
    const orders = await Order.find(query)
      .populate({
        path: 'userId',
        select: 'name email username'
      })
      .populate({
        path: 'items.productId',
        select: 'name images price'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Process orders to include user and product details
    const processedOrders = orders.map(order => {
      return {
        ...order,
        userName: order.userId ? order.userId.name : 'Unknown User',
        userEmail: order.userId ? order.userId.email : null,
        items: order.items.map(item => ({
          ...item,
          product: item.productId ? {
            _id: item.productId._id,
            name: item.productId.name,
            price: item.productId.price,
            image: item.productId.images && item.productId.images.length > 0 
              ? item.productId.images[0].url 
              : null
          } : null
        }))
      };
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      orders: processedOrders,
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
