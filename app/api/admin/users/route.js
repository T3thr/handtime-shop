import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/mongodb';
import User from '@/backend/models/User';
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
    const search = searchParams.get("search") || "";

    await dbConnect();
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    // Get paginated users with full details - explicitly include createdAt
    const users = await User.find(query)
      .select('name email username avatar role isVerified stats lastLogin wishlist createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Process users to include additional stats
    const processedUsers = users.map(user => {
      return {
        ...user,
        stats: {
          ...user.stats,
          wishlistCount: user.wishlist ? user.wishlist.length : 0
        }
      };
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      users: processedUsers,
      total,
      totalPages,
      page,
      limit
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
