"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaUsers, FaShoppingCart, FaChartLine, FaEdit, FaTrash, FaStar , FaSortUp , FaSortDown } from "react-icons/fa";
import { useAllOrders, updateOrderStatus, deleteOrder, useUsers, updateUser } from "@/backend/lib/dashboardAction";
import { toast } from "react-toastify";
import Image from "next/image";
import AllOrderModal from "./AllOrderModal";
import { useAllReviews, updateReviewStatus, deleteReview } from "@/hooks/reviewHooks";

// User Management Component
export const UserManagement = () => {
  const { users, isLoading, isError, pagination, changePage, changeLimit, refetch: refetchUsers } = useUsers();
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(selectedUser._id, editForm);
      setIsEditModalOpen(false);
      refetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

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
    return (
      <span className="inline-flex flex-col ml-1">
        <FaSortUp 
          className={`h-3 w-3 ${sortConfig.key === key && sortConfig.direction === 'ascending' ? 'text-primary' : 'text-text-secondary opacity-30'}`} 
        />
        <FaSortDown 
          className={`h-3 w-3 -mt-1 ${sortConfig.key === key && sortConfig.direction === 'descending' ? 'text-primary' : 'text-text-secondary opacity-30'}`} 
        />
      </span>
    );
  };

  const sortedUsers = React.useMemo(() => {
    let sortableUsers = [...(users || [])];
    if (sortConfig.key && sortConfig.direction) {
      sortableUsers.sort((a, b) => {
        if (sortConfig.key === 'createdAt') {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          
          if (sortConfig.direction === 'ascending') {
            return dateA - dateB;
          }
          return dateB - dateA;
        } else if (sortConfig.key === 'lastLogin') {
          const dateA = a.lastLogin ? new Date(a.lastLogin) : new Date(0);
          const dateB = b.lastLogin ? new Date(b.lastLogin) : new Date(0);
          
          if (sortConfig.direction === 'ascending') {
            return dateA - dateB;
          }
          return dateB - dateA;
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
    return sortableUsers;
  }, [users, sortConfig]);

  if (isLoading) return <div className="text-center py-10">Loading users...</div>;
  if (isError) return <div className="text-center py-10 text-red-500">Failed to load users</div>;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>
        <div className="flex flex-col sm:flex-row gap-2">
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
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("name")}
              >
                User {getSortIcon("name")}
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("email")}
              >
                Email {getSortIcon("email")}
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("role")}
              >
                Role {getSortIcon("role")}
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("createdAt")}
              >
                Joined {getSortIcon("createdAt")}
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("lastLogin")}
              >
                Last Login {getSortIcon("lastLogin")}
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {sortedUsers.map((user) => (
              <tr key={user._id} className="hover:bg-background-hover transition-colors">
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 relative rounded-full overflow-hidden">
                      <Image
                        src={user.avatar || "/images/avatar-placeholder.jpg"}
                        alt={user.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-text-primary">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-primary">{user.email}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <FaEdit className="inline" /> Edit
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
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-background rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Edit User</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-text-secondary text-sm font-bold mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-text-secondary text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-text-secondary text-sm font-bold mb-2">Role</label>
                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-border-primary rounded-md hover:bg-background-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Order Management Component
export const OrderManagement = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const {
    orders,
    isLoading,
    isError,
    pagination,
    changePage,
    changeLimit,
    updateOrderStatus,
    deleteOrder,
    refetch: refetchOrders,
  } = useAllOrders(1, 10, statusFilter);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      refetchOrders();
    } catch (error) {
      throw error; // Let AllOrderModal handle the error
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteOrder(orderId);
      refetchOrders();
    } catch (error) {
      throw error; // Let AllOrderModal handle the error
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
    return (
      <span className="inline-flex flex-col ml-1">
        <FaSortUp 
          className={`h-3 w-3 ${sortConfig.key === key && sortConfig.direction === 'ascending' ? 'text-primary' : 'text-text-secondary opacity-30'}`} 
        />
        <FaSortDown 
          className={`h-3 w-3 -mt-1 ${sortConfig.key === key && sortConfig.direction === 'descending' ? 'text-primary' : 'text-text-secondary opacity-30'}`} 
        />
      </span>
    );
  };

  const sortedOrders = React.useMemo(() => {
    let sortableOrders = [...(orders || [])];
    if (sortConfig.key && sortConfig.direction) {
      sortableOrders.sort((a, b) => {
        if (sortConfig.key === 'createdAt') {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          
          if (sortConfig.direction === 'ascending') {
            return dateA - dateB;
          }
          return dateB - dateA;
        } else if (sortConfig.key === 'totalAmount') {
          if (sortConfig.direction === 'ascending') {
            return a.totalAmount - b.totalAmount;
          }
          return b.totalAmount - a.totalAmount;
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
    return sortableOrders;
  }, [orders, sortConfig]);

  if (isLoading) return <div className="text-center py-10">Loading orders...</div>;
  if (isError) return <div className="text-center py-10 text-red-500">Failed to load orders</div>;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Order Management</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="w-full sm:w-auto px-3 py-2 border rounded-md bg-background text-text-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
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
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("_id")}
              >
                Order ID {getSortIcon("_id")}
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
              >
                Customer
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("createdAt")}
              >
                Date {getSortIcon("createdAt")}
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("status")}
              >
                Status {getSortIcon("status")}
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("totalAmount")}
              >
                Total {getSortIcon("totalAmount")}
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {sortedOrders.map((order) => (
              <tr key={order._id} className="hover:bg-background-hover transition-colors">
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  {order._id.substring(0, 8)}...
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {order.userId && (
                      <>
                        <div className="h-10 w-10 flex-shrink-0 relative rounded-full overflow-hidden">
                          <Image
                            src={order.userId.avatar || "/images/avatar-placeholder.jpg"}
                            alt={order.userId.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-text-primary">{order.userId.name}</div>
                          <div className="text-sm text-text-secondary">{order.userId.email}</div>
                        </div>
                      </>
                    )}
                    {!order.userId && (
                      <div className="ml-4">
                        <div className="text-sm font-medium text-text-primary">Guest User</div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  ${order.totalAmount.toFixed(2)}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleViewOrder(order)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View
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
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
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

      {/* View Order Modal with AllOrderModal */}
      <AllOrderModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        order={selectedOrder}
        isAdmin={true}
        onUpdateStatus={handleUpdateStatus}
        onDeleteOrder={handleDeleteOrder}
      />
    </div>
  );
};

// Review Management Component
export const ReviewManagement = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const {
    reviews,
    isLoading,
    isError,
    pagination,
    changePage,
    changeLimit,
    updateReviewStatus,
    deleteReview,
    refetch: refetchReviews,
  } = useAllReviews(1, 10, statusFilter);

  const [selectedReview, setSelectedReview] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleDeleteClick = (review) => {
    setSelectedReview(review);
    setIsDeleteModalOpen(true);
  };

  const handleStatusClick = (review, status) => {
    setSelectedReview(review);
    setNewStatus(status);
    setIsStatusModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteReview(selectedReview._id);
      toast.success("Review deleted successfully");
      setIsDeleteModalOpen(false);
      refetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  const handleStatusConfirm = async () => {
    try {
      await updateReviewStatus(selectedReview._id, newStatus);
      toast.success(`Review ${newStatus} successfully`);
      setIsStatusModalOpen(false);
      refetchReviews();
    } catch (error) {
      console.error("Error updating review status:", error);
      toast.error("Failed to update review status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
    return (
      <span className="inline-flex flex-col ml-1">
        <FaSortUp 
          className={`h-3 w-3 ${sortConfig.key === key && sortConfig.direction === 'ascending' ? 'text-primary' : 'text-text-secondary opacity-30'}`} 
        />
        <FaSortDown 
          className={`h-3 w-3 -mt-1 ${sortConfig.key === key && sortConfig.direction === 'descending' ? 'text-primary' : 'text-text-secondary opacity-30'}`} 
        />
      </span>
    );
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
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("productId.name")}
              >
                Product {getSortIcon("productId.name")}
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("userId.name")}
              >
                Customer {getSortIcon("userId.name")}
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("rating")}
              >
                Rating {getSortIcon("rating")}
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
              >
                Review
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("status")}
              >
                Status {getSortIcon("status")}
              </th>
              <th 
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("createdAt")}
              >
                Date {getSortIcon("createdAt")}
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
                      <div className="text-sm font-medium text-text-primary">{review.productId?.name || "Unknown Product"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 flex-shrink-0 relative rounded-full overflow-hidden">
                      <Image
                        src={review.userId?.avatar || "/images/avatar-placeholder.jpg"}
                        alt={review.userId?.name || "User"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-text-primary">{review.userId?.name || "Anonymous"}</div>
                      <div className="text-xs text-text-secondary">{review.userId?.email || ""}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={i < review.rating ? "text-yellow-400" : "text-gray-300"}
                        size={16}
                      />
                    ))}
                    <span className="ml-1 text-text-primary">{review.rating}</span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="text-sm text-text-primary max-w-xs truncate">
                    {review.title && <span className="font-medium">{review.title}: </span>}
                    {review.comment}
                  </div>
                  {review.images && review.images.length > 0 && (
                    <div className="flex mt-1 space-x-1">
                      {review.images.slice(0, 3).map((image, idx) => (
                        <div key={idx} className="h-6 w-6 relative rounded overflow-hidden">
                          <Image src={image} alt={`Review image ${idx + 1}`} fill className="object-cover" />
                        </div>
                      ))}
                      {review.images.length > 3 && (
                        <div className="h-6 w-6 bg-background-secondary rounded flex items-center justify-center text-xs">
                          +{review.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      review.status
                    )}`}
                  >
                    {review.status}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {new Date(review.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {review.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatusClick(review, "approved")}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusClick(review, "rejected")}
                        className="text-red-600 hover:text-red-900 mr-2"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteClick(review)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash className="inline" />
                  </button>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 sm:px-6 py-4 text-center text-text-secondary">
                  No reviews found
                </td>
              </tr>
            )}
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-background rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Delete Review</h3>
            <p className="mb-4 text-text-secondary">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-border-primary rounded-md hover:bg-background-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-background rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg sm:text-xl font-bold mb-4">
              {newStatus === "approved" ? "Approve" : "Reject"} Review
            </h3>
            <p className="mb-4 text-text-secondary">
              Are you sure you want to {newStatus === "approved" ? "approve" : "reject"} this review?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 border border-border-primary rounded-md hover:bg-background-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusConfirm}
                className={`px-4 py-2 ${
                  newStatus === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                } text-white rounded-md`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Store Management Component
export const ManageStore = ({
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  products,
  categories,
  refetchProducts,
  refetchCategories,
}) => {
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Filter products based on search term
  const filteredProducts =
    products?.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Filter categories based on search term
  const filteredCategories =
    categories?.filter(
      (category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

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
    return (
      <span className="inline-flex flex-col ml-1">
        <FaSortUp 
          className={`h-3 w-3 ${sortConfig.key === key && sortConfig.direction === 'ascending' ? 'text-primary' : 'text-text-secondary opacity-30'}`} 
        />
        <FaSortDown 
          className={`h-3 w-3 -mt-1 ${sortConfig.key === key && sortConfig.direction === 'descending' ? 'text-primary' : 'text-text-secondary opacity-30'}`} 
        />
      </span>
    );
  };

  const sortedProducts = React.useMemo(() => {
    let sortableProducts = [...filteredProducts];
    if (sortConfig.key && sortConfig.direction) {
      sortableProducts.sort((a, b) => {
        if (sortConfig.key === 'price') {
          if (sortConfig.direction === 'ascending') {
            return a.price - b.price;
          }
          return b.price - a.price;
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
    return sortableProducts;
  }, [filteredProducts, sortConfig]);

  const sortedCategories = React.useMemo(() => {
    let sortableCategories = [...filteredCategories];
    if (sortConfig.key && sortConfig.direction) {
      sortableCategories.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableCategories;
  }, [filteredCategories, sortConfig]);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Store Management</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          {activeTab === "products" && (
            <button
              onClick={onAddProduct}
              className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
            >
              Add Product
            </button>
          )}
          {activeTab === "categories" && (
            <button
              onClick={onAddCategory}
              className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
            >
              Add Category
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-border-primary">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "products"
              ? "border-b-2 border-primary text-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "categories"
              ? "border-b-2 border-primary text-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-border-primary rounded-md bg-background text-text-primary"
        />
      </div>

      {activeTab === "products" && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-background border border-border-primary rounded-lg">
            <thead className="bg-background-secondary">
              <tr>
                <th 
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("name")}
                >
                  Product {getSortIcon("name")}
                </th>
                <th 
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("price")}
                >
                  Price {getSortIcon("price")}
                </th>
                <th 
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("status")}
                >
                  Status {getSortIcon("status")}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {sortedProducts.map((product) => (
                <tr key={product._id} className="hover:bg-background-hover transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 relative rounded-md overflow-hidden">
                        <Image
                          src={product.images?.[0]?.url || "/images/placeholder.jpg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-text-primary">{product.name}</div>
                        <div className="text-xs text-text-secondary">{product.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.status || "active"}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {product.categories?.map((cat) => cat.name || cat).join(", ") || "Uncategorized"}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onEditProduct(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <FaEdit className="inline" /> Edit
                    </button>
                    <button
                      onClick={() => onDeleteProduct(product._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 sm:px-6 py-4 text-center text-text-secondary">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-background border border-border-primary rounded-lg">
            <thead className="bg-background-secondary">
              <tr>
                <th 
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("name")}
                >
                  Category {getSortIcon("name")}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Description
                </th>
                <th 
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("priority")}
                >
                  Priority {getSortIcon("priority")}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {sortedCategories.map((category) => (
                <tr key={category._id} className="hover:bg-background-hover transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 relative rounded-md overflow-hidden">
                        <Image
                          src={category.image?.url || "/images/placeholder.jpg"}
                          alt={category.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-text-primary">{category.name}</div>
                        <div className="text-xs text-text-secondary">{category.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {category.description || "No description"}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        category.priority === "main" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {category.priority || "normal"}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onEditCategory(category)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <FaEdit className="inline" /> Edit
                    </button>
                    <button
                      onClick={() => onDeleteCategory(category._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedCategories.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-4 sm:px-6 py-4 text-center text-text-secondary">
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
