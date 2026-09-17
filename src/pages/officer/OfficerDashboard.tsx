import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../services/dashboardApi';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import {
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ArrowRight,
  Scale,
  MapPin,
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getOfficerDashboard();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load officer dashboard');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Officer Field Dashboard" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const counts = data?.counts || data?.kpis || {};
  const todaySchedules = data?.todaySchedules || [];
  const recentInspections = data?.recentInspections || [];

  const todayCount = todaySchedules.length > 0 ? todaySchedules.length : (counts.assignedScheduled || 0);
  const pendingCount = counts.assignedPendingInspection ?? counts.assignedPendingReview ?? counts.assignedTotal ?? 0;
  const completedCount = counts.completedInspections ?? counts.passedCount ?? 0;
  const rejectedCount = counts.failedCount ?? counts.rejectedCount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enforcement Officer Command"
        description="Legal Metrology verification schedules, accuracy testing, and field inspections"
        actions={
          <Link
            to="/officer/schedules"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Today's Schedule</span>
          </Link>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Inspections"
          value={todayCount}
          description="Verification schedules allotted for today"
          icon={CalendarDays}
          variant="teal"
          badge={todayCount > 0 ? { text: 'Active Duty', type: 'positive' } : undefined}
        />
        <StatCard
          title="Pending Inspections"
          value={pendingCount}
          description="Awaiting on-site calibration and testing"
          icon={ClipboardList}
          variant="amber"
        />
        <StatCard
          title="Completed Verifications"
          value={completedCount}
          description="Legally stamped & certified instruments"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Rejection Verdicts"
          value={rejectedCount}
          description="Failed MPE or defective instruments"
          icon={AlertCircle}
          variant="rose"
        />
      </div>

      {/* Today's Allotted Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Cards (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today's Inspection Queue</h2>
              <p className="text-xs text-slate-500">Scheduled on-site visits and verifications</p>
            </div>
            <Link
              to="/officer/schedules"
              className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {todaySchedules.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No inspections scheduled for today.
              </div>
            ) : (
              todaySchedules.map((sch: any) => (
                <div
                  key={sch._id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {sch.timeSlot || '09:00 AM - 12:00 PM'}
                      </span>
                      <StatusBadge status={sch.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      {sch.application?.stakeholder?.businessName || 'Business Premise'}
                    </p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>
                        {sch.location?.district || sch.application?.stakeholder?.district || 'Jurisdiction District'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/officer/inspections?scheduleId=${sch._id}`}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs flex items-center gap-1.5"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Conduct Inspection</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Statutory Reference (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-teal-700" />
              <span>Statutory Limits (MPE)</span>
            </h2>
            <p className="text-xs text-slate-500">Legal Metrology (General) Rules, 2011</p>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800">Class III (Medium Accuracy)</div>
              <p className="text-[11px] text-slate-500">
                0 to 500e: ±0.5e | 501e to 2000e: ±1.0e | &gt;2000e: ±1.5e
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800">Class II (High Accuracy)</div>
              <p className="text-[11px] text-slate-500">
                0 to 5000e: ±0.5e | 5001e to 20000e: ±1.0e | &gt;20000e: ±1.5e
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800">Class I (Special Accuracy)</div>
              <p className="text-[11px] text-slate-500">
                0 to 50000e: ±0.5e | 50001e to 200000e: ±1.0e
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
