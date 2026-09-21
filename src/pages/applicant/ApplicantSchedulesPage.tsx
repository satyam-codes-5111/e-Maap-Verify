import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi } from '../../services/applicationApi';
import { dashboardApi } from '../../services/dashboardApi';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  CalendarDays,
  Clock,
  MapPin,
  UserCheck,
  Scale,
  FileCheck2,
  AlertCircle,
  PhoneCall,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const ApplicantSchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch scheduled applications and stakeholder dashboard
      const [appRes, dashRes] = await Promise.all([
        applicationApi.getApplications({ status: 'SCHEDULED' }).catch(() => ({ success: false, data: { applications: [] } })),
        dashboardApi.getStakeholderDashboard().catch(() => ({ success: false, data: null })),
      ]);

      const scheduledApps = appRes?.data?.applications || [];
      const dashSchedules = dashRes?.data?.upcomingSchedules || [];

      // Combine or deduplicate
      const combined = [...scheduledApps];
      dashSchedules.forEach((item: any) => {
        if (!combined.some((app) => app._id === item._id || app._id === item.applicationId)) {
          combined.push(item);
        }
      });

      setSchedules(combined);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Verification Schedules"
          description="Statutory inspection appointments scheduled by Legal Metrology Officers"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LoadingSkeleton rows={3} />
          <LoadingSkeleton rows={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchSchedules} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification Schedules"
        description="Official inspection appointments and field visits by Legal Metrology enforcement officers"
        breadcrumbs={[
          { label: 'Dashboard', to: '/applicant/dashboard' },
          { label: 'Schedules' },
        ]}
      />

      {/* Advisory Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5 flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-[#123B6D] text-white shrink-0">
          <ShieldCheck className="w-5 h-5 text-amber-300" />
        </div>
        <div className="text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-[#123B6D] text-sm mb-0.5">
            Statutory Field Inspection Protocol
          </p>
          <p>
            Please ensure that all weighing and measuring instruments are clean, mounted on firm
            foundations, and calibrated working standards or weights are accessible during the officer's visit.
            The designated contact person must be present with relevant purchase invoices and previous verification certificates.
          </p>
        </div>
      </div>

      {schedules.length === 0 ? (
        <EmptyState
          title="No Upcoming Inspection Schedules"
          description="You currently have no field inspections scheduled by Legal Metrology officers. Once your verification application is accepted and scheduled, the inspection slot will appear here."
          actionText="View Applications"
          onAction={() => window.location.assign('/applicant/applications')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {schedules.map((item, idx) => {
            const scheduledDate = item.scheduledDate || item.date || item.createdAt;
            const officerName = item.assignedOfficer?.name || item.officerName || 'Assigned Metrology Officer';
            const officerPhone = item.assignedOfficer?.phone || item.officerPhone || 'Helpline 1915';
            const instrumentName = item.instrument?.instrumentName || item.instrument?.category || 'Commercial Instrument';
            const serialNo = item.instrument?.serialNumber || 'N/A';
            const address = item.installationAddress?.addressLine || item.instrument?.installationAddress?.addressLine || 'Registered Business Premise';

            return (
              <div
                key={item._id || idx}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {item.applicationNumber || `APP-${idx + 1}`}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1.5 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-[#123B6D]" />
                        <span>{instrumentName}</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">SN: {serialNo}</p>
                    </div>
                    <StatusBadge status={item.currentStatus || 'SCHEDULED'} size="sm" />
                  </div>

                  <div className="mt-4 space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <CalendarDays className="w-4 h-4 text-[#FF9933] shrink-0" />
                      <span>
                        {scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }) : 'Date to be announced'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Official Working Hours (10:00 AM – 05:00 PM)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Officer: {officerName}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{address}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Legal Metrology Inspection</span>
                  {item._id && (
                    <Link
                      to={`/applicant/applications/${item._id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#123B6D] hover:underline"
                    >
                      <span>View Application</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
