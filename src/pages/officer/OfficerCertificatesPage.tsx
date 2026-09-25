import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { certificateApi } from '../../services/certificateApi';
import { CertificateItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import {
  Award,
  Download,
  ShieldCheck,
  Calendar,
  Eye,
  ExternalLink,
  QrCode,
  Scale,
  Building2,
  FileCheck2,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';

export const OfficerCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Preview Certificate Modal state
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Track latest fetch request to prevent race conditions
  const fetchRequestId = useRef(0);

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

  const handlePreview = async (cert: CertificateItem) => {
    // Open immediately with row data
    setPreviewCert(cert);
    setLoadingPreview(true);

    try {
      // Fetch full hydrated record from MongoDB (populated application, inspection, stakeholder, instrument)
      const res = await certificateApi.getCertificateById(cert._id);
      if (res.success && res.data) {
        setPreviewCert(res.data);
      }
    } catch {
      // Retain existing item data if detail API has an issue
    } finally {
      setLoadingPreview(false);
    }
  };

  const fetchCertificates = useCallback(async () => {
    const currentReq = ++fetchRequestId.current;
    setLoading(true);

    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await certificateApi.getCertificates(params);

      // Prevent race conditions: ignore response if a newer request was dispatched
      if (currentReq !== fetchRequestId.current) return;

      if (res.success && res.data) {
        setCertificates(res.data.certificates || []);
        if (res.data.pagination) {
          const pg = res.data.pagination;
          const resolvedTotalPages = Number(pg.totalPages || pg.pages) || 1;
          const resolvedTotalRecords = Number(pg.total) || 0;
          setTotalPages(Math.max(1, resolvedTotalPages));
          setTotalRecords(resolvedTotalRecords);
        } else {
          setTotalPages(1);
          setTotalRecords((res.data.certificates || []).length);
        }
      }
    } catch (err: unknown) {
      if (currentReq === fetchRequestId.current) {
        setToast({
          id: String(Date.now()),
          type: 'error',
          title: 'Error Loading Certificates',
          message: getErrorMessage(err),
        });
      }
    } finally {
      if (currentReq === fetchRequestId.current) {
        setLoading(false);
      }
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const columns: Column<CertificateItem>[] = [
    {
      header: 'Certificate No.',
      cell: (item) => (
        <div>
          <div className="font-bold text-[#123B6D] flex items-center gap-1.5 font-mono text-xs">
            <QrCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{item.certificateNumber}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Seal: <span className="font-semibold text-slate-700">{item.sealNumber || 'N/A'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Stakeholder',
      cell: (item) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">
            {item.stakeholder?.businessName || 'Commercial Establishment'}
          </div>
          <div className="text-[11px] text-slate-500">
            {item.stakeholder?.district ? `${item.stakeholder.district}, ` : ''}
            {item.stakeholder?.state || 'India'}
          </div>
        </div>
      ),
    },
    {
      header: 'Instrument',
      cell: (item) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">
            {item.instrument?.instrumentName || item.instrument?.category || 'Weighing/Measuring Instrument'}
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
          <div>From: {item.validFrom ? new Date(item.validFrom).toLocaleDateString() : 'N/A'}</div>
          <div className="font-semibold text-emerald-700">
            To: {item.validUntil ? new Date(item.validUntil).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => (
        <StatusBadge
          status={item.dynamicStatus || item.certificateStatus || item.status || 'VALID'}
          size="sm"
        />
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* PREVIEW BUTTON */}
          <button
            type="button"
            onClick={() => handlePreview(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#123B6D] bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-lg border border-blue-200 transition shadow-2xs"
            title="Preview Certificate Details"
          >
            <Eye className="w-3.5 h-3.5 text-[#123B6D]" />
            <span>Preview</span>
          </button>

          {/* VERIFY LINK */}
          <Link
            to={`/verify-certificate?token=${encodeURIComponent(item.qrVerificationToken || item.certificateNumber)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition shadow-2xs"
            title="Public Verification Page"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Verify</span>
          </Link>

          {/* PDF DOWNLOAD BUTTON */}
          <button
            type="button"
            onClick={() => handleDownload(item)}
            disabled={downloadingId === item._id}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition disabled:opacity-50 shadow-2xs"
            title="Download Official Certificate PDF"
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
        description="Official statutory certificates with cryptographic verification seals & tamper-evident QR codes"
        breadcrumbs={[
          { label: 'Dashboard', href: '/officer/dashboard' },
          { label: 'Certificates Register' },
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by certificate number, seal, or serial..."
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:border-[#123B6D]"
            aria-label="Filter Certificates by Status"
          >
            <option value="ALL">All Statuses</option>
            <option value="VALID">Active / Valid</option>
            <option value="EXPIRED">Expired</option>
            <option value="REVOKED">Revoked</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Data Table with Real MongoDB Pagination */}
      <DataTable
        columns={columns}
        data={certificates}
        loading={loading}
        keyExtractor={(item) => item._id}
        emptyTitle="No Certificates Found"
        emptyDescription={
          search || statusFilter !== 'ALL'
            ? 'No certificates match the selected search and filter criteria.'
            : 'Certificates finalized during field inspections will appear here.'
        }
        mobileCardRender={(item) => (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-1.5 font-mono font-bold text-[#123B6D] text-xs">
                  <QrCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.certificateNumber}</span>
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {item.instrument?.instrumentName || item.instrument?.category || 'Instrument'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  SN: {item.instrument?.serialNumber || 'N/A'} • Seal: {item.sealNumber || 'N/A'}
                </p>
              </div>
              <StatusBadge
                status={item.dynamicStatus || item.certificateStatus || item.status || 'VALID'}
                size="sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Stakeholder</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {item.stakeholder?.businessName || 'Business Establishment'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Valid Until</span>
                <span className="font-bold text-slate-900">
                  {item.validUntil ? new Date(item.validUntil).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handlePreview(item)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#123B6D] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              <div className="flex items-center gap-1.5">
                <Link
                  to={`/verify-certificate?token=${encodeURIComponent(item.qrVerificationToken || item.certificateNumber)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verify</span>
                </Link>

                <button
                  type="button"
                  disabled={downloadingId === item._id}
                  onClick={() => handleDownload(item)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingId === item._id ? 'Downloading...' : 'PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
        pagination={{
          currentPage: page,
          totalPages,
          totalRecords,
          pageSize: 10,
          onPageChange: (p) => setPage(p),
        }}
      />

      {/* Official Certificate Details / Preview Modal */}
      {previewCert && (
        <Modal
          isOpen={Boolean(previewCert)}
          onClose={() => setPreviewCert(null)}
          title="Verification Certificate Preview"
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Government Banner */}
            <div className="bg-[#123B6D] text-white p-4 rounded-xl space-y-1 text-center shadow-xs">
              <p className="text-[10px] tracking-widest uppercase font-bold text-amber-300">
                Government of India • Department of Consumer Affairs
              </p>
              <h2 className="text-base font-black">Legal Metrology Certificate of Verification</h2>
              <p className="text-[11px] text-blue-100">
                Issued in accordance with Section 24 of the Legal Metrology Act, 2009
              </p>
            </div>

            {/* Core Certificate Record */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Certificate Number
                  </span>
                  <p className="font-mono font-black text-sm text-[#123B6D]">
                    {previewCert.certificateNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500">
                    Seal: <strong className="text-slate-800">{previewCert.sealNumber || 'N/A'}</strong>
                  </span>
                  <StatusBadge
                    status={
                      previewCert.dynamicStatus ||
                      previewCert.certificateStatus ||
                      previewCert.status ||
                      'VALID'
                    }
                    size="md"
                  />
                </div>
              </div>

              {/* Stakeholder and Instrument Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-[#123B6D] font-bold text-xs mb-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Stakeholder / Establishment</span>
                  </div>
                  <p className="font-semibold text-slate-900 text-xs">
                    {previewCert.stakeholder?.businessName || 'Business Establishment'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    License: {previewCert.stakeholder?.tradeLicenseNumber || 'Registered'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {previewCert.stakeholder?.registeredAddress?.street || ''}{' '}
                    {previewCert.stakeholder?.registeredAddress?.district || previewCert.stakeholder?.district || ''},{' '}
                    {previewCert.stakeholder?.registeredAddress?.state || previewCert.stakeholder?.state || 'India'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-[#123B6D] font-bold text-xs mb-1.5">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Instrument Under Verification</span>
                  </div>
                  <p className="font-semibold text-slate-900 text-xs">
                    {previewCert.instrument?.instrumentName || previewCert.instrument?.category || 'Commercial Instrument'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Serial No: {previewCert.instrument?.serialNumber || 'N/A'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Make: {previewCert.instrument?.manufacturer || 'N/A'} • Capacity:{' '}
                    {typeof previewCert.instrument?.capacity === 'object' && previewCert.instrument?.capacity !== null
                      ? `${previewCert.instrument?.capacity?.value || ''} ${previewCert.instrument?.capacity?.unit || ''}`.trim() || 'Standard'
                      : String(previewCert.instrument?.capacity || 'Standard')}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Statutory Validity Period
                  </span>
                  <p className="font-semibold text-slate-900">
                    {previewCert.validFrom ? new Date(previewCert.validFrom).toLocaleDateString() : 'N/A'} to{' '}
                    {previewCert.validUntil ? new Date(previewCert.validUntil).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Verified By Officer
                  </span>
                  <p className="font-semibold text-slate-900">
                    {previewCert.verifiedByOfficer?.name ||
                      (previewCert as any).issuedByOfficer?.name ||
                      (previewCert as any).issuedBy?.name ||
                      (previewCert as any).issuingOfficer ||
                      'Legal Metrology Officer'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {previewCert.verifiedByOfficer?.designation ||
                      (previewCert as any).issuedByOfficer?.designation ||
                      'Inspector / Legal Metrology Officer'}
                  </p>
                </div>
              </div>

              {/* Cryptographic QR Verification Token */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Cryptographic Verification Token
                  </span>
                  <p className="font-mono text-[11px] text-slate-700 break-all">
                    {previewCert.qrVerificationToken || previewCert.qrToken || 'DOCA-LM-VERIFIED-CERT-TOKEN'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#123B6D]/10 flex items-center justify-center shrink-0">
                  <QrCode className="w-6 h-6 text-[#123B6D]" />
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-slate-100 gap-2">
              <Link
                to={`/verify-certificate?token=${encodeURIComponent(previewCert.qrVerificationToken || previewCert.certificateNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#123B6D] hover:underline inline-flex items-center gap-1.5"
              >
                <span>Open Public QR Verification Record</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewCert(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={downloadingId === previewCert._id}
                  onClick={() => handleDownload(previewCert)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition disabled:opacity-50 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingId === previewCert._id ? 'Downloading...' : 'Download Official PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
