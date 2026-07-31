import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await api.get('/admin/me', {
        validateStatus: (status) => status === 200 || status === 401
      });
      if (res.status === 200 && res.data.success && res.data.admin) {
        setIsAdmin(true);
        setAdminInfo(res.data.admin);
      } else {
        setIsAdmin(false);
        setAdminInfo(null);
      }
    } catch (error) {
      setIsAdmin(false);
      setAdminInfo(null);
      // Keep real server errors (500, network failures) visible in the console
      if (!error.response || error.response.status !== 401) {
        console.error('Admin Auth Error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/admin/login', { identifier, password });
    if (res.data.success) {
      setIsAdmin(true);
      setAdminInfo(res.data.admin);
      return res.data;
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/admin/logout');
    } catch (err) {
      console.warn('Logout error', err);
    }
    setIsAdmin(false);
    setAdminInfo(null);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, adminInfo, loading, login, logout, checkAuth }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
