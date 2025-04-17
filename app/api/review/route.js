import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/backend/lib/mongodb";
import Review from "@/backend/models/Review";
import Product from "@/backend/models/Product";
import Order from "@/backend/models/Order";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userOnly = searchParams.get('userOnly') === 'true';
    
    const skip = (page - 1) * limit;
    
    // Build query based on provided parameters
    const query = {};
    if (productId) query.productId = productId;
    if (userId) query.userId = userId;
    if (orderId) query.orderId = orderId;
    
    // If userOnly is true, get reviews for the current user
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
    
    // If productId is provided, calculate rating distribution
    let ratingCounts = {};
    let averageRating = 0;
    
    if (productId) {
      // Get all reviews with status 'show' for this product
      const visibleReviews = await Review.find({ productId, status: 'show' });
      
      // Calculate rating counts
      ratingCounts = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      };
      
      let totalRating = 0;
      visibleReviews.forEach(review => {
        const rating = Math.floor(review.rating);
        if (rating >= 1 && rating <= 5) {
          ratingCounts[rating] += 1;
          totalRating += review.rating;
        }
      });
      
      // Calculate average rating
      averageRating = visibleReviews.length > 0 
        ? parseFloat((totalRating / visibleReviews.length).toFixed(1)) 
        : 0;
    }
    
    return NextResponse.json({
      reviews,
      averageRating,
      ratingCounts,
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

export async function POST(request) {
  const session = await getServerSession(options);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const data = await request.json();
    console.log('Review submission data:', data);
    console.log('Session user:', session.user);
    
    // Validate required fields
    if (!data.productId || !data.orderId || !data.rating) {
      return NextResponse.json({ 
        error: "Product ID, Order ID, and rating are required" 
      }, { status: 400 });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(data.productId)) {
      return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(data.orderId)) {
      return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 });
    }

    // Validate rating
    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5" }, { status: 400 });
    }
    
    // Check if user already reviewed this product from this order
    const existingReview = await Review.findOne({
      userId: session.user.id,
      productId: data.productId,
      orderId: data.orderId
    });
    
    if (existingReview) {
      return NextResponse.json({ 
        error: "You have already reviewed this product from this order" 
      }, { status: 400 });
    }
    
    // Verify product exists
    const product = await Product.findById(data.productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Initialize reviews array if undefined
    if (!product.reviews) {
      product.reviews = [];
    }

    // Verify order exists and belongs to user
    const order = await Order.findById(data.orderId);
    if (!order || order.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Order not found or not authorized" }, { status: 404 });
    }

    // Create new review
    const review = new Review({
      userId: session.user.id,
      productId: data.productId,
      orderId: data.orderId,
      rating: data.rating,
      title: data.title?.trim() || '',
      comment: data.comment?.trim() || '',
      images: Array.isArray(data.images) ? data.images : [],
      verifiedPurchase: true,
      status: 'show'
    });
    
    await review.save();
    
    // Update product's reviews array
    product.reviews.push({
      userId: new mongoose.Types.ObjectId(session.user.id),
      rating: data.rating,
      title: data.title?.trim() || '',
      comment: data.comment?.trim() || '',
      images: Array.isArray(data.images) ? data.images : [],
      verifiedPurchase: true,
      createdAt: new Date()
    });
    
    // Recalculate product's average rating and review count based on Review collection
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
      review,
      message: "Review submitted successfully"
    });
  } catch (error) {
    console.error("Failed to create review:", error);
    return NextResponse.json({ 
      error: "Failed to create review", 
      details: error.message 
    }, { status: 500 });
  }
}