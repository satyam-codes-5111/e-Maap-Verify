import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationMeta } from '../../types';

interface PaginationProps {
  meta?: PaginationMeta;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalRecords?: number;
  pageSize?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords,
  pageSize = 10,
}) => {
  if (totalPages <= 1 && (!totalRecords || totalRecords <= pageSize)) {
    return null;
  }

  const startRecord = totalRecords ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = totalRecords ? Math.min(currentPage * pageSize, totalRecords) : 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-500 rounded-b-xl">
      <div>
        {totalRecords !== undefined ? (
          <span>
            Showing <strong className="font-semibold text-slate-800">{startRecord}</strong> to{' '}
            <strong className="font-semibold text-slate-800">{endRecord}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{totalRecords}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="font-semibold text-slate-800">{currentPage}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{totalPages || 1}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-3 py-1 font-semibold text-slate-800">
          {currentPage} / {totalPages || 1}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-xs"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
