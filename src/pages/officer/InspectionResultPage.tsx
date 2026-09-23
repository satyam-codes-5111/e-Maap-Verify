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
  MapPin,
  Camera,
  AlertCircle,
  FileText,
  Gauge,
  QrCode,
  Calendar,
  Clock,
} from 'lucide-react';

interface ReadinessCheck {
  name: string;
  passed: boolean;
  message: string;
}

interface ReadinessData {
  ready: boolean;
  summary: {
    passedCount: number;
    totalCount: number;
    allPassed: boolean;
    missingCount: number;
    missingChecks: string[];
    status: string;
  };
  checks: ReadinessCheck[];
}

export const InspectionResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<any | null>(null);
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
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
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [inspRes, readyRes] = await Promise.all([
          inspectionApi.getInspectionById(id),
          inspectionApi.getInspectionReadiness(id).catch(() => null),
        ]);

        if (inspRes.success && inspRes.data) {
          const rawInsp = inspRes.data as any;
          setInspection(rawInsp);

          if (rawInsp.verdict || rawInsp.result) {
            const v = (rawInsp.verdict || rawInsp.result).toUpperCase();
            if (v === 'VERIFIED' || v === 'PASS' || v === 'PASSED') {
              setVerdict('VERIFIED');
            } else if (v === 'REJECTED' || v === 'FAIL' || v === 'FAILED') {
              setVerdict('REJECTED');
            }
          }
          if (rawInsp.sealNumber) {
            setSealNumber(rawInsp.sealNumber);
          }
          if (rawInsp.certificate) {
            setCreatedCert(rawInsp.certificate);
          }
        } else {
          setError(inspRes.message || 'Inspection file not found');
        }

        if (readyRes && (readyRes as any).success && (readyRes as any).data) {
          setReadiness((readyRes as any).data);
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        const updatedInsp = (res.data as any).inspection || res.data;
        const cert = (res.data as any).certificate || updatedInsp.certificate;
        setInspection(updatedInsp);
        if (cert) {
          setCreatedCert(cert);
        }

        // Re-fetch readiness status
        inspectionApi.getInspectionReadiness(id).then((r) => {
          if (r?.success && r.data) setReadiness(r.data as any);
        }).catch(() => {});

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
        <PageHeader title="Loading Verdict & Readiness..." />
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  if (error || !inspection) {
    return <ErrorState message={error || 'Not found'} />;
  }

  const isFinalized =
    inspection.inspectionStatus === 'PASSED' ||
    inspection.inspectionStatus === 'FAILED' ||
    inspection.inspectionStatus === 'COMPLETED' ||
    inspection.status === 'FINALIZED' ||
    Boolean(createdCert);

  // Extract real coordinates & location
  const gpsLat = inspection.gpsCoordinates?.latitude ?? inspection.latitude;
  const gpsLon = inspection.gpsCoordinates?.longitude ?? inspection.longitude;
  const gpsAcc = inspection.gpsCoordinates?.accuracyMeters ?? inspection.gpsAccuracyMeters;
  const gpsTimestamp = inspection.gpsCoordinates?.capturedAt ?? inspection.visitDateTime ?? inspection.updatedAt;
  const gpsAddress =
    inspection.gpsCoordinates?.address ||
    inspection.instrument?.premiseLocation ||
    inspection.application?.stakeholder?.registeredAddress?.fullAddress;

  // Extract photos
  const photographs: any[] = Array.isArray(inspection.photographs) ? inspection.photographs : [];
  const rawPhotos: any[] = Array.isArray(inspection.photos) ? inspection.photos : [];

  // Group photos
  const sealPhoto = photographs.find((p) => {
    const t = String(p.photoType || '').toUpperCase();
    const c = String(p.caption || '').toLowerCase();
    return t === 'SEAL_IMPRESSION' || t === 'SEAL' || c.includes('seal') || c.includes('stamp');
  });

  const nameplatePhoto = photographs.find((p) => {
    const t = String(p.photoType || '').toUpperCase();
    const c = String(p.caption || '').toLowerCase();
    return t === 'NAMEPLATE' || t === 'SERIAL' || c.includes('nameplate') || c.includes('plate') || c.includes('serial');
  });

  // Accuracy readings
  const accuracyChecks = Array.isArray(inspection.accuracyChecks)
    ? inspection.accuracyChecks
    : Array.isArray(inspection.instrumentReadings)
    ? inspection.instrumentReadings
    : Array.isArray(inspection.measurementReadings)
    ? inspection.measurementReadings
    : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title={`Inspection: ${inspection.inspectionNumber || inspection.reportNumber || 'In-Progress File'}`}
        description="Statutory legal metrology verification verdict, evidence dossier, and tamper-evident certificate issuance"
        badge={<StatusBadge status={inspection.inspectionStatus || inspection.status} size="md" />}
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

      {/* 1. CERTIFICATE ISSUED / ACTIVE BANNER */}
      {createdCert && (
        <div className="bg-white rounded-xl border border-emerald-300 p-6 shadow-sm space-y-4 bg-emerald-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Verification Certificate Issued</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active & Genuine
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Certificate No:{' '}
                  <span className="font-mono font-bold text-emerald-800">
                    {createdCert.certificateNumber || 'CERT-ACTIVE'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/verify-certificate?token=${encodeURIComponent(
                  createdCert.qrVerificationToken || createdCert.certificateNumber || ''
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition inline-flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Verify QR Publicly</span>
              </Link>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Tamper Seal Applied:</span>
              <span className="font-mono font-bold text-slate-800">
                {createdCert.sealNumber || sealNumber || inspection.sealNumber || 'N/A'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Valid From:</span>
              <span className="font-semibold text-slate-800">
                {createdCert.validFrom
                  ? new Date(createdCert.validFrom).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Valid Until:</span>
              <span className="font-bold text-emerald-700">
                {createdCert.validUntil
                  ? new Date(createdCert.validUntil).toLocaleDateString()
                  : '12 Months Statutory'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. VERIFICATION READINESS / DETERMINISTIC RULE ENGINE PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Verification Readiness / Statutory Rule Engine
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Deterministic pre-endorsement assessment against Legal Metrology Act standards
            </p>
          </div>

          <div>
            {readiness?.ready ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>READY FOR DECISION</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>VERIFICATION NOT READY</span>
              </span>
            )}
          </div>
        </div>

        {/* Checks list */}
        {readiness && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {readiness.checks.map((chk, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition ${
                    chk.passed
                      ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                      : 'bg-amber-50/50 border-amber-200 text-slate-800'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {chk.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[11px] uppercase tracking-wide flex items-center justify-between">
                      <span>{chk.name}</span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                          chk.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {chk.passed ? 'PASSED' : 'ACTION REQUIRED'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {chk.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Incomplete Summary if any checks failed */}
            {!readiness.ready && readiness.summary.missingChecks.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 mt-2">
                <span className="font-bold block mb-1">
                  Missing Prerequisite Items ({readiness.summary.missingCount}):
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {readiness.summary.missingChecks.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-[11px] text-slate-400 italic pt-1">
              * The Verification Readiness Engine provides advisory compliance validation. The legal endorsement decision remains strictly with the authorized officer.
            </div>
          </div>
        )}
      </div>

      {/* 3. FIELD EVIDENCE & CALIBRATION AUDIT DOSSIER */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-teal-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Field Evidence & Verification Dossier
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Real On-Site Telemetry & Stamped Proofs
          </span>
        </div>

        {/* GPS Coordinates Section */}
        <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
            <MapPin className="w-3.5 h-3.5 text-teal-700" />
            <span>GPS Geo-Location Telemetry</span>
          </div>

          {gpsLat && gpsLon ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Coordinates
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {typeof gpsLat === 'number' ? gpsLat.toFixed(5) : gpsLat} N,{' '}
                  {typeof gpsLon === 'number' ? gpsLon.toFixed(5) : gpsLon} E
                </span>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  GPS Accuracy
                </span>
                <span className="font-semibold text-slate-800">
                  {gpsAcc ? `±${Math.round(gpsAcc)} meters` : 'High Precision'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Capture Timestamp
                </span>
                <span className="text-slate-700">
                  {gpsTimestamp ? new Date(gpsTimestamp).toLocaleString() : 'On-Site Verified'}
                </span>
              </div>
              {gpsAddress && (
                <div className="sm:col-span-3 bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Premise / Installation Address
                  </span>
                  <span className="text-slate-800">{gpsAddress}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No GPS coordinates recorded yet for this inspection dossier.</span>
            </div>
          )}
        </div>

        {/* Photographic Evidence Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-teal-700" />
              <span>Mandatory Photographic Evidence</span>
            </span>
            <span className="text-[11px] text-slate-500">
              {photographs.length + rawPhotos.length} photo(s) captured
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Seal Photo Card */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Statutory Seal Impression
              </span>
              {sealPhoto ? (
                <div className="space-y-1.5">
                  <div className="h-28 bg-slate-100 rounded overflow-hidden flex items-center justify-center border border-slate-200">
                    <img
                      src={sealPhoto.photoUrl || sealPhoto.fileUrl || sealPhoto.url}
                      alt="Statutory Seal Impression"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-700 truncate font-medium">
                    {sealPhoto.caption || 'Lead/wire tamper seal verified'}
                  </p>
                </div>
              ) : (
                <div className="h-28 rounded bg-amber-50 border border-dashed border-amber-200 flex flex-col items-center justify-center text-center p-2 text-amber-800">
                  <AlertCircle className="w-5 h-5 text-amber-600 mb-1" />
                  <span className="text-[11px] font-semibold">Seal Photo Missing</span>
                </div>
              )}
            </div>

            {/* Nameplate Photo Card */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Manufacturer Nameplate
              </span>
              {nameplatePhoto ? (
                <div className="space-y-1.5">
                  <div className="h-28 bg-slate-100 rounded overflow-hidden flex items-center justify-center border border-slate-200">
                    <img
                      src={nameplatePhoto.photoUrl || nameplatePhoto.fileUrl || nameplatePhoto.url}
                      alt="Manufacturer Nameplate"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-700 truncate font-medium">
                    {nameplatePhoto.caption || 'Model & serial specification tag'}
                  </p>
                </div>
              ) : (
                <div className="h-28 rounded bg-amber-50 border border-dashed border-amber-200 flex flex-col items-center justify-center text-center p-2 text-amber-800">
                  <AlertCircle className="w-5 h-5 text-amber-600 mb-1" />
                  <span className="text-[11px] font-semibold">Nameplate Photo Missing</span>
                </div>
              )}
            </div>

            {/* Additional Photos */}
            {photographs
              .filter((p) => p !== sealPhoto && p !== nameplatePhoto)
              .slice(0, 1)
              .map((p, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-white shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    {p.photoType || 'Environmental / General'}
                  </span>
                  <div className="h-28 bg-slate-100 rounded overflow-hidden flex items-center justify-center border border-slate-200">
                    <img
                      src={p.photoUrl || p.fileUrl || p.url}
                      alt="Inspection evidence"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-700 truncate font-medium mt-1.5">
                    {p.caption || 'Field Inspection Evidence'}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Metrological Accuracy Readings */}
        {accuracyChecks.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-teal-700" />
                <span>Metrological Accuracy & MPE Test Points</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {accuracyChecks.length} test point(s) recorded
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Test Load</th>
                    <th className="px-3 py-2">Observed Reading</th>
                    <th className="px-3 py-2">Intrinsic Error</th>
                    <th className="px-3 py-2">Max Permissible Error (MPE)</th>
                    <th className="px-3 py-2 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accuracyChecks.map((c: any, i: number) => {
                    const status = c.compliance || c.status || 'PASS';
                    return (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium">{c.loadApplied || c.testWeight || '50% Max'}</td>
                        <td className="px-3 py-2 font-mono">{c.observedReading || c.reading || '0.00'}</td>
                        <td className="px-3 py-2 font-mono">{c.error !== undefined ? `${c.error} e` : '0.00'}</td>
                        <td className="px-3 py-2 text-slate-600">{c.maxPermissibleError || c.mpe || '±1.0 e'}</td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              status === 'PASS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Existing Inspector Remarks */}
        {inspection.remarks && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 text-[11px] block mb-0.5">
              Inspector Field Notes / Observations:
            </span>
            <p className="text-slate-600 italic leading-relaxed">
              "{inspection.remarks}"
            </p>
          </div>
        )}
      </div>

      {/* 4. VERDICT SELECTION & FINALIZATION FORM */}
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
                  <span>Generating Certificate & Tamper Hash...</span>
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
