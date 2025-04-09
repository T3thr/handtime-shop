"use client";
import React, { useState, useEffect, useRef, useContext } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { useCart } from "@/context/CartContext";
import ImageSlider from "@/components/contents/ImageSlider";
import LearnMoreModal from "@/components/contents/LearnMoreModal";
import { Heart, ShoppingBag, Filter, Search, X, ChevronRight, ArrowUpRight } from "lucide-react";
import { useProducts } from "@/backend/lib/productAction";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import AuthContext from "@/context/AuthContext";
import ProductModal from "./ProductModal";
import Loading from "@/app/loading";
import { useSidebar } from "@/context/SidebarContext";

export default function Product() {
  const featuredProductsRef = useRef(null);
  const [isLearnMoreModalOpen, setIsLearnMoreModalOpen] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState({ section: "", keyword: "" });
  const [filters, setFilters] = useState({
    category: "",
    priceRange: "",
    sortBy: "",
    searchQuery: "",
  });
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [visibleProducts, setVisibleProducts] = useState(8);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  const { user, lineProfile, status } = useContext(AuthContext);
  const { addToCart, cartItems, getCartSummary } = useCart();
  const { products, isLoading: productsLoading, isError } = useProducts();
  const { openSidebar } = useSidebar();

  const isAuthenticated = status === "authenticated" || !!user || !!lineProfile;

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await axios.get("/api/wishlist");
        setWishlist(response.data.wishlist.map((item) => item.productId.toString()));
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
        //toast.error("Could not load wishlist");
      }
    };

    fetchWishlist();

    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/category");
        setCategories(response.data);
      } catch (error) {
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();

    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  useEffect(() => {
    setVisibleProducts(8);
  }, [filters]);

  useEffect(() => {
    const handleOpenProductModal = (e) => {
      const { id, keyword } = e.detail;
      const product = products.find((p) => p._id === id);
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

  const scrollToFeaturedProducts = () => {
    if (featuredProductsRef.current) {
      featuredProductsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const getFilteredProducts = () => {
    if (!products) return [];

    let filtered = [...products];
    if (filters.searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }
    if (filters.category) {
      filtered = filtered.filter((p) => p.categories.includes(filters.category));
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
        if (filters.sortBy === "rating") return (b.averageRating || 0) - (a.averageRating || 0);
        return 0;
      });
    }
    return filtered;
  };

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
                <p className="font-medium text-[var(--text-primary)]">{product.name}</p>
                <p className="text-sm text-[var(--text-muted)]">Added to cart</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-[var(--text-secondary)]">
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
    setSelectedProduct(product);
  };

  const isProductInCart = (productId) => cartItems.some((item) => item.productId === productId);

  const getProductQuantityInCart = (productId) => {
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
        isAdded
          ? [...prev, productId.toString()]
          : prev.filter((id) => id !== productId.toString())
      );
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update wishlist");
    }
  };

  const displayedProducts = getFilteredProducts();
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

  if (isLoading || productsLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center p-8 max-w-lg mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
            <X className="w-10 h-10 text-[var(--error)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--error)] mb-4">Oops! Something went wrong</h2>
          <p className="text-[var(--text-secondary)] mb-6">We couldn't load our handcrafted products. Please try again later.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-300">
      <LearnMoreModal
        isOpen={isLearnMoreModalOpen}
        onClose={() => setIsLearnMoreModalOpen(false)}
        section={highlightedSection.section}
        keyword={highlightedSection.keyword}
      />

      <section className="relative h-[85vh] lg:h-[85vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--background-secondary)] via-[var(--primary)]-10 to-[var(--primary-light)]-30 dark:from-[var(--background-secondary)] dark:via-[var(--primary)]-20 dark:to-[var(--primary-dark)]-40">
          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-repeat bg-center opacity-20"></div>
        </div>
        <div className="container mx-auto max-w-7xl h-full flex items-center px-4 lg:px-8 z-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl text-[var(--foreground)] space-y-6"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
            >
              Handmade Treasures from{" "}
              <span className="text-[var(--primary)] relative" data-search-term="uttaradit">
                Uttaradit
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  className="absolute -bottom-1 left-0 h-[3px] bg-[var(--primary)] rounded-full"
                ></motion.span>
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed"
              data-search-term="discover authentic thai craftsmanship"
            >
              Discover authentic Thai craftsmanship with our collection of handmade products. Each piece tells a story of tradition and passion from the heart of Uttaradit.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(15, 118, 110, 0.2)" }}
                whileTap={{ scale: 0.97 }}
                onClick={scrollToFeaturedProducts}
                className="btn-primary bg-[var(--primary)] text-[var(--text-inverted)] hover:bg-[var(--primary-dark)] transition-colors duration-200 flex items-center justify-center"
              >
                Explore Collection
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsLearnMoreModalOpen(true)}
                className="btn-primary bg-[var(--surface-card)]/10 hover:bg-[var(--surface-card)]/20 backdrop-blur-sm transition-colors duration-200"
              >
                Our Story
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute top-1/4 -right-24 w-64 h-64 rounded-full bg-[var(--primary)]/20 blur-3xl"
        ></motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[var(--primary-light)]/20 blur-3xl"
        ></motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--background)] dark:from-[var(--background)] to-transparent"></div>
      </section>

      <ImageSlider />

      <section className="py-16 md:py-24 bg-[var(--background)]" id="categories">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[var(--text-primary)]">Shop by Category</h2>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <p className="text-[var(--text-secondary)] mb-4 md:mb-0 max-w-2xl" data-search-term="browse our handcrafted collections">
                Browse our handcrafted collections organized by traditional Thai craft categories.
              </p>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="flex items-center text-[var(--primary)] text-sm font-medium cursor-pointer group"
                onClick={scrollToFeaturedProducts}
              >
                View All Categories
                <span className="ml-1 group-hover:ml-2 transition-all duration-300">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </motion.div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.slice(0, 4).map((category, index) => (
              <motion.div
                key={category.slug || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                onMouseEnter={() => setActiveCategory(category.slug)}
                onMouseLeave={() => setActiveCategory(null)}
                className="group relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                onClick={() => {
                  setFilters((prev) => ({ ...prev, category: category.name }));
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
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 group-hover:from-black/80 transition-all duration-300" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <span
                      className="text-[var(--text-inverted)] text-lg md:text-xl lg:text-2xl font-bold mb-2 transform transition-transform duration-300 group-hover:scale-105"
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
                      className="text-[var(--text-inverted)]/90 text-sm md:text-base flex items-center"
                    >
                      View Collection
                      <ChevronRight className="inline-block ml-1 w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div
        ref={featuredProductsRef}
        className="sticky top-16 z-20 bg-[var(--background)]/80 backdrop-blur-md border-y border-[var(--border-primary)]"
      >
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-200 mr-4"
              >
                <Filter className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Filters</span>
                {showFilters ? (
                  <motion.span initial={{ rotate: 0 }} animate={{ rotate: 180 }} transition={{ duration: 0.3 }} className="ml-1 text-xs">
                    ▲
                  </motion.span>
                ) : (
                  <motion.span initial={{ rotate: 180 }} animate={{ rotate: 0 }} transition={{ duration: 0.3 }} className="ml-1 text-xs">
                    ▼
                  </motion.span>
                )}
              </motion.button>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-9 pr-3 py-2 bg-[var(--container)] text-[var(--foreground)] rounded-full border border-[var(--border-primary)] bg-[var(--surface-card)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm w-full sm:w-64 transition-all duration-300 focus:w-72"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                {filters.searchQuery && (
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, searchQuery: "" }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors duration-200" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                className="py-2 pl-3 pr-8 rounded-full border border-[var(--border-primary)] bg-[var(--container)] text-[var(--foreground)] bg-[var(--surface-card)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm appearance-none cursor-pointer hover:border-[var(--primary)] transition-colors duration-200"
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

              {filters.category && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-2 rounded-full text-sm"
                >
                  <span>{filters.category}</span>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, category: "" }))}
                    className="ml-2 hover:bg-[var(--primary)]/20 rounded-full p-1 transition-colors duration-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 pt-3 border-t border-[var(--border-primary)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden"
              >
                <div>
                  <h4 className="text-sm font-medium mb-2 text-[var(--text-secondary)]">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilters((prev) => ({ ...prev, category: "" }))}
                      className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
                        filters.category === ""
                          ? "bg-[var(--primary)] text-[var(--text-inverted)] shadow-md shadow-[var(--primary)]/20"
                          : "bg-[var(--surface-card)] hover:bg-[var(--surface-card)]/80 text-[var(--text-secondary)]"
                      }`}
                    >
                      All
                    </motion.button>
                    {categories.map((category) => (
                      <motion.button
                        key={category.slug}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFilters((prev) => ({ ...prev, category: category.name }))}
                        className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
                          filters.category === category.name
                            ? "bg-[var(--primary)] text-[var(--text-inverted)] shadow-md shadow-[var(--primary)]/20"
                            : "bg-[var(--surface-card)] hover:bg-[var(--surface-card)]/80 text-[var(--text-secondary)]"
                        }`}
                      >
                        {category.name}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 text-[var(--text-secondary)]">Price Range</h4>
                  <div className="flex flex-wrap gap-2">
                    {priceRanges.map((range) => (
                      <motion.button
                        key={range.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFilters((prev) => ({ ...prev, priceRange: range.value }))}
                        className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
                          filters.priceRange === range.value
                            ? "bg-[var(--primary)] text-[var(--text-inverted)] shadow-md shadow-[var(--primary)]/20"
                            : "bg-[var(--surface-card)] hover:bg-[var(--surface-card)]/80 text-[var(--text-secondary)]"
                        }`}
                      >
                        {range.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setFilters({
                        category: "",
                        priceRange: "",
                        sortBy: "",
                        searchQuery: "",
                      });
                      setShowFilters(false);
                    }}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors duration-200 flex items-center"
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

      <section className="py-12 md:py-20 bg-gradient-to-b from-[var(--background)] to-[var(--background-secondary)]/50 dark:from-[var(--background)] dark:to-[var(--background-secondary)]/20">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-2"
            >
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] bg-clip-text text-transparent">
                {filters.searchQuery || filters.category ? "Filtered Products" : "Handcrafted Collection"}
              </h2>
              <p className="text-[var(--text-secondary)]" data-search-term="discover our handpicked artisanal treasures">
                {(filters.searchQuery || filters.category || filters.priceRange)
                  ? `Showing ${displayedProducts.length} result${displayedProducts.length !== 1 ? "s" : ""}`
                  : "Discover our handpicked artisanal treasures"}
              </p>
            </motion.div>
          </div>

          {displayedProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="py-16 text-center"
            >
              <div className="inline-flex justify-center items-center w-16 h-16 mb-6 rounded-full bg-[var(--background-secondary)]">
                <Search className="h-8 w-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-xl font-medium text-[var(--text-primary)] mb-2">No products found</h3>
              <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto" data-search-term="we couldn't find any products">
                We couldn't find any products matching your current filters. Try adjusting your search criteria.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setFilters({
                    category: "",
                    priceRange: "",
                    sortBy: "",
                    searchQuery: "",
                  })
                }
                className="btn-primary bg-[var(--primary)] hover:bg-[var(--primary-dark)] inline-flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </motion.button>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {displayedProducts.slice(0, visibleProducts).map((product, index) => (
                  <motion.div
                    key={product._id}
                    id={`product-${product._id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="group relative bg-[var(--surface-card)] rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                  >
                    <div
                      className="aspect-square relative overflow-hidden cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
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
                          className="p-2 rounded-full bg-[var(--surface-card)] opacity-90 backdrop-blur-sm hover:bg-[var(--surface-card)] transition-colors duration-200"
                        >
                          <Heart
                            className={`w-5 h-5 ${isProductInWishlist(product._id) ? "text-[var(--error)]" : "text-[var(--text-secondary)] hover:text-[var(--primary)]"}`}
                            fill={isProductInWishlist(product._id) ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                      {product.quantity <= 0 && !product.continueSellingWhenOutOfStock && (
                        <div className="absolute top-0 left-0 w-full bg-[var(--error)]/90 text-[var(--text-inverted)] text-center py-1 text-sm font-medium">
                          Out of Stock
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3
                          className="font-medium text-[var(--text-primary)] line-clamp-1 cursor-pointer"
                          onClick={() => handleProductClick(product)}
                          data-search-term={product.name.toLowerCase()}
                        >
                          {product.name}
                        </h3>
                        <span className="font-bold text-[var(--primary)]">฿{product.price.toFixed(2)}</span>
                      </div>
                      <p
                        className="text-sm text-[var(--text-muted)] line-clamp-2 mb-4 min-h-[40px]"
                        data-search-term={product.shortDescription?.toLowerCase() || product.description.toLowerCase()}
                      >
                        {product.shortDescription || product.description}
                      </p>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.quantity <= 0 && !product.continueSellingWhenOutOfStock}
                        className={`w-full flex items-center justify-center px-4 py-2 rounded-full transition-colors duration-200 ${
                          isProductInCart(product._id)
                            ? "bg-[var(--primary-dark)] text-[var(--text-inverted)]"
                            : product.quantity <= 0 && !product.continueSellingWhenOutOfStock
                            ? "bg-[var(--background-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                            : "bg-[var(--primary)] text-[var(--text-inverted)] hover:bg-[var(--primary-dark)]"
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
                            <span className="text-sm">Add To Cart</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {hasMoreProducts && (
                <div className="mt-12 text-center">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setVisibleProducts((prev) => prev + 8)}
                    className="btn-primary bg-[var(--surface-card)] hover:bg-[var(--surface-card)]/80 border border-[var(--border-primary)] inline-flex items-center"
                  >
                    Load More
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 13l-7 7-7-7m14-8l-7 7-7-7"></path>
                    </svg>
                  </motion.button>
                </div>
              )}

              {selectedProduct && (
                <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} keyword={selectedProduct.keyword} />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}