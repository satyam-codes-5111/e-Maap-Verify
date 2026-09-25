import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../services/dashboardApi';
import { instrumentApi } from '../../services/instrumentApi';
import { getErrorMessage } from '../../services/api';
import { parseQrCertificateToken } from '../../hooks/useNativeBarcode';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { OfficerQrScannerModal } from '../../components/officer/OfficerQrScannerModal';
import { ScannedInstrumentDetailModal } from '../../components/officer/ScannedInstrumentDetailModal';
import { FieldVerificationOfficerDashboard } from '../../components/officer/FieldVerificationOfficerDashboard';
import { GatcOfficerDashboard } from '../../components/officer/GatcOfficerDashboard';
import { LmoOfficerDashboard } from '../../components/officer/LmoOfficerDashboard';
import { InstrumentScanLookupResult, UserRole } from '../../types';
import {
  ShieldCheck,
  Scale,
  RefreshCw,
  QrCode,
  CalendarDays,
  FileCheck2,
  Cpu,
  Building2,
  MapPin,
  HelpCircle,
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Role resolution: query param takes precedence (for testing/multi-role viewing), then user's authenticated role
  const queryRole = searchParams.get('role') as UserRole | null;
  const initialRole: UserRole =
    queryRole && ['FIELD_VERIFICATION_OFFICER', 'GATC_OFFICER', 'LEGAL_METROLOGY_OFFICER'].includes(queryRole)
      ? queryRole
      : user?.role === 'GATC_OFFICER'
      ? 'GATC_OFFICER'
      : user?.role === 'LEGAL_METROLOGY_OFFICER'
      ? 'LEGAL_METROLOGY_OFFICER'
      : 'FIELD_VERIFICATION_OFFICER';

  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Field QR Scanner states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [scannedResult, setScannedResult] = useState<InstrumentScanLookupResult | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [recentScans, setRecentScans] = useState<Array<{ id: string; label: string; date: string }>>([]);

  // Sync activeRole if URL search query changes
  useEffect(() => {
    if (queryRole && ['FIELD_VERIFICATION_OFFICER', 'GATC_OFFICER', 'LEGAL_METROLOGY_OFFICER'].includes(queryRole)) {
      setActiveRole(queryRole);
    }
  }, [queryRole]);

  const handleRoleSelect = (role: UserRole) => {
    setActiveRole(role);
    const next = new URLSearchParams(searchParams);
    next.set('role', role);
    setSearchParams(next);
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getOfficerDashboard();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load officer dashboard');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Load recent scans from localStorage
    try {
      const saved = localStorage.getItem('officer_recent_scans');
      if (saved) {
        setRecentScans(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save to recent scans history
  const saveToRecentScans = (id: string, label: string) => {
    try {
      const updated = [
        { id, label, date: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
        ...recentScans.filter((s) => s.id !== id),
      ].slice(0, 5);
      setRecentScans(updated);
      localStorage.setItem('officer_recent_scans', JSON.stringify(updated));
    } catch {}
  };

  // Perform lookup on scanned code or manual text
  const handlePerformLookup = async (rawCode: string) => {
    const token = parseQrCertificateToken(rawCode);
    if (!token) return;

    setIsScannerOpen(false);
    setIsFetchingDetails(true);

    try {
      const res = await instrumentApi.lookupByScan(token);
      if (res && res.data) {
        setScannedResult(res.data);
        setIsDetailModalOpen(true);

        if (res.data.found && res.data.instrument) {
          const instLabel =
            res.data.instrument.instrumentId ||
            res.data.instrument.serialNumber ||
            token;
          saveToRecentScans(token, instLabel);
        }
      } else {
        setScannedResult({
          found: false,
          query: token,
          message: 'No response from Legal Metrology Central Registry.',
        });
        setIsDetailModalOpen(true);
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setScannedResult({
        found: false,
        query: token,
        message: msg || 'Failed to connect to Legal Metrology Registry.',
      });
      setIsDetailModalOpen(true);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    handlePerformLookup(quickInput.trim());
  };

  if (loading) {
    return (
      <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-6">
        <PageHeader title="Legal Metrology Officer Command" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
          <LoadingSkeleton rows={2} />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const counts = data?.counts || data?.kpis || {};
  const todaySchedules = data?.todaySchedules || [];

  const getPageHeaderProps = () => {
    switch (activeRole) {
      case 'GATC_OFFICER':
        return {
          title: 'GATC Laboratory Officer Command',
          description: 'Precision metrology testing, NPL traceability standards, and laboratory calibration dockets',
        };
      case 'LEGAL_METROLOGY_OFFICER':
        return {
          title: 'Legal Metrology Officer (LMO) Command',
          description: 'Statutory enforcement oversight, application scrutiny, officer allotments, and market surveillance',
        };
      case 'FIELD_VERIFICATION_OFFICER':
      default:
        return {
          title: 'Field Verification Officer Command',
          description: 'On-site accuracy verification, beat schedules, physical stamping, and tamper-evident lead seals',
        };
    }
  };

  const headerInfo = getPageHeaderProps();

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-6">
      {/* Dynamic Page Header */}
      <PageHeader
        title={headerInfo.title}
        description={headerInfo.description}
        actions={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0B2F57] active:scale-95 rounded-lg transition shadow-2xs border border-[#0B2F57] min-h-[40px]"
            >
              <QrCode className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>Scan QR Seal</span>
            </button>

            <button
              type="button"
              onClick={fetchDashboard}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#172B4D] bg-white hover:bg-[#F5F8FC] border border-[#D9E2EC] rounded-lg transition shadow-2xs min-h-[40px]"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#5B6B7A]" />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* OFFICER ROLE SELECTOR TABS (Fluid Responsive Segmented Control) */}
      <div className="bg-white rounded-xl border border-[#D9E2EC] p-2.5 shadow-2xs min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172B4D] shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#07549A]" />
            <span>Select Officer Purview:</span>
          </div>

          <div className="grid grid-cols-1 sm:flex items-center gap-1.5 w-full sm:w-auto min-w-0">
            {/* 1. Field Verification Officer */}
            <button
              type="button"
              onClick={() => handleRoleSelect('FIELD_VERIFICATION_OFFICER')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap min-h-[40px] ${
                activeRole === 'FIELD_VERIFICATION_OFFICER'
                  ? 'bg-[#123B6D] text-white shadow-xs font-bold'
                  : 'bg-[#F5F8FC] text-[#5B6B7A] hover:text-[#123B6D] hover:bg-[#E8F1FA] border border-[#D9E2EC]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Field Verification Officer</span>
            </button>

            {/* 2. GATC Officer */}
            <button
              type="button"
              onClick={() => handleRoleSelect('GATC_OFFICER')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap min-h-[40px] ${
                activeRole === 'GATC_OFFICER'
                  ? 'bg-[#123B6D] text-white shadow-xs font-bold'
                  : 'bg-[#F5F8FC] text-[#5B6B7A] hover:text-[#123B6D] hover:bg-[#E8F1FA] border border-[#D9E2EC]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">GATC Lab Officer</span>
            </button>

            {/* 3. Legal Metrology Officer (LMO) */}
            <button
              type="button"
              onClick={() => handleRoleSelect('LEGAL_METROLOGY_OFFICER')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap min-h-[40px] ${
                activeRole === 'LEGAL_METROLOGY_OFFICER'
                  ? 'bg-[#123B6D] text-white shadow-xs font-bold'
                  : 'bg-[#F5F8FC] text-[#5B6B7A] hover:text-[#123B6D] hover:bg-[#E8F1FA] border border-[#D9E2EC]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Legal Metrology Officer (LMO)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading state during details lookup */}
      {isFetchingDetails && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between animate-pulse min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <RefreshCw className="w-4 h-4 text-[#123B6D] animate-spin shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#123B6D] truncate">
                Connecting to Legal Metrology Central Registry...
              </p>
              <p className="text-[11px] text-[#5B6B7A] truncate">
                Verifying digital seal, statutory MPE tolerances, and calibration history.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#5B6B7A] shrink-0 ml-2">Please wait</span>
        </div>
      )}

      {/* ACTIVE DASHBOARD COMPONENT */}
      {activeRole === 'FIELD_VERIFICATION_OFFICER' && (
        <FieldVerificationOfficerDashboard
          counts={counts}
          todaySchedules={todaySchedules}
          onOpenScanner={() => setIsScannerOpen(true)}
          onPerformLookup={handlePerformLookup}
          quickInput={quickInput}
          setQuickInput={setQuickInput}
          onQuickSubmit={handleQuickSubmit}
          isFetchingDetails={isFetchingDetails}
          recentScans={recentScans}
        />
      )}

      {activeRole === 'GATC_OFFICER' && (
        <GatcOfficerDashboard
          counts={counts}
          onOpenScanner={() => setIsScannerOpen(true)}
          onPerformLookup={handlePerformLookup}
          quickInput={quickInput}
          setQuickInput={setQuickInput}
          onQuickSubmit={handleQuickSubmit}
          isFetchingDetails={isFetchingDetails}
          recentScans={recentScans}
        />
      )}

      {activeRole === 'LEGAL_METROLOGY_OFFICER' && (
        <LmoOfficerDashboard
          counts={counts}
          onOpenScanner={() => setIsScannerOpen(true)}
          onPerformLookup={handlePerformLookup}
          quickInput={quickInput}
          setQuickInput={setQuickInput}
          onQuickSubmit={handleQuickSubmit}
          isFetchingDetails={isFetchingDetails}
          recentScans={recentScans}
        />
      )}

      {/* QR Scanner Camera Modal */}
      <OfficerQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedCode) => handlePerformLookup(scannedCode)}
        isLoading={isFetchingDetails}
      />

      {/* Scanned Instrument Details Dossier Modal */}
      <ScannedInstrumentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        scanResult={scannedResult}
        onScanAnother={() => {
          setIsDetailModalOpen(false);
          setIsScannerOpen(true);
        }}
      />
    </div>
  );
};

export default OfficerDashboard;
