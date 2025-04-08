"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { FaEdit, FaTrash, FaSearch, FaSort, FaSortUp, FaSortDown, FaTag, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { 
  Card, 
  DataTable, 
  SectionHeader, 
  Tabs, 
  Badge, 
  Avatar,
  Pagination,
  EmptyState
} from "@/components/contents/DashboardUI";
import { useProducts, useCategories } from "@/backend/lib/dashboardAction";
import { toast } from "react-toastify";

// Category Management Component
export const CategoryManagement = ({ onAddCategory, onEditCategory, onDeleteCategory }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { categories, isLoading, isError } = useCategories();
  
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
  
  const filteredCategories = categories?.filter(
    (category) => category.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  const columns = [
    { 
      header: "Name", 
      accessor: "name", 
      render: (row) => (
        <div className="flex items-center">
          {row.image ? (
            <div className="w-10 h-10 mr-3 rounded-md overflow-hidden bg-background-secondary">
              <Image src={row.image} alt={row.name} width={40} height={40} className="object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 mr-3 rounded-md bg-background-secondary flex items-center justify-center">
              <FaTag className="text-text-muted" />
            </div>
          )}
          <span className="font-medium text-text-primary">{row.name}</span>
        </div>
      )
    },
    { 
      header: "Slug", 
      accessor: "slug",
      render: (row) => <span className="text-text-muted">{row.slug}</span>
    },
    { 
      header: "Description", 
      accessor: "description",
      render: (row) => (
        <span className="text-text-secondary line-clamp-1">
          {row.description || "No description"}
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
            onClick={() => onEditCategory(row)}
            className="p-2 text-info hover:bg-info/10 rounded-full transition-colors duration-200"
          >
            <FaEdit className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDeleteCategory(row.slug)}
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
        <h3 className="text-lg font-medium text-text-primary mb-4 md:mb-0">Categories</h3>
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddCategory}
            className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300 shadow-md"
          >
            Add Category
          </motion.button>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={filteredCategories} 
        emptyMessage="No categories found."
      />
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
  
  const { products, isLoading: productsLoading, isError: productsError, pagination, changePage } = useProducts(currentPage, itemsPerPage);
  const { categories, isLoading: categoriesLoading, isError: categoriesError } = useCategories();
  
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
  
  // Filter and sort products
  const filteredProducts = products
    ?.filter((product) => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!a[sortField] || !b[sortField]) return 0;
      
      const aValue = typeof a[sortField] === "string" ? a[sortField].toLowerCase() : a[sortField];
      const bValue = typeof b[sortField] === "string" ? b[sortField].toLowerCase() : b[sortField];
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    }) || [];
  
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    changePage(page);
  }, [changePage]);
  
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
  
  if (productsLoading || categoriesLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (productsError || categoriesError) {
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
        <div className="relative mt-4 md:mt-0">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full md:w-64 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      
      {activeTab === "products" && (
        <>
          <DataTable 
            columns={productColumns} 
            data={filteredProducts} 
            emptyMessage="No products found."
          />
          <Pagination 
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
      
      {activeTab === "categories" && (
        <CategoryManagement 
          categories={categories}
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
  const [currentPage, setCurrentPage] = useState(1);
  const { users, isLoading, isError, pagination, changePage } = useUsers(currentPage, 10);
  
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    changePage(page);
  }, [changePage]);
  
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
  
  const filteredUsers = users
    ?.filter((user) => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  
  const columns = [
    { 
      header: "User",
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
            <div className="text-xs text-text-muted">{row.email || row.username || "No contact info"}</div>
          </div>
        </div>
      )
    },
    { 
      header: "Role",
      accessor: "role",
      render: (row) => (
        <Badge 
          color={row.role === "admin" ? "error" : row.role === "moderator" ? "warning" : "primary"}
        >
          {row.role}
        </Badge>
      )
    },
    { 
      header: "Status",
      accessor: "isVerified",
      render: (row) => (
        <Badge color={row.isVerified ? "success" : "warning"}>
          {row.isVerified ? "Verified" : "Unverified"}
        </Badge>
      )
    },
    { 
      header: "Orders",
      accessor: "stats.totalOrders",
      render: (row) => (
        <span className="font-medium text-text-primary">
          {row.stats?.totalOrders || 0}
        </span>
      )
    },
    { 
      header: "Spent",
      accessor: "stats.totalSpent",
      align: "right",
      render: (row) => (
        <span className="font-medium text-text-primary">
          ฿{(row.stats?.totalSpent || 0).toFixed(2)}
        </span>
      )
    },
  ];
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-text-primary mb-4 md:mb-0">User Management</h3>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full md:w-64 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={filteredUsers} 
        emptyMessage="No users found."
      />
      
      <Pagination 
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

// Order Management Component
export const OrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { orders, isLoading, isError, pagination, changePage } = useAllOrders(currentPage, 10, statusFilter);
  
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    changePage(page);
  }, [changePage]);
  
  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
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
  
  const filteredOrders = orders
    ?.filter((order) => 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  
  const columns = [
    { 
      header: "Order ID",
      accessor: "orderId", 
      render: (row) => (
        <span className="font-medium text-primary">{row.orderId}</span>
      )
    },
    { 
      header: "Date",
      accessor: "createdAt",
      render: (row) => (
        <div>
          <div>{new Date(row.createdAt).toLocaleDateString()}</div>
          <div className="text-xs text-text-muted">
            {new Date(row.createdAt).toLocaleTimeString()}
          </div>
        </div>
      )
    },
    { 
      header: "Customer",
      accessor: "userName",
      render: (row) => (
        <span className="text-text-primary">{row.userName || "Unknown"}</span>
      )
    },
    { 
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge 
          color={
            row.status === "pending" ? "warning" : 
            row.status === "processing" ? "info" : 
            row.status === "shipped" ? "primary" : 
            row.status === "delivered" ? "success" : 
            "error"
          }
        >
          {row.status}
        </Badge>
      )
    },
    { 
      header: "Total",
      accessor: "totalAmount",
      align: "right",
      render: (row) => (
        <span className="font-medium text-text-primary">
          ฿{row.totalAmount.toFixed(2)}
        </span>
      )
    },
  ];
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <h3 className="text-lg font-medium text-text-primary">Order Management</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full md:w-64 bg-background rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      
      {filteredOrders.length > 0 ? (
        <>
          <DataTable 
            columns={columns} 
            data={filteredOrders} 
            emptyMessage="No orders found."
          />
          
          <Pagination 
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <EmptyState 
          title="No Orders Found"
          description={`No ${statusFilter !== 'all' ? statusFilter : ''} orders match your search criteria.`}
        />
      )}
    </div>
  );
};
