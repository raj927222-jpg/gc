import React from 'react';
import { motion } from 'motion/react';
import { Compass, Sparkles, Gem, Shield, Crown, Scissors } from 'lucide-react';

export const BrandPhilosophy: React.FC = () => {
  const philosophies = [
    {
      number: '01',
      title: 'CRAFT',
      quote: '“Every detail is designed with precision.”',
      description:
        'From single-needle tailored stitching with 22 stitches per inch to hand-canvassed lapels, our obsession with micro-detail guarantees enduring elegance.',
      icon: Scissors,
    },
    {
      number: '02',
      title: 'IDENTITY',
      quote: '“Designed for those who define their own style.”',
      description:
        'We design for the modern connoisseur who requires no logos to assert power. Bold lines, architectural silhouettes, and supreme textural depth speak for themselves.',
      icon: Crown,
    },
    {
      number: '03',
      title: 'LEGACY',
      quote: '“Modern design with timeless character.”',
      description:
        'Bridging Surat’s legendary centuries-old textile traditions with sharp international tailoring created to transcend transient fashion seasons.',
      icon: Gem,
    },
  ];

  return (
    <section id="philosophy" className="relative py-24 sm:py-32 bg-[#0A0A0C] overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#D4AF37]/5 blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-8 h-px bg-[#D4AF37]/50" />
            <span className="text-xs font-semibold tracking-[0.35em] text-[#D4AF37] uppercase">
              ETHOS & VALUES
            </span>
            <span className="w-8 h-px bg-[#D4AF37]/50" />
          </div>

          <h2 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide text-[#ECE7DA]">
            BRAND PHILOSOPHY
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-[#ECE7DA]/65 font-light tracking-wide">
            The founding principles guiding every cut, stitch, and creation within the Gyutaro Collection.
          </p>
        </div>

        {/* 3 Signature Feature Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {philosophies.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="group relative p-8 sm:p-10 rounded-2xl bg-[#14131A] border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(212,175,55,0.15)] flex flex-col justify-between"
              >
                {/* Top Number & Icon */}
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-cinzel text-2xl font-bold text-[#D4AF37]/40 group-hover:text-[#D4AF37] transition-colors">
                      {item.number}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-[#0A0A0C] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-[#0A0A0C] transition-all duration-300">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-cinzel text-2xl font-bold tracking-[0.2em] text-[#ECE7DA] group-hover:text-[#D4AF37] transition-colors uppercase">
                    {item.title}
                  </h3>

                  {/* Quote */}
                  <p className="mt-3 text-sm font-editorial italic text-[#F4E5C3] font-light">
                    {item.quote}
                  </p>

                  {/* Description */}
                  <p className="mt-4 text-xs text-[#ECE7DA]/70 font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Gold Accent Bar */}
                <div className="mt-8 pt-6 border-t border-[#D4AF37]/15">
                  <div className="w-8 h-1 bg-[#D4AF37]/30 group-hover:w-full group-hover:bg-[#D4AF37] transition-all duration-500 rounded-full" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
