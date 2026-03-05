import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { authStorage } from '../utils/authStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Axios interceptor for automatic token attachment (ใช้ sessionStorage แยกตามแท็บ)
axios.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios interceptor for handling 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStorage.clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authStorage.getToken();
    const savedUser = authStorage.getUser();

    if (token && savedUser) {
      setUser(savedUser);
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { user, token } = response.data;

      authStorage.setAuth(token, user);
      setUser(user);

      toast.success('เข้าสู่ระบบสำเร็จ!');
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (email, password, name, role = 'user', address = '', phone = '') => {
    try {
      await axios.post('/api/auth/register', {
        email,
        password,
        name,
        role,
        address,
        phone
      });
      toast.success('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    authStorage.clearAuth();
    setUser(null);
    toast.success('ออกจากระบบสำเร็จ');
    window.location.href = '/login';
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    authStorage.setUser(updatedUser);
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAdmin: user?.role === 'admin',
    isLoggedIn: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
