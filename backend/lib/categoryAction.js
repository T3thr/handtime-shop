"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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
