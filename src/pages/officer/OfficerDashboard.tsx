import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../services/dashboardApi';
import { instrumentApi } from '../../services/instrumentApi';
import { getErrorMessage } from '../../services/api';
import { parseQrCertificateToken } from '../../hooks/useNativeBarcode';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { OfficerQrScannerModal } from '../../components/officer/OfficerQrScannerModal';
import { ScannedInstrumentDetailModal } from '../../components/officer/ScannedInstrumentDetailModal';
import { InstrumentScanLookupResult } from '../../types';
import {
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ArrowRight,
  Scale,
  MapPin,
  QrCode,
  Camera,
  Search,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Field QR Scanner states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [scannedResult, setScannedResult] = useState<InstrumentScanLookupResult | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [recentScans, setRecentScans] = useState<Array<{ id: string; label: string; date: string }>>([]);

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

    // Load recent scans from localStorage
    try {
      const saved = localStorage.getItem('officer_recent_scans');
      if (saved) {
        setRecentScans(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save to recent scans history
  const saveToRecentScans = (id: string, label: string) => {
    try {
      const updated = [
        { id, label, date: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
        ...recentScans.filter((s) => s.id !== id),
      ].slice(0, 5);
      setRecentScans(updated);
      localStorage.setItem('officer_recent_scans', JSON.stringify(updated));
    } catch {}
  };

  // Perform lookup on scanned code or manual text
  const handlePerformLookup = async (rawCode: string) => {
    const token = parseQrCertificateToken(rawCode);
    if (!token) return;

    setIsScannerOpen(false);
    setIsFetchingDetails(true);

    try {
      const res = await instrumentApi.lookupByScan(token);
      if (res && res.data) {
        setScannedResult(res.data);
        setIsDetailModalOpen(true);

        if (res.data.found && res.data.instrument) {
          const instLabel =
            res.data.instrument.instrumentId ||
            res.data.instrument.serialNumber ||
            token;
          saveToRecentScans(token, instLabel);
        }
      } else {
        setScannedResult({
          found: false,
          query: token,
          message: 'No response from Legal Metrology Central Registry.',
        });
        setIsDetailModalOpen(true);
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setScannedResult({
        found: false,
        query: token,
        message: msg || 'Failed to connect to Legal Metrology Registry.',
      });
      setIsDetailModalOpen(true);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    handlePerformLookup(quickInput.trim());
  };

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

  const todayCount = todaySchedules.length > 0 ? todaySchedules.length : (counts.assignedScheduled || 0);
  const pendingCount = counts.assignedPendingInspection ?? counts.assignedPendingReview ?? counts.assignedTotal ?? 0;
  const completedCount = counts.completedInspections ?? counts.passedCount ?? 0;
  const rejectedCount = counts.failedCount ?? counts.rejectedCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header with Primary QR Scanner Action */}
      <PageHeader
        title="Enforcement Officer Command"
        description="Legal Metrology verification schedules, accuracy testing, and field inspections"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] active:scale-95 rounded-lg transition shadow-sm border border-blue-900"
            >
              <QrCode className="w-4 h-4 text-[#FF9933]" />
              <span>Scan Instrument QR</span>
            </button>

            <Link
              to="/officer/schedules"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Today's Schedule</span>
            </Link>
          </div>
        }
      />

      {/* FIELD QR SCANNER HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D2B4F] via-[#123B6D] to-[#0A3D62] text-white p-5 sm:p-6 shadow-md border border-blue-900/40">
        {/* Decorative Tricolor Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold tracking-wide backdrop-blur-sm border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>LEGAL METROLOGY ON-SITE FIELD VERIFICATION</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Instant Instrument Stamping & Accuracy Lookup
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Scan tamper-evident QR seals, physical serial plates, or verification certificates to instantly pull up technical specs, calibration history, and start on-site inspections.
            </p>

            {/* Quick Demo Test Pills */}
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-blue-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FF9933]" />
                <span>Test Queries:</span>
              </span>
              {[
                { label: 'Sample Balance (INST-PH8-001)', code: 'INST-PH8-001' },
                { label: 'Serial (SN-PH8-PASS-001)', code: 'SN-PH8-PASS-001' },
                { label: 'Weighbridge (WB-2026-0041)', code: 'WB-2026-0041' },
              ].map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => handlePerformLookup(sample.code)}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white rounded-md transition border border-white/10"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Scanner Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-3 bg-[#FF9933] hover:bg-[#E68524] text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 active:scale-95 group"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 group-hover:rotate-6 transition-transform" />
              <span>Launch Camera Scanner</span>
            </button>

            {/* Quick Input Bar */}
            <form onSubmit={handleQuickSubmit} className="flex items-center">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Type ID / Serial / Token"
                  className="w-full pl-3 pr-9 py-2.5 text-xs bg-white/15 text-white placeholder-blue-200 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:bg-white/25 transition font-medium"
                />
                <button
                  type="submit"
                  disabled={!quickInput.trim() || isFetchingDetails}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-white/80 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/10"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Scans Strip */}
        {recentScans.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 flex-wrap text-xs text-blue-200">
            <span className="text-[11px] font-semibold text-blue-300">Recent Lookups:</span>
            {recentScans.map((scan) => (
              <button
                key={scan.id}
                type="button"
                onClick={() => handlePerformLookup(scan.id)}
                className="px-2 py-0.5 text-[11px] rounded-md bg-white/10 hover:bg-white/20 text-white font-mono transition"
              >
                {scan.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading Banner when fetching details */}
      {isFetchingDetails && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#123B6D] animate-spin" />
            <div>
              <p className="text-xs font-bold text-[#123B6D]">
                Connecting to Legal Metrology National Registry...
              </p>
              <p className="text-[11px] text-slate-500">
                Verifying digital seal, statutory MPE tolerances, and calibration history.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">Please wait</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Inspections"
          value={todayCount}
          description="Verification schedules allotted for today"
          icon={CalendarDays}
          variant="teal"
          to="/officer/schedules?status=SCHEDULED"
          ariaLabel={`Today's Inspections: ${todayCount}. Click to view scheduled verifications.`}
          badge={todayCount > 0 ? { text: 'Active Duty', type: 'positive' } : undefined}
        />
        <StatCard
          title="Pending Inspections"
          value={pendingCount}
          description="Awaiting on-site calibration and testing"
          icon={ClipboardList}
          variant="amber"
          to="/officer/inspections?status=IN_PROGRESS"
          ariaLabel={`Pending Inspections: ${pendingCount}. Click to view in-progress inspections.`}
        />
        <StatCard
          title="Completed Verifications"
          value={completedCount}
          description="Legally stamped & certified instruments"
          icon={CheckCircle2}
          variant="emerald"
          to="/officer/certificates"
          ariaLabel={`Completed Verifications: ${completedCount}. Click to view verified certificates.`}
        />
        <StatCard
          title="Rejection Verdicts"
          value={rejectedCount}
          description="Failed MPE or defective instruments"
          icon={AlertCircle}
          variant="rose"
          to="/officer/inspections?status=FAILED"
          ariaLabel={`Rejection Verdicts: ${rejectedCount}. Click to view failed inspections.`}
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
                        {sch.timeSlot || 'Slot not specified'}
                      </span>
                      <StatusBadge status={sch.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      {sch.stakeholder?.businessName || sch.application?.stakeholder?.businessName || 'Business Premise'}
                    </p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">
                        {sch.locationAddress || sch.location?.district || sch.application?.stakeholder?.district || 'Jurisdiction Beat'}
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
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-700" />
                <span>Statutory Limits (MPE)</span>
              </h2>
              <p className="text-xs text-slate-500">Legal Metrology (General) Rules, 2011</p>
            </div>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="p-1.5 text-teal-800 hover:bg-teal-50 rounded-lg transition"
              title="Scan Instrument for MPE"
            >
              <QrCode className="w-4 h-4" />
            </button>
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

      {/* QR Scanner Camera Modal */}
      <OfficerQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedCode) => handlePerformLookup(scannedCode)}
        isLoading={isFetchingDetails}
      />

      {/* Scanned Instrument Details Dossier Modal */}
      <ScannedInstrumentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        scanResult={scannedResult}
        onScanAnother={() => {
          setIsDetailModalOpen(false);
          setIsScannerOpen(true);
        }}
      />
    </div>
  );
};
