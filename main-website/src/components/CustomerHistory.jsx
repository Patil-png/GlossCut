import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import {
  Clock, MapPin,
  ChevronRight, History, CalendarDays, Zap
} from 'lucide-react';

// --- SHARED UI COMPONENTS ---

const Background = memo(() => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-white overflow-hidden">
    {/* Base Gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />

    {/* 
        1. MOBILE BACKGROUND (Exact Replica from Home.jsx) 
        Visible only on screens < 1024px
    */}
    <div className="absolute inset-0 w-full h-full block lg:hidden">
      {/* Top Right - Stronger Brand Green Glow */}
      <div
        className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply"
        style={{
          background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)',
        }}
      />

      {/* Bottom Left - Rich Purple/Pink Accent */}
      <div
        className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply"
        style={{
          background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)',
        }}
      />

      {/* Center Right - Warm Golden Glow for vibrancy */}
      <div
        className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-25 mix-blend-multiply"
        style={{
          background: 'radial-gradient(circle, #f59e0b 0%, #eab308 100%)',
        }}
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Moved Global Noise here to preserve Mobile UI */}
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
    </div>

    {/* 
        2. DESKTOP BACKGROUND (Animated Orbs)
        Visible only on screens >= 1024px 
    */}
    {/* 
        2. DESKTOP BACKGROUND (Whitish + Faint Green Patches)
        Visible only on screens >= 1024px 
    */}
    <div className="hidden lg:block absolute inset-0 w-full h-full z-0 overflow-hidden bg-white">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gray-50/50" />

      {/* Top Right - Faint Green Glow (Floating) */}
      <div
        className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-20 mix-blend-multiply animate-float"
        style={{
          background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)',
        }}
      />

      {/* Bottom Left - Faint Green Glow (Floating Delayed) */}
      <div
        className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-15 mix-blend-multiply animate-float-delayed"
        style={{
          background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)',
        }}
      />

      {/* Center Left - Very Faint Warmth (Floating Slow) - Adds depth */}
      <div
        className="absolute top-[30%] left-[20%] w-[30vw] h-[30vw] rounded-full blur-[90px] opacity-10 mix-blend-multiply animate-float-slow"
        style={{
          background: 'radial-gradient(circle, #86efac 0%, #4ade80 100%)', // Very light green/mint
        }}
      />

      {/* Texture Overlay (Noise) - Very Faint */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      {/* Grid Pattern Overlay for structure (Reduced Opacity #8080800a) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
    </div>
  </div>
));

const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      requestAnimationFrame(() => {
        cursorX.set(e.clientX - 16);
        cursorY.set(e.clientY - 16);
      });
    };
    // Only add listener on non-touch devices to save resources
    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("mousemove", moveCursor);
    }
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 border border-gray-900/30 bg-gray-900/5 rounded-full pointer-events-none z-[9999] hidden md:block will-change-transform"
      style={{ translateX: cursorXSpring, translateY: cursorYSpring }}
    >
      <div className="absolute inset-0 bg-gray-900/10 rounded-full" />
    </motion.div>
  );
};

const CustomerHistory = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [pastTrips, setPastTrips] = useState([]);
  const [allPastTrips, setAllPastTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [visibleCount, setVisibleCount] = useState(20);
  const observerTarget = React.useRef(null);

  const fetchTripHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/booking/history`, {
        headers: { 'x-auth-token': token },
      });

      const now = new Date();
      const upcoming = [];
      const past = [];

      response.data.forEach(booking => {
        if (booking.status !== 'cancelled' || booking.cancellationReason !== 'Payment not completed within 1 minute.') {
          const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
          if ((booking.status === 'pending' || booking.status === 'confirmed') && bookingDateTime > now) {
            upcoming.push(booking);
          } else {
            past.push(booking);
          }
        }
      });

      setUpcomingTrips(upcoming.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()));
      const sortedPast = past.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
      setPastTrips(sortedPast);
      setAllPastTrips(sortedPast);
    } catch (error) {
      console.error('Failed to fetch trip history:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) fetchTripHistory();
    else setLoading(false);
  }, [user, token, fetchTripHistory]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) setVisibleCount(prev => prev + 20);
      },
      { threshold: 0.5 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [pastTrips]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setVisibleCount(20);
    if (tab === 'all') setPastTrips(allPastTrips);
    else setPastTrips(allPastTrips.filter(t => t.status.toLowerCase() === tab));
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      confirmed: 'bg-blue-50 text-blue-600 border-blue-200',
      completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
      pending: 'bg-amber-50 text-amber-600 border-amber-200'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold border ${styles[status.toLowerCase()] || styles.pending} uppercase tracking-wide`}>
        {status}
      </span>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4C763B]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] pb-10">
      <CustomCursor />
      <Background />

      {/* Reduced padding for mobile (px-4) */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-24">

        {/* --- HEADER SECTION --- */}
        <div className="mt-20 md:mt-0 mb-10 md:mb-16">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4C763B]/5 border border-[#4C763B]/20 text-[#4C763B] text-[10px] md:text-xs font-bold mb-3 md:mb-4"
              >
                <Zap size={12} className="text-[#4C763B] fill-[#4C763B]" />
                <span className="uppercase tracking-wider">Dashboard</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                // Responsive font sizes: text-3xl on mobile, text-5xl on desktop
                className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-2 md:mb-3 tracking-tight leading-tight"
              >
                My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] to-green-600">Appointments</span>
              </motion.h1>
              <p className="text-gray-500 text-sm md:text-lg max-w-xl leading-relaxed">
                Manage your upcoming visits and view past history.
              </p>
            </div>

            {/* Stats Cards - Grid on mobile for side-by-side view */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-3 md:flex md:gap-4 mt-2 md:mt-0"
            >
              <div className="relative group">
                <div className="relative px-4 py-4 md:px-8 md:py-6 bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-200/50 rounded-2xl hover:translate-y-[-2px] transition-all duration-300">
                  <div className="flex items-center justify-between mb-2 md:mb-3 gap-2 md:gap-8">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{upcomingTrips.length}</div>
                  <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400">Upcoming</div>
                </div>
              </div>

              <div className="relative group">
                <div className="relative px-4 py-4 md:px-8 md:py-6 bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-200/50 rounded-2xl hover:translate-y-[-2px] transition-all duration-300">
                  <div className="flex items-center justify-between mb-2 md:mb-3 gap-2 md:gap-8">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <History className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{allPastTrips.length}</div>
                  <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400">Completed</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {upcomingTrips.length === 0 && pastTrips.length === 0 ? (
          <div className="text-center py-20 md:py-32 border border-dashed border-gray-300 rounded-3xl bg-gray-50/50 px-4">
            <CalendarDays className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No appointments yet</h3>
            <p className="text-gray-500 mb-6 md:mb-8 text-sm">Schedule your first grooming session today.</p>
            <button
              onClick={() => navigate('/book')}
              className="w-full md:w-auto px-6 py-3 bg-[#4C763B] text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-colors shadow-lg shadow-green-900/20"
            >
              Book Now
            </button>
          </div>
        ) : (
          <div className="space-y-12 md:space-y-16">

            {/* --- UPCOMING SECTION --- */}
            {upcomingTrips.length > 0 && (
              <section>
                <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 md:mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#4C763B] rounded-full"></span>
                  Upcoming Sessions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {upcomingTrips.map((trip) => (
                    <div
                      key={trip._id}
                      onClick={() => navigate(`/booking-details/${trip._id}`)}
                      className="group bg-white/80 md:bg-white/70 backdrop-blur-md border border-gray-100 md:border-white/80 rounded-2xl md:rounded-3xl p-5 md:p-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all cursor-pointer hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start mb-5 md:mb-6">
                        <div className="flex gap-4">
                          <div className="h-12 w-12 md:h-14 md:w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-lg md:text-xl font-bold text-gray-900 border border-gray-100 shadow-sm shrink-0">
                            {format(new Date(trip.date), 'dd')}
                          </div>
                          <div className="min-w-0"> {/* min-w-0 ensures truncation works */}
                            <h3 className="font-bold text-gray-900 text-base md:text-lg group-hover:text-[#4C763B] transition-colors truncate">{trip.barberId?.name}</h3>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                              <Clock size={12} /> {trip.time}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 ml-2">
                          <StatusBadge status={trip.status} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs md:text-sm pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-500 font-medium truncate pr-2">
                          <MapPin size={14} className="shrink-0" />
                          <span className="truncate">{trip.barberId?.shopName || 'Shop'}</span>
                        </div>
                        <span className="text-gray-900 font-bold bg-gray-50 px-2 py-1 rounded-md shrink-0">₹{trip.totalPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* --- HISTORY SECTION --- */}
            {pastTrips.length > 0 && (
              <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
                  <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-500">History Log</h2>

                  {/* Tabs - Full width on mobile for easier tapping */}
                  <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full md:w-auto">
                    {['all', 'completed', 'cancelled'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`flex-1 md:flex-none px-3 md:px-4 py-2 md:py-1.5 text-xs font-bold rounded-lg capitalize transition-all text-center ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* --- MOBILE VIEW: CARDS (Visible on Small Screens) --- */}
                <div className="md:hidden space-y-3">
                  {pastTrips.slice(0, visibleCount).map((trip) => (
                    <div
                      key={trip._id}
                      onClick={() => navigate(`/booking-details/${trip._id}`)}
                      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                            {format(new Date(trip.date), 'MMM dd, yyyy')} • {trip.time}
                          </p>
                          <h4 className="font-bold text-gray-900 text-lg">{trip.barberId?.name}</h4>
                        </div>
                        <StatusBadge status={trip.status} />
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="text-xs text-gray-500 font-medium truncate max-w-[60%]">
                          {trip.services.map(s => s.name).join(', ')}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">₹{trip.totalPrice}</span>
                          <ChevronRight size={14} className="text-gray-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* --- DESKTOP VIEW: TABLE (Visible on Medium+ Screens) --- */}
                <div className="hidden md:block border border-gray-100 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm shadow-xl shadow-gray-200/30">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-400">
                        <th className="px-8 py-5 font-bold">Date</th>
                        <th className="px-6 py-5 font-bold">Barber / Shop</th>
                        <th className="px-6 py-5 font-bold">Services</th>
                        <th className="px-6 py-5 font-bold">Status</th>
                        <th className="px-6 py-5 font-bold text-right">Amount</th>
                        <th className="px-8 py-5 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pastTrips.slice(0, visibleCount).map((trip) => (
                        <tr
                          key={trip._id}
                          onClick={() => navigate(`/booking-details/${trip._id}`)}
                          className="group hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-900">{format(new Date(trip.date), 'MMM dd, yyyy')}</span>
                              <span className="text-xs text-gray-400 mt-0.5 font-medium">{trip.time}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold border border-gray-200">
                                {trip.barberId?.name?.charAt(0) || 'B'}
                              </div>
                              <span className="text-sm text-gray-600 font-medium group-hover:text-[#4C763B] transition-colors">{trip.barberId?.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-gray-500 font-medium truncate max-w-[200px] block">
                              {trip.services.map(s => s.name).join(', ')}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <StatusBadge status={trip.status} />
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="text-sm font-bold text-gray-900">₹{trip.totalPrice}</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#4C763B] group-hover:text-white transition-all">
                              <ChevronRight size={16} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sentinel for Infinite Scroll (Works for both views) */}
                {visibleCount < pastTrips.length && (
                  <div ref={observerTarget} className="h-10 w-full flex items-center justify-center py-4 text-gray-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-300"></div>
                  </div>
                )}
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHistory;