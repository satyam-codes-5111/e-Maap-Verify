import api from './api';
import { StakeholderItem, ApiResponse } from '../types';

export const stakeholderApi = {
  getMyProfile: async () => {
    const res = await api.get<ApiResponse<StakeholderItem>>('/stakeholders/me');
    return res.data;
  },

  updateMyProfile: async (data: Partial<StakeholderItem>) => {
    const res = await api.put<ApiResponse<StakeholderItem>>('/stakeholders/me', data);
    return res.data;
  },

  uploadKycDoc: async (formData: FormData) => {
    const res = await api.post<ApiResponse<any>>('/stakeholders/me/upload-kyc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getStakeholders: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<{ stakeholders: StakeholderItem[]; pagination?: any }>>('/stakeholders', {
      params,
    });
    return res.data;
  },

  getAllStakeholders: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<{ stakeholders: StakeholderItem[]; pagination?: any }>>('/stakeholders', {
      params,
    });
    return res.data;
  },

  getStakeholderById: async (id: string) => {
    const res = await api.get<ApiResponse<StakeholderItem>>(`/stakeholders/${id}`);
    return res.data;
  },

  updateKycStatus: async (id: string, payload: { kycStatus: string; verificationRemarks?: string }) => {
    const res = await api.patch<ApiResponse<StakeholderItem>>(`/stakeholders/${id}/kyc-status`, payload);
    return res.data;
  },

  verifyKyc: async (id: string, status: string, remarks?: string) => {
    const res = await api.patch<ApiResponse<StakeholderItem>>(`/stakeholders/${id}/kyc-status`, {
      kycStatus: status,
      verificationRemarks: remarks,
    });
    return res.data;
  },
};
