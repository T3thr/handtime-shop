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
  const [productCache, setProductCache] = useState({});

  const isAuthenticated = status === "authenticated" || !!user || !!lineProfile;

  const fetchProductDetails = useCallback(async (productId) => {
    if (!productId) return null;
    if (productCache[productId]) return productCache[productId];

    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error(`Failed to fetch product ${productId}`);
      const product = await response.json();
      const enrichedProduct = {
        id: product._id,
        productId: product._id,
        name: product.title || product.name || "Unknown Product",
        price: Number(product.price) || 0,
        image: product.images?.[0]?.url || product.image || "/images/placeholder.jpg",
        quantity: Number(product.quantity) || 0,
        variant: product.variants?.[0] || product.variant || {},
      };
      setProductCache((prev) => ({ ...prev, [productId]: enrichedProduct }));
      return enrichedProduct;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      return null;
    }
  }, [productCache]);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/cart");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch cart");
      }
      const { cart } = await response.json();
      // Enrich cart items with product details if needed
      const enrichedCart = await Promise.all(
        (cart || []).map(async (item) => {
          const product = await fetchProductDetails(item.productId);
          return {
            productId: item.productId,
            name: item.name || product?.name || "Unknown Product",
            price: Number(item.price) || product?.price || 0,
            quantity: Number(item.quantity) || 1,
            image: item.image || product?.image || "/images/placeholder.jpg",
            variant: item.variant || product?.variant || {},
          };
        })
      );
      setCartItems(enrichedCart);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error(`Failed to load cart: ${error.message}`);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchProductDetails]);

  const fetchProductStock = useCallback(async (productId) => {
    const product = await fetchProductDetails(productId);
    return product ? product.quantity || 0 : 0;
  }, [fetchProductDetails]);

  const addToCart = useCallback(async (product) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart");
      return false;
    }

    setLoading(true);
    try {
      const productId = product.id || product.productId;
      const existingItem = cartItems.find((item) => item.productId === productId);
      const currentStock = await fetchProductStock(productId);

      if (currentStock === 0) {
        toast.error(`${product.name} is out of stock.`);
        return false;
      }

      const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
      if (newQuantity > currentStock) {
        toast.error(`Cannot add ${product.name}. Only ${currentStock} left in stock.`);
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add to cart");
      }

      await fetchCart(); // Refresh cart after modification
      toast.success(`${product.name} added to cart`);
      return true;
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(error.message || "Failed to add to cart");
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, cartItems, fetchProductStock, fetchCart]);

  const removeFromCart = useCallback(async (productId) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to modify cart");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove from cart");
      }

      await fetchCart();
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Remove from cart error:", error);
      toast.error(error.message || "Failed to remove item");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchCart]);

  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to modify cart");
      return;
    }

    setLoading(true);
    try {
      const currentStock = await fetchProductStock(productId);
      const item = cartItems.find((i) => i.productId === productId);

      if (newQuantity > currentStock) {
        toast.error(`Cannot set ${item?.name || "item"} quantity to ${newQuantity}. Only ${currentStock} left in stock.`);
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update quantity");
      }

      await fetchCart();
      toast.success("Quantity updated");
    } catch (error) {
      console.error("Update quantity error:", error);
      toast.error(error.message || "Failed to update quantity");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, cartItems, fetchProductStock, removeFromCart, fetchCart]);

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to clear cart");
      }

      setCartItems([]);
      toast.success("Cart cleared");
    } catch (error) {
      console.error("Clear cart error:", error);
      toast.error(error.message || "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const getCartSummary = useCallback(() => {
    const summary = cartItems.reduce(
      (acc, item) => {
        const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        return {
          totalItems: acc.totalItems + (Number(item.quantity) || 0),
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
    fetchProductDetails,
    productCache,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};