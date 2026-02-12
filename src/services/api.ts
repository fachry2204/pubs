import axios from 'axios';

const getBaseUrl = () => {
  // 1. If VITE_API_URL is explicitly set (e.g. in .env), use it
  if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
  }
  
  // 2. If running on localhost (development), assume backend is on port 5000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
  }

  // 3. If running on production (Plesk/Domain), use relative path '/api'
  // This works because in Plesk, Frontend and Backend are served from the same domain
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
    const isServerDown = error.response && (error.response.status === 500 || error.response.status === 503);
    
    // Check if we are already on the maintenance page to prevent loop
    const isMaintenancePage = window.location.pathname === '/maintenance';

    if ((isNetworkError || isServerDown) && !isMaintenancePage) {
      window.location.href = '/maintenance';
    }
    return Promise.reject(error);
  }
);

export default api;
