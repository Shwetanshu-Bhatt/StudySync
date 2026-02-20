import axios from 'axios';

const api = axios.create({
  baseURL: (() => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      const cleanUrl = envUrl.replace(/\/$/, '').replace(/\/api$/, '');
      return cleanUrl + '/api';
    }
    return 'http://localhost:5000/api';
  })(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
