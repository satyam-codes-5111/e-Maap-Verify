import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/StatusBadge';
import {
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ArrowRight,
  Scale,
  MapPin,
  Camera,
  Search,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  PieChart as PieIcon,
  Navigation,
  FileCheck2,
  Wifi,
  WifiOff,
  LayoutGrid,
  Table as TableIcon,
  Smartphone,
  ExternalLink,
  Shield,
  LocateFixed,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface FieldVerificationOfficerDashboardProps {
  counts: any;
  todaySchedules: any[];
  onOpenScanner: () => void;
  onPerformLookup: (code: string) => void;
  quickInput: string;
  setQuickInput: (val: string) => void;
  onQuickSubmit: (e: React.FormEvent) => void;
  isFetchingDetails: boolean;
  recentScans: Array<{ id: string; label: string; date: string }>;
}

const CHART_COLORS = ['#07549A', '#123B6D', '#15803D', '#B45309', '#475569', '#2563EB'];

const DEFAULT_VELOCITY = [
  { day: 'Mon', completed: 8, scheduled: 9 },
  { day: 'Tue', completed: 11, scheduled: 12 },
  { day: 'Wed', completed: 14, scheduled: 15 },
  { day: 'Thu', completed: 9, scheduled: 10 },
  { day: 'Fri', completed: 12, scheduled: 13 },
  { day: 'Sat', completed: 6, scheduled: 7 },
  { day: 'Sun', completed: 2, scheduled: 2 },
];

const DEFAULT_CATEGORIES = [
  { name: 'Electronic Balances', value: 42 },
  { name: 'Platform Scales', value: 28 },
  { name: 'Weighbridges', value: 16 },
  { name: 'Fuel Dispensers', value: 14 },
];

export const FieldVerificationOfficerDashboard: React.FC<FieldVerificationOfficerDashboardProps> = ({
  counts,
  todaySchedules,
  onOpenScanner,
  onPerformLookup,
  quickInput,
  setQuickInput,
  onQuickSubmit,
  isFetchingDetails,
  recentScans,
}) => {
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');
  const [offlineSyncActive, setOfflineSyncActive] = useState<boolean>(true);

  const todayCount = todaySchedules.length > 0 ? todaySchedules.length : (counts.assignedScheduled || 0);
  const pendingCount = counts.assignedPendingInspection ?? counts.assignedPendingReview ?? counts.assignedTotal ?? 0;
  const completedCount = counts.completedInspections ?? counts.passedCount ?? 0;
  const rejectedCount = counts.failedCount ?? counts.rejectedCount ?? 0;

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-6">
      {/* Official Government Notice Bar */}
      <div className="bg-gradient-to-r from-[#0D2B4F] via-[#123B6D] to-[#0A3D62] text-white rounded-xl p-3.5 sm:p-5 shadow-xs border border-[#123B6D]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="flex items-start sm:items-center gap-3 min-w-0 w-full md:w-auto">
          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner mt-0.5 sm:mt-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-sm md:text-base tracking-tight break-words">
                Legal Metrology Field Verification Wing
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-semibold px-2 py-0.5 rounded shrink-0">
                BEAT ENFORCEMENT ACTIVE
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-blue-100/90 mt-0.5 leading-snug">
              On-site accuracy verification, physical stamping & tamper-evident lead seals under Legal Metrology Act, 2009
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={onOpenScanner}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-950 bg-[#FF9933] hover:bg-[#E68524] rounded-lg transition shadow-xs whitespace-nowrap active:scale-95 min-h-[42px]"
          >
            <Camera className="w-3.5 h-3.5 text-slate-950" />
            <span>Launch Camera Scanner</span>
          </button>
          <Link
            to="/officer/schedules"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg border border-white/20 transition whitespace-nowrap min-h-[42px]"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Today's Beat Route</span>
          </Link>
        </div>
      </div>

      {/* Field Geofence & GPS Verification Strip */}
      <div className="bg-white rounded-xl border border-[#D9E2EC] p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#172B4D] min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-[#E8F1FA] text-[#07549A] flex items-center justify-center shrink-0">
            <LocateFixed className="w-4 h-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2 flex-wrap font-semibold">
              <span className="text-[#172B4D] truncate">Active Beat Geofence:</span>
              <span className="font-mono text-[#07549A] text-[11px] bg-[#F5F8FC] px-1.5 py-0.5 rounded border border-[#D9E2EC]">
                28.6315° N, 77.2167° E (±4m)
              </span>
            </div>
            <p className="text-[11px] text-[#5B6B7A] truncate">
              Central Commercial Ward • Stamping Pliers ID: FVO-DEL-PL-04
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setOfflineSyncActive(!offlineSyncActive)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
              offlineSyncActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
            title="Toggle offline inspection cache"
          >
            {offlineSyncActive ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
            <span>{offlineSyncActive ? 'Offline Cache Ready' : 'Online Only'}</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards - Fluid Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        <StatCard
          title="Today's Field Schedules"
          value={todayCount}
          description="Verification schedules allotted for today's beat"
          icon={CalendarDays}
          variant="teal"
          to="/officer/schedules?status=SCHEDULED"
          ariaLabel={`Today's Inspections: ${todayCount}. Click to view scheduled verifications.`}
          badge={todayCount > 0 ? { text: 'Active Duty', type: 'positive' } : undefined}
          className="min-w-0"
        />
        <StatCard
          title="Pending Field Inspections"
          value={pendingCount}
          description="Awaiting on-site calibration & verification"
          icon={ClipboardList}
          variant="amber"
          to="/officer/inspections?status=IN_PROGRESS"
          ariaLabel={`Pending Inspections: ${pendingCount}. Click to view in-progress inspections.`}
          className="min-w-0"
        />
        <StatCard
          title="Stamped & Verified"
          value={completedCount}
          description="Legally stamped with tamper-evident seal"
          icon={CheckCircle2}
          variant="emerald"
          to="/officer/certificates"
          ariaLabel={`Completed Verifications: ${completedCount}. Click to view verified certificates.`}
          className="min-w-0"
        />
        <StatCard
          title="MPE Rejection Verdicts"
          value={rejectedCount}
          description="Exceeded statutory error or defective seals"
          icon={AlertCircle}
          variant="rose"
          to="/officer/inspections?status=FAILED"
          ariaLabel={`Rejection Verdicts: ${rejectedCount}. Click to view failed inspections.`}
          className="min-w-0"
        />
      </div>

      {/* FIELD QR SCANNER HERO BANNER */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0D2B4F] via-[#123B6D] to-[#0A3D62] text-white p-4 sm:p-5 lg:p-6 shadow-xs border border-blue-900/40 min-w-0">
        {/* Decorative Tricolor Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 relative z-10 min-w-0">
          <div className="space-y-1.5 sm:space-y-2 max-w-xl min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] sm:text-[11px] font-bold tracking-wide backdrop-blur-sm border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>ON-SITE INSTANT VERIFICATION LOOKUP</span>
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight break-words">
              Instant Instrument Stamping & Accuracy Lookup
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Scan tamper-evident QR seals, physical serial plates, or certificates to pull up calibration specs and initiate on-site testing.
            </p>

            {/* Quick Demo Test Pills */}
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-blue-200 flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-[#FF9933]" />
                <span className="hidden xs:inline">Test Queries:</span>
              </span>
              {[
                { label: 'INST-PH8-001', code: 'INST-PH8-001' },
                { label: 'SN-PH8-PASS-001', code: 'SN-PH8-PASS-001' },
                { label: 'WB-2026-0041', code: 'WB-2026-0041' },
              ].map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => onPerformLookup(sample.code)}
                  className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-white/10 hover:bg-white/20 text-white rounded-md transition border border-white/10"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Scanner Actions & Input Form */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 min-w-0">
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-3.5 py-2.5 bg-[#FF9933] hover:bg-[#E68524] text-slate-950 font-bold text-xs sm:text-sm rounded-lg transition shadow-md flex items-center justify-center gap-2 active:scale-95 group min-h-[44px] shrink-0"
            >
              <Camera className="w-4 h-4 text-slate-950 group-hover:rotate-6 transition-transform" />
              <span>Camera Scanner</span>
            </button>

            {/* Quick Input Bar */}
            <form onSubmit={onQuickSubmit} className="flex items-center w-full sm:w-60 md:w-64 min-w-0">
              <div className="relative w-full min-w-0">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="ID / Serial / Token"
                  className="w-full pl-3 pr-8 py-2 text-xs bg-white/15 text-white placeholder-blue-200 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:bg-white/25 transition font-medium min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={!quickInput.trim() || isFetchingDetails}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white disabled:opacity-30 rounded-md hover:bg-white/10 min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Search Instrument"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Scans Strip */}
        {recentScans.length > 0 && (
          <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center gap-2 flex-wrap text-xs text-blue-200 min-w-0">
            <span className="text-[11px] font-semibold text-blue-300 shrink-0">Recent Lookups:</span>
            {recentScans.map((scan) => (
              <button
                key={scan.id}
                type="button"
                onClick={() => onPerformLookup(scan.id)}
                className="px-2 py-0.5 text-[11px] rounded-md bg-white/10 hover:bg-white/20 text-white font-mono transition"
              >
                {scan.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Charts Grid: Weekly Velocity + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Weekly Inspection Velocity (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#D9E2EC] p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2EC] gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-[#172B4D] flex items-center gap-1.5 truncate">
                <TrendingUp className="w-4 h-4 text-[#07549A] shrink-0" />
                <span>Field Verification Output & Velocity</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[#5B6B7A] truncate">
                Completed physical verifications vs scheduled beat allotments
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs shrink-0">
              <span className="flex items-center gap-1 text-[#172B4D] font-medium text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#07549A]" />
                <span>Completed</span>
              </span>
              <span className="flex items-center gap-1 text-[#5B6B7A] font-medium text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9E2EC]" />
                <span>Scheduled</span>
              </span>
            </div>
          </div>

          <div className="h-48 sm:h-56 md:h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DEFAULT_VELOCITY} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="fieldVelColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#07549A" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#07549A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5B6B7A' }} stroke="#D9E2EC" />
                <YAxis tick={{ fontSize: 11, fill: '#5B6B7A' }} stroke="#D9E2EC" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B2F57',
                    borderColor: '#123B6D',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#07549A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#fieldVelColor)"
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (1 col) */}
        <div className="bg-white rounded-xl border border-[#D9E2EC] p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0">
          <div className="pb-3 border-b border-[#D9E2EC] min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-[#172B4D] flex items-center gap-1.5 truncate">
              <PieIcon className="w-4 h-4 text-[#07549A] shrink-0" />
              <span>Commercial Device Types</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-[#5B6B7A] truncate">Distribution across inspected trade sectors</p>
          </div>

          <div className="h-44 w-full min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEFAULT_CATEGORIES}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {DEFAULT_CATEGORIES.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B2F57',
                    borderColor: '#123B6D',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs pt-1 min-w-0">
            {DEFAULT_CATEGORIES.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] min-w-0">
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-[#172B4D] truncate">{cat.name}</span>
                </div>
                <span className="font-bold text-[#172B4D] shrink-0 ml-2">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Allotted Schedules Table & Statutory MPE Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Today's Schedule (2 cols): Dual Responsive Card & Table Presentation */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#D9E2EC] p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2EC] gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-[#172B4D] truncate">
                Today's Field Verification Queue
              </h2>
              <p className="text-[11px] sm:text-xs text-[#5B6B7A] truncate">
                Scheduled on-site visits and physical accuracy tests
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {/* View Toggle on smaller screens */}
              <div className="inline-flex rounded-lg border border-[#D9E2EC] p-0.5 bg-[#F5F8FC]">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-md text-xs transition ${
                    viewMode === 'cards' || (viewMode === 'auto')
                      ? 'bg-white text-[#123B6D] shadow-2xs font-bold'
                      : 'text-[#5B6B7A] hover:text-[#172B4D]'
                  }`}
                  title="Mobile Card View"
                  aria-label="Switch to Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md text-xs transition ${
                    viewMode === 'table'
                      ? 'bg-white text-[#123B6D] shadow-2xs font-bold'
                      : 'text-[#5B6B7A] hover:text-[#172B4D]'
                  }`}
                  title="Dense Table View"
                  aria-label="Switch to Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              <Link
                to="/officer/schedules"
                className="text-xs font-bold text-[#123B6D] hover:text-[#07549A] flex items-center gap-1 transition"
              >
                <span>All Schedules</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* EMPTY STATE */}
          {todaySchedules.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#5B6B7A] space-y-1">
              <p className="font-semibold text-slate-700">No field inspections scheduled for today's beat.</p>
              <p className="text-[11px]">Allotments from the Legal Metrology Officer will appear here.</p>
            </div>
          ) : (
            <>
              {/* MOBILE CARD VIEW: Visible when viewMode === 'cards' OR on small screens when 'auto' */}
              <div
                className={`space-y-2.5 ${
                  viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block md:hidden'
                }`}
              >
                {todaySchedules.map((sch: any) => (
                  <div
                    key={sch._id}
                    className="p-3 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg space-y-2.5 hover:border-[#07549A]/30 transition shadow-2xs min-w-0"
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0">
                        <span className="inline-block px-2 py-0.5 bg-[#E8F1FA] text-[#07549A] rounded text-[10px] font-mono font-bold">
                          {sch.timeSlot || 'Beat Allotment'}
                        </span>
                        <h3 className="font-bold text-xs text-[#172B4D] mt-1 truncate">
                          {sch.stakeholder?.businessName || sch.application?.stakeholder?.businessName || 'Business Establishment'}
                        </h3>
                      </div>
                      <StatusBadge status={sch.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#5B6B7A] min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-[#07549A] shrink-0" />
                      <span className="truncate">
                        {sch.locationAddress || sch.location?.district || sch.application?.stakeholder?.district || 'District Beat'}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-2 border-t border-[#D9E2EC]/60">
                      <span className="text-[10px] text-[#5B6B7A]">
                        {sch.scheduledDate ? new Date(sch.scheduledDate).toLocaleDateString() : 'Scheduled Today'}
                      </span>
                      <Link
                        to={`/officer/inspections?scheduleId=${sch._id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#07549A] hover:bg-[#0B2F57] rounded-md transition shadow-2xs min-h-[38px]"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Start Inspection</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP/TABLET TABLE VIEW: Visible when viewMode === 'table' OR on medium+ screens when 'auto' */}
              <div
                className={`overflow-x-auto -mx-3.5 px-3.5 sm:mx-0 sm:px-0 ${
                  viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden md:block'
                }`}
              >
                <table className="w-full text-xs text-left min-w-[540px]">
                  <thead className="bg-[#F5F8FC] text-[#172B4D] text-[11px] uppercase tracking-wider font-bold border-b border-[#D9E2EC]">
                    <tr>
                      <th className="py-2.5 px-3">Slot / Beat</th>
                      <th className="py-2.5 px-3">Commercial Trader</th>
                      <th className="py-2.5 px-3">Premise Location</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9E2EC]">
                    {todaySchedules.map((sch: any) => (
                      <tr key={sch._id} className="hover:bg-[#F8FAFC] transition">
                        <td className="py-2.5 px-3 font-semibold text-[#172B4D] font-mono text-[11px] whitespace-nowrap">
                          {sch.timeSlot || 'Allotted Slot'}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#172B4D]">
                          <span className="truncate block max-w-[180px]">
                            {sch.stakeholder?.businessName || sch.application?.stakeholder?.businessName || 'Business Establishment'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#5B6B7A]">
                          <div className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-[#5B6B7A] shrink-0" />
                            <span className="truncate max-w-[160px]">
                              {sch.locationAddress || sch.location?.district || sch.application?.stakeholder?.district || 'District Beat'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusBadge status={sch.status} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <Link
                            to={`/officer/inspections?scheduleId=${sch._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-[#07549A] hover:bg-[#0B2F57] rounded transition shadow-2xs whitespace-nowrap"
                          >
                            <PlayCircle className="w-3 h-3" />
                            <span>Inspect</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Quick Statutory MPE Limits Reference (1 col) */}
        <div className="bg-white rounded-xl border border-[#D9E2EC] p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0">
          <div className="pb-3 border-b border-[#D9E2EC] flex items-center justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-[#172B4D] flex items-center gap-2 truncate">
                <Scale className="w-4 h-4 text-[#07549A] shrink-0" />
                <span>Statutory Limits (MPE)</span>
              </h2>
              <p className="text-[11px] text-[#5B6B7A] truncate">Legal Metrology (General) Rules, 2011</p>
            </div>
            <button
              type="button"
              onClick={onOpenScanner}
              className="p-1.5 text-[#07549A] hover:bg-[#E8F1FA] rounded-md transition shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Scan Instrument for MPE"
              aria-label="Scan Instrument for MPE"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs text-[#172B4D] min-w-0">
            <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#D9E2EC] space-y-1 min-w-0">
              <div className="font-bold text-[#172B4D] text-xs">Class III (Medium Accuracy)</div>
              <p className="text-[11px] text-[#5B6B7A] leading-relaxed">
                0 to 500e: ±0.5e | 501e to 2000e: ±1.0e | &gt;2000e: ±1.5e
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#D9E2EC] space-y-1 min-w-0">
              <div className="font-bold text-[#172B4D] text-xs">Class II (High Accuracy)</div>
              <p className="text-[11px] text-[#5B6B7A] leading-relaxed">
                0 to 5000e: ±0.5e | 5001e to 20000e: ±1.0e | &gt;20000e: ±1.5e
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#D9E2EC] space-y-1 min-w-0">
              <div className="font-bold text-[#172B4D] text-xs">Class I (Special Accuracy)</div>
              <p className="text-[11px] text-[#5B6B7A] leading-relaxed">
                0 to 50000e: ±0.5e | 50001e to 200000e: ±1.0e
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#D9E2EC] space-y-1 min-w-0">
              <div className="font-bold text-[#172B4D] text-xs">Tamper-Evident Lead Seal</div>
              <p className="text-[11px] text-[#5B6B7A] leading-relaxed">
                Every verified instrument must be stamped with official department pliers and wire seal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldVerificationOfficerDashboard;
