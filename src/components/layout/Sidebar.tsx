import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  Cpu,
  FileCheck2,
  CalendarDays,
  ClipboardList,
  Award,
  BarChart3,
  FileSpreadsheet,
  Users,
  ShieldAlert,
  Building2,
  Bell,
  LogOut,
  FolderLock,
  UserCheck,
  CheckCircle,
  Scale,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onItemClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === 'BUSINESS_USER') {
      return [
        { label: 'Overview', to: '/applicant/dashboard', icon: LayoutDashboard },
        { label: 'Register Instrument', to: '/applicant/register-instrument', icon: PlusCircle },
        { label: 'My Instruments', to: '/applicant/instruments', icon: Cpu },
        { label: 'Applications', to: '/applicant/applications', icon: FileCheck2 },
        { label: 'Certificates', to: '/applicant/certificates', icon: Award },
        { label: 'Documents & KYC', to: '/applicant/documents', icon: FolderLock },
        { label: 'Business Profile', to: '/applicant/profile', icon: Building2 },
        { label: 'Notifications', to: '/applicant/notifications', icon: Bell },
      ];
    }

    if (
      user.role === 'LEGAL_METROLOGY_OFFICER' ||
      user.role === 'FIELD_VERIFICATION_OFFICER' ||
      user.role === 'GATC_OFFICER'
    ) {
      return [
        { label: 'Officer Dashboard', to: '/officer/dashboard', icon: LayoutDashboard },
        { label: 'Schedules', to: '/officer/schedules', icon: CalendarDays },
        { label: 'Field Inspections', to: '/officer/inspections', icon: ClipboardList },
        { label: 'Certificates', to: '/officer/certificates', icon: Award },
        { label: 'Notifications', to: '/officer/notifications', icon: Bell },
        { label: 'My Profile', to: '/officer/profile', icon: UserCheck },
      ];
    }

    // SUPER_ADMIN or ADMIN
    return [
      { label: 'Admin Command', to: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Applications', to: '/admin/applications', icon: FileCheck2 },
      { label: 'Instruments', to: '/admin/instruments', icon: Cpu },
      { label: 'Stakeholders', to: '/admin/stakeholders', icon: Building2 },
      { label: 'Schedules', to: '/admin/schedules', icon: CalendarDays },
      { label: 'Inspections', to: '/admin/inspections', icon: ClipboardList },
      { label: 'Certificates', to: '/admin/certificates', icon: Award },
      { label: 'Analytics & Trends', to: '/admin/analytics', icon: BarChart3 },
      { label: 'Reports & Export', to: '/admin/reports', icon: FileSpreadsheet },
      { label: 'User Management', to: '/admin/users', icon: Users },
      { label: 'Audit Logs', to: '/admin/audit-logs', icon: ShieldAlert },
      { label: 'Notifications', to: '/admin/notifications', icon: Bell },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <aside
      className={`w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none ${className}`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/50">
        <div className="w-9 h-9 rounded-lg bg-teal-800 border border-teal-600/50 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
          <Scale className="w-5 h-5" />
        </div>
        <div className="overflow-hidden leading-tight">
          <div className="text-xs font-black text-white tracking-tight flex items-center gap-1.5 truncate">
            <span>ई-माप सत्यापन</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
              DoCA
            </span>
          </div>
          <p className="text-[10px] text-teal-400 font-semibold truncate">e-Maap Verify Portal</p>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Statutory Services
        </div>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-xs font-bold border-l-4 border-amber-400 pl-2'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Section & Quick Actions */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-900/80 border border-teal-500/30 text-teal-300 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-teal-400 font-medium truncate uppercase tracking-wider">
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-100 hover:bg-rose-950/30 rounded-lg transition border border-rose-900/30 min-h-[40px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
