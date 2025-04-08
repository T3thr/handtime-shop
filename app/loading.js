"use client";
import React from "react";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Hero Section Skeleton */}
      <section className="relative h-[85vh] lg:h-[85vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background-secondary via-primary-10 to-primary-light-30 dark:from-background-secondary dark:via-primary-20 dark:to-primary-dark-40 opacity-50">
          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-repeat bg-center opacity-10"></div>
        </div>
        <div className="container mx-auto max-w-7xl h-full flex items-center px-4 lg:px-8 z-10 relative">
          <div className="max-w-2xl text-foreground space-y-6">
            <div className="h-14 md:h-16 lg:h-20 bg-background-secondary/70 rounded-lg w-3/4 animate-pulse"></div>
            <div className="h-6 bg-background-secondary/70 rounded-lg w-full animate-pulse"></div>
            <div className="h-6 bg-background-secondary/70 rounded-lg w-5/6 animate-pulse"></div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="h-12 bg-background-secondary/70 rounded-full w-40 animate-pulse"></div>
              <div className="h-12 bg-background-secondary/70 rounded-full w-40 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="absolute top-1/4 -right-24 w-64 h-64 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-light/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background dark:from-background to-transparent"></div>
      </section>

      {/* Image Slider Skeleton */}
      <div className="py-12 overflow-hidden">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="h-8 bg-background-secondary/70 rounded-lg w-64 mb-8 animate-pulse"></div>
          <div className="flex space-x-6 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[280px] h-64 bg-background-secondary/70 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Section Skeleton */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-12">
            <div className="h-10 bg-background-secondary/70 rounded-lg w-64 mb-4 animate-pulse"></div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="h-6 bg-background-secondary/70 rounded-lg w-full max-w-2xl mb-4 md:mb-0 animate-pulse"></div>
              <div className="h-6 bg-background-secondary/70 rounded-lg w-36 animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/3] relative rounded-2xl bg-background-secondary/70 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky Filter Bar Skeleton */}
      <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-md border-y border-border-primary">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <div className="h-10 bg-background-secondary/70 rounded-full w-24 mr-4 animate-pulse"></div>
              <div className="h-10 bg-background-secondary/70 rounded-full w-64 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 bg-background-secondary/70 rounded-full w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section Skeleton */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-background to-background-secondary/50 dark:from-background dark:to-background-secondary/20">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="space-y-2">
              <div className="h-10 bg-background-secondary/70 rounded-lg w-64 animate-pulse"></div>
              <div className="h-6 bg-background-secondary/70 rounded-lg w-40 animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array(8).fill(0).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="h-12 bg-background-secondary/70 rounded-full w-32 mx-auto animate-pulse"></div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-surface-card rounded-xl shadow-sm overflow-hidden"
    >
      <div className="aspect-square relative bg-background-secondary/70 animate-pulse"></div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="h-6 bg-background-secondary/70 rounded-lg w-3/4 animate-pulse"></div>
          <div className="h-6 bg-background-secondary/70 rounded-lg w-1/4 animate-pulse"></div>
        </div>
        <div className="h-4 bg-background-secondary/70 rounded-lg w-full mt-3 animate-pulse"></div>
        <div className="h-4 bg-background-secondary/70 rounded-lg w-2/3 mt-2 animate-pulse"></div>
        <div className="mt-4 h-10 bg-background-secondary/70 rounded-full animate-pulse"></div>
      </div>
    </motion.div>
  );
}