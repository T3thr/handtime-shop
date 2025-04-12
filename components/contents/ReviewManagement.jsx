"use client";
import React, { useState } from "react";
import { useAllReviews, updateReviewStatus, deleteReview } from "@/hooks/reviewHooks";
import { FaStar, FaRegStar, FaEdit, FaTrash, FaCheck, FaTimes, FaSortUp, FaSortDown } from "react-icons/fa";
import { toast } from "react-toastify";
import Image from "next/image";
import { motion } from "framer-motion";

export const ReviewManagement = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const { reviews, isLoading, isError, pagination, changePage, changeLimit, refetch } = useAllReviews(1, 10, statusFilter);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmStatusChange, setConfirmStatusChange] = useState(null);

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
      toast.success("Review deleted successfully");
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error("Failed to delete review");
    }
  };

  const handleStatusChange = async (reviewId, status) => {
    try {
      await updateReviewStatus(reviewId, status);
      setConfirmStatusChange(null);
      refetch();
      toast.success(`Review ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error("Failed to update review status:", error);
      toast.error("Failed to update review status");
    }
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

  if (isLoading) return <div className="text-center py-10">Loading reviews...</div>;
  if (isError) return <div className="text-center py-10 text-red-500">Failed to load reviews</div>;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Review Management</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="w-full sm:w-auto px-3 py-2 border rounded-md bg-background text-text-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Reviews</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            className="w-full sm:w-auto px-3 py-2 border rounded-md bg-background text-text-primary"
            value={pagination.limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-background border border-border-primary rounded-lg">
          <thead className="bg-background-secondary">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                User
              </th>
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
                Review {getSortIcon('title')}
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
                    <div className="h-10 w-10 flex-shrink-0 relative rounded-full overflow-hidden">
                      <Image
                        src={review.userId?.avatar || "/images/avatar-placeholder.jpg"}
                        alt={review.userId?.name || "User"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-text-primary">{review.userId?.name || "User"}</div>
                      <div className="text-xs text-text-secondary">{review.userId?.email || "N/A"}</div>
                    </div>
                  </div>
                </td>
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
                <td className="px-4 sm:px-6 py-4">
                  <div className="text-sm font-medium text-text-primary">{review.title || "No title"}</div>
                  <div className="text-xs text-text-secondary line-clamp-2">{review.comment || "No comment"}</div>
                  {review.images && review.images.length > 0 && (
                    <div className="flex mt-1 space-x-1">
                      {review.images.map((image, index) => (
                        <div key={index} className="h-6 w-6 relative rounded-md overflow-hidden">
                          <Image
                            src={image}
                            alt={`Review image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
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
                  {review.status === "pending" && (
                    <>
                      <button
                        onClick={() => setConfirmStatusChange({ id: review._id, status: "approved" })}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        <FaCheck className="inline" /> Approve
                      </button>
                      <button
                        onClick={() => setConfirmStatusChange({ id: review._id, status: "rejected" })}
                        className="text-red-600 hover:text-red-900 mr-2"
                      >
                        <FaTimes className="inline" /> Reject
                      </button>
                    </>
                  )}
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-4">
        <div className="text-sm text-text-secondary">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reviews
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => changePage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={`px-3 py-1 rounded-md ${
              pagination.page === 1
                ? "bg-background-secondary text-text-secondary cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-hover"
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => changePage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className={`px-3 py-1 rounded-md ${
              pagination.page === pagination.totalPages
                ? "bg-background-secondary text-text-secondary cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-hover"
            }`}
          >
            Next
          </button>
        </div>
      </div>

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

      {/* Confirm Status Change Modal */}
      {confirmStatusChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold mb-4">
              Confirm {confirmStatusChange.status === "approved" ? "Approval" : "Rejection"}
            </h3>
            <p className="mb-6">
              Are you sure you want to {confirmStatusChange.status === "approved" ? "approve" : "reject"} this review?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmStatusChange(null)}
                className="px-4 py-2 border border-border-primary rounded-md hover:bg-background-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(confirmStatusChange.id, confirmStatusChange.status)}
                className={`px-4 py-2 ${
                  confirmStatusChange.status === "approved" ? "bg-green-600" : "bg-red-600"
                } text-white rounded-md hover:${
                  confirmStatusChange.status === "approved" ? "bg-green-700" : "bg-red-700"
                }`}
              >
                {confirmStatusChange.status === "approved" ? "Approve" : "Reject"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;
