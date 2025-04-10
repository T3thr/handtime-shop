"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ChevronRight } from "lucide-react";

const CategoryModal = ({ isOpen, onClose, categories, onCategorySelect, selectedCategories }) => {
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", damping: 20, stiffness: 300 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          className="bg-surface-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md p-6 border-b border-border-primary flex justify-between items-center">
            <h2 className="text-2xl font-bold text-text-primary">Explore Categories</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-full hover:bg-background-secondary text-text-muted transition-colors"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((category) => (
                <motion.div
                  key={category.slug}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onCategorySelect(category.name)}
                  className={`relative rounded-xl overflow-hidden shadow-md cursor-pointer transition-all duration-300 ${
                    selectedCategories.includes(category.name)
                      ? "ring-2 ring-primary"
                      : "hover:shadow-lg"
                  }`}
                >
                  <div className="aspect-[4/3] relative">
                    <Image
                      src={category.image?.url || "/images/placeholder.jpg"}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <h3
                        className="text-text-inverted text-lg font-semibold mb-2"
                        data-search-term={category.name.toLowerCase()}
                      >
                        {category.name}
                      </h3>
                      <p className="text-text-inverted/80 text-sm text-center line-clamp-2">
                        {category.description || "Discover unique items in this category"}
                      </p>
                      <motion.div
                        className="mt-2 flex items-center text-text-inverted text-sm font-medium"
                        whileHover={{ x: 5 }}
                      >
                        Explore
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </motion.div>
                    </div>
                    {category.priority === "main" && (
                      <div className="absolute top-2 left-2 bg-primary text-text-inverted text-xs font-bold px-2 py-1 rounded-full">
                        Featured
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 bg-background/95 backdrop-blur-md p-4 border-t border-border-primary">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full py-2 bg-primary text-text-inverted rounded-full hover:bg-primary-dark transition-colors"
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CategoryModal;