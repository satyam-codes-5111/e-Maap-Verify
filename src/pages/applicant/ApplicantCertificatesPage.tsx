import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { certificateApi } from '../../services/certificateApi';
import { CertificateItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { formatInstrumentCapacity } from '../../utils/formatters';
import {
  Award,
  Download,
  ShieldCheck,
  Calendar,
  ExternalLink,
  QrCode,
  Search,
  Eye,
  UserCheck,
  Scale,
  Building2,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';

export const ApplicantCertificatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const getNormalizedStatus = (s: string | null) => {
    if (!s) return 'ALL';
    const up = s.toUpperCase();
    if (up === 'ACTIVE' || up === 'VALID') return 'VALID';
    return up;
  };

  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(getNormalizedStatus(searchParams.get('status')));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Sync state if URL query parameter changes
  useEffect(() => {
    const qStatus = getNormalizedStatus(searchParams.get('status'));
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

  // View certificate modal state
  const [viewingCert, setViewingCert] = useState<CertificateItem | null>(null);

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
      const params: any = { page, limit: 12 };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;

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
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Verification Certificates"
        description="Official tamper-evident digital certificates with cryptographically signed QR codes"
        breadcrumbs={[
          { label: 'Dashboard', to: '/applicant/dashboard' },
          { label: 'Certificates' },
        ]}
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
            placeholder="Search by certificate number, serial number or business..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#123B6D]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#123B6D]"
            aria-label="Filter by Status"
          >
            <option value="ALL">All Statuses</option>
            <option value="VALID">Active / Valid</option>
            <option value="EXPIRED">Expired</option>
            <option value="REVOKED">Revoked</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <LoadingSkeleton rows={5} />
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          title={
            statusFilter === 'VALID' || statusFilter === 'ACTIVE'
              ? 'No active certificates'
              : statusFilter === 'EXPIRED'
              ? 'No expired certificates'
              : statusFilter !== 'ALL'
              ? `No certificates with status: ${statusFilter}`
              : 'No verification certificates issued yet'
          }
          description={
            statusFilter === 'VALID' || statusFilter === 'ACTIVE'
              ? 'No active or valid certificates found. Certificates are digitally generated once your instrument successfully completes statutory field verification.'
              : statusFilter === 'EXPIRED'
              ? 'None of your verification certificates are currently expired.'
              : 'Certificates are digitally generated once your instrument successfully completes statutory field verification by a Legal Metrology officer.'
          }
          actionText={statusFilter !== 'ALL' ? 'View All Certificates' : 'View Applications'}
          onAction={() => {
            if (statusFilter !== 'ALL') {
              handleStatusChange('ALL');
            } else {
              navigate('/applicant/applications');
            }
          }}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Certificate Number</th>
                    <th className="px-4 py-3">Instrument Details</th>
                    <th className="px-4 py-3">Issue Date</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3">Issuing Officer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {certificates.map((cert) => {
                    const status = cert.dynamicStatus || cert.certificateStatus || cert.status || 'VALID';
                    const officerName = cert.verifiedByOfficer?.name || (cert as any).issuingOfficer || 'Legal Metrology Officer';

                    return (
                      <tr key={cert._id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-[#123B6D] text-xs">
                            <QrCode className="w-4 h-4 text-slate-500 shrink-0" />
                            <span>{cert.certificateNumber}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {cert.qrVerificationToken ? `Token: ${cert.qrVerificationToken.slice(0, 14)}...` : 'Digitally Signed'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {cert.instrument?.instrumentName || cert.instrument?.category || 'Commercial Instrument'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            SN: {cert.instrument?.serialNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(cert.validFrom).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <Calendar className="w-3.5 h-3.5 text-[#FF9933]" />
                            <span>{new Date(cert.validUntil).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <UserCheck className="w-3.5 h-3.5 text-[#123B6D]" />
                            <span>{officerName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingCert(cert)}
                              className="p-1.5 text-slate-600 hover:text-[#123B6D] hover:bg-slate-100 rounded-lg transition"
                              title="View Certificate"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              disabled={downloadingId === cert._id}
                              onClick={() => handleDownload(cert)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#123B6D] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition disabled:opacity-50"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{downloadingId === cert._id ? 'Downloading...' : 'PDF'}</span>
                            </button>

                            <Link
                              to={`/verify-certificate?cert=${encodeURIComponent(cert.certificateNumber)}`}
                              className="p-1.5 text-slate-400 hover:text-[#123B6D] hover:bg-slate-100 rounded-lg transition"
                              title="Public Verification Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
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

          {/* Mobile Certificate Cards */}
          <div className="lg:hidden space-y-3">
            {certificates.map((cert) => {
              const status = cert.dynamicStatus || cert.certificateStatus || cert.status || 'VALID';
              const officerName = cert.verifiedByOfficer?.name || (cert as any).issuingOfficer || 'Legal Metrology Officer';

              return (
                <div
                  key={cert._id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-[#123B6D] text-xs">
                        <QrCode className="w-4 h-4 text-slate-500" />
                        <span>{cert.certificateNumber}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1">
                        {cert.instrument?.instrumentName || cert.instrument?.category}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        SN: {cert.instrument?.serialNumber || 'N/A'}
                      </p>
                    </div>
                    <StatusBadge status={status} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Valid From</span>
                      <span>{new Date(cert.validFrom).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Valid Until</span>
                      <span className="font-bold text-slate-900">{new Date(cert.validUntil).toLocaleDateString()}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Issuing Officer</span>
                      <span className="text-slate-800">{officerName}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setViewingCert(cert)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      View Certificate
                    </button>

                    <button
                      type="button"
                      disabled={downloadingId === cert._id}
                      onClick={() => handleDownload(cert)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadingId === cert._id ? 'Downloading...' : 'Download PDF'}</span>
                    </button>
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

      {/* View Certificate Modal */}
      {viewingCert && (
        <Modal
          isOpen={Boolean(viewingCert)}
          onClose={() => setViewingCert(null)}
          title="Official Legal Metrology Certificate"
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Certificate Header Banner */}
            <div className="bg-[#123B6D] text-white p-4 rounded-xl space-y-1 text-center">
              <p className="text-[10px] tracking-widest uppercase font-bold text-amber-300">
                Government of India • Department of Consumer Affairs
              </p>
              <h2 className="text-base font-black">Certificate of Verification</h2>
              <p className="text-[11px] text-slate-200">
                Issued under Section 24 of the Legal Metrology Act, 2009
              </p>
            </div>

            {/* Certificate Core Info */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Certificate Number</span>
                  <p className="font-mono font-black text-sm text-[#123B6D]">{viewingCert.certificateNumber}</p>
                </div>
                <StatusBadge status={viewingCert.dynamicStatus || viewingCert.certificateStatus || viewingCert.status || 'VALID'} size="md" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Instrument</span>
                  <p className="font-semibold text-slate-900">
                    {viewingCert.instrument?.instrumentName || viewingCert.instrument?.category}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    SN: {viewingCert.instrument?.serialNumber}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Manufacturer & Model</span>
                  <p className="font-semibold text-slate-900">{viewingCert.instrument?.manufacturer || 'N/A'}</p>
                  <p className="text-slate-500 text-[11px]">Model: {viewingCert.instrument?.modelNumber || 'N/A'}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Verification Period</span>
                  <p className="font-semibold text-slate-900">
                    {new Date(viewingCert.validFrom).toLocaleDateString()} to {new Date(viewingCert.validUntil).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Issuing Officer</span>
                  <p className="font-semibold text-slate-900">
                    {viewingCert.verifiedByOfficer?.name || (viewingCert as any).issuingOfficer || 'Legal Metrology Officer'}
                  </p>
                </div>
              </div>

              {/* QR Verification Token */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Public Verification Token</span>
                  <p className="font-mono text-[11px] text-slate-700 break-all">
                    {viewingCert.qrVerificationToken || 'DOCA-LM-VERIFIED-CERT-TOKEN'}
                  </p>
                </div>
                <QrCode className="w-8 h-8 text-[#123B6D] shrink-0 ml-2" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Link
                to={`/verify-certificate?cert=${encodeURIComponent(viewingCert.certificateNumber)}`}
                className="text-xs font-bold text-[#123B6D] hover:underline flex items-center gap-1"
              >
                <span>Open Public Verification Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewingCert(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={downloadingId === viewingCert._id}
                  onClick={() => handleDownload(viewingCert)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition disabled:opacity-50 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingId === viewingCert._id ? 'Downloading...' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
