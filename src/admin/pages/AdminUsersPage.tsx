import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Users,
  ShieldAlert
} from 'lucide-react';
import { adminFetch } from '../../utils/adminAuth';

interface UserAccountItem {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  role?: 'admin' | 'customer';
  createdAt?: number | string;
  authProvider?: string;
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserAccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CUSTOMER'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/api/admin/users');
      const json = await res.json();
      if (res.ok && json.success) {
        setUsers(json.data || []);
      } else {
        setFeedback({ type: 'error', message: json.message || 'Failed to load user list.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Network error loading users.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'customer' = 'customer') => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    setUpdatingId(userId);
    setFeedback(null);

    try {
      const res = await adminFetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId || u.email === userId ? { ...u, role: newRole } : u))
        );
        setFeedback({
          type: 'success',
          message: `User privileges updated to ${newRole.toUpperCase()}.`,
        });
      } else {
        setFeedback({ type: 'error', message: json.message || 'Failed to update role.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Network error updating role.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${u.firstName || ''} ${u.lastName || ''} ${u.name || ''}`.toLowerCase();
    const matchesQuery =
      fullName.includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      (u.id || '').toLowerCase().includes(q);

    if (!matchesQuery) return false;

    const role = (u.role || 'customer').toUpperCase();
    if (roleFilter === 'ADMIN') return role === 'ADMIN';
    if (roleFilter === 'CUSTOMER') return role === 'CUSTOMER';
    return true;
  });

  const totalAdmins = users.filter((u) => (u.role || '').toLowerCase() === 'admin').length;
  const totalCustomers = users.filter((u) => (u.role || 'customer').toLowerCase() === 'customer').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#D4AF37]">
            ACCESS CONTROL & RBAC
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#ECE7DA] mt-0.5">
            Users & Roles Management
          </h1>
          <p className="text-xs text-[#ECE7DA]/60 mt-1">
            Enforce role-based access control (Admin vs Customer) and audit system credentials.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#14131D] text-xs font-semibold text-[#ECE7DA] hover:border-[#D4AF37] transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111017] border border-[#D4AF37]/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ECE7DA]/50">
              Total Accounts
            </span>
            <p className="font-serif text-2xl font-bold text-[#ECE7DA] mt-1">{users.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111017] border border-[#D4AF37]/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ECE7DA]/50">
              Administrators
            </span>
            <p className="font-serif text-2xl font-bold text-[#D4AF37] mt-1">{totalAdmins}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111017] border border-[#D4AF37]/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ECE7DA]/50">
              Standard Customers
            </span>
            <p className="font-serif text-2xl font-bold text-[#10B981] mt-1">{totalCustomers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981]'
              : 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#111017] border border-[#D4AF37]/20 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or telephone..."
            className="w-full bg-[#181722] border border-[#D4AF37]/25 rounded-xl pl-10 pr-4 py-2 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37] placeholder:text-[#ECE7DA]/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'ADMIN', 'CUSTOMER'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                roleFilter === r
                  ? 'bg-[#D4AF37] text-[#0A0A0C] font-bold shadow-md'
                  : 'bg-[#181722] text-[#ECE7DA]/70 hover:text-[#ECE7DA]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[#111017] border border-[#D4AF37]/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#161520] text-[#D4AF37] font-mono border-b border-[#D4AF37]/20">
                <th className="py-3.5 px-4">User Dossier</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Current Role</th>
                <th className="py-3.5 px-4 text-right">Role Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#ECE7DA]/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#ECE7DA]/40 font-mono">
                    {isLoading ? 'Loading users...' : 'No users match criteria.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = (u.role || '').toLowerCase() === 'admin';
                  const displayName =
                    `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || 'Patron Account';

                  return (
                    <tr key={u.id || u.email} className="hover:bg-[#181724]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isAdmin
                                ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                                : 'bg-[#161520] text-[#ECE7DA]/70 border border-white/10'
                            }`}
                          >
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[#ECE7DA] block">{displayName}</span>
                            <span className="text-[10px] text-[#ECE7DA]/40 font-mono block">
                              ID: {u.id || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{u.email}</td>
                      <td className="py-3 px-4 font-mono text-xs">{u.phone || '—'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase inline-flex items-center gap-1 ${
                            isAdmin
                              ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                              : 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                          }`}
                        >
                          {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          <span>{isAdmin ? 'ADMIN' : 'CUSTOMER'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleRole(u.id || u.email, isAdmin ? 'admin' : 'customer')}
                          disabled={updatingId === (u.id || u.email)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            isAdmin
                              ? 'bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/30'
                              : 'bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/30'
                          }`}
                        >
                          {updatingId === (u.id || u.email)
                            ? 'UPDATING...'
                            : isAdmin
                            ? 'Demote to Customer'
                            : 'Promote to Admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
