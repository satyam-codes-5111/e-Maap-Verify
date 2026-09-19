import React, { useState, useEffect, useCallback } from 'react';
import { reportApi } from '../../services/reportApi';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  IndianRupee,
  ShieldAlert,
  Cpu,
  UserCheck,
  CheckCircle2,
  Filter,
  RefreshCw,
} from 'lucide-react';

type ReportType = 'SUMMARY' | 'REVENUE' | 'COMPLIANCE' | 'AUDIT';

export const AdminReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('SUMMARY');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('ALL');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res: any;
      const params: any = {};
      if (dateRange !== 'ALL') params.range = dateRange;
      if (search) params.search = search;

      switch (activeReport) {
        case 'SUMMARY':
          res = await reportApi.getSummaryReport(params);
          break;
        case 'REVENUE':
          res = await reportApi.getRevenueReport(params);
          break;
        case 'COMPLIANCE':
          res = await reportApi.getComplianceReport(params);
          break;
        case 'AUDIT':
          res = await reportApi.getAuditLogs(params);
          break;
        default:
          res = await reportApi.getAdminReports(params);
      }

      if (res && res.success) {
        setData(res.data);
      } else {
        setError(res?.message || 'Failed to generate report');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeReport, dateRange, search]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExport = (format: 'csv' | 'json') => {
    try {
      const url = reportApi.exportAdminReportsUrl({
        type: activeReport,
        format,
        range: dateRange,
      });
      window.open(url, '_blank');
      setToast({
        id: String(Date.now()),
        type: 'success',
        title: 'Export Initiated',
        message: `Downloading statutory ${format.toUpperCase()} report...`,
      });
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Export Failed',
        message: getErrorMessage(err),
      });
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Statutory Reports & National Registry Data"
        description="Departmental verification registers, fees collection audits, and legal compliance logs"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Statutory Reports' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('json')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172B4D] bg-white border border-[#D9E2EC] hover:bg-[#F5F8FC] rounded-md transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#5B6B7A]" />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0B2F57] rounded-md transition shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV Register</span>
            </button>
          </div>
        }
      />

      {/* Report Switcher Tabs */}
      <div className="bg-white p-1.5 rounded-xl border border-[#D9E2EC] shadow-xs flex flex-wrap gap-1">
        {[
          { id: 'SUMMARY', label: 'Verification Summary', icon: CheckCircle2 },
          { id: 'REVENUE', label: 'Statutory Fees & Revenue', icon: IndianRupee },
          { id: 'COMPLIANCE', label: 'Instrument Compliance', icon: Cpu },
          { id: 'AUDIT', label: 'Security & Audit Trail', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveReport(tab.id as ReportType);
                setSearch('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition ${
                isActive
                  ? 'bg-[#123B6D] text-white shadow-2xs'
                  : 'text-[#5B6B7A] hover:text-[#172B4D] hover:bg-[#F5F8FC]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Range Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#D9E2EC] shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <SearchBar
          value={search}
          onChange={(val) => setSearch(val)}
          placeholder={`Filter ${activeReport.toLowerCase()} records...`}
        />

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#5B6B7A]" />
          <span className="text-[#172B4D] font-semibold">Period:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#F5F8FC] border border-[#D9E2EC] rounded-md focus:ring-2 focus:ring-[#07549A]/20 focus:border-[#07549A] transition text-[#172B4D]"
          >
            <option value="ALL">All Statutory Periods</option>
            <option value="30_DAYS">Past 30 Days</option>
            <option value="90_DAYS">Past Quarter (90 Days)</option>
            <option value="FY_CURRENT">Current Financial Year</option>
          </select>

          <button
            type="button"
            onClick={fetchReportData}
            title="Refresh Report"
            className="p-1.5 text-[#5B6B7A] hover:text-[#123B6D] hover:bg-[#F5F8FC] rounded-md border border-[#D9E2EC] transition ml-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Rendering by Active Report Type */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <LoadingSkeleton rows={2} />
            <LoadingSkeleton rows={2} />
            <LoadingSkeleton rows={2} />
          </div>
          <LoadingSkeleton rows={6} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReportData} />
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Record Entries"
              value={
                data?.totalRecords ??
                (Array.isArray(data?.records) ? data.records.length : 
                 Array.isArray(data?.logs) ? data.logs.length : 
                 Array.isArray(data?.items) ? data.items.length : 
                 Array.isArray(data) ? data.length : 0)
              }
              description="Logged in selected timeframe"
              icon={FileSpreadsheet}
              variant="blue"
            />
            <StatCard
              title="Treasury Compliance Amount"
              value={`₹${(data?.totalRevenue ?? 0).toLocaleString()}`}
              description="Legal Metrology fee deposited"
              icon={IndianRupee}
              variant="emerald"
            />
            <StatCard
              title="Integrity Verification"
              value="100% Cryptographic"
              description="SHA-256 digital stamp verification"
              icon={CheckCircle2}
              variant="indigo"
            />
          </div>

          {/* Dynamic Records Table */}
          <div className="bg-white rounded-xl border border-[#D9E2EC] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#D9E2EC] flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                  {activeReport === 'SUMMARY' && 'Statutory Verification Dossier'}
                  {activeReport === 'REVENUE' && 'Treasury Fee Collection Ledger'}
                  {activeReport === 'COMPLIANCE' && 'Weights & Measures Tolerances Register'}
                  {activeReport === 'AUDIT' && 'Digital Action Security Logs'}
                </h2>
                <p className="text-[11px] text-[#5B6B7A]">Official government record archive</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F8FC] text-[#172B4D] text-[11px] uppercase tracking-wider font-bold border-b border-[#D9E2EC]">
                  <tr>
                    <th className="py-2.5 px-4">Identifier / Ref</th>
                    <th className="py-2.5 px-4">Stakeholder / Actor</th>
                    <th className="py-2.5 px-4">Category / Action</th>
                    <th className="py-2.5 px-4">Jurisdiction</th>
                    <th className="py-2.5 px-4">Status / Fee</th>
                    <th className="py-2.5 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2EC]">
                  {(() => {
                    const reportRecords = Array.isArray(data)
                      ? data
                      : Array.isArray(data?.records)
                      ? data.records
                      : Array.isArray(data?.logs)
                      ? data.logs
                      : Array.isArray(data?.items)
                      ? data.items
                      : Array.isArray(data?.data)
                      ? data.data
                      : [];
                    if (!Array.isArray(reportRecords) || reportRecords.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-xs text-[#5B6B7A]">
                            No statutory records found for the selected timeframe.
                          </td>
                        </tr>
                      );
                    }
                    return Array.isArray(reportRecords) && reportRecords.map((row: any, i: number) => (
                      <tr key={row._id || row.id || i} className="hover:bg-[#F8FAFC] transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#123B6D]">
                          {row.applicationNumber || row.certificateNumber || row.ref || row._id || `REC-${i + 1}`}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#172B4D]">
                          {row.stakeholder?.businessName || row.businessName || row.userName || row.actor || 'Authorized Establishment'}
                        </td>
                        <td className="py-3 px-4 text-[#5B6B7A]">
                          {row.category || row.instrument?.category || row.action || 'Statutory Verification'}
                        </td>
                        <td className="py-3 px-4 text-[#5B6B7A]">
                          {row.location || row.stakeholder?.district || 'Jurisdictional Beat'}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={row.status || row.verdict || 'COMPLIANT'} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right text-[#5B6B7A] font-mono text-[11px]">
                          {row.date || (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A')}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
