'use client';

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
  if (!reviewData?.productId) {
    throw new Error('Product ID is missing');
  }
  if (!reviewData?.orderId) {
    throw new Error('Order ID is missing');
  }
  if (!reviewData?.rating || reviewData.rating < 1 || reviewData.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  try {
    const response = await axios.post('/api/review', reviewData);
    return response.data.review;
  } catch (error) {
    console.error('Error submitting review:', error);
    const status = error.response?.status;
    const serverError = error.response?.data?.error;
    let message = 'Failed to submit review';

    if (status === 400) {
      message = serverError || 'Invalid review data';
    } else if (status === 401) {
      message = 'Please log in to submit a review';
    } else if (status === 404) {
      message = serverError || 'Product or order not found';
    } else if (status === 500) {
      message = 'Server error, please try again later';
    }

    throw new Error(message);
  }
};

export const updateReview = async (reviewId, reviewData) => {
  try {
    const response = await axios.put(`/api/review/${reviewId}`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error updating review:', error);
    const message = error.response?.data?.message || 'Failed to update review';
    throw new Error(message);
  }
};

export const deleteReview = async (reviewId) => {
  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  if (!reviewId || !isValidObjectId(reviewId)) {
    throw new Error('Invalid review ID');
  }

  try {
    await axios.delete(`/api/review/${reviewId}`);
    toast.success('Review deleted successfully!');
    return true;
  } catch (error) {
    console.error('Error deleting review:', error);
    const status = error.response?.status;
    const serverError = error.response?.data?.error;
    let message = 'Failed to delete review';

    if (status === 401) {
      message = 'Please log in to delete the review';
    } else if (status === 403) {
      message = 'You are not authorized to delete this review';
    } else if (status === 404) {
      message = 'Review not found';
    } else if (status === 500) {
      message = 'Server error, please try again later';
    }

    toast.error(message);
    throw new Error(message);
  }
};

export const updateReviewStatus = async (reviewId, status) => {
  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  if (!reviewId || !isValidObjectId(reviewId)) {
    throw new Error('Invalid review ID');
  }
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new Error('Invalid status');
  }

  try {
    const response = await axios.put(`/api/admin/reviews/${reviewId}/status`, { status });
    toast.success('Review status updated successfully!');
    return response.data;
  } catch (error) {
    console.error('Error updating review status:', error);
    const statusCode = error.response?.status;
    const serverError = error.response?.data?.error;
    let message = 'Failed to update review status';

    if (statusCode === 401) {
      message = 'Please log in to update review status';
    } else if (statusCode === 403) {
      message = 'You are not authorized to update review status';
    } else if (statusCode === 404) {
      message = 'Review not found';
    } else if (statusCode === 500) {
      message = 'Server error, please try again later';
    }

    toast.error(message);
    throw new Error(message);
  }
};

export const useReviews = useProductReviews;