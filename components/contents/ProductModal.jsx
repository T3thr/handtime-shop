"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, Heart, ShoppingBag, ChevronRight, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { toast } from "react-toastify";
import AuthContext from "@/context/AuthContext";
import { useContext } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { FaStar, FaRegStar, FaStarHalfAlt, FaUser, FaImage } from "react-icons/fa";
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
  const { getProductReviews } = useReviews();
  const [ratingDistribution, setRatingDistribution] = useState([0, 0, 0, 0, 0]);

  useEffect(() => {
    const loadProductDetails = async () => {
      const cachedProduct = productCache[initialProduct._id];
      if (cachedProduct) {
        setProduct(cachedProduct);
      } else {
        const fullProduct = await fetchProductDetails(initialProduct._id);
        if (fullProduct) {
          setProduct(fullProduct);
        }
      }
    };

    loadProductDetails();
  }, [initialProduct._id, productCache, fetchProductDetails]);

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

  const isInCart = cartItems.some((item) => item.productId === product._id);
  const primaryImageIndex = product.images.findIndex((img) => img.isPrimary) || 0;
  const images = product.images.length > 0 ? product.images : [{ url: "/images/placeholder.jpg" }];
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

              <div className="p-6 md:p-8 overflow-y-auto max-h-[80vh]">
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
                        {renderStars(product.averageRating || 0)}
                      </div>
                      <span>({product.reviewCount || 0})</span>
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
                        {/* Review Summary */}
                        <div className="bg-background-secondary p-4 rounded-lg">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center mb-4 md:mb-0">
                              <div className="text-4xl font-bold text-text-primary mr-3">
                                {product.averageRating ? product.averageRating.toFixed(1) : "0.0"}
                              </div>
                              <div>
                                <div className="flex text-lg mb-1">
                                  {renderStars(product.averageRating || 0)}
                                </div>
                                <div className="text-sm text-text-secondary">
                                  Based on {product.reviewCount || 0} reviews
                                </div>
                              </div>
                            </div>
                            
                            {/* Rating Distribution */}
                            <div className="w-full md:w-1/2">
                              {[5, 4, 3, 2, 1].map((rating) => (
                                <div key={rating} className="flex items-center mb-1">
                                  <div className="w-8 text-sm text-text-secondary">{rating} ★</div>
                                  <div className="flex-1 mx-2 h-2 bg-background rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary rounded-full"
                                      style={{ width: `${getPercentage(ratingDistribution[rating-1])}%` }}
                                    ></div>
                                  </div>
                                  <div className="w-8 text-right text-sm text-text-secondary">
                                    {getPercentage(ratingDistribution[rating-1])}%
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Reviews List */}
                        {product.reviews && product.reviews.length > 0 ? (
                          <div className="space-y-4">
                            {product.reviews.map((review) => (
                              <div key={review._id} className="border-b border-border-primary pb-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-background-secondary rounded-full flex items-center justify-center mr-2">
                                      {review.user?.avatar ? (
                                        <Image 
                                          src={review.user.avatar} 
                                          alt={review.user.name || "User"} 
                                          width={32} 
                                          height={32} 
                                          className="rounded-full"
                                        />
                                      ) : (
                                        <FaUser className="text-text-muted" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium text-text-primary">
                                        {review.user?.name || "Anonymous"}
                                      </div>
                                      <div className="text-xs text-text-secondary">
                                        {formatDate(review.createdAt)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex">
                                    {renderStars(review.rating)}
                                  </div>
                                </div>
                                
                                {review.title && (
                                  <h4 className="font-medium text-text-primary mb-1">{review.title}</h4>
                                )}
                                
                                <p className="text-text-secondary text-sm mb-2">{review.comment}</p>
                                
                                {/* Review Images */}
                                {review.images && review.images.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {review.images.map((image, index) => (
                                      <div key={index} className="relative w-16 h-16 rounded-md overflow-hidden">
                                        <Image
                                          src={image.url}
                                          alt={`Review image ${index + 1}`}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-text-secondary">
                            No reviews yet. Be the first to review this product!
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
                    <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium border border-border-primary hover:bg-background-secondary">
                      <Heart className="w-5 h-5" />
                      <span className="hidden sm:inline">Add to Wishlist</span>
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
