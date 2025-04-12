import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/backend/lib/mongodb';
import Review from '@/backend/models/Review';
import Product from '@/backend/models/Product';
import User from '@/backend/models/User';
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
        .lean(),
      Review.countDocuments(query),
    ]);

    let averageRating = 0;
    let ratingCounts = {};
    if (productId) {
      const productReviews = await Review.find({ productId, status: 'approved' }).lean();
      if (productReviews.length > 0) {
        const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
        averageRating = parseFloat((totalRating / productReviews.length).toFixed(1));
        ratingCounts = productReviews.reduce((acc, review) => {
          acc[review.rating] = (acc[review.rating] || 0) + 1;
          return acc;
        }, {});
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

    if (!data.productId || !data.orderId || !data.rating) {
      return NextResponse.json(
        { error: 'Product ID, Order ID, and rating are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(data.productId) || !mongoose.Types.ObjectId.isValid(data.orderId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    if (data.rating < 1 || data.rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

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

    const sessionMongo = await mongoose.startSession();
    sessionMongo.startTransaction();

    try {
      const review = new Review({
        userId: session.user.id,
        productId: data.productId,
        orderId: data.orderId,
        rating: data.rating,
        title: data.title?.trim() || '',
        comment: data.comment?.trim() || '',
        images: data.images || [],
        verifiedPurchase: true,
        status: 'pending',
      });

      await review.save({ session: sessionMongo });

      await User.findByIdAndUpdate(
        session.user.id,
        {
          $push: { reviews: review._id },
          $inc: { 'stats.totalReviews': 1 },
          $set: { 'stats.lastReviewDate': new Date() },
        },
        { session: sessionMongo }
      );

      const productReviews = await Review.find({ productId: data.productId, status: 'approved' }).session(
        sessionMongo
      );
      const reviewCount = productReviews.length + (review.status === 'approved' ? 1 : 0);
      const totalRating =
        productReviews.reduce((sum, r) => sum + r.rating, 0) + (review.status === 'approved' ? review.rating : 0);
      const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;

      await Product.findByIdAndUpdate(
        data.productId,
        {
          averageRating,
          reviewCount,
        },
        { session: sessionMongo }
      );

      await sessionMongo.commitTransaction();
      return NextResponse.json(review);
    } catch (error) {
      await sessionMongo.abortTransaction();
      throw error;
    } finally {
      sessionMongo.endSession();
    }
  } catch (error) {
    console.error('Failed to create review:', error);
    return NextResponse.json(
      { error: 'Failed to create review', details: error.message },
      { status: error.status || 500 }
    );
  }
}