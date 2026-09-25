import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../services/notificationApi';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  FileCheck2,
  Cpu,
  Building2,
  CalendarDays,
  ClipboardList,
  Award,
  BarChart3,
  FileSpreadsheet,
  Users,
  ShieldAlert,
  Bell,
  Scale,
  LogOut,
  X,
  ExternalLink,
  ShieldCheck,
  PlusCircle,
  FolderLock,
  UserCheck,
  HelpCircle,
} from 'lucide-react';

export interface NavItemConfig {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string | number;
  highlight?: boolean;
}

export interface DashboardSidebarProps {
  role?: UserRole;
  navigation?: NavItemConfig[];
  onCloseMobile?: () => void;
  isMobile?: boolean;
  className?: string;
  onItemClick?: () => void;
  collapsed?: boolean;
}

// Statutory Operations nav items for Super Admin / Admin
const adminNavItems: NavItemConfig[] = [
  { label: 'Admin Command', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Applications Queue', path: '/admin/applications', icon: FileCheck2 },
  { label: 'Instruments Registry', path: '/admin/instruments', icon: Cpu },
  { label: 'Stakeholders & KYC', path: '/admin/stakeholders', icon: Building2 },
  { label: 'Officer Schedules', path: '/admin/schedules', icon: CalendarDays },
  { label: 'Field Inspections', path: '/admin/inspections', icon: ClipboardList },
  { label: 'Certificates Register', path: '/admin/certificates', icon: Award },
  { label: 'Compliance Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Statutory Reports', path: '/admin/reports', icon: FileSpreadsheet },
  { label: 'Users & Officers', path: '/admin/users', icon: Users },
  { label: 'Audit Trail Logs', path: '/admin/audit-logs', icon: ShieldAlert },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell },
];

// Enforcement Operations nav items for Legal Metrology Officer
const lmoNavItems: NavItemConfig[] = [
  { label: 'Officer Dashboard', path: '/officer/dashboard', icon: LayoutDashboard },
  { label: 'Inspection Schedules', path: '/officer/schedules', icon: CalendarDays },
  { label: 'Field Inspections', path: '/officer/inspections', icon: ClipboardList },
  { label: 'Verification Certificates', path: '/officer/certificates', icon: Award },
  { label: 'Departmental Notices', path: '/officer/notifications', icon: Bell },
  { label: 'Officer Profile', path: '/officer/profile', icon: UserCheck },
];

// Field Operations nav items for Field Verification Officer
const fieldOfficerNavItems: NavItemConfig[] = [
  { label: 'Field Officer Dashboard', path: '/officer/dashboard', icon: LayoutDashboard },
  { label: 'Field Schedules', path: '/officer/schedules', icon: CalendarDays },
  { label: 'Field Inspections', path: '/officer/inspections', icon: ClipboardList },
  { label: 'Verification Certificates', path: '/officer/certificates', icon: Award },
  { label: 'Departmental Notices', path: '/officer/notifications', icon: Bell },
  { label: 'Officer Profile', path: '/officer/profile', icon: UserCheck },
];

// Laboratory Operations nav items for GATC Officer
const gatcNavItems: NavItemConfig[] = [
  { label: 'Lab Officer Dashboard', path: '/officer/dashboard', icon: LayoutDashboard },
  { label: 'Testing Schedules', path: '/officer/schedules', icon: CalendarDays },
  { label: 'Calibration & Inspections', path: '/officer/inspections', icon: ClipboardList },
  { label: 'Verification Certificates', path: '/officer/certificates', icon: Award },
  { label: 'Departmental Notices', path: '/officer/notifications', icon: Bell },
  { label: 'Officer Profile', path: '/officer/profile', icon: UserCheck },
];

