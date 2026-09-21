import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import {
  Scale,
  Building2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Compass,
  CheckCircle2,
  FileCheck2,
  UploadCloud,
  Check,
  FileText,
  Camera,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { instrumentApi } from '../../services/instrumentApi';
import { stakeholderApi } from '../../services/stakeholderApi';
import { reverseGeocodeCoordinates } from '../../services/geocodingService';
import { useNativeGps } from '../../hooks/useNativeGps';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { FileUploader } from '../../components/common/FileUploader';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { BusinessProfileCard } from '../../components/applicant/BusinessProfileCard';

interface RegisterFormInputs {
  instrumentName: string;
  category: string;
  instrumentType?: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  maxCapacity: number | string;
  minCapacity?: number | string;
  unit: string;
  accuracyClass: string;
  verificationScaleInterval_e: string;
  approvalModelNumber?: string;
  // Installation Address
  premiseName: string;
  addressLine: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  declarationAccepted?: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'NON_AUTOMATIC_WEIGHING_INSTRUMENT', label: 'Non-Automatic Weighing Instrument (NAWI)', desc: 'Platform scales, counter scales, bench scales' },
  { value: 'AUTOMATIC_WEIGHING_INSTRUMENT', label: 'Automatic Weighing Instrument (AWI)', desc: 'Checkweighers, hopper scales, conveyor belt weighers' },
  { value: 'FUEL_DISPENSER', label: 'Fuel Dispenser / Petrol Pump', desc: 'Commercial petrol & diesel dispensing units' },
  { value: 'FLOW_METER', label: 'Flow Meter & Bulk Meter', desc: 'Industrial bulk liquid & gas flow meters' },
  { value: 'WEIGHBRIDGE', label: 'Weighbridge / Heavy Capacity Scale', desc: 'Heavy vehicle and axle weighing platforms' },
  { value: 'COUNTER_SCALE', label: 'Counter Scale / Commercial Shop Scale', desc: 'Retail grocery, trade and marketplace scales' },
  { value: 'PRECISION_BALANCE', label: 'Precision Balance / Laboratory Scale', desc: 'High accuracy Class I & Class II laboratory balances' },
  { value: 'MEASURING_TAPE', label: 'Measuring Tape & Length Standard', desc: 'Commercial tape measures and linear standards' },
  { value: 'STORAGE_TANK_CALIBRATION', label: 'Storage Tank Calibration & Dipstick', desc: 'Bulk petroleum & chemical storage tank dipsticks' },
];

const ACCURACY_CLASS_OPTIONS = [
  { value: 'CLASS_I_SPECIAL', label: 'Class I (Special Accuracy)' },
  { value: 'CLASS_II_HIGH', label: 'Class II (High Accuracy)' },
  { value: 'CLASS_III_MEDIUM', label: 'Class III (Medium Accuracy - Standard Trade)' },
  { value: 'CLASS_IIII_ORDINARY', label: 'Class IIII (Ordinary Accuracy)' },
];

const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg (Kilogram)' },
  { value: 'g', label: 'g (Gram)' },
  { value: 'mg', label: 'mg (Milligram)' },
  { value: 'tonnes', label: 'tonnes (Metric Tonne)' },
  { value: 'litres', label: 'litres (Litre)' },
  { value: 'metres', label: 'metres (Metre)' },
];

const STEPS = [
  { num: '01', title: 'Category', short: 'Category' },
  { num: '02', title: 'Instrument Details', short: 'Details' },
  { num: '03', title: 'Capacity & Accuracy', short: 'Capacity' },
  { num: '04', title: 'Installation Location', short: 'Location' },
  { num: '05', title: 'Documents', short: 'Documents' },
  { num: '06', title: 'Review & Submit', short: 'Review' },
];

