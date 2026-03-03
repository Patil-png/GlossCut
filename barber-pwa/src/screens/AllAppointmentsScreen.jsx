import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar as CalendarIcon, Scissors,
    Clock, User, CheckCircle2, XCircle,
    AlertCircle, Search, Filter, Loader2,
    IndianRupee, ChevronRight, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const StatusBadge = ({ status, paymentStatus }) => {
    const getStatusConfig = (status, paymentStatus) => {
        if (paymentStatus === "pending")
            return { label: "Unpaid", color: "text-rose-500", bg: "bg-rose-50", icon: <AlertCircle size={10} /> };
        switch (status) {
            case "pending":
                return { label: "Approving", color: "text-amber-500", bg: "bg-amber-50", icon: <Clock size={10} /> };
            case "confirmed":
                return { label: "Confirmed", color: "text-emerald-500", bg: "bg-emerald-50", icon: <CheckCircle2 size={10} /> };
            case "started":
                return { label: "Active", color: "text-indigo-500", bg: "bg-indigo-50", icon: <Clock size={10} /> };
            case "completed":
                return { label: "Done", color: "text-gray-500", bg: "bg-gray-100", icon: <CheckCircle2 size={10} /> };
            default:
                return { label: status, color: "text-gray-400", bg: "bg-gray-50", icon: null };
        }
    };

    const config = getStatusConfig(status, paymentStatus);
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg} ${config.color} text-[9px] font-black uppercase tracking-widest`}>
            {config.icon}
            {config.label}
        </div>
    );
};

const AppointmentCard = ({ item, index, onClick }) => {
    const dateObj = new Date(item.date);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            className="bg-white rounded-[32px] p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] flex items-stretch gap-5 overflow-hidden group"
        >
            {/* Left: Date Block */}
            <div className="w-[70px] bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100/50 py-3 flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                    {format(dateObj, "MMM")}
                </span>
                <span className="text-2xl font-black text-gray-900 leading-none mb-1.5">
                    {format(dateObj, "dd")}
                </span>
                <div className="bg-indigo-600 px-2 py-0.5 rounded-lg">
                    <span className="text-[9px] font-bold text-white whitespace-nowrap">{item.time}</span>
                </div>
            </div>

            {/* Right: Info */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                            {item.userId?.profilePicture ? (
                                <img 
                                    src={item.userId?.profilePicture || '/GlossCut.png'} 
                                    alt="" 
                                    className="w-full h-full rounded-xl object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/GlossCut.png';
                                    }}
                                />
                            ) : (
                                <User size={18} strokeWidth={2.5} />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-[16px] font-black text-gray-900 truncate tracking-tight">
                                {item.userId?.name || "Guest User"}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Scissors size={10} className="text-gray-400" />
                                <span className="text-[11px] font-bold text-gray-400 truncate">
                                    {item.services.map(s => s.name).join(", ")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px w-full bg-gray-50 my-4" />

                <div className="flex items-center justify-between">
                    <StatusBadge status={item.status} paymentStatus={item.paymentStatus} />
                    <div className="flex items-center gap-0.5 font-black text-gray-900 text-lg">
                        <IndianRupee size={14} strokeWidth={3} className="text-indigo-600" />
                        <span>{Math.floor(item.totalPrice)}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const AllAppointmentsScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [refreshing, setRefreshing] = useState(false);

    const filterOptions = [
        { key: "pending", label: "Pending" },
        { key: "confirmed", label: "Upcoming" },
        { key: "completed", label: "History" },
    ];

    const fetchAppointments = useCallback(async () => {
        if (!refreshing) setLoading(true);
        try {
            const res = await api.get('/api/booking/barber');
            setAppointments(res.data.filter(a => a.status !== "cancelled"));
        } catch (err) {
            console.error("Fetch Appointments Error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [refreshing]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const activeAppointments = appointments.filter(a => {
        if (filter === 'confirmed') return a.status === 'confirmed' || a.status === 'started';
        return a.status === filter;
    });

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 flex justify-center">
            <div className="w-full max-w-[450px] relative min-h-screen flex flex-col">

                {/* Header */}
                <div className="px-6 pt-10 pb-6 bg-[#F8F9FA]/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                            <ArrowLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                        </button>
                        <h1 className="text-[17px] font-[900] text-gray-900 uppercase tracking-[0.2em]">My Bookings</h1>
                        <button onClick={() => { setRefreshing(true); fetchAppointments(); }} className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                            <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''} text-gray-400`} />
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="bg-gray-100 p-1 rounded-full flex relative h-12">
                        <motion.div
                            className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm"
                            layout
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={{
                                width: `calc((100% - 8px) / 3)`,
                                left: filter === 'pending' ? '4px' : filter === 'confirmed' ? 'calc(33.33% + 4px)' : 'calc(66.66% + 4px)'
                            }}
                        />
                        {filterOptions.map((opt) => (
                            <button
                                key={opt.key}
                                onClick={() => setFilter(opt.key)}
                                className={`flex-1 relative z-10 text-[11px] font-black uppercase tracking-widest transition-colors ${filter === opt.key ? 'text-gray-900' : 'text-gray-400'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-4">
                    {loading && !refreshing ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Agenda...</p>
                        </div>
                    ) : activeAppointments.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30 text-center px-10">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                                <CalendarIcon size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No {filter} bookings</h3>
                            <p className="text-[11px] font-bold text-gray-500 mt-2 leading-relaxed">
                                Your appointment list is empty for this category. New requests will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeAppointments.map((app, idx) => (
                                <AppointmentCard
                                    key={app._id || idx}
                                    item={app}
                                    index={idx}
                                    onClick={() => navigate(`/appointments/${app._id}`, { state: { appointment: app } })}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllAppointmentsScreen;
