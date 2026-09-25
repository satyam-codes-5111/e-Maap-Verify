import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { notificationApi } from '../../../services/notificationApi';
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
  HelpCircle,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

interface ApplicantHeaderProps {
  onToggleMobileMenu: () => void;
  desktopSidebarCollapsed?: boolean;
  onToggleDesktopSidebar?: () => void;
}

export const ApplicantHeader: React.FC<ApplicantHeaderProps> = ({
  onToggleMobileMenu,
  desktopSidebarCollapsed = false,
  onToggleDesktopSidebar,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const handleFocus = () => {
      fetchUnread();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('notifications:refresh', handleFocus);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('notifications:refresh', handleFocus);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const displayName = user?.name || 'Business User';
  const displayEmail = user?.email || '';

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 xl:left-72 z-40 bg-white border-b border-[#D9E2EC] shadow-xs pt-[var(--sat,0px)] select-none">
      {/* Official Government Tricolor Strip */}
      <div className="h-1 w-full flex">
        <div className="h-full flex-1 bg-[#FF9933]" title="Saffron" />
        <div className="h-full flex-1 bg-white" title="White" />
        <div className="h-full flex-1 bg-[#138808]" title="India Green" />
      </div>

      {/* Primary Header Row */}
      <div className="h-16 px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-3">
        {/* Left: Hamburger / Collapse + Branding & Department context */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Mobile menu drawer button */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-[#123B6D] hover:bg-slate-100 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop sidebar toggle button */}
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="hidden lg:flex p-2 text-slate-600 hover:text-[#123B6D] hover:bg-slate-100 rounded-lg transition shrink-0"
            title={desktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle desktop sidebar"
          >
            {desktopSidebarCollapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>

          {/* Official Emblem / Branding */}
          <Link
            to="/applicant/dashboard"
            className="flex items-center gap-2.5 sm:gap-3 group min-w-0 focus:outline-hidden"
          >
            <div className="w-9 h-9 rounded-lg bg-[#123B6D] text-white flex items-center justify-center shadow-xs shrink-0 border border-[#0D2B4F]">
              <Scale className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-[#123B6D] truncate">
                  ई-माप सत्यापन
                </span>
                <span className="hidden xs:inline-block text-[10px] font-bold uppercase tracking-wider text-[#123B6D] bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 rounded">
                  e-Maap Verify
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span className="truncate">Dept of Consumer Affairs • Legal Metrology</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Right: Quick actions, Notifications, User profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Public Certificate Verification Link */}
          <Link
            to="/verify-certificate"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#123B6D] bg-blue-50/80 hover:bg-blue-100/80 rounded-lg border border-blue-200 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#123B6D]" />
            <span>Verify Certificate</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          {/* Help & Guidance Link */}
          <Link
            to="/applicant/help"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#123B6D] hover:bg-slate-100 rounded-lg transition"
            title="Help & Guidance"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden xl:inline">Help</span>
          </Link>

          {/* Notifications */}
          <Link
            to="/applicant/notifications"
            className="relative p-2 text-slate-600 hover:text-[#123B6D] hover:bg-slate-100 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition focus:outline-hidden min-h-[44px]"
              aria-expanded={profileDropdownOpen}
              aria-haspopup="true"
              aria-label="User account menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#123B6D] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left min-w-0 max-w-[130px]">
                <span className="text-xs font-bold text-slate-800 truncate leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate">
                  Commercial Applicant
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Popover */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{displayEmail}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Statutory Business User</span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/applicant/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-[#123B6D] hover:bg-slate-50 transition"
                  >
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>My Business Profile</span>
                  </Link>

                  <Link
                    to="/applicant/help"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-[#123B6D] hover:bg-slate-50 transition"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Help & Statutory Guidance</span>
                  </Link>

                  <Link
                    to="/verify-certificate"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-[#123B6D] hover:bg-slate-50 transition md:hidden"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Verify Certificate</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
