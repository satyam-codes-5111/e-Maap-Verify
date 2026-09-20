import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { scheduleApi } from '../../services/scheduleApi';
import { applicationApi } from '../../services/applicationApi';
import { userApi } from '../../services/userApi';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { VerificationApplicationItem, UserItem } from '../../types';
import {
  CalendarDays,
  Clock,
  UserCheck,
  Building2,
  Scale,
  MapPin,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface ScheduleVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (schedule?: any) => void;
  application?: VerificationApplicationItem | null;
  lockApplication?: boolean;
}

const TIME_SLOT_OPTIONS = [
  { value: '09:00 - 12:00', label: 'Morning Beat (09:00 AM - 12:00 PM)' },
  { value: '12:00 - 15:00', label: 'Mid-Day Beat (12:00 PM - 03:00 PM)' },
  { value: '15:00 - 18:00', label: 'Afternoon Beat (03:00 PM - 06:00 PM)' },
  { value: 'FULL_DAY', label: 'Full Day Beat (09:00 AM - 06:00 PM)' },
];

export const ScheduleVerificationModal: React.FC<ScheduleVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  application,
  lockApplication = false,
}) => {
  const { user } = useAuth();

  // State
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [approvedApplications, setApprovedApplications] = useState<VerificationApplicationItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const [lmoOfficers, setLmoOfficers] = useState<UserItem[]>([]);
  const [fvoOfficers, setFvoOfficers] = useState<UserItem[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  const [assignedOfficerId, setAssignedOfficerId] = useState<string>('');
  const [assignedFieldOfficerId, setAssignedFieldOfficerId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('09:00 - 12:00');
  const [locationType, setLocationType] = useState<string>('ON_SITE_PREMISES');
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safe today string for min date in picker
  const todayStr = useMemo(() => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch {
      return '';
    }
  }, []);

  // Tomorrow string default
  const tomorrowStr = useMemo(() => {
    try {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }, []);

  // Fetch Officers (Legal Metrology Officers and Field Verification Officers)
  useEffect(() => {
    if (!isOpen) return;

    const fetchOfficers = async () => {
      setLoadingOfficers(true);
      try {
        let activeList: UserItem[] = [];
        try {
          const res = await userApi.getActiveOfficers();
          if (res?.data && Array.isArray(res.data)) {
            activeList = res.data;
          }
        } catch {
          activeList = [];
        }

        // If list empty or small, supplement from getUsers
        if (activeList.length === 0) {
          try {
            const usersRes = await userApi.getUsers({ role: 'OFFICER', limit: 100 });
            const list = usersRes?.data?.users || (Array.isArray(usersRes?.data) ? usersRes.data : []);
            if (Array.isArray(list) && list.length > 0) {
              activeList = list;
            }
          } catch {
            // keep whatever we have
          }
        }

        const lmos = activeList.filter(
          (u) =>
            u.role === 'LEGAL_METROLOGY_OFFICER' ||
            u.role === 'ADMIN' ||
            u.role === 'SUPER_ADMIN'
        );
        const fvos = activeList.filter(
          (u) => u.role === 'FIELD_VERIFICATION_OFFICER'
        );

        setLmoOfficers(lmos);
        setFvoOfficers(fvos);

        // Pre-select LMO if current user is an LMO or Admin
        const currentUserId = user?.id || user?._id;
        if (
          user?.role === 'LEGAL_METROLOGY_OFFICER' &&
          currentUserId &&
          lmos.some((o) => o._id === currentUserId)
        ) {
          setAssignedOfficerId(currentUserId);
        } else if (lmos.length > 0 && !assignedOfficerId) {
          setAssignedOfficerId(lmos[0]._id);
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoadingOfficers(false);
      }
    };

    fetchOfficers();
  }, [isOpen, user]);

  // Fetch approved applications if not locked or preselected
  useEffect(() => {
    if (!isOpen) return;

    if (application?._id) {
      setSelectedAppId(application._id);
      return;
    }

    if (!lockApplication) {
      const fetchApproved = async () => {
        setLoadingApps(true);
        try {
          const res = await applicationApi.getApplications({
            status: 'APPROVED',
            limit: 50,
          });
          const list = res?.data?.applications || (Array.isArray(res?.data) ? res.data : []);
          if (Array.isArray(list)) {
            setApprovedApplications(list);
            if (list.length > 0 && !selectedAppId) {
              setSelectedAppId(list[0]._id);
            }
          }
        } catch {
          setApprovedApplications([]);
        } finally {
          setLoadingApps(false);
        }
      };

      fetchApproved();
    }
  }, [isOpen, application, lockApplication]);

  // Active target application resolution
  const activeApp = useMemo<VerificationApplicationItem | null>(() => {
    if (application && application._id === selectedAppId) {
      return application;
    }
    if (application && lockApplication) {
      return application;
    }
    const found = approvedApplications.find((a) => a._id === selectedAppId);
    return found || application || null;
  }, [application, selectedAppId, approvedApplications, lockApplication]);

  // Pre-fill location address and date when application is selected
  useEffect(() => {
    if (!isOpen) return;

    if (activeApp) {
      const loc = activeApp.verificationLocation;
      let addr = '';
      if (typeof loc === 'string') {
        addr = loc;
      } else if (loc && typeof loc === 'object') {
        addr = loc.address || loc.addressLine || loc.line1 || '';
        if (loc.district && !addr.includes(loc.district)) {
          addr = addr ? `${addr}, ${loc.district}` : loc.district;
        }
      }

      if (!addr && activeApp.stakeholder?.registeredAddress) {
        const sAddr = activeApp.stakeholder.registeredAddress;
        addr = typeof sAddr === 'string' ? sAddr : (sAddr.addressLine || sAddr.line1 || '');
      }

      setLocationAddress(addr || 'Establishment Premises');
    }

    if (!scheduledDate) {
      setScheduledDate(tomorrowStr || todayStr);
    }
  }, [activeApp, isOpen, tomorrowStr, todayStr]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSubmitting(false);
      if (!lockApplication) {
        setSelectedAppId('');
      }
    }
  }, [isOpen, lockApplication]);

  const appStatus = activeApp?.currentStatus || (activeApp as any)?.status || '';
  const isApproved = appStatus === 'APPROVED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!activeApp?._id) {
      setError('Please select an eligible application to schedule.');
      return;
    }

    if (!isApproved) {
      setError(`Only APPROVED applications can be scheduled. Current status is ${appStatus}.`);
      return;
    }

    if (!assignedOfficerId) {
      setError('A supervising Legal Metrology Officer must be designated.');
      return;
    }

    if (!scheduledDate) {
      setError('Scheduled verification date is required.');
      return;
    }

    if (!locationAddress.trim()) {
      setError('Inspection premise address is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        applicationId: activeApp._id,
        officerId: assignedOfficerId,
        assignedOfficerId,
        assignedFieldOfficerId: assignedFieldOfficerId || undefined,
        fieldOfficerId: assignedFieldOfficerId || undefined,
        scheduledDate,
        timeSlot,
        locationType,
        locationAddress: locationAddress.trim(),
        specialInstructions: notes.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await scheduleApi.createSchedule(payload);
      onSuccess(res?.data);
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to create verification schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Statutory Verification Schedule Allotment"
      subtitle="Allot verification beat, supervisory officer, and field verification roster"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !isApproved || !activeApp}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Scheduling Verification...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Issue & Save Statutory Schedule</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Non-Approved Status Warning Banner */}
        {activeApp && !isApproved && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Statutory Pre-condition Warning</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                Verification schedules can only be allotted for applications with{' '}
                <span className="font-bold uppercase">APPROVED</span> status. Current status is{' '}
                <span className="font-bold uppercase underline">{appStatus}</span>. Please review
                and grant formal departmental approval before generating an inspection schedule.
              </p>
            </div>
          </div>
        )}

        {/* 1. Target Application Selection or Display */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-700" />
              <span>Target Verification Application</span>
            </label>
            {activeApp && <StatusBadge status={appStatus} size="sm" />}
          </div>

          {!lockApplication && !application ? (
            <div>
              {loadingApps ? (
                <div className="text-xs text-slate-400 py-1.5">Loading eligible approved applications...</div>
              ) : approvedApplications.length === 0 ? (
                <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  No APPROVED applications currently pending verification allotment. Applications must be reviewed and approved first.
                </div>
              ) : (
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                >
                  <option value="" disabled>Select an approved application...</option>
                  {approvedApplications.map((app) => (
                    <option key={app._id} value={app._id}>
                      {app.applicationNumber} — {app.stakeholder?.businessName || 'Business'} ({app.instrument?.category || 'Instrument'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-800 bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="font-mono text-teal-900 font-bold">{activeApp?.applicationNumber || 'N/A'}</span>
              <span className="text-slate-500 font-normal">
                Purpose: {activeApp?.purpose || 'Statutory Verification'}
              </span>
            </div>
          )}

          {/* Application Metadata Preview */}
          {activeApp && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
              <div>
                <span className="text-[11px] text-slate-400 block">Establishment:</span>
                <span className="font-bold text-slate-800">
                  {activeApp.stakeholder?.businessName || activeApp.stakeholder?.legalName || 'N/A'}
                </span>
                {activeApp.stakeholder?.tradeLicenseNumber && (
                  <span className="text-[10px] text-slate-500 block font-mono">
                    Lic: {activeApp.stakeholder.tradeLicenseNumber}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Instrument:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Scale className="w-3 h-3 text-teal-700 shrink-0" />
                  {activeApp.instrument?.instrumentName || activeApp.instrument?.category || 'Instrument'}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  S/N: {activeApp.instrument?.serialNumber || 'N/A'} • Model: {activeApp.instrument?.modelNumber || 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Officer Allotment Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Legal Metrology Officer (Supervisory / Administrative) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Legal Metrology Officer (Supervisory) *</span>
            </label>
            <select
              value={assignedOfficerId}
              onChange={(e) => setAssignedOfficerId(e.target.value)}
              disabled={loadingOfficers}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium disabled:bg-slate-100"
            >
              <option value="">-- Select LMO / Admin --</option>
              {lmoOfficers.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.name} ({o.role?.replace(/_/g, ' ')}) {o.jurisdiction?.district ? `• ${o.jurisdiction.district}` : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-0.5">Authorizing statutory officer</p>
          </div>

          {/* Field Verification Officer (On-Site Executor) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>Field Verification Officer (On-Site)</span>
            </label>
            <select
              value={assignedFieldOfficerId}
              onChange={(e) => setAssignedFieldOfficerId(e.target.value)}
              disabled={loadingOfficers}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium disabled:bg-slate-100"
            >
              <option value="">-- Direct LMO Inspection / Unassigned FVO --</option>
              {fvoOfficers.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.name} (Field Officer) {o.jurisdiction?.district ? `• ${o.jurisdiction.district}` : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-0.5">Physical inspection executor</p>
          </div>
        </div>

        {/* 3. Date & Time Slot Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-teal-700" />
              <span>Scheduled Inspection Date *</span>
            </label>
            <input
              type="date"
              min={todayStr}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              <span>Inspection Time Beat / Slot *</span>
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
            >
              {TIME_SLOT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Inspection Location Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-700" />
              <span>Inspection Premise / Venue *</span>
            </label>
            <div className="flex items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 cursor-pointer">
                <input
                  type="radio"
                  name="locationType"
                  value="ON_SITE_PREMISES"
                  checked={locationType === 'ON_SITE_PREMISES'}
                  onChange={() => setLocationType('ON_SITE_PREMISES')}
                  className="text-teal-800 focus:ring-teal-800"
                />
                On-Site Premise
              </label>
              <label className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 cursor-pointer">
                <input
                  type="radio"
                  name="locationType"
                  value="DISTRICT_LABORATORY"
                  checked={locationType === 'DISTRICT_LABORATORY'}
                  onChange={() => setLocationType('DISTRICT_LABORATORY')}
                  className="text-teal-800 focus:ring-teal-800"
                />
                District Metrology Lab
              </label>
            </div>
          </div>

          <textarea
            rows={2}
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            placeholder="Complete address of premise where instrument will be tested..."
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
          />
        </div>

        {/* 5. Special Statutory Notes / Instructions */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Special Instructions / Standard Testing Weights Directive (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Working standard weights of 200kg required; ensure machine level"
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
          />
        </div>
      </form>
    </Modal>
  );
};
