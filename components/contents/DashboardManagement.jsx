"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaShoppingCart, FaChartLine, FaEdit, FaTrash } from 'react-icons/fa';
import { useAllOrders, updateOrderStatus, deleteOrder, useUsers, updateUser } from '@/backend/lib/dashboardAction';
import { toast } from 'react-toastify';
import Image from 'next/image';

// User Management Component
export const UserManagement = () => {
  const { users, isLoading, isError, pagination, changePage, changeLimit, refetch: refetchUsers } = useUsers();
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: ''
  });

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setIsEditModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(selectedUser._id, editForm);
      setIsEditModalOpen(false);
      refetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  if (isLoading) return <div className="text-center py-10">Loading users...</div>;
  if (isError) return <div className="text-center py-10 text-red-500">Failed to load users</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex space-x-2">
          <select 
            className="px-3 py-2 border rounded-md bg-background text-text-primary"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-background-hover transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-text-secondary">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => changePage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={`px-3 py-1 rounded-md ${
              pagination.page === 1 
                ? 'bg-background-secondary text-text-secondary cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => changePage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className={`px-3 py-1 rounded-md ${
              pagination.page === pagination.totalPages 
                ? 'bg-background-secondary text-text-secondary cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit User</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-text-secondary text-sm font-bold mb-2">
                  Name
                </label>
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
                <label className="block text-text-secondary text-sm font-bold mb-2">
                  Email
                </label>
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
                <label className="block text-text-secondary text-sm font-bold mb-2">
                  Role
                </label>
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
  const [statusFilter, setStatusFilter] = useState('all');
  const { 
    orders, 
    isLoading, 
    isError, 
    pagination, 
    changePage, 
    changeLimit, 
    updateOrderStatus,
    deleteOrder,
    refetch: refetchOrders
  } = useAllOrders(1, 10, statusFilter);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleEditStatus = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsEditModalOpen(true);
  };

  const handleDeleteOrder = (order) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const confirmUpdateStatus = async () => {
    try {
      await updateOrderStatus(selectedOrder._id, newStatus);
      setIsEditModalOpen(false);
      await refetchOrders();
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const confirmDeleteOrder = async () => {
    try {
      await deleteOrder(selectedOrder._id);
      setIsDeleteModalOpen(false);
      refetchOrders();
      toast.success('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div className="text-center py-10">Loading orders...</div>;
  if (isError) return <div className="text-center py-10 text-red-500">Failed to load orders</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="flex space-x-2">
          <select 
            className="px-3 py-2 border rounded-md bg-background text-text-primary"
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
            className="px-3 py-2 border rounded-md bg-background text-text-primary"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-background-hover transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  {order._id.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  ${order.totalAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleViewOrder(order)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleEditStatus(order)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <FaEdit className="inline" /> Status
                  </button>
                  <button 
                    onClick={() => handleDeleteOrder(order)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash className="inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-text-secondary">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => changePage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={`px-3 py-1 rounded-md ${
              pagination.page === 1 
                ? 'bg-background-secondary text-text-secondary cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => changePage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className={`px-3 py-1 rounded-md ${
              pagination.page === pagination.totalPages 
                ? 'bg-background-secondary text-text-secondary cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* View Order Modal */}
      {isViewModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Order Details</h3>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold mb-2">Order Information</h4>
                <p><span className="text-text-secondary">Order ID:</span> {selectedOrder._id}</p>
                <p><span className="text-text-secondary">Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                <p><span className="text-text-secondary">Status:</span> 
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </p>
                <p><span className="text-text-secondary">Payment Method:</span> {selectedOrder.paymentMethod}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Customer Information</h4>
                {selectedOrder.userId ? (
                  <>
                    <div className="flex items-center mb-2">
                      <div className="h-10 w-10 flex-shrink-0 relative rounded-full overflow-hidden">
                        <Image 
                          src={selectedOrder.userId.avatar || "/images/avatar-placeholder.jpg"} 
                          alt={selectedOrder.userId.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium">{selectedOrder.userId.name}</p>
                        <p className="text-sm text-text-secondary">{selectedOrder.userId.email}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>Guest User</p>
                )}
                
                <h4 className="font-semibold mt-4 mb-2">Shipping Address</h4>
                <p>{selectedOrder.shippingAddress?.street}</p>
                <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}</p>
                <p>{selectedOrder.shippingAddress?.country}</p>
              </div>
            </div>
            
            <h4 className="font-semibold mb-2">Order Items</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-background border border-border-primary rounded-lg">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {selectedOrder.items.map((item, index) => (
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
                            <div className="text-sm font-medium text-text-primary">{item.name}</div>
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
            
            <div className="mt-6 text-right">
              <p className="text-text-secondary">Subtotal: ${selectedOrder.subtotal?.toFixed(2) || '0.00'}</p>
              <p className="text-text-secondary">Shipping: ${selectedOrder.shippingCost?.toFixed(2) || '0.00'}</p>
              <p className="text-text-secondary">Tax: ${selectedOrder.taxAmount?.toFixed(2) || '0.00'}</p>
              <p className="font-bold text-lg">Total: ${selectedOrder.totalAmount.toFixed(2)}</p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Update Order Status</h3>
            <p className="mb-4">Order ID: {selectedOrder._id}</p>
            
            <div className="mb-4">
              <label className="block text-text-secondary text-sm font-bold mb-2">
                Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-text-primary"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-border-primary rounded-md hover:bg-background-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdateStatus}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Delete Order</h3>
            <p className="mb-4">Are you sure you want to delete this order? This action cannot be undone.</p>
            <p className="mb-4">Order ID: {selectedOrder._id.substring(0, 8)}...</p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-border-primary rounded-md hover:bg-background-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteOrder}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Order
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
  refetchCategories
}) => {
  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter products based on search term
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  // Filter categories based on search term
  const filteredCategories = categories?.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Store Management</h2>
        <div className="flex space-x-2">
          {activeTab === 'products' && (
            <button
              onClick={onAddProduct}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
            >
              Add Product
            </button>
          )}
          {activeTab === 'categories' && (
            <button
              onClick={onAddCategory}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
            >
              Add Category
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-border-primary">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'products'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'categories'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveTab('categories')}
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

      {activeTab === 'products' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-background border border-border-primary rounded-lg">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-background-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {product.categories?.map(cat => cat.name || cat).join(', ') || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-text-secondary">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-background border border-border-primary rounded-lg">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {filteredCategories.map((category) => (
                <tr key={category._id} className="hover:bg-background-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {category.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      category.priority === 'main' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {category.priority || 'normal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-text-secondary">
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
