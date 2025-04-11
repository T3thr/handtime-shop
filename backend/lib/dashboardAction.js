"use client";

import { useState, useEffect } from 'react';
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
        
        // Ensure we have proper image URLs for products
        const productsWithImages = response.data.products.map(product => ({
          ...product,
          images: product.images.map(image => ({
            ...image,
            url: image.url || "/images/placeholder.jpg"
          }))
        }));
        
        setProducts(productsWithImages || []);
        setPagination({
          page: response.data.page || pagination.page,
          limit: response.data.limit || pagination.limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        });
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsError(true);
        //toast.error('Failed to load products. Please try again.');
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
        
        // Ensure we have proper image URLs
        const productWithImages = {
          ...response.data,
          images: response.data.images.map(image => ({
            ...image,
            url: image.url || "/images/placeholder.jpg"
          }))
        };
        
        setProduct(productWithImages);
      } catch (error) {
        console.error('Error fetching product:', error);
        setIsError(true);
        //toast.error('Failed to load product details. Please try again.');
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
    const response = await axios.put(`/api/admin/product/${productId}`, productData);
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
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const response = await axios.get('/api/category');
      
      // Ensure we have proper image URLs for categories
      const categoriesWithImages = response.data.map(category => ({
        ...category,
        image: category.image ? {
          ...category.image,
          url: category.image.url || "/images/placeholder.jpg"
        } : null
      }));
      
      setCategories(categoriesWithImages || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setIsError(true);
      toast.error('Failed to load categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    isLoading,
    isError,
    refetch: fetchCategories
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
export const deleteCategory = async (categoryId) => {
  try {
    await axios.delete('/api/admin/category', {
      data: { _id: categoryId }
    });
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
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const response = await axios.get(`/api/admin/users?page=${pagination.page}&limit=${pagination.limit}`);
        
        // Ensure we have proper avatar URLs
        const usersWithAvatars = response.data.users.map(user => ({
          ...user,
          avatar: user.avatar || "/images/avatar-placeholder.jpg"
        }));
        
        setUsers(usersWithAvatars || []);
        setPagination({
          page: response.data.page || pagination.page,
          limit: response.data.limit || pagination.limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        });
      } catch (error) {
        console.error('Error fetching users:', error);
        setIsError(true);
        toast.error('Failed to load users. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
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
    users,
    isLoading,
    isError,
    pagination,
    changePage,
    changeLimit
  };
};

// Hook for fetching all orders (admin only)
export const useAllOrders = (initialPage = 1, initialLimit = 10, status = 'all') => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    const fetchAllOrders = async () => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const response = await axios.get(`/api/admin/orders?page=${pagination.page}&limit=${pagination.limit}&status=${status}`);
        
        // Ensure we have proper image URLs for items and user avatars
        const ordersWithImages = response.data.orders.map(order => ({
          ...order,
          items: order.items.map(item => ({
            ...item,
            image: item.image || "/images/placeholder.jpg"
          })),
          userId: order.userId ? {
            ...order.userId,
            avatar: order.userId.avatar || "/images/avatar-placeholder.jpg"
          } : null
        }));
        
        setOrders(ordersWithImages || []);
        setPagination({
          page: response.data.page || pagination.page,
          limit: response.data.limit || pagination.limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        });
      } catch (error) {
        console.error('Error fetching all orders:', error);
        setIsError(true);
        //toast.error('Failed to load orders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllOrders();
  }, [pagination.page, pagination.limit, status]);

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
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } 
            : order
        )
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      throw error;
    }
  };
  
  // Function to delete an order
  const deleteOrder = async (orderId) => {
    try {
      await axios.delete(`/api/admin/orders/${orderId}`);
      
      // Update local state
      setOrders(prevOrders => prevOrders.filter(order => order.orderId !== orderId));
      
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
    isError,
    pagination,
    changePage,
    changeLimit,
    status,
    updateOrderStatus,
    deleteOrder
  };
};
