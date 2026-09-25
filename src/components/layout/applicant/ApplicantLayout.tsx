import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ApplicantHeader } from './ApplicantHeader';
import { ApplicantSidebar } from './ApplicantSidebar';
import { ApplicantBottomNav } from './ApplicantBottomNav';
import { GovFooter } from '../GovFooter';

export const ApplicantLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-mobile-menu-open', mobileMenuOpen ? 'true' : 'false');
    const handleClose = () => setMobileMenuOpen(false);
    window.addEventListener('emaap:close-mobile-drawer', handleClose);
    return () => {
      document.body.removeAttribute('data-mobile-menu-open');
      window.removeEventListener('emaap:close-mobile-drawer', handleClose);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-sans antialiased text-[#172B4D]">
      <div className="flex flex-1 min-h-screen">
        {/* Desktop Master Sidebar: Sticky, Fixed width, Full viewport height */}
        <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
          <ApplicantSidebar />
        </div>

        {/* Mobile Off-Canvas Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[10000] lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-out Sidebar Drawer */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 shadow-2xl h-full animate-in slide-in-from-left duration-200">
              <ApplicantSidebar isMobile onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <ApplicantHeader
            onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          />
          {/* Fixed Header Height Spacer */}
          <div className="h-[69px] shrink-0" aria-hidden="true" />

          <main className="flex-1 p-3.5 sm:p-5 lg:p-7 max-w-7xl w-full mx-auto overflow-x-hidden pb-24 lg:pb-8">
            <Outlet />
          </main>

          <GovFooter />
        </div>
      </div>

      {/* 3. Mobile Persistent Bottom Navigation */}
      <ApplicantBottomNav />
    </div>
  );
};

export default ApplicantLayout;
