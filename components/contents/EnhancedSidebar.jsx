"use client";

import React, { useState } from "react";
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
  FaSun
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useTheme } from "@/context/Theme";
import { useSidebar } from "@/context/DashboardSidebarContext";

export const Sidebar = ({ activeSection, setActiveSection, session }) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isOpen, toggleSidebar, isCollapsed, toggleCollapse } = useSidebar();
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  
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
  
  // Sidebar animation variants
  const sidebarVariants = {
    open: { 
      x: 0,
      width: isCollapsed ? "80px" : "280px",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 28 
      }
    },
    closed: { 
      x: isCollapsed ? "-80px" : "-280px",
      width: isCollapsed ? "80px" : "280px",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 28 
      }
    }
  };
  
  // Navigation item hover animation
  const navItemVariants = {
    hover: { 
      x: 5, 
      transition: { duration: 0.2 } 
    }
  };

  // Active indicator animation
  const activeIndicatorVariants = {
    inactive: { opacity: 0, scale: 0.5 },
    active: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 30 
      }
    }
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
          background: "var(--surface-card)"
        }}
      >
        {/* Sidebar Header with Logo */}
        <div className={`p-4 border-b border-border-primary flex ${isCollapsed ? "justify-center" : "justify-between"} items-center`}>
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
                      'var(--primary)', 
                      'var(--primary-light)', 
                      'var(--primary-dark)', 
                      'var(--primary)'
                    ]
                  }}
                  transition={{ 
                    duration: 8, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
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
              className={`relative rounded-full overflow-hidden bg-background-secondary ${isCollapsed ? "w-8 h-8" : "w-10 h-10"}`}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {session?.user?.image ? (
                <Image src={session.user.image} alt={session.user.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-medium text-primary">
                  {session?.user?.name?.charAt(0) || "U"}
                </div>
              )}
            </motion.div>
            {!isCollapsed && (
              <motion.div 
                className="ml-3 overflow-hidden"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="font-medium text-text-primary truncate">{session?.user?.name || "User"}</p>
                <p className="text-xs text-text-muted truncate">{session?.user?.email || "user@example.com"}</p>
              </motion.div>
            )}
          </div>
        </motion.div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav>
            <motion.ul 
              className="space-y-1 px-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: { 
                    staggerChildren: 0.07,
                    delayChildren: 0.2
                  }
                }
              }}
            >
              {userNavItems.map((item) => (
                <motion.li 
                  key={item.id}
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: { y: 0, opacity: 1 }
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
              
              {isAdmin && (
                <>
                  <motion.li 
                    className="pt-4"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 }
                    }}
                  >
                    {isCollapsed ? (
                      <div className="flex justify-center">
                        <div className="w-8 h-0.5 bg-border-primary"></div>
                      </div>
                    ) : (
                      <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Admin
                      </div>
                    )}
                  </motion.li>
                  
                  {isCollapsed ? (
                    <motion.li
                      variants={{
                        hidden: { y: 20, opacity: 0 },
                        visible: { y: 0, opacity: 1 }
                      }}
                    >
                      <motion.button
                        whileHover="hover"
                        variants={navItemVariants}
                        onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                        className="w-full flex justify-center px-4 py-3 rounded-lg text-text-primary hover:bg-background-secondary hover:text-primary transition-all duration-200"
                      >
                        <FaCog className="w-5 h-5" />
                      </motion.button>
                      
                      {/* Dropdown for collapsed mode */}
                      <AnimatePresence>
                        {isAdminMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            className="absolute left-20 z-50 bg-surface-card rounded-lg shadow-lg border border-border-primary py-2 min-w-[180px]"
                            style={{
                              background: "var(--surface-card)"
                            }}
                          >
                            {adminNavItems.map((item) => (
                              <motion.button
                                key={item.id}
                                whileHover={{ x: 5, backgroundColor: "var(--interactive-muted)" }}
                                onClick={() => {
                                  setActiveSection(item.id);
                                  setIsAdminMenuOpen(false);
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
                        )}
                      </AnimatePresence>
                    </motion.li>
                  ) : (
                    adminNavItems.map((item) => (
                      <motion.li 
                        key={item.id}
                        variants={{
                          hidden: { y: 20, opacity: 0 },
                          visible: { y: 0, opacity: 1 }
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
            </motion.ul>
          </nav>
        </div>
        
        {/* Footer */}
        <motion.div 
          className="p-4 border-t border-border-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex flex-col space-y-2">
            <motion.button
              whileHover="hover"
              variants={navItemVariants}
              onClick={toggleTheme}
              className={`flex items-center ${
                isCollapsed ? "justify-center" : ""
              } px-4 py-2 rounded-lg text-text-primary hover:bg-background-secondary hover:text-primary transition-all duration-200`}
            >
              {theme === "dark" ? (
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <FaSun className={`${isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}`} />
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ rotate: -90 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <FaMoon className={`${isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}`} />
                </motion.div>
              )}
              {!isCollapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
            </motion.button>
            
            <motion.button
              whileHover="hover"
              variants={navItemVariants}
              onClick={handleSignOut}
              className={`flex items-center ${
                isCollapsed ? "justify-center" : ""
              } px-4 py-2 rounded-lg text-error hover:bg-error/10 transition-all duration-200`}
            >
              <FaSignOutAlt className={`${isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}`} />
              {!isCollapsed && <span>Sign Out</span>}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Mobile Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleSidebar}
        className="fixed bottom-6 left-6 z-30 lg:hidden p-4 rounded-full bg-primary text-text-inverted shadow-lg pulse-soft"
        style={{
          background: "var(--primary)",
          boxShadow: "0 4px 12px rgba(15, 118, 110, 0.3)"
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FaTimes className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FaBars className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  )
}