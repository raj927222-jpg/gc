import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';

interface LookbookSectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const LookbookSection: React.FC<LookbookSectionProps> = ({
  products,
  onSelectProduct,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const lookbookItems = [
    {
      id: 'look-1',
      title: 'THE SURAT NOCTURNE',
      subtitle: 'Silk-Cotton Shirt with Obsidian Pleated Trousers',
      productId: 'gc-shirt',
      image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1200&auto=format&fit=crop',
      season: 'AUTUMN / WINTER COUTURE',
    },
    {
      id: 'look-2',
      title: 'THE DIPLOMAT DINNER',
      subtitle: 'Zari Brocade Double-Breasted Dinner Tuxedo & Pocket Square',
      productId: 'gc-jacket',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
      season: 'EVENING BLACK TIE',
    },
    {
      id: 'look-3',
      title: 'HOROLOGICAL SOVEREIGN',
      subtitle: '18K Gold Flying Tourbillon with 24K Titanium Optics',
      productId: 'gc-watch',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop',
      season: 'HOROLOGICAL COLLECTOR',
    },
  ];

  const currentLook = lookbookItems[activeIndex];
  const matchedProduct = products.find((p) => p.id === currentLook.productId) || products[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % lookbookItems.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + lookbookItems.length) % lookbookItems.length);
  };

  return (
    <section id="lookbook" className="relative py-28 bg-[#0A0A0C] overflow-hidden border-t border-[#D4AF37]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-px bg-[#D4AF37]/50" />
              <span className="text-xs font-semibold tracking-[0.35em] text-[#D4AF37] uppercase">
                EDITORIAL RUNWAY
              </span>
            </div>
            <h2 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide text-[#ECE7DA]">
              SEASONAL LOOKBOOK
            </h2>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 mt-6 sm:mt-0">
            <button
              onClick={handlePrev}
              className="p-3 rounded-full border border-[#D4AF37]/30 text-[#ECE7DA] hover:text-[#D4AF37] hover:border-[#D4AF37] bg-[#14131A] transition-colors cursor-pointer"
              title="Previous Look"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-mono text-xs text-[#D4AF37] tracking-widest px-2">
              0{activeIndex + 1} / 0{lookbookItems.length}
            </span>
            <button
              onClick={handleNext}
              className="p-3 rounded-full border border-[#D4AF37]/30 text-[#ECE7DA] hover:text-[#D4AF37] hover:border-[#D4AF37] bg-[#14131A] transition-colors cursor-pointer"
              title="Next Look"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cinematic Lookbook Showcase Card */}
        <div className="relative aspect-[16/9] min-h-[440px] sm:min-h-[540px] rounded-2xl overflow-hidden border border-[#D4AF37]/30 shadow-[0_25px_60px_rgba(0,0,0,0.9)] bg-[#14131A]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLook.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img
                src={currentLook.image}
                alt={currentLook.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center filter brightness-60 contrast-110"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0C]/90 via-[#0A0A0C]/40 to-transparent" />

              {/* Content Overlay */}
              <div className="absolute inset-0 p-8 sm:p-12 md:p-16 flex flex-col justify-end max-w-2xl">
                <span className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#D4AF37] mb-2 font-cinzel">
                  {currentLook.season}
                </span>

                <h3 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide text-[#ECE7DA] drop-shadow-md">
                  {currentLook.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-[#ECE7DA]/80 font-light tracking-wider">
                  {currentLook.subtitle}
                </p>

                <div className="mt-8 flex items-center gap-4">
                  <button
                    onClick={() => onSelectProduct(matchedProduct)}
                    className="px-6 py-3 rounded-full bg-[#D4AF37] text-[#0A0A0C] font-semibold text-xs tracking-[0.2em] uppercase hover:bg-[#F4E5C3] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>VIEW FEATURED PIECE</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
