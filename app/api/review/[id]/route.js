import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/backend/lib/mongodb';
import Review from '@/backend/models/Review';
import Product from '@/backend/models/Product';
import User from '@/backend/models/User';
import Order from '@/backend/models/Order';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userOnly = searchParams.get('userOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;
    const query = {};

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
      }
      query.productId = productId;
    }

    if (userOnly) {
      const session = await getServerSession(options);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      query.userId = session.user.id;
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name avatar')
        .populate('productId', 'name images')
        .lean(),
      Review.countDocuments(query),
    ]);

    let averageRating = 0;
    let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (productId) {
      const visibleReviews = await Review.find({ productId, status: 'show' }).lean();
      if (visibleReviews.length > 0) {
        const totalRating = visibleReviews.reduce((sum, review) => sum + review.rating, 0);
        averageRating = parseFloat((totalRating / visibleReviews.length).toFixed(1));
        ratingCounts = visibleReviews.reduce((acc, review) => {
          const rating = Math.floor(review.rating);
          if (rating >= 1 && rating <= 5) {
            acc[rating] = (acc[rating] || 0) + 1;
          }
          return acc;
        }, ratingCounts);
      }
    }

    return NextResponse.json({
      reviews,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      averageRating,
      ratingCounts,
    });
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await getServerSession(options);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const data = await request.json();

    // Validate required fields
    const missingFields = [];
    if (!data.productId) missingFields.push('productId');
    if (!data.orderId) missingFields.push('orderId');
    if (!data.rating) missingFields.push('rating');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(data.productId)) {
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(data.orderId)) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    // Validate rating
    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    // Check if product exists
    const product = await Product.findById(data.productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Initialize reviews array if undefined
    if (!product.reviews) {
      product.reviews = [];
    }

    // Check if order exists and belongs to user
    const order = await Order.findById(data.orderId);
    if (!order || order.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Order not found or not authorized' }, { status: 404 });
    }

    // Check for duplicate review
    const existingReview = await Review.findOne({
      userId: session.user.id,
      productId: data.productId,
      orderId: data.orderId,
    });
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product for this order' },
        { status: 400 }
      );
    }

    // Create review
    const review = new Review({
      userId: session.user.id,
      productId: data.productId,
      orderId: data.orderId,
      rating: data.rating,
      title: data.title?.trim() || '',
      comment: data.comment?.trim() || '',
      images: Array.isArray(data.images) ? data.images : [],
      verifiedPurchase: true,
      status: 'show',
    });

    // Save review
    await review.save();

    // Update user
    await User.findByIdAndUpdate(session.user.id, {
      $push: { reviews: review._id },
      $inc: { 'stats.totalReviews': 1 },
      $set: { 'stats.lastReviewDate': new Date() },
    });

    // Update product reviews array
    product.reviews.push({
      userId: new mongoose.Types.ObjectId(session.user.id),
      rating: data.rating,
      title: data.title?.trim() || '',
      comment: data.comment?.trim() || '',
      images: Array.isArray(data.images) ? data.images : [],
      verifiedPurchase: true,
      createdAt: new Date(),
    });

    // Recalculate product stats based on Review collection
    const visibleReviews = await Review.find({ productId: data.productId, status: 'show' });
    const reviewCount = visibleReviews.length;
    const totalRating = visibleReviews.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;
    product.reviewCount = reviewCount;

    await product.save();

    // Update order to mark the product as reviewed
    const itemIndex = order.items.findIndex(item => 
      item.productId.toString() === data.productId.toString()
    );
    
    if (itemIndex !== -1) {
      order.items[itemIndex].reviewStatus = true;
      await order.save();
    } else {
      console.warn(`Item with productId ${data.productId} not found in order ${data.orderId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    console.error('Failed to create review:', error);
    return NextResponse.json(
      {
        error: 'Failed to create review',
        details: error.message || 'An unexpected error occurred',
      },
      { status: error.status || 500 }
    );
  }
}