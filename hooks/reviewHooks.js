"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { toast } from 'react-toastify';

const fetcher = (url) => axios.get(url).then((res) => res.data);

export const useProductReviews = (productId, page = 1, limit = 5) => {
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    totalPages: 0,
  });

  const { data, error, isLoading, mutate } = useSWR(
    productId
      ? `/api/review?productId=${productId}&page=${pagination.page}&limit=${pagination.limit}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      errorRetryCount: 2,
    }
  );

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
    reviews: data?.reviews || [],
    averageRating: data?.averageRating || 0,
    ratingCounts: data?.ratingCounts || {},
    isLoading,
    isError: !!error,
    pagination,
    changePage,
    changeLimit,
    refetch: mutate,
  };
};

export const useUserReviews = (page = 1, limit = 5) => {
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    totalPages: 0,
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/review?page=${pagination.page}&limit=${pagination.limit}&userOnly=true`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      errorRetryCount: 2,
    }
  );

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
    reviews: data?.reviews || [],
    isLoading,
    isError: !!error,
    pagination,
    changePage,
    changeLimit,
    refetch: mutate,
  };
};

export const useAllReviews = (page = 1, limit = 10, status = 'all') => {
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    totalPages: 0,
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/reviews?page=${pagination.page}&limit=${pagination.limit}&status=${status}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      errorRetryCount: 2,
    }
  );

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
    reviews: data?.reviews || [],
    isLoading,
    isError: !!error,
    pagination,
    changePage,
    changeLimit,
    refetch: mutate,
  };
};

export const submitReview = async (reviewData) => {
  try {
    const response = await axios.post('/api/review', reviewData);
    return response.data;
  } catch (error) {
    console.error('Error submitting review:', error);
    const message = error.response?.data?.message || error.message || 'Failed to submit review';
    throw new Error(message);
  }
};

export const updateReview = async (reviewId, reviewData) => {
  try {
    const response = await axios.put(`/api/review/${reviewId}`, reviewData);
    toast.success('Review updated successfully!');
    return response.data;
  } catch (error) {
    console.error('Error updating review:', error);
    const message = error.response?.data?.message || 'Failed to update review';
    toast.error(message);
    throw new Error(message);
  }
};

export const deleteReview = async (reviewId) => {
  try {
    await axios.delete(`/api/review/${reviewId}`);
    toast.success('Review deleted successfully!');
    return true;
  } catch (error) {
    console.error('Error deleting review:', error);
    const message = error.response?.data?.message || 'Failed to delete review';
    toast.error(message);
    throw new Error(message);
  }
};

export const updateReviewStatus = async (reviewId, status) => {
  try {
    const response = await axios.put(`/api/admin/reviews/${reviewId}/status`, { status });
    toast.success('Review status updated successfully!');
    return response.data;
  } catch (error) {
    console.error('Error updating review status:', error);
    const message = error.response?.data?.message || 'Failed to update review status';
    toast.error(message);
    throw new Error(message);
  }
};

export const useReviews = useProductReviews;