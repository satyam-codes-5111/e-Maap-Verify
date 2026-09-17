import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
  type?: 'card' | 'table' | 'line';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 3,
  className = '',
  type = 'card',
}) => {
  if (type === 'table') {
    return (
      <div className={`w-full bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
        <div className="h-10 bg-slate-100/80 animate-pulse border-b border-slate-200" />
        <div className="p-4 space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded w-1/5 animate-pulse" />
              <div className="h-4 bg-slate-100 rounded w-1/6 animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 bg-slate-200 rounded animate-pulse"
            style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
          <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-slate-100 rounded w-full animate-pulse" />
        <div className="h-3 bg-slate-100 rounded w-4/5 animate-pulse" />
      </div>
    </div>
  );
};
