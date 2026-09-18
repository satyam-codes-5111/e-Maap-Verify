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
  Users,
  Cpu,
  FileText,
  Clock,
  CheckCircle2,
  IndianRupee,
  ArrowRight,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
  Building2,
  FileCheck2,
  Award,
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
  BarChart,
  Bar,
} from 'recharts';

const CHART_COLORS = ['#123B6D', '#07549A', '#15803D', '#B45309', '#475569', '#2563EB'];

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getAdminDashboard();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load admin dashboard');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="National Executive Command Dashboard" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} rows={2} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load summary'} onRetry={fetchSummary} />;
  }

  const counts = data.counts || {};
  const kpis = data.kpis || {};
  const totalStakeholders = counts.totalStakeholders ?? kpis.totalStakeholders ?? 0;
  const totalInstruments = counts.totalInstruments ?? kpis.totalInstruments ?? 0;
  const totalApplications = counts.totalApplications ?? kpis.totalApplications ?? 0;
  const pendingApplications = counts.pendingApplications ?? kpis.pendingApplications ?? 0;
  const completedInspections = counts.completedApplications ?? counts.completedInspections ?? kpis.completedInspections ?? 0;
  const revenueCollected = counts.totalCollectedFees ?? kpis.revenueCollected ?? 0;

  const monthlyTrends = data.monthlyTrends || data.applicationsByStatus || [];
  const categoryStats = data.instrumentsByCategory || data.categoryDistribution || [];
  const recentApplications = data.recentApplications || [];

  return (
    <div className="space-y-6">
      {/* Official Government Notice Bar */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#0B2F57] to-[#07549A] text-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#123B6D]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base tracking-tight">National Legal Metrology Central Command</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-semibold px-2 py-0.5 rounded">
                LIVE SECURE REGISTRY
              </span>
            </div>
            <p className="text-xs text-blue-100/90 mt-0.5 max-w-2xl">
              Department of Consumer Affairs, Government of India • Real-time statutory enforcement under the Legal Metrology Act, 2009
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Link
            to="/admin/applications"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg border border-white/20 transition whitespace-nowrap"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Applications Queue</span>
          </Link>
          <Link
            to="/admin/instruments"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#123B6D] bg-white hover:bg-slate-100 rounded-lg shadow-sm transition whitespace-nowrap"
          >
            <Cpu className="w-3.5 h-3.5 text-[#123B6D]" />
            <span>Instruments Registry</span>
          </Link>
        </div>
      </div>

      <PageHeader
        title="Legal Metrology Executive Command"
        description="National regulatory oversight, inspection workloads, compliance rates, and statutory revenue"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/admin/reports"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172B4D] bg-white border border-[#D9E2EC] hover:bg-[#F5F8FC] rounded-md transition shadow-2xs"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#5B6B7A]" />
              <span>Statutory Reports</span>
            </Link>
            <Link
              to="/admin/analytics"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0B2F57] rounded-md transition shadow-2xs"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Compliance Analytics</span>
            </Link>
          </div>
        }
      />

      {/* 6 Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Stakeholders"
          value={totalStakeholders}
          description="Registered commercial traders"
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Instruments"
          value={totalInstruments}
          description="Commercial devices in registry"
          icon={Cpu}
          variant="slate"
        />
        <StatCard
          title="Applications"
          value={totalApplications}
          description="Verification requests submitted"
          icon={FileText}
          variant="indigo"
        />
        <StatCard
          title="Pending Queue"
          value={pendingApplications}
          description="Awaiting officer allotment"
          icon={Clock}
          variant="amber"
          badge={pendingApplications > 0 ? { text: 'Active Review', type: 'warning' } : undefined}
        />
        <StatCard
          title="Verifications"
          value={completedInspections}
          description="Field verifications completed"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Statutory Fees"
          value={`₹${revenueCollected.toLocaleString()}`}
          description="Total treasury fees deposited"
          icon={IndianRupee}
          variant="teal"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Application Volume Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#D9E2EC] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9E2EC]">
            <div>
              <h2 className="text-sm font-bold text-[#172B4D]">Application Intake Trends</h2>
              <p className="text-xs text-[#5B6B7A]">Monthly submissions & completed statutory verifications</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-[#172B4D] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#07549A]" />
                <span>Statutory Intake</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {monthlyTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#5B6B7A]">
                Historical monthly data will populate as applications are submitted.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="govAppColor" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="count"
                    stroke="#07549A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#govAppColor)"
                    name="Applications"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Distribution Donut Chart (1 col) */}
        <div className="bg-white rounded-xl border border-[#D9E2EC] p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#D9E2EC]">
            <h2 className="text-sm font-bold text-[#172B4D]">Instrument Category Distribution</h2>
            <p className="text-xs text-[#5B6B7A]">Commercial weights & measures device classes</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {categoryStats.length === 0 ? (
              <div className="text-xs text-[#5B6B7A]">No instruments categorized yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="count"
                    nameKey={categoryStats[0]?.category ? 'category' : '_id'}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {categoryStats.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
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
            )}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs pt-1">
            {categoryStats.slice(0, 4).map((cat: any, i: number) => {
              const label = String(cat.category || cat._id || 'Other').replace(/_/g, ' ');
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-[#172B4D] truncate text-xs">{label}</span>
                  </div>
                  <span className="font-bold text-[#172B4D] text-xs">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white rounded-xl border border-[#D9E2EC] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#D9E2EC]">
          <div>
            <h2 className="text-sm font-bold text-[#172B4D]">Recent Applications Nationwide</h2>
            <p className="text-xs text-[#5B6B7A]">Live statutory queue across all state jurisdictions</p>
          </div>
          <Link
            to="/admin/applications"
            className="text-xs font-bold text-[#123B6D] hover:text-[#07549A] flex items-center gap-1 transition"
          >
            <span>View All Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F5F8FC] text-[#172B4D] text-[11px] uppercase tracking-wider font-bold border-b border-[#D9E2EC]">
              <tr>
                <th className="py-2.5 px-3">Application No.</th>
                <th className="py-2.5 px-3">Stakeholder</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Jurisdiction</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E2EC]">
              {recentApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#5B6B7A]">
                    No recent applications recorded in the database.
                  </td>
                </tr>
              ) : (
                recentApplications.map((app: any) => (
                  <tr key={app._id} className="hover:bg-[#F8FAFC] transition">
                    <td className="py-2.5 px-3 font-bold text-[#123B6D] font-mono">{app.applicationNumber}</td>
                    <td className="py-2.5 px-3 text-[#172B4D] font-medium">
                      {app.stakeholder?.businessName || 'Business Establishment'}
                    </td>
                    <td className="py-2.5 px-3 text-[#5B6B7A]">
                      {app.instrument?.instrumentName || app.instrument?.category}
                    </td>
                    <td className="py-2.5 px-3 text-[#5B6B7A]">
                      {app.verificationLocation?.district || app.stakeholder?.district || 'District Beat'}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={app.currentStatus || app.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/admin/applications/${app._id}`}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#123B6D] bg-[#E8F1FA] hover:bg-[#d8e8f8] border border-[#07549A]/30 rounded transition"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
