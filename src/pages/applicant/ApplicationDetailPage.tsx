import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { applicationApi } from '../../services/applicationApi';
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
import { ScheduleVerificationModal } from '../../components/schedule/ScheduleVerificationModal';
import { formatInstrumentCapacity } from '../../utils/formatters';
import {
  FileCheck2,
  Calendar,
  Scale,
  User,
  MapPin,
  Clock,
  ArrowRight,
  Upload,
  AlertCircle,
  CheckCircle2,
  Download,
  Building2,
  FileSearch,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isDepartmentalOfficer =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'LEGAL_METROLOGY_OFFICER';

  const [app, setApp] = useState<VerificationApplicationItem | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Document upload modal
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Approve modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState('');
  const [approving, setApproving] = useState(false);

  // Schedule modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

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

  // Applicant: Submit draft to department
  const handleSubmitDraft = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const res = await applicationApi.submitApplication(id);
      if (res.success && res.data) {
        setApp(res.data);
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Application Submitted',
          message: 'Your verification application has been submitted to Legal Metrology for review.',
        });
        fetchDetails();
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Submission Error',
        message: getErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Department: Place under review
  const handleReviewApplication = async () => {
    if (!id) return;
    setReviewing(true);
    try {
      const res = await applicationApi.reviewApplication(id, {
        remarks: reviewRemarks.trim() || 'Application placed under formal technical scrutiny by officer',
      });
      if (res.success && res.data) {
        setApp(res.data);
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Application Under Review',
          message: 'Statutory scrutiny initiated. Application marked as UNDER REVIEW.',
        });
        setReviewModalOpen(false);
        setReviewRemarks('');
        fetchDetails();
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Review Error',
        message: getErrorMessage(err),
      });
    } finally {
      setReviewing(false);
    }
  };

  // Department: Approve application
  const handleApproveApplication = async () => {
    if (!id) return;
    setApproving(true);
    try {
      const res = await applicationApi.approveApplication(id, {
        remarks: approveRemarks.trim() || 'Application verified and formally approved for verification scheduling',
      });
      if (res.success && res.data) {
        setApp(res.data);
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Application Approved',
          message: 'Statutory approval granted. Application is now ready for schedule allotment.',
        });
        setApproveModalOpen(false);
        setApproveRemarks('');
        fetchDetails();
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Approval Error',
        message: getErrorMessage(err),
      });
    } finally {
      setApproving(false);
    }
  };

  const handleUploadDoc = async () => {
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
          message: 'Document successfully attached to verification file.',
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

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading Application..." />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (error || !app) {
    return <ErrorState message={error || 'Application not found'} onRetry={fetchDetails} />;
  }

  const currentStatus = app.currentStatus || app.status;
  const isDraft = currentStatus === 'DRAFT';
  const isSubmitted = currentStatus === 'SUBMITTED';
  const isUnderReview = currentStatus === 'UNDER_REVIEW';
  const isApproved = currentStatus === 'APPROVED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title={app.applicationNumber}
        description={`Statutory Verification Application • Purpose: ${app.purpose || 'Verification'}`}
        badge={<StatusBadge status={currentStatus} size="md" />}
        breadcrumbs={[
          {
            label: 'Dashboard',
            href: isDepartmentalOfficer ? '/admin/dashboard' : '/applicant/dashboard',
          },
          {
            label: 'Applications',
            href: isDepartmentalOfficer ? '/admin/applications' : '/applicant/applications',
          },
          { label: app.applicationNumber },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Document attachment allowed across stages */}
            <button
              type="button"
              onClick={() => setDocModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Attach Document</span>
            </button>

            {/* Applicant: Submit draft */}
            {isDraft && (
              <button
                type="button"
                onClick={handleSubmitDraft}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                {submitting && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Submit to Department</span>
              </button>
            )}

            {/* Department Actions: Review & Approve & Schedule */}
            {isDepartmentalOfficer && isSubmitted && (
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition shadow-2xs"
              >
                <FileSearch className="w-3.5 h-3.5 text-amber-800" />
                <span>Initiate Review</span>
              </button>
            )}

            {isDepartmentalOfficer && isUnderReview && (
              <button
                type="button"
                onClick={() => setApproveModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Grant Statutory Approval</span>
              </button>
            )}

            {isDepartmentalOfficer && isApproved && (
              <button
                type="button"
                onClick={() => setScheduleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Schedule Verification</span>
              </button>
            )}
          </div>
        }
      />

      {/* Main Grid: Details + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2 Cols: Instrument & Verification Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instrument Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Scale className="w-4 h-4 text-teal-700" />
                <span>Instrument Specifications</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                ID: {app.instrument?._id || 'N/A'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Instrument Name:</span>
                <span className="font-bold text-slate-800">
                  {app.instrument?.instrumentName || app.instrument?.category}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Category:</span>
                <span className="font-semibold text-slate-800">
                  {app.instrument?.category?.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Model / Manufacturer:</span>
                <span className="font-semibold text-slate-800">
                  {app.instrument?.modelNumber} • {app.instrument?.manufacturer}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Serial Number:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {app.instrument?.serialNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Capacity / Range:</span>
                <span className="font-semibold text-slate-800">
                  {formatInstrumentCapacity(app.instrument?.capacity, app.instrument?.unit, app.instrument?.maxCapacity)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Accuracy Class:</span>
                <span className="font-semibold text-slate-800">
                  {app.instrument?.accuracyClass || 'Class III'}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Officer & Jurisdiction Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-teal-700" />
              <span>Inspection Assignment & Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Legal Metrology Officer:</span>
                {app.assignedLMO ? (
                  <div className="font-bold text-slate-800">
                    {app.assignedLMO.name}
                    <span className="block text-[11px] font-normal text-slate-500">
                      {app.assignedLMO.designation || 'LMO'} ({app.assignedLMO.email})
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">Pending officer allotment</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Verification Fee Status:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      app.feeDetails?.feeStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {app.feeDetails?.feeStatus || 'PENDING'}
                  </span>
                  {app.feeDetails?.amount && (
                    <span className="font-semibold text-slate-700">₹{app.feeDetails.amount}</span>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-400 block mb-0.5">Verification Site Address:</span>
                <div className="text-slate-700 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>
                    {app.verificationLocation?.line1 || app.instrument?.installationAddress?.line1 || 'Registered Premise'},{' '}
                    {app.verificationLocation?.district || app.instrument?.installationAddress?.district || 'District'},{' '}
                    {app.verificationLocation?.state || app.instrument?.installationAddress?.state || 'State'} -{' '}
                    {app.verificationLocation?.pincode || app.instrument?.installationAddress?.pincode}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Attached Statutory Documents */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Attached Documents</h3>
              <button
                type="button"
                onClick={() => setDocModalOpen(true)}
                className="text-xs font-bold text-teal-800 hover:text-teal-900"
              >
                + Add File
              </button>
            </div>

            {(!app.documents || app.documents.length === 0) ? (
              <p className="text-xs text-slate-400 italic">No statutory documents attached yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {app.documents.map((doc, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{doc.name || 'Document'}</p>
                      <p className="text-[11px] text-slate-500">{doc.documentType || 'Statutory File'}</p>
                    </div>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-teal-800 hover:bg-teal-50"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 1 Col: Statutory Lifecycle Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-teal-700" />
              <span>Statutory Lifecycle</span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* If history events exist */}
              {history && history.length > 0 ? (
                history.map((event: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                    <div className="text-xs font-bold text-slate-800">
                      {event.status?.replace(/_/g, ' ') || event.toStatus?.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'}
                    </div>
                    {event.remarks && (
                      <p className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                        {event.remarks}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                  <div className="text-xs font-bold text-slate-800">
                    {app.currentStatus || app.status}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(app.createdAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Application Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Conduct Technical Scrutiny"
        subtitle={`Initiate departmental technical review for ${app.applicationNumber}`}
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReviewApplication}
              disabled={reviewing}
              className="px-4 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition shadow-xs disabled:opacity-50"
            >
              {reviewing ? 'Marking Under Review...' : 'Confirm Technical Scrutiny'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Placing this application under review formally marks that a Legal Metrology Officer is examining the statutory dossier, instrument specifications, and trade licensing.
          </p>
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Scrutiny Observations / Technical Remarks
            </label>
            <textarea
              rows={3}
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              placeholder="e.g., Documents verified; accuracy class conforms to General Rules"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
            />
          </div>
        </div>
      </Modal>

      {/* Approve Application Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Grant Statutory Approval"
        subtitle={`Approve application ${app.applicationNumber} for physical inspection scheduling`}
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setApproveModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApproveApplication}
              disabled={approving}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs disabled:opacity-50"
            >
              {approving ? 'Approving...' : 'Confirm Statutory Approval'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Granting statutory approval satisfies all preliminary legal conditions. Once approved, the application will become eligible for immediate field verification beat scheduling.
          </p>
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Statutory Approval Endorsement / Remarks
            </label>
            <textarea
              rows={3}
              value={approveRemarks}
              onChange={(e) => setApproveRemarks(e.target.value)}
              placeholder="e.g., Application and statutory documents formally endorsed for verification"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
            />
          </div>
        </div>
      </Modal>

      {/* Attach Document Modal */}
      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Attach Statutory Document"
        subtitle="Upload calibration certificate, purchase invoice, or model approval"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDocModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUploadDoc}
              disabled={uploading || !selectedFile}
              className="px-4 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </>
        }
      >
        <FileUploader
          label="Select File"
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
        />
      </Modal>

      {/* Schedule Verification Modal */}
      <ScheduleVerificationModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSuccess={() => {
          setToast({
            id: String(Date.now()),
            type: 'success',
            title: 'Schedule Generated',
            message: 'Statutory verification schedule successfully recorded.',
          });
          fetchDetails();
        }}
        application={app}
        lockApplication={true}
      />
    </div>
  );
};
