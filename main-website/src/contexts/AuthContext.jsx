import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = await localStorage.getItem('customerAuthToken');
      if (storedToken) {
        setToken(storedToken);
        axios.defaults.headers.common['x-auth-token'] = storedToken;
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user`);
          setUser(res.data);
        } catch (err) {
          console.error(err);
          logout();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, { email, password });
      setToken(res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      await localStorage.setItem('customerAuthToken', res.data.token);
      const userRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user`);
      setUser(userRes.data);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.msg || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, userData);
      setToken(res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      await localStorage.setItem('customerAuthToken', res.data.token);
      const userRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user`);
      setUser(userRes.data);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.msg || 'Registration failed' };
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['x-auth-token'];
    await localStorage.removeItem('customerAuthToken');
  };

  const updateProfile = async (data) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/auth/user`, data);
      const userRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user`);
      setUser(userRes.data);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.msg || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      token,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
