import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base API configuration: always use relative '/api' on web/preview so requests route through current host
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  // If running in browser and envUrl points to localhost while we are on a remote host (like Cloud Run), ignore localhost
  if (typeof window !== 'undefined') {
    if (!envUrl || (envUrl.includes('localhost') && !window.location.hostname.includes('localhost'))) {
      return '/api';
    }
  }
  if (!envUrl) {
    return '/api';
  }
  const trimmed = envUrl.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const baseURL = getApiBaseUrl();

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('lm_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration and common errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      // Clear expired session
      localStorage.removeItem('lm_token');
      localStorage.removeItem('lm_auth_user');

      // Dispatch custom event for UI notifications
      window.dispatchEvent(new CustomEvent('auth:expired'));

      // If not on login/public page, redirect to login
      const publicPaths = ['/login', '/', '/verify-certificate'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected server error occurred.'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}

export default api;
