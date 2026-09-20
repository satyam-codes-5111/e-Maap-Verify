import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { Topbar } from './Topbar';
import { GovFooter } from './GovFooter';

export const AppShell: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-800">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
        <Sidebar className="h-full" />
      </div>

      {/* Mobile Drawer Sidebar */}
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />
        {/* Fixed Header Height Spacer */}
        <div className="h-[65px] shrink-0" aria-hidden="true" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet />
        </main>

        <GovFooter />
      </div>
    </div>
  );
};
