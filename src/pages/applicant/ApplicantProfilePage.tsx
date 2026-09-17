import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { stakeholderApi } from '../../services/stakeholderApi';
import { StakeholderItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { Building2, Save } from 'lucide-react';

interface ProfileFormInputs {
  businessName: string;
  tradeLicenseNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  businessType?: string;
  line1?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export const ApplicantProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<StakeholderItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormInputs>();

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await stakeholderApi.getMyProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        reset({
          businessName: res.data.businessName || '',
          tradeLicenseNumber: res.data.tradeLicenseNumber || '',
          gstNumber: res.data.gstNumber || '',
          panNumber: res.data.panNumber || '',
          businessType: res.data.businessType || 'TRADER',
          line1: res.data.registeredAddress?.line1 || '',
          city: res.data.registeredAddress?.city || '',
          district: res.data.registeredAddress?.district || '',
          state: res.data.registeredAddress?.state || '',
          pincode: res.data.registeredAddress?.pincode || '',
          contactName: res.data.contactPerson?.name || '',
          contactPhone: res.data.contactPerson?.phone || '',
          contactEmail: res.data.contactPerson?.email || '',
        });
      } else {
        setError(res.message || 'Profile could not be loaded');
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

  const onSubmit = async (values: ProfileFormInputs) => {
    setSaving(true);
    try {
      const payload: Partial<StakeholderItem> = {
        businessName: values.businessName,
        tradeLicenseNumber: values.tradeLicenseNumber,
        gstNumber: values.gstNumber,
        panNumber: values.panNumber,
        businessType: values.businessType,
        registeredAddress: {
          line1: values.line1,
          city: values.city,
          district: values.district,
          state: values.state,
          pincode: values.pincode,
        },
        contactPerson: {
          name: values.contactName,
          phone: values.contactPhone,
          email: values.contactEmail,
        },
      };

      const res = await stakeholderApi.updateMyProfile(payload);
      if (res.success && res.data) {
        setProfile(res.data);
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Profile Updated',
          message: 'Business profile and registered jurisdiction updated successfully.',
        });
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Update Error',
        message: getErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Business Profile" />
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
        title="Business Profile & Jurisdiction"
        description="Official establishment details and registered premise information"
        badge={<StatusBadge status={profile.kycStatus} size="md" />}
        breadcrumbs={[
          { label: 'Dashboard', href: '/applicant/dashboard' },
          { label: 'Business Profile' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Establishment Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-teal-700" />
            <span>Establishment Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Legal Name *
              </label>
              <input
                type="text"
                {...register('businessName', { required: 'Business name is required' })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.businessName && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.businessName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Type</label>
              <select
                {...register('businessType')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              >
                <option value="TRADER">Commercial Trader / Retailer</option>
                <option value="MANUFACTURER">Manufacturer</option>
                <option value="DEALER">Authorized Dealer</option>
                <option value="REPAIRER">Certified Repairer</option>
                <option value="PETROLEUM_OUTLET">Petroleum Dispensing Outlet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trade License No.</label>
              <input
                type="text"
                {...register('tradeLicenseNumber')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
              <input
                type="text"
                {...register('gstNumber')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
              <input
                type="text"
                {...register('panNumber')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>
          </div>
        </div>

        {/* Registered Address */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Registered Commercial Address
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address Line</label>
              <input
                type="text"
                {...register('line1')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                {...register('city')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                {...register('district')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                {...register('state')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                {...register('pincode')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
