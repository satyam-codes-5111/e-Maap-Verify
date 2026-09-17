import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast, ToastMessage } from '../../components/common/Toast';
import {
  UserCheck,
  Shield,
  MapPin,
  Mail,
  Phone,
  Award,
  Calendar,
  Lock,
} from 'lucide-react';

export const OfficerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [toast, setToast] = useState<ToastMessage | null>(null);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Departmental Officer Profile"
        description="Statutory enforcement credentials and jurisdictional beat allocation"
        breadcrumbs={[
          { label: 'Dashboard', href: '/officer/dashboard' },
          { label: 'Officer Profile' },
        ]}
      />

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-teal-800 text-white flex items-center justify-center text-xl font-bold shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Enforcement Officer'}</h2>
              <StatusBadge status="ACTIVE" size="sm" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {user?.designation || 'Legal Metrology Officer'} • Government of India
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-teal-700" />
              <span>Official Email Address</span>
            </span>
            <p className="font-semibold text-slate-800 font-mono text-sm">{user?.email}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-teal-700" />
              <span>Departmental Mobile Contact</span>
            </span>
            <p className="font-semibold text-slate-800 font-mono text-sm">{user?.phone || 'Not Registered'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-teal-700" />
              <span>Assigned Jurisdiction Beat</span>
            </span>
            <p className="font-semibold text-slate-800 text-sm">
              {user?.jurisdiction?.district ? `${user.jurisdiction.district}, ${user.jurisdiction.state || ''}` : 'State Headquarters / Central Jurisdiction'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 text-teal-700" />
              <span>Statutory Powers</span>
            </span>
            <p className="font-semibold text-slate-800 text-sm">
              Legal Metrology Act, 2009 (Sections 15 & 24)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 text-xs space-y-2">
          <div className="flex items-center gap-2 text-teal-900 font-bold">
            <Lock className="w-4 h-4 text-teal-800" />
            <span>Digital Cryptographic Signing Key</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Your officer account is provisioned with digital verification authority. Any certificate stamped or finalized in the field carries a tamper-evident HMAC-SHA256 signature linking your officer identifier to the statutory registry.
          </p>
        </div>
      </div>
    </div>
  );
};
