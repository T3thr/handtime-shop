// hooks/useCart.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(item => item.id === product.id);

        if (existingItem) {
          const updatedItems = currentItems.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
          set({ items: updatedItems });
        } else {
          set({ items: [...currentItems, { ...product, quantity: 1 }] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter(item => item.id !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map(item =>
            item.id === productId
              ? { ...item, quantity }
              : item
          )
        });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + (item.price * item.quantity),
          0
        );
      }
    }),
    {
      name: 'shopping-cart',
      getStorage: () => localStorage
    }
  )
);

const useCart = () => {
  const cart = useCartStore();
  return {
    cartItems: cart.items,
    addToCart: cart.addItem,
    removeFromCart: cart.removeItem,
    updateQuantity: cart.updateQuantity,
    clearCart: cart.clearCart,
    cartTotal: cart.getTotal(),
  };
};

export default useCart;