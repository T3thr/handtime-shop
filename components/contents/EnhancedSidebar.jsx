// components/contents/EnhancedSidebar.jsx
"use client";

import React, { useState, useContext, useEffect, useRef } from "react";
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
  FaHome,
  FaMoon,
  FaSun,
  FaStar,
} from "react-icons/fa";
import { MdAdminPanelSettings, MdDashboard } from "react-icons/md";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useTheme } from "@/context/Theme";
import { useSidebar } from "@/context/DashboardSidebarContext";
import AuthContext from "@/context/AuthContext";
import { Shield, Copy, Eye, EyeOff, Settings } from "lucide-react";
import { toast } from "react-toastify";

export const Sidebar = ({ activeSection, setActiveSection, session }) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isOpen, toggleSidebar, isCollapsed, toggleCollapse } = useSidebar();
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isGeneralMenuOpen, setIsGeneralMenuOpen] = useState(false);
  const [showUserId, setShowUserId] = useState(false);
  const { user, lineProfile } = useContext(AuthContext);
  const adminMenuRef = useRef(null);
  const generalMenuRef = useRef(null);

  const handleReturn = () => {
    router.push("/");
    if (window.innerWidth < 1024) toggleSidebar();
  };

  const isAdmin = user?.role === "admin" || session?.user?.role === "admin";

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
    { id: "allReviews", label: "All Reviews", icon: FaStar },
  ];

  const generalNavItems = [
    { 
      id: "theme", 
      label: theme === "dark" ? "Light Mode" : "Dark Mode", 
      icon: theme === "dark" ? FaSun : FaMoon,
      action: toggleTheme 
    },
    { 
      id: "home", 
      label: "Return to Home", 
      icon: FaHome,
      action: handleReturn 
    },
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      width: isCollapsed ? "80px" : "280px",
      transition: { type: "spring", stiffness: 400, damping: 28 },
    },
    closed: {
      x: isCollapsed ? "-80px" : "-280px",
      width: isCollapsed ? "80px" : "280px",
      transition: { type: "spring", stiffness: 400, damping: 28 },
    },
  };

  const navItemVariants = {
    hover: { x: 5, transition: { duration: 0.2 } },
  };

  const activeIndicatorVariants = {
    inactive: { opacity: 0, scale: 0.5 },
    active: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 500, damping: 30 },
    },
  };

  // Handle clicks outside of floating menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setIsAdminMenuOpen(false);
      }
      if (generalMenuRef.current && !generalMenuRef.current.contains(event.target)) {
        setIsGeneralMenuOpen(false);
      }
    };

    if (isAdminMenuOpen || isGeneralMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAdminMenuOpen, isGeneralMenuOpen]);

  const getUserAvatar = () => {
    if (user?.role === "admin") {
      return (
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Shield className="h-5 w-5 text-blue-600" />
        </div>
      );
    }
    if (user?.image || lineProfile?.pictureUrl || session?.user?.image) {
      return (
        <Image
          src={user?.image || lineProfile?.pictureUrl || session?.user?.image}
          alt="Profile"
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
      );
    }
    return (
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        <FaUser className="h-6 w-6 text-primary" />
      </div>
    );
  };

  const getUserRoleBadge = () => {
    const role = user?.role || session?.user?.role;
    if (!role) return null;
    return (
      <span
        className={`text-xs px-2 py-1 rounded-full ${
          role === "admin" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        }`}
      >
        {role}
      </span>
    );
  };

  const renderUserInfo = () => {
    if (user?.email || session?.user?.email) {
      return user?.email || session?.user?.email;
    } else if (user?.lineId || lineProfile?.userId) {
      return (
        <div className="flex flex-col space-y-2">
          <span className="truncate">{user?.name || lineProfile?.displayName || "LINE User"}</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowUserId(!showUserId)}
              className="p-1 rounded hover:bg-interactive-muted"
              aria-label={showUserId ? "Hide User ID" : "Show User ID"}
            >
              {showUserId ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            {showUserId && (
              <div className="flex items-center space-x-1 max-w-24 overflow-hidden">
                <span className="text-xs bg-container px-2 py-1 rounded truncate">
                  {user?.lineId || lineProfile?.userId}
                </span>
                <button
                  onClick={() => {
                    const userId = user?.lineId || lineProfile?.userId;
                    if (userId) {
                      navigator.clipboard.writeText(userId);
                      toast.success("User ID copied to clipboard");
                    }
                  }}
                  className="p-1 rounded hover:bg-interactive-muted flex-shrink-0"
                  aria-label="Copy User ID"
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
    return "Guest";
  };

  // Helper function to render section title
  const renderSectionTitle = (title) => {
    if (isCollapsed) {
      return (
        <div className="flex justify-center my-2">
          <div className="w-8 h-0.5 bg-border-primary"></div>
        </div>
      );
    } else {
      return (
        <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider">
          {title}
        </div>
      );
    }
  };

  // Render floating menu for collapsed state
  const renderFloatingMenu = (items, isOpen, menuRef, title) => {
    if (!isOpen) return null;
    
    return (
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -5 }}
        className="absolute left-20 z-50 bg-surface-card rounded-lg shadow-lg border border-border-primary py-2 min-w-[180px]"
        style={{
          background: "var(--surface-card)",
          top: title === "Admin" ? "calc(50% - 80px)" : "calc(100% - 120px)",
        }}
      >
        <div className="px-3 py-1 text-sm font-medium text-text-secondary border-b border-border-primary mb-1">
          {title}
        </div>
        {items.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ x: 5, backgroundColor: "var(--interactive-muted)" }}
            onClick={() => {
              if (item.action) {
                item.action();
              } else {
                setActiveSection(item.id);
              }
              title === "Admin" ? setIsAdminMenuOpen(false) : setIsGeneralMenuOpen(false);
              if (window.innerWidth < 1024) toggleSidebar();
            }}
            className={`w-full flex items-center px-4 py-2 ${
              activeSection === item.id
                ? "text-primary font-medium"
                : "text-text-primary hover:text-primary"
            }`}
          >
            <item.icon className="w-4 h-4 mr-3" />
            <span>{item.label}</span>
          </motion.button>
        ))}
      </motion.div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className={`fixed top-0 left-0 h-full bg-surface-card border-r border-border-primary z-40 flex flex-col shadow-md ${
          isCollapsed ? "items-center" : ""
        }`}
        style={{
          borderRadius: "0 16px 16px 0",
          marginTop: "16px",
          marginBottom: "16px",
          height: "calc(100% - 32px)",
          background: "var(--surface-card)",
        }}
      >
        {/* Sidebar Header with Logo */}
        <div
          className={`p-4 border-b border-border-primary flex ${
            isCollapsed ? "justify-center" : "justify-between"
          } items-center`}
        >
          {!isCollapsed && (
            <motion.div
              className="flex items-center"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-text-inverted relative overflow-hidden">
                <span className="font-bold z-10">HT</span>
                <motion.div
                  className="absolute inset-0 bg-primary"
                  animate={{
                    background: [
                      "var(--primary)",
                      "var(--primary-light)",
                      "var(--primary-dark)",
                      "var(--primary)",
                    ],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <h2 className="text-lg font-bold text-text-primary ml-2">Dashboard</h2>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleCollapse}
            className="p-2 rounded-full hover:bg-background-secondary text-text-muted hover:text-primary transition-colors duration-200"
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </motion.button>
        </div>

        {/* User Info */}
        <motion.div
          className={`p-4 border-b border-border-primary ${isCollapsed ? "text-center" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className={`flex ${isCollapsed ? "justify-center" : "items-center"}`}>
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {getUserAvatar()}
            </motion.div>
            {!isCollapsed && (
              <motion.div
                className="ml-3 overflow-hidden"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center space-x-2">
                  <h2 className="font-medium text-text-primary truncate">
                    {user?.name || lineProfile?.displayName || session?.user?.name || "Guest"}
                  </h2>
                  {getUserRoleBadge()}
                </div>
                <p className="text-sm text-text-secondary">{renderUserInfo()}</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2">
          <nav>
            <motion.ul
              className="space-y-1 px-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.07, delayChildren: 0.2 },
                },
              }}
            >
              {/* User Navigation Section */}
              <motion.li
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1 },
                }}
                className="pt-2"
              >
                {renderSectionTitle("Dashboard")}
              </motion.li>

              {userNavItems.map((item) => (
                <motion.li
                  key={item.id}
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: { y: 0, opacity: 1 },
                  }}
                >
                  <motion.div className="relative">
                    <motion.button
                      whileHover="hover"
                      variants={navItemVariants}
                      onClick={() => {
                        setActiveSection(item.id);
                        if (window.innerWidth < 1024) toggleSidebar();
                      }}
                      className={`w-full flex items-center ${
                        isCollapsed ? "justify-center" : ""
                      } px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeSection === item.id
                          ? "bg-primary text-text-inverted"
                          : "text-text-primary hover:bg-background-secondary hover:text-primary"
                      }`}
                    >
                      <item.icon className={`${isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}`} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </motion.button>

                    {!isCollapsed && activeSection === item.id && (
                      <motion.div
                        className="absolute left-0 top-1/2 h-6 w-1 bg-primary-light rounded-r-full transform -translate-y-1/2"
                        initial="inactive"
                        animate="active"
                        variants={activeIndicatorVariants}
                      />
                    )}
                  </motion.div>
                </motion.li>
              ))}

              {/* Admin Section */}
              {isAdmin && (
                <>
                  <motion.li
                    className="pt-4"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 },
                    }}
                  >
                    {renderSectionTitle("Admin")}
                  </motion.li>

                  {isCollapsed ? (
                    <motion.li
                      variants={{
                        hidden: { y: 20, opacity: 0 },
                        visible: { y: 0, opacity: 1 },
                      }}
                    >
                      <motion.button
                        whileHover="hover"
                        variants={navItemVariants}
                        onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                        className={`w-full flex justify-center px-4 py-3 rounded-lg text-text-primary hover:bg-background-secondary hover:text-primary transition-all duration-200 ${
                          isAdminMenuOpen ? "bg-background-secondary text-primary" : ""
                        }`}
                      >
                        <MdAdminPanelSettings className="w-6 h-6" />
                      </motion.button>

                      <AnimatePresence>
                        {renderFloatingMenu(adminNavItems, isAdminMenuOpen, adminMenuRef, "Admin")}
                      </AnimatePresence>
                    </motion.li>
                  ) : (
                    adminNavItems.map((item) => (
                      <motion.li
                        key={item.id}
                        variants={{
                          hidden: { y: 20, opacity: 0 },
                          visible: { y: 0, opacity: 1 },
                        }}
                      >
                        <motion.div className="relative">
                          <motion.button
                            whileHover="hover"
                            variants={navItemVariants}
                            onClick={() => {
                              setActiveSection(item.id);
                              if (window.innerWidth < 1024) toggleSidebar();
                            }}
                            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                              activeSection === item.id
                                ? "bg-primary text-text-inverted"
                                : "text-text-primary hover:bg-background-secondary hover:text-primary"
                            }`}
                          >
                            <item.icon className="w-5 h-5 mr-3" />
                            <span>{item.label}</span>
                          </motion.button>

                          {activeSection === item.id && (
                            <motion.div
                              className="absolute left-0 top-1/2 h-6 w-1 bg-primary-light rounded-r-full transform -translate-y-1/2"
                              initial="inactive"
                              animate="active"
                              variants={activeIndicatorVariants}
                            />
                          )}
                        </motion.div>
                      </motion.li>
                    ))
                  )}
                </>
              )}

              {/* General Section - New Addition */}
              <motion.li
                className="pt-4 mt-auto"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1 },
                }}
              >
                {renderSectionTitle("General")}
              </motion.li>

              {isCollapsed ? (
                <motion.li
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: { y: 0, opacity: 1 },
                  }}
                >
                  <motion.button
                    whileHover="hover"
                    variants={navItemVariants}
                    onClick={() => setIsGeneralMenuOpen(!isGeneralMenuOpen)}
                    className={`w-full flex justify-center px-4 py-3 rounded-lg text-text-primary hover:bg-background-secondary hover:text-primary transition-all duration-200 ${
                      isGeneralMenuOpen ? "bg-background-secondary text-primary" : ""
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                  </motion.button>

                  <AnimatePresence>
                    {renderFloatingMenu(generalNavItems, isGeneralMenuOpen, generalMenuRef, "General")}
                  </AnimatePresence>
                </motion.li>
              ) : (
                generalNavItems.map((item) => (
                  <motion.li
                    key={item.id}
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1 },
                    }}
                  >
                    <motion.button
                      whileHover="hover"
                      variants={navItemVariants}
                      onClick={item.action}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-text-primary hover:bg-background-secondary hover:text-primary transition-all duration-200"
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span>{item.label}</span>
                    </motion.button>
                  </motion.li>
                ))
              )}
            </motion.ul>
          </nav>
        </div>

        {/* Mobile Toggle Button */}
        <div className="fixed top-4 left-4 lg:hidden z-50">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSidebar}
            className="p-2 rounded-full bg-surface-card shadow-lg border border-border-primary text-text-primary"
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};