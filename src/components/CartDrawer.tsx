import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Gift,
  ArrowRight,
  ShieldCheck,
  Tag,
  Sparkles
} from 'lucide-react';
import { CartItem, ShippingConfig } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToCheckout: () => void;
  currencySymbol: string;
  currencyRate: number;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
  shippingConfig?: ShippingConfig;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  currencySymbol,
  currencyRate,
  isLoggedIn = false,
  onRequireLogin,
  shippingConfig,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [isGiftPackaging, setIsGiftPackaging] = useState(false);

  const safeItems = Array.isArray(items) ? items.filter((i) => i && i.product && typeof i.product === 'object') : [];

  const formatPrice = (priceInInr: number) => {
    const converted = Math.round((priceInInr || 0) * currencyRate);
    return `${currencySymbol}${converted.toLocaleString('en-IN')}`;
  };

  const rawSubtotal = safeItems.reduce(
    (acc, item) => acc + (item.product?.price || 0) * (item.quantity || 1),
    0
  );

  const isShippingChargesEnabled = shippingConfig ? shippingConfig.shippingChargesEnabled : true;
  const standardFee = shippingConfig?.standardShippingFee ?? 450;
  const threshold = shippingConfig?.freeShippingThreshold ?? 15000;
  const shippingLabel = shippingConfig?.shippingLabel || 'Express White-Glove Shipping';

  const shippingFee = !isShippingChargesEnabled
    ? 0
    : (rawSubtotal === 0 || (threshold > 0 && rawSubtotal > threshold) ? 0 : standardFee);

  const discountAmount = discountApplied ? Math.round(rawSubtotal * 0.1) : 0;
  const giftPackagingFee = isGiftPackaging ? 500 : 0;
  const finalTotal = rawSubtotal - discountAmount + giftPackagingFee + shippingFee;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'GYUTARO10') {
      setDiscountApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid promotion code. Try "GYUTARO10" for 10% off.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0A0A0C]/85 backdrop-blur-md"
        />

        {/* Slide-out Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 right-0 max-w-full w-full sm:w-[480px] bg-[#14131A] border-l border-[#D4AF37]/30 shadow-2xl flex flex-col justify-between z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#0E0D14]">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-cinzel text-lg font-bold tracking-wider text-[#ECE7DA]">
                SHOPPING BAG ({safeItems.reduce((a, b) => a + (b.quantity || 1), 0)})
              </h3>
            </div>
            <button
              id="btn-close-cart"
              onClick={onClose}
              className="p-2 rounded-full text-[#ECE7DA]/60 hover:text-[#D4AF37] hover:bg-[#1E1D28] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {safeItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-4">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h4 className="font-cinzel text-base font-bold text-[#ECE7DA] tracking-wider">
                  YOUR BAG IS CURRENTLY EMPTY
                </h4>
                <p className="text-xs text-[#ECE7DA]/60 mt-2 font-light max-w-xs">
                  Discover modern luxury menswear from our Surat atelier collection.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 rounded-full bg-[#D4AF37] text-[#0A0A0C] font-semibold text-xs tracking-widest uppercase hover:bg-[#F4E5C3] transition-colors cursor-pointer"
                >
                  EXPLORE COLLECTION
                </button>
              </div>
            ) : (
              safeItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex gap-4 relative group"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.product?.images?.front || ''}
                    alt={item.product?.name || 'Product'}
                    referrerPolicy="no-referrer"
                    className="w-20 h-24 object-cover rounded-lg border border-[#D4AF37]/20 shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-cinzel text-sm font-bold text-[#ECE7DA] tracking-wide">
                          {item.product?.name || 'Atelier Piece'}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-[#ECE7DA]/40 hover:text-[#EF4444] transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-[#ECE7DA]/70 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          Color:
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full border border-white/20 ml-0.5"
                            style={{ backgroundColor: item.selectedColor?.hex || '#0A0A0C' }}
                          />
                        </span>
                        <span>Size: <strong className="text-[#D4AF37]">{item.selectedSize || 'Standard'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#D4AF37]/10">
                      {/* Quantity Selector */}
                      <div className="flex items-center bg-[#14131A] border border-[#D4AF37]/30 rounded p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) - 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#ECE7DA] hover:text-[#D4AF37] text-xs font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-[#ECE7DA]">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#ECE7DA] hover:text-[#D4AF37] text-xs font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Price */}
                      <span className="font-cinzel text-sm font-bold text-[#D4AF37]">
                        {formatPrice((item.product?.price || 0) * (item.quantity || 1))}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer Calculations & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#D4AF37]/20 bg-[#0E0D14] space-y-4">
              {/* Luxury Gift Packaging Option */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#14131A] border border-[#D4AF37]/20">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#D4AF37]" />
                  <div className="text-xs">
                    <span className="text-[#ECE7DA] font-medium block">Luxury Velvet Gift Presentation</span>
                    <span className="text-[10px] text-[#ECE7DA]/60">Gold wax sealed atelier box</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsGiftPackaging(!isGiftPackaging)}
                  className={`px-3 py-1 rounded text-[11px] font-semibold tracking-wider transition-colors ${
                    isGiftPackaging
                      ? 'bg-[#D4AF37] text-[#0A0A0C]'
                      : 'bg-[#1F1E29] text-[#ECE7DA]/70 hover:text-[#D4AF37]'
                  }`}
                >
                  {isGiftPackaging ? 'ADDED (+₹500)' : '+ ADD ₹500'}
                </button>
              </div>

              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="PROMO CODE (e.g. GYUTARO10)"
                    className="w-full bg-[#14131A] border border-[#D4AF37]/30 rounded-lg px-3 py-2 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/40 uppercase tracking-widest focus:outline-none focus:border-[#D4AF37]"
                  />
                  <Tag className="w-3.5 h-3.5 text-[#D4AF37] absolute right-3 top-2.5" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1F1E29] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#0A0A0C] text-xs font-bold tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  APPLY
                </button>
              </form>
              {discountApplied && (
                <div className="text-[11px] text-[#10B981] flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3" />
                  <span>10% VIP ATELIER DISCOUNT APPLIED!</span>
                </div>
              )}
              {promoError && (
                <p className="text-[11px] text-[#EF4444]">{promoError}</p>
              )}

              {/* Calculations */}
              <div className="space-y-1.5 text-xs text-[#ECE7DA]/75 pt-2 border-t border-[#D4AF37]/15">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-cinzel">{formatPrice(rawSubtotal)}</span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-[#10B981]">
                    <span>VIP Discount (10%)</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                {isGiftPackaging && (
                  <div className="flex justify-between text-[#D4AF37]">
                    <span>Gift Presentation</span>
                    <span>+{formatPrice(giftPackagingFee)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="truncate pr-2">{shippingLabel}</span>
                  <span className="font-cinzel shrink-0">
                    {shippingFee === 0 ? (
                      <span className="text-[#10B981] font-bold">
                        FREE {!isShippingChargesEnabled ? '(Complimentary)' : (threshold > 0 && rawSubtotal > threshold ? `(> ${formatPrice(threshold)})` : '')}
                      </span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#ECE7DA] pt-2 border-t border-[#D4AF37]/20 font-cinzel">
                  <span>ESTIMATED TOTAL</span>
                  <span className="text-[#D4AF37] text-base">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Authentication indicator */}
              {!isLoggedIn && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[11px] text-[#ECE7DA]/80">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span>Login with your Patron ID to complete payment</span>
                  </div>
                  {onRequireLogin && (
                    <button
                      type="button"
                      onClick={onRequireLogin}
                      className="text-[#D4AF37] hover:underline font-bold font-cinzel text-[10px] uppercase tracking-wider cursor-pointer ml-2 whitespace-nowrap"
                    >
                      LOG IN
                    </button>
                  )}
                </div>
              )}

              {/* Checkout Action Button */}
              <button
                id="btn-cart-checkout"
                onClick={!isLoggedIn && onRequireLogin ? onRequireLogin : onProceedToCheckout}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E8C868] to-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-[0.25em] uppercase hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xl"
              >
                <span>{!isLoggedIn ? 'LOG IN & PROCEED TO CHECKOUT' : 'PROCEED TO CHECKOUT'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="w-full text-center text-xs tracking-widest uppercase text-[#ECE7DA]/60 hover:text-[#D4AF37] transition-colors py-1 cursor-pointer"
              >
                CONTINUE BROWSING
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveFromWishlist: (productId: string) => void;
  onMoveToCart: (product: any) => void;
  currencySymbol: string;
  currencyRate: number;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  items = [],
  onRemoveFromWishlist,
  onMoveToCart,
  currencySymbol,
  currencyRate,
}) => {
  if (!isOpen) return null;

  const safeItems = Array.isArray(items) ? items.filter((i) => i && i.product && typeof i.product === 'object') : [];

  const formatPrice = (priceInInr: number) => {
    const converted = Math.round((priceInInr || 0) * currencyRate);
    return `${currencySymbol}${converted.toLocaleString('en-IN')}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0A0A0C]/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 right-0 max-w-full w-full sm:w-[460px] bg-[#14131A] border-l border-[#D4AF37]/30 shadow-2xl flex flex-col justify-between z-10"
        >
          <div className="p-6 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#0E0D14]">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-cinzel text-lg font-bold tracking-wider text-[#ECE7DA]">
                SAVED PIECES ({safeItems.length})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#ECE7DA]/60 hover:text-[#D4AF37] hover:bg-[#1E1D28] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {safeItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <p className="text-xs text-[#ECE7DA]/60">You have no saved pieces in your wishlist.</p>
              </div>
            ) : (
              safeItems.map((item) => (
                <div
                  key={item.productId || item.product?.id || item.id}
                  className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/20 flex gap-4"
                >
                  <img
                    src={item.product?.images?.front || ''}
                    alt={item.product?.name || 'Saved Piece'}
                    referrerPolicy="no-referrer"
                    className="w-20 h-24 object-cover rounded-lg border border-[#D4AF37]/20 shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-cinzel text-sm font-bold text-[#ECE7DA]">
                        {item.product?.name || 'Atelier Garment'}
                      </h4>
                      <p className="text-xs font-cinzel text-[#D4AF37] mt-1 font-bold">
                        {formatPrice(item.product?.price || 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => onMoveToCart(item.product)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-[#D4AF37] text-[#0A0A0C] text-[11px] font-bold tracking-wider uppercase hover:bg-[#F4E5C3] transition-colors cursor-pointer"
                      >
                        ADD TO BAG
                      </button>
                      <button
                        onClick={() => onRemoveFromWishlist(item.productId || item.product?.id)}
                        className="p-1.5 text-[#ECE7DA]/40 hover:text-[#EF4444] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
