import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageCircle,
  X,
  Phone,
  Send,
  Calendar,
  Sparkles,
  Scissors,
  CheckCircle2
} from 'lucide-react';

export const ConciergeWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'BOOKING'>('CHAT');

  // Chat message state
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'concierge',
      text: 'Namaste and welcome to Gyutaro Collection. I am Devanshu, your personal style concierge from our Surat atelier. How may I assist your sartorial journey today?',
      time: 'Just now',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // Booking state
  const [bookingName, setBookingName] = useState('Arjun Patel');
  const [bookingPhone, setBookingPhone] = useState('+91 9725917116');
  const [bookingDate, setBookingDate] = useState('2026-09-15');
  const [bookingType, setBookingType] = useState('Bespoke Wedding Tuxedo & Zari Fitting');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: userText, time: 'Just now' },
    ]);
    setInputMsg('');

    // Simulated Concierge response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'concierge',
          text: `Thank you for your inquiry regarding "${userText}". Our Surat master cutter has received your note and will reserve your tailored silhouette. Would you like to schedule a private video consultation?`,
          time: 'Just now',
        },
      ]);
    }, 1000);
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingConfirmed(true);
  };

  return (
    <>
      {/* Floating Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          id="btn-open-concierge"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-[#14131A] to-[#1E1D28] border-2 border-[#D4AF37] text-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.3)] hover:bg-[#D4AF37] hover:text-[#0A0A0C] transition-all duration-300 cursor-pointer group"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          </div>
          <span className="font-cinzel text-xs font-bold tracking-[0.18em] uppercase hidden sm:inline">
            ATELIER CONCIERGE
          </span>
        </motion.button>
      </div>

      {/* Concierge Modal / Slide Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[400px] h-[520px] bg-[#14131A] rounded-2xl border border-[#D4AF37]/40 shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-[#0E0D14] border-b border-[#D4AF37]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#0A0A0C] flex items-center justify-center font-bold text-xs">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-cinzel text-xs font-bold tracking-wider text-[#ECE7DA]">
                    SURAT ATELIER CONCIERGE
                  </h4>
                  <span className="text-[10px] text-[#10B981] flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    Master Tailor Available
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#ECE7DA]/60 hover:text-[#D4AF37] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 bg-[#0A0A0C] border-b border-[#D4AF37]/15 text-[11px] font-cinzel font-semibold">
              <button
                onClick={() => setActiveTab('CHAT')}
                className={`py-2.5 transition-colors ${
                  activeTab === 'CHAT'
                    ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-[#D4AF37]/5'
                    : 'text-[#ECE7DA]/50'
                }`}
              >
                LIVE STYLE CHAT
              </button>
              <button
                onClick={() => setActiveTab('BOOKING')}
                className={`py-2.5 transition-colors ${
                  activeTab === 'BOOKING'
                    ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-[#D4AF37]/5'
                    : 'text-[#ECE7DA]/50'
                }`}
              >
                BESPOKE FITTING
              </button>
            </div>

            {/* Content: CHAT */}
            {activeTab === 'CHAT' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                          msg.sender === 'user'
                            ? 'bg-[#D4AF37] text-[#0A0A0C] font-medium rounded-br-none'
                            : 'bg-[#0E0D14] border border-[#D4AF37]/20 text-[#ECE7DA] rounded-bl-none font-light leading-relaxed'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-[#ECE7DA]/40 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-[#0E0D14] border-t border-[#D4AF37]/20 flex gap-2"
                >
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    placeholder="Ask about fabrics, fit, or styling..."
                    className="flex-1 bg-[#14131A] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-[#ECE7DA] focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-[#D4AF37] text-[#0A0A0C] hover:bg-[#F4E5C3] transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Content: BESPOKE BOOKING */}
            {activeTab === 'BOOKING' && (
              <div className="flex-1 overflow-y-auto p-5">
                {bookingConfirmed ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-[#10B981] mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h5 className="font-cinzel text-sm font-bold text-[#ECE7DA]">
                      APPOINTMENT REQUEST RECEIVED
                    </h5>
                    <p className="text-xs text-[#ECE7DA]/70">
                      Our Surat master tailor will contact you via WhatsApp at {bookingPhone} to confirm your appointment time and fabric preferences.
                    </p>
                    <button
                      onClick={() => setBookingConfirmed(false)}
                      className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#0A0A0C] text-xs font-bold uppercase"
                    >
                      BOOK ANOTHER
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBookAppointment} className="space-y-3">
                    <p className="text-xs text-[#ECE7DA]/70 font-light leading-relaxed">
                      Schedule a private bespoke measurement and silk jacquard drape session at our Surat atelier or via private video link.
                    </p>

                    <div>
                      <label className="block text-[11px] uppercase text-[#ECE7DA]/70 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-lg px-3 py-2 text-xs text-[#ECE7DA]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase text-[#ECE7DA]/70 mb-1">Mobile / WhatsApp</label>
                      <input
                        type="tel"
                        required
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-lg px-3 py-2 text-xs text-[#ECE7DA]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase text-[#ECE7DA]/70 mb-1">Preferred Date</label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-lg px-3 py-2 text-xs text-[#ECE7DA]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase text-[#ECE7DA]/70 mb-1">Consultation Service</label>
                      <select
                        value={bookingType}
                        onChange={(e) => setBookingType(e.target.value)}
                        className="w-full bg-[#0E0D14] border border-[#D4AF37]/30 rounded-lg px-3 py-2 text-xs text-[#ECE7DA]"
                      >
                        <option>Bespoke Wedding Tuxedo & Zari Fitting</option>
                        <option>Private Atelier Wardrobe Styling</option>
                        <option>Horological Tourbillon Allocation</option>
                        <option>Custom Hand-woven Silk Jacquard Selection</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-[#D4AF37] text-[#0A0A0C] font-bold text-xs tracking-widest uppercase hover:bg-[#F4E5C3] transition-colors mt-2 cursor-pointer"
                    >
                      REQUEST PRIVATE APPOINTMENT
                    </button>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
