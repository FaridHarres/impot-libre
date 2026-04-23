import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkError, setNetworkError] = useState(false);
  const retryRef = useRef(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Vérification de session au montage
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      // Essayer d'abord avec le token localStorage (cross-origin fallback)
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore
        }
      }

      try {
        const response = await api.get('/auth/me');
        if (!cancelled) {
          const userData = response.data.user || response.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          setNetworkError(false);
        }
      } catch (err) {
        if (cancelled) return;

        if (!err.response) {
          setNetworkError(true);
          retryRef.current = setTimeout(() => {
            if (!cancelled) checkSession();
          }, 10000);
        } else {
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setNetworkError(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkSession();

    return () => {
      cancelled = true;
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      if (token) {
        localStorage.setItem('token', token);
      }
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setNetworkError(false);
      return userData;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Une erreur est survenue lors de la connexion.';
      setError(message);

      const enrichedError = new Error(message);
      enrichedError.response = err.response;
      enrichedError.errorCode = err.response?.data?.error;
      throw enrichedError;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Une erreur est survenue lors de l'inscription.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Silencieux
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
    setNetworkError(false);
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    loading,
    error,
    networkError,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
