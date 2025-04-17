"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const useUserData = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const response = await axios.get("/api/user");
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsError(true);
        toast.error("Failed to load user data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return {
    userData,
    isLoading,
    isError,
  };
};

export const useOrders = (initialPage = 1, initialLimit = 10) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const response = await axios.get(
        `/api/orders/get?page=${pagination.page}&limit=${pagination.limit}`
      );
      setOrders(response.data.orders || []);
      setPagination({
        page: response.data.page || initialPage,
        limit: response.data.limit || initialLimit,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 0,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      setIsError(true);
      //toast.error("Failed to load orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, initialPage, initialLimit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const changePage = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const changeLimit = (newLimit) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  const refetchOrders = async () => {
    await fetchOrders();
  };

  return {
    orders,
    isLoading,
    isError,
    pagination,
    changePage,
    changeLimit,
    refetchOrders,
  };
};

export const useAllOrders = (initialPage = 1, initialLimit = 10, status = "all") => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const fetchAllOrders = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const response = await axios.get(
          `/api/admin/orders?page=${pagination.page}&limit=${pagination.limit}&status=${status}`
        );
        setOrders(response.data.orders || []);
        setPagination({
          page: response.data.page || pagination.page,
          limit: response.data.limit || pagination.limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0,
        });
      } catch (error) {
        console.error("Error fetching all orders:", error);
        setIsError(true);
        //toast.error("Failed to load orders. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllOrders();
  }, [pagination.page, pagination.limit, status]);

  const changePage = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const changeLimit = (newLimit) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success("Order status updated successfully");
      return response.data;
    } catch (error) {
      console.error("Error updating order status:", error);
      //toast.error("Failed to update order status");
      throw error;
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const response = await axios.delete(`/api/admin/orders/${orderId}`);
      setOrders((prevOrders) => prevOrders.filter((order) => order.orderId !== orderId));
      toast.success("Order deleted successfully");
      return response.data;
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
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
    deleteOrder,
  };
};

export const useWishlist = (initialPage = 1, initialLimit = 10) => {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  useEffect(() => {
    const fetchWishlist = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const response = await axios.get(
          `/api/wishlist?page=${pagination.page}&limit=${pagination.limit}`
        );
        const wishlistItems = response.data.wishlist || [];
        const processedWishlist = await Promise.all(
          wishlistItems.map(async (item) => {
            if (!item.productId || !isValidObjectId(item.productId)) {
              console.warn(`Invalid productId: ${item.productId}`);
              return null;
            }

            try {
              const productResponse = await axios.get(`/api/products/${item.productId}`);
              const product = productResponse.data;
              if (!product._id) {
                console.warn(`Product missing _id: ${item.productId}`);
                return null;
              }
              return {
                productId: item.productId,
                _id: product._id,
                name: product.name,
                price: product.price,
                description: product.description,
                shortDescription: product.shortDescription || product.description,
                images: product.images && product.images.length > 0 ? product.images : [{ url: "/images/placeholder.jpg" }],
                categories: product.categories && product.categories.length > 0 ? product.categories : [],
                quantity: product.quantity || 0,
                continueSellingWhenOutOfStock: product.continueSellingWhenOutOfStock || false,
                averageRating: product.averageRating || 0,
                reviewCount: product.reviewCount || 0,
                status: product.status,
                addedAt: item.addedAt,
              };
            } catch (error) {
              console.error(`Error fetching product ${item.productId}:`, error);
              return null;
            }
          })
        );
        const validWishlist = processedWishlist.filter((item) => item !== null);
        setWishlist(validWishlist);
        setPagination({
          page: response.data.page || pagination.page,
          limit: response.data.limit || pagination.limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0,
        });
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        setIsError(true);
        toast.error("Failed to load wishlist. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, [pagination.page, pagination.limit]);

  const changePage = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const changeLimit = (newLimit) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  const toggleWishlistItem = async (productId) => {
    if (!isValidObjectId(productId)) {
      console.error("Invalid productId for toggle:", productId);
      toast.error("Cannot update wishlist: Invalid product");
      return;
    }

    try {
      const response = await axios.post("/api/wishlist", {
        productId,
        action: "toggle",
      });
      if (response.data.message === "Added to wishlist") {
        const refreshResponse = await axios.get(
          `/api/wishlist?page=${pagination.page}&limit=${pagination.limit}`
        );
        const wishlistItems = refreshResponse.data.wishlist || [];
        const processedWishlist = await Promise.all(
          wishlistItems.map(async (item) => {
            if (!item.productId || !isValidObjectId(item.productId)) {
              console.warn(`Invalid productId: ${item.productId}`);
              return null;
            }

            try {
              const productResponse = await axios.get(`/api/products/${item.productId}`);
              const product = productResponse.data;
              if (!product._id) {
                console.warn(`Product missing _id: ${item.productId}`);
                return null;
              }
              return {
                productId: item.productId,
                _id: product._id,
                name: product.name,
                price: product.price,
                description: product.description,
                shortDescription: product.shortDescription || product.description,
                images: product.images && product.images.length > 0 ? product.images : [{ url: "/images/placeholder.jpg" }],
                categories: product.categories && product.categories.length > 0 ? product.categories : [],
                quantity: product.quantity || 0,
                continueSellingWhenOutOfStock: product.continueSellingWhenOutOfStock || false,
                averageRating: product.averageRating || 0,
                reviewCount: product.reviewCount || 0,
                status: product.status,
                addedAt: item.addedAt,
              };
            } catch (error) {
              console.error(`Error fetching product ${item.productId}:`, error);
              return null;
            }
          })
        );
        const validWishlist = processedWishlist.filter((item) => item !== null);
        setWishlist(validWishlist);
        setPagination({
          page: refreshResponse.data.page || pagination.page,
          limit: refreshResponse.data.limit || pagination.limit,
          total: refreshResponse.data.total || 0,
          totalPages: refreshResponse.data.totalPages || 0,
        });
        toast.success("Added to wishlist");
      } else {
        setWishlist((prev) => prev.filter((item) => item._id !== productId));
        toast.success("Removed from wishlist");
      }
      return response.data;
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error("Failed to update wishlist");
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
    toggleWishlistItem,
  };
};

export const useUsers = (initialPage = 1, initialLimit = 10) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const response = await axios.get(
          `/api/admin/users?page=${pagination.page}&limit=${pagination.limit}`
        );
        setUsers(response.data.users || []);
        setPagination({
          page: response.data.page || pagination.page,
          limit: response.data.limit || pagination.limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0,
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        setIsError(true);
        toast.error("Failed to load users. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [pagination.page, pagination.limit]);

  const changePage = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const changeLimit = (newLimit) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  return {
    users,
    isLoading,
    isError,
    pagination,
    changePage,
    changeLimit,
  };
};