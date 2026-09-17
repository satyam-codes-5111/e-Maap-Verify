import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const bgStyles = {
    success: 'bg-emerald-900 text-white border-emerald-700',
    error: 'bg-rose-900 text-white border-rose-700',
    warning: 'bg-amber-900 text-white border-amber-700',
    info: 'bg-slate-900 text-white border-slate-700',
  };

  const Icon = icons[toast.type];

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-fade-in shadow-xl">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border ${bgStyles[toast.type]} backdrop-blur-md`}
      >
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          {toast.title && <div className="font-bold mb-0.5">{toast.title}</div>}
          <div className="opacity-90 leading-snug">{toast.message}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
