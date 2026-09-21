import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { stakeholderApi } from '../../services/stakeholderApi';
import { dashboardApi } from '../../services/dashboardApi';
import { StakeholderItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { BusinessProfileCard } from '../../components/applicant/BusinessProfileCard';
import { FileUploader } from '../../components/common/FileUploader';
import { Toast, ToastMessage } from '../../components/common/Toast';
import {
  ArrowLeft,
  FileText,
  UploadCloud,
  ShieldCheck,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit3,
  X,
  FileCheck2,
} from 'lucide-react';

export const ApplicantProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect');

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StakeholderItem | null>(null);
  const [isMissingProfile, setIsMissingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [counts, setCounts] = useState({
    totalInstruments: 0,
    verifiedInstruments: 0,
    pendingVerification: 0,
    expiredCertificates: 0,
  });

  const [selectedDoc, setSelectedDoc] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fetchProfileAndStats = async () => {
    setLoading(true);
    try {
      const [profileRes, dashRes] = await Promise.all([
        stakeholderApi.getMyProfile().catch(() => ({ success: false, data: null })),
        dashboardApi.getStakeholderDashboard().catch(() => ({ success: false, data: null })),
      ]);

      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
        setIsMissingProfile(false);
      } else {
        setProfile(null);
        setIsMissingProfile(true);
      }

      if (dashRes.success && dashRes.data?.counts) {
        setCounts({
          totalInstruments: dashRes.data.counts.totalInstruments || 0,
          verifiedInstruments: dashRes.data.counts.verifiedInstruments || 0,
          pendingVerification: dashRes.data.counts.pendingVerification || 0,
          expiredCertificates: dashRes.data.counts.expiredCertificates || 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const handleUploadKycDoc = async () => {
    if (!selectedDoc) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('document', selectedDoc);
      formData.append('docType', 'TRADE_LICENSE');
      const res = await stakeholderApi.uploadKycDoc(formData);
      if (res.success) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Document Uploaded',
          message: 'KYC statutory establishment document uploaded successfully.',
        });
        setSelectedDoc(null);
        fetchProfileAndStats();
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Upload Error',
        message: getErrorMessage(err),
      });
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader title="Business Profile" />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {returnUrl && (
        <div>
          <button
            type="button"
            onClick={() => navigate(returnUrl)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#123B6D] hover:underline transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Instrument Registration</span>
          </button>
        </div>
      )}

      <PageHeader
        title={
          isMissingProfile
            ? 'Complete Stakeholder Business Profile'
            : 'Business Profile & Statutory Compliance'
        }
        description="Official commercial establishment registration under the Legal Metrology Act, 2009"
        badge={
          profile?.kycStatus ? <StatusBadge status={profile.kycStatus} size="md" /> : undefined
        }
        breadcrumbs={[
          { label: 'Dashboard', to: '/applicant/dashboard' },
          { label: 'Business Profile' },
        ]}
        actions={
          !isMissingProfile && profile ? (
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#123B6D] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
            >
              {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
            </button>
          ) : undefined
        }
      />

      {/* Statutory Compliance Summary KPI Cards */}
      {!isMissingProfile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#123B6D] flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Instruments</span>
              <p className="text-xl font-black text-slate-900">{counts.totalInstruments}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified & Stamped</span>
              <p className="text-xl font-black text-emerald-700">{counts.verifiedInstruments}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Reverifications</span>
              <p className="text-xl font-black text-amber-800">
                {counts.pendingVerification + counts.expiredCertificates}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Editing Mode or Missing Profile: Show Form */}
      {isMissingProfile || isEditing ? (
        <div className="space-y-4">
          {isEditing && (
            <div className="flex items-center justify-between bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200 text-xs text-[#123B6D]">
              <span className="font-semibold">You are updating your registered business details.</span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="font-bold underline"
              >
                Done
              </button>
            </div>
          )}

          <BusinessProfileCard
            initialProfile={profile}
            isInitialSetup={isMissingProfile}
            redirectToRegister={Boolean(returnUrl || isMissingProfile)}
            onSuccess={(savedProfile) => {
              setProfile(savedProfile);
              setIsMissingProfile(false);
              setIsEditing(false);
              setToast({
                id: String(Date.now()),
                type: 'success',
                title: 'Profile Updated',
                message: 'Business profile successfully updated with Legal Metrology records.',
              });
            }}
          />
        </div>
      ) : profile ? (
        /* Read-Only Display Profile */
        <div className="space-y-6">
          {/* Establishment Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#123B6D]" />
                <h3 className="text-sm font-bold text-slate-900">Commercial Establishment Particulars</h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#123B6D] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                {profile.businessType || 'COMMERCIAL_ESTABLISHMENT'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Business / Legal Trade Name</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{profile.businessName}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Trade License Number</span>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{profile.tradeLicenseNumber || 'N/A'}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">GSTIN / Registration</span>
                <p className="font-mono text-slate-700 mt-0.5">{profile.gstNumber || 'Not Provided'}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Permanent Account Number (PAN)</span>
                <p className="font-mono text-slate-700 mt-0.5">{profile.panNumber || 'Not Provided'}</p>
              </div>
            </div>
          </div>

          {/* Registered Premise Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-[#123B6D]" />
              <h3 className="text-sm font-bold text-slate-900">Registered Premises & Enforcement Jurisdiction</h3>
            </div>

            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-medium text-slate-900">
                {profile.registeredAddress?.street || profile.registeredAddress?.line1 || 'Main Street'}
              </p>
              <p>
                {profile.registeredAddress?.city}, {profile.registeredAddress?.district},{' '}
                {profile.registeredAddress?.state} - {profile.registeredAddress?.pincode}
              </p>
              {profile.registeredAddress?.latitude && profile.registeredAddress?.longitude && (
                <p className="text-[11px] font-mono text-emerald-700 pt-1">
                  GPS Coordinates: {profile.registeredAddress.latitude.toFixed(5)},{' '}
                  {profile.registeredAddress.longitude.toFixed(5)}
                </p>
              )}
            </div>
          </div>

          {/* Contact Person */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-[#123B6D]" />
              <h3 className="text-sm font-bold text-slate-900">Designated Signatory & Contact Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Name</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {profile.contactPerson?.name || 'Authorized Signatory'}
                </p>
                {profile.contactPerson?.designation && (
                  <p className="text-slate-500 text-[11px]">{profile.contactPerson.designation}</p>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Primary Contact Phone</span>
                <p className="font-mono text-slate-800 mt-0.5">{profile.contactPerson?.phone || 'N/A'}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Official Email</span>
                <p className="font-mono text-slate-800 mt-0.5">{profile.contactPerson?.email || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Statutory KYC Verification Documents */}
      {!isMissingProfile && profile && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Statutory KYC & Trade Registration Documents
              </h3>
              <p className="text-xs text-slate-500">
                Mandatory under Rule 11 of the Legal Metrology (General) Rules, 2011
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>

          {profile.kycDocuments && profile.kycDocuments.length > 0 ? (
            <div className="space-y-2">
              {profile.kycDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
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
          ) : (
            <p className="text-xs text-slate-500 italic">
              No statutory documents uploaded yet. Upload your Trade License or Factory Registration.
            </p>
          )}

          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Upload Trade / Establishment License</h4>
            <FileUploader
              accept=".pdf,image/*"
              maxSizeMb={5}
              onFileSelected={(f) => setSelectedDoc(f)}
              description="PDF or image up to 5MB"
            />
            {selectedDoc && (
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                <span className="text-xs font-semibold text-slate-800">{selectedDoc.name}</span>
                <button
                  type="button"
                  disabled={uploadingDoc}
                  onClick={handleUploadKycDoc}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-md transition disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{uploadingDoc ? 'Uploading...' : 'Upload Document'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
