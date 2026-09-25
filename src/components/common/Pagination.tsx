import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationMeta } from '../../types';

export interface PaginationProps {
  meta?: PaginationMeta;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalRecords?: number;
  pageSize?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalRecords,
  pageSize = 10,
}) => {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeCurrentPage = Math.max(1, Math.min(Number(currentPage) || 1, safeTotalPages));

  // Determine start and end record counts
  const hasTotalRecords = totalRecords !== undefined && totalRecords !== null;
  const safeTotalRecords = Math.max(0, Number(totalRecords) || 0);
  const startRecord = safeTotalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, safeTotalRecords);

  const isFirstPage = safeCurrentPage <= 1;
  const isLastPage = safeCurrentPage >= safeTotalPages;

  // Generate page numbers with smart ellipsis window
  const getPageNumbers = (): (number | string)[] => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [1];
    const leftBound = Math.max(2, safeCurrentPage - 1);
    const rightBound = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

    if (leftBound > 2) {
      pages.push('...');
    }

    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    if (rightBound < safeTotalPages - 1) {
      pages.push('...');
    }

    pages.push(safeTotalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageClick = (p: number) => {
    if (p >= 1 && p <= safeTotalPages && p !== safeCurrentPage) {
      onPageChange(p);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-500 rounded-b-xl select-none">
      {/* Records info */}
      <div className="text-center sm:text-left text-slate-600 font-medium">
        {hasTotalRecords ? (
          <span>
            Showing <strong className="font-bold text-slate-900">{startRecord}</strong> to{' '}
            <strong className="font-bold text-slate-900">{endRecord}</strong> of{' '}
            <strong className="font-bold text-slate-900">{safeTotalRecords}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="font-bold text-slate-900">{safeCurrentPage}</strong> of{' '}
            <strong className="font-bold text-slate-900">{safeTotalPages}</strong>
          </span>
        )}
      </div>

      {/* Navigation Buttons: Previous, Page Numbers, Next */}
      <div className="flex items-center flex-wrap justify-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          disabled={isFirstPage}
          onClick={() => !isFirstPage && onPageChange(safeCurrentPage - 1)}
          aria-label="Previous Page"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold text-xs shadow-2xs min-h-[34px]"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-slate-400 select-none text-xs"
                >
                  •••
                </span>
              );
            }

            const isActive = p === safeCurrentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => handlePageClick(p)}
                aria-label={`Page ${p}`}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-[34px] min-h-[34px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center border shadow-2xs ${
                  isActive
                    ? 'bg-[#123B6D] text-white border-[#123B6D]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200 active:bg-slate-200'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={isLastPage}
          onClick={() => !isLastPage && onPageChange(safeCurrentPage + 1)}
          aria-label="Next Page"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold text-xs shadow-2xs min-h-[34px]"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
