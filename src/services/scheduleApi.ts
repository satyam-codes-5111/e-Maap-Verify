import api from './api';
import { ScheduleItem, ApiResponse } from '../types';

export const scheduleApi = {
  getSchedules: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<{ schedules: ScheduleItem[]; pagination?: any }>>('/schedules', {
      params,
    });
    return res.data;
  },

  getMySchedules: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<{ schedules: ScheduleItem[]; pagination?: any }>>('/schedules/my', {
      params,
    });
    return res.data;
  },

  getCalendarSchedules: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/schedules/calendar', { params });
    return res.data;
  },

  checkAvailability: async (params: { officerId: string; date: string; timeSlot: string }) => {
    const res = await api.get<ApiResponse<any>>('/schedules/availability', { params });
    return res.data;
  },

  getScheduleById: async (id: string) => {
    const res = await api.get<ApiResponse<ScheduleItem>>(`/schedules/${id}`);
    return res.data;
  },

  createSchedule: async (data: {
    applicationId: string;
    officerId?: string;
    assignedOfficer?: string;
    assignedOfficerId?: string;
    assignedFieldOfficerId?: string;
    fieldOfficerId?: string;
    scheduledDate: string;
    timeSlot: string;
    startTime?: string;
    endTime?: string;
    verificationCenter?: string;
    verificationCenterId?: string;
    locationType?: string;
    locationAddress?: string;
    specialInstructions?: string;
    notes?: string;
  }) => {
    const res = await api.post<ApiResponse<ScheduleItem>>('/schedules', data);
    return res.data;
  },

  reschedule: async (
    id: string,
    dataOrDate: { scheduledDate: string; timeSlot: string; reason: string } | string,
    timeSlot?: string,
    reason?: string
  ) => {
    const payload =
      typeof dataOrDate === 'string'
        ? { scheduledDate: dataOrDate, timeSlot: timeSlot || 'MORNING_10_TO_1', reason: reason || 'Official revision' }
        : dataOrDate;
    const res = await api.post<ApiResponse<ScheduleItem>>(`/schedules/${id}/reschedule`, payload);
    return res.data;
  },

  cancelSchedule: async (id: string, reason: string) => {
    const res = await api.post<ApiResponse<ScheduleItem>>(`/schedules/${id}/cancel`, { reason });
    return res.data;
  },
};
