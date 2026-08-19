import axios from 'axios';
import { env } from '@/config/env';
export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true, // Secure cookie handling
  headers: {
    'Content-Type': 'application/json',
    'X-App-Id': import.meta.env.VITE_APP_ID || 'CMS_UI',
  },
});
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If we implement refresh tokens later, we can add interceptor logic here.
    return Promise.reject(error);
  },
);