// Commercial Services nav items for Business Applicants
const applicantNavItems: NavItemConfig[] = [
  { label: 'Applicant Dashboard', path: '/applicant/dashboard', icon: LayoutDashboard },
  { label: 'Register Instrument', path: '/applicant/register-instrument', icon: PlusCircle, highlight: true },
  { label: 'My Instruments', path: '/applicant/instruments', icon: Scale },
  { label: 'Applications Tracking', path: '/applicant/applications', icon: FileCheck2 },
  { label: 'Inspection Schedules', path: '/applicant/schedules', icon: CalendarDays },
  { label: 'Verification Certificates', path: '/applicant/certificates', icon: Award },
  { label: 'Documents & KYC', path: '/applicant/documents', icon: FolderLock },
  { label: 'Business Profile', path: '/applicant/profile', icon: Building2 },
  { label: 'Notifications', path: '/applicant/notifications', icon: Bell },
  { label: 'Help & Guidance', path: '/applicant/help', icon: HelpCircle },
];

const getNavItemsByRole = (role?: UserRole): NavItemConfig[] => {
  switch (role) {
    case 'BUSINESS_USER':
      return applicantNavItems;
    case 'LEGAL_METROLOGY_OFFICER':
      return lmoNavItems;
    case 'FIELD_VERIFICATION_OFFICER':
      return fieldOfficerNavItems;
    case 'GATC_OFFICER':
      return gatcNavItems;
    case 'SUPER_ADMIN':
    case 'ADMIN':
    default:
      return adminNavItems;
  }
};

const getPortalSubtitle = (role?: UserRole): string => {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return 'Central Admin Portal';
    case 'LEGAL_METROLOGY_OFFICER':
      return 'Legal Metrology Enforcement';
    case 'FIELD_VERIFICATION_OFFICER':
      return 'Field Verification Wing';
    case 'GATC_OFFICER':
      return 'GATC Metrology Laboratory';
    case 'BUSINESS_USER':
      return 'Applicant Business Portal';
    default:
      return 'Legal Metrology Portal';
  }
};

const getSectionTitle = (role?: UserRole): string => {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return 'Statutory Operations';
    case 'LEGAL_METROLOGY_OFFICER':
      return 'Enforcement Operations';
    case 'FIELD_VERIFICATION_OFFICER':
      return 'Field Operations';
    case 'GATC_OFFICER':
      return 'Laboratory Operations';
    case 'BUSINESS_USER':
      return 'Commercial Services';
    default:
      return 'Statutory Operations';
  }
};

