"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { FaEdit, FaTrash, FaSearch, FaSort, FaSortUp, FaSortDown, FaTag, FaChevronDown, FaChevronUp, FaStar, FaFilter, FaInfoCircle, FaCheck, FaTimes, FaEye } from "react-icons/fa";
import { 
  Card, 
  DataTable, 
  SectionHeader, 
  Tabs, 
  Badge, 
  Avatar,
  Pagination,
  EmptyState,
  OrderStatus
} from "@/components/contents/DashboardUI";
import { useProducts, useCategories, useUsers, useAllOrders } from "@/backend/lib/dashboardAction";
import AllOrderModal from "@/components/contents/AllOrderModal";
import { toast } from "react-toastify";
import axios from "axios";

// Order Management Component
export const OrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const { 
    orders, 
    isLoading, 
    isError, 
    pagination, 
    changePage, 
    changeLimit,
    updateOrderStatus,
    deleteOrder
  } = useAllOrders(currentPage, itemsPerPage, statusFilter);
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1 text-text-muted" />;
    return sortDirection === "asc" ? (
      <FaSortUp className="ml-1 text-primary" />
    ) : (
      <FaSortDown className="ml-1 text-primary" />
    );
  };
  
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when changing filter
  };
  
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };
  
  const handleCloseModal = () => {
    setSelectedOrder(null);
  };
  
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error("Failed to update order status");
    }
  };
  
  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteOrder(orderId);
      toast.success("Order deleted successfully");
      handleCloseModal();
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast.error("Failed to delete order");
    }
  };
  
  // Filter and sort orders
  const sortedAndFilteredOrders = React.useMemo(() => {
    if (!orders) return [];
    
    return [...orders]
      .filter((order) => {
        // Filter by search term
        const searchFields = [
          order.orderId,
          order.userName || "",
          order.userEmail || "",
        ];
        
        const matchesSearch = searchTerm === "" || searchFields.some(field => 
          field.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortField === "totalAmount") {
          return sortDirection === "asc" 
            ? a.totalAmount - b.totalAmount 
            : b.totalAmount - a.totalAmount;
        }
        
        if (sortField === "createdAt") {
          return sortDirection === "asc" 
            ? new Date(a.createdAt) - new Date(b.createdAt) 
            : new Date(b.createdAt) - new Date(a.createdAt);
        }
        
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      });
  }, [orders, searchTerm, sortField, sortDirection]);
  
  const orderColumns = [
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("orderId")}>
          Order ID {getSortIcon("orderId")}
        </div>
      ),
      accessor: "orderId", 
      render: (row) => <span className="font-medium text-primary">{row.orderId}</span>
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("userName")}>
          Customer {getSortIcon("userName")}
        </div>
      ),
      accessor: "userName",
      render: (row) => (
        <div className="flex items-center">
          <Avatar 
            src={row.avatar || row.userAvatar || (row.userId?.avatar)}
            name={row.userName || "Unknown"}
            size="sm"
          />
          <div className="ml-2">
            <p className="text-text-primary">{row.userName || "Unknown"}</p>
            <p className="text-xs text-text-muted">{row.userEmail || "No email"}</p>
          </div>
        </div>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("createdAt")}>
          Date {getSortIcon("createdAt")}
        </div>
      ),
      accessor: "createdAt",
      render: (row) => <span>{new Date(row.createdAt).toLocaleDateString()}</span>
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("status")}>
          Status {getSortIcon("status")}
        </div>
      ),
      accessor: "status",
      render: (row) => <OrderStatus status={row.status} />
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("totalAmount")}>
          Total {getSortIcon("totalAmount")}
        </div>
      ),
      accessor: "totalAmount",
      align: "right",
      render: (row) => <span className="font-medium">฿{row.totalAmount.toFixed(2)}</span>
    },
    { 
      header: "Actions", 
      accessor: "actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleViewOrder(row)}
            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors duration-200"
            title="View Order Details"
          >
            <FaEye className="w-4 h-4" />
          </motion.button>
        </div>
      )
    },
  ];
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load orders</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <>
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-text-primary mb-4 md:mb-0">All Orders</h3>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="pl-4 pr-10 py-2 w-full bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>
        
        <DataTable 
          columns={orderColumns} 
          data={sortedAndFilteredOrders} 
          emptyMessage="No orders found."
        />
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-text-muted">
            Showing {sortedAndFilteredOrders.length} of {pagination.total} orders
          </div>
          <Pagination 
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={changePage}
          />
        </div>
      </Card>
      
      {selectedOrder && (
        <AllOrderModal
          isOpen={!!selectedOrder}
          onClose={handleCloseModal}
          order={selectedOrder}
          isAdmin={true}
          onUpdateStatus={handleUpdateStatus}
          onDeleteOrder={handleDeleteOrder}
        />
      )}
    </>
  );
};

