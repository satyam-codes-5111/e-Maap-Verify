import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applicationApi } from '../../services/applicationApi';
import { VerificationApplicationItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Toast, ToastMessage } from '../../components/common/Toast';
import {
  FileCheck2,
  Calendar,
  ChevronRight,
  Eye,
  PlusCircle,
} from 'lucide-react';

export const ApplicantApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<VerificationApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await applicationApi.getApplications(params);
      if (res.success && res.data) {
        setApplications(res.data.applications || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Error Loading Applications',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const columns: Column<VerificationApplicationItem>[] = [
    {
      header: 'Application No.',
      cell: (item) => (
        <div>
          <Link
            to={`/applicant/applications/${item._id}`}
            className="font-bold text-teal-800 hover:underline flex items-center gap-1"
          >
            <span>{item.applicationNumber}</span>
          </Link>
          <div className="text-[11px] text-slate-500">
            {item.applicationType || item.purpose || 'Verification'}
          </div>
        </div>
      ),
    },
    {
      header: 'Instrument',
      cell: (item) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs">
            {item.instrument?.instrumentName || item.instrument?.category || 'Instrument'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            SN: {item.instrument?.serialNumber || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.currentStatus || item.status} size="sm" />,
    },
    {
      header: 'Submitted Date',
      cell: (item) => (
        <div className="text-xs text-slate-600 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Fee Status',
      cell: (item) => (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            item.feeDetails?.feeStatus === 'PAID'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {item.feeDetails?.feeStatus || 'PENDING'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end">
          <Link
            to={`/applicant/applications/${item._id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </Link>
        </div>
      ),
    },
  ];

  const mobileCardRender = (item: VerificationApplicationItem) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            to={`/applicant/applications/${item._id}`}
            className="font-bold text-xs text-teal-800 hover:underline"
          >
            {item.applicationNumber}
          </Link>
          <p className="text-[11px] text-slate-500">{item.purpose || 'Verification'}</p>
        </div>
        <StatusBadge status={item.currentStatus || item.status} size="sm" />
      </div>

      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
        <div>
          <span className="text-slate-400">Instrument: </span>
          <span className="font-semibold text-slate-800">
            {item.instrument?.instrumentName || item.instrument?.category}
          </span>
        </div>
        <div>
          <span className="text-slate-400">SN: </span>
          <span className="font-mono text-slate-700">{item.instrument?.serialNumber || 'N/A'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        <Link
          to={`/applicant/applications/${item._id}`}
          className="text-xs font-bold text-teal-800 hover:text-teal-900 inline-flex items-center gap-1"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Verification Applications"
        description="Track statutory verification applications and officer review statuses"
        breadcrumbs={[
          { label: 'Dashboard', href: '/applicant/dashboard' },
          { label: 'Applications' },
        ]}
        actions={
          <Link
            to="/applicant/instruments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Application</span>
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by application number..."
        />

        <FilterPanel
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: (val) => {
                setStatusFilter(val);
                setPage(1);
              },
              options: [
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Submitted', value: 'SUBMITTED' },
                { label: 'Under Review', value: 'UNDER_REVIEW' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Scheduled', value: 'SCHEDULED' },
                { label: 'Verified', value: 'VERIFIED' },
                { label: 'Rejected', value: 'REJECTED' },
              ],
            },
          ]}
          onReset={() => {
            setStatusFilter('ALL');
            setSearch('');
            setPage(1);
          }}
        />
      </div>

      {/* Applications Data Table */}
      <DataTable
        columns={columns}
        data={applications}
        loading={loading}
        keyExtractor={(item) => item._id}
        emptyTitle="No Applications Found"
        emptyDescription="You have not submitted any verification applications matching this criteria."
        emptyActionLabel="View Instruments to Apply"
        onEmptyAction={() => navigate('/applicant/instruments')}
        mobileCardRender={mobileCardRender}
        pagination={{
          currentPage: page,
          totalPages,
          totalRecords,
          pageSize: 10,
          onPageChange: (p) => setPage(p),
        }}
      />
    </div>
  );
};
