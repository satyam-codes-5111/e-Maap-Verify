import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleApi } from '../../services/scheduleApi';
import { ScheduleItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ScheduleVerificationModal } from '../../components/schedule/ScheduleVerificationModal';
import {
  CalendarDays,
  Clock,
  MapPin,
  PlayCircle,
  RotateCcw,
  Building2,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';

export const OfficerSchedulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const canSchedule = isAdmin || user?.role === 'LEGAL_METROLOGY_OFFICER';

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // New verification schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Reschedule modal state
  const [rescheduleItem, setRescheduleItem] = useState<ScheduleItem | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('10:00 AM - 01:00 PM');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  // Safe data extraction helper that guarantees an array is always returned
  const extractSchedules = (res: any): ScheduleItem[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res.filter(Boolean);
    if (typeof res === 'object') {
      if (Array.isArray(res.data)) return res.data.filter(Boolean);
      if (res.data && Array.isArray(res.data.schedules)) return res.data.schedules.filter(Boolean);
      if (Array.isArray(res.schedules)) return res.schedules.filter(Boolean);
      if (res.data && typeof res.data === 'object' && Array.isArray(res.data.data)) {
        return res.data.data.filter(Boolean);
      }
    }
    return [];
  };

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const res = await scheduleApi.getMySchedules(params);

      // Verify response success flag if present
      if (res && typeof res === 'object' && res.success === false) {
        throw new Error(res.message || 'Unable to retrieve statutory schedules.');
      }

      const list = extractSchedules(res);
      setSchedules(list);
    } catch (err: unknown) {
      const errMsg = getErrorMessage(err) || 'Failed to load statutory verification schedules.';
      setError(errMsg);
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Schedule Load Error',
        message: errMsg,
      });
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Safe Date string formatters
  const formatDisplayDate = (dateVal?: any): string => {
    if (!dateVal) return 'Date Pending';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Date Pending';
    }
  };

  const getIsoDateString = (dateVal?: any): string => {
    if (!dateVal) return '';
    try {
      if (typeof dateVal === 'string' && dateVal.includes('T')) {
        return dateVal.split('T')[0];
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const formatTimeWindow = (item?: ScheduleItem): string => {
    if (!item) return '09:00 AM - 12:00 PM';
    if (item.timeSlot && typeof item.timeSlot === 'string') return item.timeSlot;
    if (item.startTime && item.endTime) return `${item.startTime} - ${item.endTime}`;
    return '09:00 AM - 12:00 PM';
  };

  const getBusinessName = (item?: ScheduleItem): string => {
    if (!item) return 'Business Establishment';
    return (
      item.stakeholder?.businessName ||
      item.stakeholder?.legalName ||
      item.application?.stakeholder?.businessName ||
      item.application?.stakeholder?.legalName ||
      'Business Establishment'
    );
  };

  const getPremiseAddress = (item?: ScheduleItem): string => {
    if (!item) return 'Premise Address Not Specified';
    if (item.locationAddress && typeof item.locationAddress === 'string') {
      return item.locationAddress;
    }
    if (item.location?.line1) {
      return `${item.location.line1}${item.location.district ? ', ' + item.location.district : ''}`;
    }
    const appLoc = item.application?.verificationLocation;
    if (typeof appLoc === 'string') return appLoc;
    if (appLoc && typeof appLoc === 'object') {
      return (
        appLoc.addressLine1 ||
        appLoc.line1 ||
        appLoc.district ||
        'Premise Address Not Specified'
      );
    }
    return 'Premise Address Not Specified';
  };

  const getApplicationNumber = (item?: ScheduleItem): string => {
    if (!item) return 'N/A';
    if (typeof item.application === 'string') return item.application;
    return item.application?.applicationNumber || 'N/A';
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleItem || !newDate || !rescheduleReason.trim()) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide a valid new date and official reason for rescheduling.',
      });
      return;
    }

    setRescheduling(true);
    try {
      const scheduleId = rescheduleItem._id || rescheduleItem.id;
      if (!scheduleId) {
        throw new Error('Missing schedule reference ID.');
      }

      const res = await scheduleApi.reschedule(
        scheduleId,
        newDate,
        newTimeSlot,
        rescheduleReason.trim()
      );
      if (res && res.success !== false) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Schedule Updated',
          message: 'Inspection schedule successfully revised.',
        });
        setRescheduleItem(null);
        setNewDate('');
        setRescheduleReason('');
        fetchSchedules();
      } else {
        throw new Error(res?.message || 'Failed to update schedule.');
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Reschedule Error',
        message: getErrorMessage(err),
      });
    } finally {
      setRescheduling(false);
    }
  };

  // Search filter across schedules
  const filteredSchedules = useMemo(() => {
    if (!Array.isArray(schedules)) return [];
    let list = schedules.filter(Boolean);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const appNum = getApplicationNumber(item).toLowerCase();
        const bName = getBusinessName(item).toLowerCase();
        const premise = getPremiseAddress(item).toLowerCase();
        const statusStr = String(item.status || '').toLowerCase();
        return (
          appNum.includes(q) ||
          bName.includes(q) ||
          premise.includes(q) ||
          statusStr.includes(q)
        );
      });
    }

    return list;
  }, [schedules, searchQuery]);

  const columns: Column<ScheduleItem>[] = [
    {
      header: 'Scheduled Date & Time',
      cell: (item) => (
        <div>
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>{formatDisplayDate(item?.scheduledDate)}</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{formatTimeWindow(item)}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Stakeholder & Premise',
      cell: (item) => (
        <div className="max-w-xs sm:max-w-sm">
          <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{getBusinessName(item)}</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="line-clamp-1">{getPremiseAddress(item)}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Application No.',
      cell: (item) => (
        <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          {getApplicationNumber(item)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item?.status || 'SCHEDULED'} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => {
        const scheduleId = item?._id || item?.id;
        const inspectionPath = isAdmin
          ? `/admin/inspections?scheduleId=${scheduleId}`
          : `/officer/inspections?scheduleId=${scheduleId}`;

        return (
          <div className="flex items-center justify-end gap-2">
            {item?.status !== 'COMPLETED' && (
              <button
                type="button"
                onClick={() => {
                  setRescheduleItem(item);
                  setNewDate(getIsoDateString(item?.scheduledDate));
                  setNewTimeSlot(item?.timeSlot || '10:00 AM - 01:00 PM');
                }}
                className="p-1.5 text-slate-500 hover:text-teal-800 hover:bg-slate-100 rounded-md transition"
                title="Reschedule Inspection"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (scheduleId) navigate(inspectionPath);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
          </div>
        );
      },
    },
  ];

  const mobileCardRender = (item: ScheduleItem) => {
    const scheduleId = item?._id || item?.id;
    const inspectionPath = isAdmin
      ? `/admin/inspections?scheduleId=${scheduleId}`
      : `/officer/inspections?scheduleId=${scheduleId}`;

    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              {formatDisplayDate(item?.scheduledDate)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              {formatTimeWindow(item)}
            </p>
          </div>
          <StatusBadge status={item?.status || 'SCHEDULED'} size="sm" />
        </div>

        <div className="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{getBusinessName(item)}</span>
          </div>
          <div className="text-slate-500 flex items-start gap-1">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{getPremiseAddress(item)}</span>
          </div>
          <div className="text-slate-500 font-mono mt-1 pt-1 border-t border-slate-200/60">
            Application: <span className="font-semibold text-slate-700">{getApplicationNumber(item)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          {item?.status !== 'COMPLETED' && (
            <button
              type="button"
              onClick={() => {
                setRescheduleItem(item);
                setNewDate(getIsoDateString(item?.scheduledDate));
                setNewTimeSlot(item?.timeSlot || '10:00 AM - 01:00 PM');
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Reschedule
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (scheduleId) navigate(inspectionPath);
            }}
            className="px-3 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition flex items-center gap-1 shadow-xs"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Conduct Inspection</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Field Verification Schedules"
        description="Allotted inspection schedules across jurisdictional beats"
        breadcrumbs={[
          {
            label: 'Dashboard',
            href: isAdmin ? '/admin/dashboard' : '/officer/dashboard',
          },
          { label: 'Schedules' },
        ]}
        actions={
          canSchedule ? (
            <button
              type="button"
              onClick={() => setScheduleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Schedule Verification</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <FilterPanel
          filters={[
            {
              key: 'status',
              label: 'Schedule Status',
              value: statusFilter,
              onChange: (val) => setStatusFilter(val),
              options: [
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Scheduled', value: 'SCHEDULED' },
                { label: 'Rescheduled', value: 'RESCHEDULED' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Completed', value: 'COMPLETED' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ],
            },
          ]}
          onReset={() => {
            setStatusFilter('ALL');
            setSearchQuery('');
          }}
        />

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search application or premise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : error ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-xl border border-rose-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Unable to Load Verification Schedules</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">{error}</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={fetchSchedules}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Load</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/officer/dashboard')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredSchedules}
          loading={false}
          keyExtractor={(item) => item?._id || item?.id || String(Math.random())}
          emptyTitle="No Schedules Found"
          emptyDescription={
            statusFilter !== 'ALL' || searchQuery.trim()
              ? 'No statutory verification schedules match the specified filter or search query.'
              : 'There are currently no verification schedules allotted to this beat or jurisdiction.'
          }
          emptyActionLabel={
            statusFilter !== 'ALL' || searchQuery.trim() ? 'Reset Filters' : 'Refresh Queue'
          }
          onEmptyAction={() => {
            if (statusFilter !== 'ALL' || searchQuery.trim()) {
              setStatusFilter('ALL');
              setSearchQuery('');
            } else {
              fetchSchedules();
            }
          }}
          mobileCardRender={mobileCardRender}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleItem && (
        <Modal
          isOpen={true}
          onClose={() => setRescheduleItem(null)}
          title="Reschedule Field Inspection"
          subtitle={`Revise visit date for Application ${getApplicationNumber(rescheduleItem)}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setRescheduleItem(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRescheduleSubmit}
                disabled={rescheduling}
                className="px-4 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {rescheduling && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Confirm Reschedule</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Date *</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Time Window *
              </label>
              <select
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              >
                <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                <option value="12:00 PM - 03:00 PM">Afternoon (12:00 PM - 03:00 PM)</option>
                <option value="03:00 PM - 06:00 PM">Late Afternoon (03:00 PM - 06:00 PM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statutory Reason for Revision *
              </label>
              <textarea
                rows={3}
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="State official reason (e.g. departmental enforcement drive, transit delay)..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Shared Statutory Schedule Verification Modal */}
      <ScheduleVerificationModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSuccess={() => {
          setToast({
            id: String(Date.now()),
            type: 'success',
            title: 'Schedule Allotted',
            message: 'Statutory verification schedule has been allotted and added to beat roster.',
          });
          fetchSchedules();
        }}
      />
    </div>
  );
};
