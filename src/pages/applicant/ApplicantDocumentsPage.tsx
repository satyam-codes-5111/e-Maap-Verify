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
      <div className="space-y-6">
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
          { label: 'Dashboard', href: '/applicant/dashboard' },
          { label: 'Documents & KYC' },
        ]}
      />

      {/* KYC Status Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{profile.businessName}</h2>
            <p className="text-xs text-slate-500">
              Registration Status: <StatusBadge status={profile.kycStatus} size="sm" />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Trade License Number:</span>
            <span className="font-mono font-bold text-slate-800">
              {profile.tradeLicenseNumber || 'Pending Submission'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">GST Identification No:</span>
            <span className="font-mono font-bold text-slate-800">
              {profile.gstNumber || 'Pending Submission'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">PAN Number:</span>
            <span className="font-mono font-bold text-slate-800">
              {profile.panNumber || 'Pending Submission'}
            </span>
          </div>
        </div>
      </div>

      {/* KYC Upload Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Upload Statutory Business Proof</h3>
          <p className="text-xs text-slate-500">
            Upload Trade License, Shops & Establishment Act Registration, or GST Certificate
          </p>
        </div>

        <FileUploader
          label="Select Statutory Identity File"
          description="PDF or JPG up to 10MB"
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
        />

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleUploadKyc}
            disabled={uploading || !selectedFile}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload KYC Document</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
