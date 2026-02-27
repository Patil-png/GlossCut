import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import {
    Bell, User, Wallet, Scissors, Clock, ArrowRight, TrendingUp,
    CreditCard, Calendar, ShieldCheck, Phone, MessageCircle, X,
    TriangleAlert, Loader2, MapPin
} from 'lucide-react'; // Replaced specific icons with Lucide equivalents
import { motion, AnimatePresence } from 'framer-motion';

// --- HELPER COMPONENTS ---

const Barcode = () => (
    <div className="flex h-[18px] items-center space-x-[1px] opacity-80">
        {[4, 2, 6, 2, 1, 3, 5, 2, 4, 1, 3, 5, 2, 4, 2, 6, 2, 4, 1, 2].map((w, i) => (
            <div key={i} style={{ width: w }} className="h-full bg-[#2C2C2C]" />
        ))}
    </div>
);

const DashedLine = () => (
    <div className="flex-1 flex justify-between mx-5 opacity-40">
        {[...Array(22)].map((_, i) => (
            <div key={i} className="w-2 h-[1.5px] bg-[#C0B088]" />
        ))}
    </div>
);

const ActivityItem = ({ icon: Icon, title, subtitle, isLast }) => (
    <div className={`flex items-center p-3.5 ${!isLast ? 'border-b border-gray-100' : ''} active:bg-gray-50 transition-colors cursor-pointer`}>
        <div className="w-9 h-9 rounded-[10px] bg-[#F5F7FA] flex items-center justify-center mr-3.5">
            <Icon size={18} className="text-[#8B4513]" strokeWidth={2} />
        </div>
        <div className="flex-1">
            <h4 className="text-[13px] font-semibold text-gray-900 mb-0.5">{title}</h4>
            <p className="text-[11px] text-gray-500">{subtitle}</p>
        </div>
        <ArrowRight size={16} className="text-gray-300" />
    </div>
);

const SectionHeader = ({ title }) => (
    <div className="mb-3 mt-2.5 px-1.5">
        <h3 className="text-[12px] font-extrabold text-[#999] tracking-widest uppercase">{title}</h3>
    </div>
);

