import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/backend/lib/mongodb';
import Review from '@/backend/models/Review';
import Product from '@/backend/models/Product';
import User from '@/backend/models/User';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';

export async function GET(request, { params }) {
  const { id } = params;

  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid review ID', details: 'Review ID format is incorrect' },
        { status: 400 }
      );
    }

    const review = await Review.findById(id)
      .populate('userId', 'name avatar')
      .populate('productId', 'name images')
      .lean();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Failed to fetch review:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Failed to fetch review', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  const session = await getServerSession(options);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', details: 'Please log in to update a review' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid review ID', details: 'Review ID format is incorrect' },
        { status: 400 }
      );
    }

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.userId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          details: 'You are not authorized to update this review',
        },
        { status: 403 }
      );
    }

    const data = await request.json();

    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      return NextResponse.json(
        {
          error: 'Invalid rating',
          details: 'Rating must be between 1 and 5',
        },
        { status: 400 }
      );
    }

    // Update review fields
    if (data.rating) review.rating = data.rating;
    if (data.title !== undefined) review.title = data.title?.trim() || '';
    if (data.comment !== undefined) review.comment = data.comment?.trim() || '';
    if (data.images) review.images = data.images;
    if (session.user.role === 'admin' && data.status) {
      review.status = data.status;
    }

    review.updatedAt = new Date();
    await review.save();

    // Update user stats
    if (review.userId.toString() === session.user.id || (session.user.role === 'admin' && data.status)) {
      await User.findByIdAndUpdate(session.user.id, {
        $set: { 'stats.lastReviewDate': new Date() },
      });
    }

    // Update product stats
    const productReviews = await Review.find({
      productId: review.productId,
      status: 'approved',
    });
    const reviewCount = productReviews.length;
    const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;

    await Product.findByIdAndUpdate(review.productId, {
      averageRating,
      reviewCount,
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Failed to update review:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to update review',
        details: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  const session = await getServerSession(options);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', details: 'Please log in to delete a review' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid review ID', details: 'Review ID format is incorrect' },
        { status: 400 }
      );
    }

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.userId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          details: 'You are not authorized to delete this review',
        },
        { status: 403 }
      );
    }

    await Review.findByIdAndDelete(id);

    await User.findByIdAndUpdate(review.userId, {
      $pull: { reviews: review._id },
      $inc: { 'stats.totalReviews': -1 },
    });

    const productReviews = await Review.find({ productId: review.productId, status: 'approved' });
    const reviewCount = productReviews.length;
    const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;

    await Product.findByIdAndUpdate(review.productId, {
      averageRating,
      reviewCount,
    });

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Failed to delete review:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to delete review',
        details: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}