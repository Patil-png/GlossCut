import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Calendar, Clock, Gift,
    Star, Crown, Circle,
    MapPin, Scissors, CheckCircle2,
    XCircle, AlertCircle, Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const getStatusConfig = (status) => {
    switch (status) {
        case 'completed': return { label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-50' };
        case 'cancelled': return { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50' };
        case 'started': return { label: 'In Progress', color: 'text-indigo-600', bg: 'bg-indigo-50' };
        default: return { label: status || 'Pending', color: 'text-amber-600', bg: 'bg-amber-50' };
    }
};

const getTypeMeta = (type) => {
    const size = 16;
    switch (type) {
        case 'Express': return { icon: <Zap size={size} className="text-purple-600 fill-purple-600" />, color: 'text-purple-600', bg: 'bg-purple-50' };
        case 'Premium': return { icon: <Star size={size} className="text-yellow-500 fill-yellow-500" />, color: 'text-yellow-600', bg: 'bg-yellow-50' };
        case 'Black Premium': return { icon: <Crown size={size} className="text-yellow-700" />, color: 'text-yellow-700', bg: 'bg-gray-900', isBlack: true };
        default: return { icon: <Circle size={size} className="text-gray-400" />, color: 'text-gray-500', bg: 'bg-gray-50' };
    }
};

const AppointmentCard = ({ app }) => {
    const status = getStatusConfig(app.status);
    const type = getTypeMeta(app.appointmentType);
    const customerName = app.isOfflineBooking ? app.customerName : (app.userId?.name || 'Guest');
    const displayTime = format(new Date(app.date), 'h:mm a');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative overflow-hidden rounded-[24px] border border-gray-100 shadow-sm mb-4 active:scale-[0.98] transition-all bg-white`}
        >
            <div className="flex">
                {/* Left Strip */}
                <div className={`w-1.5 ${type.isBlack ? 'bg-yellow-500' : 'bg-gray-100'}`} />

                <div className="flex-1 p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <h4 className="text-[17px] font-[800] text-gray-900 leading-tight mb-1 truncate">
                                {customerName}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${type.isBlack ? 'bg-gray-900 text-yellow-500 border-yellow-500/30' : `${type.bg} ${type.color} border-current/10`}`}>
                                    {app.appointmentType || 'Basic'}
                                </span>
                                {app.isOfflineBooking && (
                                    <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase">Offline</span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[18px] font-black text-gray-900">₹{app.totalPrice}</div>
                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">{displayTime}</div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Clock size={14} />
                            <span className="text-xs font-bold">{format(new Date(app.date), 'EEE, MMM d')}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${status.bg} ${status.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const QueueHistoryScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const fetchHistory = async () => {
        if (!user?._id) return;
        setLoading(true);
        try {
            const res = await api.get(`/api/booking/barber-appointments/${user._id}?date=${selectedDate}`);
            const data = res.data || [];
            // Sort by time
            const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
            setAppointments(sorted);
        } catch (err) {
            console.log('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [selectedDate, user?._id]);

    const activeSection = appointments.filter(a => ['confirmed', 'started'].includes(a.status));
    const completedSection = appointments.filter(a => a.status === 'completed');
    const cancelledSection = appointments.filter(a => a.status === 'cancelled');

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 pb-4">
                <div className="px-6 py-4 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                        <ChevronLeft size={20} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-lg font-black text-gray-900 tracking-tight">Queue History</h1>
                    <div className="w-10" />
                </div>

                <div className="px-6">
                    <div className="relative inline-block w-full">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                            <Calendar size={18} />
                        </div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>
            </header>

            <main className="px-6 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading History...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-[32px] flex items-center justify-center mb-6">
                            <Calendar size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">No Appointments</h3>
                        <p className="text-sm font-medium text-gray-400 max-w-[200px]">There are no bookings records for this date.</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {activeSection.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[2px] mb-4 ml-1">In Queue</h3>
                                {activeSection.map(app => <AppointmentCard key={app._id} app={app} />)}
                            </div>
                        )}
                        {completedSection.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[2px] mb-4 ml-1">Completed</h3>
                                {completedSection.map(app => <AppointmentCard key={app._id} app={app} />)}
                            </div>
                        )}
                        {cancelledSection.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-red-400 uppercase tracking-[2px] mb-4 ml-1">Cancelled</h3>
                                {cancelledSection.map(app => <AppointmentCard key={app._id} app={app} />)}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default QueueHistoryScreen;
