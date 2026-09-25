import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/StatusBadge';
import {
  FileCheck2,
  ShieldAlert,
  AlertCircle,
  Award,
  Building2,
  Search,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  PieChart as PieIcon,
  PlayCircle,
  Users,
  Scale,
  FileSpreadsheet,
  Gavel,
  ArrowRight,
  ExternalLink,
  LayoutGrid,
  Table as TableIcon,
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

interface LmoOfficerDashboardProps {
  counts: any;
  onOpenScanner: () => void;
  onPerformLookup: (code: string) => void;
  quickInput: string;
  setQuickInput: (val: string) => void;
  onQuickSubmit: (e: React.FormEvent) => void;
  isFetchingDetails: boolean;
  recentScans: Array<{ id: string; label: string; date: string }>;
}

const CHART_COLORS = ['#123B6D', '#07549A', '#B45309', '#B91C1C', '#15803D'];

const DEFAULT_LMO_TRENDS = [
  { month: 'Jan', scrutinized: 42, approved: 38 },
  { month: 'Feb', scrutinized: 54, approved: 51 },
  { month: 'Mar', scrutinized: 68, approved: 63 },
  { month: 'Apr', scrutinized: 60, approved: 57 },
  { month: 'May', scrutinized: 75, approved: 70 },
  { month: 'Jun', scrutinized: 82, approved: 78 },
];

const DEFAULT_VIOLATION_SECTIONS = [
  { name: 'Sec 25: Non-standard Weights', value: 42 },
  { name: 'Sec 36: Packaged Commodities', value: 35 },
  { name: 'Sec 30: Non-standard Quoting', value: 15 },
  { name: 'Sec 33: Unstamped Measure', value: 8 },
];

// Sample LMO scrutiny and enforcement docket
const SAMPLE_LMO_DOCKET = [
  {
    id: 'APP-2026-0814',
    trader: 'Shree Krishna Agro Traders',
    type: 'Periodic Annual Re-verification',
    instrument: 'Electronic Weighbridge (50MT)',
    assignedOfficer: 'Insp. R. Sharma (FVO)',
    status: 'UNDER_REVIEW',
    priority: 'HIGH',
  },
  {
    id: 'SEIZ-2026-0042',
    trader: 'Metro Fresh Supermarket Beat #3',
    type: 'Market Raid Seizure Memo',
    instrument: '3x Unstamped Counter Scales',
    assignedOfficer: 'Insp. S. Verma (LMO)',
    status: 'PENDING_COMPOUNDING',
    priority: 'CRITICAL',
  },
  {
    id: 'APP-2026-0820',
    trader: 'Bharat Petroleum Retail Outlet #14',
    type: 'New Stamping & Pattern Approval',
    instrument: 'Multi-Product Dispenser (MPD)',
    assignedOfficer: 'Insp. A. Patel (FVO)',
    status: 'SCHEDULED',
    priority: 'NORMAL',
  },
  {
    id: 'APP-2026-0825',
    trader: 'Diamond Jewels & Gems',
    type: 'Class II High Precision Stamping',
    instrument: 'Electronic Carat Balance',
    assignedOfficer: 'GATC Lab Wing',
    status: 'VERIFIED',
    priority: 'NORMAL',
  },
];

export const LmoOfficerDashboard: React.FC<LmoOfficerDashboardProps> = ({
  counts,
  onOpenScanner,
  onPerformLookup,
  quickInput,
  setQuickInput,
  onQuickSubmit,
  isFetchingDetails,
  recentScans,
}) => {
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  const scrutinyQueueCount = counts.assignedPendingReview ?? counts.assignedPendingInspection ?? 18;
  const activeRaidsCount = 6;
  const compoundingCasesCount = 11;
  const approvedCertificatesCount = counts.completedInspections ?? counts.passedCount ?? 84;

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-6">
      {/* Official Government Notice Bar */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#0B2F57] to-[#1E3A8A] text-white rounded-xl p-3.5 sm:p-5 shadow-xs border border-[#123B6D]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="flex items-start sm:items-center gap-3 min-w-0 w-full md:w-auto">
          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner mt-0.5 sm:mt-0">
            <Gavel className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-sm md:text-base tracking-tight break-words">
                Legal Metrology Enforcement & Statutory Wing
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-400/30 font-semibold px-2 py-0.5 rounded shrink-0">
                JUDICIAL AUTHORITY
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-blue-100/90 mt-0.5 leading-snug">
              Statutory verification scrutiny, officer allotments, market surveillance & compounding under Legal Metrology Act, 2009
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
          <Link
            to="/officer/schedules"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-950 bg-[#FF9933] hover:bg-[#E68524] rounded-lg transition shadow-xs whitespace-nowrap active:scale-95 min-h-[42px]"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-slate-950" />
            <span>Schedule Market Raid</span>
          </Link>
          <Link
            to="/officer/inspections"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg border border-white/20 transition whitespace-nowrap min-h-[42px]"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Scrutiny Queue</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards - Fluid Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        <StatCard
          title="Applications for Scrutiny"
          value={scrutinyQueueCount}
          description="Verification requests awaiting statutory approval"
          icon={FileCheck2}
          variant="indigo"
          to="/officer/inspections?status=UNDER_REVIEW"
          ariaLabel={`Applications for Scrutiny: ${scrutinyQueueCount}. Click to review.`}
          badge={{ text: 'Action Needed', type: 'warning' }}
          className="min-w-0"
        />
        <StatCard
          title="Active Market Raids"
          value={activeRaidsCount}
          description="Surprise surveillance visits in jurisdiction"
          icon={ShieldAlert}
          variant="amber"
          to="/officer/schedules"
          ariaLabel={`Active Raids: ${activeRaidsCount}. Click to view schedules.`}
          className="min-w-0"
        />
        <StatCard
          title="Seizures & Compounding"
          value={compoundingCasesCount}
          description="Offenses booked under Sections 25 & 36"
          icon={AlertCircle}
          variant="rose"
          to="/officer/inspections?status=FAILED"
          ariaLabel={`Seizures: ${compoundingCasesCount}. Click to view compounding docket.`}
          className="min-w-0"
        />
        <StatCard
          title="Certificates Approved"
          value={approvedCertificatesCount}
          description="Legally certified verification stamps granted"
          icon={Award}
          variant="emerald"
          to="/officer/certificates"
          ariaLabel={`Certificates: ${approvedCertificatesCount}. Click to view verified certificates.`}
          className="min-w-0"
        />
      </div>

      {/* STATUTORY ENFORCEMENT & COMPLIANCE HERO BANNER */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0B2F57] via-[#123B6D] to-[#0A3D62] text-white p-4 sm:p-5 lg:p-6 shadow-xs border border-blue-900/40 min-w-0">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 relative z-10 min-w-0">
          <div className="space-y-1.5 sm:space-y-2 max-w-xl min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] sm:text-[11px] font-bold tracking-wide backdrop-blur-sm border border-white/15">
              <Building2 className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>STATUTORY ENFORCEMENT & MARKET SURVEILLANCE</span>
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight break-words">
              Judicial Oversight, Allotments & Seizure Records
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Exercise statutory powers to issue compounding notices, schedule surprise market surveillance raids, and verify stakeholder compliance nationwide.
            </p>

            {/* Quick Demo Test Pills */}
            <div className="pt-1 flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[11px] text-blue-200 flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-[#FF9933]" />
                <span className="hidden xs:inline">Active Case Files:</span>
              </span>
              {[
                { label: 'CASE-2026-081', code: 'CASE-2026-081' },
                { label: 'RAID-DEL-04', code: 'RAID-DEL-04' },
                { label: 'WB-SEIZE-02', code: 'WB-SEIZE-02' },
              ].map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => onPerformLookup(s.code)}
                  className="px-2 py-0.5 text-[10px] font-mono bg-white/10 hover:bg-white/20 text-white rounded-md transition border border-white/10"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions & Input Form */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 min-w-0">
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-3.5 py-2.5 bg-[#FF9933] hover:bg-[#E68524] text-slate-950 font-bold text-xs sm:text-sm rounded-lg transition shadow-md flex items-center justify-center gap-2 active:scale-95 group min-h-[44px] shrink-0"
            >
              <Search className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
              <span>Verify Trader / Seal</span>
            </button>

            <form onSubmit={onQuickSubmit} className="flex items-center w-full sm:w-60 md:w-64 min-w-0">
              <div className="relative w-full min-w-0">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Case # / Trader / Token"
                  className="w-full pl-3 pr-8 py-2 text-xs bg-white/15 text-white placeholder-blue-200 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:bg-white/25 transition font-medium min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={!quickInput.trim() || isFetchingDetails}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white disabled:opacity-30 rounded-md hover:bg-white/10 min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Search Case"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Scans History */}
        {recentScans.length > 0 && (
          <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center gap-2 flex-wrap text-xs text-blue-200 min-w-0">
            <span className="text-[11px] font-semibold text-blue-300 shrink-0">Recent Inquiries:</span>
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

      {/* Charts Grid: Scrutiny Trends + Violation Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Scrutiny & Approval Volume (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#D9E2EC] p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2EC] gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-[#172B4D] flex items-center gap-1.5 truncate">
                <TrendingUp className="w-4 h-4 text-[#07549A] shrink-0" />
                <span>Statutory Scrutiny & Approval Velocity</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[#5B6B7A] truncate">
                Applications scrutinized vs final legal verification approvals
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs shrink-0">
              <span className="flex items-center gap-1 text-[#172B4D] font-medium text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#07549A]" />
                <span>Scrutinized</span>
              </span>
              <span className="flex items-center gap-1 text-[#15803D] font-medium text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
                <span>Approved</span>
              </span>
            </div>
          </div>

          <div className="h-48 sm:h-56 md:h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DEFAULT_LMO_TRENDS} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="lmoScrutinyColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#07549A" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#07549A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5B6B7A' }} stroke="#D9E2EC" />
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
                  dataKey="scrutinized"
                  stroke="#07549A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#lmoScrutinyColor)"
                  name="Scrutinized"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violations Donut (1 col) */}
        <div className="bg-white rounded-xl border border-[#D9E2EC] p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0">
          <div className="pb-3 border-b border-[#D9E2EC] min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-[#172B4D] flex items-center gap-1.5 truncate">
              <PieIcon className="w-4 h-4 text-[#07549A] shrink-0" />
              <span>Offenses by Statutory Section</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-[#5B6B7A] truncate">Breakdown under Legal Metrology Act, 2009</p>
          </div>

          <div className="h-44 w-full min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEFAULT_VIOLATION_SECTIONS}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {DEFAULT_VIOLATION_SECTIONS.map((_, index) => (
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
            {DEFAULT_VIOLATION_SECTIONS.map((v, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] min-w-0">
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-[#172B4D] truncate">{v.name}</span>
                </div>
                <span className="font-bold text-[#172B4D] shrink-0 ml-2">{v.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statutory Application & Scrutiny Docket: Dual Responsive Card & Table Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Scrutiny Docket (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#D9E2EC] p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2EC] gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-[#172B4D] truncate">
                Statutory Scrutiny & Approval Docket
              </h2>
              <p className="text-[11px] sm:text-xs text-[#5B6B7A] truncate">
                Applications, field officer inspection results & compounding cases
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
                  title="Card View"
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
                  title="Table View"
                  aria-label="Switch to Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              <Link
                to="/officer/inspections"
                className="text-xs font-bold text-[#123B6D] hover:text-[#07549A] flex items-center gap-1 transition"
              >
                <span>All Cases</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* MOBILE CARD VIEW: Visible when viewMode === 'cards' OR on small screens when 'auto' */}
          <div
            className={`space-y-2.5 ${
              viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block md:hidden'
            }`}
          >
            {SAMPLE_LMO_DOCKET.map((row) => (
              <div
                key={row.id}
                className="p-3 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg space-y-2.5 hover:border-[#07549A]/30 transition shadow-2xs min-w-0"
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 bg-[#E8F1FA] text-[#07549A] rounded text-[10px] font-mono font-bold">
                      {row.id}
                    </span>
                    <h3 className="font-bold text-xs text-[#172B4D] mt-1 truncate">{row.trader}</h3>
                  </div>
                  <StatusBadge status={row.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded border border-[#D9E2EC]/70">
                  <div>
                    <span className="text-[#5B6B7A] text-[10px] block">Instrument & Type</span>
                    <span className="font-semibold text-[#172B4D] truncate block">{row.instrument}</span>
                    <span className="text-[10px] text-[#5B6B7A] truncate block">{row.type}</span>
                  </div>
                  <div>
                    <span className="text-[#5B6B7A] text-[10px] block">Assigned Officer</span>
                    <span className="font-semibold text-[#172B4D] truncate block">{row.assignedOfficer}</span>
                    <span className={`text-[10px] font-bold ${row.priority === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}`}>
                      Priority: {row.priority}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-end">
                  <Link
                    to={`/officer/inspections?caseId=${row.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#07549A] hover:bg-[#0B2F57] rounded-md transition shadow-2xs min-h-[38px]"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Scrutinize & Direct</span>
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
            <table className="w-full text-xs text-left min-w-[560px]">
              <thead className="bg-[#F5F8FC] text-[#172B4D] text-[11px] uppercase tracking-wider font-bold border-b border-[#D9E2EC]">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Commercial Trader</th>
                  <th className="py-2.5 px-3">Category & Scope</th>
                  <th className="py-2.5 px-3">Assigned Officer</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EC]">
                {SAMPLE_LMO_DOCKET.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="py-2.5 px-3 font-semibold text-[#123B6D] font-mono text-[11px] whitespace-nowrap">
                      {row.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#172B4D]">
                      <span className="truncate block max-w-[160px]">{row.trader}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#5B6B7A]">
                      <div className="font-medium text-[#172B4D] truncate max-w-[180px]">{row.instrument}</div>
                      <div className="text-[10px] text-[#5B6B7A] truncate max-w-[180px]">{row.type}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[#172B4D] text-[11px] whitespace-nowrap">
                      {row.assignedOfficer}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Link
                        to={`/officer/inspections?caseId=${row.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-[#07549A] hover:bg-[#0B2F57] rounded transition shadow-2xs whitespace-nowrap"
                      >
                        <PlayCircle className="w-3 h-3" />
                        <span>Scrutinize</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statutory Offenses Reference Card (1 col) */}
        <div className="bg-white rounded-xl border border-[#D9E2EC] p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0">
          <div className="pb-3 border-b border-[#D9E2EC] min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-[#172B4D] flex items-center gap-2 truncate">
              <Gavel className="w-4 h-4 text-[#07549A] shrink-0" />
              <span>Statutory Penalties Reference</span>
            </h2>
            <p className="text-[11px] text-[#5B6B7A] truncate">Legal Metrology Act, 2009 Provisions</p>
          </div>

          <div className="space-y-2.5 text-xs text-[#172B4D] min-w-0">
            <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#D9E2EC] space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap min-w-0">
                <span className="font-bold text-[#172B4D] truncate">Section 25: Non-standard Weight</span>
                <span className="text-[10px] font-bold text-[#B91C1C] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300 shrink-0">
                  Penalty ₹25k
                </span>
              </div>
              <p className="text-[11px] text-[#5B6B7A] leading-relaxed">
                Use of unverified / non-standard weights. Second offense carries imprisonment up to 6 months.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#D9E2EC] space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap min-w-0">
                <span className="font-bold text-[#172B4D] truncate">Section 30: Quoting Non-standard</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                  Penalty ₹10k
                </span>
              </div>
              <p className="text-[11px] text-[#5B6B7A] leading-relaxed">
                Advertising or quoting prices in non-metric or non-standard statutory units.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#D9E2EC] space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap min-w-0">
                <span className="font-bold text-[#172B4D] truncate">Section 36: Packaged Commodities</span>
                <span className="text-[10px] font-bold text-[#B91C1C] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300 shrink-0">
                  Up to ₹1,00,000
                </span>
              </div>
              <p className="text-[11px] text-[#5B6B7A] leading-relaxed">
                Manufacturing, packing, or selling pre-packaged goods not conforming to standard declaration rules.
              </p>
            </div>

            <div className="pt-1 min-w-0">
              <Link
                to="/officer/inspections"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#123B6D] bg-[#E8F1FA] hover:bg-[#d8e8f8] border border-[#07549A]/30 rounded-lg transition min-h-[40px]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#07549A]" />
                <span>View Compounding Register</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LmoOfficerDashboard;
