import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/analyticsApi';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import {
  TrendingUp,
  Percent,
  Clock,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.getAnalytics();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Analytics could not be loaded');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="National Enforcement Analytics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load analytics'} onRetry={fetchAnalytics} />;
  }

  const metrics = data.metrics || {};
  const officerWorkloads = data.officerWorkloads || [];
  const complianceByCategory = data.complianceByCategory || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regulatory Compliance & Analytics Engine"
        description="National metrics calculated dynamically from statutory inspection reports"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Analytics' },
        ]}
      />

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Compliance Rate"
          value={
            metrics.complianceRate != null
              ? `${metrics.complianceRate}%`
              : data?.kpis?.totalInstruments && data.kpis.totalInstruments > 0
                ? `${((data.kpis.verifiedInstruments / data.kpis.totalInstruments) * 100).toFixed(1)}%`
                : '0%'
          }
          description="Percentage of instruments meeting MPE tolerances"
          icon={Percent}
          variant="emerald"
        />
        <StatCard
          title="Average Turnaround"
          value={
            metrics.averageTurnaroundDays != null
              ? `${metrics.averageTurnaroundDays} Days`
              : '0 Days'
          }
          description="From application submission to certificate issue"
          icon={Clock}
          variant="blue"
        />
        <StatCard
          title="Rejection Rate"
          value={
            metrics.rejectionRate != null
              ? `${metrics.rejectionRate}%`
              : data?.kpis?.completedInspections && data.kpis.completedInspections > 0
                ? `${((data.kpis.rejectedOrFailedInspections / data.kpis.completedInspections) * 100).toFixed(1)}%`
                : '0%'
          }
          description="Defective instruments seized or repair orders issued"
          icon={AlertOctagon}
          variant="rose"
        />
        <StatCard
          title="Beat Coverage Ratio"
          value={
            metrics.coverageRatio != null
              ? `${metrics.coverageRatio}%`
              : data?.kpis?.totalApplications && data.kpis.totalApplications > 0
                ? `${Math.min(100, Number((((data.kpis.approvedApplications + (data.kpis.verifiedInstruments || 0)) / data.kpis.totalApplications) * 100).toFixed(1)))}%`
                : '0%'
          }
          description="Active commercial premises inspected annually"
          icon={ShieldCheck}
          variant="indigo"
        />
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance by Category */}
        <div className="bg-white rounded-xl border border-[#D9E2EC] p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#D9E2EC]">
            <h2 className="text-sm font-bold text-[#172B4D]">Verification Pass Rates by Instrument Category</h2>
            <p className="text-xs text-[#5B6B7A]">Statutory pass percentage per commercial instrument class</p>
          </div>

          <div className="h-64 w-full">
            {complianceByCategory.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-xs text-[#5B6B7A] bg-[#F8FAFC] rounded-lg border border-dashed border-[#D9E2EC] p-4 text-center">
                <Percent className="w-8 h-8 text-[#5B6B7A]/40 mb-2" />
                <p className="font-semibold text-sm text-[#172B4D]">No Category Compliance Data</p>
                <p className="text-xs text-[#5B6B7A] mt-1 max-w-xs">Pass rates will be displayed here once statutory verification inspections are conducted.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complianceByCategory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#5B6B7A' }} stroke="#D9E2EC" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#5B6B7A' }} stroke="#D9E2EC" />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Pass Rate']}
                    contentStyle={{
                      backgroundColor: '#0B2F57',
                      borderColor: '#123B6D',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="passRate" fill="#07549A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Officer Workload Breakdown */}
        <div className="bg-white rounded-xl border border-[#D9E2EC] p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#D9E2EC]">
            <h2 className="text-sm font-bold text-[#172B4D]">Officer Workload & Field Performance</h2>
            <p className="text-xs text-[#5B6B7A]">Inspections completed per assigned enforcement officer</p>
          </div>

          <div className="h-64 w-full">
            {officerWorkloads.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-xs text-[#5B6B7A] bg-[#F8FAFC] rounded-lg border border-dashed border-[#D9E2EC] p-4 text-center">
                <ShieldCheck className="w-8 h-8 text-[#5B6B7A]/40 mb-2" />
                <p className="font-semibold text-sm text-[#172B4D]">No Officer Workload Data</p>
                <p className="text-xs text-[#5B6B7A] mt-1 max-w-xs">Field officer performance will appear here once inspections are assigned and logged.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={officerWorkloads}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#5B6B7A' }} stroke="#D9E2EC" />
                  <YAxis type="category" dataKey="officer" tick={{ fontSize: 11, fill: '#5B6B7A' }} stroke="#D9E2EC" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B2F57',
                      borderColor: '#123B6D',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#123B6D" radius={[0, 4, 4, 0]} name="Completed Inspections" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
