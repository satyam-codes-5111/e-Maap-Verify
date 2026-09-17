import React from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  mobileCardRender?: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords?: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display matching your criteria.',
  emptyActionLabel,
  onEmptyAction,
  mobileCardRender,
  keyExtractor,
  pagination,
  className = '',
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingSkeleton type="table" rows={5} className={className} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        className={className}
      />
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      {/* Mobile view if custom mobile card renderer provided */}
      {mobileCardRender ? (
        <div className="md:hidden divide-y divide-slate-100">
          {data.map((item, index) => (
            <div key={keyExtractor(item)} className="p-4 hover:bg-slate-50/70 transition">
              {mobileCardRender(item, index)}
            </div>
          ))}
        </div>
      ) : null}

      {/* Desktop / Standard responsive table container */}
      <div className={`${mobileCardRender ? 'hidden md:block' : 'block'} overflow-x-auto w-full`}>
        <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
          <thead className="bg-slate-50/90 text-slate-700 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((item, rowIdx) => (
              <tr key={keyExtractor(item)} className="hover:bg-slate-50/60 transition">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-4 py-3.5 ${col.className || ''}`}>
                    {col.cell
                      ? col.cell(item, rowIdx)
                      : col.accessor
                      ? (item[col.accessor] as any)
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalRecords={pagination.totalRecords}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
