import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard
} from 'lucide-react';
import { CustomerOrder } from '../../types';
import { adminFetch } from '../../utils/adminAuth';

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [notification, setNotification] = useState('');

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/api/admin/orders');
      const json = await res.json();
      if (res.ok && json.success) {
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus as any });
        }
        showToast(`Order status updated to "${newStatus}".`);
      }
    } catch (err: any) {
      showToast(`Status update failed: ${err?.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusStyle = (status: string = 'PENDING') => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30';
      case 'SHIPPED':
        return 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30';
      case 'CONFIRMED':
      case 'PROCESSING':
        return 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30';
      case 'CANCELLED':
        return 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30';
      default:
        return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer?.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer?.phone || '').includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#D4AF37]">
            CLIENT ORDERS
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#ECE7DA] mt-0.5">
            Order Fulfillment Management
          </h1>
          <p className="text-xs text-[#ECE7DA]/60 mt-1">
            Review bespoke purchases, update logistics milestones, and inspect delivery destinations.
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#14131D] text-xs font-semibold text-[#ECE7DA] hover:border-[#D4AF37] transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#ECE7DA] text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-[#111017] border border-[#D4AF37]/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number, client name, email, or mobile..."
            className="w-full bg-[#181722] border border-[#D4AF37]/25 rounded-xl pl-10 pr-4 py-2 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37] placeholder:text-[#ECE7DA]/30"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-[#D4AF37] text-[#0A0A0C] font-bold'
                : 'bg-[#181722] text-[#ECE7DA]/70 hover:text-[#ECE7DA]'
            }`}
          >
            All ({orders.length})
          </button>
          {ORDER_STATUSES.map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-[#D4AF37] text-[#0A0A0C] font-bold'
                    : 'bg-[#181722] text-[#ECE7DA]/70 hover:text-[#ECE7DA]'
                }`}
              >
                {status} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-[#111017] border border-[#D4AF37]/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#161520] text-[#D4AF37] font-mono border-b border-[#D4AF37]/20">
                <th className="py-3.5 px-4">Order Ref</th>
                <th className="py-3.5 px-4">Patron</th>
                <th className="py-3.5 px-4">Pieces</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status & Action</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#ECE7DA]/40">
                    Loading orders archive...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#ECE7DA]/40">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#D4AF37] block">{o.orderNumber}</span>
                      <span className="text-[10px] text-[#ECE7DA]/50">{o.date}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#ECE7DA]">
                        {o.customer?.firstName} {o.customer?.lastName}
                      </div>
                      <div className="text-[10px] text-[#ECE7DA]/50">{o.customer?.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#ECE7DA]/80">
                      {o.items?.length || 0} garment(s)
                    </td>
                    <td className="py-3.5 px-4 font-bold text-sm text-[#ECE7DA]">
                      ₹{(o.total || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1D1C2A] text-[#D4AF37]">
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={o.status || 'PENDING'}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                        className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border focus:outline-none cursor-pointer ${getStatusStyle(
                          o.status
                        )}`}
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st} className="bg-[#14131D] text-[#ECE7DA]">
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-3 py-1.5 rounded-lg bg-[#1D1C2A] hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] text-[#ECE7DA] transition-all cursor-pointer font-sans inline-flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#14131D] border border-[#D4AF37]/40 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase">
                  HAUTE COUTURE ORDER DISPATCH
                </span>
                <h3 className="font-serif text-xl font-bold text-[#ECE7DA]">
                  Order {selectedOrder.orderNumber}
                </h3>
                <span className="text-xs text-[#ECE7DA]/50">{selectedOrder.date}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg text-[#ECE7DA]/60 hover:text-[#ECE7DA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto pr-1 flex-1">
              {/* Status Header */}
              <div className="p-4 rounded-xl bg-[#181724] border border-[#D4AF37]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-[#ECE7DA]/50 uppercase font-mono block">
                    CURRENT DISPATCH STATUS
                  </span>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#ECE7DA]/70">Change Status:</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                    disabled={isUpdatingStatus}
                    className="text-xs font-bold rounded-lg px-3 py-1.5 bg-[#0A0A0C] border border-[#D4AF37]/40 text-[#D4AF37] focus:outline-none"
                  >
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Delivery Details */}
              <div className="p-4 rounded-xl bg-[#181724] border border-white/5 space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase text-[#D4AF37]">
                  Delivery Address & Patron Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#ECE7DA]/80 pt-1">
                  <div>
                    <span className="text-[#ECE7DA]/50 block">Recipient:</span>
                    <strong className="text-[#ECE7DA]">
                      {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#ECE7DA]/50 block">Contact Phone:</span>
                    <strong className="text-[#ECE7DA] font-mono">{selectedOrder.customer?.phone}</strong>
                  </div>
                  <div>
                    <span className="text-[#ECE7DA]/50 block">Email Address:</span>
                    <span className="font-mono">{selectedOrder.customer?.email}</span>
                  </div>
                  <div>
                    <span className="text-[#ECE7DA]/50 block">Destination:</span>
                    <span>
                      {selectedOrder.customer?.address}, {selectedOrder.customer?.city},{' '}
                      {selectedOrder.customer?.state} - {selectedOrder.customer?.pincode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ordered Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase text-[#D4AF37]">
                  Allocated Garments ({selectedOrder.items?.length || 0})
                </h4>
                <div className="space-y-2 divide-y divide-white/5">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {item.product?.images?.front && (
                          <img
                            src={item.product.images.front}
                            alt={item.product.name}
                            className="w-12 h-14 object-cover rounded-lg border border-[#D4AF37]/30"
                          />
                        )}
                        <div>
                          <h5 className="text-xs font-semibold text-[#ECE7DA]">
                            {item.product?.name || 'Atelier Garment'}
                          </h5>
                          <span className="text-[10px] text-[#ECE7DA]/50 block">
                            Size: {item.selectedSize} • Color: {item.selectedColor?.name}
                          </span>
                          <span className="text-[10px] text-[#D4AF37] font-mono">
                            Qty: {item.quantity} × ₹{(item.product?.price || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-xs text-[#ECE7DA]">
                        ₹{((item.product?.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[#ECE7DA]/60">
                  <span>Subtotal</span>
                  <span>₹{(selectedOrder.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#ECE7DA]/60">
                  <span>Shipping Fee</span>
                  <span>
                    {selectedOrder.shipping === 0 ? 'FREE (Complimentary)' : `₹${selectedOrder.shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-[#ECE7DA]/60">
                  <span>Payment Gateway</span>
                  <span className="text-[#D4AF37]">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#D4AF37] pt-2 border-t border-white/10">
                  <span>TOTAL AUTHORIZED</span>
                  <span>₹{(selectedOrder.total || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 rounded-xl bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs uppercase"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
