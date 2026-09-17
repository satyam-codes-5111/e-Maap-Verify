import api from './api';
import { ApiResponse } from '../types';

export const dashboardApi = {
  getAdminDashboard: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/dashboard/admin', { params });
    return res.data;
  },

  getAdminSummary: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/admin/dashboard/summary', { params });
    return res.data;
  },

  getOfficerDashboard: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/dashboard/officer', { params });
    return res.data;
  },

  getStakeholderDashboard: async () => {
    const res = await api.get<ApiResponse<any>>('/dashboard/stakeholder');
    return res.data;
  },
};
