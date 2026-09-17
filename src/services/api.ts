import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base API configuration using environment variable or default relative /api
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  // If running in browser and envUrl explicitly points to localhost while we are on a remote host (like Cloud Run), ignore localhost
  if (typeof window !== 'undefined') {
    if (envUrl && envUrl.includes('localhost') && !window.location.hostname.includes('localhost')) {
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
    const data = error.response?.data;
    const candidate = data?.message || data?.error || error.message;
    if (typeof candidate === 'string') return candidate;
    if (candidate && typeof candidate === 'object') {
      try {
        return candidate.message || candidate.detail || JSON.stringify(candidate);
      } catch {
        return 'An unexpected server error occurred.';
      }
    }
    return candidate ? String(candidate) : 'An unexpected server error occurred.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    try {
      return (error as any).message || JSON.stringify(error);
    } catch {
      return 'An unexpected error occurred.';
    }
  }
  return 'An unexpected error occurred.';
}

export default api;
