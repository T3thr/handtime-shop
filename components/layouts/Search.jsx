"use client";
import React, { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/backend/lib/productAction";
import axios from "axios";
import Image from "next/image";
import { learnMoreContent } from "@/components/contents/LearnMoreModal";
import { footerContent } from "@/components/contents/Footer";
import { sidebarContent } from "@/components/layouts/SideBar";

const Search = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({});
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const { products } = useProducts();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults({});
      return;
    }

    const results = {};
    const lowerQuery = query.toLowerCase();

    // Products
    if (products) {
      results["Products"] = products
        .filter(
          (product) =>
            product.name.toLowerCase().includes(lowerQuery) ||
            product.description.toLowerCase().includes(lowerQuery)
        )
        .map((p) => ({
          name: p.name,
          content: p.description,
          id: p._id,
          image: p.images[0]?.url || "/images/placeholder.jpg",
          type: "product",
        }));
    }

    // Categories
    const categoriesResponse = await axios.get("/api/category");
    const categories = categoriesResponse.data.map((cat) => ({
      name: cat.name,
      slug: cat.slug,
    }));
    results["Categories"] = categories
      .filter((cat) => cat.name.toLowerCase().includes(lowerQuery))
      .map((cat) => ({
        name: cat.name,
        content: `Category: ${cat.name}`,
        slug: cat.slug,
        type: "category",
      }));

    // Learn More
    results["Learn More"] = learnMoreContent
      .filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.content.toLowerCase().includes(lowerQuery)
      )
      .map((item) => ({
        name: item.name,
        content: item.content,
        type: "learn-more",
      }));

    // Footer (Support Thai Language)
    results["Footer"] = footerContent
      .filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.name.includes(query) ||
          item.content.toLowerCase().includes(lowerQuery) ||
          item.content.includes(query)
      )
      .map((item) => ({
        name: item.name,
        content: item.content,
        type: "footer",
      }));

    // Sidebar
    results["Sidebar"] = sidebarContent
      .filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.content.toLowerCase().includes(lowerQuery)
      )
      .map((item) => ({
        name: item.name,
        content: item.content,
        href: item.href, // Include href for sidebar navigation
        type: "sidebar",
      }));

    setSearchResults(results);
  };

  const navigateToResult = (result) => {
    setSearchQuery("");
    setIsSearchOpen(false);

    switch (result.type) {
      case "product":
        document.dispatchEvent(
          new CustomEvent("openProductModal", { detail: { id: result.id, keyword: result.name } })
        );
        break;
      case "category":
        const categoryElement = document.querySelector(`[data-category="${result.slug}"]`);
        if (categoryElement) {
          categoryElement.scrollIntoView({ behavior: "smooth", block: "center" });
          highlightKeyword(result.name);
        }
        break;
      case "learn-more":
        document.dispatchEvent(
          new CustomEvent("openLearnMoreModal", { detail: { section: result.name, keyword: result.name } })
        );
        break;
      case "footer":
        const footerElement = document.getElementById("footer-about");
        if (footerElement) {
          footerElement.scrollIntoView({ behavior: "smooth", block: "center" });
          highlightKeyword(result.name);
        }
        break;
      case "sidebar":
        document.dispatchEvent(
          new CustomEvent("openSidebar", { detail: { href: result.href, keyword: result.name } })
        );
        break;
      default:
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const highlightKeyword = (keyword) => {
    const elements = document.querySelectorAll(
      `[data-search-term="${keyword.toLowerCase()}"], [data-search-term="${keyword}"]`
    );
    elements.forEach((el) => {
      el.classList.add("highlight");
      setTimeout(() => el.classList.remove("highlight"), 3000);
    });
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md mx-auto z-50">
      <div className="hidden md:block">
        <div className="relative">
          <input
            type="text"
            placeholder="Search across the site..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" &&
              searchQuery &&
              navigateToResult(Object.values(searchResults)[0]?.[0])
            }
            className="w-full pl-10 pr-10 py-2 rounded-full bg-surface-card border-2 border-border-primary focus:outline-none focus:ring-2 focus:ring-primary text-sm text-text-primary placeholder:text-text-muted transition-all duration-300 hover:bg-surface-card/90"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-background-secondary rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-text-muted hover:text-error" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {searchQuery && Object.keys(searchResults).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-12 left-0 right-0 bg-surface-card rounded-lg shadow-md border border-border-primary max-h-96 overflow-y-auto mt-2"
            >
              {Object.entries(searchResults).map(
                ([header, items]) =>
                  items.length > 0 && (
                    <div key={header} className="border-b border-border-primary last:border-b-0">
                      <h3 className="px-4 py-2 bg-background-secondary text-text-primary font-semibold text-sm">
                        {header}
                      </h3>
                      {items.map((item, index) => (
                        <div
                          key={index}
                          onClick={() => navigateToResult(item)}
                          className="px-4 py-3 hover:bg-background-secondary cursor-pointer transition-colors flex items-center gap-3"
                        >
                          {item.image && (
                            <div className="w-10 h-10 relative flex-shrink-0">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-text-primary">{item.name}</h4>
                            <p className="text-xs text-text-muted line-clamp-2">{item.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="md:hidden">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 hover:bg-container rounded-lg transition-colors"
          aria-label="Search"
        >
          <SearchIcon className="h-6 w-6 text-foreground" />
        </button>

        <AnimatePresence>
          {isSearchOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => setIsSearchOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="fixed top-0 left-0 right-0 bg-surface-card p-4 z-50 shadow-xl border-b border-border-primary"
              >
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search across the site..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      searchQuery &&
                      navigateToResult(Object.values(searchResults)[0]?.[0])
                    }
                    className="w-full pl-10 pr-12 py-3 rounded-lg bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary text-sm text-text-primary placeholder:text-text-muted"
                  />
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-background-secondary rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-text-muted hover:text-error" />
                  </button>
                </div>

                {searchQuery && Object.keys(searchResults).length > 0 && (
                  <div className="mt-4 max-h-[70vh] overflow-y-auto rounded-lg border border-border-primary bg-surface-card">
                    {Object.entries(searchResults).map(
                      ([header, items]) =>
                        items.length > 0 && (
                          <div key={header} className="border-b border-border-primary last:border-b-0">
                            <h3 className="px-4 py-2 bg-background-secondary text-text-primary font-semibold text-sm">
                              {header}
                            </h3>
                            {items.map((item, index) => (
                              <div
                                key={index}
                                onClick={() => navigateToResult(item)}
                                className="px-4 py-3 hover:bg-background-secondary cursor-pointer transition-colors flex items-center gap-3"
                              >
                                {item.image && (
                                  <div className="w-10 h-10 relative flex-shrink-0">
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      fill
                                      className="object-cover rounded"
                                    />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-text-primary">{item.name}</h4>
                                  <p className="text-xs text-text-muted line-clamp-2">{item.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Search;