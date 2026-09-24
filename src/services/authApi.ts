import api from './api';
import { AuthUser, ApiResponse } from '../types';

let activeLoginPromise: {
  key: string;
  promise: Promise<ApiResponse<{ token: string; role?: string; user: any; stakeholder?: any }>>;
} | null = null;

export interface RegisterBusinessPayload {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  password: string;
  tradeLicenseNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  businessType?: string;
  registeredAddress?: {
    street?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  role?: string;
}

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

  register: async (payload: RegisterBusinessPayload) => {
    const res = await api.post<ApiResponse<{ token: string; role?: string; user: any; stakeholder?: any }>>(
      '/auth/register-stakeholder',
      payload
    );
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
