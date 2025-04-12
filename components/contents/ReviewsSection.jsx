"use client";
import React, { useState } from "react";
import { useUserReviews } from "@/hooks/reviewHooks";
import {
  SectionHeader,
  Card,
  LoadingSpinner,
  EmptyState,
  Pagination,
} from "@/components/contents/DashboardUI";
import { FaStar, FaRegStar, FaEdit, FaTrash, FaSortUp, FaSortDown } from "react-icons/fa";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { deleteReview } from "@/hooks/reviewHooks";

export const ReviewsSection = ({ session }) => {
  const { reviews, isLoading, isError, pagination, changePage, refetch } = useUserReviews();
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load reviews</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />;
  };

  const sortedReviews = React.useMemo(() => {
    let sortableReviews = [...(reviews || [])];
    if (sortConfig.key && sortConfig.direction) {
      sortableReviews.sort((a, b) => {
        if (sortConfig.key === 'createdAt') {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          
          if (sortConfig.direction === 'ascending') {
            return dateA - dateB;
          }
          return dateB - dateA;
        } else if (sortConfig.key === 'rating') {
          if (sortConfig.direction === 'ascending') {
            return a.rating - b.rating;
          }
          return b.rating - a.rating;
        } else {
          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableReviews;
  }, [reviews, sortConfig]);

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      setConfirmDelete(null);
      refetch();
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error("Failed to delete review");
    }
  };

  const handleEditReview = (reviewId) => {
    router.push(`/review/${reviewId}`);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-yellow-400">
            {star <= rating ? <FaStar /> : <FaRegStar />}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <SectionHeader title="Your Reviews" />
      <Card>
        {reviews?.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-background border border-border-primary rounded-lg">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Product
                    </th>
                    <th 
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('rating')}
                    >
                      Rating {getSortIcon('rating')}
                    </th>
                    <th 
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('title')}
                    >
                      Title {getSortIcon('title')}
                    </th>
                    <th 
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('createdAt')}
                    >
                      Date {getSortIcon('createdAt')}
                    </th>
                    <th 
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('status')}
                    >
                      Status {getSortIcon('status')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {sortedReviews.map((review) => (
                    <tr key={review._id} className="hover:bg-background-hover transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 relative rounded-md overflow-hidden">
                            <Image
                              src={review.productId?.images?.[0]?.url || "/images/placeholder.jpg"}
                              alt={review.productId?.name || "Product"}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-text-primary">{review.productId?.name || "Product"}</div>
                            <div className="text-xs text-text-secondary">Order #{review.orderId?.substring(0, 8) || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {renderStars(review.rating)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {review.title || "No title"}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            review.status === "approved" 
                              ? "bg-green-100 text-green-800" 
                              : review.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {review.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditReview(review._id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <FaEdit className="inline" /> Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete(review._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash className="inline" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={changePage}
            />
          </>
        ) : (
          <EmptyState
            icon={FaStar}
            title="No Reviews Yet"
            description="You haven't submitted any product reviews yet. Reviews will appear here after you review purchased products."
            actionText="Browse Orders"
            onAction={() => router.push("/dashboard/orders")}
          />
        )}
      </Card>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this review? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-border-primary rounded-md hover:bg-background-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteReview(confirmDelete)}
                className="px-4 py-2 bg-error text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ReviewsSection;
