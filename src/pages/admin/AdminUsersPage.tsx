import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/userApi';
import { UserProfile, UserRole } from '../../types';
import { getErrorMessage } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Building,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // New user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'LEGAL_METROLOGY_OFFICER',
    phone: '',
    designation: 'Legal Metrology Officer',
    state: 'Maharashtra',
    district: 'Mumbai Suburbs',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (roleFilter !== 'ALL') params.role = roleFilter;

      const res = await userApi.getUsers(params);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.users || []);
        setUsers(list);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Error Loading Users',
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await userApi.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password || 'Officer@DoCA2026!',
        role: formData.role,
        phone: formData.phone,
        designation: formData.designation,
        jurisdiction: {
          state: formData.state,
          district: formData.district,
        },
      });
      if (res.success) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Official Account Created',
          message: `User account provisioned for ${formData.name} as ${formData.role}.`,
        });
        setShowCreateModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'LEGAL_METROLOGY_OFFICER',
          phone: '',
          designation: 'Legal Metrology Officer',
          state: 'Maharashtra',
          district: 'Mumbai Suburbs',
        });
        fetchUsers();
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Creation Failed',
        message: getErrorMessage(err),
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await userApi.toggleStatus(id);
      if (res.success) {
        setToast({
          id: String(Date.now()),
          type: 'info',
          title: 'Account Status Toggled',
          message: 'User active status updated.',
        });
        fetchUsers();
      }
    } catch (err: unknown) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Toggle Failed',
        message: getErrorMessage(err),
      });
    }
  };

  const columns: Column<UserProfile>[] = [
    {
      header: 'Official / User',
      cell: (item) => (
        <div>
          <div className="font-bold text-[#172B4D]">{item.name}</div>
          <div className="text-[11px] text-[#5B6B7A] flex items-center gap-1 font-mono">
            <Mail className="w-3 h-3 text-[#5B6B7A]" />
            <span>{item.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Role & Designation',
      cell: (item) => (
        <div>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E8F1FA] text-[#123B6D] border border-[#07549A]/30">
            {item.role.replace(/_/g, ' ')}
          </span>
          <div className="text-[11px] text-[#5B6B7A] mt-0.5">
            {item.designation || 'Staff Officer'}
          </div>
        </div>
      ),
    },
    {
      header: 'Jurisdiction Beat',
      cell: (item) => (
        <div className="text-xs">
          <div className="font-semibold text-[#172B4D]">{item.jurisdiction?.district || 'Central HQ'}</div>
          <div className="text-[11px] text-[#5B6B7A]">{item.jurisdiction?.state || 'National'}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => (
        <StatusBadge status={item.status || 'ACTIVE'} size="sm" />
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => {
        const isSelf = item._id === currentUser?.id;
        const isTargetSuperAdmin = item.role === 'SUPER_ADMIN';
        const cannotModify = isSelf || (isTargetSuperAdmin && !isSuperAdmin);

        return (
          <button
            type="button"
            disabled={cannotModify}
            onClick={() => handleToggleStatus(item._id)}
            title={
              isSelf
                ? 'Cannot modify own active account'
                : isTargetSuperAdmin && !isSuperAdmin
                ? 'Only Super Administrators can modify Super Admin accounts'
                : undefined
            }
            className="px-2.5 py-1 text-xs font-semibold text-[#172B4D] bg-white hover:bg-[#F5F8FC] border border-[#D9E2EC] rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          >
            {item.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Departmental User & Officer Roster"
        description="Role-based access control, enforcement officer beats, and system administrators"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Users & Officers' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0B2F57] rounded-md transition shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Departmental User</span>
          </button>
        }
      />

      <div className="bg-white p-4 rounded-xl border border-[#D9E2EC] shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by name, email, or designation..."
        />

        <FilterPanel
          filters={[
            {
              key: 'role',
              label: 'Role',
              value: roleFilter,
              onChange: (val) => {
                setRoleFilter(val);
                setPage(1);
              },
              options: [
                { label: 'All Roles', value: 'ALL' },
                { label: 'Legal Metrology Officer', value: 'LEGAL_METROLOGY_OFFICER' },
                { label: 'Field Verification Officer', value: 'FIELD_VERIFICATION_OFFICER' },
                { label: 'GATC Officer', value: 'GATC_OFFICER' },
                { label: 'Admin', value: 'ADMIN' },
                { label: 'Business User', value: 'BUSINESS_USER' },
              ],
            },
          ]}
          onReset={() => {
            setRoleFilter('ALL');
            setSearch('');
            setPage(1);
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        keyExtractor={(item) => item._id}
        emptyTitle="No Users Found"
        emptyDescription="No registered users matching this query."
        pagination={{
          currentPage: page,
          totalPages,
          totalRecords,
          pageSize: 10,
          onPageChange: (p) => setPage(p),
        }}
      />

      {/* Create User Modal */}
      {showCreateModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          title="Provision Departmental Officer / User"
          subtitle="Grant statutory authority and jurisdiction beats"
          footer={
            <>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#5B6B7A] hover:bg-[#F5F8FC] border border-[#D9E2EC] rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={creating || !formData.name || !formData.email}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#123B6D] hover:bg-[#0B2F57] rounded-md shadow-2xs flex items-center gap-1.5 disabled:opacity-50 transition"
              >
                {creating && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Provision User</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-[#172B4D] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. S. K. Deshmukh"
                className="w-full px-3 py-2 text-xs bg-white border border-[#D9E2EC] rounded-md focus:ring-2 focus:ring-[#07549A]/20 focus:border-[#07549A] text-[#172B4D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@legalmetrology.gov.in"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D9E2EC] rounded-md focus:ring-2 focus:ring-[#07549A]/20 focus:border-[#07549A] text-[#172B4D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty for default"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D9E2EC] rounded-md focus:ring-2 focus:ring-[#07549A]/20 focus:border-[#07549A] text-[#172B4D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Role Assignment *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D9E2EC] rounded-md focus:ring-2 focus:ring-[#07549A]/20 focus:border-[#07549A] text-[#172B4D]"
                >
                  <option value="LEGAL_METROLOGY_OFFICER">Legal Metrology Officer (LMO)</option>
                  <option value="FIELD_VERIFICATION_OFFICER">Field Verification Officer</option>
                  <option value="GATC_OFFICER">GATC Officer (Govt Testing)</option>
                  {isSuperAdmin && <option value="ADMIN">System Administrator</option>}
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Administrator</option>}
                  <option value="BUSINESS_USER">Business Trader / Stakeholder</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Official Designation
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Assistant Controller"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D9E2EC] rounded-md focus:ring-2 focus:ring-[#07549A]/20 focus:border-[#07549A] text-[#172B4D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Jurisdiction State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Maharashtra"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D9E2EC] rounded-md focus:ring-2 focus:ring-[#07549A]/20 focus:border-[#07549A] text-[#172B4D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Jurisdiction District / Beat
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Mumbai Central"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D9E2EC] rounded-md focus:ring-2 focus:ring-[#07549A]/20 focus:border-[#07549A] text-[#172B4D]"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
