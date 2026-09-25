import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Scale,
  Building2,
} from 'lucide-react';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
  pageTitle?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileSidebar, pageTitle: propPageTitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
    const handleFocus = () => fetchUnread();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('notifications:refresh', handleFocus);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('notifications:refresh', handleFocus);
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

  const formatRoleTitle = (role?: string): string => {
    switch (role) {
      case 'LEGAL_METROLOGY_OFFICER':
        return 'Legal Metrology Officer (LMO)';
      case 'FIELD_VERIFICATION_OFFICER':
        return 'Field Verification Officer';
      case 'GATC_OFFICER':
        return 'GATC Laboratory Officer';
      case 'SUPER_ADMIN':
        return 'Super Administrator';
      case 'ADMIN':
        return 'Administrator';
      case 'BUSINESS_USER':
        return 'Business Applicant';
      default:
        return 'Authorized Officer';
    }
  };

  // Derive dynamic page title if not supplied
  const derivePageTitle = (pathname: string): string => {
    if (propPageTitle) return propPageTitle;
    if (pathname.includes('/officer/dashboard')) return 'Officer Command Dashboard';
    if (pathname.includes('/officer/schedules')) return 'Verification Schedules';
    if (pathname.includes('/officer/inspections')) return 'Field Inspections & Testing';
    if (pathname.includes('/officer/certificates')) return 'Statutory Verification Certificates';
    if (pathname.includes('/officer/notifications')) return 'Departmental Notices';
    if (pathname.includes('/officer/profile')) return 'Official Officer Profile';
    return 'Legal Metrology Enforcement';
  };

  const activeTitle = derivePageTitle(location.pathname);

  return (
    <header className="fixed top-0 left-0 right-0 md:left-16 lg:left-64 xl:left-72 z-[9999] bg-white border-b border-[#D9E2EC] shadow-2xs select-none pt-[var(--sat,0px)] transition-all duration-200">
      {/* Top Government of India Tricolor Strip */}
      <div className="h-1 w-full flex" aria-hidden="true">
        <div className="h-full flex-1 bg-[#FF9933]" title="Saffron" />
        <div className="h-full flex-1 bg-white" title="White" />
        <div className="h-full flex-1 bg-[#138808]" title="India Green" />
      </div>

      <div className="h-16 px-3.5 sm:px-5 lg:px-6 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left Side: Hamburger & Official Government Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-md text-[#172B4D] hover:text-[#123B6D] hover:bg-[#F5F8FC] border border-[#D9E2EC] transition min-w-[42px] min-h-[42px] flex items-center justify-center shrink-0"
            aria-label="Open Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            {/* Government Emblem / Scale Crest */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-[#123B6D] border border-[#0B2F57] flex items-center justify-center text-[#FF9933] shadow-xs shrink-0">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>

            <div className="flex flex-col min-w-0 leading-tight">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#172B4D] tracking-tight truncate">
                <span className="hidden sm:inline">भारत सरकार |</span>
                <span className="truncate">e-Maap Verify</span>
                <span className="hidden md:inline-flex text-[9px] bg-[#E8F1FA] text-[#123B6D] font-bold px-1.5 py-0.2 rounded border border-[#07549A]/20">
                  GOV
                </span>
              </div>
              <div className="text-[11px] text-[#5B6B7A] font-medium truncate hidden sm:block">
                Department of Consumer Affairs • Legal Metrology Division
              </div>
            </div>
          </div>
        </div>

        {/* Center / Page Context Title (Visible on larger screens) */}
        {activeTitle && (
          <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-[#123B6D] bg-[#F5F8FC] px-3 py-1.5 rounded-md border border-[#D9E2EC] max-w-sm truncate">
            <Building2 className="w-3.5 h-3.5 text-[#07549A] shrink-0" />
            <span className="truncate">{activeTitle}</span>
          </div>
        )}

        {/* Right Side: Verification Link, Notifications, Profile Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Public Certificate Verification Link */}
          <Link
            to="/verify-certificate"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#123B6D] bg-[#E8F1FA] hover:bg-[#d5e7f7] rounded-md border border-[#07549A]/30 transition shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#07549A]" />
            <span className="hidden md:inline">Verify Certificate</span>
            <span className="md:hidden">Verify</span>
            <ExternalLink className="w-3 h-3 text-[#5B6B7A]" />
          </Link>

          {/* Notifications Button */}
          <Link
            to={getNotificationLink()}
            className="relative p-2 rounded-md text-[#5B6B7A] hover:text-[#123B6D] hover:bg-[#F5F8FC] border border-transparent hover:border-[#D9E2EC] transition min-w-[42px] min-h-[42px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#B91C1C] rounded-full ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#F5F8FC] border border-transparent hover:border-[#D9E2EC] transition text-left focus:outline-hidden min-h-[42px]"
              aria-expanded={userMenuOpen}
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-md bg-[#123B6D] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
              </div>
              <div className="hidden md:block overflow-hidden">
                <div className="text-xs font-bold text-[#172B4D] leading-tight truncate max-w-[120px]">
                  {user?.name || 'Officer'}
                </div>
                <div className="text-[10px] text-[#5B6B7A] font-semibold truncate max-w-[120px]">
                  {formatRoleTitle(user?.role)}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#5B6B7A] hidden md:block" />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-[#D9E2EC] py-1.5 z-50 text-xs animate-in fade-in duration-100">
                  <div className="px-4 py-3 border-b border-[#D9E2EC] bg-[#F5F8FC]">
                    <p className="font-bold text-[#172B4D] truncate">{user?.name || 'Officer'}</p>
                    <p className="text-[#5B6B7A] text-[11px] truncate">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold bg-[#E8F1FA] text-[#123B6D] px-2 py-0.5 rounded border border-[#07549A]/30">
                        {formatRoleTitle(user?.role)}
                      </span>
                      {user?.jurisdiction?.district && (
                        <span className="text-[10px] font-medium text-[#5B6B7A] bg-white px-1.5 py-0.5 rounded border border-[#D9E2EC]">
                          {user.jurisdiction.district}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to={getProfileLink()}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#172B4D] hover:bg-[#F5F8FC] hover:text-[#123B6D] transition"
                    >
                      <User className="w-4 h-4 text-[#5B6B7A]" />
                      <span>Official Account Profile</span>
                    </Link>

                    <Link
                      to="/verify-certificate"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#172B4D] hover:bg-[#F5F8FC] hover:text-[#123B6D] transition sm:hidden"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#07549A]" />
                      <span>Public Certificate Verification</span>
                    </Link>
                  </div>

                  <div className="border-t border-[#D9E2EC] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[#B91C1C] hover:bg-rose-50 transition font-medium text-left"
                  >
                    <LogOut className="w-4 h-4 text-[#B91C1C]" />
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

export default Topbar;
