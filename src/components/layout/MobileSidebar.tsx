import React from 'react';
import { Sidebar } from './Sidebar';
import { X } from 'lucide-react';

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
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl z-10 animate-fade-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-3 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-hidden"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        <Sidebar className="w-full h-full border-r-0" onItemClick={onClose} />
      </div>
    </div>
  );
};
