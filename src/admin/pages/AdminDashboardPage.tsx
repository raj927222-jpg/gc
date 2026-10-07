import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle2,
  Truck,
  Layers,
  Sparkles
} from 'lucide-react';
import { adminFetch } from '../../utils/adminAuth';

interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  recentOrders: any[];
  lowStockProducts: any[];
  statusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  inStockCount: number;
  outOfStockCount: number;
}

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await adminFetch('/api/admin/dashboard');
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        setErrorMsg(json.message || 'Failed to retrieve dashboard metrics.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Server request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatPrice = (val: number) => {
    return `₹${(val || 0).toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status: string = 'PENDING') => {
    const s = status.toUpperCase();
    switch (s) {
      case 'DELIVERED':
        return 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30';
      case 'SHIPPED':
      case 'DISPATCHED':
        return 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30';
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30';
      case 'CANCELLED':
        return 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30';
      default:
        return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#D4AF37]">
            EXECUTIVE OVERVIEW
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#ECE7DA] mt-0.5">
            Atelier Command Center
          </h1>
          <p className="text-xs text-[#ECE7DA]/60 mt-1">
            Real-time analytics and inventory intelligence for Gyutaro Collection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboard}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#14131D] text-xs font-semibold text-[#ECE7DA] hover:border-[#D4AF37] hover:bg-[#1D1C28] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/products"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#F4E5C3] text-[#0A0A0C] font-bold text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-xs">
          {errorMsg}
        </div>
      )}

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="p-6 rounded-2xl bg-[#111017] border border-[#D4AF37]/25 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-[#ECE7DA]/60 font-mono uppercase tracking-wider mb-2">
            <span>GROSS SALES</span>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-[#D4AF37]">
            {isLoading ? '...' : formatPrice(data?.totalRevenue || 0)}
          </div>
          <div className="text-[11px] text-[#10B981] mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Confirmed transactions</span>
          </div>
        </div>

        {/* Metric 2: Total Orders */}
        <div className="p-6 rounded-2xl bg-[#111017] border border-[#D4AF37]/25 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-[#ECE7DA]/60 font-mono uppercase tracking-wider mb-2">
            <span>TOTAL ORDERS</span>
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 flex items-center justify-center text-[#3B82F6]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-[#ECE7DA]">
            {isLoading ? '...' : data?.totalOrders ?? 0}
          </div>
          <div className="text-[11px] text-[#ECE7DA]/50 mt-2 flex items-center gap-1">
            <span>{(data?.statusCounts?.PENDING || 0) + (data?.statusCounts?.PROCESSING || 0)} in processing</span>
          </div>
        </div>

        {/* Metric 3: Total Products */}
        <div className="p-6 rounded-2xl bg-[#111017] border border-[#D4AF37]/25 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-[#ECE7DA]/60 font-mono uppercase tracking-wider mb-2">
            <span>PRODUCTS ARCHIVE</span>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-[#ECE7DA]">
            {isLoading ? '...' : data?.totalProducts ?? 0}
          </div>
          <div className="text-[11px] text-[#10B981] mt-2 flex items-center gap-2">
            <span>{data?.inStockCount ?? 0} In Stock</span>
            {Boolean(data?.outOfStockCount) && (
              <span className="text-[#EF4444]">• {data?.outOfStockCount} Out</span>
            )}
          </div>
        </div>

        {/* Metric 4: VIP Customers */}
        <div className="p-6 rounded-2xl bg-[#111017] border border-[#D4AF37]/25 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-[#ECE7DA]/60 font-mono uppercase tracking-wider mb-2">
            <span>VIP PATRONS</span>
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 flex items-center justify-center text-[#10B981]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-[#ECE7DA]">
            {isLoading ? '...' : data?.totalCustomers ?? 0}
          </div>
          <div className="text-[11px] text-[#D4AF37] mt-2 flex items-center gap-1 font-mono">
            <span>Registered client accounts</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Orders */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#111017] border border-[#D4AF37]/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-[#ECE7DA] tracking-wider">
                Recent Atelier Orders
              </h3>
              <p className="text-xs text-[#ECE7DA]/50">Latest couture purchases by patrons</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs text-[#D4AF37] hover:underline font-mono flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D4AF37]/15 text-[#D4AF37] font-mono">
                  <th className="py-2.5 px-3">Order</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#ECE7DA]/40">
                      Loading orders data...
                    </td>
                  </tr>
                ) : !data?.recentOrders || data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#ECE7DA]/40">
                      No customer orders placed yet.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-bold text-[#D4AF37]">{ord.orderNumber}</td>
                      <td className="py-3 px-3 text-[#ECE7DA]">
                        {ord.customer?.firstName} {ord.customer?.lastName}
                      </td>
                      <td className="py-3 px-3 text-[#ECE7DA]/70">{ord.items?.length || 0} pcs</td>
                      <td className="py-3 px-3 font-bold text-[#ECE7DA]">{formatPrice(ord.total)}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            ord.status
                          )}`}
                        >
                          {ord.status || 'PROCESSING'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-[#ECE7DA]/50">{ord.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Low Stock Warnings */}
        <div className="p-6 rounded-2xl bg-[#111017] border border-[#D4AF37]/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
              <h3 className="font-serif text-base font-bold text-[#ECE7DA] tracking-wider">
                Low Stock Alerts
              </h3>
            </div>
            <Link
              to="/admin/products"
              className="text-xs text-[#D4AF37] hover:underline font-mono"
            >
              Manage
            </Link>
          </div>

          <p className="text-xs text-[#ECE7DA]/50">Pieces with 10 or fewer units in inventory</p>

          <div className="space-y-3">
            {isLoading ? (
              <p className="text-xs text-[#ECE7DA]/40 py-4 text-center">Checking stock...</p>
            ) : !data?.lowStockProducts || data.lowStockProducts.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#10B981] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All pieces have healthy stock reserves.</span>
              </div>
            ) : (
              data.lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-[#181722] border border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.images?.front}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover border border-[#D4AF37]/30 shrink-0"
                    />
                    <div className="truncate">
                      <h4 className="text-xs font-semibold text-[#ECE7DA] truncate">{p.name}</h4>
                      <span className="text-[10px] text-[#ECE7DA]/50 block">{p.category}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold block ${
                        p.stockCount <= 3 ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                      }`}
                    >
                      {p.stockCount} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
