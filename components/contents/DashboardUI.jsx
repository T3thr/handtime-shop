"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBars, 
  FaTimes, 
  FaChevronLeft, 
  FaChevronRight, 
  FaUser, 
  FaShoppingBag, 
  FaHeart, 
  FaBox, 
  FaCog, 
  FaStore, 
  FaUsers, 
  FaClipboardList,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaChevronDown
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useTheme } from "@/context/Theme";

// UI Components
export const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-surface-card rounded-xl shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
};

export const DashboardCard = ({ icon: Icon, title, value, color }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-surface-card rounded-xl shadow-md p-6 border border-border-primary hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center mb-4">
        <div className={`w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-text-muted text-sm mb-1">{title}</h3>
      <p className="text-text-primary text-2xl font-bold">{value}</p>
    </motion.div>
  );
};

export const SectionHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          {subtitle && <p className="text-text-muted mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="mt-4 md:mt-0">{actions}</div>}
      </div>
    </div>
  );
};

export const Tabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex flex-wrap border-b border-border-primary">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
            activeTab === tab.id
              ? "text-primary border-b-2 border-primary"
              : "text-text-muted hover:text-text-primary"
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export const Badge = ({ children, color = "primary", className = "" }) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-error/10 text-error",
    info: "bg-info/10 text-info",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]} ${className}`}
    >
      {children}
    </span>
  );
};

