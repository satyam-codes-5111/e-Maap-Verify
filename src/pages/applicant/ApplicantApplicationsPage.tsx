import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { applicationApi } from '../../services/applicationApi';
import { VerificationApplicationItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FileCheck2,
  Calendar,
  Eye,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  MapPin,
  Scale,
  ArrowRight,
  ShieldCheck,
  Activity,
  AlertCircle,
} from 'lucide-react';

const PIPELINE_STEPS = [
  { key: 'SUBMITTED', label: 'Submitted', desc: 'Application enrolled in portal' },
  { key: 'SCRUTINY', label: 'Scrutiny', desc: 'Document & model scrutiny by officer' },
  { key: 'SCHEDULED', label: 'Scheduled', desc: 'Inspection slot allotted to officer' },
  { key: 'INSPECTED', label: 'Inspected', desc: 'Physical verification with standards' },
  { key: 'CERTIFICATE_ISSUED', label: 'Certified', desc: 'Tamper-evident QR certificate issued' },
];

export const ApplicantApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<VerificationApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Sync state if URL query params change
  useEffect(() => {
    const qStatus = searchParams.get('status') || 'ALL';
    setStatusFilter(qStatus);
  }, [searchParams]);

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (newStatus === 'ALL') {
      next.delete('status');
    } else {
      next.set('status', newStatus);
    }
    setSearchParams(next);
  };

  // Tracking modal state
  const [trackingApp, setTrackingApp] = useState<VerificationApplicationItem | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
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
        title: 'Registry Error',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const getPipelineIndex = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('CERTIFICATE') || s.includes('ISSUED') || s.includes('APPROVED')) return 4;
    if (s.includes('INSPECT')) return 3;
    if (s.includes('SCHEDULE')) return 2;
    if (s.includes('SCRUTINY') || s.includes('UNDER_REVIEW') || s.includes('REVIEW')) return 1;
    return 0; // SUBMITTED
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <PageHeader
        title="Verification Applications"
        description="Official tracking of statutory verification applications and field inspections"
        breadcrumbs={[
          { label: 'Dashboard', to: '/applicant/dashboard' },
          { label: 'Applications' },
        ]}
        actions={
          <Link
            to="/applicant/instruments"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>Apply Verification</span>
          </Link>
        }
      />

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by application number or serial number..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#123B6D]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full sm:w-52 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#123B6D]"
            aria-label="Filter by Status"
          >
            <option value="ALL">All Application Statuses</option>
            <option value="PENDING">Pending (Active Scrutiny / Review)</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review / Scrutiny</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="INSPECTION">Under Inspection</option>
            <option value="CERTIFICATE_GENERATED">Certificate Issued</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <LoadingSkeleton rows={5} />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          title={
            statusFilter === 'PENDING'
              ? 'No pending applications'
              : statusFilter !== 'ALL'
              ? `No applications with status: ${statusFilter}`
              : 'No applications submitted yet'
          }
          description={
            statusFilter === 'PENDING'
              ? 'All submitted verification applications have completed review or there are no active applications in progress.'
              : statusFilter !== 'ALL'
              ? 'Try selecting a different status filter to view other verification applications.'
              : 'Select one of your registered commercial instruments to submit an official verification application.'
          }
          actionText={statusFilter !== 'ALL' ? 'View All Applications' : 'View Registered Instruments'}
          onAction={() => {
            if (statusFilter !== 'ALL') {
              handleStatusChange('ALL');
            } else {
              navigate('/applicant/instruments');
            }
          }}
        />
      ) : (
        <>
          {/* Desktop Data Table */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Application No.</th>
                    <th className="px-4 py-3">Instrument Details</th>
                    <th className="px-4 py-3">Submission Date</th>
                    <th className="px-4 py-3">Current Status</th>
                    <th className="px-4 py-3">Assigned Officer</th>
                    <th className="px-4 py-3">Scheduled Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {applications.map((item) => {
                    const status = item.currentStatus || item.status || 'SUBMITTED';
                    const officerName = item.assignedOfficer?.name || (item as any).officerName;
                    const scheduledDate = (item as any).scheduledDate || (item as any).inspectionDate;

                    return (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <Link
                            to={`/applicant/applications/${item._id}`}
                            className="font-mono font-bold text-[#123B6D] hover:underline block text-xs"
                          >
                            {item.applicationNumber}
                          </Link>
                          <span className="text-[11px] text-slate-500">
                            {item.applicationType || item.purpose || 'Verification'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {item.instrument?.instrumentName || item.instrument?.category || 'Commercial Instrument'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            SN: {item.instrument?.serialNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status} size="sm" />
                        </td>
                        <td className="px-4 py-3">
                          {officerName ? (
                            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                              <UserCheck className="w-3.5 h-3.5 text-[#123B6D]" />
                              <span>{officerName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Pending Allotment</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {scheduledDate ? (
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Clock className="w-3.5 h-3.5 text-[#FF9933]" />
                              <span>{new Date(scheduledDate).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Awaiting Schedule</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTrackingApp(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span>Track</span>
                            </button>
                            <Link
                              to={`/applicant/applications/${item._id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Application Cards */}
          <div className="lg:hidden space-y-3">
            {applications.map((item) => {
              const status = item.currentStatus || item.status || 'SUBMITTED';
              const officerName = item.assignedOfficer?.name || (item as any).officerName;
              const scheduledDate = (item as any).scheduledDate || (item as any).inspectionDate;
              const activeIndex = getPipelineIndex(status);

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <Link
                        to={`/applicant/applications/${item._id}`}
                        className="font-mono font-bold text-[#123B6D] text-xs hover:underline"
                      >
                        {item.applicationNumber}
                      </Link>
                      <p className="text-[11px] text-slate-500">{item.purpose || 'Verification'}</p>
                    </div>
                    <StatusBadge status={status} size="sm" />
                  </div>

                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-slate-900">
                      {item.instrument?.instrumentName || item.instrument?.category || 'Instrument'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      SN: {item.instrument?.serialNumber || 'N/A'}
                    </p>
                  </div>

                  {/* Mobile mini progress bar */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Submitted</span>
                      <span>Inspection</span>
                      <span>Certified</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#123B6D] h-full transition-all"
                        style={{ width: `${((activeIndex + 1) / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Submitted: {new Date(item.createdAt).toLocaleDateString()}</span>
                    {officerName ? (
                      <span className="font-medium text-slate-800">Officer: {officerName}</span>
                    ) : (
                      <span>Officer pending</span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setTrackingApp(item)}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition"
                    >
                      Track Status
                    </button>
                    <Link
                      to={`/applicant/applications/${item._id}`}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50 font-semibold"
              >
                Previous
              </button>
              <span className="text-slate-600">
                Page <strong className="text-slate-900">{page}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50 font-semibold"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Track Status Pipeline Modal */}
      {trackingApp && (
        <Modal
          isOpen={Boolean(trackingApp)}
          onClose={() => setTrackingApp(null)}
          title={`Status Pipeline: ${trackingApp.applicationNumber}`}
          size="lg"
        >
          <div className="space-y-5 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#123B6D]">
                  {trackingApp.applicationNumber}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                  {trackingApp.instrument?.instrumentName || trackingApp.instrument?.category}
                </h3>
                <p className="text-slate-500 font-mono text-[11px]">
                  Serial Number: {trackingApp.instrument?.serialNumber || 'N/A'}
                </p>
              </div>
              <StatusBadge status={trackingApp.currentStatus || trackingApp.status} size="md" />
            </div>

            {/* Pipeline Step Sequence */}
            <div className="py-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Statutory Verification Life Cycle
              </h4>
              <div className="space-y-4">
                {PIPELINE_STEPS.map((step, idx) => {
                  const currentIdx = getPipelineIndex(trackingApp.currentStatus || trackingApp.status);
                  const isDone = currentIdx > idx;
                  const isCurrent = currentIdx === idx;

                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-[#123B6D] text-white ring-4 ring-blue-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        {idx < PIPELINE_STEPS.length - 1 && (
                          <div
                            className={`w-0.5 h-10 ${
                              isDone ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>

                      <div className="pt-0.5 min-w-0">
                        <p
                          className={`font-bold text-xs ${
                            isCurrent
                              ? 'text-[#123B6D]'
                              : isDone
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                          {isCurrent && (
                            <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                              Current Phase
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Application Officer & Jurisdiction Details */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1 text-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Verification Details
              </span>
              <p>
                <strong>Assigned Officer:</strong>{' '}
                {trackingApp.assignedOfficer?.name || (trackingApp as any).officerName || 'Under Allotment via Roster'}
              </p>
              <p>
                <strong>Submission Date:</strong> {new Date(trackingApp.createdAt).toLocaleDateString()}
              </p>
              <p>
                <strong>Statutory Jurisdiction:</strong> Legal Metrology Enforcement Branch
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTrackingApp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Close
              </button>
              <Link
                to={`/applicant/applications/${trackingApp._id}`}
                className="px-4 py-2 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition"
              >
                Open Full Application Record
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
