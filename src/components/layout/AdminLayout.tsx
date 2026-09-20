import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { ShieldCheck } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const location = useLocation();

  // Determine current page context title
  const getPageTitle = (pathname: string): string => {
    if (pathname.includes('/admin/dashboard')) return 'Executive Dashboard & Overview';
    if (pathname.includes('/admin/applications')) return 'Applications Intake & Allotment';
    if (pathname.includes('/admin/instruments')) return 'National Instruments Registry';
    if (pathname.includes('/admin/stakeholders')) return 'Stakeholder Verification & KYC';
    if (pathname.includes('/admin/schedules')) return 'Statutory Field Schedules';
    if (pathname.includes('/admin/inspections')) return 'Enforcement Field Inspections';
    if (pathname.includes('/admin/certificates')) return 'Statutory Verification Certificates';
    if (pathname.includes('/admin/analytics')) return 'National Compliance Analytics';
    if (pathname.includes('/admin/reports')) return 'Statutory Reports & Registers';
    if (pathname.includes('/admin/users')) return 'User & Officer Administration';
    if (pathname.includes('/admin/audit-logs')) return 'Statutory Digital Audit Trail';
    if (pathname.includes('/admin/notifications')) return 'Departmental Alerts & Notices';
    if (pathname.includes('/admin/profile')) return 'Official Administrator Profile';
    return 'Central Administration Command';
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col font-sans text-[#172B4D]">
      <div className="flex flex-1 min-h-screen">
        {/* Desktop Sidebar: Sticky, Fixed width, Full viewport height */}
        <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
          <AdminSidebar />
        </div>

        {/* Mobile Off-Canvas Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-out Sidebar Drawer */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 shadow-2xl h-full animate-in slide-in-from-left duration-200">
              <AdminSidebar isMobile onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <AdminHeader
            onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
            pageTitle={pageTitle}
          />

          <main className="flex-1 p-3.5 sm:p-5 lg:p-7 max-w-7xl w-full mx-auto overflow-x-hidden">
            <Outlet />
          </main>

          {/* Official Government Footer */}
          <footer className="bg-white border-t border-[#D9E2EC] py-4 px-4 sm:px-8 mt-auto text-xs text-[#5B6B7A]">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#123B6D] text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-[#172B4D]">e-Maap Verify Portal</span>
                  <span className="mx-1.5 text-slate-300">|</span>
                  <span>Legal Metrology Division, Department of Consumer Affairs, Government of India</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-[#5B6B7A] flex-wrap justify-center">
                <span>Under Legal Metrology Act, 2009</span>
                <span className="hidden sm:inline">•</span>
                <span>Protected by Standard 256-bit Digital Signature Encryption</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
