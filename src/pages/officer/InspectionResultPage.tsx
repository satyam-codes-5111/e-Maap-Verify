import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { inspectionApi } from '../../services/inspectionApi';
import { certificateApi } from '../../services/certificateApi';
import { InspectionItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Download,
  Lock,
} from 'lucide-react';

export const InspectionResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<InspectionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [verdict, setVerdict] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [sealNumber, setSealNumber] = useState('');
  const [validMonths, setValidMonths] = useState(12);
  const [remarks, setRemarks] = useState(
    'Instrument tested using certified working standard weights. Verification scale interval and accuracy verified in compliance with the Legal Metrology Act, 2009.'
  );

  // Generated certificate result
  const [createdCert, setCreatedCert] = useState<any>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!createdCert) return;
    const certId = createdCert._id || createdCert.certificateNumber;
    try {
      setDownloadingPdf(true);
      await certificateApi.downloadCertificatePdf(
        certId,
        `${createdCert.certificateNumber || 'Verification_Certificate'}.pdf`
      );
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Download Failed',
        message: getErrorMessage(err),
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    const fetchInspection = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await inspectionApi.getInspectionById(id);
        if (res.success && res.data) {
          setInspection(res.data);
          if (res.data.verdict) {
            setVerdict(res.data.verdict as any);
          }
          if (res.data.sealNumber) {
            setSealNumber(res.data.sealNumber);
          }
          if (res.data.status === 'FINALIZED' && res.data.certificate) {
            setCreatedCert(res.data.certificate);
          }
        } else {
          setError(res.message || 'Inspection file not found');
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchInspection();
  }, [id]);

  const handleFinalize = async () => {
    if (!id) return;
    if (verdict === 'VERIFIED' && !sealNumber.trim()) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Seal Number Required',
        message: 'A statutory tamper seal number is mandatory for VERIFIED instruments.',
      });
      return;
    }

    setFinalizing(true);
    try {
      const validUntilDate = new Date();
      validUntilDate.setMonth(validUntilDate.getMonth() + validMonths);

      const payload = {
        verdict,
        result: verdict,
        sealNumber: verdict === 'VERIFIED' ? sealNumber : undefined,
        remarks,
        reason: verdict === 'REJECTED' ? (rejectionReason || remarks || 'Instrument failed statutory verification test') : undefined,
        validUntil: verdict === 'VERIFIED' ? validUntilDate.toISOString() : undefined,
      };

      const res = await inspectionApi.finalizeInspection(id, payload);
      if (res.success && res.data) {
        setInspection(res.data);
        if (res.data.certificate) {
          setCreatedCert(res.data.certificate);
        }
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Inspection Finalized',
          message:
            verdict === 'VERIFIED'
              ? 'Statutory verification certificate generated with cryptographically signed QR code.'
              : 'Official inspection report filed with non-compliance verdict.',
        });
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Finalization Error',
        message: getErrorMessage(err),
      });
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader title="Loading Verdict..." />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (error || !inspection) {
    return <ErrorState message={error || 'Not found'} />;
  }

  const isFinalized = inspection.status === 'FINALIZED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title={`Inspection: ${inspection.reportNumber || 'In-Progress File'}`}
        description="Step 3: Endorsement of statutory verdict & cryptographic certificate issuance"
        badge={<StatusBadge status={inspection.status} size="md" />}
        breadcrumbs={[
          { label: 'Dashboard', href: '/officer/dashboard' },
          { label: 'Inspections', href: '/officer/inspections' },
          { label: 'Verdict & Certification' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/officer/inspections/${id}/evidence`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Evidence</span>
            </Link>
          </div>
        }
      />

      {/* Step Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <Link
          to={`/officer/inspections/${id}/checklist`}
          className="text-slate-500 hover:text-slate-800 px-2 pb-2"
        >
          1. Checklist & Testing
        </Link>
        <Link
          to={`/officer/inspections/${id}/evidence`}
          className="text-slate-500 hover:text-slate-800 px-2 pb-2"
        >
          2. Photographic Evidence
        </Link>
        <span className="text-teal-800 border-b-2 border-teal-800 pb-2 px-1">
          3. Final Verdict & Seal
        </span>
      </div>

      {/* If already finalized and certificate issued, display Certificate card */}
      {isFinalized && createdCert && (
        <div className="bg-white rounded-xl border border-emerald-300 p-6 shadow-sm space-y-4 bg-emerald-50/20">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Verification Certificate Issued
                </h2>
                <p className="text-xs text-slate-500">
                  Certificate No: <span className="font-mono font-bold text-emerald-800">{createdCert.certificateNumber || 'CERT-ACTIVE'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/verify-certificate?token=${encodeURIComponent(createdCert.qrVerificationToken || createdCert.certificateNumber)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition"
              >
                Verify QR
              </Link>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingPdf ? 'Downloading...' : 'Official PDF'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Tamper Seal Applied:</span>
              <span className="font-mono font-bold text-slate-800">{createdCert.sealNumber || inspection.sealNumber}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Valid From:</span>
              <span className="font-semibold text-slate-800">
                {createdCert.validFrom ? new Date(createdCert.validFrom).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Valid Until:</span>
              <span className="font-bold text-emerald-700">
                {createdCert.validUntil ? new Date(createdCert.validUntil).toLocaleDateString() : '12 Months'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Verdict Selection Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">
            Statutory Inspection Verdict
          </h2>
          <p className="text-xs text-slate-500">
            Select legally binding outcome under the Legal Metrology Act, 2009
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {[
              {
                value: 'VERIFIED',
                title: 'VERIFIED (STATUTORY PASS)',
                desc: 'Complies with all technical standards and MPE limits. Generate stamp & certificate.',
                icon: CheckCircle2,
                color: 'teal',
              },
              {
                value: 'REJECTED',
                title: 'REJECTED (STATUTORY NON-COMPLIANCE)',
                desc: 'Excessive calibration error, illegal tampering, or repair required.',
                icon: XCircle,
                color: 'rose',
              },
            ].map((v) => {
              const selected = verdict === v.value;
              const Icon = v.icon;
              return (
                <button
                  key={v.value}
                  type="button"
                  disabled={isFinalized}
                  onClick={() => setVerdict(v.value as any)}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                    selected
                      ? v.value === 'VERIFIED'
                        ? 'bg-teal-50 border-teal-800 ring-2 ring-teal-800/20'
                        : 'bg-rose-50 border-rose-800 ring-2 ring-rose-800/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{v.title}</span>
                    <Icon
                      className={`w-4 h-4 ${
                        selected
                          ? v.value === 'VERIFIED'
                            ? 'text-teal-800'
                            : 'text-rose-800'
                          : 'text-slate-400'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{v.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* If REJECTED: Reason */}
        {verdict === 'REJECTED' && (
          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
              <span>Statutory Grounds for Rejection / Defect Notice *</span>
            </div>
            <textarea
              rows={2}
              disabled={isFinalized}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Instrument failed Maximum Permissible Error tolerance at 50% capacity. Seal broken. Trader advised to submit repair notice."
              className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-700/20 focus:border-rose-700 transition"
            />
          </div>
        )}

        {/* If VERIFIED: Seal Number & Validity Period */}
        {verdict === 'VERIFIED' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Lock className="w-3.5 h-3.5 text-teal-700" />
              <span>Statutory Stamping & Validity Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tamper Security Seal Serial No. *
                </label>
                <input
                  type="text"
                  disabled={isFinalized}
                  value={sealNumber}
                  onChange={(e) => setSealNumber(e.target.value)}
                  placeholder="e.g. SEAL-MH-2026-99210"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Validity Duration
                </label>
                <select
                  disabled={isFinalized}
                  value={validMonths}
                  onChange={(e) => setValidMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
                >
                  <option value={12}>12 Months (1 Year Statutory)</option>
                  <option value={24}>24 Months (2 Years - Storage Tank/Weighbridge)</option>
                  <option value={60}>60 Months (5 Years - Special Metrology Mark)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Officer Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Officer Endorsement Remarks *
          </label>
          <textarea
            rows={3}
            disabled={isFinalized}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
          />
        </div>

        {/* Finalize button */}
        {!isFinalized && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleFinalize}
              disabled={finalizing}
              className="px-6 py-2.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {finalizing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Certificate...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Finalize & Issue Statutory Verdict</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
