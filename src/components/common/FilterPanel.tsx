import React from 'react';
import { Filter, X } from 'lucide-react';

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
}

interface FilterPanelProps {
  filters: FilterOption[];
  onReset?: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onReset, className = '' }) => {
  const hasActiveFilters = filters.some((f) => f.value !== '' && f.value !== 'ALL');

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
        <Filter className="w-3.5 h-3.5" />
        <span>Filter:</span>
      </div>

      {filters.map((f) => (
        <select
          key={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          className="text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
        >
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {hasActiveFilters && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition"
        >
          <X className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
