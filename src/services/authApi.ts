import api from './api';
import { AuthUser, ApiResponse } from '../types';

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<ApiResponse<{ token: string; user: any }>>('/auth/login', credentials);
    return res.data;
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
