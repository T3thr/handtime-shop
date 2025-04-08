"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const DashboardSidebarContext = createContext();

// Provider component
export const DashboardSidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Initialize state from localStorage on mount
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      const savedOpen = localStorage.getItem('dashboardSidebarOpen');
      const savedCollapsed = localStorage.getItem('dashboardSidebarCollapsed');
      
      // Set initial state based on saved values or defaults
      setIsOpen(savedOpen !== null ? savedOpen === 'true' : window.innerWidth >= 1024);
      setIsCollapsed(savedCollapsed !== null ? savedCollapsed === 'true' : false);
    }
  }, []);
  
  // Save state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardSidebarOpen', isOpen.toString());
      localStorage.setItem('dashboardSidebarCollapsed', isCollapsed.toString());
    }
  }, [isOpen, isCollapsed]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const toggleSidebar = () => setIsOpen(prev => !prev);
  const toggleCollapse = () => setIsCollapsed(prev => !prev);
  
  return (
    <DashboardSidebarContext.Provider value={{ isOpen, toggleSidebar, isCollapsed, toggleCollapse }}>
      {children}
    </DashboardSidebarContext.Provider>
  );
};

// Custom hook to use the sidebar context
export const useSidebar = () => {
  const context = useContext(DashboardSidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
