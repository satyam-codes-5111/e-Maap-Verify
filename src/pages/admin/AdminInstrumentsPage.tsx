import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { instrumentApi } from '../../services/instrumentApi';
import { InstrumentItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { formatInstrumentCapacity, formatScaleInterval } from '../../utils/formatters';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
} from 'lucide-react';

export const AdminInstrumentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [instruments, setInstruments] = useState<InstrumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'ALL');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || searchParams.get('verificationStatus') || 'ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Sync state if URL searchParams change
  useEffect(() => {
    const qStatus = searchParams.get('status') || searchParams.get('verificationStatus') || 'ALL';
    const qCat = searchParams.get('category') || 'ALL';
    setStatusFilter(qStatus);
    setCategoryFilter(qCat);
    setPage(1);
  }, [searchParams]);

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (val === 'ALL') {
      next.delete('status');
      next.delete('verificationStatus');
    } else {
      next.set('status', val);
    }
    setSearchParams(next);
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (val === 'ALL') {
      next.delete('category');
    } else {
      next.set('category', val);
    }
    setSearchParams(next);
  };

  const fetchInstruments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
        params.verificationStatus = statusFilter;
      }

      const res = await instrumentApi.getInstruments(params);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.instruments || []);
        setInstruments(list);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Loading Error',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchInstruments();
  }, [fetchInstruments]);

  const columns: Column<InstrumentItem>[] = [
    {
      header: 'Instrument Details',
      cell: (item) => (
        <div>
          <div className="font-bold text-[#123B6D]">{item.instrumentName || item.instrumentType || item.category?.replace(/_/g, ' ')}</div>
          <div className="text-[11px] text-[#5B6B7A] font-mono">
            SN: {item.serialNumber || 'N/A'} • Model: {item.modelNumber || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Owner / Stakeholder',
      cell: (item) => {
        const stakeholder = typeof item.stakeholder === 'object' && item.stakeholder !== null ? (item.stakeholder as any) : null;
        const district = stakeholder?.registeredAddress?.district || stakeholder?.district || item.installationAddress?.district || 'District';
        const state = stakeholder?.registeredAddress?.state || stakeholder?.state || item.installationAddress?.state || 'State';
        return (
          <div>
            <div className="font-semibold text-[#172B4D] text-xs">
              {stakeholder?.businessName || 'Commercial Establishment'}
            </div>
            <div className="text-[11px] text-[#5B6B7A]">
              {district}, {state}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Technical Class',
      cell: (item) => {
        const capacityStr = formatInstrumentCapacity(item.capacity, item.unit, item.maxCapacity);
        const scaleInterval = formatScaleInterval(item);
        return (
          <div className="text-xs text-[#172B4D]">
            <div className="font-medium">{item.category?.replace(/_/g, ' ')}</div>
            <div className="text-[11px] text-[#5B6B7A] font-mono">
              Cap: {capacityStr} (e={scaleInterval})
            </div>
          </div>
        );
      },
    },
    {
      header: 'Verification Status',
      cell: (item) => (
        <StatusBadge status={item.verificationStatus || item.status || 'UNVERIFIED'} size="sm" />
      ),
    },
    {
      header: 'Statutory Expiry',
      cell: (item) => {
        const expiryDate = item.verificationExpiryDate || item.nextVerificationDueDate || item.verificationValidityDate;
        return (
          <div className="text-xs">
            {expiryDate ? (
              <span className="font-semibold text-[#172B4D] font-mono">
                {new Date(expiryDate).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-[#5B6B7A] italic">No Active Seal</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="National Weights & Measures Instrument Registry"
        description="Statutory central database of verified commercial weighing and measuring instruments"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Instrument Registry' },
        ]}
      />

      <div className="bg-white p-4 rounded-xl border border-[#D9E2EC] shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search serial number, model, stakeholder..."
          />

          <FilterPanel
            filters={[
              {
                key: 'status',
                label: 'Verification Status',
                value: statusFilter,
                onChange: (val) => handleStatusFilterChange(val),
                options: [
                  { label: 'All Statuses', value: 'ALL' },
                  { label: 'Verified', value: 'VERIFIED' },
                  { label: 'Expiring Soon', value: 'EXPIRING_SOON' },
                  { label: 'Expired', value: 'EXPIRED' },
                  { label: 'Unverified', value: 'UNVERIFIED' },
                ],
              },
              {
                key: 'category',
                label: 'Category',
                value: categoryFilter,
                onChange: (val) => handleCategoryFilterChange(val),
                options: [
                  { label: 'All Categories', value: 'ALL' },
                  { label: 'Non-Automatic Weighing', value: 'NON_AUTOMATIC_WEIGHING_INSTRUMENT' },
                  { label: 'Automatic Weighing', value: 'AUTOMATIC_WEIGHING_INSTRUMENT' },
                  { label: 'Linear Measure', value: 'LINEAR_MEASURE' },
                  { label: 'Capacity Measure', value: 'CAPACITY_MEASURE' },
                  { label: 'Fuel Dispensing Unit', value: 'FUEL_DISPENSER' },
                  { label: 'Weighbridge', value: 'WEIGHBRIDGE' },
                ],
              },
            ]}
            onReset={() => {
              handleStatusFilterChange('ALL');
              handleCategoryFilterChange('ALL');
              setSearch('');
            }}
          />
        </div>

        {(statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs flex-wrap">
            <span className="font-semibold text-slate-500">Active Filters:</span>
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                <span>Status: {statusFilter}</span>
                <button
                  type="button"
                  onClick={() => handleStatusFilterChange('ALL')}
                  className="hover:text-teal-950 font-bold ml-0.5 text-sm leading-none cursor-pointer"
                  aria-label="Clear status filter"
                >
                  ×
                </button>
              </span>
            )}
            {categoryFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                <span>Category: {categoryFilter.replace(/_/g, ' ')}</span>
                <button
                  type="button"
                  onClick={() => handleCategoryFilterChange('ALL')}
                  className="hover:text-blue-950 font-bold ml-0.5 text-sm leading-none cursor-pointer"
                  aria-label="Clear category filter"
                >
                  ×
                </button>
              </span>
            )}
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Showing {totalRecords} instrument(s)</span>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={instruments}
        loading={loading}
        keyExtractor={(item) => item._id}
        emptyTitle="No Instruments Found"
        emptyDescription="No registered instruments matching the search criteria."
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
