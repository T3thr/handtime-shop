"use client";
import React, { useState, useEffect, useContext } from "react";
import { Menu, LogIn, X } from "lucide-react";
import { BsPersonLinesFill } from "react-icons/bs";
import AuthContext from "@/context/AuthContext";

export default function StartGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const { user, lineProfile, status } = useContext(AuthContext);
  const [idleTimer, setIdleTimer] = useState(null);

  const isAuthenticated = status === "authenticated" || !!user || !!lineProfile;

  // Check if it's the first visit or if user dismissed the guide
  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedBefore");
    const guideDismissed = localStorage.getItem("guideDismissed");

    if (!hasVisited && !isAuthenticated) {
      // First time visit and not logged in
      setTimeout(() => {
        setShowGuide(true);
      }, 1500); // Slightly longer delay for better UX after page load
      
      // Mark as visited
      localStorage.setItem("hasVisitedBefore", "true");
    } else if (!guideDismissed && !isAuthenticated) {
      // User hasn't explicitly dismissed the guide and is not logged in
      const timer = setTimeout(() => {
        setShowGuide(true);
      }, 3000);
      setIdleTimer(timer);
    }
  }, [isAuthenticated]);

  // Reset idle timer when user interacts with the page
  useEffect(() => {
    const handleInteraction = () => {
      // Don't show guide after interaction if user has dismissed it
      if (localStorage.getItem("guideDismissed") === "true") return;
      
      // Clear existing timer
      if (idleTimer) clearTimeout(idleTimer);
      
      // Set new timer if user is not logged in
      if (!isAuthenticated) {
        const timer = setTimeout(() => {
          setShowGuide(true);
        }, 10000); // Extended to 10 seconds to be less intrusive
        setIdleTimer(timer);
      }
    };

    // Add event listeners for user interaction
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(event => {
      window.addEventListener(event, handleInteraction);
    });

    // Cleanup
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, [isAuthenticated, idleTimer]);

  // Hide guide when user is logged in
  useEffect(() => {
    if (isAuthenticated) {
      setShowGuide(false);
      if (idleTimer) clearTimeout(idleTimer);
      // Reset guideDismissed when user logs in
      localStorage.removeItem("guideDismissed");
    }
  }, [isAuthenticated, idleTimer]);

  const handleDismiss = () => {
    setShowGuide(false);
    // Set guideDismissed to true so it won't show until next sign-in cycle
    localStorage.setItem("guideDismissed", "true");
    if (idleTimer) clearTimeout(idleTimer);
  };

  if (!showGuide || isAuthenticated) return null;

  return (
    <div className="fixed z-30 top-16 left-4 transition-all duration-300 ease-in-out">
      {/* Guide bubble with improved animations */}
      <div className="relative flex flex-col items-start">
        <div className="mt-2 bg-surface-card border border-primary/70 p-4 rounded-lg shadow-lg max-w-xs relative animate-slideUp">
          <div className="absolute -top-2 left-4 w-4 h-4 rotate-45 bg-surface-card border-t border-l border-primary/70"></div>
          
          <button 
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 bg-surface-card text-text-secondary hover:text-error p-1 rounded-full border border-border-primary shadow-sm transition-colors duration-200"
            aria-label="Close guide"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="bg-primary/15 p-2 rounded-full">
              <BsPersonLinesFill className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">จิ้มที่ปุ่มนี้เพื่มล็อคอิน</h3>
              <p className="text-sm text-text-secondary mt-1">ล็อคอินเพื่อเริ่มสั่งสินค้า</p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <button 
              onClick={handleDismiss}
              className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors duration-200"
            >
              รับทราบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}