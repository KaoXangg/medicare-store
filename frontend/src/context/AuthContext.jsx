import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { trackEvent, trackEventNow } from '../services/activityTracker';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // api interceptor trả res.data luôn
  // GET /auth/profile  → { success, data: { UserId, Avatar, FullName, ... } }
  // POST /auth/login   → { success, data: { user, token, refreshToken } }

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data); // res = { success, data: user } → res.data = user object
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

 const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', res.data.token);
  setUser(res.data.user);
  trackEvent('login', {});
  return res;
};

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res;
  };

  const logout = async () => {
    // Dùng trackEventNow (gửi ngay lập tức) thay vì trackEvent (đẩy hàng đợi, đợi 5s) —
    // vì token sắp bị xoá ngay sau đây, nếu dùng hàng đợi thường thì lúc flush() chạy
    // token đã mất, sự kiện sẽ bị huỷ bỏ âm thầm, không bao giờ ghi lại được.
    await trackEventNow('logout', {});
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    setUser(res.data); // res = { success, data: user } → res.data = user object
  };

  const isAdmin = user?.Role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, isAdmin, loadUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);