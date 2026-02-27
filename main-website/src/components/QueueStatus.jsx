import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Gift, AlertTriangle,
  RefreshCcw, Info, Check, Clock
} from 'lucide-react';
import { format } from "date-fns";

// --- HELPER COMPONENTS ---

// Memoized to prevent unnecessary re-renders in a list of 500+ items
const AppointmentCard = memo(({ appointment, index }) => {
  const isConfirmed = appointment.status === "confirmed";
  const isStarted = appointment.status === "started";
  const isPending = appointment.status === "pending" || appointment.status?.includes("Pending");
  const isOfflineBooking = appointment.isOfflineBooking;
  const isExpress = (appointment.appointmentType && appointment.appointmentType.toLowerCase().includes("express")) || appointment.isPromoted;

  const styleTheme = useMemo(() => {
    if (isStarted) return {
      bg: "rgba(34, 197, 94, 0.1)",
      text: "#22C55E",
      border: "#22C55E",
      glow: "rgba(34, 197, 94, 0.2)"
    };
    if (isPending) return {
      bg: "rgba(59, 130, 246, 0.1)",
      text: "#60A5FA",
      border: "#3B82F6",
      glow: "rgba(59, 130, 246, 0.2)"
    };
    if (isConfirmed) return {
      bg: "rgba(168, 85, 247, 0.1)",
      text: "#A855F7",
      border: "#A855F7",
      glow: "rgba(168, 85, 247, 0.2)"
    };
    if (appointment.status === "completed") return {
      bg: "rgba(34, 197, 94, 0.05)",
      text: "#22C55E",
      border: "#22C55E",
      glow: "transparent"
    };
    if (appointment.status === "cancelled") return {
      bg: "rgba(239, 68, 68, 0.1)",
      text: "#F87171",
      border: "#EF4444",
      glow: "transparent"
    };
    return {
      bg: "rgba(255, 255, 255, 0.05)",
      text: "#9CA3AF",
      border: "#374151",
      glow: "transparent"
    };
  }, [isStarted, isPending, isConfirmed, appointment.status]);

  const customerNameDisplay = isOfflineBooking
    ? appointment.customerName || "Offline Customer"
    : appointment.userId?.name || `Customer ${index + 1}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 40,
        delay: index * 0.03
      }}
      className="mb-3 px-1"
    >
      <div className={`
        bg-white/[0.03] backdrop-blur-xl rounded-[24px] overflow-hidden
        relative border border-white/5
        transition-all duration-300
      `}>
        {/* Accent Strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ backgroundColor: styleTheme.border }}
        />

        <div className="flex items-center gap-4 py-4 px-6">
          {/* Position Badge */}
          <div className="w-10 h-10 rounded-2xl flex flex-col items-center justify-center shrink-0 bg-[#0A0A0B] text-white border border-white/5">
            <span className="text-[16px] font-black tracking-tighter">#{index + 1}</span>
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-[14px] font-black tracking-tight uppercase text-white truncate">
                {customerNameDisplay}
              </h3>
              {isExpress && (
                <span className="bg-[#22C55E]/10 px-2 py-0.5 rounded-lg text-[7px] font-black text-[#22C55E] tracking-[0.1em] uppercase border border-[#22C55E]/20">
                  EXPRESS
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOfflineBooking && (
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">
                  WALK-IN
                </span>
              )}
              {isStarted && (
                <span className="flex items-center gap-1.5 text-[8px] font-black text-green-500 uppercase tracking-widest animate-pulse">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  In Service
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div
            className="px-3 py-1.5 rounded-full text-[8px] font-black tracking-[0.1em] uppercase border opacity-80"
            style={{ backgroundColor: styleTheme.bg, color: styleTheme.text, borderColor: `${styleTheme.text}20` }}
          >
            {appointment.status === 'confirmed' ? 'Waiting' : appointment.status === 'started' ? 'Active' : appointment.status}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// --- MAIN COMPONENT ---

const QueueStatus = ({ barberId }) => {
  useAuth();
  const effectiveDate = format(new Date(), "yyyy-MM-dd");

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncedAt = useRef(Date.now());
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const hasLoadedRef = useRef(false);

  const fetchBarberAppointments = useCallback(async (isManual = false) => {
    if (!barberId) {
      setLoading(false);
      return;
    }

    if (isManual && Date.now() - lastSyncedAt.current < 15000) {
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 2000);
      return;
    }

    if (!hasLoadedRef.current) setLoading(true);
    setIsSyncing(true);

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/booking/website/barber-queue/${barberId}`,
        { params: { date: effectiveDate } }
      );
      setAppointments(Array.isArray(response.data) ? response.data : []);
      lastSyncedAt.current = Date.now();
      hasLoadedRef.current = true;

      if (isManual) {
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 2000);
      }
    } catch (error) {
      console.error("QueueStatus error:", error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [barberId, effectiveDate]);

  useEffect(() => {
    if (barberId) {
      fetchBarberAppointments();
    }
  }, [barberId, effectiveDate, fetchBarberAppointments]);

  useEffect(() => {
    if (!barberId) return;

    const interval = setInterval(() => {
      fetchBarberAppointments(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [barberId, fetchBarberAppointments]);

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
      <div className="min-h-[400px] flex flex-col items-center justify-center p-12">
        <RefreshCcw className="w-8 h-8 text-[#22C55E] animate-spin mb-4" />
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 animate-pulse">Syncing Tracker...</p>
      </div>
    );
  }

  if (!barberId) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-[28px] flex items-center justify-center mb-6 border border-red-500/20">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Queue Missing</h2>
        <p className="text-xs text-gray-500 font-medium mb-8 max-w-[200px] leading-relaxed">Could not identify live queue.</p>
      </div>
    );
  }

  return (
    <div className="text-white selection:bg-[#22C55E]/10">
      <div className="relative z-10 mx-auto flex flex-col">
        {/* Content Section */}
        <div className="p-4 flex-1">
          {sortedAppointments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-white/[0.02] rounded-[40px] border border-white/5"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8 relative">
                <Gift size={32} className="text-white/10" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-black text-white mb-2 tracking-tight uppercase">Desk is Clear</h3>
              <p className="text-center text-gray-500 text-[10px] font-black max-w-[200px] leading-relaxed uppercase tracking-widest opacity-80">
                No active bookings found
              </p>
            </motion.div>
          ) : (
            <div className="relative">
              <AnimatePresence mode='popLayout'>
                {sortedAppointments.map((item, idx) => (
                  <AppointmentCard
                    key={item._id}
                    appointment={item}
                    index={idx}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 p-6 bg-white/[0.02] rounded-[32px] border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-[-5px] right-[-5px] p-4 opacity-[0.02] transition-transform duration-1000 group-hover:scale-125">
              <Info size={100} className="text-white" />
            </div>

            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 flex items-center gap-3">
              <div className="w-1 h-4 bg-[#22C55E] rounded-full" />
              Tracker Rules
            </h4>

            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="w-5 h-5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center mt-0.5 shrink-0 font-black text-[9px] text-[#22C55E]">1</div>
                <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                  <span className="text-white font-black uppercase tracking-tight">Express</span> members jump the queue sequence automatically.
                </p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-5 h-5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center mt-0.5 shrink-0 font-black text-[9px] text-[#22C55E]">2</div>
                <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                  Head to the chair ONLY when your status glows <span className="text-[#22C55E] font-black">ACTIVE NOW</span>.
                </p>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default QueueStatus;
