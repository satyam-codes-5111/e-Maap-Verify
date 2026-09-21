import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { notificationApi } from '../../../services/notificationApi';
import {
  LayoutDashboard,
  Building2,
  Scale,
  PlusCircle,
  FileCheck2,
  CalendarDays,
  Award,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface ApplicantSidebarProps {
  collapsed?: boolean;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export const ApplicantSidebar: React.FC<ApplicantSidebarProps> = ({
  collapsed = false,
  isMobile = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

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
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    if (onCloseMobile) onCloseMobile();
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      to: '/applicant/dashboard',
      icon: LayoutDashboard,
      description: 'Overview & statistics',
    },
    {
      label: 'My Business Profile',
      to: '/applicant/profile',
      icon: Building2,
      description: 'Stakeholder establishment',
    },
    {
      label: 'My Instruments',
      to: '/applicant/instruments',
      icon: Scale,
      description: 'Commercial weighing devices',
    },
    {
      label: 'Register Instrument',
      to: '/applicant/register-instrument',
      icon: PlusCircle,
      description: 'New statutory device entry',
      highlight: true,
    },
    {
      label: 'Applications',
      to: '/applicant/applications',
      icon: FileCheck2,
      description: 'Verification tracking',
    },
    {
      label: 'Schedules',
      to: '/applicant/schedules',
      icon: CalendarDays,
      description: 'Inspection appointments',
    },
    {
      label: 'Certificates',
      to: '/applicant/certificates',
      icon: Award,
      description: 'Statutory verification seals',
    },
    {
      label: 'Notifications',
      to: '/applicant/notifications',
      icon: Bell,
      description: 'Compliance & alerts',
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
    },
    {
      label: 'Help / Guidance',
      to: '/applicant/help',
      icon: HelpCircle,
      description: 'Rules, Act 2009 & FAQs',
    },
    {
      label: 'Profile & Settings',
      to: '/applicant/profile',
      icon: Settings,
      description: 'User details & security',
    },
  ];

  return (
    <aside
      className={`h-full bg-[#0D2B4F] text-slate-200 flex flex-col select-none border-r border-[#123B6D]/60 transition-all duration-200 ${
        isMobile ? 'w-full' : collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Mobile Header Banner */}
      {isMobile && (
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#123B6D] bg-[#0A223E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#123B6D] text-amber-300 flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">ई-माप सत्यापन</p>
              <p className="text-[10px] text-blue-300">Department of Consumer Affairs</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Desktop Brand Banner when NOT mobile */}
      {!isMobile && (
        <div className="h-16 px-4 flex items-center border-b border-[#123B6D] bg-[#0A223E]">
          {collapsed ? (
            <div className="w-full flex items-center justify-center">
              <div className="w-9 h-9 rounded-lg bg-[#123B6D] text-amber-300 flex items-center justify-center border border-[#1e4d8c] shadow-xs">
                <Scale className="w-5 h-5" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#123B6D] text-amber-300 flex items-center justify-center border border-[#1e4d8c] shadow-xs shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div className="overflow-hidden leading-tight">
                <div className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
                  <span>ई-माप पोर्टल</span>
                  <span className="text-[9px] bg-amber-400/20 text-amber-300 font-bold px-1 py-0.2 rounded border border-amber-400/30">
                    DoCA
                  </span>
                </div>
                <p className="text-[10px] text-blue-300 font-medium">Business Establishment</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scrollable Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-blue-300/70">
            Commercial Services
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={`${item.label}-${item.to}`}
              to={item.to}
              end={item.to === '/applicant/dashboard'}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-[#123B6D] text-white font-bold shadow-xs border-l-3 border-[#FF9933]'
                    : 'text-slate-300 hover:text-white hover:bg-[#123B6D]/40'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive
                        ? 'text-amber-300 scale-105'
                        : item.highlight
                        ? 'text-emerald-400'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  />

                  {!collapsed && (
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-600 text-white shrink-0">
                          {item.badge}
                        </span>
                      )}
                      {item.highlight && !item.badge && (
                        <span className="ml-1.5 px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          New
                        </span>
                      )}
                    </div>
                  )}

                  {/* Collapsed Badge Dot */}
                  {collapsed && item.badge && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Navigation section */}
      <div className="p-3 border-t border-[#123B6D]/60 bg-[#0A223E]">
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-900/40 transition min-h-[44px] ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
