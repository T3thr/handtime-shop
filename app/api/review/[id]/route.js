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
      return NextResponse.json({ error: 'Invalid review ID format' }, { status: 400 });
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
    console.error('Failed to fetch review:', error);
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid review ID format' }, { status: 400 });
    }

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.userId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to update this review' }, { status: 403 });
    }

    const data = await request.json();

    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const sessionMongo = await mongoose.startSession();
    sessionMongo.startTransaction();

    try {
      if (data.rating) review.rating = data.rating;
      if (data.title !== undefined) review.title = data.title?.trim() || '';
      if (data.comment !== undefined) review.comment = data.comment?.trim() || '';
      if (data.images) review.images = data.images;
      if (session.user.role === 'admin' && data.status) review.status = data.status;

      review.updatedAt = new Date();
      await review.save({ session: sessionMongo });

      if (review.userId.toString() === session.user.id || (session.user.role === 'admin' && data.status)) {
        const productReviews = await Review.find({
          productId: review.productId,
          status: 'approved',
        }).session(sessionMongo);
        const reviewCount = productReviews.length + (review.status === 'approved' ? 1 : 0);
        const totalRating =
          productReviews.reduce((sum, r) => sum + r.rating, 0) + (review.status === 'approved' ? review.rating : 0);
        const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;

        await Product.findByIdAndUpdate(
          review.productId,
          {
            averageRating,
            reviewCount,
          },
          { session: sessionMongo }
        );
      }

      await User.findByIdAndUpdate(
        session.user.id,
        {
          $set: { 'stats.lastReviewDate': new Date() },
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
    console.error('Failed to update review:', error);
    return NextResponse.json(
      { error: 'Failed to update review', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  const session = await getServerSession(options);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid review ID format' }, { status: 400 });
    }

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.userId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to delete this review' }, { status: 403 });
    }

    const sessionMongo = await mongoose.startSession();
    sessionMongo.startTransaction();

    try {
      await Review.findByIdAndDelete(id, { session: sessionMongo });

      await User.findByIdAndUpdate(
        review.userId,
        {
          $pull: { reviews: review._id },
          $inc: { 'stats.totalReviews': -1 },
        },
        { session: sessionMongo }
      );

      const productReviews = await Review.find({ productId: review.productId, status: 'approved' }).session(
        sessionMongo
      );
      const reviewCount = productReviews.length;
      const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;

      await Product.findByIdAndUpdate(
        review.productId,
        {
          averageRating,
          reviewCount,
        },
        { session: sessionMongo }
      );

      await sessionMongo.commitTransaction();
      return NextResponse.json({ message: 'Review deleted successfully' });
    } catch (error) {
      await sessionMongo.abortTransaction();
      throw error;
    } finally {
      sessionMongo.endSession();
    }
  } catch (error) {
    console.error('Failed to delete review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review', details: error.message },
      { status: 500 }
    );
  }
}