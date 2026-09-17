import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
} from 'lucide-react';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

const adminNavItems = [
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

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile, isMobile = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (onCloseMobile) onCloseMobile();
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={`flex flex-col h-full bg-white border-r border-[#D9E2EC] ${
        isMobile ? 'w-full' : 'w-64 xl:w-72'
      }`}
    >
      {/* Sidebar Header with Government Branding */}
      <div className="bg-[#0B2F57] text-white p-4 border-b border-[#123B6D] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#123B6D] border border-white/20 flex items-center justify-center text-white shadow-xs shrink-0">
              <Scale className="w-5 h-5" />
            </div>
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
          </div>

          {isMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-[#123B6D] transition"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-semibold text-slate-300 tracking-wider uppercase">
          <span>Central Admin Portal</span>
          <span className="inline-block w-2 h-2 rounded-full bg-[#138808]" title="System Operational" />
        </div>
      </div>

      {/* Navigation Links (Scrollable) */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 select-none">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5B6B7A]">
          Statutory Operations
        </div>

        {adminNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (isMobile && onCloseMobile) onCloseMobile();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs transition duration-150 group font-medium ${
                  isActive
                    ? 'bg-[#E8F1FA] text-[#123B6D] font-bold border-l-4 border-[#07549A] shadow-2xs'
                    : 'text-[#172B4D] hover:bg-[#F5F8FC] hover:text-[#123B6D] border-l-4 border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#07549A]' : 'text-[#5B6B7A] group-hover:text-[#123B6D]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-[#5B6B7A]">
          Public Utilities
        </div>

        <a
          href="/verify-certificate"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 px-3 py-2 text-xs font-medium text-[#172B4D] hover:bg-[#F5F8FC] hover:text-[#123B6D] rounded-md border-l-4 border-transparent transition"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-[#138808]" />
            <span>Public Certificate Verify</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#5B6B7A]" />
        </a>
      </nav>

      {/* Admin User Card & Logout at Footer */}
      <div className="p-3 border-t border-[#D9E2EC] bg-[#F5F8FC] shrink-0">
        <div className="flex items-center gap-2.5 mb-2 px-1">
          <div className="w-8 h-8 rounded-md bg-[#123B6D] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#172B4D] truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] font-semibold text-[#5B6B7A] truncate">
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
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
      </div>
    </aside>
  );
};
