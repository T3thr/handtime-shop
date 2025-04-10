"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaCheck, FaTimes, FaTrash, FaChevronDown } from "react-icons/fa";
import Modal from "@/components/contents/Modal";
import { OrderStatus, Avatar } from "@/components/contents/DashboardUI";
import { toast } from "react-toastify";

const AllOrderModal = ({ isOpen, onClose, order, isAdmin = false, onUpdateStatus, onDeleteOrder }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  if (!order) return null;

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "refunded", label: "Refunded" },
  ];

  const handleStatusChange = async () => {
    if (!newStatus) return;

    try {
      await onUpdateStatus(order.orderId, newStatus);
      setNewStatus("");
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await onDeleteOrder(order.orderId);
      toast.success("Order deleted successfully");
      onClose();
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast.error("Failed to delete order");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Order Details: ${order.orderId}`}>
      <div className="space-y-6 bg-surface-card isolate">
        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-1">Order Date</h3>
            <p className="text-text-primary">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-1">Status</h3>
            <OrderStatus status={order.status} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-1">Customer</h3>
            <div className="flex items-center">
              <Avatar
                src={order.userId?.avatar}
                name={order.userId?.name || "Unknown"}
                size="sm"
              />
              <div className="ml-2">
                <p className="text-text-primary">{order.userId?.name || order.userName || "Unknown"}</p>
                <p className="text-xs text-text-muted">{order.userId?.email || order.userEmail || "No email"}</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-1">Total Amount</h3>
            <p className="text-text-primary font-bold">฿{order.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Order Message */}
        {order.message && (
          <div className="bg-background-secondary p-4 rounded-lg">
            <h3 className="text-sm font-medium text-text-muted mb-2">Order Message</h3>
            <p className="text-text-primary">{order.message}</p>
          </div>
        )}

        {/* Order Items */}
        <div>
          <h3 className="text-sm font-medium text-text-muted mb-3">Order Items</h3>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center p-3 bg-background rounded-lg border border-border-primary"
              >
                <div className="w-16 h-16 rounded-md overflow-hidden bg-background-secondary mr-4">
                  <Image
                    src={item.image || item.product?.image || "/images/placeholder.jpg"}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-text-primary">{item.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-text-muted">
                      {item.quantity} × ฿{item.price.toFixed(2)}
                    </p>
                    <p className="font-medium text-text-primary">
                      ฿{(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="border-t border-border-primary pt-4 mt-4">
            <h3 className="text-sm font-medium text-text-primary mb-3">Admin Actions</h3>

            <div className="flex flex-col space-y-4">
              {/* Status Update */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="relative flex-1">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                  >
                    <option value="">Select new status</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStatusChange}
                  disabled={!newStatus}
                  className={`px-4 py-2 rounded-lg text-text-inverted shadow-md flex items-center justify-center ${
                    newStatus ? "bg-primary hover:bg-primary-dark" : "bg-primary/50 cursor-not-allowed"
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
                  className="px-4 py-2 bg-error text-text-inverted rounded-lg hover:bg-error-dark transition-colors duration-300 shadow-md flex items-center justify-center"
                >
                  <FaTrash className="mr-2" /> Delete Order
                </motion.button>
              ) : (
                <div className="flex items-center space-x-2">
                  <p className="text-error text-sm flex-1">Are you sure? This cannot be undone.</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteConfirm}
                    className="p-2 bg-error text-text-inverted rounded-lg hover:bg-error-dark transition-colors duration-300 shadow-md"
                  >
                    <FaCheck />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setConfirmDelete(false)}
                    className="p-2 bg-background-secondary text-text-primary rounded-lg hover:bg-background transition-colors duration-300 shadow-md"
                  >
                    <FaTimes />
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AllOrderModal;