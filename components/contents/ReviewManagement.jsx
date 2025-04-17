"use client";
import React, { useState } from "react";
import { useAllReviews, updateReviewStatus, deleteReview } from "@/hooks/reviewHooks";
import { FaStar, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import Image from "next/image";
import { motion } from "framer-motion";
import { DataTable, Card, Pagination, SectionHeader, EmptyState } from "@/components/contents/DashboardUI";

export const ReviewManagement = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const { reviews, isLoading, isError, pagination, changePage, changeLimit, refetch } = useAllReviews(1, 10, statusFilter);

  const handleUpdateStatus = async (reviewId, newStatus) => {
    try {
      // Optimistically update the review status in the UI
      const previousReviews = reviews;
      const updatedReviews = reviews.map((review) =>
        review._id === reviewId ? { ...review, status: newStatus } : review
      );

      // Update the SWR cache optimistically
      refetch(
        async () => {
          await updateReviewStatus(reviewId, newStatus, refetch);
          return { reviews: updatedReviews, page: pagination.page, limit: pagination.limit, total: pagination.total, totalPages: pagination.totalPages };
        },
        {
          optimisticData: { reviews: updatedReviews, page: pagination.page, limit: pagination.limit, total: pagination.total, totalPages: pagination.totalPages },
          rollbackOnError: true,
        }
      );

      toast.success(`Review status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update review status:", error);
      toast.error("Failed to update review status");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      // Optimistically remove the review from the UI
      const previousReviews = reviews;
      const updatedReviews = reviews.filter((review) => review._id !== reviewId);

      // Update the SWR cache optimistically
      refetch(
        async () => {
          await deleteReview(reviewId, refetch);
          return { reviews: updatedReviews, page: pagination.page, limit: pagination.limit, total: pagination.total - 1, totalPages: Math.ceil((pagination.total - 1) / pagination.limit) };
        },
        {
          optimisticData: { reviews: updatedReviews, page: pagination.page, limit: pagination.limit, total: pagination.total - 1, totalPages: Math.ceil((pagination.total - 1) / pagination.limit) },
          rollbackOnError: true,
        }
      );

      toast.success("Review deleted successfully");
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error("Failed to delete review");
    }
  };

  const reviewColumns = [
    {
      header: "User",
      accessor: "userId",
      render: (row) => (
        <div className="flex items-center">
          <div className="h-8 w-8 flex-shrink-0 relative rounded-full overflow-hidden">
            <Image
              src={row.userId?.avatar || "/images/avatar-placeholder.jpg"}
              alt={row.userId?.name || "User"}
              fill
              className="object-cover"
            />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-text-primary">
              {row.userId?.name || "Unknown User"}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Product",
      accessor: "productId",
      render: (row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 relative rounded-md overflow-hidden">
            <Image
              src={row.productId?.images?.[0]?.url || "/images/placeholder.jpg"}
              alt={row.productId?.name || "Product"}
              fill
              className="object-cover"
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-text-primary">
              {row.productId?.name || "Unknown Product"}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Rating",
      accessor: "rating",
      render: (row) => (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              className={star <= row.rating ? "text-yellow-400" : "text-gray-300"}
              size={16}
            />
          ))}
        </div>
      ),
    },
    {
      header: "Review",
      accessor: "comment",
      render: (row) => (
        <div>
          {row.title && <div className="font-medium">{row.title}</div>}
          <div className="text-sm text-text-secondary line-clamp-2">{row.comment}</div>
          {row.images && row.images.length > 0 && (
            <div className="flex mt-1 space-x-1">
              {row.images.slice(0, 3).map((image, idx) => (
                <div key={idx} className="h-6 w-6 relative rounded overflow-hidden">
                  <Image src={image || "/images/placeholder.jpg"} alt={`Review image ${idx + 1}`} fill className="object-cover" />
                </div>
              ))}
              {row.images.length > 3 && (
                <div className="h-6 w-6 bg-background-secondary rounded flex items-center justify-center text-xs">
                  +{row.images.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            row.status === "show" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "createdAt",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleUpdateStatus(row._id, row.status === "show" ? "hide" : "show")}
            className={`text-sm ${
              row.status === "show" ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"
            }`}
          >
            {row.status === "show" ? "Hide" : "Show"}
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this review?")) {
                handleDeleteReview(row._id);
              }
            }}
            className="text-red-600 hover:text-red-900"
          >
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load reviews</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <SectionHeader title="Review Management" description="Manage user reviews for products" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="w-full sm:w-auto px-3 py-2 border rounded-md bg-background text-text-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Reviews</option>
            <option value="show">Show</option>
            <option value="hide">Hide</option>
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

      <Card>
        {reviews?.length > 0 ? (
          <>
            <DataTable
              columns={reviewColumns}
              data={reviews}
              keyField="_id"
              emptyMessage="No reviews found."
            />
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-text-secondary">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reviews
              </div>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={changePage}
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={FaStar}
            title="No Reviews Found"
            description="No reviews match the current filters."
            action={{
              label: "Clear Filters",
              onClick: () => setStatusFilter("all"),
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default ReviewManagement;