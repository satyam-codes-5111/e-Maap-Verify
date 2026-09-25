import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { stakeholderApi } from '../../services/stakeholderApi';
import { StakeholderItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  FileCheck2,
  MapPin,
} from 'lucide-react';

export const AdminStakeholdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stakeholders, setStakeholders] = useState<StakeholderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState(searchParams.get('kycStatus') || searchParams.get('status') || 'ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Sync state if URL searchParams change
  useEffect(() => {
    const qKyc = searchParams.get('kycStatus') || searchParams.get('status') || 'ALL';
    setKycFilter(qKyc);
    setPage(1);
  }, [searchParams]);

  const handleKycFilterChange = (val: string) => {
    setKycFilter(val);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (val === 'ALL') {
      next.delete('kycStatus');
      next.delete('status');
    } else {
      next.set('kycStatus', val);
    }
    setSearchParams(next);
  };

  // KYC verification modal
  const [selectedStakeholder, setSelectedStakeholder] = useState<StakeholderItem | null>(null);
  const [kycDecision, setKycDecision] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [kycRemarks, setKycRemarks] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchStakeholders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (kycFilter !== 'ALL') params.kycStatus = kycFilter;

      const res = await stakeholderApi.getAllStakeholders(params);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.stakeholders || []);
        setStakeholders(list);
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
        title: 'Error Loading Stakeholders',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, kycFilter]);

  useEffect(() => {
    fetchStakeholders();
  }, [fetchStakeholders]);

  const handleKycSubmit = async () => {
    if (!selectedStakeholder) return;
    setVerifying(true);
    try {
      const res = await stakeholderApi.verifyKyc(
        selectedStakeholder._id,
        kycDecision,
        kycRemarks || (kycDecision === 'VERIFIED' ? 'Approved by Authority' : 'Rejected')
      );
      if (res.success) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'KYC Status Updated',
          message: `Stakeholder KYC marked as ${kycDecision}.`,
        });
        setSelectedStakeholder(null);
        fetchStakeholders();
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'KYC Update Error',
        message: getErrorMessage(err),
      });
    } finally {
      setVerifying(false);
    }
  };

  const columns: Column<StakeholderItem>[] = [
    {
      header: 'Business Establishment',
      cell: (item) => (
        <div>
          <div className="font-bold text-[#172B4D]">{item.businessName}</div>
          <div className="text-[11px] text-[#5B6B7A] font-mono">
            Lic: {item.tradeLicenseNumber || 'N/A'} • GST: {item.gstNumber || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      cell: (item) => (
        <span className="text-xs text-[#172B4D] font-medium">
          {item.businessType?.replace(/_/g, ' ') || 'TRADER'}
        </span>
      ),
    },
    {
      header: 'Jurisdiction District',
      cell: (item) => (
        <div className="text-xs text-[#5B6B7A] flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-[#5B6B7A]" />
          <span>
            {item.registeredAddress?.district || item.district || 'District'},{' '}
            {item.registeredAddress?.state || item.state || 'State'}
          </span>
        </div>
      ),
    },
    {
      header: 'KYC Status',
      cell: (item) => <StatusBadge status={item.kycStatus} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              setSelectedStakeholder(item);
              setKycDecision(item.kycStatus === 'VERIFIED' ? 'REJECTED' : 'VERIFIED');
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[#123B6D] bg-[#E8F1FA] hover:bg-[#d8e8f8] rounded-md border border-[#07549A]/30 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#07549A]" />
            <span>Verify KYC</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Commercial Stakeholder Registry"
        description="Statutory repository of manufacturers, repairers, dealers, and traders"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Stakeholders' },
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
            placeholder="Search by business name, GSTIN, license..."
          />

          <FilterPanel
            filters={[
              {
                key: 'kyc',
                label: 'KYC Status',
                value: kycFilter,
                onChange: (val) => handleKycFilterChange(val),
                options: [
                  { label: 'All KYC', value: 'ALL' },
                  { label: 'Pending', value: 'PENDING' },
                  { label: 'Verified', value: 'VERIFIED' },
                  { label: 'Rejected', value: 'REJECTED' },
                ],
              },
            ]}
            onReset={() => {
              handleKycFilterChange('ALL');
              setSearch('');
            }}
          />
        </div>

        {kycFilter !== 'ALL' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-500">Active Filter:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              <span>KYC: {kycFilter}</span>
              <button
                type="button"
                onClick={() => handleKycFilterChange('ALL')}
                className="hover:text-blue-950 font-bold ml-0.5 text-sm leading-none cursor-pointer"
                aria-label="Clear KYC filter"
              >
                ×
              </button>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Showing {totalRecords} stakeholder(s)</span>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={stakeholders}
        loading={loading}
        keyExtractor={(item) => item._id}
        emptyTitle="No Stakeholders Found"
        emptyDescription="No business traders registered matching this search."
        pagination={{
          currentPage: page,
          totalPages,
          totalRecords,
          pageSize: 10,
          onPageChange: (p) => setPage(p),
        }}
      />

      {/* KYC Verification Modal */}
      {selectedStakeholder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStakeholder(null)}
          title="Statutory KYC Verification"
          subtitle={`Review establishment credentials for ${selectedStakeholder.businessName}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedStakeholder(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#5B6B7A] hover:bg-[#F5F8FC] border border-[#D9E2EC] rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleKycSubmit}
                disabled={verifying}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0B2F57] rounded-md shadow-2xs flex items-center gap-1.5 disabled:opacity-50 transition"
              >
                {verifying && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Confirm Decision</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#F5F8FC] rounded-lg border border-[#D9E2EC] space-y-1">
              <div className="font-bold text-[#172B4D]">{selectedStakeholder.businessName}</div>
              <div className="text-[#5B6B7A]">
                Trade License: {selectedStakeholder.tradeLicenseNumber || 'Not submitted'}
              </div>
              <div className="text-[#5B6B7A]">
                GSTIN: {selectedStakeholder.gstNumber || 'Not submitted'}
              </div>
              <div className="text-[#5B6B7A]">
                PAN: {selectedStakeholder.panNumber || 'Not submitted'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] mb-1">
                Verification Decision *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setKycDecision('VERIFIED')}
                  className={`py-2 px-3 rounded-md border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    kycDecision === 'VERIFIED'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                      : 'bg-white border-[#D9E2EC] text-[#5B6B7A]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Approve & Verify</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKycDecision('REJECTED')}
                  className={`py-2 px-3 rounded-md border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    kycDecision === 'REJECTED'
                      ? 'bg-rose-50 border-rose-600 text-rose-800'
                      : 'bg-white border-[#D9E2EC] text-[#5B6B7A]'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Reject KYC</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] mb-1">
                Official Departmental Remarks
              </label>
              <textarea
                rows={3}
                value={kycRemarks}
                onChange={(e) => setKycRemarks(e.target.value)}
                placeholder="State remarks or reasons for decision..."
                className="w-full px-3 py-2 text-xs bg-white border border-[#D9E2EC] rounded-md focus:ring-2 focus:ring-[#07549A]/20 focus:border-[#07549A] transition text-[#172B4D]"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
