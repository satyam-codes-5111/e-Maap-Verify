import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Scale,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

interface RoleOption {
  id: UserRole;
  title: string;
  subtitle: string;
}

const ROLE_CARDS: RoleOption[] = [
  {
    id: 'BUSINESS_USER',
    title: 'Business Trader / Applicant',
    subtitle: 'Apply for verification, track applications, and download certificates',
  },
  {
    id: 'LEGAL_METROLOGY_OFFICER',
    title: 'Legal Metrology Officer (LMO)',
    subtitle: 'Review applications, conduct inspections, and issue certificates',
  },
  {
    id: 'FIELD_VERIFICATION_OFFICER',
    title: 'Field Verification Officer',
    subtitle: 'On-site verification and stamping inspections',
  },
  {
    id: 'GATC_OFFICER',
    title: 'GATC Officer',
    subtitle: 'Government Approved Test Centre inspection & verification',
  },
  {
    id: 'ADMIN',
    title: 'Portal Administrator',
    subtitle: 'Manage portal configurations, users, and statewide analytics',
  },
  {
    id: 'SUPER_ADMIN',
    title: 'Super Administrator',
    subtitle: 'Full system administration and national oversight',
  },
];

interface LoginFormInputs {
  email: string;
  password: string;
}

export interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  isModal?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  isModal = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getRoleRedirectPath } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  const handleRoleChange = (role: UserRole | '') => {
    setSelectedRole(role);
  };

  const prefetchDashboard = (role: UserRole) => {
    try {
      if (role === 'BUSINESS_USER') {
        import('../../pages/applicant/ApplicantDashboard');
      } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        import('../../pages/admin/AdminDashboard');
      } else {
        import('../../pages/officer/OfficerDashboard');
      }
    } catch {
      // Best-effort prefetch
    }
  };

  const onSubmit = async (data: LoginFormInputs) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const loggedInUser = await login(
        data.email.trim(),
        data.password,
        selectedRole ? (selectedRole as UserRole) : undefined
      );

      if (onSuccess) {
        onSuccess();
      }

      const from = (location.state as any)?.from?.pathname || getRoleRedirectPath(loggedInUser.role);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* CARD / MODAL HEADER */}
      <div className={`${isModal ? 'pb-3 pr-8' : 'pt-7 pb-2'}`}>
        <div className="flex items-center gap-3 mb-3">
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
          Login
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Enter your account details to continue
        </p>
      </div>

      {/* FORM AREA */}
      <div className={`${isModal ? 'pt-2' : 'py-6'}`}>
        {/* ERROR MESSAGE */}
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* EMAIL */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Email / Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className="w-full h-10 sm:h-11 pl-10 sm:pl-11 pr-4 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                {...register('password', {
                  required: 'Password is required',
                })}
                className="w-full h-10 sm:h-11 pl-10 sm:pl-11 pr-10 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#123b6d]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* ROLE SELECT */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Select Portal Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) =>
                handleRoleChange(e.target.value as UserRole)
              }
              className="w-full h-10 sm:h-11 px-3 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
            >
              <option value="">Select your role (Optional)</option>
              {ROLE_CARDS.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
            {selectedRole && (
              <p className="mt-1 text-[11px] text-slate-500">
                {ROLE_CARDS.find((role) => role.id === selectedRole)?.subtitle}
              </p>
            )}
          </div>

          {/* REMEMBER + FORGOT PASSWORD */}
          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300"
              />
              <span>Remember Me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-[#07549a] font-semibold hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            onMouseEnter={() =>
              selectedRole && prefetchDashboard(selectedRole)
            }
            onFocus={() =>
              selectedRole && prefetchDashboard(selectedRole)
            }
            className="w-full h-10 sm:h-11 bg-[#123b6d] hover:bg-[#0d2f58] disabled:bg-[#123b6d]/60 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Login
              </>
            )}
          </button>
        </form>

        {/* SIGN UP CALLOUT */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Don't have an account?{' '}
            {onSwitchToRegister ? (
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-bold text-[#07549a] hover:underline cursor-pointer ml-1"
              >
                Sign Up
              </button>
            ) : (
              <Link
                to="/register"
                className="font-bold text-[#07549a] hover:underline ml-1"
              >
                Sign Up
              </Link>
            )}
          </p>
        </div>

        {/* QUICK DEMO CREDENTIALS HELPER */}
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Quick Demo Login:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setValue('email', 'satyam@gmail.com');
                setValue('password', 'Satyam@00');
                setSelectedRole('SUPER_ADMIN');
              }}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-left transition border border-transparent hover:border-slate-300"
            >
              <div className="font-semibold text-[#123b6d] truncate text-[11px]">Super Admin</div>
              <div className="text-[9px] text-slate-500 truncate">satyam@gmail.com</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'arman@gmail.com');
                setValue('password', 'Arman@00');
                setSelectedRole('ADMIN');
              }}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-left transition border border-transparent hover:border-slate-300"
            >
              <div className="font-semibold text-[#123b6d] truncate text-[11px]">Admin</div>
              <div className="text-[9px] text-slate-500 truncate">arman@gmail.com</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'shweta@gmail.com');
                setValue('password', 'Shweta@00');
                setSelectedRole('LEGAL_METROLOGY_OFFICER');
              }}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-left transition border border-transparent hover:border-slate-300"
            >
              <div className="font-semibold text-[#123b6d] truncate text-[11px]">LMO Officer</div>
              <div className="text-[9px] text-slate-500 truncate">shweta@gmail.com</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'arun@gmail.com');
                setValue('password', 'Arun@00');
                setSelectedRole('GATC_OFFICER');
              }}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-left transition border border-transparent hover:border-slate-300"
            >
              <div className="font-semibold text-[#123b6d] truncate text-[11px]">GATC Officer</div>
              <div className="text-[9px] text-slate-500 truncate">arun@gmail.com</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'mpnihal@gmail.com');
                setValue('password', 'Nihal@00');
                setSelectedRole('FIELD_VERIFICATION_OFFICER');
              }}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-left transition border border-transparent hover:border-slate-300"
            >
              <div className="font-semibold text-[#123b6d] truncate text-[11px]">Field Officer</div>
              <div className="text-[9px] text-slate-500 truncate">mpnihal@gmail.com</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'arpit@gmail.com');
                setValue('password', 'Arpit@00');
                setSelectedRole('BUSINESS_USER');
              }}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-left transition border border-transparent hover:border-slate-300"
            >
              <div className="font-semibold text-[#123b6d] truncate text-[11px]">Business User</div>
              <div className="text-[9px] text-slate-500 truncate">arpit@gmail.com</div>
            </button>
          </div>
        </div>

        {/* VERIFY CERTIFICATE BUTTON */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Link
            to="/verify-certificate"
            onClick={() => {
              if (onSuccess) onSuccess();
            }}
            className="w-full h-10 border border-[#159447] bg-[#f4fff8] hover:bg-[#eafaf0] text-[#123b6d] rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
          >
            <QrCode className="w-4 h-4 text-[#159447]" />
            Verify Certificate
          </Link>
        </div>

        {/* SECURITY BADGE */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#159447]" />
          <span>Secure Government Portal</span>
        </div>
      </div>
    </div>
  );
};
