import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Calendar, User, Clock,
    ArrowRight, IndianRupee, MapPin, Search,
    Filter, RefreshCw, Loader2, Scissors,
    CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const HistoryScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchTripHistory = useCallback(async () => {
        if (!refreshing) setLoading(true);
        setError(null);
        try {
            const res = await api.get('/api/booking/history');
            setTrips(res.data);
        } catch (err) {
            console.error("Fetch History Error:", err);
            setError("Failed to load history");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [refreshing]);

    useEffect(() => {
        fetchTripHistory();
    }, [fetchTripHistory]);

    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return { label: 'Completed', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: <CheckCircle2 size={12} /> };
            case 'cancelled':
                return { label: 'Cancelled', color: 'text-rose-500', bg: 'bg-rose-50', icon: <XCircle size={12} /> };
            case 'pending':
                return { label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-50', icon: <AlertCircle size={12} /> };
            default:
                return { label: status, color: 'text-gray-500', bg: 'bg-gray-100', icon: null };
        }
    };

    const HistoryCard = ({ trip, index }) => {
        const status = getStatusConfig(trip.status);
        const date = trip.date ? new Date(trip.date) : null;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/booking-detail`, { state: { booking: trip } })}
                className="bg-white rounded-[32px] p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98] relative overflow-hidden group"
            >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full translate-x-12 -translate-y-12 group-hover:bg-indigo-50/50 transition-colors" />

                <div className="flex justify-between items-start relative z-10 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-indigo-600 border border-gray-100">
                            {trip.userId?.profilePicture ? (
                                <img 
                                    src={trip.userId?.profilePicture || '/GlossCut.png'} 
                                    alt="" 
                                    className="w-full h-full rounded-2xl object-cover" 
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/GlossCut.png';
                                    }}
                                />
                            ) : (
                                <User size={20} strokeWidth={2.5} />
                            )}
                        </div>
                        <div>
                            <h4 className="text-[15px] font-black text-gray-900 leading-tight">
                                {trip.service || "Grooming Session"}
                            </h4>
                            <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                                {trip.userId?.name || "Client Name"}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end text-indigo-600 font-black text-lg">
                            <IndianRupee size={14} strokeWidth={3} />
                            <span>{trip.fare || trip.totalPrice || 0}</span>
                        </div>
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${status.bg} ${status.color} text-[9px] font-black uppercase tracking-widest mt-2`}>
                            {status.icon}
                            {status.label}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-dashed border-gray-100 relative z-10">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-300" />
                        <span className="text-[11px] font-bold text-gray-500">
                            {date ? format(date, 'MMM dd, yyyy') : 'N/A'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-gray-300" />
                        <span className="text-[11px] font-bold text-gray-500">{trip.time || 'N/A'}</span>
                    </div>
                    <div className="ml-auto w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowRight size={14} />
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 flex justify-center">
            <div className="w-full max-w-[450px] relative min-h-screen flex flex-col">

                {/* Header */}
                <div className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-md z-40 border-b border-gray-100">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                        <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[15px] font-[900] text-gray-900 uppercase tracking-[0.2em]">History</h1>
                    <button onClick={() => { setRefreshing(true); fetchTripHistory(); }} className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                        <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''} text-gray-400`} />
                    </button>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-4">
                    {/* Search/Filter Bar */}
                    <div className="flex gap-2">
                        <div className="flex-1 h-14 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 flex items-center gap-3">
                            <Search size={18} className="text-gray-300" />
                            <input
                                type="text"
                                placeholder="Search by name or service..."
                                className="flex-1 bg-transparent border-none text-[13px] font-bold outline-none placeholder:text-gray-300"
                            />
                        </div>
                        <button className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
                            <Filter size={18} />
                        </button>
                    </div>

                    {loading && !refreshing ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Rewinding Time...</p>
                        </div>
                    ) : trips.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30 text-center">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                                <RefreshCw size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No History Found</h3>
                            <p className="text-xs font-bold text-gray-500 max-w-[200px] mt-2 leading-relaxed">
                                Your past appointments and interactions will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-2">
                            {trips.map((trip, idx) => (
                                <HistoryCard key={trip._id || idx} trip={trip} index={idx} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Legend/Footer */}
                <div className="px-10 pb-10 flex flex-col items-center gap-4 opacity-20">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Done</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Cancelled</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Wait</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryScreen;
