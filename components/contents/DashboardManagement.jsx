"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { FaEdit, FaTrash, FaSearch, FaSort, FaSortUp, FaSortDown, FaTag, FaChevronDown, FaChevronUp, FaStar } from "react-icons/fa";
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
export const CategoryManagement = ({ onAddCategory, onEditCategory, onDeleteCategory, refetchCategories }) => {
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
  
  const sortedAndFilteredCategories = useMemo(() => {
    if (!categories) return [];
    
    return [...categories]
      .filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortField === 'priority') {
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
                unoptimized
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
            onClick={() => onDeleteCategory(row.slug, refetchCategories)} // Pass refetchCategories
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
        data={sortedAndFilteredCategories} 
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
  onDeleteCategory,
  refetchProducts, // Added refetchProducts prop
  refetchCategories // Added refetchCategories prop
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
  
  const sortedAndFilteredProducts = useMemo(() => {
    if (!products) return [];
    
    return [...products]
      .filter((product) => 
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
      });
  }, [products, searchTerm, sortField, sortDirection]);
  
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
                unoptimized
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
            onClick={() => onDeleteProduct(row.slug, refetchProducts)} // Pass refetchProducts
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
        <div className="mt-4 md:mt-0">
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
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
      
      {activeTab === "categories" && (
        <CategoryManagement 
          onAddCategory={onAddCategory}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          refetchCategories={refetchCategories} // Pass refetchCategories
        />
      )}
    </div>
  );
};

// User Management Component (unchanged as it doesn't need refetch for now)
export const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const { users, isLoading, isError, pagination, changePage } = useUsers(currentPage, 10);
  
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
  
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    changePage(page);
  }, [changePage]);
  
  const sortedAndFilteredUsers = useMemo(() => {
    if (!users) return [];
    
    return [...users]
      .filter((user) => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (!a[sortField] || !b[sortField]) return 0;
        
        if (sortField.includes('.')) {
          const [parent, child] = sortField.split('.');
          const aValue = a[parent] && a[parent][child] ? a[parent][child] : 0;
          const bValue = b[parent] && b[parent][child] ? b[parent][child] : 0;
          
          if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
          if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
          return 0;
        }
        
        const aValue = typeof a[sortField] === "string" ? a[sortField].toLowerCase() : a[sortField];
        const bValue = typeof b[sortField] === "string" ? b[sortField].toLowerCase() : b[sortField];
        
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [users, searchTerm, sortField, sortDirection]);
  
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
            <div className="text-xs text-text-muted">{row.email || row.username || "No contact info"}</div>
          </div>
        </div>
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
          color={row.role === "admin" ? "error" : row.role === "moderator" ? "warning" : "primary"}
        >
          {row.role}
        </Badge>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("isVerified")}>
          Status {getSortIcon("isVerified")}
        </div>
      ),
      accessor: "isVerified",
      render: (row) => (
        <Badge color={row.isVerified ? "success" : "warning"}>
          {row.isVerified ? "Verified" : "Unverified"}
        </Badge>
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
        <span className="font-medium text-text-primary">
          {row.stats?.totalOrders || 0}
        </span>
      )
    },
    { 
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort("stats.totalSpent")}>
          Spent {getSortIcon("stats.totalSpent")}
        </div>
      ),
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
        data={sortedAndFilteredUsers} 
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