import api from './api';
import { AuthUser, ApiResponse } from '../types';

let activeLoginPromise: {
  key: string;
  promise: Promise<ApiResponse<{ token: string; role?: string; user: any; stakeholder?: any }>>;
} | null = null;

export const authApi = {
  login: async (credentials: { email: string; password: string; selectedRole?: string }) => {
    const dedupKey = `${credentials.email.toLowerCase().trim()}:${credentials.selectedRole || ''}`;
    if (activeLoginPromise && activeLoginPromise.key === dedupKey) {
      return activeLoginPromise.promise;
    }

    const promise = api
      .post<ApiResponse<{ token: string; role?: string; user: any; stakeholder?: any }>>('/auth/login', credentials)
      .then((res) => res.data)
      .finally(() => {
        if (activeLoginPromise?.key === dedupKey) {
          activeLoginPromise = null;
        }
      });

    activeLoginPromise = { key: dedupKey, promise };
    return promise;
  },

  getMe: async () => {
    const res = await api.get<ApiResponse<AuthUser>>('/auth/me');
    return res.data;
  },

  logout: async () => {
    try {
      const res = await api.post<ApiResponse<null>>('/auth/logout');
      return res.data;
    } catch {
      return { success: true, data: null };
    }
  },
};
