"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { Menu, ShoppingCart, Search as SearchIcon } from "lucide-react";
import { BsPersonLinesFill } from "react-icons/bs";
import Cart from "./Cart";
import SideBar from "./SideBar";
import Search from "./Search";
import StartGuide from "./StartGuide";
import { useSidebar } from "@/context/SidebarContext";

export default function NavBar({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { data: session } = useSession();
  const { cartItems, getCartSummary } = useCart();
  const { totalItems, subtotal } = getCartSummary();
  const { openSidebar } = useSidebar();

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <>
      <nav
        className={`fixed w-full z-40 transition-all duration-300 ${
          isScrolled ? "bg-surface-card/95 shadow-md backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side: Menu and Logo */}
            <div className="flex items-center">
              <button
                onClick={openSidebar}
                className="p-2 hover:bg-primary bg-primary-10 rounded-full transition-all duration-300 shadow-md hover:scale-105"
                aria-label="Open menu"
              >
                <BsPersonLinesFill className="h-6 w-6 text-foreground group-hover:text-white transition-colors" />
              </button>

              <Link href="/" className="ml-4 flex-shrink-0" aria-label="Home">
                <h1 className="text-xl lg:text-3xl font-bold text-primary">Hand Time Shop</h1>
              </Link>
            </div>

            {/* Center: Search (only on md and above) */}
            <div className="hidden md:flex flex-1 justify-center px-4 sm:px-8">
              <Search />
            </div>

            {/* Right side: Search and Cart */}
            <div className="flex items-center space-x-2">
              {/* Mobile Search button (only on small screens) */}
              <div className="md:hidden">
                <Search />
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-container rounded-lg transition-colors group"
                aria-label="Cart"
              >
                <ShoppingCart className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                {totalItems > 0 && (
                  <>
                    <div className="absolute -top-2 -right-2">
                      <span className="flex h-5 w-5 items-center justify-center bg-primary text-text-inverted text-xs font-bold rounded-full">
                        {Math.min(totalItems, 99)}
                        {totalItems > 99 ? "+" : ""}
                      </span>
                    </div>
                    <div className="absolute right-0 mt-2 w-72 bg-surface-card rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-colors pointer-events-none border border-border-primary">
                      <div className="p-4">
                        <div className="text-sm font-medium text-foreground">Cart Summary</div>
                        <div className="mt-2 text-xs text-text-secondary">
                          {totalItems} items · ฿{subtotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <SideBar />
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <StartGuide />
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { onOpenSidebar: openSidebar })
      )}
    </>
  );
}