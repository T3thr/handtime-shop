import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/backend/lib/mongodb";
import Review from "@/backend/models/Review";
import Product from "@/backend/models/Product";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (status !== 'all') {
      query.status = status;
    }
    
    // Get total count for pagination
    const total = await Review.countDocuments(query);
    
    // Get reviews with pagination
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name avatar')
      .populate('productId', 'name images')
      .lean();
    
    // Ensure valid avatar and image URLs
    const serializedReviews = reviews.map(review => ({
      ...review,
      userId: review.userId ? {
        ...review.userId,
        avatar: review.userId.avatar || '/images/avatar-placeholder.jpg'
      } : null,
      productId: review.productId ? {
        ...review.productId,
        images: Array.isArray(review.productId.images) ? review.productId.images.map(img => ({
          ...img,
          url: img.url || '/images/placeholder.jpg'
        })) : []
      } : null,
      images: Array.isArray(review.images) ? review.images.map(img => img || '/images/placeholder.jpg') : []
    }));

    return NextResponse.json({
      reviews: serializedReviews,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(options);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const { status } = await request.json();
    
    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }
    
    if (!status || !['show', 'hide'].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be 'show' or 'hide'" }, { status: 400 });
    }
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    
    review.status = status;
    await review.save();
    
    // Update product's average rating and review count
    const product = await Product.findById(review.productId);
    if (product) {
      const visibleReviews = await Review.find({ productId: review.productId, status: 'show' });
      const reviewCount = visibleReviews.length;
      const totalRating = visibleReviews.reduce((sum, r) => sum + r.rating, 0);
      product.averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;
      product.reviewCount = reviewCount;
      await product.save();
    }
    
    // Set cache-control headers to prevent caching on Vercel
    const response = NextResponse.json({ 
      success: true,
      review,
      message: "Review status updated successfully"
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (error) {
    console.error("Failed to update review status:", error);
    return NextResponse.json({ 
      error: "Failed to update review status", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(options);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    
    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    
    await Review.deleteOne({ _id: reviewId });
    
    // Update product's average rating and review count
    const product = await Product.findById(review.productId);
    if (product) {
      const visibleReviews = await Review.find({ productId: review.productId, status: 'show' });
      const reviewCount = visibleReviews.length;
      const totalRating = visibleReviews.reduce((sum, r) => sum + r.rating, 0);
      product.averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;
      product.reviewCount = reviewCount;
      await product.save();
    }
    
    // Set cache-control headers
    const response = NextResponse.json({ 
      success: true,
      message: "Review deleted successfully"
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (error) {
    console.error("Failed to delete review:", error);
    return NextResponse.json({ 
      error: "Failed to delete review", 
      details: error.message 
    }, { status: 500 });
  }
}