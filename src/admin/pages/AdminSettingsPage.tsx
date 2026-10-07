import React, { useState, useEffect } from 'react';
import {
  Settings,
  Truck,
  Database,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Globe,
  Sliders
} from 'lucide-react';
import { adminFetch } from '../../utils/adminAuth';

interface ShippingSettings {
  shippingChargesEnabled: boolean;
  standardShippingFee: number;
  freeShippingThreshold: number;
  shippingLabel: string;
}

export const AdminSettingsPage: React.FC = () => {
  const [shipping, setShipping] = useState<ShippingSettings>({
    shippingChargesEnabled: true,
    standardShippingFee: 450,
    freeShippingThreshold: 15000,
    shippingLabel: 'Express White-Glove Shipping',
  });
  const [mongoStatus, setMongoStatus] = useState<any>(null);
  const [mongoUriInput, setMongoUriInput] = useState('');
  const [isUpdatingMongo, setIsUpdatingMongo] = useState(false);
  const [mongoFeedback, setMongoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch settings from admin API
      const res = await adminFetch('/api/admin/settings');
      const json = await res.json();
      if (res.ok && json.success && json.data?.shippingConfig) {
        setShipping({
          shippingChargesEnabled: json.data.shippingConfig.shippingChargesEnabled ?? true,
          standardShippingFee: Number(json.data.shippingConfig.standardShippingFee) || 450,
          freeShippingThreshold: Number(json.data.shippingConfig.freeShippingThreshold) || 15000,
          shippingLabel: json.data.shippingConfig.shippingLabel || 'Express White-Glove Shipping',
        });
      }

      // 2. Fetch Mongo status
      const mongoRes = await fetch('/api/mongodb/status');
      if (mongoRes.ok) {
        const mongoJson = await mongoRes.json();
        setMongoStatus(mongoJson);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load settings.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMongoUri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUriInput.trim()) return;
    setIsUpdatingMongo(true);
    setMongoFeedback(null);
    try {
      const res = await fetch('/api/mongodb/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: mongoUriInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMongoFeedback({
          type: 'success',
          message: data.message || 'MongoDB connection updated successfully!',
        });
        setMongoUriInput('');
      } else {
        setMongoFeedback({
          type: 'error',
          message: data.message || 'Connection failed.',
        });
      }
      // Reload status
      const mongoRes = await fetch('/api/mongodb/status');
      if (mongoRes.ok) {
        const mongoJson = await mongoRes.json();
        setMongoStatus(mongoJson);
      }
    } catch (err: any) {
      setMongoFeedback({
        type: 'error',
        message: err?.message || 'Failed to communicate with server.',
      });
    } finally {
      setIsUpdatingMongo(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          shippingConfig: {
            ...shipping,
            standardShippingFee: Number(shipping.standardShippingFee),
            freeShippingThreshold: Number(shipping.freeShippingThreshold),
          },
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: 'success', message: 'Atelier store & shipping settings saved successfully.' });
      } else {
        setFeedback({ type: 'error', message: json.message || 'Failed to persist settings.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Network error saving settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#D4AF37]">
            SYSTEM CONFIGURATION
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#ECE7DA] mt-0.5">
            Atelier Settings & Preferences
          </h1>
          <p className="text-xs text-[#ECE7DA]/60 mt-1">
            Configure logistics rules, white-glove shipping policies, and check backend database telemetry.
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#14131D] text-xs font-semibold text-[#ECE7DA] hover:border-[#D4AF37] transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Reload Settings</span>
        </button>
      </div>

      {/* Notifications */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Shipping Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveShipping} className="p-6 sm:p-8 rounded-2xl bg-[#111017] border border-[#D4AF37]/25 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-[#D4AF37]/15 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-[#ECE7DA] tracking-wide">
                  Logistics & White-Glove Delivery
                </h2>
                <span className="text-xs text-[#ECE7DA]/50">
                  Manage shipping rates, thresholds, and complimentary allocation policies.
                </span>
              </div>
            </div>

            {/* Toggle: Enable Shipping Charges */}
            <div className="p-4 rounded-xl bg-[#161522] border border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#ECE7DA] font-mono">
                  ACTIVATE SHIPPING CHARGES
                </h4>
                <p className="text-[11px] text-[#ECE7DA]/50 mt-0.5">
                  When enabled, standard fee is applied unless order value exceeds free threshold.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={shipping.shippingChargesEnabled}
                  onChange={(e) =>
                    setShipping({ ...shipping, shippingChargesEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#232230] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Standard Fee */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#ECE7DA]/70">
                  Standard Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={shipping.standardShippingFee}
                  onChange={(e) =>
                    setShipping({ ...shipping, standardShippingFee: Number(e.target.value) })
                  }
                  className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37]"
                />
                <span className="text-[10px] text-[#ECE7DA]/40">
                  Applied to cart when complimentary limit is not reached.
                </span>
              </div>

              {/* Free Threshold */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#ECE7DA]/70">
                  Complimentary Shipping Threshold (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={shipping.freeShippingThreshold}
                  onChange={(e) =>
                    setShipping({ ...shipping, freeShippingThreshold: Number(e.target.value) })
                  }
                  className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37]"
                />
                <span className="text-[10px] text-[#ECE7DA]/40">
                  Orders equal to or above this value qualify for free delivery.
                </span>
              </div>
            </div>

            {/* Shipping Label */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#ECE7DA]/70">
                Customer Facing Shipping Label
              </label>
              <input
                type="text"
                required
                value={shipping.shippingLabel}
                onChange={(e) => setShipping({ ...shipping, shippingLabel: e.target.value })}
                placeholder="Express White-Glove Shipping"
                className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA8520] text-[#0A0A0C] font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'SAVING POLICIES...' : 'SAVE SETTINGS'}</span>
              </button>
            </div>
          </form>

          {/* Atelier Brand Identity & Location */}
          <div className="p-6 rounded-2xl bg-[#111017] border border-[#D4AF37]/20 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-serif text-base font-bold text-[#ECE7DA]">
                Atelier Location & Concierge
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-[#ECE7DA]/70">
              <div className="p-3 rounded-xl bg-[#161520] border border-white/5 space-y-1">
                <span className="text-[10px] text-[#D4AF37] block">HEADQUARTERS</span>
                <p className="text-[#ECE7DA]">Surat Textile & Fashion Avenue, Gujarat, India</p>
              </div>
              <div className="p-3 rounded-xl bg-[#161520] border border-white/5 space-y-1">
                <span className="text-[10px] text-[#D4AF37] block">CONCIERGE CONTACT</span>
                <p className="text-[#ECE7DA]">+91 9725917116 • concierge@gyutarocollection.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Database & Security Status */}
        <div className="space-y-6">
          {/* Database Health Card */}
          <div className="p-6 rounded-2xl bg-[#111017] border border-[#D4AF37]/25 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-[#D4AF37]/15 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 flex items-center justify-center text-[#10B981]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#ECE7DA]">
                  MongoDB Database
                </h3>
                <span className="text-[10px] font-mono text-[#10B981] uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  {mongoStatus?.connected ? 'CONNECTED & SYNCED' : 'READY / CONNECTING'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-[#ECE7DA]/50">Database Engine</span>
                <span className="text-[#D4AF37]">MongoDB Native Driver</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-[#ECE7DA]/50">Active Database</span>
                <span className="text-[#ECE7DA]">{mongoStatus?.databaseName || 'gyutaro_atelier'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-[#ECE7DA]/50">Configured State</span>
                <span className={mongoStatus?.configured ? 'text-[#10B981]' : 'text-[#F59E0B]'}>
                  {mongoStatus?.configured ? 'Configured' : 'Pending URI'}
                </span>
              </div>
              {mongoStatus?.clusterHost && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-[#ECE7DA]/50">Host / Cluster</span>
                  <span className="text-[#ECE7DA]">{mongoStatus?.clusterHost}</span>
                </div>
              )}
              {mongoStatus?.maskedUri && (
                <div className="py-1.5">
                  <span className="text-[#ECE7DA]/50 block mb-1">Active URI</span>
                  <span className="text-[10px] text-[#ECE7DA]/80 bg-[#161520] p-2 rounded block break-all">
                    {mongoStatus.maskedUri}
                  </span>
                </div>
              )}
              {mongoStatus?.message && (
                <div className="py-1 text-[11px] text-[#ECE7DA]/60">
                  {mongoStatus.message}
                </div>
              )}
            </div>

            {/* MongoDB URI Input & Save Form */}
            <form onSubmit={handleUpdateMongoUri} className="pt-3 border-t border-white/5 space-y-3">
              <label className="block text-[11px] font-mono text-[#ECE7DA]/70 uppercase tracking-wider">
                Update MongoDB URI (Atlas or Compass)
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={mongoUriInput}
                  onChange={(e) => setMongoUriInput(e.target.value)}
                  placeholder="mongodb+srv://username:password@cluster... or mongodb://localhost:27017"
                  className="w-full bg-[#181722] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-[11px] text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  disabled={isUpdatingMongo || !mongoUriInput.trim()}
                  className="w-full py-2 px-3 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37]/25 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3 h-3 ${isUpdatingMongo ? 'animate-spin' : ''}`} />
                  <span>{isUpdatingMongo ? 'Connecting & Verifying...' : 'Save & Connect Database'}</span>
                </button>
              </div>

              {mongoFeedback && (
                <div
                  className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
                    mongoFeedback.type === 'success'
                      ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                      : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                  }`}
                >
                  {mongoFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-tight">{mongoFeedback.message}</span>
                </div>
              )}

              {/* Atlas Whitelist Note */}
              <div className="p-3 rounded-xl bg-[#181722] border border-white/5 text-[10px] text-[#ECE7DA]/60 space-y-1">
                <span className="text-[#D4AF37] font-semibold block">MongoDB Atlas Step:</span>
                <p>
                  In MongoDB Atlas, enable IP access: <strong>Network Access</strong> &rarr; <strong>Add IP Address</strong> &rarr; Select <strong>Allow Access from Anywhere</strong> (<code className="text-[#D4AF37]">0.0.0.0/0</code>) &rarr; <strong>Confirm</strong>.
                </p>
              </div>
            </form>
          </div>

          {/* Admin Security Card */}
          <div className="p-6 rounded-2xl bg-[#111017] border border-[#D4AF37]/25 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-[#D4AF37]/15 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#ECE7DA]">
                  Security Architecture
                </h3>
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider">
                  JWT ENFORCED (ROLE: ADMIN)
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[#ECE7DA]/70">
              <p className="leading-relaxed">
                All administrative routes (<code className="text-[#D4AF37]">/api/admin/*</code>) require verified JWT bearer authorization with strict server-side role validation.
              </p>
              <div className="p-3 rounded-xl bg-[#161520] border border-white/5 text-[11px] font-mono space-y-1">
                <div className="text-[#10B981] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Unauthenticated requests receive 401</span>
                </div>
                <div className="text-[#10B981] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Non-admin tokens receive 403 Forbidden</span>
                </div>
                <div className="text-[#10B981] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Frontend routes auto-redirect to login</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
