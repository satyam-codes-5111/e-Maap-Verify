import React, { useState, useEffect, useCallback } from 'react';
import { reportApi } from '../../services/reportApi';
import { getErrorMessage } from '../../services/api';
import { AuditLog } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  User,
  Activity,
  FileText,
  Lock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

// Robust helper to normalize and extract logs and pagination from any API response structure
const extractAuditLogs = (response: any): { logs: AuditLog[]; pagination: any } => {
  if (!response) {
    return { logs: [], pagination: null };
  }

  // 6. If the response itself is an array, use it directly
  if (Array.isArray(response)) {
    return { logs: response, pagination: null };
  }

  // 4. If the response contains { logs: [...], pagination: {...} }, use response.logs
  if (Array.isArray(response.logs)) {
    return { logs: response.logs, pagination: response.pagination || null };
  }

  // 5. If it contains { items: [...], pagination: {...} }, use response.items
  if (Array.isArray(response.items)) {
    return { logs: response.items, pagination: response.pagination || null };
  }

  // Standard project envelope: { statusCode, success, data: { logs / items / data, pagination } }
  if (response.data) {
    if (Array.isArray(response.data)) {
      return { logs: response.data, pagination: response.pagination || null };
    }
    if (Array.isArray(response.data.logs)) {
      return { logs: response.data.logs, pagination: response.data.pagination || response.pagination || null };
    }
    if (Array.isArray(response.data.items)) {
      return { logs: response.data.items, pagination: response.data.pagination || response.pagination || null };
    }
    if (Array.isArray(response.data.data)) {
      return { logs: response.data.data, pagination: response.data.pagination || response.pagination || null };
    }
    if (Array.isArray(response.data.records)) {
      return { logs: response.data.records, pagination: response.data.pagination || response.pagination || null };
    }
  }

  if (Array.isArray(response.records)) {
    return { logs: response.records, pagination: response.pagination || null };
  }

  // 7. Otherwise use an empty array and show the existing empty state
  return { logs: [], pagination: response.pagination || response.data?.pagination || null };
};

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const safeString = (val: any, fallback = ''): string => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'object') {
      if (typeof val.name === 'string') return val.name;
      if (typeof val.email === 'string') return val.email;
      try {
        return JSON.stringify(val);
      } catch {
        return fallback;
      }
    }
    return String(val);
  };

  const getActorName = (log: any): string => {
    if (log.user && typeof log.user === 'object') {
      if (typeof log.user.name === 'string') return log.user.name;
      if (typeof log.user.email === 'string') return log.user.email;
    }
    if (typeof log.userEmail === 'string' && log.userEmail) return log.userEmail;
    if (typeof log.actor === 'string' && log.actor) return log.actor;
    if (typeof log.actor === 'object' && log.actor?.name) return String(log.actor.name);
    if (typeof log.performedBy === 'object' && log.performedBy?.name) return String(log.performedBy.name);
    if (typeof log.userRole === 'string' && log.userRole) return log.userRole;
    return 'System';
  };

  const getLogDetails = (log: any): string => {
    if (log.details && typeof log.details === 'string') return log.details;
    if (log.description && typeof log.description === 'string') return log.description;
    if (log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0) {
      try {
        const parts = Object.entries(log.metadata)
          .filter(([k, v]) => v !== undefined && v !== null && k !== 'password' && k !== 'secret' && k !== 'token')
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
        if (parts.length > 0) return parts.join(' | ');
      } catch {
        // ignore stringify error
      }
    }
    if (log.entity) {
      return `Statutory entity: ${safeString(log.entity)}${log.entityId ? ` (#${safeString(log.entityId)})` : ''}`;
    }
    return 'System security event logged';
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportApi.getAuditLogs({ search, page, limit: 20 });
      const responseAny = res as any;

      // If backend explicitly rejected the request with success === false and no data
      if (responseAny && responseAny.success === false && !responseAny.data && !responseAny.logs && !responseAny.items) {
        setError(responseAny.message || 'Unable to load audit logs from server');
        setLogs([]);
        setTotalPages(1);
        setTotalRecords(0);
        return;
      }

      const { logs: extractedList, pagination } = extractAuditLogs(res);
      const safeLogs = Array.isArray(extractedList) ? extractedList : [];
      setLogs(safeLogs);

      if (pagination) {
        setTotalPages(pagination.totalPages || pagination.pages || 1);
        setTotalRecords(pagination.total || pagination.totalRecords || safeLogs.length);
      } else {
        setTotalPages(1);
        setTotalRecords(safeLogs.length);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setLogs([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Normalize logs to a guaranteed array before rendering
  const normalizedLogs: AuditLog[] = Array.isArray(logs) ? logs : [];

  // Temporary DEVELOPMENT-ONLY console diagnostics before rendering
  console.log('[AUDIT DEBUG] logs value:', logs);
  console.log('[AUDIT DEBUG] isArray:', Array.isArray(logs));
  console.log('[AUDIT DEBUG] logs type:', typeof logs);

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Statutory Digital Audit Trail"
        description="Immutable logs of statutory verifications, certificate issuances, KYC determinations, and user actions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Audit Trail' },
        ]}
      />

      <div className="bg-white p-4 rounded-xl border border-[#D9E2EC] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Filter audit logs by action, user, or IP..."
        />

        <button
          type="button"
          onClick={() => fetchLogs()}
          className="px-3 py-2 text-xs font-semibold text-[#123B6D] bg-[#F5F8FC] hover:bg-[#E8F1FA] border border-[#D9E2EC] rounded-lg flex items-center gap-1.5 transition shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : (
        <div className="bg-white rounded-xl border border-[#D9E2EC] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#D9E2EC] flex items-center justify-between bg-[#F5F8FC]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#123B6D]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                Logged Security & Regulatory Events ({totalRecords})
              </h2>
            </div>
            {totalPages > 1 && (
              <span className="text-xs text-[#5B6B7A]">
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          {normalizedLogs.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#5B6B7A] space-y-2">
              <Lock className="w-8 h-8 text-[#5B6B7A]/40 mx-auto" />
              <p className="font-semibold text-sm text-[#172B4D]">No audit log records found</p>
              <p className="text-[#5B6B7A] max-w-sm mx-auto">
                Security events and regulatory actions will appear here as transactions occur in the system.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#D9E2EC] text-xs">
              {normalizedLogs.map((log: AuditLog, i: number) => {
                const actor = getActorName(log);
                const details = getLogDetails(log);
                const role = safeString(log.userRole || (typeof log.user === 'object' ? log.user?.role : ''));
                const actionLabel = safeString(log.action).replace(/_/g, ' ') || 'SYSTEM ACTION';
                const key = safeString(log._id || log.id || `log-${i}`);

                return (
                  <div
                    key={key}
                    className="p-4 hover:bg-[#F8FAFC] transition flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E8F1FA] text-[#123B6D] border border-[#07549A]/30">
                          {actionLabel}
                        </span>
                        <span className="font-bold text-[#172B4D] truncate">{actor}</span>
                        {role && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-[#5B6B7A] rounded border border-slate-200">
                            {role}
                          </span>
                        )}
                        {log.entity && (
                          <span className="text-[10px] text-[#5B6B7A]">
                            on <span className="font-medium text-[#172B4D]">{safeString(log.entity)}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[#5B6B7A] text-xs leading-relaxed break-words">
                        {details}
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0 space-y-0.5 font-mono text-[11px] text-[#5B6B7A]">
                      <div>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }) : 'Recent'}
                      </div>
                      {log.ipAddress && (
                        <div className="text-[10px] text-[#5B6B7A]/70">IP: {safeString(log.ipAddress)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-3 border-t border-[#D9E2EC] bg-[#F5F8FC] flex items-center justify-between text-xs text-[#5B6B7A]">
              <span>
                Showing {normalizedLogs.length} of {totalRecords} records
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-white border border-[#D9E2EC] rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="font-semibold text-[#172B4D]">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 bg-white border border-[#D9E2EC] rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
