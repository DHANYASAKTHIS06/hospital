import axios from 'axios';

// Render backend URL fallback or VITE_BACKEND_URL env var
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://hospital-lakl.onrender.com';
const API_BASE_URL = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hospital_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hospital_token');
      localStorage.removeItem('hospital_user');
    }
    return Promise.reject(error);
  }
);
