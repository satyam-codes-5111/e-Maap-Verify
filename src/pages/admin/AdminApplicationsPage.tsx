import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi } from '../../services/applicationApi';
import { userApi } from '../../services/userApi';
import { VerificationApplicationItem, UserProfile } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import {
  FileText,
  UserCheck,
  Calendar,
  Eye,
  MapPin,
} from 'lucide-react';

export const AdminApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<VerificationApplicationItem[]>([]);
  const [officers, setOfficers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Assign Officer Modal
  const [assignApp, setAssignApp] = useState<VerificationApplicationItem | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchOfficers = async () => {
    try {
      const res = await userApi.getUsers({ role: 'OFFICER' });
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.users || []);
        setOfficers(list);
      }
    } catch {}
  };

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
          setTotalPages(res.data.pagination.pages || 1);
          setTotalRecords(res.data.pagination.total || 0);
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
    fetchOfficers();
  }, [fetchApplications]);

  const handleAssignOfficer = async () => {
    if (!assignApp || !selectedOfficerId) return;
    setAssigning(true);
    try {
      const res = await applicationApi.assignOfficer(assignApp._id, selectedOfficerId);
      if (res.success) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Officer Assigned',
          message: 'Application allotted to inspecting officer for verification schedule.',
        });
        setAssignApp(null);
        setSelectedOfficerId('');
        fetchApplications();
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Assignment Error',
        message: getErrorMessage(err),
      });
    } finally {
      setAssigning(false);
    }
  };

  const columns: Column<VerificationApplicationItem>[] = [
    {
      header: 'Application No.',
      cell: (item) => (
        <div>
          <Link
            to={`/admin/applications/${item._id}`}
            className="font-bold text-[#123B6D] hover:underline flex items-center gap-1 font-mono"
          >
            <span>{item.applicationNumber}</span>
          </Link>
          <div className="text-[11px] text-[#5B6B7A]">{item.purpose || 'Verification'}</div>
        </div>
      ),
    },
    {
      header: 'Stakeholder / Business',
      cell: (item) => (
        <div>
          <div className="font-semibold text-[#172B4D] text-xs">
            {item.stakeholder?.businessName || 'Business Establishment'}
          </div>
          <div className="text-[11px] text-[#5B6B7A]">
            {item.verificationLocation?.district || item.stakeholder?.district}, {item.verificationLocation?.state || item.stakeholder?.state}
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Officer',
      cell: (item) => (
        <span className="text-xs font-medium">
          {item.assignedLMO?.name ? (
            <span className="text-[#123B6D] font-bold">{item.assignedLMO.name}</span>
          ) : (
            <span className="text-[#B45309] italic font-semibold">Unassigned Beat</span>
          )}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.currentStatus || item.status} size="sm" />,
    },
    {
      header: 'Date Submitted',
      cell: (item) => (
        <span className="text-xs text-[#5B6B7A] font-mono">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setAssignApp(item);
              setSelectedOfficerId(item.assignedLMO?._id || '');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#123B6D] bg-[#E8F1FA] hover:bg-[#d8e8f8] rounded-md border border-[#07549A]/30 transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#07549A]" />
            <span>Allot</span>
          </button>
          <Link
            to={`/admin/applications/${item._id}`}
            className="p-1.5 text-[#5B6B7A] hover:text-[#123B6D] hover:bg-[#F5F8FC] rounded-md border border-transparent hover:border-[#D9E2EC] transition"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
        </div>
      ),
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
      />

      <div className="bg-white p-4 rounded-xl border border-[#D9E2EC] shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
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
              onChange: (val) => {
                setStatusFilter(val);
                setPage(1);
              },
              options: [
                { label: 'All Statuses', value: 'ALL' },
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

      {/* Allot Officer Modal */}
      {assignApp && (
        <Modal
          isOpen={true}
          onClose={() => setAssignApp(null)}
          title="Allot Enforcement Officer"
          subtitle={`Assign Legal Metrology Officer to Application ${assignApp.applicationNumber}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setAssignApp(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#5B6B7A] hover:bg-[#F5F8FC] border border-[#D9E2EC] rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignOfficer}
                disabled={assigning || !selectedOfficerId}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0B2F57] rounded-md shadow-2xs flex items-center gap-1.5 disabled:opacity-50 transition"
              >
                {assigning && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Confirm Allotment</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#F5F8FC] rounded-lg border border-[#D9E2EC] space-y-1">
              <div className="font-bold text-[#172B4D]">
                Stakeholder: {assignApp.stakeholder?.businessName}
              </div>
              <div className="text-[#5B6B7A]">
                Premise: {assignApp.verificationLocation?.district || assignApp.stakeholder?.district}
              </div>
              <div className="text-[#5B6B7A]">
                Instrument: {assignApp.instrument?.instrumentName || assignApp.instrument?.category}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] mb-1">
                Select Jurisdictional Officer *
              </label>
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D9E2EC] rounded-md focus:ring-2 focus:ring-[#07549A]/20 focus:border-[#07549A] transition text-[#172B4D]"
              >
                <option value="">-- Choose Legal Metrology Officer --</option>
                {officers.map((off) => (
                  <option key={off._id} value={off._id}>
                    {off.name} ({off.email}) - {off.designation || 'LMO'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
