import api from './api';
import { ApiResponse } from '../types';

export const analyticsApi = {
  getAnalytics: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/admin/dashboard/summary', { params });
    return res.data;
  },

  getApplications: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/admin/analytics/applications', { params });
    return res.data;
  },

  getVerifications: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/admin/analytics/verifications', { params });
    return res.data;
  },

  getCertificates: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/admin/analytics/certificates', { params });
    return res.data;
  },

  getSchedules: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/admin/analytics/schedules', { params });
    return res.data;
  },

  getOfficers: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/admin/analytics/officers', { params });
    return res.data;
  },

  getInstruments: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/admin/analytics/instruments', { params });
    return res.data;
  },

  getStakeholders: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/admin/analytics/stakeholders', { params });
    return res.data;
  },
};
