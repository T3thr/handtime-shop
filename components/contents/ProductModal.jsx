"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, Heart, ShoppingBag, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { toast } from "react-toastify";
import AuthContext from "@/context/AuthContext";
import { useContext } from "react";
import { useSidebar } from "@/context/SidebarContext";

export default function ProductModal({ product: initialProduct, onClose, keyword = "" }) {
  const { addToCart, cartItems, getCartSummary, fetchProductDetails, productCache } = useCart();
  const { status } = useContext(AuthContext);
  const isAuthenticated = status === "authenticated";
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [product, setProduct] = useState(initialProduct);
  const { openSidebar } = useSidebar();

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
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(product.averageRating || 0) ? "text-yellow-400 fill-current" : "text-text-muted/20 fill-current"}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
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

                  <div className="pt-4 border-t border-border-primary">
                    <p
                      className="text-text-secondary"
                      data-search-term={product.description}
                    >
                      {product.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
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
                    {product.weight && (
                      <div>
                        <h3 className="text-text-muted">Weight</h3>
                        <p className="text-text-primary">
                          {product.weight} {product.weightUnit}
                        </p>
                      </div>
                    )}
                    {product.status && (
                      <div>
                        <h3 className="text-text-muted">Status</h3>
                        <p className="text-text-primary capitalize">{product.status}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-border-primary flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.quantity <= 0 && !product.continueSellingWhenOutOfStock}
                    className={`flex-1 flex items-center justify-center px-6 py-3 rounded-full transition-colors duration-200 ${
                      isInCart
                        ? "bg-primary-dark text-text-inverted"
                        : product.quantity <= 0 && !product.continueSellingWhenOutOfStock
                        ? "bg-background-secondary text-text-muted cursor-not-allowed"
                        : "bg-primary text-text-inverted hover:bg-primary-dark"
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    {isInCart ? "Added to Cart" : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}