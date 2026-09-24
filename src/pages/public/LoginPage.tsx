import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { RegisterForm } from '../../components/auth/RegisterForm';

interface LoginPageProps {
  initialMode?: 'login' | 'register';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode }) => {
  const location = useLocation();
  const isRegisterRoute =
    initialMode === 'register' ||
    location.pathname === '/register' ||
    location.pathname === '/signup';

  const [view, setView] = useState<'login' | 'register'>(
    isRegisterRoute ? 'register' : 'login'
  );

  useEffect(() => {
    if (
      location.pathname === '/register' ||
      location.pathname === '/signup' ||
      initialMode === 'register'
    ) {
      setView('register');
    } else {
      setView('login');
    }
  }, [location.pathname, initialMode]);

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#102a4c] flex flex-col">
      {/* TOP GOVERNMENT BAR */}
      <div className="bg-[#123b6d] text-white">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs sm:text-sm">
          <span>🇮🇳 Government of India</span>
          <span className="hidden sm:block">e-Maap Verify</span>
        </div>
      </div>

      {/* MAIN LOGIN / REGISTER AREA */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md sm:max-w-[490px]">
          {/* AUTH CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden px-5 sm:px-8 py-2">
            {view === 'login' ? (
              <LoginForm
                isModal={false}
                onSwitchToRegister={() => setView('register')}
              />
            ) : (
              <RegisterForm
                isModal={false}
                onSwitchToLogin={() => setView('login')}
              />
            )}

            {/* BACK TO PORTAL */}
            <div className="border-t border-slate-200 py-3.5 text-center mt-2">
              <Link
                to="/"
                className="text-xs sm:text-sm text-[#07549a] font-semibold hover:underline"
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
