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
  ExternalLink,
  QrCode,
} from 'lucide-react';

export const ApplicantCertificatesPage: React.FC = () => {
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
      header: 'Certificate Number',
      cell: (item) => (
        <div>
          <div className="font-bold text-teal-800">{item.certificateNumber}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {item.qrVerificationToken ? `Token: ${item.qrVerificationToken.slice(0, 16)}...` : 'QR Signed'}
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

  const mobileCardRender = (item: CertificateItem) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-bold text-xs text-teal-800">{item.certificateNumber}</span>
          <p className="text-[11px] text-slate-500">
            {item.instrument?.instrumentName || item.instrument?.category} (SN: {item.instrument?.serialNumber})
          </p>
        </div>
        <StatusBadge status={item.dynamicStatus || item.certificateStatus || item.status || 'VALID'} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
        <div>
          <span className="text-slate-400">Valid From: </span>
          <span className="font-medium text-slate-800">{new Date(item.validFrom).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="text-slate-400">Valid Until: </span>
          <span className="font-semibold text-emerald-700">{new Date(item.validUntil).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Link
          to={`/verify-certificate?token=${encodeURIComponent(item.qrVerificationToken || item.certificateNumber)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition"
        >
          Verify QR
        </Link>
        <button
          type="button"
          onClick={() => handleDownload(item)}
          disabled={downloadingId === item._id}
          className="px-3 py-1 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition disabled:opacity-50"
        >
          {downloadingId === item._id ? 'Downloading...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Verification Certificates"
        description="Official statutory certificates issued by Legal Metrology Officers"
        breadcrumbs={[
          { label: 'Dashboard', href: '/applicant/dashboard' },
          { label: 'Certificates' },
        ]}
      />

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by certificate number..."
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={certificates}
        loading={loading}
        keyExtractor={(item) => item._id}
        emptyTitle="No Certificates Found"
        emptyDescription="Your verified instruments will appear here once finalized by inspecting officers."
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
