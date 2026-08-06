import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setIds([]);
      return;
    }
    try {
      const res = await api.get('/wishlist/ids');
      setIds(res.data || []);
    } catch {
      setIds([]);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = async (productId) => {
    if (!user) throw new Error('Vui lòng đăng nhập');
    const has = ids.includes(productId);
    if (has) {
      await api.delete(`/wishlist/${productId}`);
      setIds((prev) => prev.filter((id) => id !== productId));
      return false;
    }
    await api.post('/wishlist', { productId });
    setIds((prev) => [...prev, productId]);
    return true;
  };

  const isWishlisted = (productId) => ids.includes(productId);

  return (
    <WishlistContext.Provider value={{ ids, count: ids.length, refresh, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
