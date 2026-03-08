import axios from 'axios';
import { authStorage } from './authStorage';

// โปรเจกต์นี้ใช้ Create React App → ใช้ REACT_APP_ (ถ้าเป็น Vite ต้องใช้ VITE_ และ import.meta.env.VITE_API_URL)
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  withCredentials: true, // ส่ง Cookie/Session ได้
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - เพิ่ม token (ใช้ sessionStorage แยกตามแท็บ)
apiClient.interceptors.request.use(
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

// Response interceptor - จัดการ 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStorage.clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

