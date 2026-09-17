import api, { getApiBaseUrl } from './api';
import { ApiResponse } from '../types';

export const reportApi = {
  getAdminReports: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/admin/reports', { params });
    return res.data;
  },

  exportAdminReportsUrl: (params?: Record<string, any>) => {
    const baseURL = getApiBaseUrl();
    const query = new URLSearchParams(params as any).toString();
    const token = localStorage.getItem('lm_token') || '';
    return `${baseURL}/admin/reports/export?${query}&token=${token}`;
  },

  getAuditLogs: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/reports/audit-logs', { params });
    return res.data;
  },

  getSummaryReport: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/reports/summary', { params });
    return res.data;
  },

  getRevenueReport: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/reports/revenue', { params });
    return res.data;
  },

  getComplianceReport: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/reports/instruments-compliance', { params });
    return res.data;
  },
};
