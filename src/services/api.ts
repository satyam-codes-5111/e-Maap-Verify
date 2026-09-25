import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Capacitor } from '@capacitor/core';

// Base API configuration using environment variable or default relative /api
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  if (isNative) {
    // 1. Check if user configured a custom backend in settings
    const customEndpoint =
      typeof localStorage !== 'undefined' ? localStorage.getItem('emaap_custom_api_url') : null;
    if (customEndpoint && customEndpoint.trim() !== '') {
      const cleanCustom = customEndpoint.trim().replace(/\/$/, '');
      return cleanCustom.endsWith('/api') ? cleanCustom : `${cleanCustom}/api`;
    }

    // 2. Check if build-time VITE_API_URL is provided and not localhost
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      const cleanEnv = envUrl.trim().replace(/\/$/, '');
      return cleanEnv.endsWith('/api') ? cleanEnv : `${cleanEnv}/api`;
    }

    // 3. Fallback to production deployed HTTPS endpoint
    return 'https://ais-dev-iurfjxifbhrnq7l5n5lyj2-524617491721.asia-east1.run.app/api';
  }

  // Web Browser: If running in browser and envUrl explicitly points to localhost while we are on a remote host (like Cloud Run), ignore localhost
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

// Cache and in-flight request deduplication store
interface CacheRecord {
  data: any;
  status: number;
  statusText: string;
  headers: any;
  timestamp: number;
}

const apiCache = new Map<string, CacheRecord>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 20000; // 20-second fast client TTL

export function clearApiCache(endpointPrefix?: string) {
  if (!endpointPrefix) {
    apiCache.clear();
    inFlightRequests.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(endpointPrefix)) {
      apiCache.delete(key);
    }
  }
  for (const key of inFlightRequests.keys()) {
    if (key.includes(endpointPrefix)) {
      inFlightRequests.delete(key);
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('auth:expired', () => clearApiCache());
}

// Wrap api.request for transparent deduplication and caching
const originalRequest = api.request.bind(api);
api.request = function <T = any, R = any, D = any>(config: any): Promise<R> {
  const method = (config.method || 'get').toUpperCase();

  // Mutating requests automatically purge cache to maintain freshness
  if (method !== 'GET') {
    clearApiCache();
    return originalRequest(config);
  }

  // Allow explicit bypass via header or query param
  if (config.headers?.['x-skip-cache'] || config.params?._noCache) {
    return originalRequest(config);
  }

  // Construct stable, user-isolated cache key
  const url = config.url || '';
  const paramsKey = config.params ? JSON.stringify(config.params) : '';
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('lm_token') || '' : '';
  const cacheKey = `${token}:${url}:${paramsKey}`;

  const now = Date.now();
  const cached = apiCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return Promise.resolve({
      data: JSON.parse(JSON.stringify(cached.data)),
      status: cached.status,
      statusText: cached.statusText,
      headers: { ...cached.headers },
      config,
    } as unknown as R);
  }

  // In-flight deduplication
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const promise = originalRequest(config)
    .then((response) => {
      inFlightRequests.delete(cacheKey);
      apiCache.set(cacheKey, {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        timestamp: Date.now(),
      });
      return response;
    })
    .catch((err) => {
      inFlightRequests.delete(cacheKey);
      throw err;
    });

  inFlightRequests.set(cacheKey, promise);
  return promise;
};

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
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const details = data.errors
        .map((e: any) => {
          if (typeof e === 'string') return e;
          if (e && typeof e === 'object') {
            return e.message ? `${e.field ? e.field + ': ' : ''}${e.message}` : JSON.stringify(e);
          }
          return String(e);
        })
        .join('; ');
      return details ? `${data.message ? data.message + ' - ' : ''}${details}` : (data.message || 'Validation error');
    }
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
