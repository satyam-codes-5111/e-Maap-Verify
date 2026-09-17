import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { inspectionApi } from '../../services/inspectionApi';
import { InspectionItem } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Toast, ToastMessage } from '../../components/common/Toast';
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Scale,
  PlusCircle,
  Camera,
  Award,
} from 'lucide-react';

export const OfficerInspectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scheduleIdParam = searchParams.get('scheduleId');

  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await inspectionApi.getMyInspections(params);
      if (res.success && res.data) {
        const data = res.data as any;
        setInspections(Array.isArray(data) ? data : (data.inspections || []));
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Inspection Load Error',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  // Handle create from schedule if passed
  useEffect(() => {
    const autoStartFromSchedule = async () => {
      if (!scheduleIdParam) return;
      try {
        const res = await inspectionApi.createInspection(scheduleIdParam);
        if (res.success && res.data) {
          navigate(`/officer/inspections/${res.data._id}/checklist`);
        }
      } catch (err: unknown) {
        // If already exists, find existing inspection for this schedule and navigate to it
        try {
          const listRes = await inspectionApi.getMyInspections({ limit: 50 });
          const items = listRes?.data?.inspections || (Array.isArray(listRes?.data) ? listRes.data : []);
          const existing = items.find(
            (i: any) => String(i.schedule?._id || i.schedule) === String(scheduleIdParam)
          );
          if (existing && existing._id) {
            navigate(`/officer/inspections/${existing._id}/checklist`);
            return;
          }
        } catch {}
        setToast({
          id: String(Date.now()),
          type: 'info',
          title: 'Existing Inspection',
          message: 'Inspection file loaded for this schedule.',
        });
      }
    };
    autoStartFromSchedule();
  }, [scheduleIdParam, navigate]);

  const columns: Column<InspectionItem>[] = [
    {
      header: 'Inspection Report ID',
      cell: (item) => (
        <div>
          <Link
            to={`/officer/inspections/${item._id}/checklist`}
            className="font-bold text-teal-800 hover:underline flex items-center gap-1"
          >
            <span>{item.inspectionNumber || `INSP-${item._id.slice(-6).toUpperCase()}`}</span>
          </Link>
          <div className="text-[11px] text-slate-500">
            Statutory Field Verification
          </div>
        </div>
      ),
    },
    {
      header: 'Instrument',
      cell: (item) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs">
            {item.instrument?.instrumentName || item.instrument?.category || 'Instrument'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            SN: {item.instrument?.serialNumber || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Stakeholder',
      cell: (item) => (
        <span className="text-xs text-slate-700">
          {(item as any).stakeholder?.businessName || item.application?.stakeholder?.businessName || 'Authorized Establishment'}
        </span>
      ),
    },
    {
      header: 'Status & Verdict',
      cell: (item) => (
        <div className="space-y-1">
          <StatusBadge status={item.inspectionStatus || item.status || 'IN_PROGRESS'} size="sm" />
          {(item.verdict || item.statutoryVerdict) && (
            <div className="text-[10px] font-bold text-slate-600">
              Verdict: <span className="text-teal-800">{item.verdict || item.statutoryVerdict}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Date',
      cell: (item) => (
        <div className="text-xs text-slate-600">
          {item.finalizedAt ? new Date(item.finalizedAt).toLocaleDateString() : item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'In Progress'}
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/officer/inspections/${item._id}/checklist`}
            title="Checklist & Calibration"
            className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg"
          >
            <ClipboardCheck className="w-4 h-4" />
          </Link>
          <Link
            to={`/officer/inspections/${item._id}/evidence`}
            title="Evidence & Photos"
            className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg"
          >
            <Camera className="w-4 h-4" />
          </Link>
          <Link
            to={`/officer/inspections/${item._id}/result`}
            title="Verdict & Finalize"
            className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg"
          >
            <Award className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  const mobileCardRender = (item: InspectionItem) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            to={`/officer/inspections/${item._id}/checklist`}
            className="font-bold text-xs text-teal-800"
          >
            {item.inspectionNumber || `INSP-${item._id.slice(-6).toUpperCase()}`}
          </Link>
          <p className="text-[11px] text-slate-500">
            {item.instrument?.instrumentName || item.instrument?.category}
          </p>
        </div>
        <StatusBadge status={item.inspectionStatus || item.status || 'IN_PROGRESS'} size="sm" />
      </div>

      <div className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
        <div>
          <span className="text-slate-400">Stakeholder: </span>
          <span className="font-semibold text-slate-800">
            {(item as any).stakeholder?.businessName || item.application?.stakeholder?.businessName || 'Commercial Establishment'}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Serial No: </span>
          <span className="font-mono text-slate-700">{item.instrument?.serialNumber || 'N/A'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 pt-1">
        <Link
          to={`/officer/inspections/${item._id}/checklist`}
          className="text-center py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded"
        >
          Checklist
        </Link>
        <Link
          to={`/officer/inspections/${item._id}/evidence`}
          className="text-center py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded"
        >
          Photos
        </Link>
        <Link
          to={`/officer/inspections/${item._id}/result`}
          className="text-center py-1.5 px-2 bg-teal-800 hover:bg-teal-900 text-white text-[11px] font-bold rounded"
        >
          Verdict
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Field Inspection Files"
        description="Verify technical tests, calibration accuracy, tamper seals, and issue statutory verdicts"
        breadcrumbs={[
          { label: 'Dashboard', href: '/officer/dashboard' },
          { label: 'Inspections' },
        ]}
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <FilterPanel
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: (val) => setStatusFilter(val),
              options: [
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Finalized', value: 'FINALIZED' },
              ],
            },
          ]}
          onReset={() => setStatusFilter('ALL')}
        />
      </div>

      <DataTable
        columns={columns}
        data={inspections}
        loading={loading}
        keyExtractor={(item) => item._id}
        emptyTitle="No Inspections Found"
        emptyDescription="Select an allotted schedule to start a field inspection file."
        emptyActionLabel="View Schedules"
        onEmptyAction={() => navigate('/officer/schedules')}
        mobileCardRender={mobileCardRender}
      />
    </div>
  );
};
