import { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { toast } from 'react-toastify';

// Fetcher function for SWR
const fetcher = url => axios.get(url).then(res => res.data);

// Custom hook for fetching products with pagination, error handling, and real-time updates
export const useProducts = (initialPage = 1, initialLimit = 50) => {
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/products?page=${pagination.page}&limit=${pagination.limit}`,
    fetcher,
    {
      revalidateOnFocus: false, // Avoid revalidating on window focus
      revalidateOnReconnect: true, // Revalidate on network reconnect
      dedupingInterval: 10000, // Prevent duplicate requests within 10 seconds
      refreshInterval: 30000, // Poll every 30 seconds for updates
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Retry on error, up to 3 times, with exponential backoff
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount: retryCount + 1 }), 5000 * (retryCount + 1));
      },
    }
  );

  // Process the data to ensure proper image URLs and numeric fields
  const products = data?.products?.map(product => ({
    ...product,
    price: Number(product.price),
    quantity: Number(product.quantity),
    averageRating: Number(product.averageRating || 0),
    reviewCount: Number(product.reviewCount || 0),
    images: Array.isArray(product.images)
      ? product.images.map(image => ({
          ...image,
          url: image.url || '/images/placeholder.jpg',
        }))
      : [],
  })) || [];

  // Update pagination from response
  useEffect(() => {
    if (data) {
      setPagination({
        page: data.page || pagination.page,
        limit: data.limit || pagination.limit,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      });
    }
  }, [data]);

  // Change page
  const changePage = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  // Change limit
  const changeLimit = (newLimit) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1, // Reset to first page when changing limit
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
    mutate,
    refetch: refetchProducts,
  };
};

// Hook for fetching a single product by ID
export const useProduct = (productId) => {
  const { data, error, isLoading, mutate } = useSWR(
    productId ? `/api/products/${productId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount: retryCount + 1 }), 5000 * (retryCount + 1));
      },
    }
  );

  // Process the data to ensure proper image URLs and numeric fields
  const product = data
    ? {
        ...data,
        price: Number(data.price),
        quantity: Number(data.quantity),
        averageRating: Number(data.averageRating || 0),
        reviewCount: Number(data.reviewCount || 0),
        images: Array.isArray(data.images)
          ? data.images.map(image => ({
              ...image,
              url: image.url || '/images/placeholder.jpg',
            }))
          : [],
      }
    : null;

  return {
    product,
    isLoading,
    isError: !!error,
    mutate,
    refetch: mutate,
  };
};

// Function to add a new product
export const addProduct = async (productData) => {
  try {
    const formattedProductData = {
      ...productData,
      images: Array.isArray(productData.images) ? productData.images.filter(img => img && img.url) : [],
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
    const formattedProductData = {
      ...productData,
      images: Array.isArray(productData.images) ? productData.images.filter(img => img && img.url) : [],
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