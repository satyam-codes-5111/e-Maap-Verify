import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import heroImage from './images/legal-metrology-hero.webp';

import { getErrorMessage } from '../../services/api';
import { UserRole } from '../../types';
import {
  Scale,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Users,
  Eye,
  EyeOff,
  LogIn,
  QrCode,
  FileText,
  UserCheck,
  Award,
  MapPin,
} from 'lucide-react';

interface LoginFormInputs {
  email: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const { user, login, getRoleRedirectPath, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = React.useRef(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect immediately to the user's role dashboard
  useEffect(() => {
    if (!loading && user) {
      const destination = getRoleRedirectPath(user.role);
      navigate(destination, { replace: true });
    }
  }, [user, loading, getRoleRedirectPath, navigate]);

  // Prefetch target dashboard bundle during idle/selection time to eliminate post-login chunk latency
  const prefetchDashboard = (role: UserRole | '') => {
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      import('../admin/AdminDashboard');
    } else if (
      role === 'LEGAL_METROLOGY_OFFICER' ||
      role === 'FIELD_VERIFICATION_OFFICER' ||
      role === 'GATC_OFFICER'
    ) {
      import('../officer/OfficerDashboard');
    } else if (role === 'BUSINESS_USER') {
      import('../applicant/ApplicantDashboard');
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleRoleChange = (role: UserRole | '') => {
    setSelectedRole(role);
    setServerError(null);
    if (role) {
      prefetchDashboard(role);
    }
  };

  const onSubmit = async (data: LoginFormInputs) => {
    if (submitting || isSubmittingRef.current) return;
    setServerError(null);

    if (!selectedRole) {
      setServerError('Please select your role.');
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      const authUser = await login(data.email, data.password, selectedRole);

      if (authUser?.role !== selectedRole) {
        setServerError('Selected role does not match this account.');
        return;
      }

      const roleDefault = getRoleRedirectPath(authUser?.role);
      const requested = (location.state as any)?.from?.pathname;

      let destination = roleDefault;

      if (
        requested &&
        typeof requested === 'string' &&
        !['/login', '/', '/dashboard'].includes(requested)
      ) {
        if (
          (authUser.role === 'BUSINESS_USER' &&
            requested.startsWith('/applicant')) ||
          (
            [
              'LEGAL_METROLOGY_OFFICER',
              'FIELD_VERIFICATION_OFFICER',
              'GATC_OFFICER',
            ].includes(authUser.role) &&
            requested.startsWith('/officer')
          ) ||
          (
            ['SUPER_ADMIN', 'ADMIN'].includes(authUser.role) &&
            (
              requested.startsWith('/admin') ||
              requested.startsWith('/officer') ||
              requested.startsWith('/applicant')
            )
          )
        ) {
          destination = requested;
        }
      }

      navigate(destination, { replace: true });
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f8fc] text-[#102a4c] flex flex-col overflow-x-hidden">

      {/* TOP GOVERNMENT BAR */}
      <div className="bg-[#07366b] text-white">
        

        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base sm:text-lg">🇮🇳</span>

            <span className="hidden sm:inline text-white/60">|</span>

            <span className="hidden sm:inline text-xs sm:text-sm font-medium">
              Government of India
            </span>
          </div>
        </div>
      </div>

      {/* GOVERNMENT IDENTITY HEADER */}
      <div className="h-auto w-full">
      
      <header className="bg-white border-b border-slate-200 ">
        
        <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-5">
          <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-5">

            {/* LEFT */}
            <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <div className="text-4xl sm:text-5xl shrink-0">
              ⚖️
            </div>

            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight text-[#123b6d]">
                उपभोक्ता मामले विभाग
              </h1>

              <p className="text-sm sm:text-base font-semibold text-[#123b6d]">
                Department of Consumer Affairs
              </p>

              <p className="text-[10px] sm:text-xs text-slate-600">
                Ministry of Consumer Affairs, Food & Public Distribution
              </p>

              <p className="text-[10px] sm:text-xs text-slate-600">
                Government of India
              </p>
            </div>
          </div>

            {/* CENTER */}
           

            {/* RIGHT */}
            
          </div>
        </div>

        
      </header>
</div>
      {/* MAIN LOGIN AREA */}
      <main className="flex-1 w-full">

        <div className="min-h-[calc(100vh-190px)] lg:min-h-[680px] grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">

          {/* LEFT HERO */}
          <section className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-0 overflow-hidden">

            {/* BACKGROUND IMAGE */}
            <img
              src={heroImage}
              alt="Legal Metrology Verification"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />

            {/* IMAGE OVERLAY */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#002f61]/90 via-[#06447b]/55 to-[#0a4775]/20" />

            <div className="absolute inset-0 bg-gradient-to-t from-[#002d5d] via-transparent to-white/10" />

            {/* HERO CONTENT */}
            <div className="relative z-10 h-full min-h-[520px] sm:min-h-[580px] lg:min-h-0 flex flex-col justify-between px-5 sm:px-8 md:px-12 lg:px-14 xl:px-20 py-10 sm:py-12 lg:py-14 text-white">

              <div className="max-w-3xl">

                <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight">
                  e-Maap Verify
                </h1>

                <h2 className="mt-4 text-xl sm:text-2xl md:text-3xl font-bold leading-tight max-w-2xl">
                  Digital Platform for Verification & Certification
                  <br className="hidden sm:block" />
                  of Weighing and Measuring Instruments
                </h2>

                <p className="mt-5 text-sm sm:text-base md:text-lg leading-relaxed text-white/90 max-w-xl">
                  Ensuring accuracy, fairness and consumer protection
                  through technology and transparency.
                </p>
              </div>

              {/* FEATURES */}
              <div className="mt-10">

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 sm:gap-6">

                  <Feature
                    icon={<FileText />}
                    title={
                      <>
                        Online
                        <br />
                        Applications
                      </>
                    }
                  />

                  <Feature
                    icon={<UserCheck />}
                    title={
                      <>
                        Field
                        <br />
                        Verification
                      </>
                    }
                  />

                  <Feature
                    icon={<Award />}
                    title={
                      <>
                        Certificate
                        <br />
                        Generation
                      </>
                    }
                  />

                  <Feature
                    icon={<QrCode />}
                    title={
                      <>
                        QR
                        <br />
                        Verification
                      </>
                    }
                  />

                  <Feature
                    icon={<MapPin />}
                    title={
                      <>
                        Application
                        <br />
                        Tracking
                      </>
                    }
                  />
                </div>

                <div className="mt-7 pt-5 border-t border-white/30 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Secure
                  </span>

                  <span className="hidden sm:inline">|</span>

                  <span>Transparent</span>

                  <span className="hidden sm:inline">|</span>

                  <span>Efficient</span>

                  <span className="hidden sm:inline">|</span>

                  <span>Citizen Centric</span>
                </div>

                <div className="mt-7 text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <span>🇮🇳</span>
                  <span>A Government of India Initiative</span>
                  <span>🇮🇳</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT LOGIN */}
          <section className=" bg-[#f4f8fc] flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">

            <div className="h-auto w-full max-w-[540px] bg-white border border-slate-200 rounded-xl shadow-lg">

              {/* CARD HEADER */}
              <div className="px-5 sm:px-7 md:px-8 pt-6 sm:pt-8">

                <h2 className="text-2xl sm:text-3xl font-bold text-[#123b6d]">
                  Login to Your Account
                </h2>

                <p className="mt-2 text-sm sm:text-base text-slate-600">
                  Access your dashboard and manage your applications
                </p>
              </div>

              <div className="px-5 sm:px-7 md:px-8 py-6 sm:py-7">

                {/* ERROR */}
                {serverError && (
                  <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{typeof serverError === 'object' ? JSON.stringify(serverError) : String(serverError)}</span>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5"
                >

                  {/* EMAIL */}
                  <div>
                    <label className="block text-sm font-semibold text-[#17375e] mb-2">
                      Email / Username
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#17375e]" />

                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="Email / Username"
                        {...register('email', {
                          required: 'Email address is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        className="w-full h-12 pl-11 pr-4 border border-slate-300 rounded-lg bg-white text-sm sm:text-base text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/15"
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
                    <label className="block text-sm font-semibold text-[#17375e] mb-2">
                      Password
                    </label>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#17375e]" />

                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Password"
                        {...register('password', {
                          required: 'Password is required',
                        })}
                        className="w-full h-12 pl-11 pr-11 border border-slate-300 rounded-lg bg-white text-sm sm:text-base text-[#102a4c] placeholder-slate-400 focus:outline-none focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/15"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#123b6d]"
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

                  {/* REMEMBER / FORGOT */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">

                    <label className="flex items-center gap-2 text-[#17375e] cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span>Remember Me</span>
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-[#0066cc] hover:underline font-semibold"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* ROLE */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-[#17375e] mb-2">
                      <Users className="w-5 h-5" />
                      Select Role
                    </label>

                    <select
                      value={selectedRole}
                      onChange={(e) =>
                        handleRoleChange(e.target.value as UserRole | '')
                      }
                      className="w-full h-12 px-4 border border-slate-300 rounded-lg bg-white text-sm sm:text-base text-slate-600 focus:outline-none focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/15 cursor-pointer"
                    >
                      <option value="">Select Role</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="ADMIN">Admin</option>
                      <option value="LEGAL_METROLOGY_OFFICER">
                        Legal Metrology Officer
                      </option>
                      <option value="FIELD_VERIFICATION_OFFICER">
                        Field Verification Officer
                      </option>
                      <option value="GATC_OFFICER">
                        GATC Officer
                      </option>
                      <option value="BUSINESS_USER">
                        Business User
                      </option>
                    </select>
                  </div>

                  {/* LOGIN */}
                  <button
                    type="submit"
                    disabled={submitting}
                    onMouseEnter={() => selectedRole && prefetchDashboard(selectedRole)}
                    onFocus={() => selectedRole && prefetchDashboard(selectedRole)}
                    className="w-full min-h-[48px] bg-[#07549a] hover:bg-[#06457d] disabled:bg-[#07549a]/60 text-white rounded-lg font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-sm"
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

                {/* OR */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-sm text-slate-500 font-semibold">
                    OR
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* QR */}
                <Link
                  to="/verify-certificate"
                  className="w-full min-h-[48px] border border-[#159447] bg-[#f2fff7] hover:bg-[#e7f9ef] text-[#17375e] rounded-lg font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition"
                >
                  <QrCode className="w-5 h-5" />
                  Verify Certificate (QR)
                </Link>

                {/* SECURITY */}
                <div className="mt-5 p-4 rounded-lg border border-blue-200 bg-blue-50">
                  <div className="flex gap-3">
                    <ShieldCheck className="w-6 h-6 text-[#07549a] shrink-0" />

                    <div>
                      <div className="text-sm font-bold text-[#07549a]">
                        This is a secure government portal
                      </div>

                      <div className="text-xs sm:text-sm text-slate-600 mt-1">
                        Your data is protected and encrypted.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PUBLIC LINK */}
              <div className="border-t border-slate-200 px-5 sm:px-7 md:px-8 py-4 text-center">
                <Link
                  to="/portal"
                  className="text-sm text-[#07549a] hover:underline font-semibold"
                >
                  ← Back to Public Portal
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#063568] text-white px-4 sm:px-6 py-4">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 text-[10px] sm:text-xs">

          <div className="text-center lg:text-left">
            Department of Consumer Affairs
            <span className="mx-2 opacity-60">|</span>
            Ministry of Consumer Affairs, Food & Public Distribution
            <span className="mx-2 opacity-60">|</span>
            Government of India
          </div>

          <div className="flex items-center gap-3">
            <span>Help</span>
            <span>|</span>
            <span>Privacy Policy</span>
            <span>|</span>
            <span>Terms & Conditions</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureProps {
  icon: React.ReactNode;
  title: React.ReactNode;
}

const Feature: React.FC<FeatureProps> = ({ icon, title }) => {
  return (
    <div className="flex flex-col items-center text-center min-w-0">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white/50 flex items-center justify-center text-white">
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: 'w-7 h-7 sm:w-8 sm:h-8',
        })}
      </div>

      <div className="mt-3 text-xs sm:text-sm font-bold leading-snug">
        {title}
      </div>
    </div>
  );
};