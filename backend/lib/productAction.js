import useSWR from 'swr';
import axios from 'axios';

const fetcher = (url) => axios.get(url).then((res) => res.data);

export const useProducts = () => {
  const { data, error, mutate } = useSWR('/api/products', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 60000, // Refresh every minute
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
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to add product');
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const response = await axios.put(`/api/admin/product/${productId}`, productData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update product');
  }
};

export const deleteProduct = async (productId) => {
  try {
    const response = await axios.delete(`/api/admin/product/${productId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete product');
  }
};
