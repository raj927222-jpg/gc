import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Truck,
  ArrowRight,
  Printer,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { CartItem, CustomerOrder, UserAccount, ShippingConfig } from '../types';
import { insertOrderToSupabase } from '../utils/supabaseDb';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderComplete: (order: CustomerOrder) => void;
  currencySymbol: string;
  currencyRate: number;
  currentUser?: UserAccount;
  onRequireLogin?: () => void;
  shippingConfig?: ShippingConfig;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onOrderComplete,
  currencySymbol,
  currencyRate,
  currentUser,
  onRequireLogin,
  shippingConfig,
}) => {
  const [step, setStep] = useState<'payment' | 'confirmed'>('payment');

  const isUserLoggedIn = Boolean(currentUser?.isLoggedIn);

  // Customer form state
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || 'Valued',
    lastName: currentUser?.lastName || 'Patron',
    phone: currentUser?.phone || '+91 9725917116',
    email: currentUser?.email || 'client@luxurycouture.com',
    address: 'Atelier Direct Concierge Delivery',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  });

  // Update formData when currentUser changes
  React.useEffect(() => {
    if (currentUser?.isLoggedIn) {
      setFormData((prev) => ({
        ...prev,
        firstName: currentUser.firstName || prev.firstName,
        lastName: currentUser.lastName || prev.lastName,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone,
      }));
    }
  }, [currentUser]);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'COD'>('UPI');
  const [cardData, setCardData] = useState({
    cardNumber: '4532 8920 1209 8456',
    cardHolder: 'ARJUN PATEL',
    expiry: '09/29',
    cvv: '894',
  });
  const [upiId, setUpiId] = useState('9725917116@ybl');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CustomerOrder | null>(null);

  if (!isOpen) return null;

  const safeCartItems = Array.isArray(cartItems)
    ? cartItems.filter((i) => i && i.product && typeof i.product === 'object')
    : [];

  const rawSubtotal = safeCartItems.reduce(
    (acc, item) => acc + (item.product?.price || 0) * (item.quantity || 1),
    0
  );

  const isShippingChargesEnabled = shippingConfig ? shippingConfig.shippingChargesEnabled : true;
  const standardFee = shippingConfig?.standardShippingFee ?? 450;
  const threshold = shippingConfig?.freeShippingThreshold ?? 15000;
  const shipping = !isShippingChargesEnabled
    ? 0
    : (rawSubtotal === 0 || (threshold > 0 && rawSubtotal > threshold) ? 0 : standardFee);
  const total = rawSubtotal + shipping;

  const formatPrice = (priceInInr: number) => {
    const converted = Math.round((priceInInr || 0) * currencyRate);
    return `${currencySymbol}${converted.toLocaleString('en-IN')}`;
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePlaceOrder = () => {
    if (!isUserLoggedIn) {
      if (onRequireLogin) {
        onRequireLogin();
      }
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const newOrder: CustomerOrder = {
        id: `ord-${Date.now()}`,
        orderNumber: `GC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        customer: { ...formData },
        items: [...cartItems],
        subtotal: rawSubtotal,
        discount: 0,
        shipping: shipping,
        total: total,
        paymentMethod: paymentMethod,
        status: 'PROCESSING',
        trackingNumber: `BD-LUXE-${Math.floor(100000 + Math.random() * 900000)}`,
      };

      setCompletedOrder(newOrder);
      onOrderComplete(newOrder);

      // Persist to Supabase Database
      insertOrderToSupabase(newOrder).catch((err) => {
        console.warn('[Supabase Sync] Order save warning:', err);
      });

      setIsProcessing(false);
      setStep('confirmed');
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step === 'confirmed' ? onClose : undefined}
          className="fixed inset-0 bg-[#0A0A0C]/90 backdrop-blur-xl"
        />

        {/* Checkout Modal Frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="relative z-10 w-full max-w-4xl bg-[#14131A] rounded-2xl border border-[#D4AF37]/40 shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#0E0D14]/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold tracking-wider text-[#ECE7DA]">
                  GYUTARO ATELIER CHECKOUT
                </h3>
                <p className="text-[10px] tracking-widest text-[#D4AF37] uppercase">
                  256-BIT ENCRYPTED LUXURY GATEWAY
                </p>
              </div>
            </div>

            {step !== 'confirmed' && (
              <button
                onClick={onClose}
                className="p-2 rounded-full text-[#ECE7DA]/60 hover:text-[#D4AF37] hover:bg-[#1E1D28] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1">
            {step === 'payment' && (
              <div className="space-y-6">
                {/* Payment Methods Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                    { id: 'CARD', label: 'CARDS', icon: CreditCard },
                    { id: 'NET_BANKING', label: 'NET BANKING', icon: Building2 },
                    { id: 'COD', label: 'CONCIERGE COD', icon: Banknote },
                  ].map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                            : 'bg-[#0E0D14] border-[#D4AF37]/20 text-[#ECE7DA]/70 hover:border-[#D4AF37]/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[11px] font-semibold tracking-wider font-cinzel">
                          {method.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-view: UPI */}
                {paymentMethod === 'UPI' && (
                  <div className="p-6 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/30 flex flex-col md:flex-row items-center gap-6">
                    {/* Real Scannable UPI QR Code */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="p-3 bg-white rounded-2xl border-2 border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.3)] relative group">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                            `upi://pay?pa=9725917116@ybl&pn=GYUTARO%20LUXURY%20COUTURE&am=${total}&cu=INR&tn=Order%20Payment`
                          )}`}
                          alt="UPI QR Code - 9725917116@ybl"
                          className="w-40 h-40 object-contain rounded-lg"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0A0A0C] border border-[#D4AF37] px-2.5 py-0.5 rounded-full text-[9px] font-bold text-[#D4AF37] tracking-wider uppercase whitespace-nowrap shadow">
                          9725917116@ybl
                        </div>
                      </div>
                      <span className="text-[10px] text-[#D4AF37]/80 font-mono mt-3 uppercase tracking-wider text-center">
                        Scan with GPay / PhonePe / Paytm
                      </span>
                    </div>

                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                          <h4 className="font-cinzel text-sm font-bold text-[#ECE7DA] tracking-wider">
                            OFFICIAL ATELIER UPI ID
                          </h4>
                        </div>
                        <p className="text-xs text-[#ECE7DA]/70 font-light mt-1">
                          Scan the QR with any UPI app or transfer directly to the official merchant VPA:
                        </p>
                      </div>

                      {/* UPI ID Copy Banner */}
                      <div className="p-3 rounded-xl bg-[#14131A] border border-[#D4AF37]/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <QrCode className="w-5 h-5 text-[#D4AF37] shrink-0" />
                          <div>
                            <span className="text-[10px] text-[#ECE7DA]/60 uppercase tracking-widest block font-cinzel">
                              PAYEE VPA
                            </span>
                            <span className="font-mono text-xs sm:text-sm font-bold text-[#D4AF37] tracking-wider">
                              9725917116@ybl
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="btn-copy-upi"
                          onClick={() => {
                            navigator.clipboard.writeText('9725917116@ybl');
                            setCopiedUpi(true);
                            setTimeout(() => setCopiedUpi(false), 2500);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            copiedUpi
                              ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                              : 'bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25 border border-[#D4AF37]/30'
                          }`}
                        >
                          {copiedUpi ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>COPIED</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>COPY ID</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium tracking-wider text-[#ECE7DA]/70 uppercase block">
                          Your UPI ID (For Payment Verification)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="yourname@upi / phonepe / gpay"
                            className="bg-[#14131A] border border-[#D4AF37]/30 rounded-lg px-3 py-2 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37] flex-1 font-mono"
                          />
                          <button
                            type="button"
                            className="px-3.5 py-2 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold hover:bg-[#D4AF37]/30 border border-[#D4AF37]/30 cursor-pointer"
                          >
                            VERIFY
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-view: CARD */}
                {paymentMethod === 'CARD' && (
                  <div className="space-y-4">
                    {/* Luxury Card Mockup */}
                    <div className="w-full max-w-sm mx-auto aspect-[1.58/1] rounded-2xl bg-gradient-to-tr from-[#1E1C28] via-[#0A0A0C] to-[#2B2738] border border-[#D4AF37]/40 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className="font-cinzel text-xs font-bold text-[#D4AF37] tracking-widest">
                          GYUTARO PRIVILEGE
                        </span>
                        <CreditCard className="w-6 h-6 text-[#D4AF37]" />
                      </div>
                      <div className="font-mono text-base tracking-[0.25em] text-[#ECE7DA] font-semibold text-center my-auto">
                        {cardData.cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex justify-between items-end text-xs">
                        <div>
                          <span className="text-[9px] text-[#ECE7DA]/50 block uppercase">Card Holder</span>
                          <span className="font-mono text-[#ECE7DA] uppercase">{cardData.cardHolder || 'VALUED CLIENT'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#ECE7DA]/50 block uppercase">Expires</span>
                          <span className="font-mono text-[#D4AF37]">{cardData.expiry || 'MM/YY'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#ECE7DA]/70 uppercase mb-1">Card Number</label>
                        <input
                          type="text"
                          value={cardData.cardNumber}
                          onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                          className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2 text-xs text-[#ECE7DA] font-mono focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#ECE7DA]/70 uppercase mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          value={cardData.cardHolder}
                          onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value })}
                          className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-4 py-2 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-view: COD */}
                {paymentMethod === 'COD' && (
                  <div className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-[#D4AF37] shrink-0" />
                    <p className="text-xs text-[#ECE7DA]/80">
                      Our concierge courier will deliver in sealed luxury packaging. Payment can be made via UPI or Cash upon doorstep delivery.
                    </p>
                  </div>
                )}

                {/* Authentication Security Warning for Guest/Unauthenticated users */}
                {!isUserLoggedIn && (
                  <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444] shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[#ECE7DA] text-xs block font-cinzel tracking-wider">
                          LOGIN REQUIRED FOR PAYMENT
                        </span>
                        <span className="text-[11px] text-[#ECE7DA]/70">
                          Payment authorization requires an active logged-in Patron ID.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="btn-checkout-login-now"
                      onClick={onRequireLogin}
                      className="px-5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#F4E5C3] text-[#0A0A0C] font-bold text-xs tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer shadow-md"
                    >
                      LOG IN / REGISTER
                    </button>
                  </div>
                )}

                {/* Summary Row & Place Order */}
                <div className="pt-6 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-[#ECE7DA]/70 mb-0.5">
                      <span>Subtotal: {formatPrice(rawSubtotal)}</span>
                      <span>•</span>
                      <span>
                        Shipping:{' '}
                        {shipping === 0 ? (
                          <strong className="text-[#10B981]">FREE</strong>
                        ) : (
                          <strong className="text-[#D4AF37]">{formatPrice(shipping)}</strong>
                        )}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-[#ECE7DA]/60 uppercase">TOTAL PAYABLE:</span>
                      <span className="font-cinzel text-2xl font-bold text-[#D4AF37]">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-3 rounded-xl border border-[#D4AF37]/30 text-xs text-[#ECE7DA] hover:bg-[#1E1D28] transition-colors cursor-pointer"
                    >
                      CANCEL
                    </button>

                    {!isUserLoggedIn ? (
                      <button
                        type="button"
                        id="btn-checkout-unauth-pay"
                        onClick={onRequireLogin}
                        className="px-6 py-3 rounded-xl bg-[#23222D] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0C] font-bold text-xs tracking-[0.2em] uppercase transition-all cursor-pointer flex items-center gap-2"
                        title="You must log in to authorize payment"
                      >
                        <Lock className="w-4 h-4 text-[#EF4444]" />
                        <span>LOG IN TO AUTHORIZE PAYMENT</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        id="btn-confirm-place-order"
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E8C868] to-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-[0.2em] uppercase hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all cursor-pointer flex items-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#0A0A0C] border-t-transparent rounded-full animate-spin" />
                            <span>PROCESSING ATELIER ORDER...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>COMPLETE & AUTHORIZE</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step: Confirmed Luxury Receipt */}
            {step === 'confirmed' && completedOrder && (
              <div className="text-center py-6 space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-xs font-semibold tracking-[0.3em] uppercase text-[#D4AF37] font-cinzel">
                    HAUTE ATELIER CONFIRMATION
                  </span>
                  <h3 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide text-[#ECE7DA] mt-1">
                    THANK YOU, {completedOrder.customer.firstName.toUpperCase()}
                  </h3>
                  <p className="text-xs text-[#ECE7DA]/70 mt-2 max-w-md mx-auto">
                    Your bespoke couture order has been registered at our Surat atelier and scheduled for artisanal inspection.
                  </p>
                </div>

                {/* Receipt Card */}
                <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#0E0D14] border border-[#D4AF37]/30 text-left space-y-3">
                  <div className="flex justify-between text-xs pb-2 border-b border-[#D4AF37]/20">
                    <span className="text-[#ECE7DA]/60">Order Reference:</span>
                    <span className="font-mono font-bold text-[#D4AF37]">{completedOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs pb-2 border-b border-[#D4AF37]/20">
                    <span className="text-[#ECE7DA]/60">Tracking ID:</span>
                    <span className="font-mono text-[#ECE7DA]">{completedOrder.trackingNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs pb-2 border-b border-[#D4AF37]/20">
                    <span className="text-[#ECE7DA]/60">Fulfillment:</span>
                    <span className="text-[#ECE7DA] text-right font-light">
                      {completedOrder.customer.city ? `${completedOrder.customer.city}, ${completedOrder.customer.state}` : 'Surat Atelier Lounge'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1">
                    <span className="font-bold text-[#ECE7DA]">Total Paid:</span>
                    <span className="font-cinzel font-bold text-sm text-[#D4AF37]">
                      {formatPrice(completedOrder.total)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#D4AF37]/30 text-xs text-[#ECE7DA] hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>PRINT ATELIER INVOICE</span>
                  </button>
                  <button
                    id="btn-finish-checkout"
                    onClick={onClose}
                    className="px-8 py-2.5 rounded-full bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-widest uppercase hover:bg-[#F4E5C3] transition-colors"
                  >
                    RETURN TO STORE
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
