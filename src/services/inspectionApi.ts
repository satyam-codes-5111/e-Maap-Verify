import api from './api';
import { VerificationInspectionItem, ApiResponse } from '../types';

export const inspectionApi = {
  getInspections: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<{ inspections: VerificationInspectionItem[]; pagination?: any }>>('/inspections', {
      params,
    });
    return res.data;
  },

  getMyInspections: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<{ inspections: VerificationInspectionItem[]; pagination?: any }>>('/inspections/my', {
      params,
    });
    return res.data;
  },

  getAssignedInspections: async () => {
    const res = await api.get<ApiResponse<VerificationInspectionItem[]>>('/inspections/assigned');
    return res.data;
  },

  getInspectionById: async (id: string) => {
    const res = await api.get<ApiResponse<VerificationInspectionItem>>(`/inspections/${id}`);
    return res.data;
  },

  getInspectionHistory: async (id: string) => {
    const res = await api.get<ApiResponse<any>>(`/inspections/${id}/history`);
    return res.data;
  },

  startInspection: async (scheduleId: string) => {
    const res = await api.post<ApiResponse<VerificationInspectionItem>>(`/inspections/${scheduleId}/start`);
    return res.data;
  },

  createInspection: async (scheduleId: string) => {
    const res = await api.post<ApiResponse<VerificationInspectionItem>>(`/inspections/${scheduleId}/start`);
    return res.data;
  },

  updateDraft: async (id: string, data: any) => {
    const res = await api.put<ApiResponse<VerificationInspectionItem>>(`/inspections/${id}`, data);
    return res.data;
  },

  updateInspection: async (id: string, data: any) => {
    const res = await api.put<ApiResponse<VerificationInspectionItem>>(`/inspections/${id}`, data);
    return res.data;
  },

  submitInspection: async (id: string, data?: any) => {
    const res = await api.post<ApiResponse<VerificationInspectionItem>>(`/inspections/${id}/submit`, data);
    return res.data;
  },

  finalizeInspection: async (
    id: string,
    data: { statutoryVerdict?: string; verdict?: string; sealNumber?: string; validUntil?: string; remarks?: string }
  ) => {
    const payload = {
      statutoryVerdict: data.statutoryVerdict || data.verdict || 'VERIFIED',
      sealNumber: data.sealNumber,
      validUntil: data.validUntil,
      remarks: data.remarks,
    };
    const res = await api.post<ApiResponse<VerificationInspectionItem>>(`/inspections/${id}/finalize`, payload);
    return res.data;
  },

  uploadEvidence: async (id: string, formData: FormData) => {
    const res = await api.post<ApiResponse<any>>(`/inspections/${id}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  reopenInspection: async (id: string, reason: string) => {
    const res = await api.post<ApiResponse<VerificationInspectionItem>>(`/inspections/${id}/reopen`, { reason });
    return res.data;
  },

  getMetrics: async () => {
    const res = await api.get<ApiResponse<any>>('/inspections/dashboard/metrics');
    return res.data;
  },
};
