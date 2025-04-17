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
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const status = searchParams.get('status') || 'show';
    const userOnly = searchParams.get('userOnly') === 'true';

    if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (productId) {
      query.productId = productId;
    }
    if (status !== 'all') {
      query.status = status;
    }
    if (userOnly) {
      const session = await getServerSession(options);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      query.userId = session.user.id;
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
    
    // Calculate average rating and rating counts
    const allReviews = await Review.find({ productId, status: 'show' }).lean();
    const reviewCount = allReviews.length;
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;
    const ratingCounts = allReviews.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {});

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
      averageRating,
      ratingCounts,
      total: reviewCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(options);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const data = await request.json();
    const { productId, orderId, rating, comment, title, images } = data;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const review = new Review({
      userId: session.user.id,
      productId,
      orderId,
      rating,
      comment,
      title,
      images,
      status: 'show', // Default to 'show' for new reviews
      verifiedPurchase: true // Assuming verified purchase logic is handled elsewhere
    });

    await review.save();

    // Update product's average rating and review count
    const visibleReviews = await Review.find({ productId, status: 'show' });
    const reviewCount = visibleReviews.length;
    const totalRating = visibleReviews.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;
    product.reviewCount = reviewCount;
    await product.save();

    return NextResponse.json({ 
      success: true,
      review,
      message: "Review submitted successfully"
    });
  } catch (error) {
    console.error("Failed to submit review:", error);
    return NextResponse.json({ 
      error: "Failed to submit review", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(options);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const data = await request.json();
    
    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (review.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to update this review" }, { status: 403 });
    }

    review.rating = data.rating || review.rating;
    review.comment = data.comment || review.comment;
    review.title = data.title || review.title;
    review.images = data.images || review.images;
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

    return NextResponse.json({ 
      success: true,
      review,
      message: "Review updated successfully"
    });
  } catch (error) {
    console.error("Failed to update review:", error);
    return NextResponse.json({ 
      error: "Failed to update review", 
      details: error.message 
    }, { status: 500 });
  }
}