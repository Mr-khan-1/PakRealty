import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://pakrealty-production.up.railway.app';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request interceptor: attach JWT token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale token but don't force redirect (let React Router handle it)
      Cookies.remove('token');
    }
    return Promise.reject(error);
  }
);

export default api;
