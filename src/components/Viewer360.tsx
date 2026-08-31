import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCw, Play, Pause, ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

interface Viewer360Props {
  images: string[];
  productName: string;
}

export const Viewer360: React.FC<Viewer360Props> = ({ images, productName }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const totalFrames = images.length > 0 ? images.length : 8;

  // Auto spin loop
  useEffect(() => {
    let interval: any;
    if (isAutoSpinning) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % totalFrames);
      }, 180);
    }
    return () => clearInterval(interval);
  }, [isAutoSpinning, totalFrames]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setIsAutoSpinning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    // sensitivity: change frame every 22 pixels
    if (Math.abs(deltaX) > 22) {
      const step = deltaX > 0 ? -1 : 1;
      setCurrentFrame((prev) => (prev + step + totalFrames) % totalFrames);
      setStartX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setIsAutoSpinning(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startX;
    if (Math.abs(deltaX) > 20) {
      const step = deltaX > 0 ? -1 : 1;
      setCurrentFrame((prev) => (prev + step + totalFrames) % totalFrames);
      setStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const currentImage = images[currentFrame] || images[0];
  const angleDegrees = Math.round((currentFrame / totalFrames) * 360);

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchEnd={handleTouchEnd}
      data-cursor="drag"
      data-cursor-label="ROTATE"
      className="relative w-full h-[420px] sm:h-[500px] bg-[#0E0D14] rounded-2xl overflow-hidden border border-[#D4AF37]/30 flex items-center justify-center select-none shadow-[0_15px_40px_rgba(0,0,0,0.8)]"
    >
      {/* Background Ambience / Grid */}
      <div className="absolute inset-0 bg-radial-gradient from-[#1E1C28]/40 via-transparent to-[#0A0A0C] pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />

      {/* Interactive Rotating Image Display */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing p-6"
      >
        <motion.img
          key={currentFrame}
          src={currentImage}
          alt={`${productName} 360 view frame ${currentFrame + 1}`}
          referrerPolicy="no-referrer"
          animate={{ scale: zoomLevel }}
          transition={{ duration: 0.2 }}
          className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]"
        />

        {/* 360 Turntable Base Floor Accent */}
        <div className="absolute bottom-6 w-3/4 max-w-md h-6 rounded-[100%] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent blur-sm pointer-events-none" />
      </div>

      {/* Top Overlay Badge & Frame Status */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A0A0C]/80 backdrop-blur-md border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold tracking-wider font-cinzel">
          <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
          <span>360° PRECISION VIEWER</span>
        </div>

        <div className="px-3 py-1.5 rounded-full bg-[#0A0A0C]/80 backdrop-blur-md border border-[#D4AF37]/30 text-[#ECE7DA] text-[11px] tracking-wider font-mono">
          ANGLE: <span className="text-[#D4AF37] font-bold">{angleDegrees}°</span> ({currentFrame + 1}/{totalFrames})
        </div>
      </div>

      {/* Bottom Floating Controls Bar */}
      <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between">
        {/* Interaction Hint */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] tracking-widest uppercase text-[#ECE7DA]/60 bg-[#0A0A0C]/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#D4AF37]/20">
          <span>← DRAG HORIZONTALLY TO ROTATE →</span>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-1.5 bg-[#0A0A0C]/90 backdrop-blur-xl p-1 rounded-full border border-[#D4AF37]/40 shadow-xl ml-auto">
          <button
            id="btn-360-autospin"
            onClick={() => setIsAutoSpinning(!isAutoSpinning)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isAutoSpinning
                ? 'bg-[#D4AF37] text-[#0A0A0C]'
                : 'text-[#ECE7DA] hover:text-[#D4AF37] hover:bg-[#1A1924]'
            }`}
            title={isAutoSpinning ? 'Pause Auto Spin' : 'Start Auto Spin'}
          >
            {isAutoSpinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-360-zoom-in"
            onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 2))}
            disabled={zoomLevel >= 2}
            className="p-2 text-[#ECE7DA] hover:text-[#D4AF37] hover:bg-[#1A1924] rounded-full transition-colors disabled:opacity-30 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-360-zoom-out"
            onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.8))}
            disabled={zoomLevel <= 0.8}
            className="p-2 text-[#ECE7DA] hover:text-[#D4AF37] hover:bg-[#1A1924] rounded-full transition-colors disabled:opacity-30 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-360-reset"
            onClick={() => {
              setZoomLevel(1);
              setCurrentFrame(0);
              setIsAutoSpinning(false);
            }}
            className="p-2 text-[#ECE7DA] hover:text-[#D4AF37] hover:bg-[#1A1924] rounded-full transition-colors cursor-pointer"
            title="Reset View"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
