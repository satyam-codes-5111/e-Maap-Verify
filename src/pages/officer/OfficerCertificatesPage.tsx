import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { certificateApi } from '../../services/certificateApi';
import { CertificateItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { Toast, ToastMessage } from '../../components/common/Toast';
import {
  Award,
  Download,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export const OfficerCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (cert: CertificateItem) => {
    try {
      setDownloadingId(cert._id);
      await certificateApi.downloadCertificatePdf(
        cert._id,
        `${cert.certificateNumber || 'Verification_Certificate'}.pdf`
      );
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Download Failed',
        message: getErrorMessage(err),
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;

      const res = await certificateApi.getCertificates(params);
      if (res.success && res.data) {
        setCertificates(res.data.certificates || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Error Loading Certificates',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const columns: Column<CertificateItem>[] = [
    {
      header: 'Certificate No.',
      cell: (item) => (
        <div>
          <div className="font-bold text-teal-800">{item.certificateNumber}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            Seal: {item.sealNumber || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Stakeholder',
      cell: (item) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs">
            {item.stakeholder?.businessName || 'Business Establishment'}
          </div>
          <div className="text-[11px] text-slate-500">
            {item.stakeholder?.district}, {item.stakeholder?.state}
          </div>
        </div>
      ),
    },
    {
      header: 'Instrument',
      cell: (item) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs">
            {item.instrument?.instrumentName || item.instrument?.category}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            SN: {item.instrument?.serialNumber || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Validity Period',
      cell: (item) => (
        <div className="text-xs text-slate-700">
          <div>From: {new Date(item.validFrom).toLocaleDateString()}</div>
          <div className="font-semibold text-emerald-700">
            To: {new Date(item.validUntil).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => (
        <StatusBadge status={item.dynamicStatus || item.certificateStatus || item.status || 'VALID'} size="sm" />
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/verify-certificate?token=${encodeURIComponent(item.qrVerificationToken || item.certificateNumber)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify</span>
          </Link>
          <button
            type="button"
            onClick={() => handleDownload(item)}
            disabled={downloadingId === item._id}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingId === item._id ? 'Downloading...' : 'PDF'}</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Issued Verification Certificates"
        description="Official certificates with cryptographic verification seals"
        breadcrumbs={[
          { label: 'Dashboard', href: '/officer/dashboard' },
          { label: 'Certificates' },
        ]}
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search certificate or serial number..."
        />
      </div>

      <DataTable
        columns={columns}
        data={certificates}
        loading={loading}
        keyExtractor={(item) => item._id}
        emptyTitle="No Certificates Found"
        emptyDescription="Certificates finalized during field inspections will appear here."
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
