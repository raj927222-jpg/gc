import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Floating gold particles effect on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      maxOpacity: number;
    }> = [];

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.6,
        speedY: -(Math.random() * 0.4 + 0.15),
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: 0,
        maxOpacity: Math.random() * 0.7 + 0.2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.opacity < p.maxOpacity) {
          p.opacity += 0.01;
        }

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
          p.opacity = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#D4AF37';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Sequence progression
  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 600);   // "GYUTARO" emerges
    const timer2 = setTimeout(() => setStage(2), 1600);  // "COLLECTION" emerges
    const timer3 = setTimeout(() => setStage(3), 2600);  // "SURAT, GUJARAT" & subtitle reveal
    const timer4 = setTimeout(() => {
      onComplete();
    }, 4600); // smooth finish

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <motion.div
      id="cinematic-intro-container"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] bg-[#0A0A0C] flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Atmospheric Ambient Glow behind logo */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#D4AF37]/10 via-[#8B6F1F]/5 to-transparent blur-[120px] pointer-events-none animate-pulse" />

      {/* Skip Intro Button */}
      <button
        id="btn-skip-intro"
        onClick={onComplete}
        className="absolute top-8 right-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-[0.2em] text-[#ECE7DA]/60 hover:text-[#D4AF37] border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 bg-[#14131A]/40 backdrop-blur-md transition-all duration-300 group cursor-pointer"
      >
        <span>SKIP INTRO</span>
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#D4AF37]" />
      </button>

      {/* Center Cinematic Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl flex flex-col items-center">
        {/* Monogram Crest */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: stage >= 1 ? 1 : 0, scale: stage >= 1 ? 1 : 0.8, y: stage >= 1 ? 0 : -20 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="mb-6 flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full border border-[#D4AF37]/40 flex items-center justify-center bg-[#14131A]/60 backdrop-blur-sm relative">
            <span className="font-cinzel text-xs font-semibold text-[#D4AF37] tracking-widest">GC</span>
            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/20 animate-ping opacity-30" />
          </div>
          <div className="w-px h-6 bg-gradient-to-b from-[#D4AF37]/40 to-transparent mt-2" />
        </motion.div>

        {/* Primary Title: GYUTARO */}
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: 80, opacity: 0, letterSpacing: '0.15em' }}
            animate={{
              y: stage >= 1 ? 0 : 80,
              opacity: stage >= 1 ? 1 : 0,
              letterSpacing: stage >= 1 ? '0.32em' : '0.15em',
            }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-cinzel text-5xl sm:text-7xl md:text-8xl font-bold tracking-[0.32em] text-transparent bg-clip-text bg-gradient-to-r from-[#ECE7DA] via-[#F4E5C3] to-[#D4AF37] drop-shadow-[0_4px_30px_rgba(212,175,55,0.25)] pl-[0.32em]"
          >
            GYUTARO
          </motion.h1>
        </div>

        {/* Secondary Title: COLLECTION */}
        <div className="overflow-hidden mt-2">
          <motion.h2
            initial={{ y: 50, opacity: 0, letterSpacing: '0.2em' }}
            animate={{
              y: stage >= 2 ? 0 : 50,
              opacity: stage >= 2 ? 1 : 0,
              letterSpacing: stage >= 2 ? '0.45em' : '0.2em',
            }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            className="font-cinzel text-xl sm:text-2xl md:text-3xl font-light tracking-[0.45em] text-[#D4AF37] pl-[0.45em] relative inline-block"
          >
            COLLECTION
            {/* Shimmer Light Sweep line */}
            <motion.span
              initial={{ left: '-100%' }}
              animate={{ left: stage >= 2 ? '100%' : '-100%' }}
              transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.2 }}
              className="absolute bottom-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#FFF1C5] to-transparent pointer-events-none"
            />
          </motion.h2>
        </div>

        {/* Subtitle & Surat Origin */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 20 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
            <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-[#ECE7DA]/70 font-light font-sans">
              The Art of Modern Menswear
            </p>
            <span className="w-8 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
          </div>
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#D4AF37]/80 font-medium">
            Surat • Gujarat
          </p>
        </motion.div>
      </div>

      {/* Progress Bar Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-[#14131A] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 4.4, ease: 'linear' }}
          className="h-full bg-gradient-to-r from-[#8B6F1F] via-[#D4AF37] to-[#F4E5C3]"
        />
      </div>
    </motion.div>
  );
};