// Category Management Component
export const CategoryManagement = ({ onAddCategory, onEditCategory, onDeleteCategory }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const { categories, isLoading, isError } = useCategories();
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1 text-text-muted" />;
    return sortDirection === "asc" ? (
      <FaSortUp className="ml-1 text-primary" />
    ) : (
      <FaSortDown className="ml-1 text-primary" />
    );
  };
  
  const sortedAndFilteredCategories = React.useMemo(() => {
    if (!categories) return [];
    
    return [...categories]
      .filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortField === 'priority') {
          // Sort by priority (main first, then normal)
          const priorityOrder = { main: 0, normal: 1 };
          const aValue = priorityOrder[a.priority || 'normal'];
          const bValue = priorityOrder[b.priority || 'normal'];
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        if (!a[sortField] || !b[sortField]) return 0;
        
        const aValue = typeof a[sortField] === "string" ? a[sortField].toLowerCase() : a[sortField];
        const bValue = typeof b[sortField] === "string" ? b[sortField].toLowerCase() : b[sortField];
        
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [categories, searchTerm, sortField, sortDirection]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load categories</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }
  
  const columns = [
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("name")}>
          Name {getSortIcon("name")}
        </div>
      ),
      accessor: "name", 
      render: (row) => (
        <div className="flex items-center">
          {row.image && row.image.url ? (
            <div className="w-10 h-10 mr-3 rounded-md overflow-hidden bg-background-secondary">
              <Image 
                src={row.image.url} 
                alt={row.name} 
                width={40} 
                height={40} 
                className="object-cover" 
                unoptimized // For Cloudinary URLs
              />
            </div>
          ) : (
            <div className="w-10 h-10 mr-3 rounded-md bg-background-secondary flex items-center justify-center">
              <FaTag className="text-text-muted" />
            </div>
          )}
          <div className="flex items-center">
            <span className="font-medium text-text-primary">{row.name}</span>
            {row.priority === "main" && (
              <FaStar className="ml-2 text-warning" title="Main category (featured on homepage)" />
            )}
          </div>
        </div>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("slug")}>
          Slug {getSortIcon("slug")}
        </div>
      ),
      accessor: "slug",
      render: (row) => <span className="text-text-muted">{row.slug}</span>
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("description")}>
          Description {getSortIcon("description")}
        </div>
      ),
      accessor: "description",
      render: (row) => (
        <span className="text-text-secondary line-clamp-1">
          {row.description || "No description"}
        </span>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("priority")}>
          Priority {getSortIcon("priority")}
        </div>
      ),
      accessor: "priority",
      render: (row) => (
        <Badge 
          color={row.priority === "main" ? "warning" : "primary"}
        >
          {row.priority === "main" ? "Main" : "Normal"}
        </Badge>
      )
    },
    { 
      header: "Actions", 
      accessor: "actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEditCategory(row)}
            className="p-2 text-info hover:bg-info/10 rounded-full transition-colors duration-200"
          >
            <FaEdit className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDeleteCategory(row._id)}
            className="p-2 text-error hover:bg-error/10 rounded-full transition-colors duration-200"
          >
            <FaTrash className="w-4 h-4" />
          </motion.button>
        </div>
      )
    },
  ];
  
  return (
    <Card>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-text-primary mb-4 md:mb-0">All Categories</h3>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAddCategory}
            className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300 flex items-center justify-center"
          >
            <FaPlus className="mr-2" /> Add Category
          </motion.button>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={sortedAndFilteredCategories} 
        emptyMessage="No categories found."
      />
    </Card>
  );
};

