import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import {
  Clock, MapPin,
  ChevronRight, ArrowUpRight, History, CalendarDays, Zap
} from 'lucide-react';

// --- SHARED UI COMPONENTS (From AllServicesSearch) ---

const Background = memo(() => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-white overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
    <div className="absolute inset-0 w-full h-full block lg:hidden">
      <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
      <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
      <div className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-25 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #f59e0b 0%, #eab308 100%)' }} />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
    </div>
    <div className="hidden lg:block absolute inset-0">
      <motion.div animate={{ transform: ["translate(0px, 0px) scale(1)", "translate(20px, -20px) scale(1.1)", "translate(0px, 0px) scale(1)"] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#4C763B]/10 rounded-full blur-[80px]" />
      <motion.div animate={{ transform: ["translate(0px, 0px) scale(1)", "translate(-20px, 30px) scale(1.2)", "translate(0px, 0px) scale(1)"] }} transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 1 }} className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[90px]" />
      <div className="absolute bottom-[0%] right-[10%] w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[100px]" />
    </div>
    <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
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
    window.addEventListener("mousemove", moveCursor);
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
  const [activeTab, setActiveTab] = useState('all'); // all, completed, cancelled

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
    if (user && token) {
      fetchTripHistory();
    } else {
      setLoading(false);
    }
  }, [user, token, fetchTripHistory]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 20);
        }
      },
      { threshold: 0.5 }
    );

    const currentTarget = observerTarget.current;

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [pastTrips]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setVisibleCount(20); // Reset pagination
    if (tab === 'all') {
      setPastTrips(allPastTrips);
    } else {
      setPastTrips(allPastTrips.filter(t => t.status.toLowerCase() === tab));
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      confirmed: 'bg-blue-50 text-blue-600 border-blue-200',
      completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
      pending: 'bg-amber-50 text-amber-600 border-amber-200'
    };

    const activeStyle = styles[status.toLowerCase()] || styles.pending;

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${activeStyle}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4C763B]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B]">
      <CustomCursor />
      <Background />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24">

        {/* Header */}
        <div className="mb-16">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4C763B]/5 border border-[#4C763B]/20 text-[#4C763B] text-xs font-bold mb-4"
              >
                <Zap size={12} className="text-[#4C763B] fill-[#4C763B]" />
                <span className="uppercase tracking-wider">Dashboard</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl font-extrabold text-gray-900 mb-3 tracking-tight"
              >
                My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] to-green-600">Appointments</span>
              </motion.h1>
              <p className="text-gray-500 text-lg max-w-xl">Manage your upcoming visits and view past history.</p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4"
            >
              <div className="relative group">
                <div className="relative px-8 py-6 bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-200/50 rounded-2xl hover:translate-y-[-2px] transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 gap-8">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-blue-600" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-all" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{upcomingTrips.length}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Upcoming</div>
                </div>
              </div>

              <div className="relative group">
                <div className="relative px-8 py-6 bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-200/50 rounded-2xl hover:translate-y-[-2px] transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 gap-8">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <History className="w-5 h-5 text-emerald-600" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-all" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{allPastTrips.length}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Completed</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {upcomingTrips.length === 0 && pastTrips.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-gray-300 rounded-3xl bg-gray-50/50">
            <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No appointments yet</h3>
            <p className="text-gray-500 mb-8">Schedule your first grooming session today.</p>
            <button
              onClick={() => navigate('/book')}
              className="px-6 py-3 bg-[#4C763B] text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-colors shadow-lg shadow-green-900/20"
            >
              Book Now
            </button>
          </div>
        ) : (
          <div className="space-y-16">

            {/* Upcoming Section */}
            {upcomingTrips.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#4C763B] rounded-full"></span>
                  Upcoming Sessions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingTrips.map((trip) => (
                    <div
                      key={trip._id}
                      onClick={() => navigate(`/booking-details/${trip._id}`)}
                      className="group bg-white/70 backdrop-blur-md border border-white/80 rounded-3xl p-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all cursor-pointer hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                          <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-xl font-bold text-gray-900 border border-gray-100 shadow-sm">
                            {format(new Date(trip.date), 'dd')}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#4C763B] transition-colors">{trip.barberId?.name}</h3>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                              <Clock size={12} /> {trip.time}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={trip.status} />
                      </div>

                      <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                          <MapPin size={14} />
                          <span className="truncate max-w-[140px]">{trip.barberId?.shopName || 'Shop'}</span>
                        </div>
                        <span className="text-gray-900 font-bold bg-gray-50 px-2 py-1 rounded-md">₹{trip.totalPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Past History Grid */}
            {pastTrips.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">History Log</h2>

                  <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                    {['all', 'completed', 'cancelled'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-100 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm shadow-xl shadow-gray-200/30">
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

                  {/* Sentinel for Infinite Scroll */}
                  {visibleCount < pastTrips.length && (
                    <div ref={observerTarget} className="h-10 w-full flex items-center justify-center py-4 text-gray-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-300"></div>
                    </div>
                  )}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHistory;
