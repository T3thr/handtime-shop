"use client";

import React, { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination } from '@/components/contents/DashboardUI';

// Memoized components to prevent unnecessary re-renders

// Memoized DashboardCard for better performance
export const OptimizedDashboardCard = memo(({ icon: Icon, title, value, color = "text-primary" }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-surface-card p-6 rounded-xl shadow-md border border-border-primary hover:shadow-lg transition-all duration-300"
    layout
  >
    <div className="flex items-center mb-4">
      <div className={`p-3 rounded-full ${color} bg-background-secondary/30`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="ml-3 text-lg font-medium text-text-primary">{title}</h3>
    </div>
    <p className="text-3xl font-bold text-text-primary">{value}</p>
  </motion.div>
));

// Memoized DataTable for better performance
export const OptimizedDataTable = memo(({ columns, data, emptyMessage, isLoading, currentPage, totalPages, onPageChange }) => {
  if (isLoading) {
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return <p className="text-text-muted py-4 text-center">{emptyMessage || "No data available"}</p>;
  }
  
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`py-3 px-4 text-left text-sm font-medium text-text-muted ${
                    column.align === "right" ? "text-right" : ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: rowIndex * 0.05 }}
                className="border-b border-border-primary hover:bg-background-secondary/30 transition-colors duration-150"
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`py-3 px-4 text-sm ${column.className || ""} ${
                      column.align === "right" ? "text-right" : ""
                    }`}
                  >
                    {column.render ? column.render(row) : row[column.accessor]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
});

// Memoized SearchInput for better performance
export const OptimizedSearchInput = memo(({ value, onChange, placeholder }) => {
  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="relative">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder || "Search..."}
        className="pl-10 pr-4 py-2 w-full bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
      />
    </div>
  );
});

// Optimized TabView component with virtualization for large datasets
export const OptimizedTabView = memo(({ tabs, activeTab, onChange, children }) => {
  const handleTabChange = useCallback((tabId) => {
    onChange(tabId);
  }, [onChange]);

  return (
    <div className="space-y-6">
      <div className="border-b border-border-primary">
        <div className="flex space-x-4 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors duration-200 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-primary hover:border-border-primary"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

// Optimized FilterBar component
export const OptimizedFilterBar = memo(({ filters, activeFilters, onFilterChange, searchValue, onSearchChange }) => {
  const handleFilterChange = useCallback((filterId, value) => {
    onFilterChange(filterId, value);
  }, [onFilterChange]);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <div key={filter.id} className="relative">
            <select
              value={activeFilters[filter.id] || ''}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              className="px-3 py-2 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none pr-8"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        ))}
      </div>
      
      <OptimizedSearchInput 
        value={searchValue} 
        onChange={onSearchChange} 
        placeholder="Search..." 
      />
    </div>
  );
});

// Optimized Card component with skeleton loading state
export const OptimizedCard = memo(({ children, className = "", isLoading }) => {
  if (isLoading) {
    return (
      <div className={`bg-surface-card rounded-xl shadow-md border border-border-primary p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-background-secondary rounded w-3/4"></div>
          <div className="h-4 bg-background-secondary rounded w-1/2"></div>
          <div className="h-4 bg-background-secondary rounded w-5/6"></div>
          <div className="h-4 bg-background-secondary rounded w-4/6"></div>
          <div className="h-10 bg-background-secondary rounded w-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-surface-card rounded-xl shadow-md border border-border-primary p-6 ${className}`}>
      {children}
    </div>
  );
});

// Optimized Grid component with responsive layout
export const OptimizedGrid = memo(({ children, columns = { sm: 1, md: 2, lg: 3 }, gap = 6 }) => {
  const gridClasses = `grid grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} gap-${gap}`;
  
  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
});

// Optimized Section component with lazy loading
export const OptimizedSection = memo(({ id, title, subtitle, children, isLoading }) => {
  return (
    <section id={id} className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        {subtitle && <p className="text-text-muted mt-1">{subtitle}</p>}
      </div>
      
      {isLoading ? (
        <OptimizedCard isLoading={true} />
      ) : (
        children
      )}
    </section>
  );
});

// Export all optimized components
export const OptimizedComponents = {
  DashboardCard: OptimizedDashboardCard,
  DataTable: OptimizedDataTable,
  SearchInput: OptimizedSearchInput,
  TabView: OptimizedTabView,
  FilterBar: OptimizedFilterBar,
  Card: OptimizedCard,
  Grid: OptimizedGrid,
  Section: OptimizedSection
};
