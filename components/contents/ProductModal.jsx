"use client";
import React, { useState, useEffect, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Heart, ShoppingBag, X, ChevronLeft, ChevronRight, Star, Share2, MessageSquare } from "lucide-react";
import { FaUser } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import AuthContext from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useReviews } from "@/hooks/reviewHooks";
import { useSwipeable } from "react-swipeable";

export default function ProductModal({ product: initialProduct, onClose, keyword = "" }) {
  const { addToCart, cartItems, getCartSummary, fetchProductDetails, productCache } = useCart();
  const { status } = useContext(AuthContext);
  const isAuthenticated = status === "authenticated";
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [product, setProduct] = useState(initialProduct);
  const { openSidebar } = useSidebar();
  const [activeTab, setActiveTab] = useState("description");
  const { reviews, averageRating, ratingCounts, isLoading: reviewsLoading, pagination, changePage, total: reviewsTotal } = useReviews(initialProduct._id);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (window.innerWidth <= 640) { // Only on mobile
        onClose();
      }
    },
    trackMouse: false,
    delta: 50, // Minimum swipe distance
  });

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
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < Math.round(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getPercentage = (count) => {
    return reviewsTotal > 0 ? Math.round((count / reviewsTotal) * 100) : 0;
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="flex min-h-full items-center justify-center p-4 sm:p-6" {...swipeHandlers}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 100 }}
            className="relative w-full max-w-4xl bg-surface-card rounded-2xl shadow-2xl overflow-hidden sm:max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-surface-card/90 backdrop-blur-sm hover:bg-surface-card transition-colors duration-200"
            >
              <X className="w-6 h-6 text-text-primary" />
            </button>

            <button
              onClick={onClose}
              className="sm:hidden absolute top-4 left-4 z-20 p-2 rounded-full bg-surface-card/90 backdrop-blur-sm hover:bg-surface-card transition-colors duration-200"
            >
              <ChevronLeft className="w-6 h-6 text-text-primary" />
            </button>

            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-0 max-h-[90vh]">
              {/* Image Section */}
              <div className="relative aspect-square bg-background-secondary">
                <Image
                  src={currentImage.url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                {product.quantity <= 0 && !product.continueSellingWhenOutOfStock && (
                  <div className="absolute top-0 left-0 w-full bg-error/90 text-text-inverted text-center py-2 text-sm font-medium">
                    Out of Stock
                  </div>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-surface-card/80 rounded-full hover:bg-surface-card transition-colors duration-200"
                    >
                      <ChevronLeft className="w-5 h-5 text-text-primary" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-surface-card/80 rounded-full hover:bg-surface-card transition-colors duration-200"
                    >
                      <ChevronRight className="w-5 h-5 text-text-primary" />
                    </button>
                  </>
                )}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 px-4">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          currentImageIndex === index ? "border-primary" : "border-transparent opacity-80 hover:opacity-100"
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

              {/* Content Section */}
              <div className="p-6 sm:p-8 overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-primary scrollbar-track-background">
                <div className="space-y-6">
                  <h1
                    className="text-2xl sm:text-3xl font-bold text-text-primary"
                    data-search-term={product.name}
                  >
                    {product.name}
                  </h1>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-2xl font-bold text-primary">
                      ฿{product.price.toFixed(2)}
                      {product.compareAtPrice && (
                        <span className="ml-3 text-base text-text-muted line-through">
                          ฿{product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center text-sm text-text-muted">
                      {renderStars(averageRating || 0)}
                      <span className="ml-2">({product.reviewCount || 0})</span>
                    </div>
                  </div>

                  {product.shortDescription && (
                    <p
                      className="text-text-primary text-base"
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
                    <div className="flex space-x-4 sm:space-x-6">
                      {["description", "details", "reviews"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`py-2 px-2 font-medium text-sm border-b-2 transition-colors duration-200 ${
                            activeTab === tab
                              ? "border-primary text-primary"
                              : "border-transparent text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          {tab === "reviews" ? `Reviews (${product.reviewCount || 0})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="pt-4"
                  >
                    {activeTab === "description" && (
                      <div>
                        <p
                          className="text-text-secondary leading-relaxed"
                          data-search-term={product.description}
                        >
                          {product.description}
                        </p>
                      </div>
                    )}

                    {activeTab === "details" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {product.categories?.length > 0 && (
                          <div>
                            <h3 className="text-text-muted font-medium">Category</h3>
                            <p className="text-text-primary">{product.categories.join(", ")}</p>
                          </div>
                        )}
                        {product.vendor && (
                          <div>
                            <h3 className="text-text-muted font-medium">Vendor</h3>
                            <p className="text-text-primary">{product.vendor}</p>
                          </div>
                        )}
                        {product.sku && (
                          <div>
                            <h3 className="text-text-muted font-medium">SKU</h3>
                            <p className="text-text-primary">{product.sku}</p>
                          </div>
                        )}
                        {product.weight && (
                          <div>
                            <h3 className="text-text-muted font-medium">Weight</h3>
                            <p className="text-text-primary">{product.weight} {product.weightUnit}</p>
                          </div>
                        )}
                        {product.dimensions && (
                          <div>
                            <h3 className="text-text-muted font-medium">Dimensions</h3>
                            <p className="text-text-primary">{product.dimensions}</p>
                          </div>
                        )}
                        {product.materials && (
                          <div>
                            <h3 className="text-text-muted font-medium">Materials</h3>
                            <p className="text-text-primary">{product.materials}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "reviews" && (
                      <div className="space-y-8">
                        {/* Reviews Summary */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="flex flex-col sm:flex-row gap-6 border-b border-border-primary pb-6"
                        >
                          <div className="flex flex-col items-center justify-center w-full sm:w-1/3">
                            <div className="text-4xl font-bold text-text-primary">
                              {reviewsLoading ? (
                                <div className="w-16 h-10 bg-gray-200 animate-pulse rounded" />
                              ) : (
                                averageRating ? averageRating.toFixed(1) : "0.0"
                              )}
                            </div>
                            <div className="flex mt-2">
                              {reviewsLoading ? (
                                <div className="flex space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-5 h-5 bg-gray-200 animate-pulse rounded" />
                                  ))}
                                </div>
                              ) : (
                                renderStars(averageRating || 0)
                              )}
                            </div>
                            <div className="text-sm text-text-secondary mt-1">
                              {reviewsLoading ? (
                                <div className="w-24 h-4 bg-gray-200 animate-pulse rounded" />
                              ) : (
                                `${reviewsTotal || 0} ${reviewsTotal === 1 ? "review" : "reviews"}`
                              )}
                            </div>
                          </div>

                          <div className="flex-1">
                            {reviewsLoading ? (
                              <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                  <div key={i} className="flex items-center">
                                    <div className="w-16 h-4 bg-gray-200 animate-pulse rounded mr-2" />
                                    <div className="flex-1 h-3 bg-gray-200 animate-pulse rounded" />
                                    <div className="w-12 h-4 bg-gray-200 animate-pulse rounded ml-2" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              [5, 4, 3, 2, 1].map((rating) => (
                                <div key={rating} className="flex items-center mb-3">
                                  <div className="flex items-center w-16">
                                    <span className="text-sm text-text-secondary mr-1">{rating}</span>
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  </div>
                                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${getPercentage(ratingCounts[rating] || 0)}%` }}
                                      transition={{ duration: 0.5 }}
                                      className="h-full bg-yellow-400 rounded-full"
                                    />
                                  </div>
                                  <div className="w-12 text-right text-sm text-text-secondary">
                                    {ratingCounts[rating] || 0}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>

                        {/* Reviews List */}
                        {reviewsLoading ? (
                          <div className="space-y-6">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="border-b border-border-primary pb-6">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mr-3" />
                                    <div className="space-y-2">
                                      <div className="w-32 h-4 bg-gray-200 animate-pulse rounded" />
                                      <div className="w-24 h-3 bg-gray-200 animate-pulse rounded" />
                                    </div>
                                  </div>
                                  <div className="flex space-x-1">
                                    {[...Array(5)].map((_, j) => (
                                      <div key={j} className="w-5 h-5 bg-gray-200 animate-pulse rounded" />
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="w-3/4 h-4 bg-gray-200 animate-pulse rounded" />
                                  <div className="w-full h-3 bg-gray-200 animate-pulse rounded" />
                                  <div className="w-1/2 h-3 bg-gray-200 animate-pulse rounded" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : reviews && reviews.length > 0 ? (
                          <div className="space-y-6">
                            {reviews.map((review) => (
                              <motion.div
                                key={review._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-b border-border-primary pb-6"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center">
                                    <div className="w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center mr-3 overflow-hidden">
                                      {review.userId?.avatar ? (
                                        <Image
                                          src={review.userId.avatar}
                                          alt={review.userId.name || "User"}
                                          width={48}
                                          height={48}
                                          className="object-cover"
                                        />
                                      ) : (
                                        <FaUser className="text-text-muted w-6 h-6" />
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
                                  <h4 className="font-medium text-text-primary mb-2">{review.title}</h4>
                                )}
                                <p className="text-text-secondary leading-relaxed mb-3">{review.comment}</p>

                                {review.images && review.images.length > 0 && (
                                  <div className="flex flex-wrap gap-3 mt-3">
                                    {review.images.map((image, index) => (
                                      <div
                                        key={index}
                                        className="relative w-20 h-20 rounded-lg overflow-hidden"
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
                                  <div className="mt-3 text-xs text-success flex items-center">
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
                              </motion.div>
                            ))}

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                              <div className="flex justify-center mt-8">
                                <div className="flex space-x-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => changePage(Math.max(1, pagination.page - 1))}
                                    disabled={pagination.page === 1}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                      pagination.page === 1
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-primary text-white hover:bg-primary-dark"
                                    }`}
                                  >
                                    Previous
                                  </motion.button>

                                  {[...Array(pagination.totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    if (
                                      page === 1 ||
                                      page === pagination.totalPages ||
                                      (page >= pagination.page - 1 && page <= pagination.page + 1)
                                    ) {
                                      return (
                                        <motion.button
                                          key={page}
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => changePage(page)}
                                          className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                                            pagination.page === page
                                              ? "bg-primary text-white"
                                              : "bg-surface-card text-text-primary hover:bg-background-hover"
                                          }`}
                                        >
                                          {page}
                                        </motion.button>
                                      );
                                    } else if (page === 2 || page === pagination.totalPages - 1) {
                                      return (
                                        <div
                                          key={page}
                                          className="w-10 h-10 flex items-center justify-center text-text-secondary"
                                        >
                                          ...
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}

                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => changePage(Math.min(pagination.totalPages, pagination.page + 1))}
                                    disabled={pagination.page === pagination.totalPages}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                      pagination.page === pagination.totalPages
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-primary text-white hover:bg-primary-dark"
                                    }`}
                                  >
                                    Next
                                  </motion.button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                          >
                            <MessageSquare className="w-16 h-16 mx-auto text-text-muted mb-4" />
                            <h3 className="text-xl font-medium text-text-primary mb-2">No Reviews Yet</h3>
                            <p className="text-text-secondary">Be the first to review this product</p>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>

                  <div className="pt-6 flex flex-col sm:flex-row gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddToCart}
                      disabled={product.quantity <= 0 && !product.continueSellingWhenOutOfStock}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-base transition-colors duration-200 ${
                        product.quantity <= 0 && !product.continueSellingWhenOutOfStock
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : isInCart
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-primary hover:bg-primary-dark text-white"
                      }`}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      {isInCart ? "Added to Cart" : "Add to Cart"}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleWishlist}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-base border transition-colors duration-200 ${
                        isInWishlist
                          ? "border-error text-error hover:bg-error/10"
                          : "border-border-primary text-text-primary hover:bg-background-secondary"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isInWishlist ? "fill-current" : ""}`}
                      />
                      <span className="hidden sm:inline">
                        {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                      </span>
                    </motion.button>
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