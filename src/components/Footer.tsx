import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  Heart
} from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenAuth }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="relative bg-[#070709] border-t border-[#D4AF37]/20 text-[#ECE7DA] overflow-hidden pt-20 pb-12">
      {/* Subtle Ambient Light */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-[#D4AF37]/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Newsletter & Atelier Invitation */}
        <div className="p-8 sm:p-12 rounded-2xl bg-[#14131A] border border-[#D4AF37]/30 shadow-2xl mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[11px] font-cinzel font-semibold tracking-[0.3em] uppercase text-[#D4AF37]">
                PRIVATE ATELIER DISPATCHES
              </span>
            </div>
            <h3 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide text-[#ECE7DA]">
              JOIN THE GYUTARO PRIVILEGE
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#ECE7DA]/70 font-light max-w-md">
              Receive private invitations to seasonal trunk shows, limited bespoke allocations, and editorial lookbooks.
            </p>
          </div>

          <div className="lg:col-span-6">
            {newsletterSubscribed ? (
              <div className="p-4 rounded-xl bg-[#0E0D14] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold tracking-wider flex items-center gap-3">
                <Award className="w-5 h-5" />
                <span>WELCOME TO GYUTARO PRIVILEGE. CHECK YOUR INBOX FOR WELCOME INVITATION.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="ENTER YOUR CONCIERGE EMAIL..."
                  className="flex-1 bg-[#0E0D14] border border-[#D4AF37]/30 rounded-xl px-5 py-3.5 text-xs text-[#ECE7DA] placeholder:text-[#ECE7DA]/40 focus:outline-none focus:border-[#D4AF37] font-cinzel tracking-wider"
                />
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-[0.2em] uppercase hover:bg-[#F4E5C3] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all cursor-pointer whitespace-nowrap"
                >
                  SUBSCRIBE
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Main Footer Links & Heritage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-[#D4AF37]/15">
          {/* Brand Col (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-[0.25em] text-[#D4AF37]">
              GYUTARO
            </h2>
            <span className="block text-[10px] tracking-[0.4em] uppercase text-[#ECE7DA]/60 -mt-2">
              COLLECTION • SURAT
            </span>
            <p className="text-xs text-[#ECE7DA]/70 font-light leading-relaxed max-w-sm pt-2">
              Contemporary high-end men's fashion atelier creating bespoke garments, timepieces, and accessories engineered from legendary Surat textile roots.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#14131A] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0C] transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="tel:+919725917116"
                className="w-9 h-9 rounded-full bg-[#14131A] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0C] transition-all"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href="mailto:concierge@gyutarocollection.com"
                className="w-9 h-9 rounded-full bg-[#14131A] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0C] transition-all"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col: The Collection */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs font-bold tracking-[0.2em] uppercase text-[#D4AF37]">
              THE ARCHIVE
            </h4>
            <ul className="space-y-2 text-xs text-[#ECE7DA]/70 font-light">
              <li><a href="#collection" className="hover:text-[#D4AF37] transition-colors">Silk & Giza Shirts</a></li>
              <li><a href="#collection" className="hover:text-[#D4AF37] transition-colors">Bespoke Dinner Jackets</a></li>
              <li><a href="#collection" className="hover:text-[#D4AF37] transition-colors">Pleated Wool Trousers</a></li>
              <li><a href="#collection" className="hover:text-[#D4AF37] transition-colors">Horological Tourbillons</a></li>
              <li><a href="#collection" className="hover:text-[#D4AF37] transition-colors">Florentine Calfskin Shoes</a></li>
            </ul>
          </div>

          {/* Col: Atelier & Craft */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs font-bold tracking-[0.2em] uppercase text-[#D4AF37]">
              ATELIER HERITAGE
            </h4>
            <ul className="space-y-2 text-xs text-[#ECE7DA]/70 font-light">
              <li><a href="#about" className="hover:text-[#D4AF37] transition-colors">Surat Zari Weaving</a></li>
              <li><a href="#philosophy" className="hover:text-[#D4AF37] transition-colors">Brand Philosophy</a></li>
              <li><a href="#featured-collection" className="hover:text-[#D4AF37] transition-colors">Signature Pieces</a></li>
              <li>
                <button onClick={onOpenAuth} className="hover:text-[#D4AF37] transition-colors text-left">
                  Client Privilege Login
                </button>
              </li>
            </ul>
          </div>

          {/* Col: Surat Atelier Contact */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs font-bold tracking-[0.2em] uppercase text-[#D4AF37]">
              SURAT ATELIER
            </h4>
            <div className="space-y-2 text-xs text-[#ECE7DA]/70 font-light">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>402, Ring Road Textile & Fashion Avenue, Surat, Gujarat 395002</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>+91 9725917116</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>concierge@gyutarocollection.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Guarantee */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#ECE7DA]/40 gap-4">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} GYUTARO COLLECTION. ALL RIGHTS RESERVED.</span>
            <span>•</span>
            <button
              id="btn-footer-admin-login"
              onClick={onOpenAdmin}
              title="Atelier Internal Access"
              className="text-[#ECE7DA]/25 hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1 cursor-pointer font-mono text-[10px]"
            >
              <ShieldCheck className="w-3 h-3 opacity-60" />
              <span>STAFF</span>
            </button>
          </div>
          <div className="flex items-center gap-6">
            <span>TERMS OF ATELIER</span>
            <span>PRIVACY PROTOCOL</span>
            <span>WHITE-GLOVE LOGISTICS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
