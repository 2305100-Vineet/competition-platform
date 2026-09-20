import axios from 'axios';

// Uses VITE_API_URL in production (set in Render's env vars); falls back to
// localhost so local dev keeps working with no .env file present.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({ baseURL });

// Attach the JWT to every request automatically, if we have one.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;