"use client";

import { useState, useEffect , useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Custom hook for fetching products with proper error handling and loading states
export const useProducts = (initialPage = 1, initialLimit = 50) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const response = await axios.get(`/api/products?page=${pagination.page}&limit=${pagination.limit}`);
        setProducts(response.data.products || []);
        setPagination({
          page: response.data.page || pagination.page,
          limit: response.data.limit || pagination.limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        });
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsError(true);
        toast.error('Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [pagination.page, pagination.limit]);

  const changePage = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const changeLimit = (newLimit) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1 // Reset to first page when changing limit
    }));
  };

  return {
    products,
    isLoading,
    isError,
    pagination,
    changePage,
    changeLimit
  };
};

// Hook for fetching a single product by ID
export const useProduct = (productId) => {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const response = await axios.get(`/api/products/${productId}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Error fetching product:', error);
        setIsError(true);
        toast.error('Failed to load product details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return {
    product,
    isLoading,
    isError
  };
};

// Function to add a new product
export const addProduct = async (productData) => {
  try {
    const response = await axios.post('/api/admin/product/add', productData);
    toast.success('Product added successfully!');
    return response.data;
  } catch (error) {
    console.error('Error adding product:', error);
    toast.error(error.response?.data?.message || 'Failed to add product');
    throw error;
  }
};

// Function to update an existing product
export const updateProduct = async (productId, productData) => {
  try {
    const response = await axios.put(`/api/admin/product/${productData.slug}`, productData);
    toast.success('Product updated successfully!');
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    toast.error(error.response?.data?.message || 'Failed to update product');
    throw error;
  }
};

// Function to delete a product
export const deleteProduct = async (slug) => {
  try {
    await axios.delete(`/api/admin/product/${slug}`);
    toast.success('Product deleted successfully!');
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    toast.error(error.response?.data?.message || 'Failed to delete product');
    throw error;
  }
};

// Hook for fetching categories with sorting and filtering
export const useCategories = (initialSort = "name", initialDirection = "asc") => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [sortField, setSortField] = useState(initialSort);
  const [sortDirection, setSortDirection] = useState(initialDirection);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const response = await axios.get('/api/category');
        setCategories(response.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setIsError(true);
        toast.error('Failed to load categories. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      // Handle priority sorting (main comes first)
      if (sortField === "priority") {
        if (a.priority === "main" && b.priority !== "main") return sortDirection === "asc" ? -1 : 1;
        if (a.priority !== "main" && b.priority === "main") return sortDirection === "asc" ? 1 : -1;
      }
      
      // Handle other fields
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [categories, sortField, sortDirection]);

  return {
    categories: sortedCategories,
    isLoading,
    isError,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection
  };
};

// Function to add a new category
export const addCategory = async (categoryData) => {
  try {
    const response = await axios.post("/api/admin/category", categoryData);
    toast.success("Category added successfully!");
    return response.data;
  } catch (error) {
    console.error("Error adding category:", error);
    toast.error(error.response?.data?.error || "Failed to add category");
    throw error;
  }
};

// Function to update an existing category
export const updateCategory = async (categoryData) => {
  try {
    const response = await axios.put("/api/admin/category", categoryData);
    toast.success("Category updated successfully!");
    return response.data;
  } catch (error) {
    console.error("Error updating category:", error);
    toast.error(error.response?.data?.error || "Failed to update category");
    throw error;
  }
};

// Function to delete a category
export const deleteCategory = async (slug) => {
  try {
    await axios.delete('/api/admin/category', {
      data: { slug }
    });
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

