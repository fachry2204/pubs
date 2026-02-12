import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
