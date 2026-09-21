import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Scale,
  Plus,
  FileCheck2,
  Award,
} from 'lucide-react';

export const ApplicantBottomNav: React.FC = () => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] select-none pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="h-16 px-2 flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Home */}
        <NavLink
          to="/applicant/dashboard"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] transition-colors ${
              isActive ? 'text-[#123B6D] font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <LayoutDashboard className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -top-1 right-1/2 translate-x-1/2 w-1 h-1 bg-[#123B6D] rounded-full" />
                )}
              </div>
              <span className="text-[11px] mt-1 leading-none tracking-tight">Home</span>
            </>
          )}
        </NavLink>

        {/* 2. Instruments */}
        <NavLink
          to="/applicant/instruments"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] transition-colors ${
              isActive ? 'text-[#123B6D] font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Scale className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -top-1 right-1/2 translate-x-1/2 w-1 h-1 bg-[#123B6D] rounded-full" />
                )}
              </div>
              <span className="text-[11px] mt-1 leading-none tracking-tight">Devices</span>
            </>
          )}
        </NavLink>

        {/* 3. Central Prominent Action: Register Instrument */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-5">
          <NavLink
            to="/applicant/register-instrument"
            className={({ isActive }) =>
              `w-12 h-12 rounded-full flex items-center justify-center shadow-md transition transform active:scale-95 border-2 border-white ${
                isActive
                  ? 'bg-[#0D2B4F] text-amber-300 ring-2 ring-[#FF9933]'
                  : 'bg-[#123B6D] text-white hover:bg-[#0D2B4F]'
              }`
            }
            aria-label="Register Instrument"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </NavLink>
          <span className="text-[10px] font-bold text-[#123B6D] mt-1">Register</span>
        </div>

        {/* 4. Applications */}
        <NavLink
          to="/applicant/applications"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] transition-colors ${
              isActive ? 'text-[#123B6D] font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <FileCheck2 className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -top-1 right-1/2 translate-x-1/2 w-1 h-1 bg-[#123B6D] rounded-full" />
                )}
              </div>
              <span className="text-[11px] mt-1 leading-none tracking-tight">Applications</span>
            </>
          )}
        </NavLink>

        {/* 5. Certificates */}
        <NavLink
          to="/applicant/certificates"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] transition-colors ${
              isActive ? 'text-[#123B6D] font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Award className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -top-1 right-1/2 translate-x-1/2 w-1 h-1 bg-[#123B6D] rounded-full" />
                )}
              </div>
              <span className="text-[11px] mt-1 leading-none tracking-tight">Certificates</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
