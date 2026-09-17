import api from './api';
import { ApiResponse } from '../types';

export const userApi = {
  getUsers: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<{ users: any[]; pagination?: any }>>('/users', { params });
    return res.data;
  },

  getUserById: async (id: string) => {
    const res = await api.get<ApiResponse<any>>(`/users/${id}`);
    return res.data;
  },

  createUser: async (data: any) => {
    const res = await api.post<ApiResponse<any>>('/users', data);
    return res.data;
  },

  updateUser: async (id: string, data: any) => {
    const res = await api.put<ApiResponse<any>>(`/users/${id}`, data);
    return res.data;
  },

  toggleStatus: async (id: string) => {
    const res = await api.patch<ApiResponse<any>>(`/users/${id}/status`);
    return res.data;
  },

  deleteUser: async (id: string) => {
    const res = await api.delete<ApiResponse<any>>(`/users/${id}`);
    return res.data;
  },

  getActiveOfficers: async () => {
    const res = await api.get<ApiResponse<any[]>>('/users/officers/list');
    return res.data;
  },
};
