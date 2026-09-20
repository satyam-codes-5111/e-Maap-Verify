import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../services/notificationApi';
import {
  Menu,
  Bell,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await notificationApi.getUnreadCount();
        if (isMounted && res.success && res.data) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch {
        // silent fallback
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s poll
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getProfileLink = () => {
    if (user?.role === 'BUSINESS_USER') return '/applicant/profile';
    if (user?.role?.includes('OFFICER')) return '/officer/profile';
    return '/admin/profile';
  };

  const getNotificationLink = () => {
    if (user?.role === 'BUSINESS_USER') return '/applicant/notifications';
    if (user?.role?.includes('OFFICER')) return '/officer/notifications';
    return '/admin/notifications';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      {/* National Tricolor Top Strip */}
      <div className="h-1 w-full flex">
        <div className="h-full flex-1 bg-[#FF9933]" title="Saffron" />
        <div className="h-full flex-1 bg-white" title="White" />
        <div className="h-full flex-1 bg-[#138808]" title="India Green" />
      </div>

      <div className="h-15 px-4 sm:px-6 flex items-center justify-between">
        {/* Left side: Hamburger + Official Government Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs tracking-tight truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span className="truncate">भारत सरकार • Government of India</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate hidden sm:block">
              Department of Consumer Affairs | Legal Metrology Division
            </div>
          </div>
        </div>

        {/* Right side: Public verify link + Notifications + User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Certificate Verification */}
          <Link
            to="/verify-certificate"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Verify Certificate</span>
            <ExternalLink className="w-3 h-3 text-teal-600" />
          </Link>

          {/* Notifications */}
          <Link
            to={getNotificationLink()}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User dropdown toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition text-left focus:outline-hidden min-h-[44px]"
            >
              <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block overflow-hidden">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                  {user?.name || 'User'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">
                  {user?.role?.replace(/_/g, ' ')}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in text-xs">
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                    <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                        {user?.role}
                      </span>
                      {user?.jurisdiction?.district && (
                        <span className="text-[10px] font-medium text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded">
                          {user.jurisdiction.district}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={getProfileLink()}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Account & Official Profile</span>
                  </Link>

                  <Link
                    to="/verify-certificate"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition md:hidden"
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    <span>Public Verify Certificate</span>
                  </Link>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-600 hover:bg-rose-50 transition font-medium text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out Securely</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
