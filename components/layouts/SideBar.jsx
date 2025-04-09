"use client";
import React, { useState, useCallback, useContext, useEffect } from "react";
import Link from "next/link";
import { Menu, User, X, Home, Tag, Sparkles, LogOut, ChevronRight, Settings, Shield, Copy, Eye, EyeOff, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import AuthContext from "@/context/AuthContext";
import SigninModal from "@/components/auth/SigninModal";
import SignoutModal from "@/components/auth/SignoutModal";
import { FaLine } from "react-icons/fa";
import { useSidebar } from "@/context/SidebarContext";
import SigninGuide from "./SigninGuide";

// Export sidebar content for Search.jsx
export const sidebarContent = [
  { href: "/", name: "Home", content: "Return to the homepage", icon: Home },
  { href: "/categories", name: "Categories", content: "Browse product categories", icon: Tag },
  { href: "/new-arrivals", name: "New Arrivals", content: "Check out the latest products", icon: Sparkles },
  { href: "/wishlist", name: "Wishlist", content: "View your saved items", icon: Heart },
  { href: "/account", name: "Account Settings", content: "Manage your account details", icon: Settings },
];

export default function SideBar() {
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [isSigninModalOpen, setIsSigninModalOpen] = useState(false);
  const [isSignoutModalOpen, setIsSignoutModalOpen] = useState(false);
  const [isLineLoading, setIsLineLoading] = useState(false);
  const [showUserId, setShowUserId] = useState(false);
  const [showSigninGuide, setShowSigninGuide] = useState(false);
  const [highlightedLink, setHighlightedLink] = useState("");

  const { user, lineProfile, lineSignIn, adminSignIn, logoutUser, status } = useContext(AuthContext);

  useEffect(() => {
    const handleOpenSidebar = (e) => {
      const { href, keyword } = e.detail;
      openSidebar();
      setHighlightedLink(href);
      setTimeout(() => setHighlightedLink(""), 3000);
    };
    document.addEventListener("openSidebar", handleOpenSidebar);
    return () => document.removeEventListener("openSidebar", handleOpenSidebar);
  }, [openSidebar]);

  const handleLineSignIn = useCallback(async () => {
    setIsLineLoading(true);
    try {
      const { default: liff } = await import("@line/liff");
      if (!liff._liffId) {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID });
      }

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: `${window.location.origin}/auth/callback/line` });
        return;
      }

      const profile = await liff.getProfile();
      const result = await lineSignIn(profile);

      if (!result.success) {
        throw new Error(result.message);
      }

      closeSidebar();
    } catch (error) {
      console.error("LINE login error:", error);
      if (!error.message?.includes("redirect")) {
        toast.error("LINE login failed. Please try again.");
      }
    } finally {
      setIsLineLoading(false);
    }
  }, [lineSignIn, closeSidebar]);

  const handleLogoutConfirmation = useCallback(() => {
    setIsSignoutModalOpen(true);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      const result = await logoutUser();
      if (result.success) {
        setIsSignoutModalOpen(false);
        closeSidebar();
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to sign out completely");
    }
  }, [logoutUser, closeSidebar]);

  const copyUserId = useCallback(() => {
    const userId = user?.lineId || lineProfile?.userId;
    if (userId) {
      navigator.clipboard.writeText(userId);
      toast.success("User ID copied to clipboard");
    }
  }, [user, lineProfile]);

  const getUserAvatar = useCallback(() => {
    if (user?.role === "admin") {
      return (
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Shield className="h-5 w-5 text-blue-600" />
        </div>
      );
    }
    if (user?.image || lineProfile?.pictureUrl) {
      return (
        <img
          src={user?.image || lineProfile?.pictureUrl}
          alt="Profile"
          className="h-10 w-10 rounded-full object-cover"
          loading="lazy"
        />
      );
    }
    return (
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        <User className="h-6 w-6 text-primary" />
      </div>
    );
  }, [user, lineProfile]);

  const getUserRoleBadge = useCallback(() => {
    if (!user?.role) return null;
    return (
      <span
        className={`text-xs px-2 py-1 rounded-full ${
          user.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
        }`}
      >
        {user.role}
      </span>
    );
  }, [user]);

  const renderUserInfo = useCallback(() => {
    if (user?.email) {
      return user.email;
    } else if (user?.lineId || lineProfile?.userId) {
      return (
        <div className="flex flex-col space-y-2">
          <span className="truncate">{user?.name || lineProfile?.displayName || "LINE User"}</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowUserId(!showUserId)}
              className="p-1 rounded hover:bg-container"
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
                  onClick={copyUserId}
                  className="p-1 rounded hover:bg-container flex-shrink-0"
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
    return "Sign in to access more features";
  }, [user, lineProfile, showUserId, copyUserId]);

  const isAuthenticated = status === "authenticated" || !!user || !!lineProfile;

  const handleGuestClick = () => {
    if (!isAuthenticated) {
      setShowSigninGuide(true);
      toast.info("Please sign in to access your account settings!", { autoClose: 3000 });
      setTimeout(() => setShowSigninGuide(false), 3000);
    } else {
      closeSidebar();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 h-full w-80 bg-surface-card shadow-2xl z-50 border-r border-border-primary"
            >
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border-primary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getUserAvatar()}
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h2 className="font-semibold text-foreground truncate">
                            {user?.name || lineProfile?.displayName || "Guest"}
                          </h2>
                          {getUserRoleBadge()}
                        </div>
                        <p className="text-sm text-text-secondary">{renderUserInfo()}</p>
                      </div>
                    </div>
                    <button
                      onClick={closeSidebar}
                      className="p-2 hover:bg-container rounded-full flex-shrink-0"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5 text-foreground" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                  <div className="space-y-1 px-3">
                    {sidebarContent
                      .filter((item) => item.href !== "/account")
                      .map(({ href, icon: Icon, name }) => (
                        <Link
                          key={href}
                          href={href}
                          className={`w-full flex items-center justify-between space-x-2 px-4 py-3 rounded-lg hover:bg-container transition-colors group ${
                            highlightedLink === href ? "highlight" : ""
                          }`}
                          onClick={closeSidebar}
                          data-search-term={name.toLowerCase()}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5 text-text-secondary group-hover:text-primary" />
                            <span className="text-foreground">{name}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-primary" />
                        </Link>
                      ))}
                    {isAuthenticated ? (
                      <Link
                        href="/account"
                        className={`w-full flex items-center justify-between space-x-2 px-4 py-3 rounded-lg hover:bg-container transition-colors group ${
                          highlightedLink === "/account" ? "highlight" : ""
                        }`}
                        onClick={closeSidebar}
                        data-search-term="account settings"
                      >
                        <div className="flex items-center space-x-3">
                          <Settings className="h-5 w-5 text-text-secondary group-hover:text-primary" />
                          <span className="text-foreground">Account Settings</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-primary" />
                      </Link>
                    ) : (
                      <button
                        onClick={handleGuestClick}
                        className={`w-full flex items-center justify-between space-x-2 px-4 py-3 rounded-lg hover:bg-container transition-colors group ${
                          highlightedLink === "/account" ? "highlight" : ""
                        }`}
                        data-search-term="account settings"
                      >
                        <div className="flex items-center space-x-3">
                          <Settings className="h-5 w-5 text-text-secondary group-hover:text-primary" />
                          <span className="text-foreground">Account Settings</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-primary" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-border-primary relative">
                  {isAuthenticated ? (
                    <button
                      onClick={handleLogoutConfirmation}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-container hover:bg-container/80 transition-colors"
                    >
                      <LogOut className="h-5 w-5 text-foreground" />
                      <span className="text-foreground">Sign Out</span>
                    </button>
                  ) : (
                    <div className="space-y-2 relative">
                      <AnimatePresence>
                        {showSigninGuide && <SigninGuide />}
                      </AnimatePresence>
                      <button
                        onClick={handleLineSignIn}
                        disabled={isLineLoading}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-[#06C755] text-text-inverted hover:bg-[#05b54d] transition-colors"
                      >
                        {isLineLoading ? (
                          <>
                            <span className="animate-spin h-5 w-5 border-2 border-text-inverted border-t-transparent rounded-full" />
                            <span>Signing in...</span>
                          </>
                        ) : (
                          <>
                            <FaLine className="h-5 w-5" />
                            <span>Sign in with LINE</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setIsSigninModalOpen(true)}
                        className="w-full btn-primary flex items-center justify-center space-x-2 px-4 py-2 rounded-lg"
                      >
                        <User className="h-5 w-5" />
                        <span>Admin Sign In</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SigninModal
        isOpen={isSigninModalOpen}
        onClose={() => setIsSigninModalOpen(false)}
        adminSignIn={adminSignIn}
      />

      <SignoutModal
        isOpen={isSignoutModalOpen}
        onClose={() => setIsSignoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}