const formatRoleTitle = (role?: UserRole): string => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Admin';
    case 'LEGAL_METROLOGY_OFFICER':
      return 'Legal Metrology Officer';
    case 'FIELD_VERIFICATION_OFFICER':
      return 'Field Verification Officer';
    case 'GATC_OFFICER':
      return 'GATC Officer';
    case 'BUSINESS_USER':
      return 'Business Applicant';
    default:
      return 'Authorized User';
  }
};

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  role,
  navigation,
  onCloseMobile,
  isMobile = false,
  className = '',
  onItemClick,
  collapsed = false,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const effectiveRole = role || user?.role || 'ADMIN';
  const navItems = navigation || getNavItemsByRole(effectiveRole);
  const portalSubtitle = getPortalSubtitle(effectiveRole);
  const sectionTitle = getSectionTitle(effectiveRole);

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
    if (onCloseMobile) onCloseMobile();
    if (onItemClick) onItemClick();
    await logout();
    navigate('/login');
  };

  const isCompact = !isMobile && collapsed;

  return (
    <aside
      className={`flex flex-col h-full bg-white border-r border-[#D9E2EC] transition-all duration-200 ${
        isMobile ? 'w-full' : isCompact ? 'w-16' : 'w-64 xl:w-72'
      } ${className}`}
      aria-label="Sidebar navigation"
    >
      {/* Sidebar Header with Government Branding */}
      <div className={`bg-[#0B2F57] text-white border-b border-[#123B6D] shrink-0 ${isCompact ? 'p-3 text-center' : 'p-4'}`}>
        <div className={`flex items-center ${isCompact ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-md bg-[#123B6D] border border-white/20 flex items-center justify-center text-white shadow-xs shrink-0"
              title="e-Maap Verify - Legal Metrology Division"
            >
              <Scale className="w-5 h-5 text-[#FF9933]" />
            </div>
            {!isCompact && (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-wide text-white">e-Maap Verify</span>
                  <span className="text-[10px] bg-[#FF9933] text-slate-900 font-bold px-1 py-0.2 rounded leading-none">
                    GOV
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-medium leading-tight mt-0.5">
                  Legal Metrology Division
                </div>
              </div>
            )}
          </div>

          {isMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-[#123B6D] transition min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {!isCompact && (
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-semibold text-slate-300 tracking-wider uppercase">
            <span className="truncate">{portalSubtitle}</span>
            <span className="inline-block w-2 h-2 rounded-full bg-[#138808] shrink-0" title="System Operational" />
          </div>
        )}
      </div>

      {/* Navigation Links (Scrollable) */}
      <nav className={`flex-1 overflow-y-auto py-3 space-y-1 select-none ${isCompact ? 'px-1.5' : 'px-2'}`}>
        {!isCompact && (
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5B6B7A]">
            {sectionTitle}
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isNotifications = item.path.includes('notifications');
          const showBadge = isNotifications && unreadCount > 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCompact ? item.label : undefined}
              onClick={() => {
                if (isMobile && onCloseMobile) onCloseMobile();
                if (onItemClick) onItemClick();
              }}
              className={({ isActive }) =>
                `flex items-center rounded-md text-xs transition duration-150 group font-medium relative ${
                  isCompact
                    ? 'justify-center p-2.5 ' + (isActive ? 'bg-[#E8F1FA] text-[#07549A]' : 'text-[#172B4D] hover:bg-[#F5F8FC] hover:text-[#123B6D]')
                    : 'gap-3 px-3 py-2.5 ' + (isActive
                        ? 'bg-[#E8F1FA] text-[#123B6D] font-bold border-l-4 border-[#07549A] shadow-2xs'
                        : 'text-[#172B4D] hover:bg-[#F5F8FC] hover:text-[#123B6D] border-l-4 border-transparent')
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`shrink-0 transition-colors ${
                      isCompact ? 'w-5 h-5' : 'w-4 h-4'
                    } ${isActive ? 'text-[#07549A]' : 'text-[#5B6B7A] group-hover:text-[#123B6D]'}`}
                  />
                  {!isCompact && <span className="truncate flex-1">{item.label}</span>}
                  {showBadge && (
                    isCompact ? (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white" />
                    ) : (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-600 text-white shrink-0">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )
                  )}
                  {item.highlight && !showBadge && !isCompact && (
                    <span className="ml-auto text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
                      New
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {!isCompact && (
          <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-[#5B6B7A]">
            Public Utilities
          </div>
        )}

        <a
          href="/verify-certificate"
          target="_blank"
          rel="noopener noreferrer"
          title={isCompact ? 'Public Certificate Verify' : undefined}
          className={`flex items-center rounded-md text-xs font-medium text-[#172B4D] hover:bg-[#F5F8FC] hover:text-[#123B6D] transition ${
            isCompact ? 'justify-center p-2.5' : 'justify-between gap-3 px-3 py-2 border-l-4 border-transparent'
          }`}
        >
          {isCompact ? (
            <ShieldCheck className="w-5 h-5 text-[#138808]" />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#138808]" />
                <span>Public Certificate Verify</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#5B6B7A]" />
            </>
          )}
        </a>
      </nav>

      {/* User Card & Logout at Footer */}
      <div className={`border-t border-[#D9E2EC] bg-[#F5F8FC] shrink-0 ${isCompact ? 'p-2' : 'p-3'}`}>
        {!isCompact ? (
          <>
            <div className="flex items-center gap-2.5 mb-2 px-1">
              <div className="w-8 h-8 rounded-md bg-[#123B6D] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#172B4D] truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] font-semibold text-[#5B6B7A] truncate">
                  {formatRoleTitle(effectiveRole)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#B91C1C] hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-md transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Securely</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-md bg-[#123B6D] text-white flex items-center justify-center text-xs font-bold shrink-0"
              title={`${user?.name || 'User'} (${formatRoleTitle(effectiveRole)})`}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out Securely"
              className="p-1.5 text-[#B91C1C] hover:bg-rose-50 rounded-md transition"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export const MasterSidebar = DashboardSidebar;
export default DashboardSidebar;
