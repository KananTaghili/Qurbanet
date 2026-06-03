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
      const wasLoggedIn = !!localStorage.getItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login only if user had a real session (not during guest creation)
      if (wasLoggedIn && !err.config?.url?.includes('/auth/')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
export { BASE_URL };
