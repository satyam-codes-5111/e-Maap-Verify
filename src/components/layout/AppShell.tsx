import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { Topbar } from './Topbar';
import { GovFooter } from './GovFooter';

export const AppShell: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-mobile-menu-open', mobileSidebarOpen ? 'true' : 'false');
    const handleClose = () => setMobileSidebarOpen(false);
    window.addEventListener('emaap:close-mobile-drawer', handleClose);
    return () => {
      document.body.removeAttribute('data-mobile-menu-open');
      window.removeEventListener('emaap:close-mobile-drawer', handleClose);
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex font-sans antialiased text-[#172B4D] w-full max-w-full">
      <div className="flex flex-1 min-h-screen w-full max-w-full min-w-0">
        {/* Desktop Persistent Master Sidebar: Sticky, Fixed width, Full viewport height */}
        <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
          <Sidebar />
        </div>

        {/* Tablet Compact Master Sidebar: Sticky, Icon-only (w-16), Full viewport height */}
        <div className="hidden md:block lg:hidden shrink-0 sticky top-0 h-screen z-20">
          <Sidebar collapsed />
        </div>

        {/* Mobile Drawer Sidebar */}
        <MobileSidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen w-full">
          <Topbar onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />
          {/* Fixed Header Height Spacer */}
          <div className="h-[68px] shrink-0" aria-hidden="true" />

          <main className="flex-1 p-3 sm:p-5 lg:p-7 max-w-7xl w-full mx-auto min-w-0">
            <Outlet />
          </main>

          <GovFooter />
        </div>
      </div>
    </div>
  );
};

export default AppShell;
