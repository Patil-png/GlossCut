import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import {
    ArrowLeft,
    WifiOff,
    CheckCircle,
    Calendar as CalendarIcon,
    Scissors,
    Clock,
    User,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TOAST COMPONENT ---
const TopToast = ({ message, type, visible, onHide }) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onHide();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible, onHide]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 20, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
                >
                    <div className={`flex items-center px-4 py-3 rounded-full shadow-lg min-w-[300px] max-w-sm ${contentStyle(type)}`}>
                        {iconFor(type)}
                        <span className="ml-2 font-semibold text-sm text-white">{message}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const contentStyle = (type) => {
    switch (type) {
        case 'error': return 'bg-[#FF4757]';
        case 'success': return 'bg-[#2ED573]';
        default: return 'bg-[#3742FA]';
    }
};

const iconFor = (type) => {
    switch (type) {
        case 'error': return <WifiOff size={18} className="text-white" />;
        case 'success': return <CheckCircle size={18} className="text-white" />;
        default: return <AlertCircle size={18} className="text-white" />;
    }
};

// --- SKELETON LOADER ---
const SkeletonItem = () => (
    <div className="bg-white p-4 rounded-3xl mb-4 flex items-center shadow-sm border border-gray-100 animate-pulse">
        <div className="w-[50px] h-[50px] rounded-xl bg-gray-200" />
        <div className="ml-4 flex-1">
            <div className="w-3/5 h-3.5 bg-gray-200 rounded mb-2" />
            <div className="w-2/5 h-3.5 bg-gray-200 rounded" />
        </div>
    </div>
);

// --- APPOINTMENT CARD ---
const AppointmentCard = ({ item, index }) => {
    const navigate = useNavigate();
    const dateObj = new Date(item.date);

    const getStatusConfig = (status, paymentStatus) => {
        if (paymentStatus === "pending")
            return { label: "Unpaid", color: "#FF6B6B", bg: "#FFECEC" };
        switch (status) {
            case "pending":
                return { label: "Approving", color: "#FFA502", bg: "#FFF4D9" };
            case "confirmed":
                return { label: "Confirmed", color: "#2ED573", bg: "#E3FCEF" };
            case "started":
                return { label: "Active", color: "#3742FA", bg: "#EBEBFF" };
            case "completed":
                return { label: "Done", color: "#57606F", bg: "#F1F2F6" };
            default:
                return {
                    label: status,
                    color: "#A4B0BE",
                    bg: "#F1F2F6",
                };
        }
    };

    const statusConfig = getStatusConfig(item.status, item.paymentStatus);

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            onClick={() => navigate(`/appointments/${item._id}`, { state: { appointment: item } })}
            className="bg-white rounded-3xl p-4 mb-4 shadow-lg border border-gray-100 flex items-stretch overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
        >
            {/* LEFT: Date - Fixed Width & No Shrink */}
            <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl w-[68px] py-3 flex flex-col items-center justify-center mr-4 flex-shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {format(dateObj, "MMM")}
                </span>
                <span className="text-2xl font-extrabold text-gray-900 mb-1.5">
                    {format(dateObj, "dd")}
                </span>
                <div className="bg-[#007AFF] px-2 py-0.5 rounded-md">
                    <span className="text-[10px] font-bold text-white whitespace-nowrap">
                        {item.time}
                    </span>
                </div>
            </div>

            {/* RIGHT: Content - Takes remaining space */}
            <div className="flex-1 flex flex-col justify-between min-w-0">

                {/* Top Row: User Info & Price */}
                <div className="flex justify-between items-start">
                    {/* User Info - Truncates */}
                    <div className="flex items-center flex-1 mr-3 min-w-0">
                        {item.userId?.profilePicture ? (
                            <img
                                src={item.userId.profilePicture}
                                alt="User"
                                className="w-9 h-9 rounded-xl mr-2.5 object-cover flex-shrink-0"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-xl mr-2.5 bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] font-bold flex-shrink-0">
                                {item.userId?.name?.charAt(0) || "U"}
                            </div>
                        )}
                        <div className="overflow-hidden min-w-0">
                            <h3 className="text-[16px] font-bold text-gray-900 truncate">
                                {item.userId?.name || "Guest User"}
                            </h3>
                            <p className="text-[12px] text-gray-500 font-medium truncate">
                                {item.services.length} Service{item.services.length > 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    {/* Price - Fixed/No Shrink */}
                    <div className="flex items-start flex-shrink-0">
                        <span className="text-[13px] font-bold text-[#007AFF] mt-[2px] mr-[1px]">₹</span>
                        <span className="text-[18px] font-extrabold text-gray-900">{Math.floor(item.totalPrice)}</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-[1px] w-full border-t border-dashed border-gray-200 my-3" />

                {/* Bottom Row: Services & Status */}
                <div className="flex justify-between items-center">
                    {/* Services - Truncates */}
                    <div className="flex items-center flex-1 mr-3 min-w-0 overflow-hidden">
                        <Scissors size={12} className="text-gray-400 mr-1.5 flex-shrink-0" />
                        <span className="text-[12px] font-medium text-gray-500 truncate block">
                            {item.services.map((s) => s.name).join(", ")}
                        </span>
                    </div>

                    {/* Status Badge - Fixed/No Shrink */}
                    <div className="flex items-center px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: statusConfig.bg }}>
                        <div className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: statusConfig.color }} />
                        <span className="text-[11px] font-bold" style={{ color: statusConfig.color }}>
                            {statusConfig.label}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- MAIN SCREEN ---
const AppointmentsScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [refreshing, setRefreshing] = useState(false);

    const [toast, setToast] = useState({
        visible: false,
        message: "",
        type: "info",
    });

    const filterOptions = [
        { key: "pending", label: "Pending" },
        { key: "confirmed", label: "Upcoming" },
        { key: "completed", label: "History" },
    ];

    const showToast = (message, type = "error") => {
        setToast({ visible: true, message, type });
    };

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            // Matching Native App Endpoint
            const res = await api.get('/api/booking/barber');
            if (res.status === 200) {
                // Filter out cancelled if needed, similar to native
                setAppointments(res.data.filter((a) => a.status !== "cancelled"));
            }
        } catch (err) {
            let msg = "Something went wrong.";
            if (err.message === "Network Error" || !err.response) {
                msg = "Internet connection appears to be offline.";
            } else if (err.response?.status === 401) {
                msg = "Session expired. Please login again.";
            } else if (err.response?.status >= 500) {
                msg = "Server is currently down. Try again later.";
            }
            showToast(msg, "error");
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchAppointments();
        }
    }, [user]);

    const activeAppointments = appointments.filter((a) => {
        if (filter === 'confirmed') return a.status === 'confirmed' || a.status === 'started';
        return a.status === filter;
    });

    return (
        <div className="min-h-screen bg-[#F4F5F7] flex justify-center">
            <div className="w-full max-w-[450px] bg-[#F4F5F7] min-h-screen shadow-2xl relative pb-24">
                <TopToast
                    {...toast}
                    onHide={() => setToast(prev => ({ ...prev, visible: false }))}
                />

                {/* HEADER */}
                <div className="bg-white sticky top-0 z-30 border-b border-gray-100">
                    <div className="px-5 pt-6 pb-4 flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-[42px] h-[42px] rounded-full bg-[#F4F5F7] flex items-center justify-center border border-gray-200 active:scale-95 transition-transform"
                        >
                            <ArrowLeft size={20} className="text-gray-900" />
                        </button>
                        <h1 className="text-[20px] font-extrabold text-[#1C1C1E] tracking-tight">
                            My Bookings
                        </h1>
                        <div className="w-[42px]" /> {/* Spacer for centering */}
                    </div>

                    {/* FILTER TABS */}
                    <div className="px-5 pb-5 mt-2">
                        <div className="bg-[#F4F5F7] p-1 rounded-full flex relative">
                            {/* Animated Background Pill */}
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
                                    className={`flex-1 relative z-10 py-2.5 text-[13px] font-bold transition-colors duration-200 ${filter === opt.key ? "text-[#1C1C1E]" : "text-[#8E8E93]"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="px-5 pt-6">
                    {loading ? (
                        <>
                            <SkeletonItem />
                            <SkeletonItem />
                            <SkeletonItem />
                        </>
                    ) : activeAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-60">
                            <div className="w-20 h-20 rounded-full bg-[#E3E3E3] flex items-center justify-center mb-4">
                                <CalendarIcon size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">No {filter} bookings</h3>
                            <p className="text-sm text-gray-500 text-center max-w-[200px]">
                                Your appointment list is clean. New bookings will appear here instantly.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence mode='wait'>
                                {activeAppointments.map((app, index) => (
                                    <AppointmentCard key={app._id} item={app} index={index} />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentsScreen;
