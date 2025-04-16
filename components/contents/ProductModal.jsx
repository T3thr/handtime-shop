"use client";
import React, { useState, useEffect, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Heart, ShoppingBag, X, ChevronLeft, ChevronRight, Star, Share2, MessageSquare } from "lucide-react";
import { FaStar, FaRegStar, FaStarHalfAlt, FaUser } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import AuthContext from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useReviews } from "@/hooks/reviewHooks";

export default function ProductModal({ product: initialProduct, onClose, keyword = "" }) {
  const { addToCart, cartItems, getCartSummary, fetchProductDetails, productCache } = useCart();
  const { status } = useContext(AuthContext);
  const isAuthenticated = status === "authenticated";
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [product, setProduct] = useState(initialProduct);
  const { openSidebar } = useSidebar();
  const [activeTab, setActiveTab] = useState("description");
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const { getProductReviews    ,reviews, 
    averageRating, 
    ratingCounts, 
    isLoading: reviewsLoading, 
    pagination, 
    changePage,
    total: reviewsTotal } = useReviews();
  const [ratingDistribution, setRatingDistribution] = useState([0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);

  
  useEffect(() => {
    const loadProductDetails = async () => {
      try {
        setLoading(true);
        const cachedProduct = productCache[initialProduct._id];
        if (cachedProduct) {
          setProduct(cachedProduct);
        } else {
          const fullProduct = await fetchProductDetails(initialProduct._id);
          if (fullProduct) {
            setProduct(fullProduct);
          }
        }
      } catch (error) {
        console.error("Failed to load product details:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchWishlistStatus = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await axios.get("/api/wishlist");
        const wishlist = response.data.wishlist.map((item) => item.productId.toString());
        setIsInWishlist(wishlist.includes(initialProduct._id.toString()));
      } catch (error) {
        console.error("Failed to fetch wishlist status:", error);
      }
    };

    loadProductDetails();
    fetchWishlistStatus();
  }, [initialProduct._id, productCache, fetchProductDetails, isAuthenticated]);

  useEffect(() => {
    // If reviews aren't already loaded from Product.jsx
    if (!product.reviews && !reviewsLoaded) {
      const fetchReviews = async () => {
        try {
          const data = await getProductReviews(product._id);
          if (data && data.reviews) {
            // Only use approved reviews
            const approvedReviews = data.reviews.filter(review => review.status === "approved");
            
            // Calculate average rating
            let avgRating = 0;
            if (approvedReviews.length > 0) {
              const total = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
              avgRating = total / approvedReviews.length;
            }
            
            // Calculate rating distribution
            const distribution = [0, 0, 0, 0, 0];
            approvedReviews.forEach(review => {
              if (review.rating >= 1 && review.rating <= 5) {
                distribution[Math.floor(review.rating) - 1]++;
              }
            });
            
            setRatingDistribution(distribution);
            setProduct(prev => ({
              ...prev,
              reviews: approvedReviews,
              averageRating: avgRating,
              reviewCount: approvedReviews.length
            }));
            setReviewsLoaded(true);
          }
        } catch (error) {
          console.error("Failed to fetch reviews:", error);
        }
      };

      fetchReviews();
    } else if (product.reviews && !reviewsLoaded) {
      // Calculate rating distribution from existing reviews
      const distribution = [0, 0, 0, 0, 0];
      product.reviews.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          distribution[Math.floor(review.rating) - 1]++;
        }
      });
      setRatingDistribution(distribution);
      setReviewsLoaded(true);
    }
  }, [product._id, product.reviews, reviewsLoaded, getProductReviews]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (keyword) {
      const elements = document.querySelectorAll(
        `[data-search-term="${keyword.toLowerCase()}"], [data-search-term="${keyword}"]`
      );
      elements.forEach((el) => {
        el.classList.add("highlight");
        setTimeout(() => el.classList.remove("highlight"), 3000);
      });
    }
  }, [keyword]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart");
      openSidebar();
      onClose();
      return;
    }

    try {
      const cartItem = {
        id: product._id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.images[0]?.url || "/images/placeholder.jpg",
        category: product.categories[0] || "",
      };

      const updatedCart = await addToCart(cartItem);
      if (updatedCart) {
        const totalItems = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        toast.success(
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 relative rounded overflow-hidden">
                <Image
                  src={product.images[0]?.url || "/images/placeholder.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-text-primary">{product.name}</p>
                <p className="text-sm text-text-muted">Added to cart</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-text-secondary">
              Cart total: ฿{subtotal.toFixed(2)} ({totalItems} items)
            </div>
          </div>
        );
      }
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to manage wishlist");
      openSidebar();
      onClose();
      return;
    }

    try {
      const response = await axios.post("/api/wishlist", { productId: product._id, action: "toggle" });
      const isAdded = response.data.message === "Added to wishlist";
      setIsInWishlist(isAdded);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update wishlist");
    }
  };

  const isInCart = cartItems.some((item) => item.productId === product._id);
  const images = product.images?.length > 0 ? product.images : [{ url: "/images/placeholder.jpg" }];
  const primaryImageIndex = images.findIndex((img) => img.isPrimary) || 0;
  const currentImage = images[currentImageIndex];

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }
    
    return stars;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const totalReviews = product.reviewCount || 0;
  const getPercentage = (count) => {
    return totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
  };
  
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 30 }}
            className="relative w-full max-w-4xl bg-surface-card rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-surface-card/80 backdrop-blur-sm hover:bg-surface-card transition-colors duration-200"
            >
              <X className="w-5 h-5 text-text-primary" />
            </button>

            <button
              onClick={onClose}
              className="md:hidden absolute top-4 left-4 z-10 p-2 rounded-full bg-surface-card/80 backdrop-blur-sm hover:bg-surface-card transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-text-primary" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="relative aspect-square bg-background-secondary">
                <Image
                  src={currentImage.url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {product.quantity <= 0 && !product.continueSellingWhenOutOfStock && (
                  <div className="absolute top-0 left-0 w-full bg-error/90 text-text-inverted text-center py-1 text-sm font-medium">
                    Out of Stock
                  </div>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-surface-card/80 rounded-full hover:bg-surface-card transition-colors duration-200"
                    >
                      <ChevronLeft className="w-5 h-5 text-text-primary" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-surface-card/80 rounded-full hover:bg-surface-card transition-colors duration-200"
                    >
                      <ChevronRight className="w-5 h-5 text-text-primary" />
                    </button>
                  </>
                )}
                
                {/* Thumbnail Gallery */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-12 h-12 rounded-md overflow-hidden border-2 ${
                          currentImageIndex === index ? 'border-primary' : 'border-transparent'
                        }`}
                      >
                        <div className="relative w-full h-full">
                          <Image
                            src={image.url}
                            alt={`${product.name} thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div
                className={`p-6 md:p-8 ${
                  activeTab === "reviews"
                    ? "lg:overflow-y-auto lg:max-h-[70vh] scrollbar-thin scrollbar-thumb-primary scrollbar-track-background"
                    : "lg:overflow-y-visible"
                }`}
              >
                <div className="space-y-4">
                  <h1
                    className="text-2xl font-bold text-text-primary"
                    data-search-term={product.name}
                  >
                    {product.name}
                  </h1>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-primary">
                      ฿{product.price.toFixed(2)}
                      {product.compareAtPrice && (
                        <span className="ml-2 text-sm text-text-muted line-through">
                          ฿{product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center text-sm text-text-muted">
                      <div className="flex items-center mr-1">
                        {renderStars(product.reviews && product.reviews.length > 0 
                          ? product.averageRating 
                          : product.averageRating || 0)}
                      </div>
                      <span>({product.reviews ? product.reviews.length : product.reviewCount || 0})</span>
                    </div>
                  </div>

                  {product.shortDescription && (
                    <p
                      className="text-text-primary"
                      data-search-term={product.shortDescription}
                    >
                      {product.shortDescription}
                    </p>
                  )}

                  {product.trackQuantity && (
                    <p className="text-sm text-text-secondary">
                      Quantity Left: <span className="font-medium">{product.quantity || 0}</span>
                    </p>
                  )}

                  {/* Tabs Navigation */}
                  <div className="border-b border-border-primary">
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setActiveTab("description")}
                        className={`py-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === "description" 
                            ? "border-primary text-primary" 
                            : "border-transparent text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        Description
                      </button>
                      <button
                        onClick={() => setActiveTab("details")}
                        className={`py-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === "details" 
                            ? "border-primary text-primary" 
                            : "border-transparent text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setActiveTab("reviews")}
                        className={`py-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === "reviews" 
                            ? "border-primary text-primary" 
                            : "border-transparent text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        Reviews ({product.reviewCount || 0})
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="pt-4">
                    {activeTab === "description" && (
                      <div>
                        <p
                          className="text-text-secondary"
                          data-search-term={product.description}
                        >
                          {product.description}
                        </p>
                      </div>
                    )}

                    {activeTab === "details" && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {product.categories?.length > 0 && (
                          <div>
                            <h3 className="text-text-muted">Category</h3>
                            <p className="text-text-primary">{product.categories.join(", ")}</p>
                          </div>
                        )}
                        {product.vendor && (
                          <div>
                            <h3 className="text-text-muted">Vendor</h3>
                            <p className="text-text-primary">{product.vendor}</p>
                          </div>
                        )}
                        {product.sku && (
                          <div>
                            <h3 className="text-text-muted">SKU</h3>
                            <p className="text-text-primary">{product.sku}</p>
                          </div>
                        )}
                        {product.weight && (
                          <div>
                            <h3 className="text-text-muted">Weight</h3>
                            <p className="text-text-primary">{product.weight} {product.weightUnit}</p>
                          </div>
                        )}
                        {product.dimensions && (
                          <div>
                            <h3 className="text-text-muted">Dimensions</h3>
                            <p className="text-text-primary">{product.dimensions}</p>
                          </div>
                        )}
                        {product.materials && (
                          <div>
                            <h3 className="text-text-muted">Materials</h3>
                            <p className="text-text-primary">{product.materials}</p>
                          </div>
                        )}
                      </div>
                    )}

                {activeTab === "reviews" && (
                  <div className="space-y-6">
                    {/* Reviews Summary */}
                    <div className="flex flex-col md:flex-row gap-6 border-b border-border-primary pb-6">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-4xl font-bold text-text-primary">
                          {averageRating ? averageRating.toFixed(1) : "0.0"}
                        </div>
                        <div className="flex mt-2">{renderStars(averageRating || 0)}</div>
                        <div className="text-sm text-text-secondary mt-1">
                          {reviewsTotal || 0} {reviewsTotal === 1 ? "review" : "reviews"}
                        </div>
                      </div>

                      <div className="flex-1">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center mb-2">
                            <div className="flex items-center w-16">
                              <span className="text-sm text-text-secondary mr-1">{rating}</span>
                              <FaStar className="text-yellow-400 text-sm" />
                            </div>
                            <div className="flex-1 h-2 bg-background-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${ratingDistribution[rating]}%` }}
                              ></div>
                            </div>
                            <div className="w-12 text-right text-sm text-text-secondary">
                              {ratingCounts && ratingCounts[rating] ? ratingCounts[rating] : 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reviews List */}
                    {reviewsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : reviews && reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review._id} className="border-b border-border-primary pb-6">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center mr-3">
                                  {review.userId?.avatar ? (
                                    <Image
                                      src={review.userId.avatar}
                                      alt={review.userId.name || "User"}
                                      width={40}
                                      height={40}
                                      className="rounded-full object-cover"
                                    />
                                  ) : (
                                    <FaUser className="text-text-muted" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-text-primary">
                                    {review.userId?.name || "Anonymous"}
                                  </div>
                                  <div className="text-xs text-text-secondary">
                                    {formatDate(review.createdAt)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex">{renderStars(review.rating)}</div>
                            </div>

                            {review.title && (
                              <h4 className="font-medium text-text-primary mb-1">{review.title}</h4>
                            )}
                            <p className="text-text-secondary mb-3">{review.comment}</p>

                            {review.images && review.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {review.images.map((image, index) => (
                                  <div
                                    key={index}
                                    className="relative w-16 h-16 rounded-md overflow-hidden"
                                  >
                                    <Image
                                      src={image}
                                      alt={`Review image ${index + 1}`}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {review.verifiedPurchase && (
                              <div className="mt-2 text-xs text-success flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Verified Purchase
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                          <div className="flex justify-center mt-6">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                                disabled={pagination.page === 1}
                                className={`px-3 py-1 rounded-md ${
                                  pagination.page === 1
                                    ? "bg-background-secondary text-text-muted cursor-not-allowed"
                                    : "bg-background-secondary text-text-primary hover:bg-background-hover"
                                }`}
                              >
                                Previous
                              </button>

                              {[...Array(pagination.totalPages)].map((_, i) => {
                                const page = i + 1;
                                // Show current page, first page, last page, and pages around current
                                if (
                                  page === 1 ||
                                  page === pagination.totalPages ||
                                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                                ) {
                                  return (
                                    <button
                                      key={page}
                                      onClick={() => handlePageChange(page)}
                                      className={`w-8 h-8 flex items-center justify-center rounded-md ${
                                        pagination.page === page
                                          ? "bg-primary text-text-inverted"
                                          : "bg-background-secondary text-text-primary hover:bg-background-hover"
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  );
                                } else if (
                                  page === 2 ||
                                  page === pagination.totalPages - 1
                                ) {
                                  return (
                                    <button
                                      key={page}
                                      className="w-8 h-8 flex items-center justify-center"
                                    >
                                      ...
                                    </button>
                                  );
                                }
                                return null;
                              })}

                              <button
                                onClick={() =>
                                  handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))
                                }
                                disabled={pagination.page === pagination.totalPages}
                                className={`px-3 py-1 rounded-md ${
                                  pagination.page === pagination.totalPages
                                    ? "bg-background-secondary text-text-muted cursor-not-allowed"
                                    : "bg-background-secondary text-text-primary hover:bg-background-hover"
                                }`}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 mx-auto text-text-muted mb-2" />
                        <h3 className="text-lg font-medium text-text-primary mb-1">No Reviews Yet</h3>
                        <p className="text-text-secondary">
                          Be the first to review this product
                        </p>
                      </div>
                    )}
                  </div>
                )}
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={product.quantity <= 0 && !product.continueSellingWhenOutOfStock}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium ${
                        product.quantity <= 0 && !product.continueSellingWhenOutOfStock
                          ? "bg-background-secondary text-text-muted cursor-not-allowed"
                          : isInCart
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-primary hover:bg-primary-hover text-white"
                      }`}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      {isInCart ? "Added to Cart" : "Add to Cart"}
                    </button>
                    <button
                      onClick={handleWishlist}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium border border-border-primary hover:bg-background-secondary ${
                        isInWishlist ? "text-error border-error" : "text-text-primary"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isInWishlist ? "fill-current" : ""}`}
                      />
                      <span className="hidden sm:inline">
                        {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}