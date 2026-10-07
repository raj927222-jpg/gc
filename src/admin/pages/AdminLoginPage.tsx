import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { adminLogin, verifyAdminSession } from '../../utils/adminAuth';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in, redirect to dashboard immediately
  useEffect(() => {
    let isMounted = true;
    async function checkExisting() {
      const isAuth = await verifyAdminSession();
      if (isMounted && isAuth) {
        navigate('/admin/dashboard', { replace: true });
      }
    }
    checkExisting();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your admin email or username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your administrator password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await adminLogin(identifier.trim(), password);
      if (res.success) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setErrorMsg(res.message || 'Invalid administrator credentials. Access denied.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error. Please verify server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-[#ECE7DA] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#D4AF37]/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#8C6D1F]/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#111017] border border-[#D4AF37]/35 rounded-2xl p-8 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.95)] relative z-10">
        {/* Emblem */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] p-[1.5px] shadow-[0_0_30px_rgba(212,175,55,0.3)] mb-4">
            <div className="w-full h-full bg-[#0A0A0C] rounded-2xl flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-[0.2em] text-[#ECE7DA]">
            GYUTARO ATELIER
          </h1>
          <p className="text-[11px] font-mono tracking-[0.25em] text-[#D4AF37] uppercase mt-1">
            EXECUTIVE CONTROL CONSOLE
          </p>
          <span className="text-xs text-[#ECE7DA]/50 mt-2 font-light">
            Authorized administrative personnel access only
          </span>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-identifier"
              className="block text-xs font-mono uppercase tracking-wider text-[#ECE7DA]/80"
            >
              Administrator ID / Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@gyutarocollection.com"
                className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl pl-10 pr-4 py-3 text-xs text-[#ECE7DA] font-mono placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="block text-xs font-mono uppercase tracking-wider text-[#ECE7DA]/80"
            >
              Security Passcode
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl pl-10 pr-11 py-3 text-xs text-[#ECE7DA] font-mono placeholder:text-[#ECE7DA]/30 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#ECE7DA]/50 hover:text-[#D4AF37] transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="btn-admin-submit-login"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E8C868] to-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-[0.2em] uppercase hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0A0A0C] border-t-transparent rounded-full animate-spin" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <>
                <span>AUTHORIZE ACCESS</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[10px] text-[#ECE7DA]/40 font-mono">
            IP ENCRYPTION PROTOCOL • SURAT HQ 2026
          </p>
        </div>
      </div>
    </div>
  );
};
