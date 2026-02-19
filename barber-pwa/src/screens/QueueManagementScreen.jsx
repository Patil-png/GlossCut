import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Clock, CheckCircle, XCircle, RefreshCcw, CreditCard,
    Calendar, ArrowRightCircle, Plus, Phone, Scissors, History,
    AlertTriangle, WifiOff, SkipForward, HelpCircle, Info, User, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

// --- HELPER COMPONENTS ---

const SkeletonItem = () => (
    <div className="bg-white rounded-[20px] p-4 mb-4 shadow-sm h-[180px] animate-pulse">
        <div className="flex items-center mb-5">
            <div className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
            <div className="flex-1">
                <div className="h-3.5 bg-gray-200 rounded w-3/5 mb-1.5" />
                <div className="h-2.5 bg-gray-200 rounded w-2/5" />
            </div>
            <div className="w-16 h-5 bg-gray-200 rounded-md" />
        </div>
        <div className="flex justify-between mt-4">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/5" />
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
            <div className="w-20 h-9 bg-gray-200 rounded-full" />
            <div className="w-24 h-9 bg-gray-200 rounded-full" />
        </div>
    </div>
);

const CustomAlert = ({ visible, title, message, actions, type = 'info', onClose }) => {
    if (!visible) return null;

    let Icon = Info;
    let iconColor = "#2196F3";
    let bgIconColor = "#E3F2FD";

    if (type === 'success') {
        Icon = CheckCircle;
        iconColor = "#4CAF50";
        bgIconColor = "#E8F5E9";
    } else if (type === 'destructive' || type === 'error') {
        Icon = AlertTriangle;
        iconColor = "#F44336";
        bgIconColor = "#FFEBEE";
    } else if (type === 'warning') {
        Icon = AlertTriangle;
        iconColor = "#FF9800";
        bgIconColor = "#FFF3E0";
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white w-full max-w-[340px] rounded-[28px] p-8 flex flex-col items-center shadow-2xl"
            >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: bgIconColor }}>
                    <Icon size={32} color={iconColor} strokeWidth={2.5} />
                </div>
                <h3 className="text-[22px] font-extrabold text-[#1a1a1a] mb-2.5 text-center tracking-tight">{title}</h3>
                <p className="text-base text-gray-500 text-center mb-8 leading-6 px-2">{message}</p>

                <div className="flex gap-3 w-full">
                    {actions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={action.onPress}
                            className={`flex-1 py-4 rounded-2xl font-bold text-base transition-colors ${action.style === 'cancel'
                                ? 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                : (action.style === 'destructive'
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : (type === 'success' ? 'bg-[#4CAF50] text-white' : 'bg-[#2196F3] text-white')
                                )
                                }`}
                        >
                            {action.text}
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

const OtpModal = ({ visible, onClose, onVerify, loading }) => {
    const [otp, setOtp] = useState('');

    useEffect(() => {
        if (visible) setOtp('');
    }, [visible]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white w-full max-w-[320px] rounded-[28px] p-6 flex flex-col items-center shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <XCircle size={24} />
                </button>

                <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                    <Lock size={24} className="text-[#6A1B9A]" />
                </div>

                <h3 className="text-xl font-extrabold text-[#1C1C1E] mb-2 text-center">Verify Start</h3>
                <p className="text-sm text-gray-500 text-center mb-6">Ask customer for the OTP sent to their mobile.</p>

                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest mb-6 focus:outline-none focus:border-[#6A1B9A] transition-colors"
                />

                <button
                    onClick={() => onVerify(otp)}
                    disabled={loading || otp.length < 4}
                    className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${loading || otp.length < 4 ? 'bg-gray-300 shadow-none' : 'bg-[#6A1B9A] shadow-purple-200'}`}
                >
                    {loading ? 'Verifying...' : 'Verify & Start'}
                </button>
            </motion.div>
        </div>
    );
};

// --- APPOINTMENT CARD ---
const AppointmentCard = ({
    appointment, isAnyAppointmentStarted, blockingId,
    onPressCard, onSkip, onUpdateStatus, onCollectPayment,
    onStart, onPromote, offlineExpressCount, MAX_OFFLINE_EXPRESS
}) => {
    const { theme } = useTheme();

    const isConfirmed = appointment.status === "confirmed";
    const isStarted = appointment.status === "started";
    const isPending = appointment.status === "pending";
    const isOfflineBooking = appointment.isOfflineBooking;
    const isPaymentDone = isOfflineBooking || appointment.paymentStatus !== "pending";
    const isReady = isConfirmed && isPaymentDone;
    const isChairBusy = isAnyAppointmentStarted;
    const isMyTurn = appointment._id === blockingId;
    const skipCount = appointment.skipCount || 0;
    const showDangerCancel = isConfirmed && !isStarted && skipCount >= 2;

    const isExpress = (appointment.appointmentType && appointment.appointmentType.toLowerCase().includes("express")) || appointment.isPromoted;
    const canPromote = !isExpress && isConfirmed && offlineExpressCount < MAX_OFFLINE_EXPRESS;

    const getStatusTheme = () => {
        if (isStarted) return { bg: "#E0F2F1", text: "#00695C", border: "#00BFA5" };
        if (!isPaymentDone && isConfirmed) return { bg: "#FFF3E0", text: "#E65100", border: "#FF9800" };
        if (isPending) return { bg: "#E3F2FD", text: "#1565C0", border: "#2979FF" };
        if (isConfirmed) return { bg: "#F3E5F5", text: "#6A1B9A", border: "#6A1B9A" }; // Using primary purple
        return { bg: "#F5F5F5", text: "#616161", border: "#BDBDBD" };
    };

    const styleTheme = getStatusTheme();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 relative"
        >
            <div
                onClick={() => onPressCard(appointment)}
                className="bg-white rounded-[18px] overflow-hidden shadow-sm shadow-black/5 relative cursor-pointer active:scale-[0.98] transition-transform"
            >
                {/* Accent Strip */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: styleTheme.border }} />

                <div className="p-3 pl-5">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                            <div className="flex items-center">
                                <h3 className="text-[15px] font-extrabold text-[#000] truncate mr-2">
                                    {isOfflineBooking ? appointment.customerName : (appointment.userId?.name || "Unknown User")}
                                </h3>
                                {isExpress && (
                                    <span className="bg-[#FFD700] px-1.5 py-0.5 rounded text-[9px] font-extrabold text-black">EXPRESS</span>
                                )}
                            </div>
                            {isOfflineBooking && (
                                <div className="flex items-center mt-0.5 text-gray-500">
                                    <Phone size={9} className="mr-1" />
                                    <span className="text-[10px] font-medium">Walk-in Customer</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center">
                            {/* Info Icon */}
                            <button
                                className="mr-2 text-gray-400 hover:text-gray-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    alert(`Queue Info: ${isExpress ? 'Express Priority' : 'Standard Queue'}`);
                                }}
                            >
                                <HelpCircle size={16} />
                            </button>

                            <div className="px-2.5 py-1 rounded-md" style={{ backgroundColor: styleTheme.bg }}>
                                <span className="text-[9px] font-extrabold tracking-wider uppercase" style={{ color: styleTheme.text }}>
                                    {!isPaymentDone && isConfirmed ? "UNPAID" : appointment.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="flex items-center mb-2.5">
                        <div className="flex items-center">
                            <Clock size={13} className="text-gray-400 mr-1.5" />
                            <span className="text-[12px] font-semibold text-[#000]">
                                {appointment.time}
                                {(appointment.tempDelayMinutes || 0) > 0 && (
                                    <span className="text-red-600 ml-1 font-bold">(+{appointment.tempDelayMinutes}m)</span>
                                )}
                            </span>
                        </div>
                        <div className="w-px h-3 bg-gray-200 mx-3" />
                        <div className="flex items-center flex-1">
                            <Scissors size={13} className="text-gray-400 mr-1.5" />
                            <span className="text-[12px] font-semibold text-[#000] truncate">
                                {isOfflineBooking && appointment.services?.length > 0
                                    ? appointment.services.map(s => s.name).join(", ")
                                    : (appointment.appointmentType || "Standard Cut")}
                            </span>
                        </div>
                    </div>

                    {/* Skip Warning */}
                    {skipCount > 0 && (
                        <div className="flex items-center mb-2">
                            <AlertTriangle size={11} className={skipCount >= 2 ? "text-red-600" : "text-amber-500"} />
                            <span className={`text-[10px] font-semibold ml-1 ${skipCount >= 2 ? "text-red-600" : "text-amber-500"}`}>
                                Skipped {skipCount} time{skipCount > 1 ? "s" : ""}
                            </span>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-2.5 border-t border-gray-100 flex justify-between items-center">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 tracking-wider">TOTAL</p>
                            <p className="text-base font-extrabold text-[#6A1B9A]">₹{appointment.totalPrice}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Skip Button */}
                            {isReady && !isStarted && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSkip(appointment._id); }}
                                    className="w-9 h-9 rounded-full bg-[#F3E5F5] flex items-center justify-center hover:bg-[#E1BEE7] transition-colors"
                                >
                                    <SkipForward size={18} color="#8E24AA" />
                                </button>
                            )}

                            {/* Pending Actions */}
                            {isPending && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(appointment._id, "cancelled"); }}
                                        className="w-9 h-9 rounded-full bg-[#FFEBEE] flex items-center justify-center hover:bg-[#FFCDD2]"
                                    >
                                        <XCircle size={18} color="#D32F2F" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(appointment._id, "confirmed"); }}
                                        className="h-9 px-4 rounded-full bg-[#00C853] flex items-center shadow-md hover:bg-[#00E676] transition-colors"
                                    >
                                        <span className="text-white font-bold text-[12px] uppercase">Accept</span>
                                    </button>
                                </>
                            )}

                            {/* Collect Payment */}
                            {isConfirmed && !isStarted && !isPaymentDone && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onCollectPayment(appointment._id); }}
                                        className="h-9 px-4 rounded-full bg-[#FF6D00] flex items-center shadow-md hover:bg-[#FF9100]"
                                    >
                                        <CreditCard size={14} className="text-white mr-1.5" />
                                        <span className="text-white font-bold text-[12px] uppercase">Collect</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(appointment._id, "cancelled"); }}
                                        className="w-9 h-9 rounded-full bg-[#FFEBEE] flex items-center justify-center hover:bg-[#FFCDD2]"
                                    >
                                        <XCircle size={18} color="#D32F2F" />
                                    </button>
                                </div>
                            )}

                            {/* Start Actions */}
                            {isReady && !isStarted && (
                                <>
                                    {canPromote && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onPromote(appointment._id); }}
                                            className="w-8 h-8 rounded-full bg-[#FFF9C4] flex items-center justify-center hover:bg-[#FFF59D]"
                                        >
                                            <span className="text-sm">⚡</span>
                                        </button>
                                    )}

                                    {!isMyTurn && (
                                        <div className="h-8 px-3 rounded-full border border-dashed border-gray-300 flex items-center text-gray-400">
                                            <Clock size={14} className="mr-1" />
                                            <span className="text-[11px] font-semibold">Wait</span>
                                        </div>
                                    )}

                                    {isMyTurn && isChairBusy && (
                                        <div className="h-8 px-3 rounded-full border border-gray-200 bg-gray-50 flex items-center text-gray-400">
                                            <span className="text-[11px] font-semibold">Busy</span>
                                        </div>
                                    )}

                                    {isMyTurn && !isChairBusy && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onStart(appointment._id); }}
                                            className="h-9 px-4 rounded-full bg-[#6A1B9A] flex items-center shadow-md hover:bg-[#7b1fa2]"
                                        >
                                            <span className="text-white font-bold text-[12px] uppercase mr-1.5">START</span>
                                            <ArrowRightCircle size={14} className="text-white" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- MAIN SCREEN ---

const QueueManagementScreen = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { theme } = useTheme(); // Note: We might just rely on Tailwind classes for PWA

    // Constants
    const MAX_OFFLINE_EXPRESS = 2;

    const getIndianDate = () => {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const istTime = new Date(utc + 3600000 * 5.5);
        if (istTime.getHours() < 4) {
            istTime.setDate(istTime.getDate() - 1);
        }
        return istTime;
    };

    // State
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getIndianDate());
    const [activeTab, setActiveTab] = useState('active');
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', actions: [] });
    // OTP State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [currentStartId, setCurrentStartId] = useState(null);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    // Derived State
    const isAnyAppointmentStarted = useMemo(() => appointments.some(a => a.status === 'started'), [appointments]);

    // Toast (Simple alert for now or implement custom Toast)
    const showToast = (message, type = 'success') => {
        // For PWA smoothness, we can use a library or just simpler web alerts/console
        // Implementing simple overlay toast later if needed. For now console/alert.
        // Actually rendering a simple fixed div at bottom
        const toast = document.createElement('div');
        toast.className = `fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl font-bold text-white z-[100] animate-in fade-in slide-in-from-top-4 ${type === 'error' ? 'bg-red-500' : 'bg-black'}`;
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    const showCustomAlert = (title, message, actions, type) => {
        setAlertConfig({ visible: true, title, message, actions, type });
    };

    // --- LOGIC ---

    const fetchAppointments = useCallback(async (date) => {
        setLoading(true);
        if (!user?._id) return;

        try {
            const formattedDate = format(date, "yyyy-MM-dd");
            const res = await api.get(`/api/booking/barber-appointments/${user._id}?date=${formattedDate}`);

            // Filter
            const data = Array.isArray(res.data) ? res.data : [];
            const valid = data.filter(b =>
                ["pending", "confirmed", "started", "completed"].includes(b.status) &&
                b.paymentStatus !== "failed"
            );

            setAppointments(valid);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAppointments(selectedDate);
    }, [selectedDate, fetchAppointments]);

    // Sorting Logic
    const isExpress = useCallback((app) => {
        return (
            (app.appointmentType && app.appointmentType.toLowerCase().includes("express")) ||
            (app.isPromoted === true)
        );
    }, []);

    const sortedAppointments = useMemo(() => {
        const pending = appointments.filter((app) => app.status === "pending");
        const activeRaw = appointments.filter(
            (app) => app.status === "confirmed" || app.status === "started"
        );
        const completed = appointments.filter((app) => app.status === "completed");

        activeRaw.sort((a, b) => {
            if (a.status === 'started' && b.status !== 'started') return -1;
            if (b.status === 'started' && a.status !== 'started') return 1;

            const aIsExpress = isExpress(a) && (a.tempDelayMinutes || 0) < 500;
            const bIsExpress = isExpress(b) && (b.tempDelayMinutes || 0) < 500;

            if (aIsExpress && !bIsExpress) return -1;
            if (bIsExpress && !aIsExpress) return 1;

            const getScore = (app) => {
                if (!app.time) return 9999;
                const [h, m] = app.time.split(':').map(Number);
                let val = (h * 60 + m) + (app.tempDelayMinutes || 0);
                if (!isExpress(app)) val += 2000;
                return val;
            };

            return getScore(a) - getScore(b);
        });

        return { pending, active: activeRaw, completed };
    }, [appointments, isExpress]);

    const activeCount = sortedAppointments.pending.length + sortedAppointments.active.length;
    const doneCount = sortedAppointments.completed.length;

    // Display Data
    const sectionsData = useMemo(() => {
        if (activeTab === 'active') {
            return [
                { title: 'Needs Action', data: sortedAppointments.pending, color: '#FF9800' },
                { title: 'In Queue', data: sortedAppointments.active, color: '#6A1B9A' }
            ].filter(s => s.data.length > 0);
        } else {
            return [
                { title: 'Done', data: sortedAppointments.completed, color: '#4CAF50' }
            ].filter(s => s.data.length > 0);
        }
    }, [activeTab, sortedAppointments]);

    const blockingId = useMemo(() => {
        const started = appointments.find(a => a.status === 'started');
        if (started) return started._id;
        const activeGroup = sortedAppointments.active;
        if (!activeGroup.length) return null;
        // First paid/walkin
        const first = activeGroup.find(a => a.isOfflineBooking || a.paymentStatus !== 'pending');
        return first ? first._id : null;
    }, [appointments, sortedAppointments]);


    // --- HANDLERS ---
    const updateStatus = async (id, status, reason) => {
        showCustomAlert(
            status === 'confirmed' ? "Accept Booking" : "Cancel Booking",
            status === 'confirmed' ? "Confirm this booking?" : "Cancel this booking?",
            [
                { text: "No", style: 'cancel', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) },
                {
                    text: "Yes", style: status === 'cancelled' ? 'destructive' : 'default', onPress: async () => {
                        const url = status === 'confirmed' ? `/api/booking/accept/${id}` : `/api/booking/decline/${id}`;
                        await api.put(url, status === 'cancelled' ? { cancellationReason: reason || "Declined" } : {});
                        fetchAppointments(selectedDate);
                        showToast(status === 'confirmed' ? "Accepted" : "Cancelled", "success");
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                    }
                }
            ],
            status === 'cancelled' ? 'destructive' : 'info'
        );
    };

    const handleSkip = (id) => {
        showCustomAlert(
            "Skip Customer",
            "Swap with next customer?",
            [
                { text: "Cancel", style: 'cancel', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) },
                {
                    text: "Skip", style: 'default', onPress: async () => {
                        await api.put(`/api/booking/swap-down/${id}`);
                        fetchAppointments(selectedDate);
                        showToast("Swapped with next customer", "success");
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                    }
                }
            ]
        );
    };

    const handleStart = (id) => {
        const app = appointments.find(a => a._id === id);
        if (!app) return;

        showCustomAlert(
            "Start Session",
            "Start this appointment?",
            [
                { text: "Cancel", style: 'cancel', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) },
                {
                    text: "Start", style: 'default', onPress: async () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));

                        if (app.isOfflineBooking) {
                            // Offline: Auto-verify with 000000
                            try {
                                await api.post(`/api/booking/verify-otp-and-start/${id}`, { otp: "000000" });
                                fetchAppointments(selectedDate);
                                showToast("Session Started", "success");
                            } catch (err) {
                                showToast("Failed to start", "error");
                            }
                        } else {
                            // Online: Show OTP Modal
                            setCurrentStartId(id);
                            setShowOtpModal(true);
                        }
                    }
                }
            ]
        );
    };

    const handleVerifyOtp = async (pin) => {
        if (!currentStartId) return;
        setVerifyingOtp(true);
        try {
            await api.post(`/api/booking/verify-otp-and-start/${currentStartId}`, { otp: pin });
            fetchAppointments(selectedDate);
            showToast("Session Started", "success");
            setShowOtpModal(false);
            setCurrentStartId(null);
        } catch (error) {
            showToast("Invalid PIN. Try again.", "error");
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleComplete = (id) => {
        showCustomAlert(
            "Complete Service",
            "Mark as finished?",
            [
                { text: "Cancel", style: 'cancel', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) },
                {
                    text: "Finish", style: 'default', onPress: async () => {
                        await api.put(`/api/booking/complete/${id}`);
                        fetchAppointments(selectedDate);
                        showToast("Completed!", "success");
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                    }
                }
            ],
            'success'
        );
    };

    const offlineExpressParams = useMemo(() => appointments.filter(a => a.status !== 'cancelled' && isExpress(a)).length, [appointments, isExpress]);

    return (
        <div className="min-h-screen bg-[#F4F5F7] flex justify-center">
            <div className="w-full max-w-[390px] bg-[#F4F5F7] min-h-screen shadow-2xl relative pb-24">
                <CustomAlert {...alertConfig} onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))} />
                <OtpModal
                    visible={showOtpModal}
                    onClose={() => { setShowOtpModal(false); setCurrentStartId(null); }}
                    onVerify={handleVerifyOtp}
                    loading={verifyingOtp}
                />

                {/* HEADER */}
                <div className="bg-white rounded-b-[20px] px-3 pt-4 pb-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] z-20 relative">
                    {/* Top Row: Nav & Title */}
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-9 h-9 rounded-[10px] bg-white border border-gray-100 shadow-sm flex items-center justify-center mr-3 active:scale-95 transition-transform"
                            >
                                <ChevronLeft size={20} className="text-[#1C1C1E]" strokeWidth={2.5} />
                            </button>
                            <div>
                                <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5 opacity-80">Today's Queue</p>
                                <h1 className="text-[18px] font-extrabold text-[#1C1C1E] tracking-tight leading-none">Manager</h1>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/history')}
                            className="w-9 h-9 rounded-[10px] bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <History size={18} className="text-[#1C1C1E] opacity-80" strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Bottom Row: Date & Actions */}
                    <div className="flex justify-between items-center">
                        {/* Date Pill - Native Look */}
                        <div className="bg-white border border-gray-100 rounded-full pl-1 pr-2.5 py-1 flex items-center shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center mr-2">
                                <Calendar size={12} className="text-[#6A1B9A]" strokeWidth={2.5} />
                            </div>
                            <span className="text-[11px] font-bold text-[#1C1C1E] tracking-tight">{format(selectedDate, "MMM dd, yyyy")}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchAppointments(selectedDate)}
                                className="w-9 h-9 rounded-full border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-700 active:bg-gray-50 active:scale-95 transition-all"
                            >
                                <RefreshCcw size={14} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => navigate('/walk-in')}
                                className="h-9 pl-3 pr-4 rounded-full bg-[#6A1B9A] flex items-center text-white shadow-lg shadow-purple-900/20 active:scale-95 transition-transform active:bg-[#5a1682]"
                            >
                                <Plus size={14} className="mr-1.5" strokeWidth={3} />
                                <span className="font-bold text-[11px] uppercase tracking-wide">Walk-in</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="px-3 mt-3 mb-2">
                    <div className="bg-white p-1 rounded-[18px] flex shadow-sm border border-gray-100">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 py-1.5 rounded-[14px] flex items-center justify-center transition-all ${activeTab === 'active' ? 'bg-[#E3F2FD]' : 'bg-transparent'}`}
                        >
                            <span className={`text-[11px] font-bold mr-2 ${activeTab === 'active' ? 'text-[#1976D2]' : 'text-gray-400'}`}>Active</span>
                            <div className={`px-1.5 py-0.5 rounded-[6px] text-[10px] font-bold ${activeTab === 'active' ? 'bg-[#BBDEFB] text-[#1565C0]' : 'bg-gray-100 text-gray-400'}`}>
                                {activeCount}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('done')}
                            className={`flex-1 py-1.5 rounded-[14px] flex items-center justify-center transition-all ${activeTab === 'done' ? 'bg-[#E8F5E9]' : 'bg-transparent'}`}
                        >
                            <span className={`text-[11px] font-bold mr-2 ${activeTab === 'done' ? 'text-[#388E3C]' : 'text-gray-400'}`}>Done</span>
                            <div className={`px-1.5 py-0.5 rounded-[6px] text-[10px] font-bold ${activeTab === 'done' ? 'bg-[#C8E6C9] text-[#2E7D32]' : 'bg-gray-100 text-gray-400'}`}>
                                {doneCount}
                            </div>
                        </button>
                    </div>
                </div>

                {/* LIST */}
                <div className="px-3">
                    {loading ? (
                        <div className="mt-4">
                            <SkeletonItem />
                            <SkeletonItem />
                            <SkeletonItem />
                        </div>
                    ) : sectionsData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center mt-20 opacity-60">
                            <div className="w-24 h-24 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-6">
                                <Calendar size={40} className="text-gray-300" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-extrabold text-[#1C1C1E] mb-2 tracking-tight">No Bookings Yet</h3>
                            <p className="text-center text-gray-400 text-sm max-w-[200px] leading-relaxed">Your queue is empty for <br />{format(selectedDate, "MMMM do")}.</p>
                        </div>
                    ) : (
                        sectionsData.map(section => (
                            <div key={section.title} className="mb-8">
                                <div className="flex items-center mb-5 pl-1">
                                    <h2 className="text-[15px] font-extrabold text-[#1C1C1E] tracking-tight uppercase opacity-90">{section.title}</h2>
                                    <div className="h-px bg-gray-200 flex-1 mx-4" />
                                    <div className="px-2.5 py-1 rounded-md bg-white border border-gray-100 text-[11px] font-bold text-gray-400 shadow-sm">
                                        {section.data.length}
                                    </div>
                                </div>

                                <AnimatePresence mode='popLayout'>
                                    {section.data.map(item => (
                                        <AppointmentCard
                                            key={item._id}
                                            appointment={item}
                                            isAnyAppointmentStarted={isAnyAppointmentStarted}
                                            blockingId={blockingId}
                                            onPressCard={() => navigate(`/appointment/${item._id}`)}
                                            onSkip={handleSkip}
                                            onUpdateStatus={updateStatus}
                                            onCollectPayment={() => updateStatus(item._id, 'payment_collected')}
                                            onStart={handleStart}
                                            onPromote={(id) => {
                                                api.put(`/api/booking/promote/${id}`).then(() => fetchAppointments(selectedDate));
                                            }}
                                            offlineExpressCount={offlineExpressParams}
                                            MAX_OFFLINE_EXPRESS={MAX_OFFLINE_EXPRESS}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueueManagementScreen;