export const Avatar = ({ src, name, size = "md" }) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={`relative rounded-full overflow-hidden bg-background-secondary ${sizes[size]}`}>
      {src ? (
        <Image src={src} alt={name || "Avatar"} fill className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-medium text-text-primary">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export const DataTable = ({ columns, data, emptyMessage = "No data available" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-primary">
            {columns.map((column, index) => (
              <th
                key={index}
                className={`py-3 text-left text-sm font-medium text-text-muted ${
                  column.align === "right" ? "text-right" : ""
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border-primary hover:bg-background-secondary transition-colors duration-150"
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`py-4 text-sm ${
                    column.align === "right" ? "text-right" : ""
                  } ${column.className || ""}`}
                >
                  {column.render ? column.render(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of middle pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're at the beginning or end
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push("...");
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push("...");
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex justify-center mt-6">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-md ${
            currentPage === 1
              ? "text-text-muted cursor-not-allowed"
              : "text-text-primary hover:bg-background-secondary"
          }`}
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>
        
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded-md ${
              page === currentPage
                ? "bg-primary text-text-inverted"
                : page === "..."
                ? "text-text-muted cursor-default"
                : "text-text-primary hover:bg-background-secondary"
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md ${
            currentPage === totalPages
              ? "text-text-muted cursor-not-allowed"
              : "text-text-primary hover:bg-background-secondary"
          }`}
        >
          <FaChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="mx-auto w-16 h-16 rounded-full bg-background-secondary flex items-center justify-center text-text-muted mb-4">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-lg font-medium text-text-primary mb-2">{title}</h3>
      <p className="text-text-muted mb-6 max-w-md mx-auto">{description}</p>
      {actionText && onAction && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300 shadow-md"
        >
          {actionText}
        </motion.button>
      )}
    </div>
  );
};

export const OrderStatus = ({ status }) => {
  const statusConfig = {
    pending: { color: "warning", label: "Pending" },
    processing: { color: "info", label: "Processing" },
    shipped: { color: "primary", label: "Shipped" },
    delivered: { color: "success", label: "Delivered" },
    cancelled: { color: "error", label: "Cancelled" },
  };
  
  const config = statusConfig[status] || { color: "primary", label: status };
  
  return <Badge color={config.color}>{config.label}</Badge>;
};

export const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

// Sidebar Component
export const Sidebar = ({ isOpen, toggleSidebar, activeSection, setActiveSection, session }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  // Save collapsed state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('dashboardSidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);
  
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('dashboardSidebarCollapsed', newState.toString());
  };
  
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };
  
  const isAdmin = session?.user?.role === 'admin';
  
  const userNavItems = [
    { id: "overview", label: "Overview", icon: FaUser },
    { id: "orders", label: "Orders", icon: FaShoppingBag },
    { id: "wishlist", label: "Wishlist", icon: FaHeart },
    { id: "shipments", label: "Shipments", icon: FaBox },
    { id: "settings", label: "Settings", icon: FaCog },
  ];
  
  const adminNavItems = [
    { id: "store", label: "Store", icon: FaStore },
    { id: "users", label: "Users", icon: FaUsers },
    { id: "allOrders", label: "All Orders", icon: FaClipboardList },
  ];
  
  const sidebarVariants = {
    open: { 
      x: 0,
      width: isCollapsed ? "80px" : "280px",
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    closed: { 
      x: "-100%",
      width: isCollapsed ? "80px" : "280px",
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };
  
  const navItemVariants = {
    hover: { x: 5, transition: { duration: 0.2 } }
  };
  
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className={`fixed top-0 left-0 h-full bg-surface-card border-r border-border-primary z-30 flex flex-col ${
          isCollapsed ? "items-center" : ""
        }`}
      >
        {/* Sidebar Header */}
        <div className={`p-4 border-b border-border-primary flex ${isCollapsed ? "justify-center" : "justify-between"} items-center`}>
          {!isCollapsed && (
            <div className="flex items-center">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="mr-2"
              />
              <h2 className="text-lg font-bold text-text-primary">Dashboard</h2>
            </div>
          )}
          
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-full hover:bg-background-secondary text-text-muted hover:text-text-primary transition-colors duration-200"
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
        
        {/* User Info */}
        <div className={`p-4 border-b border-border-primary ${isCollapsed ? "text-center" : ""}`}>
          <div className={`flex ${isCollapsed ? "justify-center" : "items-center"}`}>
            <Avatar
              src={session?.user?.image}
              name={session?.user?.name}
              size={isCollapsed ? "sm" : "md"}
            />
            {!isCollapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="font-medium text-text-primary truncate">{session?.user?.name}</p>
                <p className="text-xs text-text-muted truncate">{session?.user?.email}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav>
            <ul className="space-y-1">
              {userNavItems.map((item) => (
                <li key={item.id}>
                  <motion.button
                    whileHover="hover"
                    variants={navItemVariants}
                    onClick={() => {
                      setActiveSection(item.id);
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    className={`w-full flex items-center ${
                      isCollapsed ? "justify-center" : ""
                    } px-4 py-3 rounded-lg ${
                      activeSection === item.id
                        ? "bg-primary text-text-inverted"
                        : "text-text-primary hover:bg-background-secondary"
                    }`}
                  >
                    <item.icon className={`${isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}`} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </motion.button>
                </li>
              ))}
              
              {isAdmin && (
                <>
                  <li className="pt-4">
                    {isCollapsed ? (
                      <div className="flex justify-center">
                        <div className="w-8 h-0.5 bg-border-primary"></div>
                      </div>
                    ) : (
                      <div className="px-4 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Admin
                      </div>
                    )}
                  </li>
                  
                  {isCollapsed ? (
                    <li>
                      <motion.button
                        whileHover="hover"
                        variants={navItemVariants}
                        onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                        className="w-full flex justify-center px-4 py-3 rounded-lg text-text-primary hover:bg-background-secondary"
                      >
                        <FaCog className="w-5 h-5" />
                      </motion.button>
                      
                      {/* Dropdown for collapsed mode */}
                      <AnimatePresence>
                        {isAdminMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute left-20 top-64 bg-surface-card rounded-lg shadow-lg border border-border-primary z-10 py-2 min-w-[180px]"
                          >
                            {adminNavItems.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveSection(item.id);
                                  setIsAdminMenuOpen(false);
                                  if (window.innerWidth < 1024) toggleSidebar();
                                }}
                                className={`w-full flex items-center px-4 py-2 ${
                                  activeSection === item.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-text-primary hover:bg-background-secondary"
                                }`}
                              >
                                <item.icon className="w-4 h-4 mr-3" />
                                <span>{item.label}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  ) : (
                    adminNavItems.map((item) => (
                      <li key={item.id}>
                        <motion.button
                          whileHover="hover"
                          variants={navItemVariants}
                          onClick={() => {
                            setActiveSection(item.id);
                            if (window.innerWidth < 1024) toggleSidebar();
                          }}
                          className={`w-full flex items-center px-4 py-3 rounded-lg ${
                            activeSection === item.id
                              ? "bg-primary text-text-inverted"
                              : "text-text-primary hover:bg-background-secondary"
                          }`}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          <span>{item.label}</span>
                        </motion.button>
                      </li>
                    ))
                  )}
                </>
              )}
            </ul>
          </nav>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border-primary">
          <div className="flex flex-col space-y-2">
            <motion.button
              whileHover="hover"
              variants={navItemVariants}
              onClick={toggleTheme}
              className={`flex items-center ${
                isCollapsed ? "justify-center" : ""
              } px-4 py-2 rounded-lg text-text-primary hover:bg-background-secondary`}
            >
              {theme === "dark" ? (
                <FaSun className={`${isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}`} />
              ) : (
                <FaMoon className={`${isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}`} />
              )}
              {!isCollapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
            </motion.button>
            
            <motion.button
              whileHover="hover"
              variants={navItemVariants}
              onClick={handleSignOut}
              className={`flex items-center ${
                isCollapsed ? "justify-center" : ""
              } px-4 py-2 rounded-lg text-error hover:bg-error/10`}
            >
              <FaSignOutAlt className={`${isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}`} />
              {!isCollapsed && <span>Sign Out</span>}
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-6 right-6 z-20 lg:hidden p-4 rounded-full bg-primary text-text-inverted shadow-lg hover:bg-primary-dark transition-colors duration-300"
      >
        {isOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
      </button>
    </>
  );
};
