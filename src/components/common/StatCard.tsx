import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'teal' | 'blue' | 'amber' | 'emerald' | 'rose' | 'slate' | 'purple' | 'indigo' | string;
  badge?: {
    text: string;
    type?: 'positive' | 'neutral' | 'urgent' | 'warning' | string;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  variant = 'teal',
  badge,
  onClick,
  className = '',
}) => {
  const variantStyles: Record<string, { bg: string; text: string; border: string }> = {
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-100',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
    },
    slate: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-100',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-100',
    },
  };

  const currentVariant = (variant && variantStyles[variant]) || variantStyles.teal;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition ${
        onClick ? 'cursor-pointer hover:border-teal-300 hover:shadow-sm' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center border ${currentVariant.bg} ${currentVariant.text} ${currentVariant.border}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {badge && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              badge.type === 'positive'
                ? 'bg-emerald-100 text-emerald-800'
                : badge.type === 'urgent'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {description && <p className="text-xs text-slate-500 mt-1.5 leading-snug">{description}</p>}
    </div>
  );
};
