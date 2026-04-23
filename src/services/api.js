import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Envoie automatiquement le cookie httpOnly
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor : envoyer le token CSRF sur chaque requête mutative
api.interceptors.request.use((config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
    const csrfCookie = document.cookie
      .split('; ')
      .find((c) => c.startsWith('csrf_token='));
    if (csrfCookie) {
      config.headers['X-CSRF-Token'] = csrfCookie.split('=')[1];
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas traiter les erreurs réseau comme des 401
    if (!error.response) {
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthFlow =
        requestUrl.includes('/admin-auth/') ||
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/resend') ||
        requestUrl.includes('/auth/me') ||
        requestUrl.includes('/auth/reset-password');

      if (!isAuthFlow && window.location.pathname !== '/connexion') {
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
