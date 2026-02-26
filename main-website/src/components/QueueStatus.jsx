import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Gift, Circle, Star, Crown, Diamond, AlertTriangle,
  RefreshCcw, Clock, Scissors, Phone, Info, ChevronLeft
} from 'lucide-react';
import { format } from "date-fns";

// --- HELPER COMPONENTS ---

const AppointmentCard = ({ appointment, index, isCurrentUser }) => {
  const isConfirmed = appointment.status === "confirmed";
  const isStarted = appointment.status === "started";
  const isPending = appointment.status === "pending" || appointment.status?.includes("Pending");
  const isOfflineBooking = appointment.isOfflineBooking;
  const isExpress = (appointment.appointmentType && appointment.appointmentType.toLowerCase().includes("express")) || appointment.isPromoted;

  const getStatusTheme = () => {
    if (isStarted) return { bg: "#E0F2F1", text: "#00695C", border: "#00BFA5" };
    if (isPending) return { bg: "#E3F2FD", text: "#1565C0", border: "#2979FF" };
    if (isConfirmed) return { bg: "#F3E5F5", text: "#6A1B9A", border: "#6A1B9A" };
    if (appointment.status === "completed") return { bg: "#E8F5E9", text: "#2E7D32", border: "#4CAF50" };
    if (appointment.status === "cancelled") return { bg: "#FFEBEE", text: "#C62828", border: "#EF5350" };
    return { bg: "#F5F5F5", text: "#616161", border: "#BDBDBD" };
  };

  const styleTheme = useMemo(() => getStatusTheme(), [appointment.status]);

  const customerNameDisplay = isOfflineBooking
    ? appointment.customerName || "Offline Customer"
    : appointment.userId?.name || `Customer ${index + 1}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 relative px-1"
    >
      <div className={`bg-white rounded-[22px] overflow-hidden shadow-sm shadow-black/5 relative border border-gray-100/50 ${isCurrentUser ? 'ring-2 ring-[#6A1B9A]/20' : ''}`}>
        {/* Accent Strip */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: styleTheme.border }} />

        <div className="p-4 pl-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`text-[15px] font-[900] tracking-tight uppercase ${isCurrentUser ? 'text-[#6A1B9A]' : 'text-[#1C1C1E]'} truncate`}>
                  {customerNameDisplay}
                </h3>
                {isExpress && (
                  <span className="bg-[#FFD700] px-2 py-0.5 rounded-lg text-[8px] font-[900] text-black tracking-tighter shadow-sm uppercase">EXPRESS</span>
                )}
                {isCurrentUser && (
                  <span className="bg-[#6A1B9A] px-2 py-0.5 rounded-lg text-[8px] font-[900] text-white tracking-widest shadow-sm uppercase">YOU</span>
                )}
              </div>
              {isOfflineBooking && (
                <div className="flex items-center mt-1 text-gray-400">
                  <Phone size={10} className="mr-1.5" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Walk-in</span>
                </div>
              )}
            </div>

            <div className="px-3 py-1.5 rounded-xl text-[9px] font-[900] tracking-[0.1em] uppercase shadow-sm border border-transparent" style={{ backgroundColor: styleTheme.bg, color: styleTheme.text }}>
              {appointment.status === 'confirmed' ? 'Waiting' : appointment.status}
            </div>
          </div>

          {/* Info Grid */}
          <div className="flex items-center mb-4 bg-gray-50/80 p-3 rounded-2xl border border-gray-100/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <Clock size={14} className="text-[#6A1B9A]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-0.5">Time</span>
                <span className="text-[13px] font-[900] text-[#1C1C1E] tabular-nums">
                  {appointment.time || "--:--"}
                  {(appointment.tempDelayMinutes || 0) > 0 && (
                    <span className="text-red-500 ml-1 font-black">(+{appointment.tempDelayMinutes}m)</span>
                  )}
                </span>
              </div>
            </div>

            <div className="w-px h-6 bg-gray-200 mx-5" />

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <Scissors size={14} className="text-[#6A1B9A]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-0.5">Service</span>
                <span className="text-[13px] font-[900] text-[#1C1C1E] truncate uppercase tracking-tight">
                  {appointment.appointmentType || "Standard Cut"}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3.5 border-t border-dashed border-gray-100 flex justify-between items-center">
            <div className="relative shrink-0 flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${isCurrentUser ? 'bg-[#1C1C1E] text-white shadow-xl shadow-gray-300/30 ring-2 ring-[#6A1B9A]/10' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                <span className="text-[8px] font-black uppercase tracking-tighter opacity-50 leading-none mb-0.5">Pos</span>
                <span className="text-lg font-black leading-none">{index + 1}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Queue Ticket</span>
                <span className="text-[10px] font-black text-[#1C1C1E] font-mono tracking-tighter">#{appointment._id.slice(-6).toUpperCase()}</span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black text-gray-400 tracking-[0.15em] uppercase leading-none mb-1">Total</p>
              <p className="text-xl font-[900] text-[#6A1B9A] tracking-tighter leading-none">₹{appointment.totalPrice || "0"}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---

const QueueStatus = ({ barberId }) => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const effectiveDate = format(new Date(), "yyyy-MM-dd");

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBarberAppointments = useCallback(async () => {
    if (!barberId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/booking/website/barber-queue/${barberId}`,
        { params: { date: effectiveDate } }
      );
      setAppointments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("QueueStatus error:", error);
    } finally {
      setLoading(false);
    }
  }, [barberId, effectiveDate]);

  useEffect(() => {
    if (!isLoading && barberId) {
      fetchBarberAppointments();
    }
  }, [barberId, isLoading, effectiveDate, fetchBarberAppointments]);

  // Sorting Logic (Mirroring Barber UI)
  const sortedAppointments = useMemo(() => {
    const activeRaw = appointments.filter(
      (app) => ["confirmed", "started"].includes(app.status)
    );

    activeRaw.sort((a, b) => {
      if (a.status === 'started' && b.status !== 'started') return -1;
      if (b.status === 'started' && a.status !== 'started') return 1;

      const isExpress = (app) => (app.appointmentType?.toLowerCase().includes("express") || app.isPromoted);
      const aIsExpress = isExpress(a) && (a.tempDelayMinutes || 0) < 500;
      const bIsExpress = isExpress(b) && (b.tempDelayMinutes || 0) < 500;

      if (aIsExpress && !bIsExpress) return -1;
      if (bIsExpress && !aIsExpress) return 1;

      const getScore = (app) => {
        if (!app.time) return 9999;
        const [h, m] = app.time.split(':').map(Number);
        let val = (h * 60 + m) + (app.tempDelayMinutes || 0);
        if (!isExpress(app)) val += 2000;
        return val;
      };

      return getScore(a) - getScore(b);
    });

    return activeRaw;
  }, [appointments]);

  if (loading) {
    return (
      <div className="min-h-0 bg-[#F4F5F7] flex flex-col items-center justify-center p-12">
        <RefreshCcw className="w-8 h-8 text-[#6A1B9A] animate-spin mb-4" />
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6A1B9A]/60 font-mono animate-pulse">Syncing Live Queue...</p>
      </div>
    );
  }

  if (!barberId) {
    return (
      <div className="min-h-0 bg-[#F4F5F7] p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-50 rounded-[28px] flex items-center justify-center mb-6 border border-red-100 shadow-sm">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-[900] text-[#1C1C1E] mb-2 uppercase tracking-tight">Missing Info</h2>
        <p className="text-sm text-gray-400 font-medium mb-8 max-w-[200px] leading-relaxed">Could not load queue details for this barber.</p>
        <button
          onClick={() => navigate('/all-services-search')}
          className="h-[52px] px-8 rounded-2xl bg-[#1C1C1E] text-white font-[900] text-[13px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-gray-400/30"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#1C1C1E] pb-safe-area relative overflow-hidden font-sans">
      {/* Background Accent */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#6A1B9A]/5 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-[450px] mx-auto min-h-screen">
        {/* Header - Mirroring Barber Manager */}
        <div className="bg-white rounded-b-[40px] px-6 pt-6 pb-8 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border-b border-gray-100/50">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 rounded-[20px] bg-white border border-gray-100 shadow-sm flex items-center justify-center mr-4 active:scale-90 transition-all"
              >
                <ChevronLeft size={22} className="text-[#1C1C1E]" strokeWidth={3} />
              </button>
              <div>
                <p className="text-[10px] font-black text-[#6A1B9A]/50 uppercase tracking-[0.2em] mb-1">Today's List</p>
                <h1 className="text-2xl font-[950] text-[#1C1C1E] tracking-tighter leading-none">Live Queue</h1>
              </div>
            </div>
            <button
              onClick={fetchBarberAppointments}
              className="w-12 h-12 rounded-full border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-700 active:bg-gray-50 active:rotate-180 transition-all duration-500"
            >
              <RefreshCcw size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex items-center justify-between bg-gray-50/80 p-4 rounded-[24px] border border-gray-100 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <Clock size={16} className="text-[#6A1B9A]" />
              </div>
              <div>
                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Live Updates</span>
                <span className="block text-[13px] font-[900] text-[#1C1C1E] uppercase tracking-tight">Syncing Every 60s</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[20px] font-[1000] text-[#1C1C1E] leading-none mb-1">{sortedAppointments.length}</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.1em]">Active Clients</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-8">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-[14px] font-[900] text-[#1C1C1E] uppercase tracking-widest opacity-90">Current Queue</h2>
            <div className="h-0.5 bg-gray-200/50 flex-1 rounded-full" />
          </div>

          {sortedAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-60 bg-white/50 backdrop-blur-sm rounded-[40px] border border-white">
              <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center mb-6">
                <Gift size={32} className="text-gray-200" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-black text-[#1C1C1E] mb-2 tracking-tight uppercase">Queue is Empty</h3>
              <p className="text-center text-gray-400 text-[11px] font-bold max-w-[180px] leading-relaxed uppercase tracking-wide">Be the first to secure a slot for today.</p>
            </div>
          ) : (
            <AnimatePresence mode='popLayout'>
              {sortedAppointments.map((item, idx) => (
                <AppointmentCard
                  key={item._id}
                  appointment={item}
                  index={idx}
                  isCurrentUser={(item.userId?._id === user?._id && !item.isDemo) || item.isPreview}
                />
              ))}
            </AnimatePresence>
          )}

          {/* Tips Section */}
          <div className="mt-12 p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Info size={40} className="text-[#6A1B9A]" />
            </div>
            <h4 className="text-[12px] font-black uppercase text-[#1C1C1E] tracking-widest mb-3 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-[#6A1B9A] rounded-full" />
              Queue Guide
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-[#F3E5F5] flex items-center justify-center mt-0.5 shrink-0 font-black text-[8px] text-[#6A1B9A]">1</div>
                <p className="text-[11px] text-gray-500 font-bold leading-relaxed">Appointments are prioritized by <span className="text-[#1C1C1E]">Express</span> type first, then arrival time.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-[#F3E5F5] flex items-center justify-center mt-0.5 shrink-0 font-black text-[8px] text-[#6A1B9A]">2</div>
                <p className="text-[11px] text-gray-500 font-bold leading-relaxed">Wait for your position to be <span className="text-[#6A1B9A]">#1</span> and turn <span className="text-emerald-500 font-black italic underline decoration-2">Started</span> before approaching the chair.</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Support Section */}
        <div className="px-5 pb-12 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">Powered by GlossCut Live</p>
          <div className="flex justify-center gap-6 opacity-30">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <div className="w-2 h-2 rounded-full bg-gray-400" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .pb-safe-area {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

export default QueueStatus;
