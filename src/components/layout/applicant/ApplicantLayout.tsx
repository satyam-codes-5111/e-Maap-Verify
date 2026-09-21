import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ApplicantHeader } from './ApplicantHeader';
import { ApplicantSidebar } from './ApplicantSidebar';
import { ApplicantBottomNav } from './ApplicantBottomNav';
import { GovFooter } from '../GovFooter';

export const ApplicantLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-sans antialiased text-[#172B4D]">
      {/* 1. Fixed Government Header */}
      <ApplicantHeader
        onToggleMobileMenu={() => setMobileMenuOpen(true)}
        desktopSidebarCollapsed={desktopSidebarCollapsed}
        onToggleDesktopSidebar={() => setDesktopSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Body Container with Sidebar and Content */}
      <div className="flex flex-1 min-h-screen pt-17">
        {/* Desktop Fixed Sidebar */}
        <div
          className={`hidden lg:block shrink-0 fixed top-17 bottom-0 left-0 z-30 transition-all duration-200 ${
            desktopSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <ApplicantSidebar collapsed={desktopSidebarCollapsed} />
        </div>

        {/* Mobile Off-Canvas Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0D2B4F] z-10 shadow-2xl h-full animate-in slide-in-from-left duration-200">
              <ApplicantSidebar isMobile onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
            desktopSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          <main className="flex-1 p-3 sm:p-5 lg:p-7 max-w-7xl w-full mx-auto overflow-x-hidden pb-24 lg:pb-8">
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
