"use client";
import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { useCart } from "@/context/CartContext";
import ImageSlider from "@/components/contents/ImageSlider";
import LearnMoreModal from "@/components/contents/LearnMoreModal";
import CategoryModal from "@/components/contents/CategoryModal";
import { Heart, ShoppingBag, Filter, Search, X, ChevronRight, ArrowUpRight, Star } from "lucide-react";
import { useProducts } from "@/backend/lib/productAction";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import AuthContext from "@/context/AuthContext";
import ProductModal from "./ProductModal";
import Loading from "@/app/loading";
import { useSidebar } from "@/context/SidebarContext";
import { useInView } from "react-intersection-observer";
import { useReviews } from "@/hooks/reviewHooks";

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

const starVariants = {
  filled: { scale: 1, opacity: 1, color: "#f59e0b" },
  empty: { scale: 0.8, opacity: 0.5, color: "#d1d5db" },
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
    inStockOnly: false,
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
  const { addToCart, cartItems = [], getCartSummary } = useCart();
  const { products, isLoading: productsLoading, isError, mutate: refetchProducts } = useProducts();
  const { openSidebar } = useSidebar();
  const { useProductReviews } = useReviews();

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
        // toast.error("Failed to load categories");
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
      if (product) {
        setSelectedProduct({ ...product, keyword });
        window.history.pushState({}, '', `/product/${product.slug}`);
      }
    };

    const handleOpenLearnMoreModal = (e) => {
      const { section, keyword } = e.detail;
      setIsLearnMoreModalOpen(true);
      setHighlightedSection({ section, keyword });
    };

    const handlePopState = () => {
      if (!window.location.pathname.startsWith('/product/')) {
        setSelectedProduct(null);
      }
    };

    document.addEventListener("openProductModal", handleOpenProductModal);
    document.addEventListener("openLearnMoreModal", handleOpenLearnMoreModal);
    window.addEventListener('popstate', handlePopState);

    // Listen for product updates (e.g., from admin actions)
    const handleProductUpdate = () => {
      refetchProducts(); // Trigger SWR revalidation
    };
    document.addEventListener("productUpdated", handleProductUpdate);

    return () => {
      document.removeEventListener("openProductModal", handleOpenProductModal);
      document.removeEventListener("openLearnMoreModal", handleOpenLearnMoreModal);
      document.removeEventListener("productUpdated", handleProductUpdate);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [products, refetchProducts]);

  const scrollToFeaturedProducts = () => {
    if (featuredProductsRef.current) {
      featuredProductsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    // Apply search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) => filters.categories.some((cat) => p.categories.includes(cat)));
    }

    // Apply price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-").map(Number);
      filtered = filtered.filter((p) => p.price >= min && p.price <= max);
    }

    // Apply in-stock only filter
    if (filters.inStockOnly) {
      filtered = filtered.filter((p) => p.quantity > 0 || p.continueSellingWhenOutOfStock);
    }

    // Sort products (out-of-stock products to the bottom)
    filtered.sort((a, b) => {
      const aOutOfStock = a.quantity <= 0 && !a.continueSellingWhenOutOfStock;
      const bOutOfStock = b.quantity <= 0 && !b.continueSellingWhenOutOfStock;

      // Push out-of-stock products to the bottom
      if (aOutOfStock && !bOutOfStock) return 1;
      if (!aOutOfStock && bOutOfStock) return -1;

      // Apply user-selected sorting
      if (filters.sortBy) {
        if (filters.sortBy === "price-asc") return a.price - b.price;
        if (filters.sortBy === "price-desc") return b.price - a.price;
        if (filters.sortBy === "name") return a.name.localeCompare(b.name);
        if (filters.sortBy === "rating") {
          const aRating = a.averageRating || 0;
          const bRating = b.averageRating || 0;
          return bRating - aRating;
        }
      }
      return 0;
    });

    return filtered;
  }, [products, filters]);

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
      images: product.images || [],
      averageRating: reviewData.averageRating,
      reviewCount: reviewData.reviewCount,
      reviews: reviewData.reviews
    });
    window.history.pushState({}, '', `/product/${product.slug}`);
  };

  const isProductInCart = (productId) => {
    return Array.isArray(cartItems) && cartItems.some((item) => item.productId === productId);
  };

  const getProductQuantityInCart = (productId) => {
    if (!Array.isArray(cartItems)) return 0;
    const item = cartItems.find((item) => item.productId === productId);
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

  const renderStars = (rating, isLoading) => {
    if (isLoading) {
      return (
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-200 animate-pulse rounded-full" />
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            variants={starVariants}
            animate={i < Math.round(rating) ? "filled" : "empty"}
            transition={{ duration: 0.3 }}
          >
            <Star className="w-4 h-4" fill={i < Math.round(rating) ? "currentColor" : "none"} />
          </motion.div>
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
                PMID="explore-collection"
                onClick={scrollToFeaturedProducts}
                className="btn-primary bg-primary text-text-inverted hover:bg-primary-dark transition-all duration-300 flex items-center justify-center group"
              >
                Explore Collection
                <ArrowUpRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                whileTap={{ scale: 0.97 }}
                PMID="our-story"
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
      <section ref={categoriesRef} className="py-16 md:py-24 bg-background" id="categories">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={categoriesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-text-primary relative inline-block">
              Shop by Category
              <motion.span
                initial={{ width: 0 }}
                animate={categoriesInView ? { width: "30%" } : { width: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="absolute -bottom-1 left-0 h-[2px] bg-primary rounded-full"
              ></motion.span>
            </h2>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <p
                className="text-text-secondary mb-4 md:mb-0 max-w-2xl"
                data-search-term="browse our handcrafted collections"
              >
                Browse our handcrafted collections organized by traditional Thai craft categories.
              </p>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={categoriesInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center text-primary text-sm font-medium cursor-pointer group"
                onClick={() => setIsCategoryModalOpen(true)}
              >
                View All Categories
                <span className="ml-1 group-hover:ml-2 transition-all duration-300">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={categoriesInView ? "visible" : "hidden"}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {mainCategories.map((category, index) => (
              <motion.div
                key={category.slug || index}
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setActiveCategory(category.slug)}
                onMouseLeave={() => setActiveCategory(null)}
                className="group relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                onClick={() => {
                  setFilters((prev) => ({
                    ...prev,
                    categories: prev.categories.includes(category.name)
                      ? prev.categories.filter((cat) => cat !== category.name)
                      : [...prev.categories, category.name],
                  }));
                  scrollToFeaturedProducts();
                }}
                data-category={category.slug}
              >
                <div className="aspect-[4/3] relative">
                  <Image
                    src={category.image?.url || "/images/placeholder.jpg"}
                    alt={category.name}
                    fill
                    className="object-cover transform transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20 group-hover:opacity-90 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <span
                      className="text-text-inverted text-lg md:text-xl lg:text-2xl font-bold mb-2 transform transition-transform duration-300 group-hover:scale-105"
                      data-search-term={category.name.toLowerCase()}
                    >
                      {category.name}
                    </span>
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: activeCategory === category.slug ? 1 : 0,
                        y: activeCategory === category.slug ? 0 : 10,
                      }}
                      className="text-text-inverted/90 text-sm md:text-base flex items-center"
                    >
                      View Collection
                      <ChevronRight className="inline-block ml-1 w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                    </motion.span>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: activeCategory === category.slug ? 0.8 : 0 }}
                  className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary-light rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Filters Bar */}
      <div
        ref={featuredProductsRef}
        className="bg-background/95 backdrop-blur-md border-y border-border-primary z-20 transition-all duration-300 sticky top-0"
      >
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-text-secondary hover:text-primary transition-colors duration-200 mr-4"
              >
                <Filter className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Filters</span>
                <motion.span
                  initial={{ rotate: 0 }}
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-1 text-xs"
                >
                  ▼
                </motion.span>
              </motion.button>

              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-9 pr-3 py-2 bg-container text-foreground rounded-full border border-border-primary bg-surface-card/80 focus:outline-none focus:ring-2 focus:ring-primary text-sm w-full sm:w-64 transition-all duration-300 focus:w-72"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted group-hover:text-primary transition-colors duration-200" />
                {filters.searchQuery && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={() => setFilters((prev) => ({ ...prev, searchQuery: "" }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-text-muted hover:text-error transition-colors duration-200" />
                  </motion.button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                  className="py-2 pl-3 pr-8 rounded-full border border-border-primary bg-container text-foreground bg-surface-card/80 focus:outline-none focus:ring-2 focus:ring-primary text-sm appearance-none cursor-pointer hover:border-primary transition-colors duration-200"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1rem",
                  }}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <AnimatePresence>
                {filters.categories.map((cat) => (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    className="flex items-center bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm"
                  >
                    <span>{cat}</span>
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          categories: prev.categories.filter((c) => c !== cat),
                        }))
                      }
                      className="ml-2 hover:bg-primary/20 rounded-full p-1 transition-colors duration-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 pt-3 border-t border-border-primary grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden"
              >
                <div>
                  <h4 className="text-sm font-medium mb-2 text-text-secondary">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilters((prev) => ({ ...prev, categories: [] }))}
                      className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
                        filters.categories.length === 0
                          ? "bg-primary text-text-inverted shadow-md shadow-primary/20"
                          : "bg-surface-card hover:bg-surface-card/80 text-text-secondary"
                      }`}
                    >
                      All
                    </motion.button>
                    {categories.map((category) => (
                      <motion.button
                        key={category.slug}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            categories: prev.categories.includes(category.name)
                              ? prev.categories.filter((cat) => cat !== category.name)
                              : [...prev.categories, category.name],
                          }));
                        }}
                        className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
                          filters.categories.includes(category.name)
                            ? "bg-primary text-text-inverted shadow-md shadow-primary/20"
                            : "bg-surface-card hover:bg-surface-card/80 text-text-secondary"
                        }`}
                      >
                        {category.name}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 text-text-secondary">Price Range</h4>
                  <div className="flex flex-wrap gap-2">
                    {priceRanges.map((range) => (
                      <motion.button
                        key={range.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFilters((prev) => ({ ...prev, priceRange: range.value }))}
                        className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
                          filters.priceRange === range.value
                            ? "bg-primary text-text-inverted shadow-md shadow-primary/20"
                            : "bg-surface-card hover:bg-surface-card/80 text-text-secondary"
                        }`}
                      >
                        {range.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 text-text-secondary">Availability</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="inStockOnly"
                      checked={filters.inStockOnly}
                      onChange={(e) => setFilters((prev) => ({ ...prev, inStockOnly: e.target.checked }))}
                      className="h-4 w-4 text-primary border-border-primary rounded focus:ring-primary"
                    />
                    <label htmlFor="inStockOnly" className="text-sm text-text-secondary">
                      In Stock Only
                    </label>
                  </div>
                </div>

                <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setFilters({ categories: [], priceRange: "", sortBy: "", searchQuery: "", inStockOnly: false });
                      setShowFilters(false);
                    }}
                    className="text-sm text-text-muted hover:text-primary transition-colors duration-200 flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All Filters
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Products Section */}
      <section
        ref={productsRef}
        className="py-12 md:py-20 bg-gradient-to-b from-background to-background-secondary/50 dark:from-background dark:to-background-secondary/20"
      >
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={productsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
          >
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                {filters.searchQuery || filters.categories.length > 0 || filters.inStockOnly ? "Filtered Products" : "Handcrafted Collection"}
              </h2>
              <p
                className="text-text-secondary"
                data-search-term="discover our handpicked artisanal treasures"
              >
                {filters.searchQuery || filters.categories.length > 0 || filters.priceRange || filters.inStockOnly
                  ? `Showing ${displayedProducts.length} result${displayedProducts.length !== 1 ? "s" : ""}`
                  : "Discover our handpicked artisanal treasures"}
              </p>
            </div>
          </motion.div>

          {displayedProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="py-16 text-center"
            >
              <div className="inline-flex justify-center items-center w-16 h-16 mb-6 rounded-full bg-background-secondary">
                <Search className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="text-xl font-medium text-text-primary mb-2">No products found</h3>
              <p
                className="text-text-secondary mb-6 max-w-md mx-auto"
                data-search-term="we couldn't find any products"
              >
                We couldn't find any products matching your current filters. Try adjusting your search criteria.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters({ categories: [], priceRange: "", sortBy: "", searchQuery: "", inStockOnly: false })}
                className="btn-primary bg-primary hover:bg-primary-dark inline-flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </motion.button>
            </motion.div>
          ) : (
            <>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={productsInView ? "visible" : "hidden"}
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
              >
                {displayedProducts.slice(0, visibleProducts).map((product, index) => {
                  const isOutOfStock = product.quantity <= 0 && !product.continueSellingWhenOutOfStock;

                  return (
                    <motion.div
                      key={product._id}
                      id={`product-${product._id}`}
                      variants={fadeInUp}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                      onClick={() => handleProductClick(product)}
                      className={`group relative bg-surface-card rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer ${
                        isOutOfStock ? "opacity-60" : ""
                      }`}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <Image
                          src={product.images[0]?.url || "/images/placeholder.jpg"}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={(e) => handleWishlist(product._id, e)}
                            className="p-2 rounded-full bg-surface-card opacity-90 backdrop-blur-sm hover:bg-surface-card transition-colors duration-200"
                          >
                            <Heart
                              className={`w-5 h-5 ${
                                isProductInWishlist(product._id)
                                  ? "text-error"
                                  : "text-text-secondary hover:text-primary"
                              }`}
                              fill={isProductInWishlist(product._id) ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                            <div className="bg-error/90 text-text-inverted text-center py-2 px-4 rounded-lg">
                              <p className="text-sm font-medium">Out of Stock</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-4 sm:p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3
                            className="font-medium text-base sm:text-lg text-text-primary line-clamp-1"
                            data-search-term={product.name.toLowerCase()}
                          >
                            {product.name}
                          </h3>
                          <span className="font-bold text-primary text-base sm:text-lg">฿{product.price.toFixed(2)}</span>
                        </div>
                        <p
                          className="text-xs sm:text-sm text-text-muted line-clamp-2 mb-2 min-h-[2.5rem] sm:min-h-[3rem]"
                          data-search-term={product.shortDescription?.toLowerCase() || product.description.toLowerCase()}
                        >
                          {product.shortDescription || product.description}
                        </p>
                        <div className="flex items-center mb-3 sm:mb-4">
                          {renderStars(product.averageRating || 0, productsLoading)}
                          <span className="ml-2 text-xs text-text-secondary">
                            {productsLoading
                              ? ""
                              : product.averageRating
                              ? `(${product.averageRating.toFixed(1)}) ${product.reviewCount} reviews`
                              : "(0)"}
                          </span>
                        </div>

                        <motion.button
                          whileHover={{ scale: isOutOfStock ? 1 : 1.05 }}
                          whileTap={{ scale: isOutOfStock ? 1 : 0.95 }}
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={isOutOfStock}
                          className={`w-full flex items-center justify-center px-4 py-2 rounded-full transition-colors duration-200 relative overflow-hidden text-sm sm:text-base ${
                            isProductInCart(product._id)
                              ? "bg-primary-dark text-text-inverted"
                              : isOutOfStock
                              ? "bg-background-secondary text-text-muted cursor-not-allowed"
                              : "bg-primary text-text-inverted hover:bg-primary-dark"
                          }`}
                        >
                          {isProductInCart(product._id) ? (
                            <>
                              <ShoppingBag className="w-4 h-4" />
                              <span className="text-xs mr-1">{getProductQuantityInCart(product._id)}</span>
                              <span className="text-sm">In Cart</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-4 h-4 mr-1" />
                              <span className="text-sm">{isOutOfStock ? "Out of Stock" : "Add To Cart"}</span>
                            </>
                          )}
                          {hoverEffects[product._id] && !isOutOfStock && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-primary-light/30"
                            />
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {hasMoreProducts && (
                <div className="mt-12 text-center">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setVisibleProducts((prev) => prev + 8)}
                    className="btn-primary bg-surface-card hover:bg-surface-card/80 border border-border-primary inline-flex items-center text-text-secondary text-sm sm:text-base"
                  >
                    Load More
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 13l-7 7-7-7m14-8l-7 7-7-7"
                      ></path>
                    </svg>
                  </motion.button>
                </div>
              )}

              {selectedProduct && (
                <ProductModal
                  product={selectedProduct}
                  onClose={() => {
                    setSelectedProduct(null);
                    // Restore homepage URL
                    window.history.pushState({}, '', '/');
                  }}
                  keyword={selectedProduct.keyword}
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}