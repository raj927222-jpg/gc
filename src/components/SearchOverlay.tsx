import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowRight, Sparkles, Tag, Eye } from 'lucide-react';
import { Product } from '../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  currencySymbol: string;
  currencyRate: number;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  products = [],
  onSelectProduct,
  currencySymbol,
  currencyRate,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const popularKeywords = [
    'SHIRT',
    'PANT',
    'JEANS',
    'JACKET',
    'BLAZER',
    'SHOES',
    'WATCHES',
    'GOGGLES',
    'COMBO',
    'CAPS',
  ];

  const safeProducts = Array.isArray(products) ? products : [];
  const filtered = safeProducts.filter((p) => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.tagline || '').toLowerCase().includes(q) ||
      (p.fabric || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  });

  const formatPrice = (priceInInr: number) => {
    const converted = Math.round(priceInInr * currencyRate);
    return `${currencySymbol}${converted.toLocaleString('en-IN')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[95] bg-[#0A0A0C]/96 backdrop-blur-2xl flex flex-col p-4 sm:p-8 md:p-12 overflow-y-auto"
      >
        {/* Top Header */}
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-cinzel text-xs font-semibold text-[#D4AF37] tracking-[0.3em] uppercase">
              SEARCH GYUTARO ATELIER ARCHIVE
            </span>
          </div>

          <button
            id="btn-close-search"
            onClick={onClose}
            className="p-2.5 rounded-full text-[#ECE7DA]/70 hover:text-[#D4AF37] hover:bg-[#14131A] border border-[#D4AF37]/20 transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Big Search Input Field */}
        <div className="max-w-4xl mx-auto w-full mt-8 sm:mt-12">
          <div className="relative flex items-center">
            <Search className="w-7 h-7 text-[#D4AF37] absolute left-4 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH SILHOUETTES, FABRICS, TIMEPIECES, CODES..."
              className="w-full bg-[#14131A]/80 border-b-2 border-[#D4AF37] rounded-xl pl-16 pr-6 py-5 text-sm sm:text-lg text-[#ECE7DA] placeholder:text-[#ECE7DA]/30 focus:outline-none focus:bg-[#14131A] shadow-2xl font-cinzel tracking-wider"
            />
          </div>

          {/* Quick Keywords Strip */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-semibold mr-1">
              CURATED TAGS:
            </span>
            {popularKeywords.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-3 py-1 rounded-full bg-[#14131A] border border-[#D4AF37]/20 text-[10px] tracking-widest uppercase text-[#ECE7DA]/70 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Live Search Results */}
        <div className="max-w-5xl mx-auto w-full mt-10 flex-1">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-cinzel tracking-widest text-[#ECE7DA]/60 uppercase">
              {query ? `RESULTS FOR "${query.toUpperCase()}" (${filtered.length})` : `FULL ATELIER COLLECTION (${products.length})`}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-cinzel text-lg text-[#ECE7DA]/60">NO PIECES MATCHED YOUR QUERY</p>
              <p className="text-xs text-[#ECE7DA]/40 mt-1">Try searching for "Shirt", "Jacket", or "Watch".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectProduct(item);
                    onClose();
                  }}
                  className="group p-3 rounded-xl bg-[#14131A] border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#0A0A0C] mb-3">
                    <img
                      src={item.images.front}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] text-[#D4AF37]">
                      <span className="font-semibold uppercase tracking-widest">{item.category}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-cinzel text-sm font-bold text-[#ECE7DA] group-hover:text-[#D4AF37] transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-[#ECE7DA]/60 line-clamp-1 mt-0.5">{item.tagline}</p>
                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-[#D4AF37]/15">
                      <span className="font-cinzel font-bold text-xs text-[#D4AF37]">
                        {formatPrice(item.price)}
                      </span>
                      <span className="text-[10px] text-[#ECE7DA]/60 group-hover:text-[#D4AF37] uppercase flex items-center gap-1">
                        VIEW PIECE <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
