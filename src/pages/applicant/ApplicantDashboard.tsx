import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../services/dashboardApi';
import { getErrorMessage } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import {
  Cpu,
  CheckCircle2,
  FileText,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  Award,
  Calendar,
} from 'lucide-react';

export const ApplicantDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getStakeholderDashboard();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load dashboard data');
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
        <PageHeader title="Business Dashboard" description="Legal Metrology verification summary" />
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
  const recentApplications = data?.recentApplications || [];
  const complianceAlerts = data?.complianceAlerts || [];
  const upcomingSchedules = data?.upcomingSchedules || [];

  const totalInstruments = counts.totalInstruments ?? 0;
  const activeVerifiedInstruments = counts.activeVerifiedInstruments ?? counts.verifiedInstruments ?? 0;
  const activeApplications = counts.pendingApplications ?? counts.totalApplications ?? counts.activeApplications ?? 0;
  const expiringSoon = (counts.overdueInstruments || 0) + (counts.expiringWithin30Days || counts.expiringWithin7Days || counts.expiringSoon || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Verification Dashboard"
        description="Monitor statutory weighing and measuring instruments and verification applications"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/applicant/register-instrument"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Instrument</span>
            </Link>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered"
          value={totalInstruments}
          description="Commercial weighing & measuring devices"
          icon={Cpu}
          variant="teal"
        />
        <StatCard
          title="Legally Verified"
          value={activeVerifiedInstruments}
          description="Active valid verification certificates"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Active Applications"
          value={activeApplications}
          description="In review or inspection pipeline"
          icon={FileText}
          variant="blue"
        />
        <StatCard
          title="Due / Expiring Soon"
          value={expiringSoon}
          description="Due for annual statutory reverification"
          icon={AlertTriangle}
          variant="amber"
          badge={
            expiringSoon > 0
              ? { text: 'Action Needed', type: 'urgent' }
              : undefined
          }
        />
      </div>

      {/* Main Grid: Recent Applications & Expiring Instruments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Applications</h2>
              <p className="text-xs text-slate-500">Latest statutory submissions</p>
            </div>
            <Link
              to="/applicant/applications"
              className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {recentApplications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active applications found.
              </div>
            ) : (
              recentApplications.map((app: any) => (
                <div
                  key={app._id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 p-2 rounded-lg transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/applicant/applications/${app._id}`}
                        className="text-xs font-bold text-slate-800 hover:text-teal-800"
                      >
                        {app.applicationNumber}
                      </Link>
                      <StatusBadge status={app.currentStatus || app.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {app.instrument?.instrumentName || app.instrument?.category || 'Instrument'} •{' '}
                      SN: {app.instrument?.serialNumber || 'N/A'}
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 sm:text-right">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Statutory Alerts & Upcoming Visits (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Statutory Compliance Alerts</span>
            </h2>
            <p className="text-xs text-slate-500">Direct statutory enforcement notifications</p>
          </div>

          <div className="space-y-3">
            {complianceAlerts.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>All registered instruments are currently valid and compliant.</span>
              </div>
            ) : (
              complianceAlerts.map((alert: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    alert.severity === 'CRITICAL'
                      ? 'border-rose-200 bg-rose-50/60'
                      : alert.severity === 'WARNING'
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-teal-200 bg-teal-50/40'
                  }`}
                >
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>{alert.code?.replace(/_/g, ' ')}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    {typeof alert.message === 'object' ? JSON.stringify(alert.message) : String(alert.message || '')}
                  </div>
                  {alert.actionRequired && (
                    <div className="text-teal-900 font-semibold text-[11px] pt-1">
                      Action: {typeof alert.actionRequired === 'object' ? JSON.stringify(alert.actionRequired) : String(alert.actionRequired)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <Link
              to="/applicant/instruments"
              className="w-full py-2 px-3 text-xs font-bold text-center text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition block border border-teal-200"
            >
              Manage All Instruments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
