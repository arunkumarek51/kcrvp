import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Axios instance
export const api = axios.create({ baseURL: API });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('kcrvp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kcrvp_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState(null);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('kcrvp_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('kcrvp_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  useEffect(() => {
    api.get('/stats/platform').then(({ data }) => {
      if (data.success) setPlatformStats(data.stats);
    }).catch(() => {});
  }, []);

const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('kcrvp_token', data.token);
    setUser(data.user);
    window.location.href = '/dashboard';
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('kcrvp_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('kcrvp_token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = async (updates) => {
    const { data } = await api.put('/auth/update-profile', updates);
    setUser(data.user);
    return data.user;
  };

  const refreshUser = () => fetchMe();

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser, platformStats }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
