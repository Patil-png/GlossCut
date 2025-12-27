import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAdmin = async () => {
      const storedToken = localStorage.getItem('adminToken');
      if (storedToken) {
        setToken(storedToken);
        axios.defaults.headers.common['x-auth-token'] = storedToken;
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/auth/admin`);
          setAdmin(res.data);
        } catch (err) {
          console.error('Error loading admin:', err);
          localStorage.removeItem('adminToken');
        }
      }
      setIsLoading(false);
    };

    loadAdmin();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/auth/login`, { email, password });
      setToken(res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      localStorage.setItem('adminToken', res.data.token);
      const adminRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/auth/admin`);
      setAdmin(adminRes.data);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = async () => {
    setToken(null);
    setAdmin(null);
    delete axios.defaults.headers.common['x-auth-token'];
    localStorage.removeItem('adminToken');
  };

  return (
    <AdminAuthContext.Provider value={{
      admin,
      token,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
