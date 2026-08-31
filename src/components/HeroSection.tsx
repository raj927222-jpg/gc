import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Compass, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  onExploreClick?: () => void;
  onShopNowClick?: () => void;
  onExplore?: () => void;
  backgroundImage?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  onShopNowClick,
  onExplore,
  backgroundImage = 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=2000&auto=format&fit=crop',
}) => {
  const handleExplore = () => {
    if (onExploreClick) onExploreClick();
    else if (onExplore) onExplore();
    else {
      document.getElementById('featured-collection')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShopNow = () => {
    if (onShopNowClick) onShopNowClick();
    else if (onExplore) onExplore();
    else {
      document.getElementById('featured-collection')?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <section
      id="hero"
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0C] pt-20"
    >
      {/* Background Imagery with Ken Burns Animation */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          id="hero-main-background-image"
          className="w-full h-full bg-cover bg-center animate-ken-burns scale-105 transition-all duration-1000"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            filter: 'brightness(0.35) contrast(1.15)',
          }}
        />

        {/* Dramatic Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/50 to-[#0A0A0C]/80" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0A0A0C]/60 to-[#0A0A0C]" />
        <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />

        {/* Ambient Gold Ray Light Effects */}
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-[#D4AF37]/10 blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-[#8B6F1F]/10 blur-[150px] pointer-events-none" />
      </div>

      {/* Floating Particles in Hero */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: `${Math.random() * 3 + 2}px`,
              height: `${Math.random() * 3 + 2}px`,
              left: `${Math.random() * 100}%`,
              bottom: '-20px',
              animationDuration: `${Math.random() * 12 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Center Editorial Hero Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center py-16 sm:py-24">
        {/* Subtle Haute Couture Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#14131A]/60 backdrop-blur-md mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#F4E5C3]">
            SURAT HAUTE ATELIER • BESPOKE 2026
          </span>
        </motion.div>

        {/* Main Dramatic Brand Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="font-cinzel text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDF7] via-[#F4E5C3] to-[#D4AF37] drop-shadow-[0_10px_40px_rgba(212,175,55,0.2)] pl-[0.22em]"
        >
          GYUTARO
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-2"
        >
          <span className="font-cinzel text-2xl sm:text-3xl md:text-4xl tracking-[0.42em] text-[#D4AF37] font-light pl-[0.42em] uppercase">
            COLLECTION
          </span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-6 text-sm sm:text-base md:text-lg font-light tracking-[0.28em] uppercase text-[#ECE7DA]/80 max-w-2xl font-editorial"
        >
          “THE ART OF MODERN MENSWEAR”
        </motion.p>

        {/* Short Editorial Blurb */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-3 text-xs sm:text-sm text-[#ECE7DA]/60 max-w-xl font-light leading-relaxed tracking-wider"
        >
          Handcrafted in Surat, Gujarat with generational artisan mastery, purest Egyptian cottons, Italian leather, and precious gold zari brocade.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto"
        >
          <button
            id="btn-hero-explore"
            onClick={handleExplore}
            data-cursor="button"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#E8C868] to-[#D4AF37] text-[#0A0A0C] font-semibold text-xs tracking-[0.25em] uppercase hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group"
          >
            <span>EXPLORE COLLECTION</span>
            <ArrowRight className="w-4 h-4 text-[#0A0A0C] group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            id="btn-hero-shop-now"
            onClick={handleShopNow}
            data-cursor="button"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#14131A]/80 border border-[#D4AF37]/50 text-[#ECE7DA] hover:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#1A1924] font-semibold text-xs tracking-[0.25em] uppercase backdrop-blur-md hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#D4AF37]" />
            <span>SHOP NOW</span>
          </button>
        </motion.div>

        {/* Key USPs Mini-strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="mt-14 grid grid-cols-2 gap-6 sm:gap-12 pt-8 border-t border-[#D4AF37]/15 max-w-lg w-full"
        >
          <div className="flex flex-col items-center text-center">
            <span className="font-cinzel text-base sm:text-lg font-bold text-[#D4AF37]">100%</span>
            <span className="text-[10px] sm:text-xs text-[#ECE7DA]/70 uppercase tracking-wider">Artisanal Craft</span>
          </div>
          <div className="flex flex-col items-center text-center border-l border-[#D4AF37]/15">
            <span className="font-cinzel text-base sm:text-lg font-bold text-[#D4AF37]">BESPOKE</span>
            <span className="text-[10px] sm:text-xs text-[#ECE7DA]/70 uppercase tracking-wider">Custom Tailoring</span>
          </div>
        </motion.div>
      </div>

      {/* Subtle Scroll Cue Indicator at Bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        onClick={handleExplore}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer group"
      >
        <span className="text-[9px] tracking-[0.3em] uppercase text-[#ECE7DA]/50 group-hover:text-[#D4AF37] transition-colors">
          SCROLL TO DISCOVER
        </span>
        <div className="w-5 h-9 rounded-full border border-[#D4AF37]/30 flex justify-center p-1 group-hover:border-[#D4AF37] transition-colors">
          <motion.div
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1 h-2 rounded-full bg-[#D4AF37]"
          />
        </div>
      </motion.div>
    </section>
  );
};
