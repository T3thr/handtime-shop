"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import useSWR from 'swr';

// Fetcher function for SWR
const fetcher = url => axios.get(url).then(res => res.data);

// Custom hook for fetching products with proper error handling and loading states
export const useProducts = (initialPage = 1, initialLimit = 50) => {
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/product?page=${pagination.page}&limit=${pagination.limit}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000
    }
  );

  // Process the data to ensure proper image URLs
  const products = data?.products?.map(product => ({
    ...product,
    images: Array.isArray(product.images) ? product.images.map(image => ({
      ...image,
      url: image.url || "/images/placeholder.jpg"
    })) : []
  })) || [];

  // Update pagination from response
  useEffect(() => {
    if (data) {
      setPagination({
        page: data.page || pagination.page,
        limit: data.limit || pagination.limit,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      });
    }
  }, [data]);

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

  // Manual refetch function
  const refetchProducts = () => {
    mutate();
  };

  return {
    products,
    isLoading,
    isError: !!error,
    pagination,
    changePage,
    changeLimit,
    mutate: refetchProducts, // Provide both mutate and refetch for compatibility
    refetch: refetchProducts
  };
};

// Hook for fetching a single product by ID
export const useProduct = (productId) => {
  const { data, error, isLoading, mutate } = useSWR(
    productId ? `/api/admin/product/${productId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000
    }
  );

  // Process the data to ensure proper image URLs
  const product = data ? {
    ...data,
    images: Array.isArray(data.images) ? data.images.map(image => ({
      ...image,
      url: image.url || "/images/placeholder.jpg"
    })) : []
  } : null;

  return {
    product,
    isLoading,
    isError: !!error,
    mutate,
    refetch: mutate
  };
};

// Function to add a new product
export const addProduct = async (productData) => {
  try {
    // Ensure images array is properly formatted
    const formattedProductData = {
      ...productData,
      images: Array.isArray(productData.images) ? productData.images.filter(img => img && img.url) : []
    };
    
    const response = await axios.post('/api/admin/product/add', formattedProductData);
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
    // Ensure images array is properly formatted
    const formattedProductData = {
      ...productData,
      images: Array.isArray(productData.images) ? productData.images.filter(img => img && img.url) : []
    };
    
    const response = await axios.put(`/api/admin/product/${productId}`, formattedProductData);
    toast.success('Product updated successfully!');
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    toast.error(error.response?.data?.message || 'Failed to update product');
    throw error;
  }
};

// Function to delete a product
export const deleteProduct = async (productId) => {
  try {
    await axios.delete(`/api/admin/product/${productId}`);
    toast.success('Product deleted successfully!');
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    toast.error(error.response?.data?.message || 'Failed to delete product');
    throw error;
  }
};

// Hook for fetching categories
export const useCategories = () => {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/category',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000
    }
  );

  // Process the data to ensure proper image URLs
  const categories = data ? data.map(category => ({
    ...category,
    image: category.image && category.image.url ? {
      ...category.image,
      url: category.image.url || "/images/placeholder.jpg"
    } : null
  })) : [];

  return {
    categories,
    isLoading,
    isError: !!error,
    mutate,
    refetch: mutate
  };
};

// Function to add a new category
export const addCategory = async (categoryData) => {
  try {
    // Ensure image is properly formatted
    const formattedCategoryData = {
      ...categoryData,
      image: categoryData.image && categoryData.image.url ? categoryData.image : null
    };
    
    const response = await axios.post("/api/admin/category", formattedCategoryData);
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
    if (!categoryData._id) {
      throw new Error("Category ID is required");
    }
    
    // Ensure image is properly formatted
    const formattedCategoryData = {
      ...categoryData,
      image: categoryData.image && categoryData.image.url ? categoryData.image : null
    };
    
    const response = await axios.put(`/api/admin/category/${categoryData._id}`, formattedCategoryData);
    toast.success("Category updated successfully!");
    return response.data;
  } catch (error) {
    console.error("Error updating category:", error);
    toast.error(error.response?.data?.error || "Failed to update category");
    throw error;
  }
};

// Function to delete a category
export const deleteCategory = async (categoryId) => {
  try {
    await axios.delete(`/api/admin/category/${categoryId}`);
    toast.success('Category deleted successfully!');
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    toast.error(error.response?.data?.message || 'Failed to delete category');
    throw error;
  }
};

// Hook for fetching users (for user management)
export const useUsers = (initialPage = 1, initialLimit = 10) => {
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/users?page=${pagination.page}&limit=${pagination.limit}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000
    }
  );

  // Process the data to ensure proper avatar URLs
  const users = data?.users ? data.users.map(user => ({
    ...user,
    avatar: user.avatar || "/images/avatar-placeholder.jpg"
  })) : [];

  // Update pagination from response
  useEffect(() => {
    if (data) {
      setPagination({
        page: data.page || pagination.page,
        limit: data.limit || pagination.limit,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      });
    }
  }, [data]);

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
    users,
    isLoading,
    isError: !!error,
    pagination,
    changePage,
    changeLimit,
    mutate,
    refetch: mutate
  };
};

// Function to update user
export const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(`/api/admin/users/${userId}`, userData);
    toast.success('User updated successfully!');
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    toast.error(error.response?.data?.message || 'Failed to update user');
    throw error;
  }
};

// Hook for fetching all orders (admin only)
export const useAllOrders = (initialPage = 1, initialLimit = 10, status = 'all') => {
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/orders?page=${pagination.page}&limit=${pagination.limit}&status=${status}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000
    }
  );

  // Process the data to ensure proper image URLs
  const orders = data?.orders ? data.orders.map(order => ({
    ...order,
    items: order.items.map(item => ({
      ...item,
      image: item.image || "/images/placeholder.jpg"
    })),
    userId: order.userId ? {
      ...order.userId,
      avatar: order.userId.avatar || "/images/avatar-placeholder.jpg"
    } : null
  })) : [];

  // Update pagination from response
  useEffect(() => {
    if (data) {
      setPagination({
        page: data.page || pagination.page,
        limit: data.limit || pagination.limit,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      });
    }
  }, [data]);

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
  
  // Function to update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.put(`/api/admin/orders/${orderId}/status`, { 
        status: newStatus 
      });
      
      // Update local state immediately
      await mutate();
      
      toast.success('Order status updated successfully!');
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      //toast.error('Failed to update order status');
      throw error;
    }
  };
  
  // Function to delete an order
  const deleteOrder = async (orderId) => {
    try {
      await axios.delete(`/api/admin/orders/${orderId}`);
      
      // Update local state
      mutate();
      
      toast.success('Order deleted successfully!');
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
      throw error;
    }
  };

  return {
    orders,
    isLoading,
    isError: !!error,
    pagination,
    changePage,
    changeLimit,
    status,
    updateOrderStatus,
    deleteOrder,
    mutate,
    refetch: mutate
  };
};
