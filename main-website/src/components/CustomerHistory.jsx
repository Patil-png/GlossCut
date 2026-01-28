import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Clock, MapPin,
  ChevronRight, ArrowUpRight, History, CalendarDays
} from 'lucide-react';

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

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
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
      confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };

    // Default to pending if unknown
    const activeStyle = styles[status.toLowerCase()] || styles.pending;

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${activeStyle}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-neutral-800">
      <div className="max-w-6xl mx-auto px-6 py-24">

        {/* Header */}
        <div className="mb-16">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-4"
              >
                <div className="h-[2px] w-8 bg-gradient-to-r from-blue-500 to-transparent"></div>
                <span className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em]">Dashboard</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl font-bold text-white mb-3 tracking-tight"
              >
                My Appointments
              </motion.h1>
              <p className="text-neutral-400 text-sm">Manage your upcoming visits and view past history.</p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-60"></div>
                <div className="relative px-8 py-6 bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-blue-400" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{upcomingTrips.length}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Upcoming</div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-60"></div>
                <div className="relative px-8 py-6 bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <History className="w-5 h-5 text-emerald-400" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{allPastTrips.length}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Completed</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {upcomingTrips.length === 0 && pastTrips.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/20">
            <CalendarDays className="mx-auto h-12 w-12 text-neutral-700 mb-4" />
            <h3 className="text-lg font-medium text-white">No appointments yet</h3>
            <p className="text-neutral-500 mb-8">Schedule your first grooming session today.</p>
            <button
              onClick={() => navigate('/book')}
              className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Book Now
            </button>
          </div>
        ) : (
          <div className="space-y-16">

            {/* Upcoming Section */}
            {upcomingTrips.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Upcoming Sessions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingTrips.map((trip) => (
                    <div
                      key={trip._id}
                      onClick={() => navigate(`/booking-details/${trip._id}`)}
                      className="group bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 hover:border-neutral-600 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                          <div className="h-12 w-12 bg-neutral-800 rounded-lg flex items-center justify-center text-xl font-bold text-white border border-neutral-700">
                            {format(new Date(trip.date), 'dd')}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{trip.barberId?.name}</h3>
                            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
                              <Clock size={12} /> {trip.time}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={trip.status} />
                      </div>

                      <div className="flex items-center justify-between text-sm pt-4 border-t border-neutral-800">
                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <MapPin size={14} />
                          <span className="truncate max-w-[140px]">{trip.barberId?.shopName || 'Shop'}</span>
                        </div>
                        <span className="text-white font-medium">₹{trip.totalPrice}</span>
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
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">History Log</h2>

                  <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                    {['all', 'completed', 'cancelled'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${activeTab === tab ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-900/50 text-[11px] uppercase tracking-wider text-neutral-500">
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold">Barber / Shop</th>
                        <th className="px-6 py-4 font-semibold">Services</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Amount</th>
                        <th className="px-6 py-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {pastTrips.slice(0, visibleCount).map((trip) => (
                        <tr
                          key={trip._id}
                          onClick={() => navigate(`/booking-details/${trip._id}`)}
                          className="group hover:bg-neutral-800/40 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-white">{format(new Date(trip.date), 'MMM dd, yyyy')}</span>
                              <span className="text-xs text-neutral-500 mt-0.5">{trip.time}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs text-neutral-400 font-bold border border-neutral-700">
                                {trip.barberId?.name?.charAt(0) || 'B'}
                              </div>
                              <span className="text-sm text-neutral-300 group-hover:text-white">{trip.barberId?.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-neutral-400 truncate max-w-[200px] block">
                              {trip.services.map(s => s.name).join(', ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={trip.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-medium text-white">₹{trip.totalPrice}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <ChevronRight size={16} className="ml-auto text-neutral-600 group-hover:text-white transition-colors" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Sentinel for Infinite Scroll */}
                  {visibleCount < pastTrips.length && (
                    <div ref={observerTarget} className="h-10 w-full flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-neutral-600"></div>
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
