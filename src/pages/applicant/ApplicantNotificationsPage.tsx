import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { notificationApi } from '../../services/notificationApi';
import { NotificationItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Toast, ToastMessage } from '../../components/common/Toast';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  Check,
  Calendar,
  FileCheck2,
  Clock,
  ShieldAlert,
  Award,
} from 'lucide-react';

export const ApplicantNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'APPLICATIONS' | 'SCHEDULES' | 'ALERTS'>('ALL');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getNotifications();
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.notifications || []);
        setNotifications(list);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setToast({
        id: String(Date.now()),
        type: 'success',
        title: 'Marked as Read',
        message: 'All notifications marked as read.',
      });
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Error',
        message: getErrorMessage(err),
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === 'UNREAD') return !item.isRead;
      if (activeTab === 'APPLICATIONS') {
        const text = `${item.title} ${item.message}`.toLowerCase();
        return text.includes('application') || text.includes('submitted') || text.includes('scrutiny');
      }
      if (activeTab === 'SCHEDULES') {
        const text = `${item.title} ${item.message}`.toLowerCase();
        return text.includes('schedule') || text.includes('appointment') || text.includes('inspection');
      }
      if (activeTab === 'ALERTS') {
        const text = `${item.title} ${item.message}`.toLowerCase();
        return text.includes('expir') || text.includes('due') || text.includes('alert') || item.type === 'ALERT';
      }
      return true;
    });
  }, [notifications, activeTab]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader title="Notifications" />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchNotifications} />;
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Notifications & Statutory Alerts"
        description="Application status changes, scheduled inspection visits, and certificate expirations"
        breadcrumbs={[
          { label: 'Dashboard', to: '/applicant/dashboard' },
          { label: 'Notifications' },
        ]}
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#123B6D] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
            activeTab === 'ALL'
              ? 'bg-[#123B6D] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('UNREAD')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
            activeTab === 'UNREAD'
              ? 'bg-[#123B6D] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
            activeTab === 'APPLICATIONS'
              ? 'bg-[#123B6D] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Applications
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SCHEDULES')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
            activeTab === 'SCHEDULES'
              ? 'bg-[#123B6D] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Schedules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ALERTS')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
            activeTab === 'ALERTS'
              ? 'bg-[#123B6D] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Expiries & Alerts
        </button>
      </div>

      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You are completely up to date. Application updates, scheduled inspection visits, and certificate renewal reminders will appear here."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredNotifications.map((n) => {
            const isAlert = n.type === 'ALERT' || n.type === 'WARNING';
            const isSchedule = n.title?.toLowerCase().includes('schedule') || n.message?.toLowerCase().includes('inspection');
            const isCert = n.title?.toLowerCase().includes('certificate') || n.message?.toLowerCase().includes('expir');

            return (
              <div
                key={n._id}
                className={`p-4 flex items-start justify-between gap-4 transition ${
                  n.isRead ? 'bg-white' : 'bg-blue-50/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isAlert
                        ? 'bg-rose-100 text-rose-700'
                        : isSchedule
                        ? 'bg-amber-100 text-amber-800'
                        : isCert
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-[#123B6D]'
                    }`}
                  >
                    {isAlert ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isSchedule ? (
                      <Calendar className="w-4 h-4" />
                    ) : isCert ? (
                      <Award className="w-4 h-4" />
                    ) : (
                      <FileCheck2 className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs font-bold ${
                          n.isRead ? 'text-slate-800' : 'text-slate-950 font-black'
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#123B6D] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(n._id)}
                      className="p-1.5 text-slate-400 hover:text-[#123B6D] rounded-lg transition"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(n._id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
