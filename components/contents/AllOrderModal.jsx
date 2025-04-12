"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaCheck, FaTimes, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";

const AllOrderModal = ({ isOpen, onClose, order, isAdmin = false, onUpdateStatus, onDeleteOrder }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  if (!isOpen || !order) return null;

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const handleStatusChange = async () => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }

    try {
      await onUpdateStatus(order._id, newStatus);
      setNewStatus("");
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await onDeleteOrder(order._id);
      toast.success("Order deleted successfully");
      onClose();
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast.error("Failed to delete order");
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 sm:px-6">
      <div className="bg-background rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-text-primary">Order Details</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        {/* Order Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div>
            <h4 className="font-semibold mb-2 text-text-secondary">Order Information</h4>
            <p>
              <span className="text-text-secondary">Order ID:</span> {order._id}
            </p>
            <p>
              <span className="text-text-secondary">Date:</span>{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
            <p>
              <span className="text-text-secondary">Status:</span>{" "}
              <span
                className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </p>
            <p>
              <span className="text-text-secondary">Payment Method:</span>{" "}
              {order.paymentMethod}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-text-secondary">Customer Information</h4>
            {order.userId ? (
              <div className="flex items-center mb-2">
                <div className="h-10 w-10 flex-shrink-0 relative rounded-full overflow-hidden">
                  <Image
                    src={order.userId.avatar || "/images/avatar-placeholder.jpg"}
                    alt={order.userId.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-text-primary">{order.userId.name}</p>
                  <p className="text-sm text-text-secondary">{order.userId.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-text-primary">Guest User</p>
            )}

            <h4 className="font-semibold mb-2 text-text-secondary mt-4">Shipping Address</h4>
            <p>{order.shippingAddress?.street}</p>
            <p>
              {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
              {order.shippingAddress?.zipCode}
            </p>
            <p>{order.shippingAddress?.country}</p>
          </div>
        </div>

        {/* Order Items */}
        <h4 className="font-semibold mb-2 text-text-secondary">Order Items</h4>
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-background border border-border-primary rounded-lg">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {order.items.map((item, index) => (
                <tr key={index} className="hover:bg-background-hover transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 relative rounded-md overflow-hidden">
                        <Image
                          src={item.image || "/images/placeholder.jpg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-text-primary">
                          {item.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-text-primary">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-text-primary">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-text-primary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="text-right mb-6">
          <p className="text-text-secondary">
            Subtotal: ${order.subtotal?.toFixed(2) || "0.00"}
          </p>
          <p className="text-text-secondary">
            Shipping: ${order.shippingCost?.toFixed(2) || "0.00"}
          </p>
          <p className="text-text-secondary">
            Tax: ${order.taxAmount?.toFixed(2) || "0.00"}
          </p>
          <p className="font-bold text-lg text-text-primary">
            Total: ${order.totalAmount.toFixed(2)}
          </p>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="border-t border-border-primary pt-4">
            <h4 className="font-semibold mb-2 text-text-secondary">Admin Actions</h4>
            <div className="flex flex-col space-y-4">
              {/* Status Update */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:items-center">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
                >
                  <option value="">Select new status</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStatusChange}
                  disabled={!newStatus}
                  className={`w-full sm:w-auto px-4 py-2 rounded-md text-white ${
                    newStatus
                      ? "bg-primary hover:bg-primary-hover"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Update Status
                </motion.button>
              </div>

              {/* Delete Order */}
              {!confirmDelete ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmDelete(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
                >
                  <FaTrash className="mr-2" /> Delete Order
                </motion.button>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <p className="text-red-600 text-sm flex-1">
                    Are you sure? This cannot be undone.
                  </p>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteConfirm}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <FaCheck />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setConfirmDelete(false)}
                      className="px-4 py-2 bg-background-secondary text-text-primary rounded-md hover:bg-background-hover"
                    >
                      <FaTimes />
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllOrderModal;