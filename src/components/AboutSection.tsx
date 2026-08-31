import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, MapPin, Feather, Award } from 'lucide-react';

interface AboutSectionProps {
  aboutImage?: string;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  aboutImage = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
}) => {
  return (
    <section id="about" className="relative py-28 sm:py-36 bg-[#0A0A0C] overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-[#D4AF37]/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Editorial Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Layered Editorial Fashion Photography (6 cols) */}
          <div className="lg:col-span-6 relative">
            {/* Primary Large Image */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#D4AF37]/30 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
              <img
                id="about-atelier-primary-image"
                src={aboutImage}
                alt="Gyutaro Collection Atelier Tailoring"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover object-center filter contrast-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/80 via-transparent to-transparent" />
            </div>



            {/* Heritage Badge */}
            <div className="absolute -top-6 -left-4 sm:-left-6 px-4 py-2.5 rounded-xl bg-[#14131A]/90 backdrop-blur-xl border border-[#D4AF37]/50 shadow-xl flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <div className="flex flex-col">
                <span className="text-[9px] tracking-widest uppercase text-[#ECE7DA]/60">ORIGIN</span>
                <span className="text-xs font-bold font-cinzel text-[#D4AF37] tracking-wider">
                  SURAT, GUJARAT
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Text & Story (6 cols) */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-[#D4AF37]/60" />
              <span className="text-xs font-semibold tracking-[0.35em] text-[#D4AF37] uppercase">
                THE ATELIER STORY
              </span>
            </div>

            <h2 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide text-[#ECE7DA] leading-tight">
              GYUTARO COLLECTION
            </h2>

            {/* Gold Divider */}
            <div className="w-24 h-[1.5px] bg-gradient-to-r from-[#D4AF37] to-transparent my-6" />

            {/* Core Quote */}
            <blockquote className="text-base sm:text-lg font-editorial italic text-[#F4E5C3] font-light leading-relaxed mb-6">
              “GYUTARO COLLECTION represents modern luxury through timeless silhouettes, refined materials and contemporary design.”
            </blockquote>

            {/* Story Paragraphs */}
            <div className="space-y-4 text-xs sm:text-sm text-[#ECE7DA]/75 font-light leading-relaxed">
              <p>
                Rooted in the storied textile capital of Surat, Gujarat, our atelier reimagines classic Indian craftsmanship through a sharp, international couture sensibility.
              </p>
              <p>
                From hand-selected Egyptian long-staple cottons to real gold zari jacquards and Florentine leatherwork, every garment is measured against the highest standards of sartorial excellence.
              </p>
            </div>

            {/* Key Pillars */}
            <div className="mt-8 grid grid-cols-2 gap-4 pt-6 border-t border-[#D4AF37]/20">
              <div className="flex items-start gap-3">
                <Feather className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-cinzel text-xs font-bold text-[#ECE7DA] tracking-wider uppercase">
                    UNCOMPROMISING SILK & COTTON
                  </h4>
                  <p className="text-[11px] text-[#ECE7DA]/60 mt-1 font-light">
                    Sourced from historic Surat weaving houses.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-cinzel text-xs font-bold text-[#ECE7DA] tracking-wider uppercase">
                    INDIVIDUAL BESPOKE
                  </h4>
                  <p className="text-[11px] text-[#ECE7DA]/60 mt-1 font-light">
                    Tailored to individual anatomical specifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
