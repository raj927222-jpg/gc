import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ruler, CheckCircle2 } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  category,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0A0A0C]/90 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-full max-w-2xl bg-[#14131A] rounded-2xl border border-[#D4AF37]/40 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Ruler className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg sm:text-xl font-bold tracking-wider text-[#ECE7DA]">
                  ATELIER SIZING & TAILORING GUIDE
                </h3>
                <p className="text-xs text-[#D4AF37] tracking-widest uppercase">
                  SURAT BESPOKE STANDARDS ({category})
                </p>
              </div>
            </div>
            <button
              id="btn-close-size-guide"
              onClick={onClose}
              className="p-2 rounded-full text-[#ECE7DA]/60 hover:text-[#D4AF37] hover:bg-[#1E1D28] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Measurements Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D4AF37]/20 bg-[#1B1A24]/60 font-cinzel text-[#D4AF37] tracking-wider">
                  <th className="py-3 px-4">SIZE</th>
                  <th className="py-3 px-4">CHEST (INCH)</th>
                  <th className="py-3 px-4">WAIST (INCH)</th>
                  <th className="py-3 px-4">SHOULDER (INCH)</th>
                  <th className="py-3 px-4">LENGTH (INCH)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/10 text-[#ECE7DA]/80">
                <tr className="hover:bg-[#D4AF37]/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#D4AF37]">38 (S)</td>
                  <td className="py-3 px-4">38 - 39</td>
                  <td className="py-3 px-4">31 - 32</td>
                  <td className="py-3 px-4">17.5</td>
                  <td className="py-3 px-4">29.0</td>
                </tr>
                <tr className="hover:bg-[#D4AF37]/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#D4AF37]">40 (M)</td>
                  <td className="py-3 px-4">40 - 41</td>
                  <td className="py-3 px-4">33 - 34</td>
                  <td className="py-3 px-4">18.2</td>
                  <td className="py-3 px-4">29.5</td>
                </tr>
                <tr className="hover:bg-[#D4AF37]/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#D4AF37]">42 (L)</td>
                  <td className="py-3 px-4">42 - 43</td>
                  <td className="py-3 px-4">35 - 36</td>
                  <td className="py-3 px-4">19.0</td>
                  <td className="py-3 px-4">30.0</td>
                </tr>
                <tr className="hover:bg-[#D4AF37]/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#D4AF37]">44 (XL)</td>
                  <td className="py-3 px-4">44 - 46</td>
                  <td className="py-3 px-4">37 - 38</td>
                  <td className="py-3 px-4">19.8</td>
                  <td className="py-3 px-4">30.5</td>
                </tr>
                <tr className="hover:bg-[#D4AF37]/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#D4AF37]">46 (XXL)</td>
                  <td className="py-3 px-4">47 - 49</td>
                  <td className="py-3 px-4">39 - 41</td>
                  <td className="py-3 px-4">20.5</td>
                  <td className="py-3 px-4">31.0</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bespoke Tailoring Note */}
          <div className="mt-6 p-4 rounded-xl bg-[#0A0A0C]/80 border border-[#D4AF37]/20 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div className="text-xs text-[#ECE7DA]/75 leading-relaxed">
              <strong className="text-[#D4AF37] block font-cinzel text-xs tracking-wider mb-1">
                COMPLIMENTARY BESPOKE ALTERATIONS
              </strong>
              Every Gyutaro Collection garment includes one complimentary bespoke adjustment within 30 days of delivery through our concierge tailors in Surat.
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
