import React from 'react';
import { Sidebar } from './Sidebar';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Sidebar Drawer */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 shadow-2xl h-full animate-in slide-in-from-left duration-200">
        <Sidebar isMobile onCloseMobile={onClose} onItemClick={onClose} className="border-r-0" />
      </div>
    </div>
  );
};
