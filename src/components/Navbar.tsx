import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Search,
  ShoppingBag,
  Heart,
  User,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { UserAccount, CurrencyConfig } from '../types';
import { CURRENCIES } from '../data/products';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onReplayIntro?: () => void;
  user: UserAccount | null;
  activeCurrency?: CurrencyConfig;
  onSelectCurrency?: (curr: CurrencyConfig) => void;
  currentCurrency?: string;
  onChangeCurrency?: (curr: string) => void;
  onNavigateSection?: (sectionId: string) => void;
  theme?: 'dark' | 'light';
  onSelectTheme?: (theme: 'dark' | 'light') => void;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  onOpenAuth,
  onOpenAdmin,
  onReplayIntro,
  user,
  activeCurrency,
  onSelectCurrency,
  currentCurrency,
  onChangeCurrency,
  onNavigateSection,
  theme = 'dark',
  onSelectTheme,
  onToggleTheme,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Derive current active currency object safely with robust fallback
  const selectedCurrency: CurrencyConfig =
    activeCurrency ||
    CURRENCIES.find((c) => c.code === currentCurrency || c.label === currentCurrency) ||
    CURRENCIES[0];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'HOME', id: 'hero' },
    { label: 'COLLECTION', id: 'featured-collection' },
    { label: 'PHILOSOPHY', id: 'philosophy' },
    { label: 'ABOUT', id: 'about' },
    { label: 'CONTACT', id: 'footer' },
  ];

  const handleLinkClick = (id: string) => {
    setIsMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(id);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSelectCurrency = (curr: CurrencyConfig) => {
    if (onSelectCurrency) {
      onSelectCurrency(curr);
    }
    if (onChangeCurrency) {
      onChangeCurrency(curr.label);
    }
  };

  return (
    <>
      <header
        id="main-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-[#0A0A0C]/90 backdrop-blur-xl border-b border-[#D4AF37]/20 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
            : 'bg-gradient-to-b from-[#0A0A0C]/90 via-[#0A0A0C]/40 to-transparent py-5 border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Mobile Toggle & Desktop Links */}
          <div className="flex items-center gap-6">
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#ECE7DA] hover:text-[#D4AF37] transition-colors rounded-full focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-[#D4AF37]" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  onClick={() => handleLinkClick(link.id)}
                  className="text-xs font-medium tracking-[0.25em] text-[#ECE7DA]/80 hover:text-[#D4AF37] transition-all duration-300 relative py-1 group cursor-pointer"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#D4AF37] transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </nav>
          </div>



          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Switcher: Dark Mode and Light Mode Button */}
            <div className="flex items-center p-1 rounded-full bg-[#14131A] border border-[#D4AF37]/30 shadow-inner">
              <button
                id="btn-theme-dark"
                type="button"
                onClick={() => {
                  if (onSelectTheme) onSelectTheme('dark');
                  else if (onToggleTheme) onToggleTheme();
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider font-cinzel transition-all duration-300 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#D4AF37] text-[#0A0A0C] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                    : 'text-[#ECE7DA]/60 hover:text-[#ECE7DA]'
                }`}
                title="Switch to Dark Mode"
                aria-label="Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">DARK</span>
              </button>
              <button
                id="btn-theme-light"
                type="button"
                onClick={() => {
                  if (onSelectTheme) onSelectTheme('light');
                  else if (onToggleTheme) onToggleTheme();
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider font-cinzel transition-all duration-300 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#D4AF37] text-[#0A0A0C] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                    : 'text-[#ECE7DA]/60 hover:text-[#ECE7DA]'
                }`}
                title="Switch to Light Mode"
                aria-label="Light Mode"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LIGHT</span>
              </button>
            </div>

            {/* Search Button */}
            <button
              id="btn-nav-search"
              onClick={onOpenSearch}
              className="p-2 text-[#ECE7DA]/80 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-full transition-all duration-300 cursor-pointer"
              aria-label="Search Collection"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* Wishlist Button */}
            <button
              id="btn-nav-wishlist"
              onClick={onOpenWishlist}
              className="p-2 text-[#ECE7DA]/80 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-full transition-all duration-300 relative cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-4.5 h-4.5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#D4AF37] text-[#0A0A0C] text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth */}
            <button
              id="btn-nav-account"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14131A] border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#ECE7DA] hover:text-[#D4AF37] transition-all duration-300 relative cursor-pointer group shadow-[0_0_10px_rgba(212,175,55,0.1)]"
              aria-label="Account"
            >
              <div className="relative flex items-center justify-center">
                <User className="w-4 h-4 text-[#D4AF37] group-hover:scale-105 transition-transform" />
                {user?.isLoggedIn && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] border border-[#0A0A0C]" />
                )}
              </div>
              <span className="text-xs font-semibold tracking-wider font-cinzel text-[#ECE7DA] group-hover:text-[#D4AF37] transition-colors max-w-[120px] truncate">
                {user?.isLoggedIn
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.firstName || 'Patron'
                  : 'LOGIN'}
              </span>
            </button>

            {/* Shopping Bag Button */}
            <button
              id="btn-nav-cart"
              onClick={onOpenCart}
              className="flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full bg-[#14131A] border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#ECE7DA] hover:text-[#D4AF37] transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.15)] group cursor-pointer"
              aria-label="Shopping Bag"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-[#D4AF37] text-[#0A0A0C] text-[9px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold tracking-wider font-cinzel text-[#D4AF37]">
                BAG
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-[#0A0A0C]/98 backdrop-blur-2xl flex flex-col justify-between pt-24 pb-8 px-8 lg:hidden border-r border-[#D4AF37]/20"
          >
            <div className="flex flex-col gap-6">
              <p className="text-[10px] font-cinzel tracking-[0.3em] text-[#D4AF37] uppercase">
                NAVIGATION
              </p>
              <div className="flex flex-col gap-5">
                {navLinks.map((link, idx) => (
                  <motion.button
                    key={link.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => handleLinkClick(link.id)}
                    className="text-left font-cinzel text-xl tracking-[0.2em] text-[#ECE7DA] hover:text-[#D4AF37] transition-colors py-1 flex items-center justify-between group"
                  >
                    <span>{link.label}</span>
                    <span className="text-xs text-[#D4AF37]/40 group-hover:text-[#D4AF37] transition-colors">
                      0{idx + 1}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Mobile Bottom Footer */}
            <div className="border-t border-[#D4AF37]/20 pt-5 flex flex-col gap-4">
              <div>
                <p className="text-[9px] font-cinzel tracking-[0.25em] text-[#D4AF37] uppercase mb-2">THEME MODE</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectTheme) onSelectTheme('dark');
                      else if (onToggleTheme) onToggleTheme();
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/15 font-bold shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                        : 'border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>DARK MODE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectTheme) onSelectTheme('light');
                      else if (onToggleTheme) onToggleTheme();
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/15 font-bold shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                        : 'border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>LIGHT MODE</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center pt-2 border-t border-white/5">
                {onReplayIntro && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onReplayIntro();
                    }}
                    className="flex items-center gap-2 text-xs text-[#ECE7DA]/70 hover:text-[#D4AF37] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>REPLAY INTRO</span>
                  </button>
                )}
              </div>

              <div className="text-[10px] text-[#ECE7DA]/50 tracking-wider text-center">
                GYUTARO COLLECTION • SURAT, GUJARAT, INDIA
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
