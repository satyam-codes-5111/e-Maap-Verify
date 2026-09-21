import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Save,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { stakeholderApi } from '../../services/stakeholderApi';
import { reverseGeocodeCoordinates } from '../../services/geocodingService';
import { useNativeGps } from '../../hooks/useNativeGps';
import { StakeholderItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { Toast, ToastMessage } from '../common/Toast';

export const BUSINESS_TYPES = [
  { value: 'RETAILER', label: 'Commercial Retailer / Shop' },
  { value: 'MANUFACTURER', label: 'Instrument Manufacturer' },
  { value: 'DEALER', label: 'Authorized Dealer / Distributor' },
  { value: 'REPAIRER', label: 'Certified Repairer' },
  { value: 'PETROL_PUMP', label: 'Petrol Pump / Fuel Dispensing Station' },
  { value: 'INDUSTRIAL_WEIGHBRIDGE', label: 'Industrial Weighbridge Operator' },
  { value: 'JEWELER', label: 'Jeweler / Precision Trade' },
  { value: 'OTHER', label: 'Other Commercial Establishment' },
];

export interface BusinessProfileFormInputs {
  businessName: string;
  businessType: string;
  tradeLicenseNumber: string;
  gstNumber?: string;
  panNumber?: string;
  street: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  designation?: string;
}

interface BusinessProfileCardProps {
  initialProfile?: StakeholderItem | null;
  onSuccess?: (createdProfile: StakeholderItem) => void;
  redirectToRegister?: boolean;
  isInitialSetup?: boolean;
}

export const BusinessProfileCard: React.FC<BusinessProfileCardProps> = ({
  initialProfile,
  onSuccess,
  redirectToRegister = false,
  isInitialSetup = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [capturedLat, setCapturedLat] = useState<number | null>(null);
  const [capturedLon, setCapturedLon] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const { getCurrentPosition } = useNativeGps();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BusinessProfileFormInputs>({
    defaultValues: {
      businessName: initialProfile?.businessName || '',
      businessType: initialProfile?.businessType || 'RETAILER',
      tradeLicenseNumber: initialProfile?.tradeLicenseNumber || '',
      gstNumber: initialProfile?.gstNumber || '',
      panNumber: initialProfile?.panNumber || '',
      street:
        initialProfile?.registeredAddress?.street ||
        initialProfile?.registeredAddress?.line1 ||
        '',
      city: initialProfile?.registeredAddress?.city || '',
      district: initialProfile?.registeredAddress?.district || '',
      state: initialProfile?.registeredAddress?.state || 'Maharashtra',
      pincode: initialProfile?.registeredAddress?.pincode || '',
      contactName: initialProfile?.contactPerson?.name || user?.name || '',
      contactPhone: initialProfile?.contactPerson?.phone || user?.phone || '',
      contactEmail: initialProfile?.contactPerson?.email || user?.email || '',
      designation: initialProfile?.contactPerson?.designation || '',
    },
  });

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    setLocationError(null);
    setLocationSuccess(false);

    try {
      const pos = await getCurrentPosition();
      if (!pos) {
        setLocationError(
          'Location access unavailable or permission denied. Please enter address manually.'
        );
        return;
      }

      setCapturedLat(pos.latitude);
      setCapturedLon(pos.longitude);

      // Reverse-geocode coordinates to obtain readable address components
      const geo = await reverseGeocodeCoordinates(pos.latitude, pos.longitude);

      // Populate address fields where provider actually returned data; never invent data
      if (geo.street) {
        setValue('street', geo.street, { shouldValidate: true });
      }
      if (geo.city) {
        setValue('city', geo.city, { shouldValidate: true });
      }
      if (geo.district) {
        setValue('district', geo.district, { shouldValidate: true });
      }
      if (geo.state) {
        setValue('state', geo.state, { shouldValidate: true });
      }
      if (geo.pincode) {
        setValue('pincode', geo.pincode, { shouldValidate: true });
      }

      setLocationSuccess(true);
    } catch (err: any) {
      setLocationError(
        err?.message || 'Failed to detect current location. Please fill fields manually.'
      );
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async (values: BusinessProfileFormInputs) => {
    setSaving(true);
    try {
      const payload: Partial<StakeholderItem> = {
        businessName: values.businessName.trim(),
        businessType: values.businessType,
        tradeLicenseNumber: values.tradeLicenseNumber.trim(),
        gstNumber: values.gstNumber?.trim() ? values.gstNumber.trim().toUpperCase() : undefined,
        panNumber: values.panNumber?.trim() ? values.panNumber.trim().toUpperCase() : undefined,
        registeredAddress: {
          street: values.street.trim(),
          city: values.city.trim(),
          district: values.district.trim(),
          state: values.state.trim(),
          pincode: values.pincode.trim(),
          latitude: capturedLat ?? undefined,
          longitude: capturedLon ?? undefined,
        },
        contactPerson: {
          name: values.contactName.trim(),
          phone: values.contactPhone.trim(),
          email: values.contactEmail.trim().toLowerCase(),
          designation: values.designation?.trim() || undefined,
        },
      };

      const res = await stakeholderApi.createMyProfile(payload);
      if (res.success && res.data) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Business Profile Saved',
          message: 'Your commercial stakeholder profile has been saved successfully.',
        });

        if (onSuccess) {
          onSuccess(res.data);
        }

        if (redirectToRegister) {
          setTimeout(() => {
            navigate('/applicant/instruments/register');
          }, 1000);
        }
      } else {
        throw new Error(res.message || 'Failed to save business profile');
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Profile Error',
        message: getErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-teal-300">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              {isInitialSetup
                ? 'Complete Stakeholder Business Profile'
                : 'Commercial Establishment Profile'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Statutory commercial establishment registration under the Legal Metrology Act, 2009
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Section 1: Establishment Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            <Building2 className="w-4 h-4 text-teal-700" />
            <span>Establishment Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Legal Business Name *
              </label>
              <input
                type="text"
                {...register('businessName', {
                  required: 'Legal business name is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' },
                })}
                placeholder="e.g. Apex Industrial Weighing Solutions Ltd"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.businessName && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.businessName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Type *
              </label>
              <select
                {...register('businessType', { required: 'Business type is required' })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              >
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt.value} value={bt.value}>
                    {bt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trade License / Registration Number *
              </label>
              <input
                type="text"
                {...register('tradeLicenseNumber', {
                  required: 'Trade license or registration number is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' },
                })}
                placeholder="e.g. TL-2024-MUM-8921"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.tradeLicenseNumber && (
                <p className="text-[11px] text-rose-600 mt-1">
                  {errors.tradeLicenseNumber.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                maxLength={15}
                {...register('gstNumber')}
                placeholder="e.g. 27ABCDE1234F1Z5"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PAN Number (Optional)
              </label>
              <input
                type="text"
                maxLength={10}
                {...register('panNumber')}
                placeholder="e.g. ABCDE1234F"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Commercial Registered Address */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-teal-700" />
              <span>Commercial Registered Address</span>
            </div>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition disabled:opacity-50"
            >
              {locating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-teal-800 border-t-transparent rounded-full animate-spin" />
                  <span>Acquiring GPS...</span>
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5 text-teal-700" />
                  <span>Use My Current Location</span>
                </>
              )}
            </button>
          </div>

          {/* Location Captured Status */}
          {locationSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1.5 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Location captured successfully</span>
              </div>
              {capturedLat !== null && capturedLon !== null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-emerald-900 pt-1">
                  <div className="bg-white/80 rounded px-2.5 py-1 border border-emerald-200">
                    <span className="text-emerald-700 font-semibold">Latitude:</span>{' '}
                    {capturedLat.toFixed(6)}
                  </div>
                  <div className="bg-white/80 rounded px-2.5 py-1 border border-emerald-200">
                    <span className="text-emerald-700 font-semibold">Longitude:</span>{' '}
                    {capturedLon.toFixed(6)}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-emerald-700">
                Address fields below have been automatically populated. You may review and manually edit any field.
              </p>
            </div>
          )}

          {locationError && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street / Premise Address *
              </label>
              <input
                type="text"
                {...register('street', {
                  required: 'Street/address is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' },
                })}
                placeholder="e.g. Plot 12, Commercial Road, MIDC Industrial Area"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.street && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.street.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City / Town *</label>
              <input
                type="text"
                {...register('city', {
                  required: 'City is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' },
                })}
                placeholder="e.g. Mumbai"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.city && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District *</label>
              <input
                type="text"
                {...register('district', {
                  required: 'District is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' },
                })}
                placeholder="e.g. Mumbai Suburban"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.district && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.district.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                {...register('state', {
                  required: 'State is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' },
                })}
                placeholder="e.g. Maharashtra"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.state && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.state.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                6-Digit PIN Code *
              </label>
              <input
                type="text"
                maxLength={6}
                {...register('pincode', {
                  required: 'Valid 6-digit PIN code is required',
                  pattern: {
                    value: /^[1-9][0-9]{5}$/,
                    message: 'Please enter a valid 6-digit PIN code',
                  },
                })}
                placeholder="400001"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.pincode && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.pincode.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Authorized Contact Person */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            <span>Authorized Contact Person</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person Full Name *
              </label>
              <input
                type="text"
                {...register('contactName', {
                  required: 'Contact person name is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' },
                })}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.contactName && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.contactName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designation / Role (Optional)
              </label>
              <input
                type="text"
                {...register('designation')}
                placeholder="e.g. Proprietor / Managing Director / Plant Head"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Mobile Number *
              </label>
              <input
                type="tel"
                maxLength={10}
                {...register('contactPhone', {
                  required: '10-digit mobile number is required',
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Enter a valid 10-digit Indian mobile number',
                  },
                })}
                placeholder="9876543210"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.contactPhone && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.contactPhone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address *
              </label>
              <input
                type="email"
                {...register('contactEmail', {
                  required: 'Official email address is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
                placeholder="official@company.com"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.contactEmail && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.contactEmail.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            {isInitialSetup
              ? 'Saving your business profile will immediately unlock statutory instrument registration.'
              : 'Updates are logged and reflected across your registered trade instruments.'}
          </p>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Business Profile</span>
                {redirectToRegister && <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
