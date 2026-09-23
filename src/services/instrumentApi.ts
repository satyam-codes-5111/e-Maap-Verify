import api from './api';
import { InstrumentItem, ApiResponse, InstrumentScanLookupResult } from '../types';

export const instrumentApi = {
  lookupByScan: async (query: string) => {
    const res = await api.get<ApiResponse<InstrumentScanLookupResult>>('/instruments/scan/lookup', {
      params: { q: query.trim() },
    });
    return res.data;
  },

  getInstruments: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<{ instruments: InstrumentItem[]; pagination?: any }>>('/instruments', {
      params,
    });
    return res.data;
  },

  getInstrumentById: async (id: string) => {
    const res = await api.get<ApiResponse<InstrumentItem>>(`/instruments/${id}`);
    return res.data;
  },

  createInstrument: async (data: Partial<InstrumentItem>) => {
    const res = await api.post<ApiResponse<InstrumentItem>>('/instruments', data);
    return res.data;
  },

  updateInstrument: async (id: string, data: Partial<InstrumentItem>) => {
    const res = await api.put<ApiResponse<InstrumentItem>>(`/instruments/${id}`, data);
    return res.data;
  },

  deleteInstrument: async (id: string) => {
    const res = await api.delete<ApiResponse<any>>(`/instruments/${id}`);
    return res.data;
  },

  uploadPhoto: async (id: string, formData: FormData) => {
    const res = await api.post<ApiResponse<any>>(`/instruments/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  uploadDocument: async (id: string, formData: FormData) => {
    const res = await api.post<ApiResponse<any>>(`/instruments/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getExpiringSummary: async () => {
    const res = await api.get<ApiResponse<any>>('/instruments/expiring/summary');
    return res.data;
  },
};