// Product Management Component
export const ProductManagement = ({ onAddProduct, onEditProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const { 
    products, 
    isLoading: productsLoading, 
    isError: productsError,
    pagination,
    changePage,
    changeLimit
  } = useProducts(currentPage, itemsPerPage);
  
  const { 
    categories, 
    isLoading: categoriesLoading, 
    isError: categoriesError 
  } = useCategories();
  
  const isLoading = productsLoading || categoriesLoading;
  const isError = productsError || categoriesError;
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1 text-text-muted" />;
    return sortDirection === "asc" ? (
      <FaSortUp className="ml-1 text-primary" />
    ) : (
      <FaSortDown className="ml-1 text-primary" />
    );
  };
  
  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when changing filter
  };
  
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when changing filter
  };
  
  // Filter and sort products
  const sortedAndFilteredProducts = React.useMemo(() => {
    if (!products) return [];
    
    return [...products]
      .filter((product) => {
        // Filter by search term
        const searchFields = [
          product.name,
          product.description,
          product.sku || "",
        ];
        
        const matchesSearch = searchTerm === "" || searchFields.some(field => 
          field.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Filter by category
        const matchesCategory = categoryFilter === "" || 
          (product.categories && product.categories.includes(categoryFilter));
        
        // Filter by status
        const matchesStatus = statusFilter === "all" || product.status === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortField === "price") {
          return sortDirection === "asc" 
            ? a.price - b.price 
            : b.price - a.price;
        }
        
        if (sortField === "createdAt") {
          return sortDirection === "asc" 
            ? new Date(a.createdAt) - new Date(b.createdAt) 
            : new Date(b.createdAt) - new Date(a.createdAt);
        }
        
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        return 0;
      });
  }, [products, searchTerm, categoryFilter, statusFilter, sortField, sortDirection]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load products</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }
  
  const columns = [
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("name")}>
          Product {getSortIcon("name")}
        </div>
      ),
      accessor: "name", 
      render: (row) => (
        <div className="flex items-center">
          <div className="w-10 h-10 mr-3 rounded-md overflow-hidden bg-background-secondary">
            {row.images && row.images.length > 0 ? (
              <Image 
                src={row.images[0].url} 
                alt={row.name} 
                width={40} 
                height={40} 
                className="object-cover" 
                unoptimized // For Cloudinary URLs
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FaBox className="text-text-muted" />
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-text-primary">{row.name}</div>
            <div className="text-xs text-text-muted">
              {row.sku ? `SKU: ${row.sku}` : "No SKU"}
            </div>
          </div>
        </div>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("price")}>
          Price {getSortIcon("price")}
        </div>
      ),
      accessor: "price",
      render: (row) => (
        <div>
          <div className="font-medium">฿{row.price.toFixed(2)}</div>
          {row.compareAtPrice > 0 && (
            <div className="text-xs text-text-muted line-through">
              ฿{row.compareAtPrice.toFixed(2)}
            </div>
          )}
        </div>
      )
    },
    { 
      header: "Category",
      accessor: "categories",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.categories && row.categories.length > 0 ? (
            row.categories.slice(0, 2).map((category, index) => (
              <Badge key={index} color="primary" className="text-xs">
                {category}
              </Badge>
            ))
          ) : (
            <span className="text-text-muted text-xs">No category</span>
          )}
          {row.categories && row.categories.length > 2 && (
            <Badge color="secondary" className="text-xs">
              +{row.categories.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("status")}>
          Status {getSortIcon("status")}
        </div>
      ),
      accessor: "status",
      render: (row) => (
        <Badge 
          color={
            row.status === "active" 
              ? "success" 
              : row.status === "draft" 
                ? "warning" 
                : "error"
          }
        >
          {row.status === "active" 
            ? "Active" 
            : row.status === "draft" 
              ? "Draft" 
              : "Discontinued"}
        </Badge>
      )
    },
    { 
      header: "Actions", 
      accessor: "actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEditProduct(row)}
            className="p-2 text-info hover:bg-info/10 rounded-full transition-colors duration-200"
          >
            <FaEdit className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDeleteProduct(row._id)}
            className="p-2 text-error hover:bg-error/10 rounded-full transition-colors duration-200"
          >
            <FaTrash className="w-4 h-4" />
          </motion.button>
        </div>
      )
    },
  ];
  
  return (
    <Card>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-text-primary mb-4 md:mb-0">All Products</h3>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
                className="pl-4 pr-10 py-2 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="pl-4 pr-10 py-2 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="discontinued">Discontinued</option>
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAddProduct}
            className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300 flex items-center justify-center"
          >
            <FaPlus className="mr-2" /> Add Product
          </motion.button>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={sortedAndFilteredProducts} 
        emptyMessage="No products found."
      />
      
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-text-muted">
          Showing {sortedAndFilteredProducts.length} of {pagination.total} products
        </div>
        <Pagination 
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={changePage}
        />
      </div>
    </Card>
  );
};

