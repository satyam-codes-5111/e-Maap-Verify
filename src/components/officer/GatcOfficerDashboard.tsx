import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/StatusBadge';
import {
  Cpu,
  Scale,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  ArrowRight,
  Search,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  Thermometer,
  Droplets,
  Gauge,
  PlayCircle,
  FileCheck2,
  Award,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface GatcOfficerDashboardProps {
  counts: any;
  onOpenScanner: () => void;
  onPerformLookup: (code: string) => void;
  quickInput: string;
  setQuickInput: (val: string) => void;
  onQuickSubmit: (e: React.FormEvent) => void;
  isFetchingDetails: boolean;
  recentScans: Array<{ id: string; label: string; date: string }>;
}

const CHART_COLORS = ['#07549A', '#123B6D', '#15803D', '#B45309', '#475569', '#2563EB'];

const DEFAULT_LAB_OUTPUT = [
  { day: 'Mon', calibrated: 12, target: 15 },
  { day: 'Tue', calibrated: 16, target: 15 },
  { day: 'Wed', calibrated: 18, target: 15 },
  { day: 'Thu', calibrated: 14, target: 15 },
  { day: 'Fri', calibrated: 20, target: 15 },
  { day: 'Sat', calibrated: 9, target: 10 },
  { day: 'Sun', calibrated: 4, target: 5 },
];

const DEFAULT_PRECISION_CLASSES = [
  { name: 'Class I (Special Accuracy)', value: 24 },
  { name: 'Class II (High Precision)', value: 38 },
  { name: 'Class III (Medium Lab)', value: 22 },
  { name: 'Reference Mass Standards', value: 16 },
];

// Sample active GATC laboratory calibration docket
const SAMPLE_LAB_DOCKET = [
  {
    id: 'GATC-2026-0091',
    applicant: 'Aura Biotech Research Labs',
    instrument: 'Microbalance (0.001 mg)',
    category: 'Class I Precision Balance',
    referenceMass: 'NPL Class E1 (100g Set)',
    status: 'IN_PROGRESS',
    due: 'Today, 03:00 PM',
  },
  {
    id: 'GATC-2026-0092',
    applicant: 'Apex Pharma Formulations',
    instrument: 'Analytical Scale (0.01g)',
    category: 'Class II High Precision',
    referenceMass: 'NPL Class E2 Standard',
    status: 'SCHEDULED',
    due: 'Today, 04:30 PM',
  },
  {
    id: 'GATC-2026-0093',
    applicant: 'Hindustan Heavy Industries',
    instrument: 'Industrial Load Cell (500 kg)',
    category: 'Class III Industrial Force',
    referenceMass: 'Class F1 Hydraulic Prover',
    status: 'SCHEDULED',
    due: 'Tomorrow, 10:00 AM',
  },
  {
    id: 'GATC-2026-0094',
    applicant: 'Precision Standard Measures',
    instrument: 'Working Standard Set',
    category: 'Class F2 Reference Mass',
    referenceMass: 'National Primary Mass Prototype',
    status: 'VERIFIED',
    due: 'Completed',
  },
];

export const GatcOfficerDashboard: React.FC<GatcOfficerDashboardProps> = ({
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

  const pendingTesting = counts.assignedPendingInspection ?? counts.assignedPendingReview ?? 14;
  const highPrecisionCount = 38;
  const verifiedCount = counts.completedInspections ?? counts.passedCount ?? 76;
  const rejectedCount = counts.failedCount ?? 2;

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-6">
      {/* Official Government Notice Bar */}
      <div className="bg-gradient-to-r from-[#0B2F57] via-[#123B6D] to-[#07549A] text-white rounded-xl p-3.5 sm:p-5 shadow-xs border border-[#123B6D]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="flex items-start sm:items-center gap-3 min-w-0 w-full md:w-auto">
          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner mt-0.5 sm:mt-0">
            <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-sm md:text-base tracking-tight break-words">
                GATC Metrology Laboratory & Calibration Wing
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-semibold px-2 py-0.5 rounded shrink-0">
                NPL TRACEABLE STANDARDS
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-blue-100/90 mt-0.5 leading-snug">
              ISO/IEC 17025 compliant calibration, pattern approval verification & high precision Class I/II testing
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={onOpenScanner}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-950 bg-[#FF9933] hover:bg-[#E68524] rounded-lg transition shadow-xs whitespace-nowrap active:scale-95 min-h-[42px]"
          >
            <Cpu className="w-3.5 h-3.5 text-slate-950" />
            <span>Scan Lab Batch QR</span>
          </button>
          <Link
            to="/officer/inspections"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg border border-white/20 transition whitespace-nowrap min-h-[42px]"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Calibration Docket</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards - Fluid Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        <StatCard
          title="Lab Testing Queue"
          value={pendingTesting}
          description="Awaiting metrology bench calibration"
          icon={Cpu}
          variant="blue"
          to="/officer/inspections?status=IN_PROGRESS"
          ariaLabel={`Lab Testing Queue: ${pendingTesting}. Click to view queue.`}
          badge={{ text: 'Bench Active', type: 'info' }}
          className="min-w-0"
        />
        <StatCard
          title="Precision Class I & II"
          value={highPrecisionCount}
          description="Analytical & microbalance standards"
          icon={Scale}
          variant="indigo"
          to="/officer/inspections"
          ariaLabel={`High Precision Samples: ${highPrecisionCount}. Click to view.`}
          className="min-w-0"
        />
        <StatCard
          title="Traceability Certified"
          value={verifiedCount}
          description="Calibrated against NPL secondary standards"
          icon={CheckCircle2}
          variant="emerald"
          to="/officer/certificates"
          ariaLabel={`Completed: ${verifiedCount}. Click to view certificates.`}
          className="min-w-0"
        />
        <StatCard
          title="Out-of-Tolerance Verdicts"
          value={rejectedCount}
          description="Failed drift tests or calibration limits"
          icon={AlertCircle}
          variant="rose"
          to="/officer/inspections?status=FAILED"
          ariaLabel={`Rejections: ${rejectedCount}. Click to view failed calibrations.`}
          className="min-w-0"
        />
      </div>

      {/* ENVIRONMENTAL CHAMBER & LIVE SENSORS BANNER */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0B2F57] via-[#123B6D] to-[#0A3D62] text-white p-4 sm:p-5 lg:p-6 shadow-xs border border-blue-900/40 min-w-0">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 relative z-10 min-w-0">
          <div className="space-y-1.5 sm:space-y-2 max-w-xl min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] sm:text-[11px] font-bold tracking-wide backdrop-blur-sm border border-white/15">
              <Activity className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>LIVE GATC CHAMBER TELEMETRY</span>
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight break-words">
              Metrology Chamber Environmental Controls
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Standard calibration for Class I & II balances mandates constant 20.0°C ± 1.0°C and 50% ± 10% RH to minimize thermal drift and buoyancy effects.
            </p>

            {/* Live Sensor Telemetry Pills */}
            <div className="pt-2 flex items-center gap-2 flex-wrap min-w-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-xs font-mono font-semibold">
                <Thermometer className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                <span>20.2°C</span>
                <span className="text-[10px] text-emerald-300 font-sans">(±0.2°C)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-xs font-mono font-semibold">
                <Droplets className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>48.5% RH</span>
                <span className="text-[10px] text-emerald-300 font-sans">(Optimal)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-xs font-mono font-semibold">
                <Gauge className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>1013.25 hPa</span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30 shrink-0">
                CLASS I COMPLIANT
              </span>
            </div>
          </div>

          {/* Quick Lookup Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 min-w-0">
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-3.5 py-2.5 bg-[#FF9933] hover:bg-[#E68524] text-slate-950 font-bold text-xs sm:text-sm rounded-lg transition shadow-md flex items-center justify-center gap-2 active:scale-95 group min-h-[44px] shrink-0"
            >
              <Cpu className="w-4 h-4 text-slate-950 group-hover:rotate-6 transition-transform" />
              <span>Scan Lab Sample</span>
            </button>

            <form onSubmit={onQuickSubmit} className="flex items-center w-full sm:w-60 md:w-64 min-w-0">
              <div className="relative w-full min-w-0">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Lab Batch / NPL ID"
                  className="w-full pl-3 pr-8 py-2 text-xs bg-white/15 text-white placeholder-blue-200 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:bg-white/25 transition font-medium min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={!quickInput.trim() || isFetchingDetails}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white disabled:opacity-30 rounded-md hover:bg-white/10 min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Search Sample"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Demo Samples */}
        <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center gap-2 flex-wrap text-xs text-blue-200 min-w-0">
          <span className="text-[11px] font-semibold text-blue-300 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-[#FF9933]" />
            <span className="hidden xs:inline">NPL Reference Standards:</span>
          </span>
          {[
            { label: 'NPL-E1-01', code: 'NPL-E1-01' },
            { label: 'INST-PH8-001', code: 'INST-PH8-001' },
            { label: 'GATC-PROV-04', code: 'GATC-PROV-04' },
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

      {/* Charts Grid: Laboratory Throughput + Precision Class Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Lab Output Bar/Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#D9E2EC] p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2EC] gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-[#172B4D] flex items-center gap-1.5 truncate">
                <TrendingUp className="w-4 h-4 text-[#07549A] shrink-0" />
                <span>Weekly Laboratory Calibration Throughput</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[#5B6B7A] truncate">
                Bench testing completions against statutory target
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs shrink-0">
              <span className="flex items-center gap-1 text-[#172B4D] font-medium text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#07549A]" />
                <span>Calibrated</span>
              </span>
              <span className="flex items-center gap-1 text-[#5B6B7A] font-medium text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9E2EC]" />
                <span>Statutory Target</span>
              </span>
            </div>
          </div>

          <div className="h-48 sm:h-56 md:h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEFAULT_LAB_OUTPUT} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                <Bar dataKey="calibrated" fill="#07549A" radius={[4, 4, 0, 0]} name="Calibrated Samples" />
                <Bar dataKey="target" fill="#D9E2EC" radius={[4, 4, 0, 0]} name="Lab Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precision Classes Donut (1 col) */}
        <div className="bg-white rounded-xl border border-[#D9E2EC] p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0">
          <div className="pb-3 border-b border-[#D9E2EC] min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-[#172B4D] flex items-center gap-1.5 truncate">
              <PieIcon className="w-4 h-4 text-[#07549A] shrink-0" />
              <span>Accuracy Class Breakdown</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-[#5B6B7A] truncate">Laboratory sample distribution by OIML class</p>
          </div>

          <div className="h-44 w-full min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEFAULT_PRECISION_CLASSES}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {DEFAULT_PRECISION_CLASSES.map((_, index) => (
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
            {DEFAULT_PRECISION_CLASSES.map((cls, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] min-w-0">
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-[#172B4D] truncate">{cls.name}</span>
                </div>
                <span className="font-bold text-[#172B4D] shrink-0 ml-2">{cls.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Calibration Queue: Dual Responsive Card & Table Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Active Docket (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#D9E2EC] p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2EC] gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-[#172B4D] truncate">
                Active Laboratory Calibration Docket
              </h2>
              <p className="text-[11px] sm:text-xs text-[#5B6B7A] truncate">
                Bench testing, sensitivity verification & certificates queue
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
                <span>Full Lab Docket</span>
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
            {SAMPLE_LAB_DOCKET.map((row) => (
              <div
                key={row.id}
                className="p-3 bg-[#F8FAFC] border border-[#D9E2EC] rounded-lg space-y-2.5 hover:border-[#07549A]/30 transition shadow-2xs min-w-0"
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 bg-[#E8F1FA] text-[#07549A] rounded text-[10px] font-mono font-bold">
                      {row.id}
                    </span>
                    <h3 className="font-bold text-xs text-[#172B4D] mt-1 truncate">{row.applicant}</h3>
                  </div>
                  <StatusBadge status={row.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded border border-[#D9E2EC]/70">
                  <div>
                    <span className="text-[#5B6B7A] text-[10px] block">Instrument</span>
                    <span className="font-semibold text-[#172B4D] truncate block">{row.instrument}</span>
                    <span className="text-[10px] text-[#5B6B7A] truncate block">{row.category}</span>
                  </div>
                  <div>
                    <span className="text-[#5B6B7A] text-[10px] block">Reference Standard</span>
                    <span className="font-mono text-[11px] text-[#07549A] truncate block">{row.referenceMass}</span>
                    <span className="text-[10px] text-[#5B6B7A] block">{row.due}</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-end">
                  <Link
                    to={`/officer/inspections?batchId=${row.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#07549A] hover:bg-[#0B2F57] rounded-md transition shadow-2xs min-h-[38px]"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Calibrate & Test</span>
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
                  <th className="py-2.5 px-3">Docket #</th>
                  <th className="py-2.5 px-3">Applicant / Enterprise</th>
                  <th className="py-2.5 px-3">Instrument & Class</th>
                  <th className="py-2.5 px-3">Reference Mass</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2EC]">
                {SAMPLE_LAB_DOCKET.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="py-2.5 px-3 font-semibold text-[#123B6D] font-mono text-[11px] whitespace-nowrap">
                      {row.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#172B4D]">
                      <span className="truncate block max-w-[160px]">{row.applicant}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#5B6B7A]">
                      <div className="font-medium text-[#172B4D] truncate max-w-[180px]">{row.instrument}</div>
                      <div className="text-[10px] text-[#5B6B7A] truncate max-w-[180px]">{row.category}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[#172B4D] font-mono text-[11px] whitespace-nowrap">
                      {row.referenceMass}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Link
                        to={`/officer/inspections?batchId=${row.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-[#07549A] hover:bg-[#0B2F57] rounded transition shadow-2xs whitespace-nowrap"
                      >
                        <PlayCircle className="w-3 h-3" />
                        <span>Calibrate</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* NPL Reference Standards Card (1 col) */}
        <div className="bg-white rounded-xl border border-[#D9E2EC] p-3.5 sm:p-5 shadow-xs space-y-3 min-w-0">
          <div className="pb-3 border-b border-[#D9E2EC] min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-[#172B4D] flex items-center gap-2 truncate">
              <Award className="w-4 h-4 text-[#07549A] shrink-0" />
              <span>NPL Traceability Registry</span>
            </h2>
            <p className="text-[11px] text-[#5B6B7A] truncate">National Physical Laboratory Standards</p>
          </div>

          <div className="space-y-2.5 text-xs text-[#172B4D] min-w-0">
            <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#D9E2EC] space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap min-w-0">
                <span className="font-bold text-[#172B4D] truncate">Class E1 Primary Mass (1kg)</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
                  Valid
                </span>
              </div>
              <p className="text-[11px] text-[#5B6B7A] leading-relaxed">
                Certificate # NPL/CAL/2025/1108 • Uncertainty ±0.05 mg
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#D9E2EC] space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap min-w-0">
                <span className="font-bold text-[#172B4D] truncate">Class E2 Secondary Set (1mg - 500g)</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
                  Valid
                </span>
              </div>
              <p className="text-[11px] text-[#5B6B7A] leading-relaxed">
                Recalibration Due: 18 Nov 2026 • Traceability: Primary Prototype
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F8FC] border border-[#D9E2EC] space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap min-w-0">
                <span className="font-bold text-[#172B4D] truncate">Class F1 Prover Standard (20L)</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                  Due in 45d
                </span>
              </div>
              <p className="text-[11px] text-[#5B6B7A] leading-relaxed">
                Volumetric prover for fuel dispenser calibration.
              </p>
            </div>

            <div className="pt-1 min-w-0">
              <Link
                to="/officer/certificates"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#123B6D] bg-[#E8F1FA] hover:bg-[#d8e8f8] border border-[#07549A]/30 rounded-lg transition min-h-[40px]"
              >
                <Award className="w-3.5 h-3.5 text-[#07549A]" />
                <span>View Lab Calibration Certificates</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatcOfficerDashboard;
