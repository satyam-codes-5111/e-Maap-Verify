import api from './api';
import { NotificationItem, ApiResponse } from '../types';

export const notificationApi = {
  getNotifications: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<{ notifications: NotificationItem[]; pagination?: any }>>('/notifications', {
      params,
    });
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await api.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.patch<ApiResponse<{ updatedCount: number }>>('/notifications/read-all');
    return res.data;
  },

  deleteNotification: async (id: string) => {
    const res = await api.delete<ApiResponse<any>>(`/notifications/${id}`);
    return res.data;
  },
};
