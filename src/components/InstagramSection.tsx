import React from 'react';
import { motion } from 'motion/react';
import { Instagram, Heart, MessageCircle, ExternalLink } from 'lucide-react';
import { INSTAGRAM_POSTS } from '../data/products';

export const InstagramSection: React.FC = () => {
  return (
    <section id="instagram" className="relative py-24 sm:py-32 bg-[#0A0A0C] border-t border-[#D4AF37]/15 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#14131A] text-[#D4AF37] text-[11px] font-semibold tracking-[0.25em] uppercase mb-3">
            <Instagram className="w-3.5 h-3.5" />
            <span>@gyutaro_collection</span>
          </div>

          <h2 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide text-[#ECE7DA]">
            FOLLOW THE COLLECTION
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-[#ECE7DA]/65 font-light tracking-wide">
            Daily glimpses inside our Surat tailoring atelier, runway showcases, and bespoke style curations.
          </p>
        </div>

        {/* 6-Tile Instagram Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {INSTAGRAM_POSTS.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              data-cursor="image"
              data-cursor-label="INSTAGRAM"
              className="group relative aspect-square rounded-xl overflow-hidden bg-[#14131A] border border-[#D4AF37]/20 hover:border-[#D4AF37]/70 transition-all duration-500 cursor-pointer"
            >
              <img
                src={post.image}
                alt="Gyutaro Collection Instagram"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />

              {/* Hover Dark Overlay */}
              <div className="absolute inset-0 bg-[#0A0A0C]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center gap-2 backdrop-blur-sm">
                <Instagram className="w-6 h-6 text-[#D4AF37] mb-1" />
                <span className="text-[10px] font-cinzel font-bold tracking-widest text-[#ECE7DA] uppercase">
                  {post.tag}
                </span>

                <div className="flex items-center gap-3 text-xs text-[#F4E5C3] mt-1">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[11px] font-mono">{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[11px] font-mono">{post.comments}</span>
                  </div>
                </div>

                <span className="text-[9px] text-[#D4AF37] tracking-widest uppercase font-semibold mt-2 border-b border-[#D4AF37]/50 pb-0.5">
                  VIEW POST
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Follow CTA Button */}
        <div className="mt-12 text-center">
          <a
            id="btn-follow-instagram"
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#14131A] border border-[#D4AF37]/50 text-[#ECE7DA] hover:text-[#0A0A0C] hover:bg-[#D4AF37] font-semibold text-xs tracking-[0.25em] uppercase transition-all duration-300 shadow-lg hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] cursor-pointer"
          >
            <Instagram className="w-4 h-4" />
            <span>FOLLOW ON INSTAGRAM</span>
          </a>
        </div>
      </div>
    </section>
  );
};
