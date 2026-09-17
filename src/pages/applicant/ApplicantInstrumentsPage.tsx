import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { instrumentApi } from '../../services/instrumentApi';
import { applicationApi } from '../../services/applicationApi';
import { InstrumentItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import { formatInstrumentCapacity } from '../../utils/formatters';
import {
  PlusCircle,
  FileCheck2,
  Cpu,
  Calendar,
  Eye,
  ShieldCheck,
} from 'lucide-react';

export const ApplicantInstrumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState<InstrumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Apply modal state
  const [selectedInstForApply, setSelectedInstForApply] = useState<InstrumentItem | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyPurpose, setApplyPurpose] = useState('ANNUAL_VERIFICATION');

  const fetchInstruments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
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
        title: 'Data Load Error',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchInstruments();
  }, [fetchInstruments]);

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
          message: `Verification application created for ${selectedInstForApply.instrumentName || 'Instrument'}.`,
        });
        setSelectedInstForApply(null);
        navigate(`/applicant/applications/${res.data._id}`);
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Application Error',
        message: getErrorMessage(err),
      });
    } finally {
      setApplying(false);
    }
  };

  const columns: Column<InstrumentItem>[] = [
    {
      header: 'Instrument / Model',
      cell: (item) => (
        <div>
          <div className="font-bold text-slate-900">{item.instrumentName || item.category}</div>
          <div className="text-[11px] text-slate-500">{item.modelNumber} • {item.manufacturer}</div>
        </div>
      ),
    },
    {
      header: 'Serial Number',
      cell: (item) => (
        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {item.serialNumber}
        </span>
      ),
    },
    {
      header: 'Category',
      cell: (item) => (
        <span className="text-xs text-slate-600 font-medium">
          {item.category.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Capacity',
      cell: (item) => (
        <span className="text-xs text-slate-700 font-semibold">
          {formatInstrumentCapacity(item.capacity, item.unit, item.maxCapacity)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.verificationStatus || item.status || 'UNVERIFIED'} size="sm" />,
    },
    {
      header: 'Valid Until',
      cell: (item) => (
        <div className="text-xs text-slate-600 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {item.verificationValidityDate
              ? new Date(item.verificationValidityDate).toLocaleDateString()
              : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setSelectedInstForApply(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-teal-700" />
            <span>Apply</span>
          </button>
        </div>
      ),
    },
  ];

  const mobileCardRender = (item: InstrumentItem) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-bold text-xs text-slate-900">{item.instrumentName || item.category}</h4>
          <p className="text-[11px] text-slate-500">{item.manufacturer} • {item.modelNumber}</p>
        </div>
        <StatusBadge status={item.verificationStatus || item.status || 'UNVERIFIED'} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
        <div>
          <span className="text-slate-400">SN: </span>
          <span className="font-mono font-medium text-slate-800">{item.serialNumber}</span>
        </div>
        <div>
          <span className="text-slate-400">Capacity: </span>
          <span className="font-semibold text-slate-800">
            {formatInstrumentCapacity(item.capacity, item.unit, item.maxCapacity)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-slate-500">
          Valid:{' '}
          {item.verificationValidityDate
            ? new Date(item.verificationValidityDate).toLocaleDateString()
            : 'Unverified'}
        </span>
        <button
          type="button"
          onClick={() => setSelectedInstForApply(item)}
          className="px-3 py-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition"
        >
          Apply for Verification
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Commercial Instruments"
        description="Statutory weighing, measuring, and volumetric instruments"
        breadcrumbs={[
          { label: 'Dashboard', href: '/applicant/dashboard' },
          { label: 'Instruments' },
        ]}
        actions={
          <Link
            to="/applicant/register-instrument"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Register Instrument</span>
          </Link>
        }
      />

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by serial number, name or model..."
        />

        <FilterPanel
          filters={[
            {
              key: 'category',
              label: 'Category',
              value: categoryFilter,
              onChange: (val) => {
                setCategoryFilter(val);
                setPage(1);
              },
              options: [
                { label: 'All Categories', value: 'ALL' },
                { label: 'NAWI (Non-Automatic)', value: 'NON_AUTOMATIC_WEIGHING_INSTRUMENTS' },
                { label: 'AWI (Automatic)', value: 'AUTOMATIC_WEIGHING_INSTRUMENTS' },
                { label: 'Measuring Instruments', value: 'MEASURING_INSTRUMENTS' },
                { label: 'Flow Meters', value: 'FLOW_METERS' },
              ],
            },
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
                { label: 'Verified / Active', value: 'VERIFIED' },
                { label: 'Unverified', value: 'UNVERIFIED' },
                { label: 'Expired', value: 'EXPIRED' },
              ],
            },
          ]}
          onReset={() => {
            setCategoryFilter('ALL');
            setStatusFilter('ALL');
            setSearch('');
            setPage(1);
          }}
        />
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={instruments}
        loading={loading}
        keyExtractor={(item) => item._id}
        emptyTitle="No Instruments Found"
        emptyDescription="You have not registered any weighing or measuring devices under this criteria."
        emptyActionLabel="Register New Instrument"
        onEmptyAction={() => navigate('/applicant/register-instrument')}
        mobileCardRender={mobileCardRender}
        pagination={{
          currentPage: page,
          totalPages,
          totalRecords,
          pageSize: 10,
          onPageChange: (p) => setPage(p),
        }}
      />

      {/* Apply for Verification Modal */}
      {selectedInstForApply && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInstForApply(null)}
          title="Apply for Statutory Verification"
          subtitle={`Initiate inspection for ${selectedInstForApply.instrumentName || 'Instrument'}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedInstForApply(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyVerification}
                disabled={applying}
                className="px-4 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {applying && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Submit Application</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="font-bold text-slate-800">
                {selectedInstForApply.instrumentName || selectedInstForApply.category}
              </div>
              <div className="text-slate-500">
                Serial Number: <span className="font-mono">{selectedInstForApply.serialNumber}</span>
              </div>
              <div className="text-slate-500">
                Model: {selectedInstForApply.modelNumber} • {selectedInstForApply.manufacturer}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verification Purpose *
              </label>
              <select
                value={applyPurpose}
                onChange={(e) => setApplyPurpose(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              >
                <option value="ANNUAL_VERIFICATION">Annual Re-verification</option>
                <option value="INITIAL_VERIFICATION">Initial Stamping & Verification</option>
                <option value="POST_REPAIR_VERIFICATION">Post-Repair Verification</option>
                <option value="VOLUNTARY_CALIBRATION">Voluntary Statutory Calibration</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Upon submission, your application will be routed to the jurisdictional Legal Metrology
              Officer for documentary review and schedule allotment.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
