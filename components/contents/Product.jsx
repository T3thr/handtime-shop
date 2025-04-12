"use client";
import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { useCart } from "@/context/CartContext";
import ImageSlider from "@/components/contents/ImageSlider";
import LearnMoreModal from "@/components/contents/LearnMoreModal";
import CategoryModal from "@/components/contents/CategoryModal";
import { Heart, ShoppingBag, Filter, Search, X, ChevronRight, ArrowUpRight, Star, Sparkles } from "lucide-react";
import { useProducts } from "@/backend/lib/productAction";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import AuthContext from "@/context/AuthContext";
import ProductModal from "./ProductModal";
import Loading from "@/app/loading";
import { useSidebar } from "@/context/SidebarContext";
import { useInView } from "react-intersection-observer";
import { useReviews } from "@/hooks/reviewHooks";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Product() {
  const featuredProductsRef = useRef(null);
  const [isLearnMoreModalOpen, setIsLearnMoreModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState({ section: "", keyword: "" });
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: "",
    sortBy: "",
    searchQuery: "",
  });
  const [categories, setCategories] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [visibleProducts, setVisibleProducts] = useState(8);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [hoverEffects, setHoverEffects] = useState({});
  const [productReviews, setProductReviews] = useState({});

  const { user, lineProfile, status } = useContext(AuthContext);
  const { addToCart, cartLOWERItems = [], getCartSummary } = useCart();
  const { products, isLoading: productsLoading, isError } = useProducts();
  const { openSidebar } = useSidebar();
  const { getProductReviews } = useReviews();

  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [categoriesRef, categoriesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [productsRef, productsInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const isAuthenticated = status === "authenticated" || !!user || !!lineProfile;

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await axios.get("/api/wishlist");
        setWishlist(response.data.wishlist.map((item) => item.productId.toString()));
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/category");
        const allCategories = response.data;
        setCategories(allCategories);
        const mainCats = allCategories.filter((cat) => cat.priority === "main").slice(0, 4);
        setMainCategories(mainCats);
      } catch (error) {
        //toast.error("Failed to load categories");
      }
    };

    fetchWishlist();
    fetchCategories();

    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  useEffect(() => {
    setVisibleProducts(8);
  }, [filters]);

  useEffect(() => {
    const handleOpenProductModal = (e) => {
      const { id, keyword } = e.detail;
      const product = products?.find((p) => p._id === id);
      if (product) setSelectedProduct({ ...product, keyword });
    };

    const handleOpenLearnMoreModal = (e) => {
      const { section, keyword } = e.detail;
      setIsLearnMoreModalOpen(true);
      setHighlightedSection({ section, keyword });
    };

    document.addEventListener("openProductModal", handleOpenProductModal);
    document.addEventListener("openLearnMoreModal", handleOpenLearnMoreModal);

    return () => {
      document.removeEventListener("openProductModal", handleOpenProductModal);
      document.removeEventListener("openLearnMoreModal", handleOpenLearnMoreModal);
    };
  }, [products]);

  // Fetch reviews for all products
  useEffect(() => {
    const fetchAllProductReviews = async () => {
      if (!products || products.length === 0) return;
      
      const reviewsData = {};
      
      for (const product of products) {
        try {
          const data = await getProductReviews(product._id);
          if (data && data.reviews) {
            // Only use approved reviews
            const approvedReviews = data.reviews.filter(review => review.status === "approved");
            
            // Calculate average rating
            let averageRating = 0;
            if (approvedReviews.length > 0) {
              const total = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
              averageRating = total / approvedReviews.length;
            }
            
            reviewsData[product._id] = {
              reviews: approvedReviews,
              averageRating,
              reviewCount: approvedReviews.length
            };
          }
        } catch (error) {
          console.error(`Failed to fetch reviews for product ${product._id}:`, error);
        }
      }
      
      setProductReviews(reviewsData);
    };

    fetchAllProductReviews();
  }, [products, getProductReviews]);

  const scrollToFeaturedProducts = () => {
    if (featuredProductsRef.current) {
      featuredProductsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)
      );
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) => filters.categories.some((cat) => p.categories.includes(cat)));
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-").map(Number);
      filtered = filtered.filter((p) => p.price >= min && p.price <= max);
    }

    if (filters.sortBy) {
      filtered.sort((a, b) => {
        if (filters.sortBy === "price-asc") return a.price - b.price;
        if (filters.sortBy === "price-desc") return b.price - a.price;
        if (filters.sortBy === "name") return a.name.localeCompare(b.name);
        if (filters.sortBy === "rating") {
          const aRating = productReviews[a._id]?.averageRating || 0;
          const bRating = productReviews[b._id]?.averageRating || 0;
          return bRating - aRating;
        }
        return 0;
      });
    }

    return filtered;
  }, [products, filters, productReviews]);

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart");
      openSidebar();
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

        setHoverEffects((prev) => ({ ...prev, [product._id]: true }));
        setTimeout(() => setHoverEffects((prev) => ({ ...prev, [product._id]: false })), 700);

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
      toast.error("Failed to add to cart. Please try again.");
    }
  };

  const handleProductClick = (product) => {
    const reviewData = productReviews[product._id] || { 
      averageRating: 0, 
      reviewCount: 0, 
      reviews: [] 
    };
    
    setSelectedProduct({
      ...product,
      images: product.images || [], // Ensure images exists
      averageRating: reviewData.averageRating,
      reviewCount: reviewData.reviewCount,
      reviews: reviewData.reviews
    });
  };

  const isProductInCart = (productId) => {
    return Array.isArray(cartLOWERItems) && cartLOWERItems.some((item) => item.productId === productId);
  };

  const getProductQuantityInCart = (productId) => {
    if (!Array.isArray(cartLOWERItems)) return 0;
    const item = cartLOWERItems.find((item) => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const isProductInWishlist = (productId) => wishlist.includes(productId.toString());

  const handleWishlist = async (productId, e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please sign in to manage wishlist");
      openSidebar();
      return;
    }

    try {
      const response = await axios.post("/api/wishlist", { productId, action: "toggle" });
      const isAdded = response.data.message === "Added to wishlist";

      setWishlist((prev) =>
        isAdded ? [...prev, productId.toString()] : prev.filter((id) => id !== productId.toString())
      );

      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update wishlist");
    }
  };

  const handleCategorySelect = (categoryName) => {
    setFilters((prev) => {
      const newCategories = prev.categories.includes(categoryName)
        ? prev.categories.filter((cat) => cat !== categoryName)
        : [...prev.categories, categoryName];
      return { ...prev, categories: newCategories };
    });
    setIsCategoryModalOpen(false);
    scrollToFeaturedProducts();
  };

  const displayedProducts = filteredProducts;
  const hasMoreProducts = visibleProducts < displayedProducts.length;

  const priceRanges = [
    { label: "All Prices", value: "" },
    { label: "Under ฿100", value: "0-100" },
    { label: "฿100 - ฿300", value: "100-300" },
    { label: "฿300 - ฿500", value: "300-500" },
    { label: "Over ฿500", value: "500-10000" },
  ];

  const sortOptions = [
    { label: "Featured", value: "" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
    { label: "Name", value: "name" },
    { label: "Top Rated", value: "rating" },
  ];

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-yellow-400">
            {star <= Math.round(rating) ? <FaStar size={12} /> : <FaRegStar size={12} />}
          </span>
        ))}
      </div>
    );
  };

  if (isLoading || productsLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center p-8 max-w-lg mx-auto"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
            <X className="w-10 h-10 text-error" />
          </div>
          <h2 className="text-2xl font-bold text-error mb-4">Oops! Something went wrong</h2>
          <p className="text-text-secondary mb-6">
            We couldn't load our handcrafted products. Please try again later.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="btn-primary bg-primary hover:bg-primary-dark"
          >
            Refresh Page
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <LearnMoreModal
        isOpen={isLearnMoreModalOpen}
        onClose={() => setIsLearnMoreModalOpen(false)}
        section={highlightedSection.section}
        keyword={highlightedSection.keyword}
      />
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategorySelect={handleCategorySelect}
        selectedCategories={filters.categories}
      />

      {/* Hero Section */}
      <section ref={heroRef} className="relative h-[85vh] lg:h-[85vh] overflow-hidden bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-background-secondary via-primary-40 to-primary-light-80 dark:from-background-secondary dark:via-primary-20 dark:to-primary-dark-40"
        >
          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-repeat bg-center opacity-20"></div>
        </motion.div>

        <div className="container mx-auto max-w-7xl h-full flex items-center px-4 lg:px-8 z-10 relative">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            className="max-w-2xl text-foreground space-y-6"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
            >
              Handmade Treasures from{" "}
              <span className="text-primary relative inline-block" data-search-term="uttaradit">
                Uttaradit
                <motion.span
                  initial={{ width: 0 }}
                  animate={heroInView ? { width: "100%" } : { width: 0 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  className="absolute -bottom-1 left-0 h-[3px] bg-primary rounded-full"
                ></motion.span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="text-lg md:text-xl text-text-secondary leading-relaxed"
              data-search-term="discover authentic thai craftsmanship"
            >
              Discover authentic Thai craftsmanship with our collection of handmade products. Each piece tells a story
              of tradition and passion from the heart of Uttaradit.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(15, 118, 110, 0.2)" }}
                whileTap={{ scale: 0.97 }}
                onClick={scrollToFeaturedProducts}
                className="btn-primary bg-primary text-text-inverted hover:bg-primary-dark transition-all duration-300 flex items-center justify-center group"
              >
                Explore Collection
                <ArrowUpRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsLearnMoreModalOpen(true)}
                className="btn-primary bg-surface-card/10 hover:bg-surface-card/20 backdrop-blur-sm transition-all duration-300"
              >
                Our Story
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={heroInView ? { opacity: 0.6, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 1.2, delay: 1.2 }}
          className="absolute top-1/4 -right-24 w-64 h-64 rounded-full bg-primary/20 blur-3xl"
        ></motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={heroInView ? { opacity: 0.4, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-light/20 blur-3xl"
        ></motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background dark:from-background to-transparent"></div>
      </section>

      <ImageSlider />
      
      {/* Categories Section */}
      <section
        ref={categoriesRef}
        className="py-16 md:py-24 bg-background-secondary relative overflow-hidden"
      >
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={categoriesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Categories</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Discover our diverse range of handcrafted products, each category showcasing unique Thai craftsmanship
              and tradition.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={categoriesInView ? "visible" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {mainCategories.map((category, index) => (
              <motion.div
                key={category._id}
                variants={fadeInUp}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                className="relative rounded-xl overflow-hidden aspect-[4/3] group cursor-pointer"
                onClick={() => handleCategorySelect(category.name)}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                <Image
                  src={category.image?.url || "/images/placeholder.jpg"}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <h3 className="text-white text-xl font-bold mb-1">{category.name}</h3>
                  <div className="flex items-center text-white/80 text-sm">
                    <span>Explore</span>
                    <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={categoriesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-center mt-10"
          >
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="btn-secondary border border-border-primary hover:bg-background-hover transition-colors duration-300"
            >
              View All Categories
            </button>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section
        ref={productsRef}
        className="py-16 md:py-24 bg-background relative"
        id="featured-products"
      >
        <div ref={featuredProductsRef} className="absolute -top-20"></div>
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={productsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">Featured Products</h2>
              <p className="text-text-secondary mt-2">
                Handcrafted with care and attention to detail
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="w-full sm:w-64 px-4 py-2 pl-10 rounded-lg border border-border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border-primary hover:bg-background-hover transition-colors duration-300"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8 overflow-hidden"
              >
                <div className="p-4 border border-border-primary rounded-lg bg-surface-card">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Categories</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {categories.slice(0, 8).map((category) => (
                          <div key={category._id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`cat-${category._id}`}
                              checked={filters.categories.includes(category.name)}
                              onChange={() => handleCategorySelect(category.name)}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label
                              htmlFor={`cat-${category._id}`}
                              className="ml-2 text-sm text-text-primary cursor-pointer"
                            >
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Price Range</h3>
                      <div className="space-y-2">
                        {priceRanges.map((range) => (
                          <div key={range.value} className="flex items-center">
                            <input
                              type="radio"
                              id={`price-${range.value}`}
                              name="price-range"
                              checked={filters.priceRange === range.value}
                              onChange={() => setFilters({ ...filters, priceRange: range.value })}
                              className="w-4 h-4 border-gray-300 text-primary focus:ring-primary"
                            />
                            <label
                              htmlFor={`price-${range.value}`}
                              className="ml-2 text-sm text-text-primary cursor-pointer"
                            >
                              {range.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Sort By</h3>
                      <div className="space-y-2">
                        {sortOptions.map((option) => (
                          <div key={option.value} className="flex items-center">
                            <input
                              type="radio"
                              id={`sort-${option.value}`}
                              name="sort-by"
                              checked={filters.sortBy === option.value}
                              onChange={() => setFilters({ ...filters, sortBy: option.value })}
                              className="w-4 h-4 border-gray-300 text-primary focus:ring-primary"
                            />
                            <label
                              htmlFor={`sort-${option.value}`}
                              className="ml-2 text-sm text-text-primary cursor-pointer"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() =>
                        setFilters({
                          categories: [],
                          priceRange: "",
                          sortBy: "",
                          searchQuery: "",
                        })
                      }
                      className="text-sm text-primary hover:text-primary-dark transition-colors duration-300"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={productsInView ? "visible" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {displayedProducts.slice(0, visibleProducts).map((product) => (
              <motion.div
                key={product._id}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="group relative bg-surface-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-border-primary"
              >
                {/* Product Image */}
                <div
                  className="relative aspect-square cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <Image
                    src={product.images[0]?.url || "/images/placeholder.jpg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {product.quantity <= 0 && !product.continueSellingWhenOutOfStock && (
                    <div className="absolute top-0 left-0 w-full bg-error/90 text-text-inverted text-center py-1 text-sm font-medium">
                      Out of Stock
                    </div>
                  )}
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <div className="absolute top-2 right-2 bg-primary text-text-inverted text-xs font-bold px-2 py-1 rounded-full">
                      {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                    </div>
                  )}

                  <button
                    onClick={(e) => handleWishlist(product._id, e)}
                    className={`absolute top-2 left-2 p-2 rounded-full transition-colors duration-200 ${
                      isProductInWishlist(product._id)
                        ? "bg-error/10 text-error"
                        : "bg-background/50 text-text-muted hover:text-error"
                    }`}
                    aria-label={isProductInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart
                      className={`w-5 h-5 ${isProductInWishlist(product._id) ? "fill-current" : ""}`}
                    />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className="text-text-primary font-medium line-clamp-2 cursor-pointer hover:text-primary transition-colors duration-200"
                      onClick={() => handleProductClick(product)}
                    >
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="text-primary font-bold">
                      ฿{product.price.toFixed(2)}
                      {product.compareAtPrice && (
                        <span className="ml-2 text-sm text-text-muted line-through">
                          ฿{product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    {/* Review Stars */}
                    <div className="flex items-center">
                      {renderStars(productReviews[product._id]?.averageRating || 0)}
                      {productReviews[product._id]?.reviewCount > 0 && (
                        <span className="text-xs text-text-secondary ml-1">
                          ({productReviews[product._id]?.reviewCount})
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={
                      (product.quantity <= 0 && !product.continueSellingWhenOutOfStock) ||
                      isProductInCart(product._id)
                    }
                    className={`w-full mt-2 flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-300 ${
                      isProductInCart(product._id)
                        ? "bg-primary-dark text-text-inverted"
                        : product.quantity <= 0 && !product.continueSellingWhenOutOfStock
                        ? "bg-background-secondary text-text-muted cursor-not-allowed"
                        : "bg-primary text-text-inverted hover:bg-primary-dark"
                    } ${hoverEffects[product._id] ? "scale-105" : ""}`}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    {isProductInCart(product._id)
                      ? `In Cart (${getProductQuantityInCart(product._id)})`
                      : "Add to Cart"}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {hasMoreProducts && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={productsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="text-center mt-12"
            >
              <button
                onClick={() => setVisibleProducts((prev) => prev + 8)}
                className="btn-secondary border border-border-primary hover:bg-background-hover transition-colors duration-300"
              >
                Load More Products
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          keyword={selectedProduct.keyword}
        />
      )}
    </div>
  );
}
