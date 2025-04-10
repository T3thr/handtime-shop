"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Custom hook for fetching user data with proper error handling and loading states
export const useUserData = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const response = await axios.get('/api/user');
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsError(true);
        toast.error('Failed to load user data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return {
    userData,
    isLoading,
    isError
  };
};

// Custom hook for fetching user's orders with proper error handling and loading states
export const useOrders = (initialPage = 1, initialLimit = 10) => {
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
    const fetchOrders = async () => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const response = await axios.get(`/api/orders/get?page=${pagination.page}&limit=${pagination.limit}`);
        setOrders(response.data.orders || []);
        setPagination({
          page: response.data.page || pagination.page,
          limit: response.data.limit || pagination.limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        });
      } catch (error) {
        console.error('Error fetching orders:', error);
        setIsError(true);
        toast.error('Failed to load orders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
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
    orders,
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
        setOrders(response.data.orders || []);
        setPagination({
          page: response.data.page || pagination.page,
          limit: response.data.limit || pagination.limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        });
      } catch (error) {
        console.error('Error fetching all orders:', error);
        setIsError(true);
        toast.error('Failed to load orders. Please try again.');
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
      const response = await axios.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      toast.success('Order status updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      throw error;
    }
  };

  // Function to delete order
  const deleteOrder = async (orderId) => {
    try {
      const response = await axios.delete(`/api/admin/orders/${orderId}`);
      
      // Update local state
      setOrders(prevOrders => prevOrders.filter(order => order.orderId !== orderId));
      
      toast.success('Order deleted successfully');
      return response.data;
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

// Hook for fetching wishlist items
export const useWishlist = (initialPage = 1, initialLimit = 10) => {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    const fetchWishlist = async () => {
      setIsLoading(true);
      setIsError(false);
      
      try {
        const response = await axios.get(`/api/wishlist?page=${pagination.page}&limit=${pagination.limit}`);
        
        // Process wishlist items to include product details
        const wishlistItems = response.data.wishlist || [];
        
        // Fetch product details for each wishlist item
        const processedWishlist = await Promise.all(
          wishlistItems.map(async (item) => {
            try {
              const productResponse = await axios.get(`/api/products/${item.productId}`);
              const product = productResponse.data;
              
              return {
                productId: item.productId,
                name: product.name,
                price: product.price,
                description: product.description,
                image: product.images && product.images.length > 0 ? product.images[0].url : null,
                category: product.categories && product.categories.length > 0 ? product.categories[0] : '',
                status: product.status,
                addedAt: item.addedAt
              };
            } catch (error) {
              console.error(`Error fetching product ${item.productId}:`, error);
              return {
                productId: item.productId,
                name: 'Product not available',
                price: 0,
                description: '',
                image: null,
                category: '',
                status: 'inactive',
                addedAt: item.addedAt
              };
            }
          })
        );
        
        setWishlist(processedWishlist);
        setPagination({
          page: response.data.page || pagination.page,
          limit: response.data.limit || pagination.limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        });
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        setIsError(true);
        toast.error('Failed to load wishlist. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
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

  // Function to add/remove from wishlist
  const toggleWishlistItem = async (productId) => {
    try {
      const response = await axios.post('/api/wishlist', { 
        productId, 
        action: 'toggle' 
      });
      
      // Update local state based on the action performed
      if (response.data.message === 'Added to wishlist') {
        // Refresh wishlist data
        const refreshResponse = await axios.get(`/api/wishlist?page=${pagination.page}&limit=${pagination.limit}`);
        
        // Process new wishlist items
        const wishlistItems = refreshResponse.data.wishlist || [];
        const processedWishlist = await Promise.all(
          wishlistItems.map(async (item) => {
            try {
              const productResponse = await axios.get(`/api/products/${item.productId}`);
              const product = productResponse.data;
              
              return {
                productId: item.productId,
                name: product.name,
                price: product.price,
                description: product.description,
                image: product.images && product.images.length > 0 ? product.images[0].url : null,
                category: product.categories && product.categories.length > 0 ? product.categories[0] : '',
                status: product.status,
                addedAt: item.addedAt
              };
            } catch (error) {
              console.error(`Error fetching product ${item.productId}:`, error);
              return {
                productId: item.productId,
                name: 'Product not available',
                price: 0,
                description: '',
                image: null,
                category: '',
                status: 'inactive',
                addedAt: item.addedAt
              };
            }
          })
        );
        
        setWishlist(processedWishlist);
        setPagination({
          page: refreshResponse.data.page || pagination.page,
          limit: refreshResponse.data.limit || pagination.limit,
          total: refreshResponse.data.total || 0,
          totalPages: refreshResponse.data.totalPages || 0
        });
        toast.success('Added to wishlist');
      } else {
        // Remove from local state
        setWishlist(prev => prev.filter(item => item.productId !== productId));
        toast.success('Removed from wishlist');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist');
      throw error;
    }
  };

  return {
    wishlist,
    isLoading,
    isError,
    pagination,
    changePage,
    changeLimit,
    toggleWishlistItem
  };
};

// Hook for fetching users (admin only)
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
        setUsers(response.data.users || []);
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
