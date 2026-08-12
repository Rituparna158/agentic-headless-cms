import axios from 'axios';
import { env } from '@/config/env';

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true, // Secure cookie handling
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Token refresh logic (Mocked implementation)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Await token refresh call here e.g. await axios.post('/api/refresh')
        // Return original request with new token (if using Authorization header instead of cookies)
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Dispatch logout action here
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
