import React, { useState, useEffect } from 'react';
import { stakeholderApi } from '../../services/stakeholderApi';
import { StakeholderItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileUploader } from '../../components/common/FileUploader';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { Toast, ToastMessage } from '../../components/common/Toast';
import {
  FolderLock,
  Building2,
  FileCheck,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export const ApplicantDocumentsPage: React.FC = () => {
  const [profile, setProfile] = useState<StakeholderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await stakeholderApi.getMyProfile();
      if (res.success && res.data) {
        setProfile(res.data);
      } else {
        setError(res.message || 'Failed to load profile');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUploadKyc = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('docType', 'TRADE_LICENSE');
      const res = await stakeholderApi.uploadKycDoc(formData);
      if (res.success) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Document Uploaded',
          message: 'KYC statutory document submitted for officer verification.',
        });
        setSelectedFile(null);
        fetchProfile();
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Upload Error',
        message: getErrorMessage(err),
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader title="Statutory Documents & KYC" />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (error || !profile) {
    return <ErrorState message={error || 'Failed to load profile'} onRetry={fetchProfile} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Statutory Documents & KYC"
        description="Verify your legal trade establishment to comply with Legal Metrology regulations"
        badge={<StatusBadge status={profile.kycStatus} size="md" />}
        breadcrumbs={[
          { label: 'Dashboard', to: '/applicant/dashboard' },
          { label: 'Documents & KYC' },
        ]}
      />

      {/* KYC Status Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#123B6D] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{profile.businessName}</h2>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Registration Status:</span>
              <StatusBadge status={profile.kycStatus} size="sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5 font-bold uppercase text-[10px]">Trade License:</span>
            <span className="font-mono font-bold text-slate-800">
              {profile.tradeLicenseNumber || 'Pending Submission'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-bold uppercase text-[10px]">GSTIN:</span>
            <span className="font-mono font-bold text-slate-800">
              {profile.gstNumber || 'Pending Submission'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-bold uppercase text-[10px]">PAN:</span>
            <span className="font-mono font-bold text-slate-800">
              {profile.panNumber || 'Pending Submission'}
            </span>
          </div>
        </div>
      </div>

      {/* Uploaded Documents List */}
      {profile.kycDocuments && profile.kycDocuments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Uploaded Statutory Documents
          </h3>
          <div className="space-y-2">
            {profile.kycDocuments.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="font-bold text-slate-800">
                      {doc.docType?.replace(/_/g, ' ') || 'Trade License'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Uploaded on {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Active'}
                    </p>
                  </div>
                </div>
                <StatusBadge status={doc.verificationStatus || 'VERIFIED'} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KYC Upload Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Upload Statutory Business Proof</h3>
          <p className="text-xs text-slate-500">
            Upload Trade License, Shops & Establishment Act Registration, or GST Certificate
          </p>
        </div>

        <FileUploader
          accept=".pdf,image/*"
          maxSizeMb={10}
          onFileSelected={(f) => setSelectedFile(f)}
          description="PDF or JPG up to 10MB"
        />

        {selectedFile && (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs">
            <span className="font-semibold text-slate-800">{selectedFile.name}</span>
            <button
              type="button"
              onClick={handleUploadKyc}
              disabled={uploading}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Submit Document</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
