import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { 
  Calendar, Clock, Scissors, ChevronRight, AlertCircle, 
  CalendarClock, History, CreditCard, CheckCircle2, 
  XCircle, Timer, ListFilter, ArrowUpRight, Search, MapPin
} from 'lucide-react';

// Custom Cursor Component
const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 border-2 border-indigo-500 rounded-full pointer-events-none z-[9999] hidden md:block mix-blend-difference"
      style={{
        translateX: cursorXSpring,
        translateY: cursorYSpring,
      }}
    />
  );
};

const CustomerHistory = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [pastTrips, setPastTrips] = useState([]);
  const [allPastTrips, setAllPastTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (user && token) {
      fetchTripHistory();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const fetchTripHistory = async () => {
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
      setError(error.response?.data?.message || 'Failed to fetch trip history');
    } finally {
      setLoading(false);
    }
  };

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All', icon: ListFilter },
    { value: 'completed', label: 'Completed', icon: CheckCircle2 },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle },
  ];

  // Handle filter change
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

  // Helper to get sophisticated status styling
  const getStatusConfig = (status, paymentStatus) => {
    const s = status.toLowerCase();
    if (s === 'confirmed' && paymentStatus === 'pending') return { 
        color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Timer, label: 'Awaiting Payment' 
    };
    if (s === 'completed') return { 
        color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: CheckCircle2, label: 'Completed' 
    };
    if (s === 'cancelled') return { 
        color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', icon: XCircle, label: 'Cancelled' 
    };
    if (s === 'confirmed') return { 
        color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', icon: CheckCircle2, label: 'Confirmed' 
    };
    return { 
        color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', icon: AlertCircle, label: status 
    };
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="relative flex flex-col items-center">
        <div className="w-16 h-16 sm:w-24 sm:h-24 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
        <Scissors className="absolute top-5 sm:top-8 w-6 h-6 sm:w-8 sm:h-8 text-indigo-500 animate-pulse" />
        <p className="mt-6 sm:mt-8 text-indigo-200/50 font-medium tracking-[0.2em] sm:tracking-[0.3em] uppercase text-[10px] sm:text-xs animate-pulse">Syncing Vault...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 font-sans pb-20 overflow-x-hidden">
      
      {/* Custom Cursor Effect */}
      <CustomCursor />
      
      {/* 1. Cinematic Ambient Background - Matching SetkarCoins page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Main Ambient Glows - Same as SetkarCoins */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-indigo-600/10 rounded-full blur-[80px] sm:blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-purple-600/10 rounded-full blur-[60px] sm:blur-[100px] translate-y-1/2 -translate-x-1/2" />
        
        {/* Grid Effect - matching SetkarCoins page */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] sm:bg-[size:24px_24px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 relative z-10">
        
        {/* 2. Dashboard Header with Stats */}
        <header className="flex flex-col gap-6 sm:gap-8 mb-10 sm:mb-16 animate-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
                <span className="h-px w-6 sm:w-8 bg-indigo-500"></span>
                <h4 className="text-indigo-400 font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-[10px] sm:text-xs">My Collection</h4>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50">
              Grooming <br className="sm:hidden" /> Timeline.
            </h1>
          </div>

          <div className="flex gap-3 sm:gap-4 w-full">
            {/* Stat Card 1 */}
            <div className="flex-1 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-neutral-900/40 border border-white/5 backdrop-blur-md hover:bg-neutral-900/60 transition-all group">
              <p className="text-[9px] sm:text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1.5 sm:mb-2 group-hover:text-indigo-400 transition-colors">Upcoming</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl sm:text-4xl font-black text-white">{upcomingTrips.length}</span>
                <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-700 group-hover:text-indigo-500 transition-colors mb-0.5 sm:mb-1" />
              </div>
            </div>
            {/* Stat Card 2 */}
            <div className="flex-1 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-neutral-900/40 border border-white/5 backdrop-blur-md hover:bg-neutral-900/60 transition-all group">
              <p className="text-[9px] sm:text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1.5 sm:mb-2 group-hover:text-emerald-400 transition-colors">Completed</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl sm:text-4xl font-black text-white">{pastTrips.length}</span>
                <History className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-700 group-hover:text-emerald-500 transition-colors mb-0.5 sm:mb-1" />
              </div>
            </div>
          </div>
        </header>

        {upcomingTrips.length === 0 && pastTrips.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 sm:py-32 px-4 border border-dashed border-white/10 rounded-2xl sm:rounded-[3rem] bg-white/[0.01]">
            <div className="p-6 sm:p-8 rounded-full bg-indigo-500/10 mb-6 sm:mb-8 ring-1 ring-indigo-500/20 shadow-[0_0_50px_rgba(79,70,229,0.1)]">
                <Scissors className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-400" />
            </div>
            <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3 text-white text-center">Your schedule is clear.</h2>
            <p className="text-neutral-400 mb-6 sm:mb-8 text-sm sm:text-lg text-center">Experience the art of grooming.</p>
            <button onClick={() => navigate('/book')} className="px-6 sm:px-10 py-3 sm:py-4 bg-white text-black rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:bg-indigo-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 sm:gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              Find a Barber <ArrowUpRight size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-20">
            
            {/* 3. Upcoming Section - "The Boarding Pass" Layout */}
            {upcomingTrips.length > 0 && (
              <section className="animate-in fade-in duration-1000">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></div>
                  <h2 className="text-xs sm:text-sm font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase text-white/70">Incoming Appointments</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {upcomingTrips.map((trip) => {
                    const status = getStatusConfig(trip.status, trip.paymentStatus);
                    return (
                      <div 
                        key={trip._id}
                        onClick={() => navigate(`/booking-details/${trip._id}`)}
                        className="group relative bg-[#0A0A0A] border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-1.5 sm:p-2 hover:border-indigo-500/30 transition-all duration-500 cursor-pointer hover:shadow-[0_0_50px_rgba(79,70,229,0.15)]"
                      >
                        <div className="flex flex-col sm:flex-row h-full bg-neutral-900/20 rounded-xl sm:rounded-[2rem] overflow-hidden">
                          
                          {/* Date Ticket Strip - Calendar Style */}
                          <div className="sm:w-28 lg:w-32 bg-gradient-to-br from-indigo-600/15 via-indigo-600/10 to-transparent flex items-center sm:flex-col sm:items-center justify-center p-3 sm:py-6 lg:py-8 border-b sm:border-b-0 sm:border-r border-indigo-500/20 gap-3 sm:gap-2 relative overflow-hidden">
                             {/* Decorative elements */}
                             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 sm:h-full sm:w-1 sm:left-0 sm:top-0 sm:bottom-0 sm:right-auto"></div>
                             
                             {/* Mobile: Horizontal layout */}
                             <div className="flex sm:hidden items-center gap-3">
                               <div className="flex flex-col items-center bg-indigo-500/20 rounded-xl px-3 py-2 border border-indigo-500/30">
                                 <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">{format(new Date(trip.date), 'MMM')}</span>
                                 <span className="text-2xl font-black text-white leading-tight">{format(new Date(trip.date), 'dd')}</span>
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-sm font-bold text-white">{format(new Date(trip.date), 'EEEE')}</span>
                                 <span className="text-[10px] text-indigo-300/60">{format(new Date(trip.date), 'yyyy')}</span>
                               </div>
                             </div>
                             
                             {/* Desktop: Vertical layout */}
                             <div className="hidden sm:flex flex-col items-center">
                               <span className="text-[10px] lg:text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">{format(new Date(trip.date), 'MMM')}</span>
                               <span className="text-4xl lg:text-5xl font-black text-white leading-none mb-1">{format(new Date(trip.date), 'dd')}</span>
                               <span className="text-[10px] lg:text-xs font-medium text-indigo-300/50 uppercase bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">{format(new Date(trip.date), 'EEE')}</span>
                             </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col justify-between gap-4 sm:gap-6">
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-neutral-800 overflow-hidden ring-1 ring-white/10 flex-shrink-0">
                                        <img 
                                            src={trip.barberId?.profilePicture?.startsWith('http') ? trip.barberId.profilePicture : `${process.env.REACT_APP_API_URL}/${trip.barberId?.profilePicture}`} 
                                            alt=""
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=Barber&background=random'}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base sm:text-xl font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{trip.barberId?.name}</h3>
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
                                            <Clock size={12} className="sm:w-3.5 sm:h-3.5" /> {trip.time}
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-1.5 sm:p-2 rounded-full border flex-shrink-0 ${status.border} ${status.bg} ${status.color}`}>
                                    <status.icon size={14} className="sm:w-4 sm:h-4" />
                                </div>
                            </div>

                            <div className="flex items-end justify-between pt-4 sm:pt-6 border-t border-white/5">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-neutral-500">Total Price</span>
                                    <span className="text-xl sm:text-2xl font-bold text-white">₹{trip.totalPrice}</span>
                                </div>
                                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 text-[10px] sm:text-xs font-bold text-neutral-300 group-hover:bg-white group-hover:text-black transition-all flex items-center gap-1.5 sm:gap-2">
                                    View <span className="hidden sm:inline">Ticket</span> <ArrowUpRight size={12} className="sm:w-3.5 sm:h-3.5" />
                                </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 4. Past Section - Mobile Cards / Desktop Table */}
            {pastTrips.length > 0 && (
              <section className="pb-10 sm:pb-20 animate-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h2 className="text-xs sm:text-sm font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase text-neutral-500">
                    Archive {activeFilter !== 'all' && <span className="text-indigo-400 ml-1">({pastTrips.length})</span>}
                  </h2>
                  
                  {/* Filter Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-[10px] sm:text-xs font-medium transition-all ${
                        activeFilter !== 'all' 
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                          : 'bg-neutral-900 border-white/5 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      <ListFilter size={12} className="sm:w-3.5 sm:h-3.5" />
                      {filterOptions.find(f => f.value === activeFilter)?.label || 'Filter'}
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showFilterMenu && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowFilterMenu(false)}
                        />
                        
                        {/* Menu */}
                        <div className="absolute right-0 top-full mt-2 w-44 sm:w-48 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
                          <div className="p-2">
                            {filterOptions.map((option) => {
                              const Icon = option.icon;
                              const isActive = activeFilter === option.value;
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => handleFilterChange(option.value)}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                    isActive 
                                      ? 'bg-indigo-500/20 text-indigo-400' 
                                      : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                                  }`}
                                >
                                  <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-neutral-500'} />
                                  {option.label}
                                  {isActive && (
                                    <CheckCircle2 size={14} className="ml-auto text-indigo-400" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-3">
                  {pastTrips.map((trip) => {
                    const status = getStatusConfig(trip.status, trip.paymentStatus);
                    return (
                      <div 
                        key={trip._id}
                        onClick={() => navigate(`/booking-details/${trip._id}`)}
                        className="bg-neutral-900/40 border border-white/5 rounded-2xl p-4 active:bg-neutral-800/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-neutral-800 overflow-hidden ring-1 ring-white/5 flex-shrink-0">
                              <img 
                                src={trip.barberId?.profilePicture?.startsWith('http') ? trip.barberId.profilePicture : `${process.env.REACT_APP_API_URL}/${trip.barberId?.profilePicture}`} 
                                alt="" 
                                className="w-full h-full object-cover"
                                onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=Barber&background=random'}
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-neutral-200 truncate">{trip.barberId?.name}</h3>
                              <p className="text-xs text-neutral-500">{format(new Date(trip.date), 'MMM dd, yyyy')} • {trip.time}</p>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-md border flex items-center gap-1 flex-shrink-0 ${status.bg} ${status.border} ${status.color}`}>
                            <status.icon size={10} />
                            <span className="text-[9px] font-bold uppercase">{status.label}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="flex gap-1.5 flex-wrap">
                            {trip.services.slice(0, 2).map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded text-[9px] font-medium bg-white/5 text-neutral-400 border border-white/5">
                                {s.name}
                              </span>
                            ))}
                            {trip.services.length > 2 && (
                              <span className="text-[9px] text-neutral-600 self-center">+{trip.services.length - 2}</span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-sm text-neutral-300">₹{trip.totalPrice}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block w-full overflow-hidden rounded-[2rem] border border-white/5 bg-neutral-900/20 backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-neutral-500">
                                    <th className="px-8 py-6 font-bold">Barber</th>
                                    <th className="px-8 py-6 font-bold">Date & Time</th>
                                    <th className="px-8 py-6 font-bold">Services</th>
                                    <th className="px-8 py-6 font-bold">Status</th>
                                    <th className="px-8 py-6 font-bold text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
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
                                                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500 ring-1 ring-white/5">
                                                        <img src={trip.barberId?.profilePicture?.startsWith('http') ? trip.barberId.profilePicture : `${process.env.REACT_APP_API_URL}/${trip.barberId?.profilePicture}`} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="font-bold text-neutral-300 group-hover:text-white transition-colors">{trip.barberId?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-neutral-300">{format(new Date(trip.date), 'MMM dd, yyyy')}</span>
                                                    <span className="text-xs text-neutral-600">{trip.time}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex gap-2">
                                                    {trip.services.slice(0, 2).map((s, i) => (
                                                        <span key={i} className="px-2 py-1 rounded text-[10px] font-medium bg-white/5 text-neutral-400 border border-white/5">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                    {trip.services.length > 2 && <span className="text-[10px] text-neutral-600 self-center">+{trip.services.length - 2}</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${status.bg} ${status.border} ${status.color}`}>
                                                    <status.icon size={12} />
                                                    <span className="text-[10px] font-bold uppercase tracking-wide">{status.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="font-mono font-bold text-neutral-400 group-hover:text-white transition-colors">₹{trip.totalPrice}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
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
