import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { applicationApi } from '../../services/applicationApi';
import { certificateApi } from '../../services/certificateApi';
import { VerificationApplicationItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { FileUploader } from '../../components/common/FileUploader';
import { Modal } from '../../components/common/Modal';
import { formatInstrumentCapacity } from '../../utils/formatters';
import {
  FileCheck2,
  Calendar,
  Scale,
  User,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
  CheckCircle2,
  Download,
  Building2,
  ShieldCheck,
  PhoneCall,
  FileText,
  Award,
  ExternalLink,
  DollarSign,
  QrCode,
  Info,
} from 'lucide-react';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [app, setApp] = useState<VerificationApplicationItem | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Document upload modal
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Helpline modal
  const [helplineModalOpen, setHelplineModalOpen] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [appRes, historyRes] = await Promise.all([
        applicationApi.getApplicationById(id),
        applicationApi.getApplicationHistory(id).catch(() => ({ success: false, data: [] })),
      ]);

      if (appRes.success && appRes.data) {
        setApp(appRes.data);
      } else {
        setError(appRes.message || 'Application not found');
      }

      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data.history || historyRes.data || []);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Handle document upload
  const handleUploadDocument = async () => {
    if (!id || !selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      const res = await applicationApi.uploadDocument(id, formData);
      if (res.success) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Document Uploaded',
          message: 'Supporting document successfully attached to application.',
        });
        setDocModalOpen(false);
        setSelectedFile(null);
        fetchDetails();
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Upload Failed',
        message: getErrorMessage(err),
      });
    } finally {
      setUploading(false);
    }
  };

  // Download Acknowledgement Slip (printable HTML/Text blob)
  const handleDownloadAcknowledgement = () => {
    if (!app) return;
    const content = `GOVERNMENT OF INDIA
DEPARTMENT OF CONSUMER AFFAIRS
LEGAL METROLOGY DIVISION
=====================================================
STATUTORY ACKNOWLEDGEMENT RECEIPT
=====================================================
Application Number: ${app.applicationNumber}
Filing Date: ${new Date(app.createdAt).toLocaleString()}
Status: ${app.currentStatus || app.status}
Purpose: ${app.purpose || 'Verification'}

APPLICANT / COMMERCIAL ESTABLISHMENT:
Name: ${app.stakeholder?.businessName || user?.name || 'Registered Establishment'}
Premises: ${app.instrument?.installationAddress?.premiseName || 'Registered Premises'}
Address: ${app.instrument?.installationAddress?.addressLine || 'N/A'}, ${app.instrument?.installationAddress?.city || ''}

INSTRUMENT DETAILS:
Instrument: ${app.instrument?.instrumentName || app.instrument?.category}
Category: ${app.instrument?.category}
Manufacturer: ${app.instrument?.manufacturer || 'N/A'}
Model Number: ${app.instrument?.modelNumber || 'N/A'}
Serial Number: ${app.instrument?.serialNumber || 'N/A'}
Capacity: ${formatInstrumentCapacity(app.instrument?.capacity, app.instrument?.unit, app.instrument?.maxCapacity)}

FEE PARTICULARS:
Fee Status: ${app.feeDetails?.feeStatus || 'PAID'}
Amount: INR ${app.feeDetails?.amount || 'Statutory Fee Prescribed'}

=====================================================
This is a computer-generated statutory acknowledgement under
the Legal Metrology (Enforcement) Rules, 2011.
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Acknowledgement_${app.applicationNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={2} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LoadingSkeleton rows={4} />
            <LoadingSkeleton rows={4} />
          </div>
          <div className="space-y-6">
            <LoadingSkeleton rows={3} />
            <LoadingSkeleton rows={3} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <ErrorState
        message={error || 'Application record could not be loaded.'}
        onRetry={fetchDetails}
      />
    );
  }

  const currentStatus = app.currentStatus || app.status || 'SUBMITTED';
  const assignedOfficer = app.assignedOfficer;
  const scheduledDate = (app as any).scheduledDate || (app as any).inspectionDate;
  const certificateId = (app as any).certificateId || (app as any).certificate?._id;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* 1. Statutory Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                to="/applicant/applications"
                className="text-xs font-bold text-[#123B6D] hover:underline flex items-center gap-1 mr-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Applications</span>
              </Link>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Statutory Filing
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight flex items-center gap-2">
              <span>{app.applicationNumber}</span>
              <StatusBadge status={currentStatus} size="md" />
            </h1>
            <p className="text-xs text-slate-500">
              Purpose: <strong className="text-slate-700">{app.purpose || 'Verification'}</strong> •
              Submitted on {new Date(app.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </p>
          </div>

          {/* Top Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadAcknowledgement}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Acknowledgement</span>
            </button>

            {certificateId && (
              <Link
                to={`/applicant/certificates`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs"
              >
                <Award className="w-4 h-4 text-emerald-200" />
                <span>View Certificate</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setHelplineModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#123B6D] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#123B6D]" />
              <span>Officer Helpline</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Grid: Left (Instrument & Timeline) + Right (Officer, Schedule, Fee) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instrument Details Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#123B6D]" />
                <span>Commercial Instrument Details</span>
              </h2>
              <span className="text-xs font-mono font-bold text-[#123B6D]">
                {app.instrument?.serialNumber || 'N/A'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Category & Name</span>
                <p className="font-bold text-slate-900 text-sm">
                  {app.instrument?.instrumentName || app.instrument?.category}
                </p>
                <p className="text-slate-500">{app.instrument?.category?.replace(/_/g, ' ')}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Manufacturer & Model</span>
                <p className="font-semibold text-slate-800">{app.instrument?.manufacturer || 'N/A'}</p>
                <p className="text-slate-500">Model: {app.instrument?.modelNumber || 'N/A'}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Capacity & Accuracy</span>
                <p className="font-semibold text-slate-800">
                  {formatInstrumentCapacity(app.instrument?.capacity, app.instrument?.unit, app.instrument?.maxCapacity)}
                </p>
                <p className="text-slate-500">
                  Class: {app.instrument?.accuracyClass?.replace(/_/g, ' ') || 'Class III (Trade)'}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Verification Scale Interval (e)</span>
                <p className="font-semibold text-slate-800 font-mono">
                  {app.instrument?.verificationScaleInterval_e || '1g'}
                </p>
              </div>
            </div>

            {/* Installation Address */}
            <div className="pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Physical Installation Location</span>
              </span>
              <p className="text-slate-800 font-medium mt-1">
                {app.instrument?.installationAddress?.premiseName},{' '}
                {app.instrument?.installationAddress?.addressLine || app.instrument?.installationAddress?.street},{' '}
                {app.instrument?.installationAddress?.city}, {app.instrument?.installationAddress?.district},{' '}
                {app.instrument?.installationAddress?.state} - {app.instrument?.installationAddress?.pincode}
              </p>
              {app.instrument?.installationAddress?.latitude && app.instrument?.installationAddress?.longitude && (
                <p className="text-[11px] font-mono text-emerald-700 mt-0.5">
                  GPS Coordinates: {app.instrument.installationAddress.latitude.toFixed(5)},{' '}
                  {app.instrument.installationAddress.longitude.toFixed(5)}
                </p>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-[#123B6D]" />
              <span>Statutory Lifecycle & Scrutiny Timeline</span>
            </h2>

            <div className="space-y-4 text-xs">
              {/* Event 1: Submission */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Application Submitted to Legal Metrology</p>
                  <p className="text-slate-500 text-[11px]">
                    Filed on {new Date(app.createdAt).toLocaleString()} via digital portal
                  </p>
                </div>
              </div>

              {/* Event 2: Scrutiny / Review */}
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 ${
                  currentStatus !== 'SUBMITTED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  {currentStatus !== 'SUBMITTED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : '2'}
                </div>
                <div>
                  <p className={`font-bold ${currentStatus !== 'SUBMITTED' ? 'text-slate-900' : 'text-slate-400'}`}>
                    Document & Model Scrutiny
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {currentStatus !== 'SUBMITTED' ? 'Verification officer scrutiny initiated' : 'Pending officer technical review'}
                  </p>
                </div>
              </div>

              {/* Event 3: Inspection Scheduled */}
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 ${
                  scheduledDate || currentStatus === 'SCHEDULED' || currentStatus === 'INSPECTION_COMPLETED' || currentStatus === 'CERTIFICATE_ISSUED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  {scheduledDate ? <CheckCircle2 className="w-3.5 h-3.5" /> : '3'}
                </div>
                <div>
                  <p className={`font-bold ${scheduledDate ? 'text-slate-900' : 'text-slate-400'}`}>
                    Field Inspection Allotment
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {scheduledDate
                      ? `Inspection appointment scheduled for ${new Date(scheduledDate).toLocaleDateString()}`
                      : 'Slot pending officer schedule'}
                  </p>
                </div>
              </div>

              {/* Event 4: Certificate Issued */}
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 ${
                  currentStatus === 'CERTIFICATE_ISSUED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  {currentStatus === 'CERTIFICATE_ISSUED' ? <Award className="w-3.5 h-3.5" /> : '4'}
                </div>
                <div>
                  <p className={`font-bold ${currentStatus === 'CERTIFICATE_ISSUED' ? 'text-emerald-700' : 'text-slate-400'}`}>
                    Statutory Verification Certificate Issued
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {currentStatus === 'CERTIFICATE_ISSUED'
                      ? 'Digitally signed tamper-evident certificate generated'
                      : 'Awaiting inspection verification stamp'}
                  </p>
                </div>
              </div>
            </div>

            {/* Attach Document Button */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setDocModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#123B6D] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Additional Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col: Officer, Inspection Slot, Fee) */}
        <div className="space-y-6">
          {/* Assigned Officer Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#123B6D]" />
              <span>Assigned Metrology Officer</span>
            </h3>

            {assignedOfficer ? (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/60 space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{assignedOfficer.name}</p>
                  <p className="text-slate-600">{assignedOfficer.designation || 'Inspector of Legal Metrology'}</p>
                  <p className="text-slate-500 text-[11px] font-mono">{assignedOfficer.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHelplineModalOpen(true)}
                  className="w-full py-2 px-3 text-xs font-bold text-center text-[#123B6D] bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Contact Office</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center space-y-1">
                <Clock className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700">Roster Allotment in Progress</p>
                <p className="text-[11px]">An officer from your local district office will be assigned shortly.</p>
              </div>
            )}
          </div>

          {/* Inspection Schedule Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#FF9933]" />
              <span>Inspection Schedule</span>
            </h3>

            {scheduledDate ? (
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF9933]" />
                  <span>
                    {new Date(scheduledDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Physical inspection at registered premise. Keep purchase invoice and standard weights accessible.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center space-y-1">
                <Calendar className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700">Awaiting Schedule</p>
                <p className="text-[11px]">Field inspection slot will be posted after technical scrutiny.</p>
              </div>
            )}
          </div>

          {/* Fee & Statutory Payment Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Statutory Fee Status</span>
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Verification Fee:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {app.feeDetails?.amount ? `₹ ${app.feeDetails.amount}` : 'Statutory Scale Fee'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-600">Payment Status:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  app.feeDetails?.feeStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {app.feeDetails?.feeStatus || 'PAID / EXEMPTED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      {docModalOpen && (
        <Modal
          isOpen={docModalOpen}
          onClose={() => setDocModalOpen(false)}
          title="Attach Supporting Document"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Attach invoice, test report, or premise trade license to this verification file.
            </p>
            <FileUploader
              accept=".pdf,image/*"
              maxSizeMb={10}
              onFileSelected={(f) => setSelectedFile(f)}
              description="PDF or image up to 10MB"
            />
            {selectedFile && (
              <p className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{selectedFile.name}</span>
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDocModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFile || uploading}
                onClick={handleUploadDocument}
                className="px-4 py-2 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Confirm & Upload'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Officer Helpline Modal */}
      {helplineModalOpen && (
        <Modal
          isOpen={helplineModalOpen}
          onClose={() => setHelplineModalOpen(false)}
          title="Legal Metrology Enforcement Helpline"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
              <p className="font-bold text-[#123B6D] text-sm">National Consumer Helpline</p>
              <p className="text-slate-600">Department of Consumer Affairs, Government of India</p>
              <p className="font-bold text-slate-900 text-sm mt-2">
                Toll Free: <a href="tel:1915" className="text-[#123B6D] underline">1915</a>
              </p>
            </div>

            <div className="text-slate-600 leading-relaxed space-y-1">
              <p className="font-bold text-slate-800">Jurisdictional Branch Support</p>
              <p>For scheduling enquiries regarding application <strong>{app.applicationNumber}</strong>, quote your application reference number during business hours (10:00 AM - 05:00 PM).</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHelplineModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
