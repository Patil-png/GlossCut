import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Calendar, Clock, User, MapPin,
    Phone, Mail, Star, DollarSign, Lock, ShieldCheck,
    ChevronRight, ExternalLink
} from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

const BookingDetailScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { booking } = location.state || {};
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (booking && booking.date && booking.time) {
            // Parse date and time correctly
            const dateStr = format(new Date(booking.date), 'yyyy-MM-dd');
            const appointmentDateTime = new Date(`${dateStr}T${booking.time}`);

            const interval = setInterval(() => {
                const now = new Date();
                const seconds = differenceInSeconds(appointmentDateTime, now);
                setTimeLeft(seconds > 0 ? seconds : 0);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [booking]);

    const formatTimeLeft = (seconds) => {
        if (seconds === 0) return 'Appointment started!';
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

        return parts.join(' ');
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return '#10B981'; // Green
            case 'pending':
            case 'pending (demo)': return '#F59E0B'; // Amber
            case 'cancelled': return '#EF4444'; // Red
            case 'started': return '#6366F1'; // Indigo
            default: return '#6B7280';
        }
    };

    if (!booking) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 uppercase">
            <p className="text-gray-400 font-black tracking-widest text-xs mb-4">No Booking Selected</p>
            <button onClick={() => navigate(-1)} className="text-indigo-600 font-black text-sm">Return</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-10">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-4 py-4 border-b border-gray-100 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} className="text-[#1C1C1E]" />
                </button>
                <h1 className="text-lg font-black text-[#1C1C1E] tracking-tight">Appointment Card</h1>
            </header>

            <main className="max-w-[450px] mx-auto p-4 space-y-6">

                {/* STATUS BAR */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor(booking.status) }} />
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: getStatusColor(booking.status) }}>
                            {booking.status}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">BOOKED ON {format(new Date(booking.createdAt || Date.now()), 'dd MMM')}</span>
                </div>

                {/* COUNTDOWN CARD */}
                <div className="bg-indigo-600 rounded-[32px] p-6 shadow-xl shadow-indigo-100 relative overflow-hidden">
                    <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                            <Clock className="text-white" size={24} />
                        </div>
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Time Remaining</p>
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            {formatTimeLeft(timeLeft)}
                        </h2>
                    </div>
                </div>

                {/* SUMMARY CARD */}
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Booking Summary</h3>
                        <div className="px-3 py-1 bg-green-50 rounded-full flex items-center gap-1.5 border border-green-100">
                            <ShieldCheck size={12} className="text-green-600" />
                            <span className="text-[10px] font-bold text-green-600 uppercase">Confirmed</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                    <Star size={20} className="text-amber-400" fill="currentColor" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Service</p>
                                    <p className="text-sm font-black text-gray-900">{booking.service || booking.services?.map(s => s.name).join(', ')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                    <Calendar size={20} className="text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Schedule</p>
                                    <p className="text-sm font-black text-gray-900">
                                        {format(new Date(booking.date), 'EEE, dd MMM')} at {booking.time}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DollarSign size={18} className="text-green-600" />
                            <span className="text-lg font-black text-gray-900">Total Fare</span>
                        </div>
                        <span className="text-2xl font-black text-indigo-600">₹{booking.fare?.toFixed(2) || booking.totalPrice?.toFixed(2)}</span>
                    </div>

                    {/* OTP BOX */}
                    {booking.otp && (
                        <div className="mt-4 bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <Lock size={20} className="text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Start Code</p>
                                    <p className="text-xs text-amber-500 font-bold">Provide to barber to start</p>
                                </div>
                            </div>
                            <span className="text-3xl font-black text-amber-600 tabular-nums">{booking.otp}</span>
                        </div>
                    )}
                </div>

                {/* BARBER & SHOP INFO */}
                {booking.barberId && (
                    <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Shop & Contact</h3>
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                <User size={16} className="text-indigo-600" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div>
                                <h4 className="text-lg font-black text-gray-900 leading-tight">{booking.barberId.shopName || "Salon"}</h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <MapPin size={14} className="text-gray-400" />
                                    <p className="text-xs font-bold text-gray-500 truncate max-w-[200px]">{booking.barberId.shopAddress || "Near City Center"}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.barberId.shopAddress || booking.barberId.shopName)}`, '_blank')}
                                className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-indigo-600 shadow-sm active:scale-90 transition-transform"
                            >
                                <ExternalLink size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => window.location.href = `tel:${booking.barberId.shopPhone || booking.barberId.phone}`}
                                className="flex items-center justify-center gap-2 py-4 bg-green-50 rounded-2xl text-green-600 font-black text-sm border border-green-100 active:scale-95 transition-transform"
                            >
                                <Phone size={18} /> CALL SHOP
                            </button>
                            <button
                                onClick={() => navigate(`/chat/${booking.barberId._id}`, { state: { recipientName: booking.barberId.name } })}
                                className="flex items-center justify-center gap-2 py-4 bg-indigo-50 rounded-2xl text-indigo-600 font-black text-sm border border-indigo-100 active:scale-95 transition-transform"
                            >
                                <MessageSquare size={18} /> CHAT NOW
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default BookingDetailScreen;
