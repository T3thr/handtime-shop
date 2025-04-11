import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';

export async function GET(request) {
  const session = await getServerSession(options);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Get pagination parameters and filters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status') || 'all';
    const skip = (page - 1) * limit;
    
    // Build query based on status filter
    const query = status !== 'all' ? { status } : {};
    
    // Count total orders for pagination
    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Fetch orders with pagination and populate user data
    const orders = await Order.find(query)
      .populate({
        path: 'userId',
        select: 'name email avatar',
        model: User
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Process orders to ensure user data is properly formatted
    const processedOrders = orders.map(order => {
      // Add user information to the order object
      const userEmail = order.userId?.email || 'Unknown';
      const userName = order.userId?.name || order.userName || 'Unknown';
      const userAvatar = order.userId?.avatar || null;
      
      return {
        ...order,
        userEmail,
        userName,
        userAvatar
      };
    });
    
    return NextResponse.json({
      orders: processedOrders,
      page,
      limit,
      total,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
