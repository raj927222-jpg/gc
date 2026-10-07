import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tags,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  Bell,
  Search,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getAdminUser, removeAdminSession, verifyAdminSession } from '../utils/adminAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(getAdminUser());
  const [isVerifying, setIsVerifying] = useState(true);

  // Enforce session verification on mount & route change
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      const isValid = await verifyAdminSession();
      if (!isMounted) return;
      if (!isValid) {
        removeAdminSession();
        navigate('/admin/login', { replace: true });
      } else {
        setAdminUser(getAdminUser());
      }
      setIsVerifying(false);
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    removeAdminSession();
    navigate('/admin/login', { replace: true });
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Users & Roles', path: '/admin/users', icon: ShieldCheck },
    { label: 'Categories', path: '/admin/categories', icon: Tags },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-[#ECE7DA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase">
            VERIFYING ADMIN SECURITY CREDENTIALS...
          </span>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    const current = navItems.find((item) => location.pathname.startsWith(item.path));
    return current ? current.label : 'Management Portal';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#ECE7DA] font-sans flex flex-col lg:flex-row antialiased selection:bg-[#D4AF37] selection:text-[#0A0A0C]">
      {/* 1. SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex w-64 flex-col justify-between bg-[#111017] border-r border-[#D4AF37]/20 shrink-0 select-none">
        <div>
          {/* Logo & Portal Crest */}
          <div className="p-6 border-b border-[#D4AF37]/15 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] flex items-center justify-center text-[#0A0A0C] font-bold font-serif text-sm shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              GC
            </div>
            <div>
              <h1 className="font-serif font-bold text-base tracking-wider text-[#ECE7DA]">
                GYUTARO ATELIER
              </h1>
              <span className="text-[10px] text-[#D4AF37] tracking-[0.2em] uppercase font-mono block">
                ADMIN CONSOLE
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <p className="px-3 pb-2 text-[10px] font-mono uppercase tracking-[0.25em] text-[#ECE7DA]/40">
              OPERATIONS
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/admin/dashboard'
                  ? location.pathname === '/admin' || location.pathname === '/admin/dashboard'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 ${
                    isActive
                      ? 'bg-[#D4AF37] text-[#0A0A0C] shadow-[0_0_20px_rgba(212,175,55,0.35)] font-bold'
                      : 'text-[#ECE7DA]/70 hover:text-[#ECE7DA] hover:bg-[#1A1924]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0A0A0C]' : 'text-[#D4AF37]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Area with Profile and Logout */}
        <div className="p-4 border-t border-[#D4AF37]/15 space-y-3 bg-[#0D0C13]">
          {/* Public Store link */}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#ECE7DA]/70 hover:text-[#D4AF37] hover:bg-[#161520] border border-white/5 transition-all"
            title="Open customer storefront in new window"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Customer Storefront</span>
            </span>
            <span className="text-[10px] font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
              LIVE
            </span>
          </a>

          {/* Admin Profile */}
          <div className="p-3 rounded-xl bg-[#14131D] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-xs shrink-0">
                A
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-[#ECE7DA] block truncate">
                  {adminUser?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-[#D4AF37] font-mono block uppercase">
                  ROLE: ADMIN
                </span>
              </div>
            </div>

            <button
              id="btn-admin-logout"
              onClick={handleLogout}
              title="Sign Out of Admin Portal"
              className="p-1.5 rounded-lg text-[#ECE7DA]/60 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION */}
      <header className="lg:hidden bg-[#111017] border-b border-[#D4AF37]/20 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center text-[#0A0A0C] font-bold text-xs font-serif">
            GC
          </div>
          <div>
            <h1 className="font-serif font-bold text-sm tracking-wider text-[#ECE7DA]">
              GYUTARO ADMIN
            </h1>
            <span className="text-[9px] text-[#D4AF37] font-mono tracking-widest block uppercase">
              {getPageTitle()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="p-2 rounded-lg bg-[#181724] border border-[#D4AF37]/30 text-[#ECE7DA] hover:text-[#D4AF37]"
            aria-label="Toggle Navigation"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#0A0A0C]/95 backdrop-blur-xl flex flex-col justify-between p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="font-serif font-bold text-base text-[#D4AF37]">
                ADMIN NAVIGATION
              </span>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="p-2 rounded-lg text-[#ECE7DA]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wider transition-colors ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#0A0A0C] font-bold'
                        : 'text-[#ECE7DA]/80 hover:bg-[#161520]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-3 pt-6 border-t border-white/10">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#D4AF37]/30 text-xs text-[#ECE7DA]"
            >
              <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
              <span>Open Customer Website</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/40 text-xs text-[#EF4444] font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span>LOGOUT OF ADMIN</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-[#0E0D14] border-b border-[#D4AF37]/15">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-lg font-bold tracking-wider text-[#ECE7DA]">
              {getPageTitle()}
            </h2>
            <span className="text-xs text-[#ECE7DA]/40">/</span>
            <span className="text-xs font-mono text-[#D4AF37] tracking-wider uppercase">
              Surat Atelier Central
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14131D] border border-[#10B981]/30 text-[11px] font-mono text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>SYSTEM SECURED • JWT ROLE: ADMIN</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-[#0A0A0C] via-[#0D0C13] to-[#0A0A0C]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
