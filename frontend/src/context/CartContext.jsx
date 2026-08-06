import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import { trackEvent } from '../services/activityTracker';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const emptyCart = { items: [], total: 0, count: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(emptyCart);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCart(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addToCart = async (productId, quantity = 1, productName = '') => {
    const res = await api.post('/cart', { productId, quantity });
    trackEvent('add_to_cart', { productId, productName, qty: quantity });
    setCart((prev) => {
      const existing = prev.items?.find((i) => i.ProductId === productId);
      if (existing) {
        const items = prev.items.map((i) =>
          i.ProductId === productId
            ? { ...i, Quantity: i.Quantity + quantity, subtotal: (i.effectivePrice || 0) * (i.Quantity + quantity) }
            : i
        );
        const total = items.reduce((s, i) => s + (i.subtotal || 0), 0);
        return { items, total, count: items.reduce((s, i) => s + i.Quantity, 0) };
      }
      const count = (prev.count || 0) + quantity;
      return { ...prev, count, total: prev.total };
    });
    fetchCart().catch(() => {});
    return res;
  };

  const updateQuantity = async (cartId, quantity) => {
    setCart((prev) => {
      const items = prev.items.map((i) =>
        i.CartId === cartId
          ? { ...i, Quantity: quantity, subtotal: (i.effectivePrice || 0) * quantity }
          : i
      );
      const total = items.reduce((s, i) => s + (i.subtotal || 0), 0);
      return { items, total, count: items.reduce((s, i) => s + i.Quantity, 0) };
    });
    await api.put(`/cart/${cartId}`, { quantity });
    fetchCart().catch(() => {});
  };

  const removeItem = async (cartId) => {
    setCart((prev) => {
      const items = prev.items.filter((i) => i.CartId !== cartId);
      const total = items.reduce((s, i) => s + (i.subtotal || 0), 0);
      return { items, total, count: items.reduce((s, i) => s + i.Quantity, 0) };
    });
    await api.delete(`/cart/${cartId}`);
    fetchCart().catch(() => {});
  };

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, addToCart, updateQuantity, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);