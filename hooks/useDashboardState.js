"use client";

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';

// SWR fetcher function
const fetcher = async (url) => {
  const response = await axios.get(url);
  return response.data;
};

// Custom hook for managing active dashboard section
export const useActiveSection = () => {
  // Use localStorage to persist active section between page refreshes
  const [state, setState] = useState({ activeSection: "overview" });

  // Load saved section from localStorage on component mount
  useEffect(() => {
    const savedSection = localStorage.getItem('dashboardActiveSection');
    if (savedSection) {
      setState({ activeSection: savedSection });
    }
  }, []);

  // Save section to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dashboardActiveSection', state.activeSection);
  }, [state.activeSection]);

  return [state, setState];
};

// Custom hook for fetching products with SWR
export const useSWRProducts = (page = 1, limit = 50) => {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/products?page=${page}&limit=${limit}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0
    }
  );

  return {
    products: data?.products || [],
    pagination: {
      page: data?.page || page,
      limit: data?.limit || limit,
      total: data?.total || 0,
      totalPages: data?.totalPages || 0
    },
    isLoading,
    isError: error,
    mutate
  };
};

// Custom hook for fetching categories with SWR
export const useSWRCategories = () => {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/category',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0
    }
  );

  return {
    categories: data || [],
    isLoading,
    isError: error,
    mutate
  };
};

// Global function to refresh all dashboard data
export const refreshDashboardData = () => {
  // Refresh products data
  mutate((key) => typeof key === 'string' && key.startsWith('/api/products'));
  
  // Refresh categories data
  mutate('/api/category');
};
