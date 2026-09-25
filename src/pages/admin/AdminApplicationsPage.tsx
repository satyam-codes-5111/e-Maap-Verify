import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applicationApi } from '../../services/applicationApi';
import { VerificationApplicationItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { ScheduleVerificationModal } from '../../components/schedule/ScheduleVerificationModal';
import {
  CalendarDays,
  Eye,
  CalendarCheck,
  FileCheck,
} from 'lucide-react';

export const AdminApplicationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<VerificationApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Sync state if URL searchParams change
  useEffect(() => {
    const qStatus = searchParams.get('status') || 'ALL';
    setStatusFilter(qStatus);
    setPage(1);
  }, [searchParams]);

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (val === 'ALL') {
      next.delete('status');
    } else {
      next.set('status', val);
    }
    setSearchParams(next);
  };

  // Schedule Verification Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedAppForSchedule, setSelectedAppForSchedule] = useState<VerificationApplicationItem | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await applicationApi.getApplications(params);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.applications || []);
        setApplications(list);
        if (res.data.pagination) {
          const pg = res.data.pagination;
          setTotalPages(Math.max(1, Number(pg.totalPages || pg.pages) || 1));
          setTotalRecords(Number(pg.total) || 0);
        }
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Load Error',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleOpenScheduleModal = (app?: VerificationApplicationItem) => {
    setSelectedAppForSchedule(app || null);
    setScheduleModalOpen(true);
  };

  const handleScheduleSuccess = () => {
    setToast({
      id: String(Date.now()),
      type: 'success',
      title: 'Schedule Allotted',
      message: 'Statutory verification schedule has been allotted and recorded.',
    });
    fetchApplications();
  };

  const columns: Column<VerificationApplicationItem>[] = [
    {
      header: 'Application No.',
      cell: (item) => (
        <div>
          <span className="font-bold text-xs text-slate-900 font-mono">
            {item.applicationNumber}
          </span>
          <span className="block text-[11px] text-slate-500">
            {item.verificationType || 'INITIAL'} • {item.purpose || 'Verification'}
          </span>
        </div>
      ),
    },
    {
      header: 'Stakeholder / Establishment',
      cell: (item) => (
        <div>
          <span className="font-semibold text-xs text-slate-800">
            {item.stakeholder?.businessName || item.stakeholder?.legalName || 'N/A'}
          </span>
          <span className="block text-[11px] text-slate-500">
            {item.stakeholder?.tradeLicenseNumber ? `Lic: ${item.stakeholder.tradeLicenseNumber}` : 'Reg. Business'}
          </span>
        </div>
      ),
    },
    {
      header: 'Instrument Category',
      cell: (item) => (
        <div>
          <span className="font-medium text-xs text-slate-800">
            {item.instrument?.instrumentName || item.instrument?.category || 'Instrument'}
          </span>
          <span className="block text-[11px] text-slate-500 font-mono">
            S/N: {item.instrument?.serialNumber || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      header: 'Jurisdiction Premise',
      cell: (item) => {
        const loc = item.verificationLocation;
        const dist = typeof loc === 'object' ? loc?.district : '';
        const addr = typeof loc === 'object' ? loc?.address : (typeof loc === 'string' ? loc : '');
        return (
          <span className="text-xs text-slate-600">
            {dist ? `${dist}` : (addr || 'Registered Premise')}
          </span>
        );
      },
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.currentStatus || item.status} size="sm" />,
    },
    {
      header: 'Date Submitted',
      cell: (item) => (
        <span className="text-xs text-slate-500 font-mono">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => {
        const status = item.currentStatus || item.status;
        const isApproved = status === 'APPROVED';
        const isPendingScrutiny = status === 'SUBMITTED' || status === 'UNDER_REVIEW';

        return (
          <div className="flex items-center justify-end gap-2">
            {isApproved ? (
              <button
                type="button"
                onClick={() => handleOpenScheduleModal(item)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-300 transition shadow-2xs"
                title="Allot Verification Schedule"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-teal-800" />
                <span>Allot Beat</span>
              </button>
            ) : isPendingScrutiny ? (
              <Link
                to={`/admin/applications/${item._id}`}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition"
                title="Requires Scrutiny & Approval"
              >
                <FileCheck className="w-3 h-3 text-amber-700" />
                <span>Review</span>
              </Link>
            ) : null}

            <Link
              to={`/admin/applications/${item._id}`}
              className="p-1.5 text-slate-500 hover:text-teal-900 hover:bg-slate-100 rounded-md border border-transparent hover:border-slate-200 transition"
              title="View Statutory Dossier"
            >
              <Eye className="w-3.5 h-3.5" />
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="National Application Queue"
        description="Statutory intake, officer beat allotment, and verification pipeline monitoring"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Applications' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => handleOpenScheduleModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Schedule Verification</span>
          </button>
        }
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search application number..."
          />

          <FilterPanel
            filters={[
              {
                key: 'status',
                label: 'Status',
                value: statusFilter,
                onChange: (val) => handleStatusFilterChange(val),
                options: [
                  { label: 'All Statuses', value: 'ALL' },
                  { label: 'Pending Scrutiny Queue', value: 'PENDING' },
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
              handleStatusFilterChange('ALL');
              setSearch('');
            }}
          />
        </div>

        {statusFilter !== 'ALL' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-500">Active Filter:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              <span>Status: {statusFilter === 'PENDING' ? 'Pending Scrutiny Queue' : statusFilter}</span>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('ALL')}
                className="hover:text-teal-950 font-bold ml-0.5 text-sm leading-none cursor-pointer"
                aria-label="Clear status filter"
              >
                ×
              </button>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Showing {totalRecords} record(s)</span>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={applications}
        loading={loading}
        keyExtractor={(item) => item._id}
        emptyTitle="No Applications Found"
        emptyDescription="No applications matching this criteria in the regulatory database."
        pagination={{
          currentPage: page,
          totalPages,
          totalRecords,
          pageSize: 10,
          onPageChange: (p) => setPage(p),
        }}
      />

      {/* Shared Statutory Schedule Verification Modal */}
      <ScheduleVerificationModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setSelectedAppForSchedule(null);
        }}
        onSuccess={handleScheduleSuccess}
        application={selectedAppForSchedule}
        lockApplication={!!selectedAppForSchedule}
      />
    </div>
  );
};
