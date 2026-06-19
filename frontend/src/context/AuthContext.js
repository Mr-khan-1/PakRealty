import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => Cookies.get('token') || null);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(() => {
    Cookies.remove('token');
    setToken(null);
    setUser(null);
  }, []);

  const handleLogin = useCallback((newToken, userData) => {
    Cookies.set('token', newToken, { expires: 7, sameSite: 'lax' });
    setToken(newToken);
    setUser(userData);
  }, []);

  // Load user from stored token on mount
  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      const storedToken = Cookies.get('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!cancelled && res.data?.user) {
          setUser(res.data.user);
          setToken(storedToken);
        } else if (!cancelled) {
          handleLogout();
        }
      } catch {
        if (!cancelled) handleLogout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUser();
    return () => { cancelled = true; };
  }, [handleLogout]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login:  handleLogin,
    logout: handleLogout,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
