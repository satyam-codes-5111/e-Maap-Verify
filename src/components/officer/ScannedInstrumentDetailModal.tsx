import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scale,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck2,
  Calendar,
  Building2,
  MapPin,
  QrCode,
  Copy,
  Check,
  Download,
  PlayCircle,
  ArrowRight,
  ShieldCheck,
  Info,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { InstrumentScanLookupResult } from '../../types';

interface ScannedInstrumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanResult: InstrumentScanLookupResult | null;
  onScanAnother: () => void;
}

export const ScannedInstrumentDetailModal: React.FC<ScannedInstrumentDetailModalProps> = ({
  isOpen,
  onClose,
  scanResult,
  onScanAnother,
}) => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);
  const [showMpeTable, setShowMpeTable] = useState(true);

  if (!isOpen || !scanResult) return null;

  const handleCopyId = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {}
  };

  // If instrument was not found
  if (!scanResult.found) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
          <div className="bg-amber-600 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
              <h3 className="font-bold text-base">Instrument Not Found</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold text-sm">Query: "{scanResult.query}"</p>
              <p className="text-amber-800 leading-relaxed">
                {scanResult.message || 'No registered instrument or active verification certificate was found in the Legal Metrology database matching this code.'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Recommended Field Officer Actions:</p>
              <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
                {scanResult.suggestedNextSteps?.map((step, idx) => (
                  <li key={idx}>{step}</li>
                )) || (
                  <>
                    <li>Inspect physical serial plate on the machine chassis.</li>
                    <li>Verify if the trader's establishment is registered in this district beat.</li>
                    <li>Issue Form VII Notice for unverified / non-stamped instrument.</li>
                  </>
                )}
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={onScanAnother}
                className="w-full py-2.5 px-4 bg-[#123B6D] hover:bg-[#0D2B4F] text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Another Code</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-4 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inst = scanResult.instrument;
  const cert = scanResult.activeCertificate;
  const stakeholder = scanResult.stakeholder || (inst as any)?.stakeholder;
  const mpe = scanResult.mpeGuidelines;
  const recentInspections = scanResult.recentInspections || [];
  const activeSchedule = scanResult.activeSchedule;

  // Format Capacity
  const formatCapacity = (cap: any) => {
    if (!cap) return 'N/A';
    if (typeof cap === 'object') {
      return `${cap.value ?? ''} ${cap.unit ?? ''}`.trim() || 'N/A';
    }
    return String(cap);
  };

  // Determine Verification Status styling
  const isExpired =
    inst?.status === 'EXPIRED' ||
    scanResult.dueStatus === 'OVERDUE' ||
    (cert?.validUntil && new Date(cert.validUntil) < new Date());

  const isDueSoon = scanResult.dueStatus === 'DUE_SOON';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header with Government Tricolor Border */}
        <div className="h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        {/* Modal Top Banner */}
        <div className="bg-[#123B6D] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#FF9933] border border-white/20 shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  {inst?.instrumentType || inst?.instrumentName || 'Legal Metrology Instrument'}
                </h3>
                {isExpired ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    STAMP EXPIRED
                  </span>
                ) : isDueSoon ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    DUE SOON
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    VERIFIED & STAMPED
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Instrument ID:{' '}
                <span className="font-mono font-bold text-[#FF9933]">
                  {inst?.instrumentId || inst?._id}
                </span>
                {scanResult.matchedBy && (
                  <span className="text-white/60 ml-2 font-normal">
                    (Matched by {scanResult.matchedBy.replace('_', ' ')})
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Action Callout Bar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Quick Field Actions:</span>
              <button
                type="button"
                onClick={() => handleCopyId(inst?.instrumentId || inst?._id || '')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-slate-700 transition"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? 'Copied ID' : 'Copy ID'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (activeSchedule) {
                    navigate(`/officer/inspections?scheduleId=${activeSchedule._id}`);
                  } else {
                    navigate(`/officer/inspections?instrumentId=${inst?._id || inst?.instrumentId}`);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#123B6D] hover:bg-[#0D2B4F] text-white font-bold rounded-lg shadow-xs transition"
              >
                <PlayCircle className="w-3.5 h-3.5 text-[#FF9933]" />
                <span>Conduct On-Site Inspection</span>
              </button>
            </div>
          </div>

          {/* Technical Specifications Grid */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#123B6D]" />
                <span>Technical Metrological Specifications</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                SN: {inst?.serialNumber || 'N/A'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Accuracy Class</span>
                <p className="font-bold text-slate-800 mt-0.5">{inst?.accuracyClass || 'Class III (Medium)'}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Max Capacity (Max)</span>
                <p className="font-bold text-slate-800 mt-0.5">{formatCapacity(inst?.capacity || (inst as any)?.maxCapacity)}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Scale Interval (e)</span>
                <p className="font-bold text-slate-800 mt-0.5">{inst?.verificationScaleInterval_e || inst?.verificationScaleInterval || '10 g'}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Min Capacity (Min)</span>
                <p className="font-bold text-slate-800 mt-0.5">{inst?.minimumCapacity_Min || (inst as any)?.minCapacity || '200 g'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
              <div>
                <span className="text-slate-400">Make / Manufacturer:</span>{' '}
                <span className="font-semibold text-slate-800">{inst?.manufacturer || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">Model Number:</span>{' '}
                <span className="font-semibold text-slate-800">{inst?.modelNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>{' '}
                <span className="font-semibold text-slate-800">{inst?.category || 'NAWI'}</span>
              </div>
            </div>
          </div>

          {/* Statutory Maximum Permissible Error (MPE) Table for Officer */}
          {mpe && (
            <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-4 shadow-xs space-y-2.5">
              <div
                onClick={() => setShowMpeTable(!showMpeTable)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#123B6D]" />
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    Statutory MPE Limits ({mpe.accuracyClass})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#123B6D]">
                  <span>{showMpeTable ? 'Collapse Limits' : 'Show Legal Tolerances'}</span>
                  {showMpeTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </div>

              {showMpeTable && (
                <div className="space-y-2 animate-in fade-in duration-150 pt-1">
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Standards under <strong>Legal Metrology (General) Rules, 2011</strong> for initial and periodic inspection:
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-blue-200 bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-blue-100/60 text-[#123B6D] font-bold">
                        <tr>
                          <th className="px-3 py-1.5">Load Range (m in e)</th>
                          <th className="px-3 py-1.5">Max Permissible Error (MPE)</th>
                          <th className="px-3 py-1.5">Inspection Application</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {mpe.tiers.map((tier, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/30">
                            <td className="px-3 py-1.5 font-mono font-medium">{tier.range}</td>
                            <td className="px-3 py-1.5 font-bold text-blue-900">{tier.tolerance}</td>
                            <td className="px-3 py-1.5 text-slate-500">{tier.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Business & Premise Location */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-[#123B6D]" />
              <span>Stakeholder & Verification Premise</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Trading Business</span>
                <span className="font-bold text-slate-800 text-sm">
                  {stakeholder?.businessName || 'Authorized Legal Metrology Stakeholder'}
                </span>
                {stakeholder?.tradeLicenseNumber && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Trade License: <span className="font-mono">{stakeholder.tradeLicenseNumber}</span>
                  </p>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Installation Premise</span>
                <p className="font-medium text-slate-700 flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    {inst?.installationAddress?.premiseName ||
                      inst?.installationAddress?.line1 ||
                      (stakeholder as any)?.registeredAddress?.line1 ||
                      'Commercial Establishment'}
                    {inst?.installationAddress?.district && `, ${inst.installationAddress.district}`}
                    {inst?.installationAddress?.state && `, ${inst.installationAddress.state}`}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Stamping Certificate & Validity */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-[#123B6D]" />
                <span>Verification Certificate & Stamping</span>
              </h4>
              {cert?.certificateNumber && (
                <span className="font-mono text-xs font-bold text-emerald-700">
                  {cert.certificateNumber}
                </span>
              )}
            </div>

            {cert ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Issued / Stamped</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {cert.verificationDate || cert.validFrom
                        ? new Date(cert.verificationDate || cert.validFrom!).toLocaleDateString('en-IN')
                        : 'Recorded'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Valid Until</span>
                    <p className={`font-semibold mt-0.5 ${isExpired ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                      {cert.validUntil ? new Date(cert.validUntil).toLocaleDateString('en-IN') : 'Ongoing'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Issuing Officer</span>
                    <p className="font-semibold text-slate-800 mt-0.5 line-clamp-1">
                      {cert.issuedByOfficer || 'Legal Metrology Inspector'}
                    </p>
                  </div>
                </div>

                {cert.tamperEvidentHash && (
                  <div className="p-2 bg-slate-50 rounded-lg text-[10px] text-slate-500 font-mono break-all flex items-center justify-between gap-2">
                    <span className="line-clamp-1">Hash: {cert.tamperEvidentHash}</span>
                    <span className="text-emerald-700 font-bold shrink-0">SHA-256 Validated</span>
                  </div>
                )}

                <div className="pt-1 flex items-center gap-2">
                  <Link
                    to={`/verify?token=${cert.certificateNumber || cert.qrToken || inst?.instrumentId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-[#123B6D] hover:underline font-bold"
                  >
                    <span>View Public Certificate Record</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-2 text-slate-500 text-xs">
                No active certificate found. This instrument may be pending initial verification or calibration.
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 sm:px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onScanAnother}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan Another Instrument</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (activeSchedule) {
                  navigate(`/officer/inspections?scheduleId=${activeSchedule._id}`);
                } else {
                  navigate(`/officer/inspections?instrumentId=${inst?._id || inst?.instrumentId}`);
                }
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#123B6D] hover:bg-[#0D2B4F] text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <PlayCircle className="w-4 h-4 text-[#FF9933]" />
              <span>Start Inspection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
