import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      // Ne pas rediriger pendant le flow 2FA admin ou la vérification login
      const isAuthFlow =
        requestUrl.includes('/admin-auth/') ||
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/resend');
      if (!isAuthFlow) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/connexion') {
          window.location.href = '/connexion';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
