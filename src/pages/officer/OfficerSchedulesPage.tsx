import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { scheduleApi } from '../../services/scheduleApi';
import { ScheduleItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import {
  CalendarDays,
  Clock,
  MapPin,
  PlayCircle,
  RotateCcw,
  Building2,
} from 'lucide-react';

export const OfficerSchedulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Reschedule state
  const [rescheduleItem, setRescheduleItem] = useState<ScheduleItem | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('10:00 AM - 01:00 PM');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await scheduleApi.getMySchedules(params);
      if (res.success && res.data) {
        const data = res.data as any;
        setSchedules(Array.isArray(data) ? data : (data.schedules || []));
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Schedule Load Error',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleRescheduleSubmit = async () => {
    if (!rescheduleItem || !newDate || !rescheduleReason) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide a valid date and official reason for rescheduling.',
      });
      return;
    }

    setRescheduling(true);
    try {
      const res = await scheduleApi.reschedule(
        rescheduleItem._id,
        newDate,
        newTimeSlot,
        rescheduleReason
      );
      if (res.success) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Schedule Updated',
          message: 'Inspection schedule successfully revised.',
        });
        setRescheduleItem(null);
        fetchSchedules();
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

  const columns: Column<ScheduleItem>[] = [
    {
      header: 'Scheduled Date & Time',
      cell: (item) => (
        <div>
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-teal-700" />
            <span>{new Date(item.scheduledDate).toLocaleDateString()}</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{item.timeSlot || '09:00 AM - 12:00 PM'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Stakeholder & Premise',
      cell: (item) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs">
            {item.application?.stakeholder?.businessName || 'Business Establishment'}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>
              {item.location?.line1 || item.application?.verificationLocation?.line1 || 'Premise'},{' '}
              {item.location?.district || item.application?.verificationLocation?.district}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Application No.',
      cell: (item) => (
        <span className="font-mono text-xs text-slate-700">
          {item.application?.applicationNumber || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end gap-2">
          {item.status !== 'COMPLETED' && (
            <button
              type="button"
              onClick={() => {
                setRescheduleItem(item);
                setNewDate(item.scheduledDate ? item.scheduledDate.split('T')[0] : '');
              }}
              className="p-1 text-slate-500 hover:text-teal-800 hover:bg-slate-100 rounded"
              title="Reschedule"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(`/officer/inspections?scheduleId=${item._id}`)}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Inspect</span>
          </button>
        </div>
      ),
    },
  ];

  const mobileCardRender = (item: ScheduleItem) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-bold text-xs text-slate-900">
            {new Date(item.scheduledDate).toLocaleDateString()}
          </span>
          <p className="text-[11px] text-slate-500">{item.timeSlot}</p>
        </div>
        <StatusBadge status={item.status} size="sm" />
      </div>

      <div className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
        <div className="font-semibold text-slate-800">
          {item.application?.stakeholder?.businessName}
        </div>
        <div className="text-slate-500">{item.location?.district}</div>
        <div className="text-slate-400 font-mono mt-0.5">
          App: {item.application?.applicationNumber}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {item.status !== 'COMPLETED' && (
          <button
            type="button"
            onClick={() => {
              setRescheduleItem(item);
              setNewDate(item.scheduledDate ? item.scheduledDate.split('T')[0] : '');
            }}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Reschedule
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate(`/officer/inspections?scheduleId=${item._id}`)}
          className="px-3 py-1 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg"
        >
          Conduct Inspection
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Field Verification Schedules"
        description="Allotted inspection schedules across jurisdictional beats"
        breadcrumbs={[
          { label: 'Dashboard', href: '/officer/dashboard' },
          { label: 'Schedules' },
        ]}
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
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
                { label: 'Completed', value: 'COMPLETED' },
              ],
            },
          ]}
          onReset={() => setStatusFilter('ALL')}
        />
      </div>

      <DataTable
        columns={columns}
        data={schedules}
        loading={loading}
        keyExtractor={(item) => item._id}
        emptyTitle="No Schedules Found"
        emptyDescription="You have no inspection appointments matching this filter."
        mobileCardRender={mobileCardRender}
      />

      {/* Reschedule Modal */}
      {rescheduleItem && (
        <Modal
          isOpen={true}
          onClose={() => setRescheduleItem(null)}
          title="Reschedule Field Inspection"
          subtitle={`Revise visit date for Application ${rescheduleItem.application?.applicationNumber || ''}`}
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
    </div>
  );
};