// Store Management Component
export const ManageStore = ({ 
  onEditProduct, 
  onDeleteProduct, 
  onAddCategory, 
  onEditCategory, 
  onDeleteCategory 
}) => {
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isProductsError, setIsProductsError] = useState(false);
  const [productsPagination, setProductsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const { categories, isLoading: categoriesLoading, isError: categoriesError } = useCategories();
  
  // Fetch products with proper error handling
  useEffect(() => {
    const fetchProducts = async () => {
      setIsProductsLoading(true);
      setIsProductsError(false);
      
      try {
        const response = await axios.get(`/api/admin/product?page=${currentPage}&limit=${itemsPerPage}`);
        
        // Process products to ensure they have all required fields
        const processedProducts = response.data.products.map(product => ({
          ...product,
          images: product.images || [],
          price: product.price || 0,
          quantity: product.quantity || 0,
          status: product.status || 'draft'
        }));
        
        setProducts(processedProducts);
        setProductsPagination({
          page: response.data.page || currentPage,
          limit: response.data.limit || itemsPerPage,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        });
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsProductsError(true);
        toast.error('Failed to load products. Please try again.');
      } finally {
        setIsProductsLoading(false);
      }
    };
    
    fetchProducts();
  }, [currentPage, itemsPerPage]);
  
  const tabs = [
    { id: "products", label: "Products" },
    { id: "categories", label: "Categories" },
  ];
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1 text-text-muted" />;
    return sortDirection === "asc" ? (
      <FaSortUp className="ml-1 text-primary" />
    ) : (
      <FaSortDown className="ml-1 text-primary" />
    );
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Filter and sort products
  const sortedAndFilteredProducts = React.useMemo(() => {
    if (!products) return [];
    
    return [...products]
      .filter((product) => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortField === 'price') {
          return sortDirection === 'asc' ? a.price - b.price : b.price - a.price;
        }
        
        if (sortField === 'quantity') {
          return sortDirection === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity;
        }
        
        if (!a[sortField] || !b[sortField]) return 0;
        
        const aValue = typeof a[sortField] === "string" ? a[sortField].toLowerCase() : a[sortField];
        const bValue = typeof b[sortField] === "string" ? b[sortField].toLowerCase() : b[sortField];
        
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [products, searchTerm, sortField, sortDirection]);
  
  const productColumns = [
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("name")}>
          Name {getSortIcon("name")}
        </div>
      ),
      accessor: "name", 
      render: (row) => (
        <div className="flex items-center">
          <div className="w-12 h-12 mr-3 rounded-md overflow-hidden bg-background-secondary">
            {row.images && row.images.length > 0 ? (
              <Image 
                src={row.images[0].url} 
                alt={row.name} 
                width={48} 
                height={48} 
                className="object-cover" 
                unoptimized // For Cloudinary URLs
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-text-muted text-xs">No image</span>
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-text-primary">{row.name}</div>
            <div className="text-xs text-text-muted">{row.sku || "No SKU"}</div>
          </div>
        </div>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("price")}>
          Price {getSortIcon("price")}
        </div>
      ),
      accessor: "price",
      render: (row) => (
        <div>
          <div className="font-medium text-text-primary">฿{row.price.toFixed(2)}</div>
          {row.compareAtPrice && (
            <div className="text-xs text-error line-through">฿{row.compareAtPrice.toFixed(2)}</div>
          )}
        </div>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("quantity")}>
          Inventory {getSortIcon("quantity")}
        </div>
      ),
      accessor: "quantity",
      render: (row) => (
        <div>
          {row.trackQuantity ? (
            <span className={`font-medium ${row.quantity > 10 ? 'text-success' : row.quantity > 0 ? 'text-warning' : 'text-error'}`}>
              {row.quantity} in stock
            </span>
          ) : (
            <span className="text-text-muted">Not tracked</span>
          )}
        </div>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("status")}>
          Status {getSortIcon("status")}
        </div>
      ),
      accessor: "status",
      render: (row) => (
        <Badge 
          color={row.status === "active" ? "success" : row.status === "draft" ? "warning" : "error"}
        >
          {row.status}
        </Badge>
      )
    },
    { 
      header: "Actions", 
      accessor: "actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEditProduct(row)}
            className="p-2 text-info hover:bg-info/10 rounded-full transition-colors duration-200"
          >
            <FaEdit className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDeleteProduct(row.slug)}
            className="p-2 text-error hover:bg-error/10 rounded-full transition-colors duration-200"
          >
            <FaTrash className="w-4 h-4" />
          </motion.button>
        </div>
      )
    },
  ];
  
  if (isProductsLoading || categoriesLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (isProductsError || categoriesError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load data</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="mt-4 md:mt-0">
          {activeTab === "products" && (
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
        </div>
      </div>
      
      {activeTab === "products" && (
        <>
          <div className="flex justify-end mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEditProduct(null)}
              className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300 shadow-md"
            >
              Add Product
            </motion.button>
          </div>
          <DataTable 
            columns={productColumns} 
            data={sortedAndFilteredProducts} 
            emptyMessage="No products found."
          />
          <Pagination 
            currentPage={productsPagination.page}
            totalPages={productsPagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
      
      {activeTab === "categories" && (
        <CategoryManagement 
          onAddCategory={onAddCategory}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
        />
      )}
    </div>
  );
};

// User Management Component
export const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const { 
    users, 
    isLoading, 
    isError, 
    pagination, 
    changePage, 
    changeLimit 
  } = useUsers(currentPage, itemsPerPage);
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1 text-text-muted" />;
    return sortDirection === "asc" ? (
      <FaSortUp className="ml-1 text-primary" />
    ) : (
      <FaSortDown className="ml-1 text-primary" />
    );
  };
  
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when changing filter
  };
  
  // Filter and sort users
  const sortedAndFilteredUsers = React.useMemo(() => {
    if (!users) return [];
    
    return [...users]
      .filter((user) => {
        // Filter by search term
        const searchFields = [
          user.name,
          user.email || "",
          user.username || "",
        ];
        
        const matchesSearch = searchTerm === "" || searchFields.some(field => 
          field.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Filter by role
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (sortField === "lastLogin") {
          if (!a.lastLogin) return sortDirection === "asc" ? 1 : -1;
          if (!b.lastLogin) return sortDirection === "asc" ? -1 : 1;
          return sortDirection === "asc" 
            ? new Date(a.lastLogin) - new Date(b.lastLogin) 
            : new Date(b.lastLogin) - new Date(a.lastLogin);
        }
        
        if (sortField === "createdAt") {
          return sortDirection === "asc" 
            ? new Date(a.createdAt) - new Date(b.createdAt) 
            : new Date(b.createdAt) - new Date(a.createdAt);
        }
        
        const aValue = a[sortField] || "";
        const bValue = b[sortField] || "";
        
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        return 0;
      });
  }, [users, searchTerm, roleFilter, sortField, sortDirection]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load users</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }
  
  const columns = [
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("name")}>
          User {getSortIcon("name")}
        </div>
      ),
      accessor: "name", 
      render: (row) => (
        <div className="flex items-center">
          <Avatar 
            src={row.avatar}
            name={row.name}
            size="md"
          />
          <div className="ml-3">
            <div className="font-medium text-text-primary">{row.name}</div>
            <div className="text-xs text-text-muted">{row.email || "No email"}</div>
          </div>
        </div>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("username")}>
          Username {getSortIcon("username")}
        </div>
      ),
      accessor: "username",
      render: (row) => (
        <span className="text-text-secondary">
          {row.username || "N/A"}
        </span>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("role")}>
          Role {getSortIcon("role")}
        </div>
      ),
      accessor: "role",
      render: (row) => (
        <Badge 
          color={
            row.role === "admin" 
              ? "error" 
              : row.role === "moderator" 
                ? "warning" 
                : "primary"
          }
        >
          {row.role.charAt(0).toUpperCase() + row.role.slice(1)}
        </Badge>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("lastLogin")}>
          Last Login {getSortIcon("lastLogin")}
        </div>
      ),
      accessor: "lastLogin",
      render: (row) => (
        <span className="text-text-secondary">
          {row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : "Never"}
        </span>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("stats.totalOrders")}>
          Orders {getSortIcon("stats.totalOrders")}
        </div>
      ),
      accessor: "stats.totalOrders",
      render: (row) => (
        <span className="text-text-secondary">
          {row.stats?.totalOrders || 0}
        </span>
      )
    },
    { 
      header: "Actions", 
      accessor: "actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-info hover:bg-info/10 rounded-full transition-colors duration-200"
          >
            <FaEdit className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors duration-200"
          >
            <FaInfoCircle className="w-4 h-4" />
          </motion.button>
        </div>
      )
    },
  ];
  
  return (
    <Card>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-text-primary mb-4 md:mb-0">All Users</h3>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="relative">
            <select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              className="pl-4 pr-10 py-2 w-full bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={sortedAndFilteredUsers} 
        emptyMessage="No users found."
      />
      
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-text-muted">
          Showing {sortedAndFilteredUsers.length} of {pagination.total} users
        </div>
        <Pagination 
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={changePage}
        />
      </div>
    </Card>
  );
};

// Missing FaPlus component
const FaPlus = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 448 512" 
    fill="currentColor" 
    className={props.className}
    width={props.width || "1em"}
    height={props.height || "1em"}
  >
    <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/>
  </svg>
);
