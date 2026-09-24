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

export const LoginPage: React.FC = () => {
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
        import('../applicant/ApplicantDashboard');
      } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        import('../admin/AdminDashboard');
      } else {
        import('../officer/OfficerDashboard');
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
    <div className="min-h-screen bg-[#f5f7fa] text-[#102a4c] flex flex-col">
      {/* TOP BAR */}
      <div className="bg-[#123b6d] text-white">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs sm:text-sm">
          <span>🇮🇳 Government of India</span>

          <span className="hidden sm:block">
            e-Maap Verify
          </span>
        </div>
      </div>

      {/* MAIN LOGIN AREA */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* LOGIN CARD */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            {/* CARD HEADER */}
            <div className="px-5 sm:px-7 pt-7 pb-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-lg bg-[#eaf2fa] flex items-center justify-center">
                  <Scale className="w-6 h-6 text-[#123b6d]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#123b6d]">
                    e-Maap Verify
                  </h1>
                  <p className="text-xs text-slate-500">
                    Legal Metrology Verification Portal
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-[#123b6d]">
                Login
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter your account details to continue
              </p>
            </div>

            {/* FORM AREA */}
            <div className="px-5 sm:px-7 py-6">
              {/* ERROR */}
              {serverError && (
                <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>
                    {typeof serverError === 'object'
                      ? JSON.stringify(serverError)
                      : String(serverError)}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email / Username
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                      className="w-full h-11 pl-11 pr-4 border border-slate-300 rounded-lg bg-white text-sm text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1.5">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      {...register('password', {
                        required: 'Password is required',
                      })}
                      className="w-full h-11 pl-11 pr-11 border border-slate-300 rounded-lg bg-white text-sm text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#123b6d]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 mt-1.5">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* ROLE */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Select Portal Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) =>
                      handleRoleChange(e.target.value as UserRole)
                    }
                    className="w-full h-11 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-700 focus:outline-none focus:border-[#123b6d] focus:ring-2 focus:ring-[#123b6d]/10"
                  >
                    <option value="">Select your role (Optional)</option>
                    {ROLE_CARDS.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.title}
                      </option>
                    ))}
                  </select>
                  {selectedRole && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      {ROLE_CARDS.find((role) => role.id === selectedRole)?.subtitle}
                    </p>
                  )}
                </div>

                {/* REMEMBER + FORGOT */}
                <div className="flex items-center justify-between gap-3 text-sm">
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

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  disabled={submitting}
                  onMouseEnter={() =>
                    selectedRole && prefetchDashboard(selectedRole)
                  }
                  onFocus={() =>
                    selectedRole && prefetchDashboard(selectedRole)
                  }
                  className="w-full h-11 bg-[#123b6d] hover:bg-[#0d2f58] disabled:bg-[#123b6d]/60 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  {submitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Login
                    </>
                  )}
                </button>
              </form>

              {/* QUICK DEMO CREDENTIALS HELPER */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                    <div className="font-semibold text-[#123b6d] truncate">Super Admin</div>
                    <div className="text-[10px] text-slate-500 truncate">satyam@gmail.com</div>
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
                    <div className="font-semibold text-[#123b6d] truncate">Admin</div>
                    <div className="text-[10px] text-slate-500 truncate">arman@gmail.com</div>
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
                    <div className="font-semibold text-[#123b6d] truncate">LMO Officer</div>
                    <div className="text-[10px] text-slate-500 truncate">shweta@gmail.com</div>
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
                    <div className="font-semibold text-[#123b6d] truncate">GATC Officer</div>
                    <div className="text-[10px] text-slate-500 truncate">arun@gmail.com</div>
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
                    <div className="font-semibold text-[#123b6d] truncate">Field Officer</div>
                    <div className="text-[10px] text-slate-500 truncate">mpnihal@gmail.com</div>
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
                    <div className="font-semibold text-[#123b6d] truncate">Business User</div>
                    <div className="text-[10px] text-slate-500 truncate">arpit@gmail.com</div>
                  </button>
                </div>
              </div>

              {/* QR VERIFICATION */}
              <div className="mt-5 pt-5 border-t border-slate-200">
                <Link
                  to="/verify-certificate"
                  className="w-full h-11 border border-[#159447] bg-[#f4fff8] hover:bg-[#eafaf0] text-[#123b6d] rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  <QrCode className="w-5 h-5" />
                  Verify Certificate
                </Link>
              </div>

              {/* SECURITY */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-[#159447]" />
                <span>Secure Government Portal</span>
              </div>
            </div>

            {/* BACK TO PORTAL */}
            <div className="border-t border-slate-200 px-5 py-4 text-center">
              <Link
                to="/portal"
                className="text-sm text-[#07549a] font-semibold hover:underline"
              >
                ← Back to Public Portal
              </Link>
            </div>
          </div>

          {/* COPYRIGHT */}
          <p className="text-center text-xs text-slate-400 mt-5">
            © Department of Consumer Affairs, Government of India
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#123b6d] text-white text-center py-3 px-4">
        <p className="text-[10px] sm:text-xs opacity-90">
          e-Maap Verify • Legal Metrology Verification System
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;
