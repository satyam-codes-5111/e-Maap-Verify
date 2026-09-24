import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Scale,
  AlertCircle,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  Phone,
  FileText,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { authApi, RegisterBusinessPayload } from '../../services/authApi';

interface RegisterFormData {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  tradeLicenseNumber?: string;
  state?: string;
  district?: string;
  city?: string;
  street?: string;
  pincode?: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
  isModal?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  isModal = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      state: 'Delhi',
      district: 'Central',
      city: 'Delhi',
    },
  });

  const passwordVal = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const payload: RegisterBusinessPayload = {
        name: data.name.trim(),
        businessName: data.businessName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        password: data.password,
        tradeLicenseNumber: data.tradeLicenseNumber?.trim() || undefined,
        businessType: 'RETAILER',
        registeredAddress: {
          street: data.street?.trim() || 'Main Commercial Road',
          city: data.city?.trim() || 'District HQ',
          district: data.district?.trim() || 'Central',
          state: data.state?.trim() || 'Delhi',
          pincode: data.pincode?.trim() || '110001',
        },
      };

      const res = await authApi.register(payload);
      if (res.success) {
        setRegisteredSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please verify your details.';
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (registeredSuccess) {
    return (
      <div className="w-full py-4 text-center">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#123b6d] mb-2">
          Registration Successful!
        </h3>
        <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto leading-relaxed">
          Your Business User account has been registered under the Legal Metrology portal. You can now login with your credentials to access the Applicant Dashboard.
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full h-11 bg-[#123b6d] hover:bg-[#0d2f58] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm"
        >
          Proceed to Login
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className={`${isModal ? 'pb-2 pr-8' : 'pt-7 pb-2'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#eaf2fa] flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-[#123b6d]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#123b6d] leading-snug">
              e-Maap Verify
            </h1>
            <p className="text-xs text-slate-500">
              Legal Metrology Verification Portal
            </p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-[#123b6d]">
          Business User Registration
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Create an applicant account to verify weighing & measuring instruments
        </p>

        {/* ROLE NOTICE BADGE */}
        <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[#123b6d] text-[11px] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#07549a] shrink-0" />
          <span>Public signup is strictly reserved for <strong>Business Applicants</strong>.</span>
        </div>
      </div>

      {/* FORM AREA */}
      <div className={`${isModal ? 'pt-2' : 'py-5'}`}>
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
            <span>
              {typeof serverError === 'object'
                ? JSON.stringify(serverError)
                : String(serverError)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          {/* FULL NAME */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Minimum 2 characters required' },
                })}
                className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* BUSINESS / COMPANY NAME */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Business / Company Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Apex Traders Pvt Ltd"
                {...register('businessName', {
                  required: 'Business / Company name is required',
                  minLength: { value: 2, message: 'Minimum 2 characters required' },
                })}
                className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
              />
            </div>
            {errors.businessName && (
              <p className="text-[11px] text-red-600 mt-1">
                {errors.businessName.message}
              </p>
            )}
          </div>

          {/* EMAIL & MOBILE NUMBER ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  {...register('phone', {
                    required: 'Mobile number is required',
                    pattern: {
                      value: /^[6-9]\d{9}$/,
                      message: 'Valid 10-digit Indian mobile required',
                    },
                  })}
                  className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* TRADE LICENSE & PINCODE ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trade License No. <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. TL-2026-9876"
                  {...register('tradeLicenseNumber')}
                  className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pincode <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="6-digit pincode"
                  {...register('pincode', {
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'Valid 6-digit pincode required',
                    },
                  })}
                  className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
                />
              </div>
              {errors.pincode && (
                <p className="text-[11px] text-red-600 mt-1">{errors.pincode.message}</p>
              )}
            </div>
          </div>

          {/* PASSWORD & CONFIRM PASSWORD ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'At least 8 characters required',
                    },
                  })}
                  className="w-full h-10 pl-9 pr-9 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#123b6d]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) =>
                      val === passwordVal || 'Passwords do not match',
                  })}
                  className="w-full h-10 pl-9 pr-9 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#123b6d]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-[#123b6d] hover:bg-[#0d2f58] disabled:bg-[#123b6d]/60 text-white rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm mt-4 cursor-pointer"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Business Account...
              </>
            ) : (
              <>
                <span>Register as Business User</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* ALREADY HAVE AN ACCOUNT? LOGIN */}
        <div className="mt-4 pt-3.5 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-[#07549a] hover:underline cursor-pointer ml-1"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
