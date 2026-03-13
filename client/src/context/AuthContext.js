import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authStorage } from '../utils/authStorage';
import apiClient from '../utils/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ใช้ apiClient จาก axiosConfig (มี baseURL = REACT_APP_API_URL + interceptors อยู่แล้ว)

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
      const response = await apiClient.post('/api/auth/login', { email, password });
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
      await apiClient.post('/api/auth/register', {
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
