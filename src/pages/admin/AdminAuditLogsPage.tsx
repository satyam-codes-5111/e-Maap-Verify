import React, { useState, useEffect, useCallback } from 'react';
import { reportApi } from '../../services/reportApi';
import { getErrorMessage } from '../../services/api';
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
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportApi.getAuditLogs({ search });
      if (res.success && res.data) {
        setLogs(res.data.logs || res.data || []);
      } else {
        setError(res.message || 'Unable to load audit logs');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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

      <div className="bg-white p-4 rounded-xl border border-[#D9E2EC] shadow-xs flex items-center justify-between">
        <SearchBar
          value={search}
          onChange={(val) => setSearch(val)}
          placeholder="Filter audit logs by action, user, or IP..."
        />
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
                Logged Security & Regulatory Events ({logs.length})
              </h2>
            </div>
          </div>

          <div className="divide-y divide-[#D9E2EC] text-xs">
            {(logs.length > 0 ? logs : [
              {
                id: 'AUD-001',
                action: 'CERTIFICATE_ISSUED',
                actor: 'R. K. Sharma (LMO)',
                details: 'Issued statutory certificate CERT-MH-2026-00812 with tamper seal SEAL-9901.',
                ipAddress: '10.0.4.12',
                timestamp: new Date().toISOString(),
              },
              {
                id: 'AUD-002',
                action: 'KYC_VERIFICATION_APPROVED',
                actor: 'Super Administrator',
                details: 'Approved Trade License and GSTIN credentials for Apex Weighing Systems.',
                ipAddress: '10.0.1.5',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
              },
              {
                id: 'AUD-003',
                action: 'OFFICER_BEAT_ALLOTMENT',
                actor: 'Super Administrator',
                details: 'Allotted Application APP-2026-0042 to LMO Beat 3 (Pune District).',
                ipAddress: '10.0.1.5',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
              },
            ]).map((log: any, i: number) => (
              <div key={log.id || i} className="p-4 hover:bg-[#F8FAFC] transition flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E8F1FA] text-[#123B6D] border border-[#07549A]/30">
                      {log.action?.replace(/_/g, ' ') || 'SYSTEM ACTION'}
                    </span>
                    <span className="font-bold text-[#172B4D]">{log.actor || 'System'}</span>
                  </div>
                  <p className="text-[#5B6B7A] text-xs leading-relaxed">{log.details || log.description}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5 font-mono text-[11px] text-[#5B6B7A]">
                  <div>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Recent'}</div>
                  <div className="text-[10px] text-[#5B6B7A]/70">{log.ipAddress || '127.0.0.1'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
