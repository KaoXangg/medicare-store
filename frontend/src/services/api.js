import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
    return Promise.reject({ message, errors: err.response?.data?.errors, status: err.response?.status });
  }
);

export const getImageUrl = (path) => {
  const fallback = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=400&fit=crop';
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const uploadBase = import.meta.env.VITE_UPLOAD_URL?.replace(/\/$/, '');
  if (uploadBase) return `${uploadBase}${normalized}`;
  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');
  if (normalized.startsWith('/uploads/') && apiBase.startsWith('http')) {
    return `${apiBase}${normalized}`;
  }
  return normalized;
};

export default api;
