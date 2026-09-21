import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../services/dashboardApi';
import { stakeholderApi } from '../../services/stakeholderApi';
import { getErrorMessage } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import {
  Scale,
  FileCheck2,
  Award,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  Calendar,
  CheckCircle2,
  Building2,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const ApplicantDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [businessName, setBusinessName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashRes = await dashboardApi.getStakeholderDashboard();

      if (dashRes.success && dashRes.data) {
        setData(dashRes.data);
        if (dashRes.data.stakeholder?.businessName) {
          setBusinessName(dashRes.data.stakeholder.businessName);
        }
      } else {
        setError(dashRes.message || 'Failed to load dashboard metrics');
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
        <div className="space-y-2">
          <LoadingSkeleton rows={1} />
          <LoadingSkeleton rows={1} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingSkeleton rows={3} />
          <LoadingSkeleton rows={3} />
          <LoadingSkeleton rows={3} />
          <LoadingSkeleton rows={3} />
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

  const registeredInstruments = counts.totalInstruments ?? 0;
  const pendingApplications = counts.pendingApplications ?? counts.totalApplications ?? counts.activeApplications ?? 0;
  const activeCertificates = counts.activeVerifiedInstruments ?? counts.verifiedInstruments ?? 0;
  const expiringSoon = (counts.overdueInstruments || 0) + (counts.expiringWithin30Days || counts.expiringWithin7Days || counts.expiringSoon || 0);

  const greetingName = businessName || user?.name || 'Business User';

  return (
    <div className="space-y-6">
      {/* 1. Official Government Header / Greeting */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#123B6D] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                <ShieldCheck className="w-3.5 h-3.5 text-[#123B6D]" />
                <span>Statutory Compliance Portal</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Welcome back, <span className="text-[#123B6D]">{greetingName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Manage your legal metrology instruments, verification applications and certificates.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/applicant/register-instrument"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>Register Instrument</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Real Statistics Cards (4 Clickable Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Registered Instruments */}
        <Link
          to="/applicant/instruments"
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              navigate('/applicant/instruments');
            }
          }}
          className="group block bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-[#123B6D] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#123B6D] focus:ring-offset-2 touch-manipulation select-none"
          aria-label={`Registered Instruments: ${registeredInstruments}. Click to view instruments registry.`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-[#123B6D] transition-colors">
              Registered Instruments
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#123B6D] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {registeredInstruments}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Commercial devices in registry</p>
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#123B6D] mt-3 pt-2.5 border-t border-slate-100 group-hover:text-[#0D2B4F]">
            <span>View registry</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Stat 2: Pending Applications */}
        <Link
          to="/applicant/applications?status=PENDING"
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              navigate('/applicant/applications?status=PENDING');
            }
          }}
          className="group block bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-indigo-600 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 touch-manipulation select-none"
          aria-label={`Pending Applications: ${pendingApplications}. Click to filter pending applications.`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 transition-colors">
              Pending Applications
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {pendingApplications}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">In scrutiny, review or inspection</p>
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-700 mt-3 pt-2.5 border-t border-slate-100 group-hover:text-indigo-900">
            <span>Track pending</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Stat 3: Active Certificates */}
        <Link
          to="/applicant/certificates?status=ACTIVE"
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              navigate('/applicant/certificates?status=ACTIVE');
            }
          }}
          className="group block bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-emerald-600 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 touch-manipulation select-none"
          aria-label={`Active Certificates: ${activeCertificates}. Click to filter active certificates.`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-600 transition-colors">
              Active Certificates
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {activeCertificates}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Legally stamped & verified</p>
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 mt-3 pt-2.5 border-t border-slate-100 group-hover:text-emerald-900">
            <span>View active</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Stat 4: Expiring Soon */}
        <Link
          to="/applicant/instruments?status=EXPIRING_SOON"
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              navigate('/applicant/instruments?status=EXPIRING_SOON');
            }
          }}
          className="group block bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 touch-manipulation select-none"
          aria-label={`Expiring Soon: ${expiringSoon}. Click to view instruments due for reverification.`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-700 transition-colors">
              Expiring Soon
            </span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
              expiringSoon > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {expiringSoon}
              </div>
              {expiringSoon > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  Action Needed
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Due for annual reverification</p>
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 mt-3 pt-2.5 border-t border-slate-100 group-hover:text-amber-900">
            <span>View due devices</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Action 1: Register Instrument */}
          <Link
            to="/applicant/register-instrument"
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                navigate('/applicant/register-instrument');
              }
            }}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 hover:border-[#123B6D] hover:bg-blue-50/50 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#123B6D] focus:ring-offset-2 group text-center min-h-[96px] touch-manipulation select-none"
          >
            <div className="w-9 h-9 rounded-lg bg-[#123B6D] text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition">
              <PlusCircle className="w-5 h-5 text-amber-300" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-[#123B6D]">
              Register Instrument
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 hidden xs:block">
              Add new device
            </span>
          </Link>

          {/* Action 2: Apply for Verification */}
          <Link
            to="/applicant/instruments"
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                navigate('/applicant/instruments');
              }
            }}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 hover:border-[#123B6D] hover:bg-blue-50/50 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#123B6D] focus:ring-offset-2 group text-center min-h-[96px] touch-manipulation select-none"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition border border-indigo-200">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-[#123B6D]">
              Apply Verification
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 hidden xs:block">
              For registered scale
            </span>
          </Link>

          {/* Action 3: Track Application */}
          <Link
            to="/applicant/applications"
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                navigate('/applicant/applications');
              }
            }}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 hover:border-[#123B6D] hover:bg-blue-50/50 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#123B6D] focus:ring-offset-2 group text-center min-h-[96px] touch-manipulation select-none"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition border border-emerald-200">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-[#123B6D]">
              Track Application
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 hidden xs:block">
              Check status & review
            </span>
          </Link>

          {/* Action 4: View Certificates */}
          <Link
            to="/applicant/certificates"
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                navigate('/applicant/certificates');
              }
            }}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 hover:border-[#123B6D] hover:bg-blue-50/50 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#123B6D] focus:ring-offset-2 group text-center min-h-[96px] touch-manipulation select-none"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition border border-amber-200">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-[#123B6D]">
              View Certificates
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 hidden xs:block">
              Download QR PDF
            </span>
          </Link>
        </div>
      </div>

      {/* 4. Recent Applications & Compliance Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Applications</h2>
              <p className="text-xs text-slate-500">Live verification pipeline submissions</p>
            </div>
            <Link
              to="/applicant/applications"
              className="text-xs font-bold text-[#123B6D] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-1">
            {recentApplications.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No applications submitted yet</p>
                <p className="mt-1">Apply for verification to receive statutory inspection certificates.</p>
                <Link
                  to="/applicant/instruments"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#123B6D] hover:underline"
                >
                  <span>Select Instrument to Apply</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              recentApplications.map((app: any) => (
                <div
                  key={app._id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 p-2 rounded-lg transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/applicant/applications/${app._id}`}
                        className="text-xs font-bold text-slate-900 hover:text-[#123B6D]"
                      >
                        {app.applicationNumber}
                      </Link>
                      <StatusBadge status={app.currentStatus || app.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {app.instrument?.instrumentName || app.instrument?.category || 'Instrument'} •{' '}
                      <span className="font-mono">SN: {app.instrument?.serialNumber || 'N/A'}</span>
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 sm:text-right flex sm:flex-col items-center sm:items-end justify-between">
                    <span>{new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <Link
                      to={`/applicant/applications/${app._id}`}
                      className="text-xs font-semibold text-[#123B6D] hover:underline sm:mt-1"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Statutory Compliance Alerts (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Compliance Alerts</span>
            </h2>
            <p className="text-xs text-slate-500">Statutory reverification notices</p>
          </div>

          <div className="space-y-2.5">
            {complianceAlerts.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-bold">Fully Compliant</p>
                  <p className="text-[11px] mt-0.5 text-emerald-700">
                    All registered instruments are legally verified and within statutory validity.
                  </p>
                </div>
              </div>
            ) : (
              complianceAlerts.map((alert: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    alert.severity === 'CRITICAL'
                      ? 'border-rose-200 bg-rose-50/70'
                      : alert.severity === 'WARNING'
                      ? 'border-amber-200 bg-amber-50/60'
                      : 'border-blue-200 bg-blue-50/50'
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
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <Link
              to="/applicant/instruments"
              className="w-full py-2.5 px-3 text-xs font-bold text-center text-[#123B6D] bg-blue-50 hover:bg-blue-100 rounded-lg transition block border border-blue-200"
            >
              Manage Registered Instruments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
