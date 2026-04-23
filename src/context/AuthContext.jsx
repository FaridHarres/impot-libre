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

  // Nettoyage de l'ancien localStorage (migration one-time)
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // Vérification de session au montage — source de vérité unique
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await api.get('/auth/me');
        if (!cancelled) {
          const userData = response.data.user || response.data;
          setUser(userData);
          setNetworkError(false);
        }
      } catch (err) {
        if (cancelled) return;

        if (!err.response) {
          // Erreur réseau — ne pas déconnecter
          setNetworkError(true);
          // Retry toutes les 10 secondes
          retryRef.current = setTimeout(() => {
            if (!cancelled) checkSession();
          }, 10000);
        } else {
          // 401 ou autre erreur HTTP — session invalide
          setUser(null);
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
      const userData = response.data.user;
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
      // Silencieux — le cookie sera expiré de toute façon
    }
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
