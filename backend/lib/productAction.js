import useSWR from 'swr';
import axios from 'axios';

const fetcher = (url) => axios.get(url).then((res) => res.data);

export const useProducts = () => {
  const { data, error, mutate } = useSWR('/api/products', fetcher, {
    revalidateOnFocus: true, // Revalidate when the tab regains focus
    revalidateOnReconnect: true,
    refreshInterval: 5000, // Refresh every 5 seconds
    dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
  });

  return {
    products: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
};

export const addProduct = async (productData) => {
  try {
    const response = await axios.post('/api/admin/product/add', productData);
    // Trigger revalidation of products after adding
    await axios.get('/api/products'); // Optional: Pre-fetch to update cache
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to add product');
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const response = await axios.put(`/api/admin/product/${productId}`, productData);
    // Trigger revalidation of products after updating
    await axios.get('/api/products'); // Optional: Pre-fetch to update cache
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update product');
  }
};

export const deleteProduct = async (productId) => {
  try {
    const response = await axios.delete(`/api/admin/product/${productId}`);
    // Trigger revalidation of products after deleting
    await axios.get('/api/products'); // Optional: Pre-fetch to update cache
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete product');
  }
};