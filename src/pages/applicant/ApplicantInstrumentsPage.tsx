import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { instrumentApi } from '../../services/instrumentApi';
import { applicationApi } from '../../services/applicationApi';
import { InstrumentItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { formatInstrumentCapacity } from '../../utils/formatters';
import {
  Scale,
  PlusCircle,
  FileCheck2,
  Calendar,
  Eye,
  Search,
  Filter,
  MapPin,
  Building2,
  ArrowUpDown,
  CheckCircle2,
  ShieldCheck,
  Clock,
  AlertCircle,
  Info,
  Layers,
} from 'lucide-react';

export const ApplicantInstrumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [instruments, setInstruments] = useState<InstrumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'SERIAL' | 'DUE_DATE'>('NEWEST');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Sync state if URL query parameter changes
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

  // View detail modal
  const [viewingInstrument, setViewingInstrument] = useState<InstrumentItem | null>(null);

  // Apply verification modal state
  const [selectedInstForApply, setSelectedInstForApply] = useState<InstrumentItem | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyPurpose, setApplyPurpose] = useState('ANNUAL_VERIFICATION');

  const fetchInstruments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (search) params.search = search;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await instrumentApi.getInstruments(params);
      if (res.success && res.data) {
        setInstruments(res.data.instruments || []);
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
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchInstruments();
  }, [fetchInstruments]);

  // Client-side sorting for display
  const sortedInstruments = useMemo(() => {
    const list = [...instruments];
    if (sortBy === 'SERIAL') {
      return list.sort((a, b) => (a.serialNumber || '').localeCompare(b.serialNumber || ''));
    }
    if (sortBy === 'DUE_DATE') {
      return list.sort((a, b) => {
        const dateA = a.verificationValidityDate ? new Date(a.verificationValidityDate).getTime() : Infinity;
        const dateB = b.verificationValidityDate ? new Date(b.verificationValidityDate).getTime() : Infinity;
        return dateA - dateB;
      });
    }
    // Default NEWEST
    return list;
  }, [instruments, sortBy]);

  const handleApplyVerification = async () => {
    if (!selectedInstForApply) return;
    setApplying(true);
    try {
      const res = await applicationApi.createApplication({
        instrumentId: selectedInstForApply._id,
        purpose: applyPurpose,
        priority: 'NORMAL',
      });
      if (res.success && res.data) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Application Created',
          message: `Statutory verification application submitted for ${selectedInstForApply.instrumentName || selectedInstForApply.serialNumber}.`,
        });
        setSelectedInstForApply(null);
        navigate(`/applicant/applications/${res.data._id}`);
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Application Submission Failed',
        message: getErrorMessage(err),
      });
    } finally {
      setApplying(false);
    }
  };

  const formatAddress = (addr: any) => {
    if (!addr) return 'Registered Premise';
    const parts = [addr.premiseName, addr.addressLine || addr.street, addr.city, addr.district, addr.state, addr.pincode].filter(Boolean);
    return parts.join(', ') || 'Registered Premise';
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <PageHeader
        title="My Instruments"
        description="Statutory registry of commercial weighing, measuring, and volumetric instruments"
        breadcrumbs={[
          { label: 'Dashboard', to: '/applicant/dashboard' },
          { label: 'My Instruments' },
        ]}
        actions={
          <Link
            to="/applicant/register-instrument"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>Register Instrument</span>
          </Link>
        }
      />

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by serial number, manufacturer or model..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#123B6D] focus:ring-1 focus:ring-[#123B6D]"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#123B6D]"
              aria-label="Filter by Category"
            >
              <option value="ALL">All Categories</option>
              <option value="NON_AUTOMATIC_WEIGHING_INSTRUMENT">Non-Automatic Scale</option>
              <option value="AUTOMATIC_WEIGHING_INSTRUMENT">Automatic Weighing</option>
              <option value="FUEL_DISPENSER">Fuel Dispenser</option>
              <option value="FLOW_METER">Flow Meter</option>
              <option value="WEIGHBRIDGE">Weighbridge</option>
              <option value="COUNTER_SCALE">Counter Scale</option>
              <option value="PRECISION_BALANCE">Precision Balance</option>
              <option value="STORAGE_TANK_CALIBRATION">Storage Tank</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#123B6D]"
              aria-label="Filter by Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="ACTIVE_VERIFIED">Active Verified</option>
              <option value="EXPIRING_SOON">Expiring Soon / Due</option>
              <option value="EXPIRED">Expired</option>
              <option value="REJECTED">Rejected</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#123B6D]"
              aria-label="Sort instruments"
            >
              <option value="NEWEST">Newest First</option>
              <option value="SERIAL">Serial Number</option>
              <option value="DUE_DATE">Next Due Date</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{sortedInstruments.length}</strong> of{' '}
            <strong className="text-slate-800">{totalRecords}</strong> instruments
          </span>
          {(search || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('ALL');
                handleStatusChange('ALL');
              }}
              className="text-[#123B6D] hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <LoadingSkeleton rows={5} />
        </div>
      ) : sortedInstruments.length === 0 ? (
        <EmptyState
          title={
            statusFilter === 'EXPIRING_SOON'
              ? 'No instruments expiring soon'
              : statusFilter === 'EXPIRED'
              ? 'No expired instruments'
              : statusFilter === 'ACTIVE_VERIFIED'
              ? 'No active verified instruments'
              : statusFilter !== 'ALL'
              ? `No instruments found with status: ${statusFilter}`
              : 'No instruments registered yet'
          }
          description={
            statusFilter === 'EXPIRING_SOON'
              ? 'All of your registered commercial instruments are currently within their statutory validity period.'
              : statusFilter === 'EXPIRED'
              ? 'None of your registered instruments currently have an expired statutory verification.'
              : statusFilter !== 'ALL'
              ? 'Try selecting a different filter or reset search to view your commercial instruments.'
              : 'Register your commercial weighing, measuring or volumetric devices to request official verification and receive statutory certificates.'
          }
          actionText={statusFilter !== 'ALL' ? 'View All Instruments' : 'Register Instrument'}
          onAction={() => {
            if (statusFilter !== 'ALL') {
              handleStatusChange('ALL');
            } else {
              navigate('/applicant/register-instrument');
            }
          }}
        />
      ) : (
        <>
          {/* 1. Desktop Data Table (hidden on mobile) */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Instrument ID & Type</th>
                    <th className="px-4 py-3">Manufacturer / Model</th>
                    <th className="px-4 py-3">Serial Number</th>
                    <th className="px-4 py-3">Installation Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Next Verification Due</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sortedInstruments.map((item) => {
                    const instId = item.instrumentId || `INS-${item._id.slice(-6).toUpperCase()}`;
                    const instType = item.instrumentType || item.instrumentName || item.category?.replace(/_/g, ' ');
                    const status = item.verificationStatus || item.status || 'PENDING_VERIFICATION';
                    const dueDate = item.verificationValidityDate || (item as any).nextVerificationDueDate;
                    const lastDate = (item as any).lastVerificationDate;

                    return (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-[#123B6D] text-[11px] block">
                            {instId}
                          </span>
                          <span className="text-slate-900 font-semibold">{instType}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{item.manufacturer}</div>
                          <div className="text-[11px] text-slate-500">Model: {item.modelNumber}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                            {item.serialNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <div className="truncate text-slate-700 font-medium" title={formatAddress(item.installationAddress)}>
                            {item.installationAddress?.premiseName || item.installationAddress?.city || 'Registered Premise'}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {item.installationAddress?.district || item.installationAddress?.state || ''}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status} size="sm" />
                        </td>
                        <td className="px-4 py-3">
                          {dueDate ? (
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-[#FF9933]" />
                              <span>{new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Verification Required</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingInstrument(item)}
                              className="p-1.5 text-slate-600 hover:text-[#123B6D] hover:bg-slate-100 rounded-lg transition"
                              title="View full statutory details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedInstForApply(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#123B6D] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>Apply</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Mobile Instrument Cards (stacked vertically, visible on mobile & tablet) */}
          <div className="lg:hidden space-y-3">
            {sortedInstruments.map((item) => {
              const instId = item.instrumentId || `INS-${item._id.slice(-6).toUpperCase()}`;
              const instType = item.instrumentType || item.instrumentName || item.category?.replace(/_/g, ' ');
              const status = item.verificationStatus || item.status || 'PENDING_VERIFICATION';
              const dueDate = item.verificationValidityDate || (item as any).nextVerificationDueDate;

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#123B6D] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                        {instId}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{instType}</h3>
                      <p className="text-xs text-slate-500">{item.manufacturer} • Model: {item.modelNumber}</p>
                    </div>
                    <StatusBadge status={status} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Serial Number</span>
                      <span className="font-mono text-slate-800 font-semibold">{item.serialNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Capacity</span>
                      <span className="font-semibold text-slate-800">
                        {formatInstrumentCapacity(item.capacity, item.unit, item.maxCapacity)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex items-start gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{formatAddress(item.installationAddress)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      {dueDate ? (
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <Calendar className="w-3 h-3 text-[#FF9933]" />
                          <span>Due: {new Date(dueDate).toLocaleDateString()}</span>
                        </span>
                      ) : (
                        <span>Needs verification</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingInstrument(item)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedInstForApply(item)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition"
                      >
                        Apply Verification
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
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

      {/* 3. View Instrument Details Modal */}
      {viewingInstrument && (
        <Modal
          isOpen={Boolean(viewingInstrument)}
          onClose={() => setViewingInstrument(null)}
          title="Statutory Instrument Profile"
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#123B6D] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {viewingInstrument.instrumentId || `INS-${viewingInstrument._id.slice(-6).toUpperCase()}`}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1.5">
                  {viewingInstrument.instrumentType || viewingInstrument.instrumentName || viewingInstrument.category}
                </h3>
                <p className="text-slate-500">
                  Category: {viewingInstrument.category?.replace(/_/g, ' ')}
                </p>
              </div>
              <StatusBadge status={viewingInstrument.verificationStatus || viewingInstrument.status || 'PENDING_VERIFICATION'} size="md" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Manufacturer</span>
                <p className="font-bold text-slate-800">{viewingInstrument.manufacturer}</p>
                <p className="text-slate-500">Model: {viewingInstrument.modelNumber}</p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Serial Number</span>
                <p className="font-mono font-bold text-slate-800">{viewingInstrument.serialNumber}</p>
                <p className="text-slate-500">
                  Accuracy: {viewingInstrument.accuracyClass?.replace(/_/g, ' ') || 'Class III'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Max Capacity / Interval</span>
                <p className="font-bold text-slate-800">
                  {formatInstrumentCapacity(viewingInstrument.capacity, viewingInstrument.unit, viewingInstrument.maxCapacity)}
                </p>
                {viewingInstrument.verificationScaleInterval_e && (
                  <p className="text-slate-500">Interval (e): {viewingInstrument.verificationScaleInterval_e}</p>
                )}
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Model Approval No.</span>
                <p className="font-bold text-slate-800 font-mono">
                  {viewingInstrument.modelApprovalNumber || 'IND-DOCA-VERIFIED'}
                </p>
                <p className="text-slate-500">DoCA Standards of Weights & Measures</p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Physical Installation Location</span>
              </span>
              <p className="font-medium text-slate-800">{formatAddress(viewingInstrument.installationAddress)}</p>
              {viewingInstrument.installationAddress?.latitude && viewingInstrument.installationAddress?.longitude && (
                <p className="text-[11px] text-slate-500 font-mono">
                  GPS: {viewingInstrument.installationAddress.latitude.toFixed(4)}, {viewingInstrument.installationAddress.longitude.toFixed(4)}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingInstrument(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const inst = viewingInstrument;
                  setViewingInstrument(null);
                  setSelectedInstForApply(inst);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition"
              >
                Apply for Verification
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. Apply for Verification Modal */}
      {selectedInstForApply && (
        <Modal
          isOpen={Boolean(selectedInstForApply)}
          onClose={() => setSelectedInstForApply(null)}
          title="Apply for Statutory Verification"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
              <p className="font-bold text-[#123B6D] text-sm">
                {selectedInstForApply.instrumentType || selectedInstForApply.instrumentName || selectedInstForApply.category}
              </p>
              <p className="text-slate-600 mt-0.5">
                Serial Number: <strong className="font-mono">{selectedInstForApply.serialNumber}</strong> • Model:{' '}
                {selectedInstForApply.modelNumber}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Verification Purpose</label>
              <select
                value={applyPurpose}
                onChange={(e) => setApplyPurpose(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:border-[#123B6D]"
              >
                <option value="INITIAL_VERIFICATION">Initial Verification (First-time commercial use)</option>
                <option value="ANNUAL_VERIFICATION">Periodic Reverification (Annual statutory renewal)</option>
                <option value="REVERIFICATION_AFTER_REPAIR">Re-verification after repair / recalibration</option>
                <option value="SPECIAL_INSPECTION">Special Voluntary Inspection</option>
              </select>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Statutory Declaration</span>
              </p>
              By proceeding, you submit this instrument to the Legal Metrology officer allotment system.
              The designated field officer will be assigned according to jurisdictional roster for inspection.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedInstForApply(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={applying}
                onClick={handleApplyVerification}
                className="px-4 py-2 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>{applying ? 'Submitting...' : 'Confirm & Submit Application'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