export const RegisterInstrumentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<File | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Stakeholder profile status
  const [stakeholderStatus, setStakeholderStatus] = useState<'checking' | 'ready' | 'missing'>('checking');
  const [stakeholderBusinessName, setStakeholderBusinessName] = useState<string>('');
  const [showProfileCard, setShowProfileCard] = useState<boolean>(false);

  // Installation location GPS state
  const [locatingAddress, setLocatingAddress] = useState(false);
  const [addressLocationSuccess, setAddressLocationSuccess] = useState(false);
  const [addressLat, setAddressLat] = useState<number | null>(null);
  const [addressLon, setAddressLon] = useState<number | null>(null);
  const [addressLocationError, setAddressLocationError] = useState<string | null>(null);

  const { getCurrentPosition } = useNativeGps();

  // Exactly 10-second auto-dismiss for "Registration Error" toast popup
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
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    defaultValues: {
      category: 'NON_AUTOMATIC_WEIGHING_INSTRUMENT',
      accuracyClass: 'CLASS_III_MEDIUM',
      unit: 'kg',
      verificationScaleInterval_e: '1g',
      state: 'Maharashtra',
      declarationAccepted: false,
    },
  });

  const formValues = watch();

  // Verify Stakeholder Profile existence
  useEffect(() => {
    let isMounted = true;
    const verifyStakeholderProfile = async () => {
      if (user?.role === 'BUSINESS_USER') {
        try {
          const res = await stakeholderApi.getMyProfile();
          if (isMounted) {
            if (res.success && res.data) {
              setStakeholderStatus('ready');
              setStakeholderBusinessName(res.data.businessName || '');
              if (res.data.businessName) {
                setValue('premiseName', res.data.businessName);
              }
              if (res.data.registeredAddress) {
                const addr = res.data.registeredAddress;
                if (addr.street || (addr as any).line1) {
                  setValue('addressLine', addr.street || (addr as any).line1 || '');
                }
                if (addr.city) setValue('city', addr.city);
                if (addr.district) setValue('district', addr.district);
                if (addr.state) setValue('state', addr.state);
                if (addr.pincode) setValue('pincode', addr.pincode);
              }
            } else {
              setStakeholderStatus('missing');
            }
          }
        } catch {
          if (isMounted) {
            setStakeholderStatus('missing');
          }
        }
      } else {
        if (isMounted) {
          setStakeholderStatus('ready');
        }
      }
    };

    verifyStakeholderProfile();
    return () => {
      isMounted = false;
    };
  }, [user?.role, setValue]);

  // GPS Location handler for installation address
  const handleUseCurrentLocationForInstallation = async () => {
    setLocatingAddress(true);
    setAddressLocationError(null);
    setAddressLocationSuccess(false);

    try {
      const pos = await getCurrentPosition();
      if (!pos) {
        setAddressLocationError(
          'Location access unavailable or permission denied. Please enter address manually.'
        );
        return;
      }

      setAddressLat(pos.latitude);
      setAddressLon(pos.longitude);

      // Attempt reverse geocoding
      const geo = await reverseGeocodeCoordinates(pos.latitude, pos.longitude);

      if (geo.addressLine || geo.street) {
        setValue('addressLine', geo.addressLine || geo.street, { shouldValidate: true });
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

      setAddressLocationSuccess(true);
    } catch (err: any) {
      setAddressLocationError(
        err?.message || 'Failed to detect current location. Please fill address manually.'
      );
    } finally {
      setLocatingAddress(false);
    }
  };

  // Step advancement validation
  const handleNextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger(['category', 'instrumentName']);
    } else if (currentStep === 2) {
      isValid = await trigger(['manufacturer', 'modelNumber', 'serialNumber']);
    } else if (currentStep === 3) {
      isValid = await trigger(['maxCapacity', 'unit', 'accuracyClass', 'verificationScaleInterval_e']);
    } else if (currentStep === 4) {
      isValid = await trigger(['premiseName', 'addressLine', 'city', 'district', 'state', 'pincode']);
    } else if (currentStep === 5) {
      isValid = true; // Documents are optional but recommended
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (values: RegisterFormInputs) => {
    if (user?.role === 'BUSINESS_USER' && stakeholderStatus === 'missing') {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Registration Error',
        message: 'Please complete your stakeholder business profile before registering instruments.',
      });
      return;
    }

    if (!values.declarationAccepted) {
      setToast({
        id: String(Date.now()),
        type: 'warning',
        title: 'Declaration Required',
        message: 'Please accept the statutory declaration under the Legal Metrology Act, 2009.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        category: values.category,
        instrumentType: (values.instrumentType || values.instrumentName || '').trim(),
        manufacturer: values.manufacturer.trim(),
        modelNumber: values.modelNumber.trim(),
        serialNumber: values.serialNumber.trim(),
        capacity: {
          value: Number(values.maxCapacity),
          unit: values.unit.trim() || 'kg',
        },
        accuracyClass: values.accuracyClass,
        verificationScaleInterval_e: String(values.verificationScaleInterval_e).trim(),
        installationAddress: {
          premiseName: values.premiseName.trim(),
          addressLine: values.addressLine.trim(),
          city: values.city.trim(),
          district: values.district.trim(),
          state: values.state.trim(),
          pincode: values.pincode.trim(),
          latitude: addressLat ?? undefined,
          longitude: addressLon ?? undefined,
        },
      };

      if (values.minCapacity && String(values.minCapacity).trim() !== '') {
        payload.minimumCapacity_Min = String(values.minCapacity).trim();
      }

      if (values.approvalModelNumber && values.approvalModelNumber.trim() !== '') {
        payload.remarks = `Model Approval No: ${values.approvalModelNumber.trim()}`;
      }

      const res = await instrumentApi.createInstrument(payload);
      if (res.success && res.data) {
        const createdId = res.data._id;

        // Upload photo if provided
        if (selectedPhoto && createdId) {
          const formData = new FormData();
          formData.append('photo', selectedPhoto);
          await instrumentApi.uploadPhoto(createdId, formData).catch(() => {});
        }

        // Upload document if provided
        if (selectedDoc && createdId) {
          const docFormData = new FormData();
          docFormData.append('document', selectedDoc);
          await instrumentApi.uploadDocument(createdId, docFormData).catch(() => {});
        }

        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Instrument Registered',
          message: 'Instrument successfully enrolled into the National Legal Metrology Registry.',
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

  // 1. Missing Stakeholder Profile State
  if (user?.role === 'BUSINESS_USER' && stakeholderStatus === 'missing') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <PageHeader
          title="Register Instrument"
          description="Statutory enrollment of commercial weighing and measuring instruments"
          breadcrumbs={[
            { label: 'Dashboard', to: '/applicant/dashboard' },
            { label: 'Register Instrument' },
          ]}
        />

        {showProfileCard ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowProfileCard(false)}
              className="text-xs font-bold text-[#123B6D] hover:underline flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </button>
            <BusinessProfileCard
              onSuccess={() => {
                setStakeholderStatus('ready');
                setShowProfileCard(false);
              }}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <Building2 className="w-7 h-7" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Complete Business Profile
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Under the Legal Metrology Act, 2009, a registered Commercial Establishment Profile is
                strictly required before registering weighing and measuring devices.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowProfileCard(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-xl transition shadow-sm"
              >
                <Building2 className="w-4 h-4 text-amber-300" />
                <span>Complete Business Profile</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Header */}
      <PageHeader
        title="Register Commercial Instrument"
        description="Statutory enrollment under the Legal Metrology (Enforcement) Rules"
        breadcrumbs={[
          { label: 'Dashboard', to: '/applicant/dashboard' },
          { label: 'My Instruments', to: '/applicant/instruments' },
          { label: 'Register Instrument' },
        ]}
      />

      {/* Multi-step Progress Indicator */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
        {/* Desktop Step Flow */}
        <div className="hidden sm:flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;

            return (
              <React.Fragment key={step.num}>
                <button
                  type="button"
                  onClick={() => isCompleted && setCurrentStep(stepNum)}
                  disabled={!isCompleted}
                  className={`flex items-center gap-2.5 transition text-left ${
                    isCompleted ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-[#123B6D] text-white ring-4 ring-blue-100'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                  </div>
                  <div className="hidden md:block">
                    <p
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-[#123B6D]' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </button>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2.5 transition ${
                      currentStep > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile Step Header */}
        <div className="sm:hidden flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#123B6D] text-white flex items-center justify-center font-bold text-xs">
              0{currentStep}
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Step {currentStep} of 6: {STEPS[currentStep - 1].title}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#123B6D]">
            {Math.round((currentStep / 6) * 100)}%
          </span>
        </div>
        <div className="sm:hidden mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#123B6D] h-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-7">
          {/* STEP 1: Instrument Category */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#123B6D]" />
                  <span>Step 1: Instrument Category</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select the statutory classification under the Legal Metrology General Rules.
                </p>
              </div>

              {/* Commercial Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Instrument Commercial Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electronic Counter Scale, 50kg Platform Scale"
                  {...register('instrumentName', { required: 'Instrument commercial name is required' })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#123B6D] focus:ring-1 focus:ring-[#123B6D]"
                />
                {errors.instrumentName && (
                  <p className="text-rose-600 text-[11px]">{errors.instrumentName.message}</p>
                )}
              </div>

              {/* Category Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Statutory Category <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const selected = formValues.category === cat.value;
                    return (
                      <label
                        key={cat.value}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          selected
                            ? 'border-[#123B6D] bg-blue-50/60 ring-1 ring-[#123B6D]'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          value={cat.value}
                          {...register('category', { required: true })}
                          className="mt-0.5 text-[#123B6D] focus:ring-[#123B6D]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 leading-snug">{cat.label}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{cat.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Instrument Details */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#123B6D]" />
                  <span>Step 2: Instrument Specifications & Identification</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter manufacturer details, unique identification serial numbers and model approval.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Manufacturer Legal Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Avery India, Essae, Eagle Scale"
                    {...register('manufacturer', { required: 'Manufacturer name is required' })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#123B6D]"
                  />
                  {errors.manufacturer && (
                    <p className="text-rose-600 text-[11px]">{errors.manufacturer.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Model Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DS-215, PLAT-500"
                    {...register('modelNumber', { required: 'Model number is required' })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#123B6D]"
                  />
                  {errors.modelNumber && (
                    <p className="text-rose-600 text-[11px]">{errors.modelNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Unique Serial Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SN-2026-98124"
                    {...register('serialNumber', { required: 'Serial number is required' })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#123B6D]"
                  />
                  {errors.serialNumber && (
                    <p className="text-rose-600 text-[11px]">{errors.serialNumber.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Model Approval Certificate Number (DoCA)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IND/09/18/144"
                    {...register('approvalModelNumber')}
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#123B6D]"
                  />
                  <p className="text-[10px] text-slate-400">Optional: Statutory approval number issued by Central Metrology Directorate</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Capacity & Accuracy */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#123B6D]" />
                  <span>Step 3: Capacity & Metrological Accuracy</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define nominal capacity limits, accuracy classification and verification scale interval (e).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Maximum Capacity (Max) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 50"
                    {...register('maxCapacity', {
                      required: 'Maximum capacity is required',
                      min: { value: 0.0001, message: 'Capacity must be greater than zero' },
                    })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#123B6D]"
                  />
                  {errors.maxCapacity && (
                    <p className="text-rose-600 text-[11px]">{errors.maxCapacity.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Measurement Unit <span className="text-rose-600">*</span>
                  </label>
                  <select
                    {...register('unit', { required: true })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#123B6D]"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Accuracy Class <span className="text-rose-600">*</span>
                  </label>
                  <select
                    {...register('accuracyClass', { required: true })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-[#123B6D]"
                  >
                    {ACCURACY_CLASS_OPTIONS.map((ac) => (
                      <option key={ac.value} value={ac.value}>
                        {ac.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Verification Scale Interval (e) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5g, 10g, 0.1g"
                    {...register('verificationScaleInterval_e', {
                      required: 'Verification scale interval is required',
                    })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#123B6D]"
                  />
                  {errors.verificationScaleInterval_e && (
                    <p className="text-rose-600 text-[11px]">{errors.verificationScaleInterval_e.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Installation Location */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#123B6D]" />
                    <span>Step 4: Installation Location</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Specify the exact commercial establishment or industrial premises where the scale is deployed.
                  </p>
                </div>

                {/* GPS Location Button */}
                <button
                  type="button"
                  disabled={locatingAddress}
                  onClick={handleUseCurrentLocationForInstallation}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-[#123B6D] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition shrink-0"
                >
                  <Compass className={`w-4 h-4 ${locatingAddress ? 'animate-spin' : ''}`} />
                  <span>{locatingAddress ? 'Detecting Location...' : 'Use My Current Location'}</span>
                </button>
              </div>

              {/* GPS Confirmation / Error */}
              {addressLocationSuccess && addressLat && addressLon && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Location captured successfully</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] font-mono text-emerald-700">
                    <span>Latitude: {addressLat.toFixed(6)}</span>
                    <span>Longitude: {addressLon.toFixed(6)}</span>
                  </div>
                </div>
              )}

              {addressLocationError && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{addressLocationError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Premise / Shop / Establishment Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Trading Co, Unit 4 Central Market"
                  {...register('premiseName', { required: 'Premise name is required' })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#123B6D]"
                />
                {errors.premiseName && (
                  <p className="text-rose-600 text-[11px]">{errors.premiseName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Street / Address Line <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot 12, Market Road, Near Gandhi Chowk"
                  {...register('addressLine', { required: 'Address line is required' })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#123B6D]"
                />
                {errors.addressLine && (
                  <p className="text-rose-600 text-[11px]">{errors.addressLine.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    City <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('city', { required: 'City is required' })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#123B6D]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    District <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('district', { required: 'District is required' })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#123B6D]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    State <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('state', { required: 'State is required' })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-[#123B6D]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    PIN Code <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    {...register('pincode', {
                      required: 'PIN code is required',
                      pattern: { value: /^[1-9][0-9]{5}$/, message: 'Invalid 6-digit PIN' },
                    })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:border-[#123B6D]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Documents / Photographs */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#123B6D]" />
                  <span>Step 5: Instrument Photographs & Purchase Invoices</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload nameplate photo and purchase invoice to accelerate officer scrutiny and verification allotment.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Instrument Photograph (Nameplate / Front)
                  </label>
                  <FileUploader
                    accept="image/*"
                    maxSizeMb={5}
                    onFileSelected={(f) => setSelectedPhoto(f)}
                    description="Clear photograph showing capacity label and serial number"
                  />
                  {selectedPhoto && (
                    <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedPhoto.name}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Purchase Invoice / Calibration Certificate (PDF/Image)
                  </label>
                  <FileUploader
                    accept=".pdf,image/*"
                    maxSizeMb={10}
                    onFileSelected={(f) => setSelectedDoc(f)}
                    description="Manufacturer invoice or calibration proof"
                  />
                  {selectedDoc && (
                    <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedDoc.name}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Submit */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#123B6D]" />
                  <span>Step 6: Statutory Review & Declaration</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Carefully verify all statutory specifications before registering into the national database.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                    <span className="text-xs font-bold text-slate-900">
                      {formValues.category?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Commercial Name</span>
                    <span className="text-xs font-bold text-slate-900">{formValues.instrumentName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Serial Number</span>
                    <span className="text-xs font-mono font-bold text-[#123B6D]">{formValues.serialNumber}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Manufacturer / Model</span>
                    <span className="text-xs text-slate-800">
                      {formValues.manufacturer} ({formValues.modelNumber})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Capacity / Scale Interval</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {formValues.maxCapacity} {formValues.unit} (e = {formValues.verificationScaleInterval_e})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Accuracy Class</span>
                    <span className="text-xs text-slate-800">
                      {formValues.accuracyClass?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Installation Address</span>
                  <p className="text-xs font-medium text-slate-800 mt-0.5">
                    {formValues.premiseName}, {formValues.addressLine}, {formValues.city},{' '}
                    {formValues.district}, {formValues.state} - {formValues.pincode}
                  </p>
                  {addressLat && addressLon && (
                    <p className="text-[11px] font-mono text-emerald-700 mt-1">
                      GPS: {addressLat.toFixed(5)}, {addressLon.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>

              {/* Statutory Declaration Checkbox */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('declarationAccepted', { required: true })}
                    className="mt-0.5 text-[#123B6D] focus:ring-[#123B6D] rounded"
                  />
                  <div className="text-xs text-slate-700 leading-relaxed select-none">
                    <strong className="text-slate-900 block font-bold mb-0.5">
                      Statutory Declaration under Section 24 of the Legal Metrology Act, 2009
                    </strong>
                    I hereby declare that the particulars furnished above are true, accurate and complete.
                    The instrument is installed at the designated commercial premises and is ready for
                    inspection by the authorized Legal Metrology Officer.
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Form Navigation Buttons */}
          <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <Link
                to="/applicant/instruments"
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                Cancel
              </Link>
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition shadow-xs min-h-[44px]"
              >
                <span>Continue to Step 0{currentStep + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0D2B4F] rounded-lg transition shadow-sm disabled:opacity-50 min-h-[44px]"
              >
                <FileCheck2 className="w-4 h-4 text-amber-300" />
                <span>{submitting ? 'Registering...' : 'Submit Instrument Registration'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
