import axios from 'axios';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        const isRealUser = storedUser && !storedUser.isGuest;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect real (non-guest) users whose session expired,
        // and only when not already calling an auth endpoint
        if (isRealUser && !err.config?.url?.includes('/auth/')) {
          window.location.href = '/auth/login';
        }
      } catch { /* ignore parse errors */ }
    }
    return Promise.reject(err);
  }
);

export default api;
export { BASE_URL };
