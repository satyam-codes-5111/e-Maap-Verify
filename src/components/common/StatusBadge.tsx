import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  ShieldCheck,
  Ban,
  FileEdit,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string | undefined;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = (status || 'UNKNOWN').toUpperCase().replace(/\s+/g, '_');

  let config = {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: Clock,
    label: status || 'Unknown',
  };

  switch (normalized) {
    case 'APPROVED':
    case 'VERIFIED':
    case 'ACTIVE':
    case 'VALID':
    case 'PASS':
    case 'COMPLETED':
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        icon: CheckCircle2,
        label: normalized,
      };
      break;

    case 'SCHEDULED':
    case 'RESCHEDULED':
      config = {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        icon: Calendar,
        label: normalized,
      };
      break;

    case 'UNDER_REVIEW':
    case 'SUBMITTED':
    case 'INSPECTION':
    case 'IN_PROGRESS':
    case 'PENDING':
      config = {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        icon: Clock,
        label: normalized.replace(/_/g, ' '),
      };
      break;

    case 'REJECTED':
    case 'FAILED':
    case 'FAIL':
      config = {
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200',
        icon: XCircle,
        label: normalized,
      };
      break;

    case 'EXPIRED':
      config = {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
        icon: AlertTriangle,
        label: 'EXPIRED',
      };
      break;

    case 'REVOKED':
    case 'CANCELLED':
      config = {
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-200',
        icon: Ban,
        label: normalized,
      };
      break;

    case 'DRAFT':
      config = {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
        icon: FileEdit,
        label: 'DRAFT',
      };
      break;

    default:
      config = {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        icon: ShieldCheck,
        label: normalized.replace(/_/g, ' '),
      };
      break;
  }

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap tracking-wide ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
