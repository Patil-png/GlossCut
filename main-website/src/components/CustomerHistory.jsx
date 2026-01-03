import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { 
  Clock, Scissors, AlertCircle, 
  CalendarClock, History, CheckCircle2, 
  XCircle, Timer, ListFilter, ArrowUpRight, Sparkles
} from 'lucide-react';

// --- Custom Cursor Component ---
const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 20, stiffness: 400, mass: 0.5 }; // Tweaked for snappier feel
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 12); // Centered offset
      cursorY.set(e.clientY - 12);
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-6 h-6 bg-indigo-500/50 rounded-full pointer-events-none z-[9999] hidden md:block backdrop-blur-sm mix-blend-screen"
        style={{ translateX: cursorXSpring, translateY: cursorYSpring }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] hidden md:block"
        style={{ translateX: cursorXSpring, translateY: cursorYSpring, marginLeft: 8, marginTop: 8 }}
      />
    </>
  );
};

const CustomerHistory = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [pastTrips, setPastTrips] = useState([]);
  const [allPastTrips, setAllPastTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

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

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All History', icon: ListFilter },
    { value: 'completed', label: 'Completed', icon: CheckCircle2 },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle },
  ];

  const handleFilterChange = (filterValue) => {
    setActiveFilter(filterValue);
    setShowFilterMenu(false);
    
    if (filterValue === 'all') {
      setPastTrips(allPastTrips);
    } else {
      const filtered = allPastTrips.filter(trip => trip.status.toLowerCase() === filterValue);
      setPastTrips(filtered);
    }
  };

  // Styled Status Config
  const getStatusConfig = (status, paymentStatus) => {
    const s = status.toLowerCase();
    if (s === 'confirmed' && paymentStatus === 'pending') return { 
        color: 'text-amber-300', 
        bg: 'bg-amber-500/10', 
        border: 'border-amber-500/20', 
        shadow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]',
        icon: Timer, label: 'Awaiting Payment' 
    };
    if (s === 'completed') return { 
        color: 'text-emerald-300', 
        bg: 'bg-emerald-500/10', 
        border: 'border-emerald-500/20', 
        shadow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]',
        icon: CheckCircle2, label: 'Completed' 
    };
    if (s === 'cancelled') return { 
        color: 'text-rose-300', 
        bg: 'bg-rose-500/10', 
        border: 'border-rose-500/20', 
        shadow: 'shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)]',
        icon: XCircle, label: 'Cancelled' 
    };
    if (s === 'confirmed') return { 
        color: 'text-indigo-300', 
        bg: 'bg-indigo-500/10', 
        border: 'border-indigo-500/20', 
        shadow: 'shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]',
        icon: Sparkles, label: 'Confirmed' 
    };
    return { 
        color: 'text-slate-300', 
        bg: 'bg-slate-500/10', 
        border: 'border-slate-500/20', 
        shadow: 'shadow-none',
        icon: AlertCircle, label: status 
    };
  };

  if (loading) return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center overflow-hidden">
      {/* Loading Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030303] to-[#030303]"></div>
      <div className="relative flex flex-col items-center z-10">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Scissors className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-8 text-indigo-300/70 font-bold tracking-[0.4em] text-xs uppercase animate-pulse">Accessing Vault...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-indigo-500/30 font-sans pb-24 overflow-x-hidden relative">
      <CustomCursor />
      
      {/* --- Ambient Background & Noise Texture --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
         {/* Noise Overlay - giving it that cinematic film grain look */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        
        {/* Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-800/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30vw] h-[30vw] bg-purple-800/10 rounded-full blur-[100px]" />
        
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 relative z-10">
        
        {/* --- Header Section --- */}
        <header className="mb-16 lg:mb-24">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            
            {/* Title Block */}
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-3"
              >
                <div className="h-[1px] w-12 bg-indigo-500/50"></div>
                <h4 className="text-indigo-400 font-bold tracking-[0.3em] uppercase text-xs">Personal Archive</h4>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40"
              >
                Grooming<span className="text-indigo-500">.</span><br />
                Timeline
              </motion.h1>
            </div>

            {/* Stats Cards - Glass effect */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 0.8, delay: 0.3 }}
               className="flex gap-4 sm:gap-6 w-full lg:w-auto"
            >
              {[
                { label: 'Upcoming', value: upcomingTrips.length, icon: CalendarClock, color: 'indigo' },
                { label: 'Total Visits', value: pastTrips.length, icon: History, color: 'emerald' }
              ].map((stat, i) => (
                <div key={i} className="flex-1 lg:min-w-[180px] p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}>
                      <stat.icon size={18} />
                    </span>
                    <ArrowUpRight size={14} className="text-neutral-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 group-hover:text-neutral-300 transition-colors">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </header>

        {upcomingTrips.length === 0 && pastTrips.length === 0 ? (
          /* --- Empty State: Minimalist --- */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 sm:py-32 rounded-[2rem] border border-dashed border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] rounded-full transform -translate-y-1/2"></div>
            <div className="p-8 rounded-3xl bg-[#0A0A0A] ring-1 ring-white/10 shadow-2xl shadow-indigo-500/10 mb-8 relative">
              <Scissors className="w-12 h-12 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 text-center">Your canvas is blank.</h2>
            <p className="text-neutral-400 mb-10 text-center max-w-md mx-auto leading-relaxed">Ready to elevate your style? Book your next session and start building your grooming legacy.</p>
            <button 
              onClick={() => navigate('/book')} 
              className="group relative px-8 py-4 bg-white text-black rounded-xl font-bold overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="flex items-center gap-3">
                <span>Book Appointment</span>
                <ArrowUpRight size={18} />
              </div>
            </button>
          </motion.div>
        ) : (
          <div className="space-y-24">
            
            {/* --- 3. Upcoming Section - "Holographic Ticket" Style --- */}
            {upcomingTrips.length > 0 && (
              <section className="relative">
                <div className="flex items-center gap-4 mb-8">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_15px_#6366f1]"></span>
                  <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-indigo-200/70">Incoming Sessions</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {upcomingTrips.map((trip, idx) => {
                    const status = getStatusConfig(trip.status, trip.paymentStatus);
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        key={trip._id}
                        onClick={() => navigate(`/booking-details/${trip._id}`)}
                        className="group cursor-pointer relative"
                      >
                        {/* Glow Effect behind card */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
                        
                        <div className="relative flex flex-col sm:flex-row bg-[#080808] border border-white/10 rounded-[2.5rem] overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
                          
                          {/* Ticket Stub (Left) */}
                          <div className="sm:w-32 bg-indigo-950/20 border-b sm:border-b-0 sm:border-r border-dashed border-white/10 flex flex-row sm:flex-col items-center justify-between sm:justify-center p-6 gap-2 relative">
                            {/* Decorative Notches */}
                            <div className="absolute -left-2 top-1/2 w-4 h-4 bg-[#020202] rounded-full hidden sm:block" />
                            <div className="absolute -right-2 top-1/2 w-4 h-4 bg-[#020202] rounded-full hidden sm:block" />
                            
                            <span className="text-indigo-400 font-bold text-xs tracking-[0.2em] uppercase">{format(new Date(trip.date), 'MMM')}</span>
                            <span className="text-4xl sm:text-5xl font-black text-white">{format(new Date(trip.date), 'dd')}</span>
                            <span className="text-neutral-500 font-medium text-[10px] uppercase tracking-wider">{format(new Date(trip.date), 'EEEE')}</span>
                          </div>

                          {/* Ticket Body (Right) */}
                          <div className="flex-1 p-6 sm:p-8 flex flex-col gap-6">
                            
                            {/* Header: Barber & Status */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-14 h-14">
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 rotate-6 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <img 
                                            src={trip.barberId?.profilePicture?.startsWith('http') ? trip.barberId.profilePicture : `${process.env.REACT_APP_API_URL}/${trip.barberId?.profilePicture}`} 
                                            alt=""
                                            className="relative w-full h-full object-cover rounded-xl border border-white/10 bg-neutral-900"
                                            onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=Barber&background=random'}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors">{trip.barberId?.name}</h3>
                                        <div className="flex items-center gap-2 text-neutral-400 text-sm mt-1">
                                            <Clock size={14} className="text-indigo-500" />
                                            <span>{trip.time}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`hidden sm:flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${status.bg} ${status.color} ${status.border} ${status.shadow} items-center gap-2`}>
                                    <status.icon size={12} />
                                    {status.label}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                            {/* Footer: Price & Action */}
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Total Value</p>
                                    <p className="text-2xl font-bold text-white">₹{trip.totalPrice}</p>
                                </div>
                                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 group-hover:text-white transition-colors">
                                    View Ticket <ArrowUpRight size={14} />
                                </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* --- 4. Past Section - "Data Terminal" Style --- */}
            {pastTrips.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-neutral-500 flex items-center gap-3">
                    Archive Database 
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-white text-[10px] border border-white/5">{pastTrips.length}</span>
                  </h2>
                  
                  {/* Filter HUD */}
                  <div className="relative z-20">
                    <button 
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A0A0A] border border-white/10 text-xs font-medium text-neutral-300 hover:border-indigo-500/50 hover:text-white transition-all shadow-lg"
                    >
                      <ListFilter size={14} />
                      <span className="uppercase tracking-wide">{filterOptions.find(f => f.value === activeFilter)?.label}</span>
                    </button>
                    
                    <AnimatePresence>
                      {showFilterMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                          <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] z-30 p-1.5"
                          >
                            {filterOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleFilterChange(option.value)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                                  activeFilter === option.value ? 'bg-indigo-500 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <option.icon size={14} />
                                {option.label}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Mobile: Card Stacks */}
                <div className="lg:hidden space-y-4">
                  {pastTrips.map((trip) => {
                    const status = getStatusConfig(trip.status, trip.paymentStatus);
                    return (
                      <div 
                        key={trip._id}
                        onClick={() => navigate(`/booking-details/${trip._id}`)}
                        className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 active:bg-neutral-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <img 
                            src={trip.barberId?.profilePicture?.startsWith('http') ? trip.barberId.profilePicture : `${process.env.REACT_APP_API_URL}/${trip.barberId?.profilePicture}`} 
                            alt="" 
                            className="w-12 h-12 rounded-xl object-cover bg-neutral-800"
                            onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=Barber&background=random'}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-white truncate">{trip.barberId?.name}</h3>
                                <span className="font-mono text-sm text-indigo-400">₹{trip.totalPrice}</span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">{format(new Date(trip.date), 'MMM dd')} • {trip.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${status.color}`}>
                                <status.icon size={12} />
                                {status.label}
                            </div>
                            <div className="flex -space-x-2">
                                {trip.services.slice(0,3).map((s,i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[8px] text-white" title={s.name}>
                                        {s.name[0]}
                                    </div>
                                ))}
                            </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: Futuristic Data Grid */}
                <div className="hidden lg:block w-full rounded-[2rem] border border-white/5 bg-[#080808]/50 backdrop-blur-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500">Barber Profile</th>
                                <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500">Timestamp</th>
                                <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500">Services Log</th>
                                <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500">Status</th>
                                <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500 text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {pastTrips.map((trip) => {
                                const status = getStatusConfig(trip.status, trip.paymentStatus);
                                return (
                                    <tr 
                                        key={trip._id} 
                                        onClick={() => navigate(`/booking-details/${trip._id}`)}
                                        className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-neutral-800 overflow-hidden ring-1 ring-white/10 group-hover:ring-indigo-500/50 transition-all">
                                                    <img src={trip.barberId?.profilePicture?.startsWith('http') ? trip.barberId.profilePicture : `${process.env.REACT_APP_API_URL}/${trip.barberId?.profilePicture}`} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-bold text-neutral-300 group-hover:text-white transition-colors">{trip.barberId?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white">{format(new Date(trip.date), 'MMM dd, yyyy')}</span>
                                                <span className="text-[10px] uppercase tracking-wide text-neutral-600">{trip.time}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex gap-2">
                                                {trip.services.slice(0, 2).map((s, i) => (
                                                    <span key={i} className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-white/5 text-neutral-400 border border-white/5 whitespace-nowrap">
                                                        {s.name}
                                                    </span>
                                                ))}
                                                {trip.services.length > 2 && <span className="px-2 py-1 text-[10px] text-neutral-600">+{trip.services.length - 2}</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-opacity-5 ${status.color} border-current border-opacity-20`}>
                                                <status.icon size={10} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest">{status.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="font-mono font-bold text-neutral-400 group-hover:text-indigo-400 transition-colors">₹{trip.totalPrice}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
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
