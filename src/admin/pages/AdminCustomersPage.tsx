import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Mail, Phone, Calendar, ShieldCheck, UserCheck } from 'lucide-react';
import { adminFetch } from '../../utils/adminAuth';

interface CustomerItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role?: string;
  createdAt: number;
  authProvider?: string;
}

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/api/admin/customers');
      const json = await res.json();
      if (res.ok && json.success) {
        setCustomers(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.firstName || '').toLowerCase().includes(q) ||
      (c.lastName || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#D4AF37]">
            CLIENT PRIVILEGE REGISTER
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#ECE7DA] mt-0.5">
            Registered Patrons & Customers
          </h1>
          <p className="text-xs text-[#ECE7DA]/60 mt-1">
            Browse verified atelier accounts, contact dossiers, and client privileges.
          </p>
        </div>

        <button
          onClick={loadCustomers}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#14131D] text-xs font-semibold text-[#ECE7DA] hover:border-[#D4AF37] transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Patrons</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111017] border border-[#D4AF37]/20 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patron name, email, phone number, or ID..."
            className="w-full bg-[#181722] border border-[#D4AF37]/25 rounded-xl pl-10 pr-4 py-2 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37] placeholder:text-[#ECE7DA]/30"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-[#111017] border border-[#D4AF37]/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#161520] text-[#D4AF37] font-mono border-b border-[#D4AF37]/20">
                <th className="py-3.5 px-4">Patron Name</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Security Role</th>
                <th className="py-3.5 px-4">Auth Channel</th>
                <th className="py-3.5 px-4 text-right">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#ECE7DA]/40">
                    Loading customer roster...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#ECE7DA]/40">
                    No registered patrons found matching query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-xs shrink-0">
                          {(c.firstName || 'P')[0]}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#ECE7DA]">
                            {c.firstName} {c.lastName}
                          </h4>
                          <span className="text-[10px] font-mono text-[#ECE7DA]/40">{c.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#ECE7DA]/80">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#D4AF37]/60" />
                        <span>{c.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#D4AF37]">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#D4AF37]/60" />
                        <span>{c.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          c.role === 'admin'
                            ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                            : 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                        }`}
                      >
                        {c.role || 'customer'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-[#ECE7DA]/70 uppercase">
                        {c.authProvider || 'password'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#ECE7DA]/50 font-mono">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Pre-seeded'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