const StatCard = ({ icon: Icon, label, value, color, bg, onClick }) => (
    <div
        onClick={onClick}
        className="flex-1 bg-white p-4 rounded-2xl flex flex-col items-center shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
    >
        <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center mb-2.5 ${bg}`}>
            <Icon size={20} className={color} />
        </div>
        <span className="text-[11px] font-semibold text-gray-400 mb-1">{label}</span>
        <span className="text-[16px] font-extrabold text-gray-900">{value}</span>
    </div>
);

// --- MODAL COMPONENT ---

const ContactModal = ({ visible, onClose, customer }) => {
    if (!visible) return null;

    const handleCall = () => {
        if (customer?.phone) {
            const cleanPhone = customer.phone.replace(/\D/g, "");
            window.location.href = `tel:${cleanPhone}`;
        }
        onClose();
    };

    const handleWhatsApp = () => {
        if (customer?.phone) {
            let cleanPhone = customer.phone.replace(/\D/g, "");
            // Prepend 91 if it's a 10-digit number (common for Indian context)
            if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
        }
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-10"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-extrabold text-gray-900">Contact Customer</h2>
                        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <p className="text-[15px] text-gray-600 mb-6">
                        How would you like to reach <span className="font-bold text-gray-900">{customer?.name}</span>?
                    </p>

                    <div className="space-y-3 mb-6">
                        <button onClick={handleCall} className="w-full flex items-center justify-center py-4 rounded-2xl bg-[#007AFF] text-white font-bold shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform">
                            <Phone size={24} className="mr-3" />
                            Phone Call
                        </button>
                        <button onClick={handleWhatsApp} className="w-full flex items-center justify-center py-4 rounded-2xl bg-[#25D366] text-white font-bold shadow-lg shadow-green-500/30 active:scale-[0.98] transition-transform">
                            <MessageCircle size={24} className="mr-3" />
                            WhatsApp
                        </button>
                    </div>

                    <button onClick={onClose} className="w-full py-4 rounded-2xl bg-gray-100 text-[#FF3B30] font-bold hover:bg-gray-200 transition-colors">
                        Cancel
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// --- MAIN COMPONENT ---

const HomeScreen = () => {
    const navigate = useNavigate();
    const { user, isMainOwner } = useAuth(); // removed updateAvailability from useAuth based on previous context, will implement local or api call

    // State
    const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [pendingMediaAds, setPendingMediaAds] = useState([]);
    const [todayEarnings, setTodayEarnings] = useState(0);
    const [barberCardImage, setBarberCardImage] = useState(null);
    const [nextCustomer, setNextCustomer] = useState(null);
    const [queueLength, setQueueLength] = useState(0);
    const [currentToken, setCurrentToken] = useState(1);
    const [dailyStats, setDailyStats] = useState({ served: 0, left: 0 });
    const [showContactModal, setShowContactModal] = useState(false);

    // Update availability logic - replicating behavior
    const handleAvailabilityChange = async () => {
        try {
            const newStatus = !isAvailable;
            // Optimistic update
            setIsAvailable(newStatus);

            // Backend update
            await api.put('/api/auth/profile', { isAvailable: newStatus });
            // Ideally AuthContext should update user, but for now we follow the screen's logic
        } catch (error) {
            console.error("Failed to update availability", error);
            setIsAvailable(!isAvailable); // Revert on fail
        }
    };

    // Data Fetching
    const fetchQueueData = async () => {
        if (!user?._id) return;
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const res = await api.get(`/api/booking/barber-appointments/${user._id}?date=${today}`);
            let appointments = Array.isArray(res.data)
                ? res.data.filter(b => ['pending', 'confirmed', 'started', 'completed'].includes(b.status) && b.paymentStatus !== "failed")
                : [];

            const completed = appointments.filter(a => a.status === 'completed');

            // Logic sync with QueueManagementScreen
            const isExpressApp = (app) => (
                (app.appointmentType && app.appointmentType.toLowerCase().includes("express")) ||
                (app.isPromoted === true)
            );

            const active = appointments.filter(a => a.status === 'confirmed' || a.status === 'started');

            // Advanced Sort Logic (Sync with QueueManagementScreen)
            active.sort((a, b) => {
                if (a.status === 'started' && b.status !== 'started') return -1;
                if (b.status === 'started' && a.status !== 'started') return 1;

                const aIsExpress = isExpressApp(a) && (a.tempDelayMinutes || 0) < 500;
                const bIsExpress = isExpressApp(b) && (b.tempDelayMinutes || 0) < 500;

                if (aIsExpress && !bIsExpress) return -1;
                if (bIsExpress && !aIsExpress) return 1;

                const getScore = (app) => {
                    if (!app.time) return 9999;
                    const [h, m] = app.time.split(':').map(Number);
                    let val = (h * 60 + m) + (app.tempDelayMinutes || 0);
                    if (!isExpressApp(app)) val += 2000;
                    return val;
                };

                const aScore = getScore(a);
                const bScore = getScore(b);

                if (aScore !== bScore) return aScore - bScore;
                return new Date(a.createdAt) - new Date(b.createdAt);
            });

            setQueueLength(appointments.length);
            setCurrentToken(Math.min(completed.length + 1, appointments.length + 1)); // Logic tweak: if 0 appts, token 1. 
            // Corrected logic from RN: Math.min(completedSection.length + 1, appointments.length) -- waiting to verification, mostly if all completed, show last+1 or cap? 
            // RN code: setCurrentToken(Math.min(completedSection.length + 1, appointments.length));
            // Let's stick to RN exactly:
            setCurrentToken(Math.min(completed.length + 1, appointments.length > 0 ? appointments.length : 1));


            if (active.length > 0) {
                const next = active[0];
                setNextCustomer({
                    name: next.isOfflineBooking ? next.customerName : next.userId?.name || 'Unknown',
                    service: next.services?.map(s => s.name).join(", ") || 'No service',
                    status: next.status,
                    phone: next.isOfflineBooking ? next.customerPhone : next.userId?.phone,
                    id: next._id
                });
            } else {
                setNextCustomer(null);
            }

            setDailyStats(prev => ({ ...prev, served: completed.length, left: active.length }));

        } catch (err) {
            console.error(err);
        }
    };

    const fetchDailyEarnings = async () => {
        try {
            const res = await api.get('/api/earnings?filter=day&summaryOnly=true');
            setTodayEarnings(res.data?.totalEarnings || 0);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/notifications');
            const unread = res.data.filter(n => !n.read).length;
            setNotificationCount(unread);
        } catch (err) { console.error(err); }
    };

    const checkPendingAds = async () => {
        if (!user?._id) return;
        try {
            const res = await api.get(`/api/ads/barber/${user._id}`);
            const incomplete = res.data.filter(ad => ad.status === 'paid' && !ad.mediaUrl);
            setPendingMediaAds(incomplete);
        } catch (err) { console.error(err); }
    };

    const fetchBarberCard = async () => {
        try {
            const res = await api.get('/api/barber-card/my-card');
            if (res.data?.image) setBarberCardImage(res.data.image);
        } catch (err) { }
    };

    const fetchAllData = useCallback(() => {
        if (user) {
            fetchQueueData();
            fetchDailyEarnings();
            fetchNotifications();
            checkPendingAds();
            fetchBarberCard();
        }
    }, [user]);

    useEffect(() => {
        fetchAllData();
        const interval = setInterval(fetchAllData, 10000); // 10s Poll
        return () => clearInterval(interval);
    }, [fetchAllData]);

    // Handle Call Next
    const handleCallNext = () => {
        if (nextCustomer) {
            setShowContactModal(true);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F5F7] pb-24">
            <ContactModal visible={showContactModal} onClose={() => setShowContactModal(false)} customer={nextCustomer} />

            {/* --- HEADER --- */}
            <div className="bg-white rounded-b-[30px] shadow-sm shadow-black/5 z-20 sticky top-0">
                <div className="px-6 header-safe-pt pb-4 flex items-center justify-between">
                    <div onClick={() => navigate('/profile')} className="flex items-center cursor-pointer">
                        <div className="relative mr-3.5 shadow-md rounded-[16px]">
                            <img
                                src={barberCardImage || "/SetKarr.png"}
                                alt="Profile"
                                className="w-[50px] h-[50px] rounded-[16px] bg-white border-2 border-white object-cover"
                            />
                            {notificationCount > 0 && (
                                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#FF3B30] rounded-full border-2 border-white" />
                            )}
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">Welcome Back</span>
                            <h1 className="text-[22px] font-black text-[#1C1C1E] tracking-tight">{user?.name || "Barber"}</h1>
                        </div>
                    </div>

                    <button onClick={() => navigate('/notifications')} className="relative p-2">
                        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/5 hover:bg-gray-50 transition-colors border border-gray-100">
                            <Bell size={20} className="text-gray-700" />
                            {notificationCount > 0 && (
                                <div className="absolute top-0 right-0 bg-[#FF3B30] text-white text-[10px] font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center border-2 border-white">
                                    {notificationCount > 99 ? '99+' : notificationCount}
                                </div>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            <div className="px-5 pt-4 max-w-[450px] mx-auto">

                {/* --- WARNING CARD --- */}
                {pendingMediaAds.length > 0 && (
                    <div onClick={() => navigate('/boost-visibility')} className="bg-[#FFF9E6] border border-[#FFB800] rounded-2xl p-4 mb-5 flex items-center cursor-pointer shadow-sm">
                        <div className="w-11 h-11 rounded-full bg-[#FFB800]/10 flex items-center justify-center mr-3">
                            <TriangleAlert size={24} className="text-[#FFB800]" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[16px] font-bold text-[#856404] mb-0.5">Action Required</h4>
                            <p className="text-[13px] text-[#856404] leading-tight">Finish setting up your Ad campaign. Media upload is missing.</p>
                        </div>
                        <ArrowRight size={20} className="text-[#FFB800]" />
                    </div>
                )}

                <SectionHeader title="LIVE QUEUE TOKEN" />

                {/* --- FLOATING TICKET --- */}
                <div className="mb-8 relative z-10">
                    <motion.div
                        animate={{ y: [0, -14, 0] }}
                        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
                        className="relative"
                    >
                        <motion.div
                            className="bg-[#FFFDE7] rounded-2xl overflow-hidden shadow-2xl shadow-black/10 origin-center active:scale-[0.97] transition-transform duration-100 ease-out"
                        >
                            {/* Yellow Header */}
                            <div className="bg-[#FFD60A] py-3 px-5 border-b border-black/5 flex justify-between items-center">
                                <span className="text-[12px] font-extrabold text-[#1C1C1E] opacity-80 tracking-wide">CURRENT TOKEN</span>
                                <div className="bg-[#111] px-2 py-1 rounded-md flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-white' : 'bg-gray-500'}`} />
                                    <span className="text-white text-[10px] font-extrabold">{isAvailable ? "LIVE" : "OFFLINE"}</span>
                                </div>
                            </div>

                            {/* Ticket Body Top */}
                            <div className="p-6 pb-5 flex flex-col items-center cursor-pointer" onClick={() => navigate('/queue')}>
                                <span className="text-[80px] font-bold text-[#2C2C2C] leading-none tracking-tighter mix-blend-multiply font-sans-condensed">{currentToken}</span>
                                <div className="w-full border-t border-black/5 pt-3 mt-1 text-center">
                                    <p className="text-[13px] text-[#2C2C2C]">
                                        Total Queue: <span className="font-bold">{queueLength} People</span>
                                    </p>
                                </div>
                            </div>

                            {/* Perforation */}
                            <div className="relative h-[1px] flex items-center justify-center my-0">
                                <div className="absolute -left-3 w-6 h-6 rounded-full bg-[#F4F5F7] border border-black/5" />
                                <DashedLine />
                                <div className="absolute -right-3 w-6 h-6 rounded-full bg-[#F4F5F7] border border-black/5" />
                            </div>

                            {/* Ticket Body Bottom */}
                            <div className="p-6 pt-5">
                                {/* Next Customer Box */}
                                <div className="bg-white rounded-xl p-3 mb-5 border border-[#E3E3E3] shadow-sm flex items-center relative">
                                    <div className="w-9 h-9 rounded-full bg-[#2C2C2C] flex items-center justify-center mr-3 flex-shrink-0">
                                        <User size={18} className="text-white" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] font-extrabold text-[#2C2C2C] uppercase tracking-widest mb-0.5">UP NEXT</p>
                                        <h3 className="text-[17px] font-extrabold text-[#2C2C2C] truncate">{nextCustomer?.name || "No active customers"}</h3>
                                        {nextCustomer?.service && (
                                            <div className="mt-1.5 inline-block px-2.5 py-1 bg-[#F4F4F4] rounded-lg">
                                                <span className="text-[11px] font-bold text-[#2C2C2C]">{nextCustomer.service}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 mb-1">
                                    <button
                                        onClick={() => navigate('/walk-in')}
                                        className="flex-1 bg-white border-[1.5px] border-[#DDD] py-3.5 rounded-xl font-bold text-[#333] text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        + Walk-in
                                    </button>
                                    <button
                                        onClick={handleCallNext}
                                        disabled={!nextCustomer}
                                        className={`flex-[1.2] flex items-center justify-center gap-1 bg-[#FFC107] shadow-md shadow-yellow-500/30 py-3.5 rounded-xl font-bold text-black text-sm transition-transform active:scale-95 ${!nextCustomer ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#e0a800]'}`}
                                    >
                                        {nextCustomer ? `Call Next #${currentToken + 1}` : "Empty Line"}
                                        {nextCustomer && <ArrowRight size={18} className="ml-1" />}
                                    </button>
                                </div>

                                {/* Footer Barcode */}
                                <div className="flex flex-col items-center mt-5 opacity-50 space-y-1">
                                    <Barcode />
                                    <span className="text-[9px] font-bold text-[#2C2C2C] tracking-widest">TICKET #882-99</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Shadow Element */}
                        <motion.div
                            animate={{ opacity: [0.15, 0.4, 0.15], scaleX: [0.9, 1, 0.9] }}
                            transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
                            className="absolute -bottom-4 left-[10%] w-[80%] h-4 bg-black/30 blur-lg rounded-full -z-10"
                        />
                    </motion.div>
                </div>

                {/* --- STATS GRID --- */}
                <div className="flex gap-3 mb-8">
                    <StatCard
                        icon={Wallet}
                        label="Earnings"
                        value={`₹${todayEarnings ? Number(todayEarnings).toFixed(1) : "0.0"}`}
                        color="text-[#007AFF]"
                        bg="bg-[#E3F2FD]"
                        onClick={() => navigate('/earnings')}
                    />
                    <StatCard
                        icon={Scissors}
                        label="Served"
                        value={dailyStats.served}
                        color="text-[#FF9800]"
                        bg="bg-[#FFF3E0]"
                    />
                    <StatCard
                        icon={User}
                        label="Left"
                        value={dailyStats.left}
                        color="text-[#F44336]"
                        bg="bg-[#FFEBEE]"
                    />
                </div>

                {/* --- SHOP STATUS --- */}
                <SectionHeader title="SHOP STATUS" />
                <div
                    onClick={handleAvailabilityChange}
                    className="bg-white rounded-2xl p-5 mb-8 shadow-sm flex items-center justify-between cursor-pointer active:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center">
                        <div className="relative mr-4">
                            <div className={`w-4 h-4 rounded-full shadow-md ${isAvailable ? 'bg-[#34C759] shadow-green-500/50' : 'bg-[#C7C7CC]'} transition-colors duration-300`} />
                            {isAvailable && (
                                <span className="absolute inset-0 rounded-full bg-[#34C759] animate-ping opacity-75"></span>
                            )}
                        </div>
                        <div>
                            <h4 className="text-[16px] font-bold text-[#1C1C1E]">{isAvailable ? "I am Online" : "I am Offline"}</h4>
                            <p className="text-[13px] font-medium text-[#8E8E93]">{isAvailable ? "Ready to serve customers" : "Tap to go online"}</p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${isAvailable ? 'bg-[#FFE8E8]' : 'bg-[#E8F5E9]'}`}>
                        <span className={`text-[12px] font-bold ${isAvailable ? 'text-[#D63031]' : 'text-[#00B894]'}`}>
                            {isAvailable ? "Go Offline" : "Go Online"}
                        </span>
                    </div>
                </div>


                {/* --- RECENT ACTIVITY --- */}
                <SectionHeader title="RECENT ACTIVITY" />
                <div className="bg-white rounded-2xl p-1.5 shadow-sm mb-8">
                    {isMainOwner && (
                        <>
                            <div onClick={() => navigate('/boost-visibility')}>
                                <ActivityItem
                                    icon={ShieldCheck}
                                    title="Boost Visibility"
                                    subtitle={user?.subscriptionStatus === 'active' ? "Status: Active • Manage Visibility" : "Status: Inactive • Tap to Boost"}
                                />
                            </div>
                            <div onClick={() => navigate('/listed-card')}>
                                <ActivityItem
                                    icon={CreditCard}
                                    title="Listed Card"
                                    subtitle="Manage shop card & team"
                                />
                            </div>
                        </>
                    )}
                    <div onClick={() => navigate('/queue')}>
                        <ActivityItem
                            icon={Clock}
                            title="Queue Management"
                            subtitle={`Active: ${dailyStats.left} waiting • Done: ${dailyStats.served} served`}
                        />
                    </div>
                    <div onClick={() => navigate('/create-barber-card')}>
                        <ActivityItem
                            icon={CreditCard}
                            title="Create Barber-card"
                            subtitle="Set up your professional profile"
                        />
                    </div>
                    <div onClick={() => navigate('/earnings')}>
                        <ActivityItem
                            icon={TrendingUp}
                            title="Payment Received"
                            subtitle={`₹${todayEarnings.toLocaleString()} • UPI`}
                        />
                    </div>
                    <div onClick={() => navigate('/appointments')}>
                        <ActivityItem
                            icon={Calendar}
                            title="Booking Confirmed"
                            subtitle="Manage your appointments"
                            isLast={true}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HomeScreen;
