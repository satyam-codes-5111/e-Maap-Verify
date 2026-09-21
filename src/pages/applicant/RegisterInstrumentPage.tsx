import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { instrumentApi } from '../../services/instrumentApi';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { FileUploader } from '../../components/common/FileUploader';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Scale, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface RegisterFormInputs {
  instrumentName: string;
  category: string;
  instrumentType: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  accuracyClass: string;
  maxCapacity: number;
  minCapacity: number;
  unit: string;
  verificationScaleInterval_e: number;
  approvalModelNumber?: string;
  premiseName?: string;
  addressLine1?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export const RegisterInstrumentPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<File | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!toast || toast.type !== 'error' || toast.title !== 'Registration Error') {
      return;
    }

    const timer = setTimeout(() => {
      setToast(null);
    }, 10000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    defaultValues: {
      category: 'NON_AUTOMATIC_WEIGHING_INSTRUMENTS',
      accuracyClass: 'Class III',
      unit: 'kg',
      state: 'Maharashtra',
    },
  });

  const onSubmit = async (values: RegisterFormInputs) => {
    setSubmitting(true);
    try {
      const payload = {
        instrumentName: values.instrumentName,
        category: values.category,
        instrumentType: values.instrumentType || values.instrumentName,
        manufacturer: values.manufacturer,
        modelNumber: values.modelNumber,
        serialNumber: values.serialNumber,
        accuracyClass: values.accuracyClass,
        maxCapacity: Number(values.maxCapacity),
        minCapacity: Number(values.minCapacity || 0),
        unit: values.unit,
        verificationScaleInterval_e: Number(values.verificationScaleInterval_e || 1),
        approvalModelNumber: values.approvalModelNumber,
        installationAddress: {
          premiseName: values.premiseName,
          line1: values.addressLine1,
          city: values.city,
          district: values.district,
          state: values.state,
          pincode: values.pincode,
        },
      };

      const res = await instrumentApi.createInstrument(payload);
      if (res.success && res.data) {
        const createdId = res.data._id;

        // Upload photo if selected
        if (selectedPhoto && createdId) {
          const formData = new FormData();
          formData.append('photo', selectedPhoto);
          await instrumentApi.uploadPhoto(createdId, formData).catch(() => {});
        }

        // Upload document if selected
        if (selectedDoc && createdId) {
          const docFormData = new FormData();
          docFormData.append('document', selectedDoc);
          await instrumentApi.uploadDocument(createdId, docFormData).catch(() => {});
        }

        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Instrument Registered',
          message: 'Instrument successfully enrolled into statutory registry.',
        });

        setTimeout(() => {
          navigate('/applicant/instruments');
        }, 1200);
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Registration Error',
        message: getErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Register Weighing / Measuring Instrument"
        description="Statutory declaration for legal metrology commercial verification"
        breadcrumbs={[
          { label: 'Dashboard', href: '/applicant/dashboard' },
          { label: 'Instruments', href: '/applicant/instruments' },
          { label: 'New Registration' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Specifications */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Scale className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">Technical Specifications</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instrument Commercial Name *
              </label>
              <input
                type="text"
                {...register('instrumentName', { required: 'Instrument name is required' })}
                placeholder="e.g. Counter Scale 30kg"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.instrumentName && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.instrumentName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                {...register('category', { required: true })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              >
                <option value="NON_AUTOMATIC_WEIGHING_INSTRUMENTS">
                  Non-Automatic Weighing Instruments (NAWI)
                </option>
                <option value="AUTOMATIC_WEIGHING_INSTRUMENTS">
                  Automatic Weighing Instruments (AWI)
                </option>
                <option value="MEASURING_INSTRUMENTS">General Measuring Instruments</option>
                <option value="FLOW_METERS">Flow Meters & Dispensing Units</option>
                <option value="STORAGE_TANKS">Storage Tanks & Dipsticks</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer *</label>
              <input
                type="text"
                {...register('manufacturer', { required: 'Manufacturer is required' })}
                placeholder="e.g. Avery Weigh-Tronix"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.manufacturer && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.manufacturer.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model Number *</label>
              <input
                type="text"
                {...register('modelNumber', { required: 'Model number is required' })}
                placeholder="e.g. ZM305-P"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.modelNumber && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.modelNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number *</label>
              <input
                type="text"
                {...register('serialNumber', { required: 'Serial number is required' })}
                placeholder="e.g. SN-8849201"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
              {errors.serialNumber && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.serialNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Accuracy Class</label>
              <select
                {...register('accuracyClass')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              >
                <option value="Class I">Class I (Special Accuracy)</option>
                <option value="Class II">Class II (High Accuracy)</option>
                <option value="Class III">Class III (Medium Accuracy)</option>
                <option value="Class IIII">Class IIII (Ordinary Accuracy)</option>
              </select>
            </div>
          </div>

          {/* Metric limits */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity *</label>
              <input
                type="number"
                step="any"
                {...register('maxCapacity', { required: 'Required' })}
                placeholder="30"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Capacity</label>
              <input
                type="number"
                step="any"
                {...register('minCapacity')}
                placeholder="0.1"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
              <select
                {...register('unit')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              >
                <option value="kg">kg (Kilogram)</option>
                <option value="g">g (Gram)</option>
                <option value="mg">mg (Milligram)</option>
                <option value="t">t (Tonne)</option>
                <option value="L">L (Litre)</option>
                <option value="mL">mL (Millilitre)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interval 'e'</label>
              <input
                type="number"
                step="any"
                {...register('verificationScaleInterval_e')}
                placeholder="1"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Installation Location */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Installation & Premise Address</h2>
            <p className="text-xs text-slate-500">Physical location where the instrument is operated</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Premise Name</label>
              <input
                type="text"
                {...register('premiseName')}
                placeholder="e.g. Warehouse 3 / Retail Shop 12"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                {...register('addressLine1')}
                placeholder="Plot 45, MIDC Industrial Area"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                {...register('district')}
                placeholder="Mumbai Suburban"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                {...register('pincode')}
                placeholder="400001"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>
          </div>
        </div>

        {/* Section 3: File Uploads */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Statutory Documents & Photographs</h2>
            <p className="text-xs text-slate-500">Supporting model approval or invoice photo</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileUploader
              label="Instrument Photograph"
              description="Front view showing nameplate and serial number"
              accept=".png,.jpg,.jpeg"
              selectedFile={selectedPhoto}
              onFileSelect={setSelectedPhoto}
            />

            <FileUploader
              label="Invoice / Purchase Document"
              description="Official invoice or manufacturer calibration test certificate (PDF)"
              accept=".pdf,.png,.jpg"
              selectedFile={selectedDoc}
              onFileSelect={setSelectedDoc}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/applicant/instruments')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Submit Instrument Registration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
