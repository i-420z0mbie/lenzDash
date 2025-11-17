// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // You might want to add an endpoint to get current user info
      // For now, we'll assume the token is valid if it exists
      const token = localStorage.getItem('access_token');
      if (token) {
        // Fetch user profile or verify token
        setUser({ username: 'Admin' }); // Placeholder
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {

      const response = await api.post('main/api/token/', credentials); 
      const { access, refresh } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);


      api.defaults.headers.common.Authorization = `Bearer ${access}`;


      setUser({ username: credentials.username });

      return { success: true };
    } catch (error) {

      const serverMessage = error.response?.data?.detail || error.response?.data || 'Login failed';
      return { success: false, error: serverMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    delete api.defaults.headers.Authorization;
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};