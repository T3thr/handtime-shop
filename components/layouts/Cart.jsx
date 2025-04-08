// components/layouts/Cart.jsx
"use client";
import React, { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import LineCheckoutModal from "./LineCheckoutModal";
import AuthContext from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const Cart = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, getCartSummary, fetchProductStock } = useCart();
  const { subtotal, totalItems } = getCartSummary();
  const { user, lineProfile, status } = useContext(AuthContext);
  const [isLineCheckoutModalOpen, setIsLineCheckoutModalOpen] = useState(false);
  const [stockLimits, setStockLimits] = useState({});
  const router = useRouter();

  const isAuthenticated = status === "authenticated" || !!user || !!lineProfile;

  useEffect(() => {
    const fetchStock = async () => {
      const limits = {};
      for (const item of cartItems) {
        const stock = await fetchProductStock(item.productId);
        limits[item.productId] = stock;
      }
      setStockLimits(limits);
    };
    if (cartItems.length > 0) fetchStock();
  }, [cartItems, fetchProductStock]);

  const slideVariants = {
    mobile: {
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
    },
    desktop: {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
    },
  };

  const handleProceedToCheckout = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to proceed to checkout");
      router.push("/auth/signin");
      return;
    }
    setIsLineCheckoutModalOpen(true);
  };

  const handleCloseLineCheckoutModal = () => {
    setIsLineCheckoutModalOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-surface-card rounded-t-3xl shadow-2xl z-50 md:hidden"
              variants={slideVariants.mobile}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <CartContent
                cartItems={cartItems}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                subtotal={subtotal}
                totalItems={totalItems}
                stockLimits={stockLimits}
                onClose={onClose}
                onCheckout={handleProceedToCheckout}
                isMobile={true}
                isAuthenticated={isAuthenticated}
              />
            </motion.div>
            <motion.div
              className="fixed top-0 right-0 h-full w-[400px] bg-surface-card shadow-2xl z-50 hidden md:block"
              variants={slideVariants.desktop}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <CartContent
                cartItems={cartItems}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                subtotal={subtotal}
                totalItems={totalItems}
                stockLimits={stockLimits}
                onClose={onClose}
                onCheckout={handleProceedToCheckout}
                isMobile={false}
                isAuthenticated={isAuthenticated}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <LineCheckoutModal isOpen={isLineCheckoutModalOpen} onClose={handleCloseLineCheckoutModal} />
    </>
  );
};

const CartContent = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  subtotal,
  totalItems,
  stockLimits,
  onClose,
  onCheckout,
  isMobile,
  isAuthenticated,
}) => {
  return (
    <div className="flex flex-col h-full bg-surface-card transition-colors duration-300">
      <div className="p-4 border-b border-border-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-text-primary">Shopping Cart</h2>
            <span className="text-sm text-text-muted">
              ({totalItems} {totalItems === 1 ? "item" : "items"})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-interactive-muted rounded-full transition-colors duration-200"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>
      </div>
      {cartItems.length > 0 ? (
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4 px-4">
            {cartItems.map((item) => (
              <div
                key={item.productId}
                className="flex space-x-4 p-4 bg-background-secondary rounded-lg transition-colors duration-200"
              >
                <div className="relative h-20 w-20 flex-shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover rounded-md" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text-primary truncate">{item.name}</h3>
                  <p className="text-sm text-text-muted mt-1">฿{item.price.toFixed(2)}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                      className="p-1 hover:bg-interactive-muted rounded transition-colors duration-200"
                    >
                      <Minus className="h-4 w-4 text-text-secondary" />
                    </button>
                    <span className="w-8 text-center text-text-primary">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= (stockLimits[item.productId] || Infinity)}
                      className={`p-1 rounded transition-colors duration-200 ${
                        item.quantity >= (stockLimits[item.productId] || Infinity)
                          ? "cursor-not-allowed text-text-muted"
                          : "hover:bg-interactive-muted text-text-secondary"
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1 text-error hover:bg-error/20 rounded ml-2 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">Your cart is empty</h3>
          <p className="text-text-muted mb-4">Looks like you haven't added any items yet</p>
          <button
            className="inline-flex items-center px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-200"
            onClick={onClose}
          >
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      )}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-border-primary">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-text-primary">Subtotal</span>
              <span className="text-lg font-semibold text-text-primary">฿{subtotal.toFixed(2)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-3 px-4 bg-[#06C755] text-white rounded-lg hover:bg-[#05b54d] transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>Order via LINE</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;