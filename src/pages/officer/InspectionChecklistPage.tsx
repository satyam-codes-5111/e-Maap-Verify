import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { inspectionApi } from '../../services/inspectionApi';
import { InspectionItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { OfficerQrScannerModal } from '../../components/officer/OfficerQrScannerModal';
import {
  ClipboardCheck,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  ArrowRight,
  Camera,
  Scale,
  QrCode,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';

export const InspectionChecklistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<InspectionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // QR Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [lastAutoPopulatedTime, setLastAutoPopulatedTime] = useState<string | null>(null);
  const [scannedSummary, setScannedSummary] = useState<{
    instrumentId?: string;
    serialNumber?: string;
    accuracyClass?: string;
    capacity?: string;
  } | null>(null);

  // Checklist items
  const [checklist, setChecklist] = useState({
    visualInspectionPassed: true,
    levelingBubbleCentered: true,
    sealIntact: true,
    environmentalSuitability: true,
    nameplateLegible: true,
    zeroTrackingFunctional: true,
  });

  // Accuracy test readings
  const [readings, setReadings] = useState<
    Array<{
      loadPoint: number;
      nominalLoad: number;
      observedReading: number;
      errorValue: number;
      mpeAllowed: number;
      passed: boolean;
    }>
  >([]);

  // Form input for adding test reading
  const [nominalInput, setNominalInput] = useState('10.0');
  const [observedInput, setObservedInput] = useState('10.0');

  const fetchInspection = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await inspectionApi.getInspectionById(id);
      if (res.success && res.data) {
        setInspection(res.data);
        if (res.data.checklist) {
          setChecklist((prev) => ({ ...prev, ...res.data.checklist }));
        }
        if (res.data.testReadings && res.data.testReadings.length > 0) {
          setReadings(
            (res.data.testReadings as any[]).map((r: any, idx: number) => ({
              loadPoint: r.loadPoint ?? (idx + 1),
              nominalLoad: r.nominalLoad ?? r.nominalValue ?? 0,
              observedReading: r.observedReading ?? r.observedValue ?? 0,
              errorValue: r.errorValue ?? r.error ?? 0,
              mpeAllowed: r.mpeAllowed ?? r.maximumPermissibleError ?? 0,
              passed: r.passed ?? r.isWithinMpe ?? true,
            }))
          );
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

  useEffect(() => {
    fetchInspection();
  }, [id]);

  // Handle auto-populating checklist fields from scanned code via backend hook
  const handleAutoPopulateFromCode = async (code: string) => {
    if (!id || !code.trim()) return;
    setIsAutoPopulating(true);
    try {
      const res = await inspectionApi.autoPopulateFromScan(id, code.trim());
      if (res.success && res.data) {
        const payload = res.data;
        if (payload.checklist) {
          setChecklist((prev) => ({ ...prev, ...payload.checklist }));
        }
        if (payload.testReadings && Array.isArray(payload.testReadings)) {
          setReadings(
            payload.testReadings.map((r: any, idx: number) => ({
              loadPoint: r.loadPoint ?? (idx + 1),
              nominalLoad: r.nominalLoad ?? r.standardValue ?? 0,
              observedReading: r.observedReading ?? r.observedValue ?? 0,
              errorValue: r.errorValue ?? r.deviation ?? 0,
              mpeAllowed: r.mpeAllowed ?? r.tolerance ?? 0.005,
              passed: r.passed ?? r.result === 'PASS' ?? true,
            }))
          );
        }
        if (payload.instrument) {
          setScannedSummary({
            instrumentId: payload.instrument.instrumentId,
            serialNumber: payload.instrument.serialNumber,
            accuracyClass: payload.instrument.accuracyClass,
            capacity:
              typeof payload.instrument.capacity === 'object'
                ? `${payload.instrument.capacity.value} ${payload.instrument.capacity.unit || 'kg'}`
                : String(payload.instrument.capacity || ''),
          });
        }
        setLastAutoPopulatedTime(new Date().toLocaleTimeString());
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Checklist Auto-Populated',
          message: `Statutory checklist and test points auto-populated from scanned QR for ${
            payload.instrument?.instrumentId || code
          }.`,
        });
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Auto-Populate Failed',
        message: getErrorMessage(err),
      });
    } finally {
      setIsAutoPopulating(false);
      setIsScannerOpen(false);
    }
  };

  // If page was navigated with ?scannedCode=... or ?instrumentId=..., trigger auto-populate automatically
  useEffect(() => {
    const codeParam = searchParams.get('scannedCode') || searchParams.get('instrumentId');
    if (codeParam && id && !loading) {
      handleAutoPopulateFromCode(codeParam);
    }
  }, [id, searchParams, loading]);

  const handleAddReading = () => {
    const nom = parseFloat(nominalInput);
    const obs = parseFloat(observedInput);
    if (isNaN(nom) || isNaN(obs)) return;

    const errVal = parseFloat((obs - nom).toFixed(4));
    // Default standard MPE for typical scale interval
    const mpe = 0.005;
    const pass = Math.abs(errVal) <= mpe;

    setReadings((prev) => [
      ...prev,
      {
        loadPoint: prev.length + 1,
        nominalLoad: nom,
        observedReading: obs,
        errorValue: errVal,
        mpeAllowed: mpe,
        passed: pass,
      },
    ]);
  };

  const handleRemoveReading = (idx: number) => {
    setReadings((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await inspectionApi.updateInspection(id, {
        checklist,
        testReadings: readings,
      });
      if (res.success) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Saved Successfully',
          message: 'Technical checklist and accuracy readings recorded.',
        });
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Save Error',
        message: getErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader title="Loading Inspection..." />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (error || !inspection) {
    return <ErrorState message={error || 'Not found'} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title={`Inspection: ${inspection.inspectionNumber || inspection.reportNumber || 'In-Progress File'}`}
        description="Step 1: Statutory visual checklist & standard accuracy load tests"
        breadcrumbs={[
          { label: 'Dashboard', href: '/officer/dashboard' },
          { label: 'Inspections', href: '/officer/inspections' },
          { label: 'Checklist & Accuracy' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              disabled={isAutoPopulating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition shadow-xs"
              title="Scan instrument QR code or data plate to auto-populate checklist fields"
            >
              {isAutoPopulating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF9933]" />
              ) : (
                <QrCode className="w-3.5 h-3.5 text-[#FF9933]" />
              )}
              <span>{isAutoPopulating ? 'Auto-Populating...' : 'Scan QR Auto-Fill'}</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>
            <Link
              to={`/officer/inspections/${id}/evidence`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs"
            >
              <span>Next: Evidence & Photos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {/* Step Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <span className="text-teal-800 border-b-2 border-teal-800 pb-2 px-1">
          1. Checklist & Testing
        </span>
        <Link
          to={`/officer/inspections/${id}/evidence`}
          className="text-slate-500 hover:text-slate-800 px-2 pb-2"
        >
          2. Photographic Evidence
        </Link>
        <Link
          to={`/officer/inspections/${id}/result`}
          className="text-slate-500 hover:text-slate-800 px-2 pb-2"
        >
          3. Final Verdict & Seal
        </Link>
      </div>

      {/* QR Auto-Populate Smart Banner */}
      <div className="bg-gradient-to-r from-blue-900/5 via-indigo-900/5 to-emerald-900/5 border border-blue-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#123B6D] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#FF9933]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Field QR Code Auto-Populate Hook</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                Rule 2011 MPE Standard
              </span>
            </div>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Scan the physical instrument QR code or verification sticker to automatically populate statutory checks and 6 standard load points (Zero, Min, 500e, 0.5 Max, Max, Eccentricity).
              {lastAutoPopulatedTime && (
                <span className="ml-2 font-medium text-emerald-700">
                  (Auto-populated at {lastAutoPopulatedTime})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            disabled={isAutoPopulating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-[#FF9933]" />
            <span>{isAutoPopulating ? 'Fetching...' : 'Scan QR Now'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleAutoPopulateFromCode('INST-PH8-001')}
            disabled={isAutoPopulating}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition"
            title="Auto-populate using demo instrument ID"
          >
            <span>Demo INST-PH8-001</span>
          </button>
        </div>
      </div>

      {/* Instrument Overview */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-slate-500">Instrument: </span>
          <span className="font-bold text-slate-800">
            {inspection.instrument?.instrumentName || inspection.instrument?.category}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Model: </span>
          <span className="font-medium text-slate-800">{inspection.instrument?.modelNumber}</span>
        </div>
        <div>
          <span className="text-slate-500">Serial No: </span>
          <span className="font-mono font-bold text-slate-800">{inspection.instrument?.serialNumber}</span>
        </div>
        <div>
          <span className="text-slate-500">Accuracy Class: </span>
          <span className="font-semibold text-teal-800">
            {inspection.instrument?.accuracyClass || 'Class III'}
          </span>
        </div>
      </div>

      {/* Part 1: Visual & Environmental Statutory Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ClipboardCheck className="w-4 h-4 text-teal-700" />
          <h2 className="text-sm font-bold text-slate-900">
            Statutory Physical & Visual Checklist
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {[
            {
              key: 'visualInspectionPassed',
              title: 'Visual Physical Integrity',
              desc: 'Free from structural damage, corrosion, or physical tampering',
            },
            {
              key: 'levelingBubbleCentered',
              title: 'Leveling Device & Bubble',
              desc: 'Bubble indicator is perfectly centered on stable horizontal plane',
            },
            {
              key: 'sealIntact',
              title: 'Previous Security Seal Intact',
              desc: 'Lead-wire or holographic verification seal verified and untampered',
            },
            {
              key: 'environmentalSuitability',
              title: 'Environmental Operating Conditions',
              desc: 'Lighting, air draughts, and vibrations within permissible limits',
            },
            {
              key: 'nameplateLegible',
              title: 'Statutory Nameplate & Markings',
              desc: 'Model approval number, serial number, and class clearly stamped',
            },
            {
              key: 'zeroTrackingFunctional',
              title: 'Zero-Setting & Tracking Mechanism',
              desc: 'Returns accurately to stable center-of-zero within ±0.25e',
            },
          ].map((item) => {
            const isChecked = (checklist as any)[item.key];
            return (
              <label
                key={item.key}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                  isChecked
                    ? 'bg-teal-50/40 border-teal-200'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) =>
                    setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="mt-0.5 rounded text-teal-800 focus:ring-teal-700"
                />
                <div>
                  <span className="font-bold text-slate-800 block">{item.title}</span>
                  <span className="text-[11px] text-slate-500 block leading-snug">{item.desc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Part 2: Calibration Accuracy Test Readings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Scale className="w-4 h-4 text-teal-700" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Calibration & Maximum Permissible Error (MPE) Readings
            </h2>
            <p className="text-xs text-slate-500">
              Record test standard weights applied and scale output readings
            </p>
          </div>
        </div>

        {/* Input row */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-end gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Nominal Test Load (kg)
            </label>
            <input
              type="number"
              step="any"
              value={nominalInput}
              onChange={(e) => setNominalInput(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-28"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Observed Reading (kg)
            </label>
            <input
              type="number"
              step="any"
              value={observedInput}
              onChange={(e) => setObservedInput(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-28"
            />
          </div>

          <button
            type="button"
            onClick={handleAddReading}
            className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg transition text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Test Reading</span>
          </button>
        </div>

        {/* Table of readings */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-700 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Point</th>
                <th className="py-2.5 px-3">Nominal Load</th>
                <th className="py-2.5 px-3">Observed Reading</th>
                <th className="py-2.5 px-3">Calculated Error</th>
                <th className="py-2.5 px-3">MPE Limit</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {readings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                    No accuracy readings recorded yet. Apply working standard weights and click "Add Test Reading" above.
                  </td>
                </tr>
              ) : (
                readings.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">#{r.loadPoint || i + 1}</td>
                  <td className="py-2.5 px-3 font-mono">{r.nominalLoad} kg</td>
                  <td className="py-2.5 px-3 font-mono">{r.observedReading} kg</td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className={r.errorValue !== 0 ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                      {r.errorValue > 0 ? `+${r.errorValue}` : r.errorValue} kg
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">±{r.mpeAllowed} kg</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{r.passed ? 'PASS' : 'FAIL'}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveReading(i)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      <OfficerQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleAutoPopulateFromCode}
        isLoading={isAutoPopulating}
      />
    </div>
  );
};
