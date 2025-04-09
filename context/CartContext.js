// context/CartContext.js
"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import AuthContext from "@/context/AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user, lineProfile, status } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [productCache, setProductCache] = useState({}); // Cache for full product details

  const isAuthenticated = status === "authenticated" || !!user || !!lineProfile;

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/cart");
      if (!response.ok) throw new Error("Failed to fetch cart");
      const { cart } = await response.json();
      setCartItems(cart || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
      //toast.error("Failed to load your cart");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch full product details and cache them
  const fetchProductDetails = useCallback(async (productId) => {
    if (productCache[productId]) {
      return productCache[productId]; // Return cached data if available
    }

    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch product details");
      const product = await response.json();
      setProductCache((prev) => ({ ...prev, [productId]: product }));
      return product;
    } catch (error) {
      console.error("Error fetching product details:", error);
      return null; // Return null if fetch fails
    }
  }, [productCache]);

  const fetchProductStock = useCallback(async (productId) => {
    const product = await fetchProductDetails(productId);
    return product ? product.quantity || 0 : 0; // Use cached product or fetch and return quantity
  }, [fetchProductDetails]);

  const addToCart = useCallback(async (product) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart");
      return false;
    }

    setLoading(true);
    try {
      const productId = product.id;
      const existingItem = cartItems.find((item) => item.productId === productId);
      const currentStock = await fetchProductStock(productId);

      const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
      if (newQuantity > currentStock) {
        toast.error(`Cannot add more ${product.name}. Only ${currentStock} left in stock.`);
        return false;
      }

      let response;
      if (existingItem) {
        response = await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: newQuantity }),
        });
      } else {
        response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: {
              id: productId,
              name: product.name,
              price: product.price,
              image: product.image || "/images/placeholder.jpg",
              variant: product.variant || {},
            },
          }),
        });
      }

      if (!response.ok) throw new Error("Failed to add to cart");

      const { cart } = await response.json();
      setCartItems(cart || []);
      return cart;
    } catch (error) {
      console.error("Cart operation error:", error);
      toast.error(error.message || "Failed to modify cart");
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, cartItems, fetchProductStock]);

  const removeFromCart = useCallback(async (productId) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to modify cart");
      return;
    }

    setLoading(true);
    try {
      const itemToRemove = cartItems.find((item) => item.productId === productId);
      if (!itemToRemove) return;

      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) throw new Error("Failed to remove from cart");

      const { cart } = await response.json();
      setCartItems(cart || []);
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove item");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, cartItems]);

  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to modify cart");
      return;
    }

    setLoading(true);
    try {
      const currentStock = await fetchProductStock(productId);
      if (newQuantity > currentStock) {
        toast.error(`Cannot set quantity to ${newQuantity}. Only ${currentStock} left in stock.`);
        return;
      }

      if (newQuantity < 1) {
        await removeFromCart(productId);
        return;
      }

      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });

      if (!response.ok) throw new Error("Failed to update quantity");

      const { cart } = await response.json();
      setCartItems(cart || []);
    } catch (error) {
      console.error("Update quantity error:", error);
      toast.error("Failed to update quantity");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, removeFromCart, fetchProductStock]);

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to clear cart");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/cart/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to clear cart");

      setCartItems([]);
      toast.success("Cart cleared");
    } catch (error) {
      console.error("Clear cart error:", error);
      toast.error("Failed to clear cart");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const getCartSummary = useCallback(() => {
    const summary = cartItems.reduce(
      (acc, item) => {
        const itemTotal = item.price * item.quantity;
        return {
          totalItems: acc.totalItems + item.quantity,
          subtotal: acc.subtotal + itemTotal,
          itemCount: acc.itemCount + 1,
        };
      },
      { totalItems: 0, subtotal: 0, itemCount: 0 }
    );
    return {
      ...summary,
      total: summary.subtotal,
      isEmpty: summary.itemCount === 0,
    };
  }, [cartItems]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loading,
    getCartSummary,
    isSyncing,
    fetchProductStock,
    fetchProductDetails, // Expose for ProductModal
    productCache, // Expose cached products
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};