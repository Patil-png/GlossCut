import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Gift, AlertTriangle,
  RefreshCcw, Info, ChevronLeft, Clock
} from 'lucide-react';
import { format } from "date-fns";

// --- HELPER COMPONENTS ---

const AppointmentCard = ({ appointment, index }) => {
  const isConfirmed = appointment.status === "confirmed";
  const isStarted = appointment.status === "started";
  const isPending = appointment.status === "pending" || appointment.status?.includes("Pending");
  const isOfflineBooking = appointment.isOfflineBooking;
  const isExpress = (appointment.appointmentType && appointment.appointmentType.toLowerCase().includes("express")) || appointment.isPromoted;

  const styleTheme = useMemo(() => {
    if (isStarted) return {
      bg: "rgba(0, 191, 165, 0.1)",
      text: "#00695C",
      border: "#00BFA5",
      glow: "rgba(0, 191, 165, 0.2)"
    };
    if (isPending) return {
      bg: "rgba(41, 121, 255, 0.1)",
      text: "#1565C0",
      border: "#2979FF",
      glow: "rgba(41, 121, 255, 0.2)"
    };
    if (isConfirmed) return {
      bg: "rgba(106, 27, 154, 0.1)",
      text: "#6A1B9A",
      border: "#6A1B9A",
      glow: "rgba(106, 27, 154, 0.2)"
    };
    if (appointment.status === "completed") return {
      bg: "rgba(76, 175, 80, 0.1)",
      text: "#2E7D32",
      border: "#4CAF50",
      glow: "rgba(76, 175, 80, 0.15)"
    };
    if (appointment.status === "cancelled") return {
      bg: "rgba(239, 83, 80, 0.1)",
      text: "#C62828",
      border: "#EF5350",
      glow: "rgba(239, 83, 80, 0.15)"
    };
    return {
      bg: "rgba(0, 0, 0, 0.05)",
      text: "#616161",
      border: "#BDBDBD",
      glow: "transparent"
    };
  }, [isStarted, isPending, isConfirmed, appointment.status]);

  const customerNameDisplay = isOfflineBooking
    ? appointment.customerName || "Offline Customer"
    : appointment.userId?.name || `Customer ${index + 1}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 450,
        damping: 35,
        delay: index * 0.05
      }}
      whileHover={{ scale: 1.02 }}
      className="mb-3 relative px-1 group"
    >
      <div className={`
        bg-white/95 backdrop-blur-xl rounded-[20px] overflow-hidden
        shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative border border-white/60
        transition-all duration-300 group-hover:shadow-[0_12px_30px_rgb(0,0,0,0.06)]
      `}>
        {/* Accent Strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[4px]"
          style={{ backgroundColor: styleTheme.border }}
        />

        <div className="flex items-center gap-4 py-3.5 px-5 pl-7">
          {/* Position Badge - Now a sleek circle */}
          <div className="w-11 h-11 rounded-full flex flex-col items-center justify-center shrink-0 bg-gray-50 text-[#1C1C1E] border-2 border-gray-100">
            <span className="text-[18px] font-[1000] leading-none tracking-tighter">#{index + 1}</span>
          </div>

          {/* Main Info - Horizontal Layout */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[15px] font-[1000] tracking-tight uppercase text-[#1C1C1E] truncate">
                {customerNameDisplay}
              </h3>
              {isExpress ? (
                <span className="bg-[#FFD700] px-2 py-0.5 rounded-md text-[8px] font-[1000] text-black tracking-tight uppercase border border-black/5">
                  EXPRESS
                </span>
              ) : (
                <span className="bg-gray-100 px-2 py-0.5 rounded-md text-[8px] font-[1000] text-gray-400 tracking-tight uppercase border border-gray-100">
                  BASIC
                </span>
              )}
            </div>

            {isOfflineBooking && (
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest opacity-80 mt-1">
                WALK-IN
              </span>
            )}
          </div>

          {/* Status Badge - Compact */}
          <div
            className="px-3 py-1.5 rounded-full text-[9px] font-[1000] tracking-[0.1em] uppercase shadow-sm border border-white/50 shrink-0"
            style={{ backgroundColor: styleTheme.bg, color: styleTheme.text }}
          >
            {appointment.status === 'confirmed' ? 'Waiting' : appointment.status === 'started' ? 'Active' : appointment.status}
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
    <div
      className="min-h-screen bg-[#F8F9FB] text-[#1C1C1E] relative overflow-x-hidden font-sans selection:bg-[#6A1B9A]/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
    >
      {/* Background Orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#6A1B9A]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-10%] w-[300px] h-[300px] bg-[#00BFA5]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-[480px] mx-auto min-h-screen flex flex-col">
        {/* Header - Mirroring Barber Manager with Premium Twist */}
        <div className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 px-6 pt-8 pb-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-white/50">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className="w-12 h-12 rounded-[20px] bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-center mr-5 active:scale-90 transition-all"
              >
                <ChevronLeft size={22} className="text-[#1C1C1E]" strokeWidth={3} />
              </motion.button>
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] font-black text-[#6A1B9A] uppercase tracking-[0.25em] mb-1 opacity-60"
                >
                  Live Status
                </motion.p>
                <h1 className="text-3xl font-[1000] text-[#1C1C1E] tracking-tighter leading-none">The Queue</h1>
              </div>
            </div>
            <motion.button
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.8 }}
              onClick={fetchBarberAppointments}
              className="w-12 h-12 rounded-2xl bg-[#1C1C1E] text-white shadow-lg shadow-gray-400/20 flex items-center justify-center active:scale-95 transition-all duration-500"
            >
              <RefreshCcw size={18} strokeWidth={3} />
            </motion.button>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-[28px] shadow-xl shadow-gray-900/10 border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/10">
                <Clock size={18} className="text-[#B388FF]" strokeWidth={2.5} />
              </div>
              <div>
                <span className="block text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1.5">Auto Sync</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  <span className="block text-[14px] font-[1000] text-white uppercase tracking-tight">60s Interval</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[28px] font-[1000] text-white leading-none mb-1 tracking-tighter">
                {sortedAppointments.length}
              </span>
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.15em]">Clients</span>
            </div>
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="px-6 py-10 flex-1">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-[14px] font-[1000] text-[#1C1C1E] uppercase tracking-[0.15em] opacity-40">Active Deck</h2>
            <div className="h-px bg-gradient-to-r from-gray-200 via-gray-100 to-transparent flex-1 rounded-full" />
          </div>

          {sortedAppointments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 bg-white/40 backdrop-blur-xl rounded-[48px] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.02)]"
            >
              <div className="w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full bg-[#6A1B9A]/5 animate-ping" />
                <Gift size={36} className="text-[#6A1B9A]/20" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-[1000] text-[#1C1C1E] mb-3 tracking-tight uppercase">Desk is Clear</h3>
              <p className="text-center text-gray-400 text-[12px] font-bold max-w-[200px] leading-relaxed uppercase tracking-wider opacity-80">
                No active bookings found. <br />Check again in a moment.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode='popLayout'>
              {sortedAppointments.map((item, idx) => (
                <AppointmentCard
                  key={item._id}
                  appointment={item}
                  index={idx}
                />
              ))}
            </AnimatePresence>
          )}

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-14 p-8 bg-white/60 backdrop-blur-xl rounded-[40px] border border-white shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-[-10px] right-[-10px] p-6 opacity-[0.03] transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12">
              <Info size={120} className="text-[#6A1B9A]" />
            </div>

            <h4 className="text-[13px] font-[1000] uppercase text-[#1C1C1E] tracking-[0.2em] mb-5 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#6A1B9A] rounded-full shadow-[0_0_10px_rgba(106,27,154,0.3)]" />
              Barber Rules
            </h4>

            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="w-5 h-5 rounded-full bg-[#6A1B9A] flex items-center justify-center mt-0.5 shrink-0 font-black text-[9px] text-white shadow-lg shadow-[#6A1B9A]/20">1</div>
                <p className="text-[12px] text-gray-500 font-bold leading-relaxed">
                  <span className="text-[#1C1C1E] font-[1000]">Express</span> priority: These slots jump ahead in the queue sequence for minimal wait time.
                </p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-5 h-5 rounded-full bg-[#6A1B9A] flex items-center justify-center mt-0.5 shrink-0 font-black text-[9px] text-white shadow-lg shadow-[#6A1B9A]/20">2</div>
                <p className="text-[12px] text-gray-500 font-bold leading-relaxed">
                  Only head to the seat once your status changes to <span className="text-[#00BFA5] font-[1000] underline decoration-2 underline-offset-4 decoration-[#00BFA5]/30">Active Now</span>.
                </p>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Support Section */}
        <div className="px-6 pb-14 text-center">
          <p className="text-[10px] font-black text-gray-400/40 uppercase tracking-[0.3em] mb-4">GLOSSCUT PARTNER NETWORK</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-1 h-1 rounded-full bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueStatus;
