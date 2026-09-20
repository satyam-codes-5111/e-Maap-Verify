import api from './api';
import { VerificationApplicationItem, ApiResponse } from '../types';

export const applicationApi = {
  getApplications: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<{ applications: VerificationApplicationItem[]; pagination?: any }>>('/applications', {
      params,
    });
    return res.data;
  },

  getApplicationById: async (id: string) => {
    const res = await api.get<ApiResponse<VerificationApplicationItem>>(`/applications/${id}`);
    return res.data;
  },

  getApplicationHistory: async (id: string) => {
    const res = await api.get<ApiResponse<any>>(`/applications/${id}/history`);
    return res.data;
  },

  createApplication: async (data: any) => {
    const res = await api.post<ApiResponse<VerificationApplicationItem>>('/applications', data);
    return res.data;
  },

  updateApplication: async (id: string, data: any) => {
    const res = await api.put<ApiResponse<VerificationApplicationItem>>(`/applications/${id}`, data);
    return res.data;
  },

  submitApplication: async (id: string) => {
    const res = await api.post<ApiResponse<VerificationApplicationItem>>(`/applications/${id}/submit`);
    return res.data;
  },

  reviewApplication: async (id: string, payload?: { remarks?: string }) => {
    const res = await api.post<ApiResponse<VerificationApplicationItem>>(`/applications/${id}/review`, payload);
    return res.data;
  },

  approveApplication: async (id: string, payload?: { remarks?: string }) => {
    const res = await api.post<ApiResponse<VerificationApplicationItem>>(`/applications/${id}/approve`, payload);
    return res.data;
  },

  rejectApplication: async (id: string, payload: { rejectionReason: string }) => {
    const res = await api.post<ApiResponse<VerificationApplicationItem>>(`/applications/${id}/reject`, payload);
    return res.data;
  },

  uploadDocument: async (id: string, formData: FormData) => {
    const res = await api.post<ApiResponse<any>>(`/applications/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  assignOfficer: async (
    id: string,
    payload:
      | {
          officerId?: string;
          assignedOfficer?: string;
          assignedOfficerId?: string;
          assignedFieldOfficerId?: string;
          fieldOfficerId?: string;
          scheduledDate?: string;
          timeSlot?: string;
          locationType?: string;
          locationAddress?: string;
          specialInstructions?: string;
          notes?: string;
        }
      | string
  ) => {
    const body =
      typeof payload === 'string'
        ? { applicationId: id, officerId: payload }
        : { applicationId: id, ...payload };
    const res = await api.post<ApiResponse<any>>('/schedules', body);
    return res.data;
  },
};
