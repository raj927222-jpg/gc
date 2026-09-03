import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Heart,
  ShoppingBag,
  Sparkles,
  Truck,
  ShieldCheck,
  ChevronDown,
  Ruler,
  Star,
  Check,
  Share2,
  Lock
} from 'lucide-react';
import { Product, ProductColor } from '../types';
import { SizeGuideModal } from './SizeGuideModal';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, color: ProductColor, size: string, quantity: number) => void;
  onBuyNow: (product: Product, color: ProductColor, size: string, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  onColorChange: (color: ProductColor) => void;
  currencySymbol: string;
  currencyRate: number;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isWishlisted,
  onColorChange,
  currencySymbol,
  currencyRate,
}) => {
  if (!isOpen || !product) return null;

  const [selectedView, setSelectedView] = useState<'front'>('front');
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0] || {
    name: 'Imperial Obsidian',
    hex: '#0A0A0C',
    accent: '#D4AF37',
    glow: 'rgba(212, 175, 55, 0.4)',
    bgGlow: 'rgba(212, 175, 55, 0.08)',
  });
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('details');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const formatPrice = (priceInInr: number) => {
    const converted = Math.round(priceInInr * currencyRate);
    return `${currencySymbol}${converted.toLocaleString('en-IN')}`;
  };

  const handleColorSelect = (color: ProductColor) => {
    setSelectedColor(color);
    onColorChange(color);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const toggleAccordion = (section: string) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  const views = [
    { id: 'front', label: 'Front View', img: product.images.front },
  ];

  const currentMainImage = product.images.front;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Darkened Backdrop with Color Glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0A0A0C]/92 backdrop-blur-2xl transition-colors duration-700"
          style={{
            backgroundColor: 'rgba(10, 10, 12, 0.94)',
          }}
        />

        {/* Modal Main Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 30 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-6xl bg-[#14131A] rounded-2xl border transition-colors duration-500 overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.95)] my-auto max-h-[92vh] flex flex-col"
          style={{
            borderColor: selectedColor.accent ? `${selectedColor.accent}55` : 'rgba(212, 175, 55, 0.35)',
            boxShadow: `0 25px 80px rgba(0,0,0,0.9), 0 0 40px ${selectedColor.glow || 'rgba(212, 175, 55, 0.2)'}`,
          }}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/20 bg-[#0E0D14]/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="font-cinzel text-xs font-semibold text-[#D4AF37] tracking-[0.25em] uppercase">
                GYUTARO HAUTE ATELIER
              </span>
              <span className="text-xs text-[#ECE7DA]/40">•</span>
              <span className="text-xs text-[#ECE7DA]/70 uppercase tracking-widest">
                {product.category}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-modal-share"
                onClick={handleShare}
                className="p-2 rounded-full text-[#ECE7DA]/70 hover:text-[#D4AF37] hover:bg-[#1E1D28] transition-colors cursor-pointer"
                title="Share Piece Link"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                id="btn-modal-wishlist"
                onClick={() => onToggleWishlist(product)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'text-[#D4AF37] bg-[#D4AF37]/15'
                    : 'text-[#ECE7DA]/70 hover:text-[#D4AF37] hover:bg-[#1E1D28]'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>

              <button
                id="btn-close-product-modal"
                onClick={onClose}
                className="p-2 rounded-full text-[#ECE7DA]/70 hover:text-[#D4AF37] hover:bg-[#1E1D28] transition-colors cursor-pointer ml-1"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body: Two-Column Responsive Layout */}
          <div className="overflow-y-auto p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Visual Gallery & 360 Viewer (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Main Visual Display */}
              <div className="relative w-full rounded-xl overflow-hidden bg-[#0A0A0C] border border-[#D4AF37]/20 flex items-center justify-center min-h-[380px] sm:min-h-[480px]">
                <div
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                  onMouseMove={handleMouseMove}
                  className="relative w-full h-full min-h-[380px] sm:min-h-[480px] flex items-center justify-center cursor-crosshair overflow-hidden group"
                >
                  <img
                    src={currentMainImage}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full max-h-[520px] object-cover object-center transition-transform duration-300"
                    style={
                      isZooming
                        ? {
                            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                            transform: 'scale(1.8)',
                          }
                        : { transform: 'scale(1)' }
                    }
                  />

                  {/* Magnifier indicator hint */}
                  {!isZooming && (
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#0A0A0C]/70 backdrop-blur-md text-[10px] tracking-widest text-[#ECE7DA]/70 border border-[#D4AF37]/20 pointer-events-none">
                      HOVER TO MAGNIFY
                    </div>
                  )}
                </div>
              </div>

              {/* View Switcher Thumbnails */}
              <div className="flex items-center gap-2 sm:gap-3">
                {views.map((v) => {
                  const isActive = selectedView === v.id;
                  return (
                    <button
                      key={v.id}
                      id={`view-thumb-${v.id}`}
                      onClick={() => setSelectedView(v.id as any)}
                      className={`relative rounded-lg overflow-hidden border p-1 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer w-24 sm:w-28 ${
                        isActive
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                          : 'border-[#D4AF37]/20 bg-[#0E0D14] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <img
                        src={v.img}
                        alt={v.label}
                        referrerPolicy="no-referrer"
                        className="aspect-[4/3] w-full object-cover rounded"
                      />
                      <span className="text-[9px] tracking-wider uppercase font-medium text-[#ECE7DA]/80 mt-1 line-clamp-1">
                        {v.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Product Details, Selectors, Accordions (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                {/* Monogram / Category */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#D4AF37]">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1 text-[#D4AF37] text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-xs">{product.rating}</span>
                    <span className="text-[#ECE7DA]/40 text-[11px]">({product.reviewsCount} reviews)</span>
                  </div>
                </div>

                {/* Product Name */}
                <h2 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide text-[#ECE7DA]">
                  {product.name}
                </h2>

                {/* Tagline */}
                <p className="text-xs sm:text-sm text-[#D4AF37] font-medium tracking-wide mt-1">
                  {product.tagline}
                </p>

                {/* Price Display */}
                <div className="mt-4 flex items-baseline gap-3 pb-4 border-b border-[#D4AF37]/20">
                  <span className="font-cinzel text-2xl sm:text-3xl font-bold text-[#ECE7DA]">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-[#ECE7DA]/40 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold tracking-wider text-[#10B981] uppercase ml-auto">
                    COMPLIMENTARY SHIPPING
                  </span>
                </div>

                {/* Editorial Description */}
                <p className="mt-4 text-xs sm:text-sm text-[#ECE7DA]/80 leading-relaxed font-light">
                  {product.description}
                </p>

                {/* SIZE SELECTOR */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold tracking-widest uppercase text-[#ECE7DA]">
                      SELECT SIZE
                    </span>
                    <button
                      id="btn-open-size-guide"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="flex items-center gap-1 text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>SIZE GUIDE</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {product.sizes.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          id={`size-${size.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          onClick={() => setSelectedSize(size)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium tracking-wider transition-all duration-200 cursor-pointer border ${
                            isSelected
                              ? 'bg-[#D4AF37] text-[#0A0A0C] border-[#D4AF37] font-bold shadow-md'
                              : 'bg-[#0E0D14] text-[#ECE7DA]/80 border-[#D4AF37]/20 hover:border-[#D4AF37]/60'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* QUANTITY & ACTIONS */}
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {/* Quantity Counter */}
                    <div className="flex items-center bg-[#0E0D14] border border-[#D4AF37]/30 rounded-lg p-1">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center text-[#ECE7DA] hover:text-[#D4AF37] text-sm font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[#ECE7DA] font-mono">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#ECE7DA] hover:text-[#D4AF37] text-sm font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Bag Button */}
                    <button
                      id="btn-modal-add-to-bag"
                      onClick={() => onAddToCart(product, selectedColor, selectedSize, quantity)}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#1F1E2A] border border-[#D4AF37]/50 hover:border-[#D4AF37] text-[#ECE7DA] hover:text-[#D4AF37] font-semibold text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                      <span>ADD TO BAG</span>
                    </button>
                  </div>

                  {/* Direct Buy Now Button */}
                  <button
                    id="btn-modal-buy-now"
                    onClick={() => onBuyNow(product, selectedColor, selectedSize, quantity)}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E8C868] to-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-[0.25em] uppercase hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#0A0A0C]" />
                    <span>BUY NOW • DIRECT CHECKOUT</span>
                  </button>
                </div>

                {/* ACCORDION SECTIONS */}
                <div className="mt-8 divide-y divide-[#D4AF37]/15 border-y border-[#D4AF37]/15">
                  {/* Product Details */}
                  <div>
                    <button
                      onClick={() => toggleAccordion('details')}
                      className="w-full py-3 flex items-center justify-between text-xs font-semibold tracking-widest uppercase text-[#ECE7DA] hover:text-[#D4AF37] transition-colors"
                    >
                      <span>PRODUCT DETAILS & CRAFT</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#D4AF37] transition-transform duration-300 ${
                          activeAccordion === 'details' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {activeAccordion === 'details' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pb-4 text-xs text-[#ECE7DA]/75"
                        >
                          <ul className="space-y-1.5 list-disc pl-4">
                            {product.details.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fabric & Material */}
                  <div>
                    <button
                      onClick={() => toggleAccordion('fabric')}
                      className="w-full py-3 flex items-center justify-between text-xs font-semibold tracking-widest uppercase text-[#ECE7DA] hover:text-[#D4AF37] transition-colors"
                    >
                      <span>FABRIC & SURAT TEXTILE MATERIAL</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#D4AF37] transition-transform duration-300 ${
                          activeAccordion === 'fabric' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {activeAccordion === 'fabric' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pb-4 text-xs text-[#ECE7DA]/75 leading-relaxed"
                        >
                          <p>{product.fabric}</p>
                          <p className="mt-2 text-[#D4AF37]/90 italic">
                            Dry clean only. Store in provided luxury breathable dust cover.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Shipping & Returns */}
                  <div>
                    <button
                      onClick={() => toggleAccordion('shipping')}
                      className="w-full py-3 flex items-center justify-between text-xs font-semibold tracking-widest uppercase text-[#ECE7DA] hover:text-[#D4AF37] transition-colors"
                    >
                      <span>COMPLIMENTARY SHIPPING & RETURNS</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#D4AF37] transition-transform duration-300 ${
                          activeAccordion === 'shipping' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {activeAccordion === 'shipping' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pb-4 text-xs text-[#ECE7DA]/75 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#D4AF37]" />
                            <span>Express 2-4 business day pan-India courier delivery via BlueDart Luxe.</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                            <span>14-day hassle-free doorstep returns and size exchange.</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Size Guide Modal Sub-component */}
        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          category={product.category}
        />
      </div>
    </AnimatePresence>
  );
};
