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
import { useSocket } from '../context/SocketContext';
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
    appointment, isChairBusy: isChairBusyProp, readyToStartIds = [],
    onPressCard, onSkip, onUpdateStatus, onCollectPayment,
    onStart, onPromote, offlineExpressCount, MAX_OFFLINE_EXPRESS,
    onAlmostDone, onAdjustTime
}) => {
    const { theme } = useTheme();

    const isConfirmed = appointment.status === "confirmed";
    const isStarted = appointment.status === "started";
    const isPending = appointment.status === "pending";
    const isOfflineBooking = appointment.isOfflineBooking;
    const isPaymentDone = isOfflineBooking || appointment.paymentStatus !== "pending";
    const isReady = isConfirmed && isPaymentDone;
    const isChairBusy = isChairBusyProp;
    const isMyTurn = readyToStartIds.includes(appointment._id);
    const skipCount = appointment.skipCount || 0;

    // Live Tracker State
    const [nowTick, setNowTick] = useState(Date.now());

    useEffect(() => {
        let interval;
        if (isStarted) {
            interval = setInterval(() => {
                setNowTick(Date.now());
            }, 30000); // Update every 30 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isStarted]);

    // Show Cancel button ONLY if skipped 2 or more times (Danger Cancel)
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

    const handleInfoClick = (e) => {
        e.stopPropagation();
        let title = "Queue Position";
        let msg = "This customer is in the standard queue based on their arrival time.";

        const delay = appointment.tempDelayMinutes || 0;
        const skips = appointment.skipCount || 0;

        if (delay > 500) {
            title = "⚠️ Demoted Priority";
            msg = `This customer was skipped ${skips} time(s). They have been effectively moved to the Basic Queue (+${delay}m penalty) to let others pass.`;
        } else if (isExpress) {
            title = "⚡ Express Priority";
            msg = "This customer booked 'Express' and is prioritized at the front of the line.";
        } else if (delay > 0) {
            title = "Delayed";
            msg = `This customer was skipped and pushed back by ${delay} minutes.`;
        }

        alert(`${title}\n\n${msg}`);
    };

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
                                onClick={handleInfoClick}
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
                                {(() => {
                                    // Calculate total duration
                                    let totalMins = 0;
                                    if (appointment.services && appointment.services.length > 0) {
                                        appointment.services.forEach(s => {
                                            if (s.time) {
                                                const durationMatch = String(s.time).match(/(\d+)/); // Extracts "30" from "30 mins"
                                                if (durationMatch) totalMins += parseInt(durationMatch[1], 10);
                                            }
                                        });
                                    }

                                    if (totalMins === 0) {
                                        totalMins = 30; // Default 30 min if no specific service durations
                                    }

                                    // Add manual offsets
                                    totalMins += (appointment.durationOffset || 0);

                                    // Dynamic Auto-Delay & Live Countdown
                                    if (appointment.status === 'started' && appointment.startedAt) {
                                        const elapsedMs = nowTick - new Date(appointment.startedAt).getTime();
                                        const elapsedMinutes = Math.floor(elapsedMs / 60000);

                                        let remainingTime = totalMins - elapsedMinutes;
                                        if (remainingTime < 0) {
                                            return `OVERTIME (+${Math.abs(remainingTime)}m)`;
                                        }

                                        return `${remainingTime} MIN LEFT`;
                                    }

                                    return `${totalMins} MIN`;
                                })()}
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

                            {/* Pending Actions (ONLY for offline/manual) */}
                            {isPending && isOfflineBooking && (
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

                            {/* Collect Payment / Danger Cancel */}
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
                                    {/* Danger Cancel for high skips even if paid */}
                                    {showDangerCancel && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdateStatus(appointment._id, "cancelled", "Cancelled due to excessive delays");
                                            }}
                                            className="w-9 h-9 rounded-full bg-[#FFEBEE] flex items-center justify-center hover:bg-[#FFCDD2] mr-1"
                                        >
                                            <XCircle size={18} color="#D32F2F" />
                                        </button>
                                    )}

                                    {canPromote && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onPromote(appointment._id); }}
                                            className="w-8 h-8 rounded-full bg-[#FFF9C4] flex items-center justify-center hover:bg-[#FFF59D] mr-1"
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

                            {/* Complete / Adjust Actions */}
                            {isStarted && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onAdjustTime(appointment._id, -10); }}
                                        className="h-9 px-3 rounded-full bg-gray-100 flex items-center shadow-sm hover:bg-gray-200 transition-colors border border-gray-200"
                                    >
                                        <span className="text-gray-700 font-bold text-[12px]">-10m</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onAdjustTime(appointment._id, 10); }}
                                        className="h-9 px-3 rounded-full bg-gray-100 flex items-center shadow-sm hover:bg-gray-200 transition-colors border border-gray-200"
                                    >
                                        <span className="text-gray-700 font-bold text-[12px]">+10m</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onAlmostDone(appointment._id); }}
                                        className="h-9 px-3 rounded-full bg-orange-50 flex items-center shadow-sm hover:bg-orange-100 transition-colors border border-orange-100"
                                    >
                                        <span className="text-orange-600 font-bold text-[12px]">🔔 Call Next</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(appointment._id, "completed"); }}
                                        className="h-9 px-4 rounded-full bg-[#00C853] flex items-center shadow-md hover:bg-[#00E676] transition-colors"
                                    >
                                        <CheckCircle size={14} className="text-white mr-1.5" />
                                        <span className="text-white font-bold text-[12px] uppercase">Finish</span>
                                    </button>
                                </div>
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
    const { user, token, loading: authLoading } = useAuth();
    const { socket } = useSocket();
    const { theme } = useTheme();

    // Constants
    const MAX_OFFLINE_EXPRESS = 2;

    const getIndianDate = useCallback(() => {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const istTime = new Date(utc + 3600000 * 5.5);
        if (istTime.getHours() < 4) {
            istTime.setDate(istTime.getDate() - 1);
        }
        return istTime;
    }, []);

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

    // Live Ticking State for the Entire Queue View
    const [nowTick, setNowTick] = useState(Date.now());
    const [timeOffset, setTimeOffset] = useState(0);

    // Sync time with server once on mount
    useEffect(() => {
        const syncTime = async () => {
            try {
                const res = await api.get('/booking/server-time');
                if (res.data?.success && res.data?.serverTimeMs) {
                    const localTime = Date.now();
                    const offset = res.data.serverTimeMs - localTime;
                    setTimeOffset(offset);
                    setNowTick(localTime + offset);
                }
            } catch (err) {
                console.error("Failed to sync server time", err);
            }
        };
        syncTime();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setNowTick(Date.now() + timeOffset);
        }, 30000);
        return () => clearInterval(interval);
    }, [timeOffset]);

    // Toast
    const showToast = useCallback((message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl font-bold text-white z-[100] animate-in fade-in slide-in-from-top-4 transition-all duration-300 ${type === 'error' ? 'bg-red-500' : 'bg-black'}`;
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, []);

    const showCustomAlert = useCallback((title, message, actions, type) => {
        setAlertConfig({ visible: true, title, message, actions, type });
    }, []);

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

    // --- REAL-TIME UPDATES: Socket.IO ---
    useEffect(() => {
        if (!socket) return;

        const handleNewBooking = (data) => {
            showToast('New booking received!', 'success');
            fetchAppointments(selectedDate);
        };

        const handleBookingUpdate = (data) => {
            fetchAppointments(selectedDate);
        };

        socket.on('new_booking', handleNewBooking);
        socket.on('booking_update', handleBookingUpdate);

        return () => {
            socket.off('new_booking', handleNewBooking);
            socket.off('booking_update', handleBookingUpdate);
        };
    }, [socket, selectedDate, fetchAppointments, showToast]);

    // Auto-refresh date at midnight
    useEffect(() => {
        const checkDateChange = () => {
            const currentIndianDate = getIndianDate();
            if (format(currentIndianDate, 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')) {
                setSelectedDate(currentIndianDate);
                showToast('Date updated to today', 'success');
            }
        };
        const interval = setInterval(checkDateChange, 60000);
        return () => clearInterval(interval);
    }, [selectedDate, getIndianDate, showToast]);

    // Sorting Logic
    const isExpressApp = useCallback((app) => {
        return (
            (app.appointmentType && app.appointmentType.toLowerCase().includes("express")) ||
            (app.isPromoted === true)
        );
    }, []);

    const sortedAppointments = useMemo(() => {
        const pending = appointments.filter((app) => {
            // Only show pending bookings if:
            // 1. It's an offline/walk-in booking (always show)
            // 2. OR it's an online booking that has been PAID (paymentStatus !== 'pending')
            // This hides unpaid online attempts that were never completed.
            if (app.status !== "pending") return false;
            if (app.isOfflineBooking) return true;
            return app.paymentStatus !== "pending";
        });
        const activeRaw = appointments.filter(
            (app) => app.status === "confirmed" || app.status === "started"
        );
        const completed = appointments.filter((app) => app.status === "completed");

        activeRaw.sort((a, b) => {
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

        return { pending, active: activeRaw, completed };
    }, [appointments, isExpressApp]);

    const activeCount = sortedAppointments.pending.length + sortedAppointments.active.length;
    const doneCount = sortedAppointments.completed.length;

    // Calculate overall estimated wait time
    const totalWaitTime = useMemo(() => {
        const capacity = user?.concurrentServiceCapacity || 1;
        const activeGroup = sortedAppointments.active;
        if (!activeGroup.length) return 0;

        // K-server queue logic
        const slots = Array(capacity).fill(0);
        const adjustmentFactor = capacity > 1 ? (capacity * 0.75) : 1.0;

        activeGroup.forEach(app => {
            let appMins = 0;
            if (app.services && app.services.length > 0) {
                app.services.forEach(s => {
                    const m = String(s.time || s.duration).match(/(\d+)/);
                    if (m) appMins += parseInt(m[1], 10);
                });
            }
            if (appMins === 0) appMins = 30;
            appMins += (app.durationOffset || 0);
            const adjustedMins = appMins * adjustmentFactor;

            if (app.status === 'started' && app.startedAt) {
                const elapsedMs = nowTick - new Date(app.startedAt).getTime();
                const elapsedMinutes = Math.floor(elapsedMs / 60000);
                let adjustedRemaining = adjustedMins - (elapsedMinutes * adjustmentFactor);
                if (adjustedRemaining < 0) adjustedRemaining = 5;

                slots.sort((a, b) => a - b);
                slots[0] = adjustedRemaining;
            } else {
                slots.sort((a, b) => a - b);
                slots[0] += adjustedMins;
            }
        });

        slots.sort((a, b) => a - b);
        return Math.max(0, slots[0]);
    }, [sortedAppointments.active, nowTick, user]);

    // Display Data
    const sectionsData = useMemo(() => {
        if (activeTab === 'active') {
            const capacity = user?.concurrentServiceCapacity || 1;
            const now = getIndianDate();
            const currentTotalMins = (now.getHours() * 60) + now.getMinutes();

            // K-server slot tracking for start times
            const slots = Array(capacity).fill(currentTotalMins);
            const adjustmentFactor = capacity > 1 ? (capacity * 0.75) : 1.0;

            const updatedActive = sortedAppointments.active.map((app) => {
                // This appointment starts at the earliest available slot
                slots.sort((a, b) => a - b);

                // However, an appointment cannot start BEFORE its booked time (if not started)
                // or BEFORE now.
                let bookedTotalMins = currentTotalMins;
                if (app.time) {
                    const [h, m] = app.time.split(':').map(Number);
                    bookedTotalMins = (h * 60) + m;
                }

                if (app.status === 'started' && app.startedAt) {
                    const d = new Date(app.startedAt);
                    bookedTotalMins = (d.getHours() * 60) + d.getMinutes();
                }

                // The calculated start time is the MAX of (earliest slot free) and (booked time/now)
                const potentialStartTime = Math.max(slots[0], bookedTotalMins, currentTotalMins);

                const calculatedStartHours = Math.floor(potentialStartTime / 60);
                const calculatedStartMins = potentialStartTime % 60;
                const calculatedStartTime = `${calculatedStartHours < 10 ? '0' : ''}${calculatedStartHours}:${calculatedStartMins < 10 ? '0' : ''}${calculatedStartMins}`;

                // Calculate adjusted duration to add to slot
                let appDurationMins = 0;
                if (app.services && app.services.length > 0) {
                    app.services.forEach(s => {
                        const m = String(s.time || s.duration).match(/(\d+)/);
                        if (m) appDurationMins += parseInt(m[1], 10);
                    });
                }
                if (appDurationMins === 0) appDurationMins = 30;
                appDurationMins += (app.durationOffset || 0);
                const adjustedDuration = appDurationMins * adjustmentFactor;

                if (app.status === 'started' && app.startedAt) {
                    const elapsedMs = Date.now() - new Date(app.startedAt).getTime();
                    const elapsedMinutes = Math.floor(elapsedMs / 60000);
                    let adjustedRemaining = adjustedDuration - (elapsedMinutes * adjustmentFactor);
                    if (adjustedRemaining < 0) adjustedRemaining = 5;

                    // Slot update: This slot is free in 'adjustedRemaining' from NOW
                    slots[0] = currentTotalMins + adjustedRemaining;
                } else {
                    // Slot update: This slot is free after this appointment finishes
                    slots[0] = potentialStartTime + adjustedDuration;
                }

                return { ...app, calculatedStartTime };
            });

            return [
                { title: 'Needs Action', data: sortedAppointments.pending, color: '#FF9800' },
                { title: 'In Queue', data: updatedActive, color: '#6A1B9A' }
            ].filter(s => s.data.length > 0);
        } else {
            return [
                { title: 'Done', data: sortedAppointments.completed, color: '#4CAF50' }
            ].filter(s => s.data.length > 0);
        }
    }, [activeTab, sortedAppointments]);

    const startedCount = useMemo(() => appointments.filter(a => a.status === 'started').length, [appointments]);
    const isAnyAppointmentStarted = startedCount > 0;
    const capacity = user?.concurrentServiceCapacity || 1;
    const isChairBusy = startedCount >= capacity;

    const readyToStartIds = useMemo(() => {
        // Can start if we have free capacity
        const canStartMore = startedCount < capacity;
        if (!canStartMore) return [];

        // Who are the next candidates?
        // Candidates must be NOT started, and either offline or paid
        const candidates = sortedAppointments.active.filter(a =>
            a.status !== 'started' && (a.isOfflineBooking || a.paymentStatus !== 'pending')
        );

        // How many slots are free?
        const freeSlots = capacity - startedCount;

        // The first 'freeSlots' people are allowed to start
        return candidates.slice(0, freeSlots).map(c => c._id);
    }, [startedCount, capacity, sortedAppointments.active]);


    // --- HANDLERS ---
    const updateStatus = async (id, status, reason) => {
        const isCancellation = status === 'cancelled';
        const isCompletion = status === 'completed';
        const isAcceptance = status === 'confirmed';

        const performUpdate = async () => {
            try {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                let url;
                if (status === 'confirmed') url = `/api/booking/accept/${id}`;
                else if (status === 'cancelled') url = `/api/booking/decline/${id}`;
                else if (status === 'completed') url = `/api/booking/complete/${id}`;
                else if (status === 'payment_collected') {
                    // Manual payment collection logic
                    await api.put(`/api/booking/update-payment/${id}`, { paymentStatus: 'completed' });
                    showToast("Payment collected", "success");
                    fetchAppointments(selectedDate);
                    return;
                }

                if (url) {
                    await api.put(url, status === 'cancelled' ? { cancellationReason: reason || "Declined" } : {});
                    fetchAppointments(selectedDate);
                    showToast(status === 'confirmed' ? "Accepted" : (status === 'completed' ? "Completed" : "Cancelled"), "success");
                }
            } catch (err) {
                showToast("Action failed", "error");
            }
        };

        if (isAcceptance) {
            // Direct action for Accept button
            await performUpdate();
        } else {
            showCustomAlert(
                isCancellation ? "Cancel Booking" : (isCompletion ? "Complete Service" : "Confirm Action"),
                isCancellation ? "Are you sure you want to cancel this booking?" : (isCompletion ? "Mark this service as finished?" : "Do you want to proceed?"),
                [
                    { text: "No", style: 'cancel', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) },
                    { text: "Yes", style: isCancellation ? 'destructive' : 'default', onPress: performUpdate }
                ],
                isCancellation ? 'destructive' : (isCompletion ? 'success' : 'info')
            );
        }
    };

    const handleAlmostDone = (id) => {
        showCustomAlert(
            "Call Next Customer?",
            "This will send a push notification to the next person telling them you are almost ready.",
            [
                { text: "Cancel", style: 'cancel', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) },
                {
                    text: "Call Next", style: 'default', onPress: async () => {
                        try {
                            setAlertConfig(prev => ({ ...prev, visible: false }));
                            const res = await api.put(`/api/booking/${id}/almost-done`);
                            showToast("Notification sent to next customer!", "success");
                        } catch (err) {
                            showToast(err.response?.data?.msg || "Failed to notify next customer", "error");
                        }
                    }
                }
            ],
            "info"
        );
    };

    const handleAdjustTime = async (id, minutes) => {
        try {
            await api.put(`/api/booking/${id}/adjust-time`, { minutes });
            fetchAppointments(selectedDate);
            showToast(`${minutes > 0 ? '+' : ''}${minutes}m adjusted`, "success");
        } catch (err) {
            showToast("Failed to adjust time", "error");
        }
    };

    const handleSkip = (id) => {
        showCustomAlert(
            "Skip Customer",
            "Swap with next customer?",
            [
                { text: "Cancel", style: 'cancel', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) },
                {
                    text: "Skip", style: 'default', onPress: async () => {
                        try {
                            setAlertConfig(prev => ({ ...prev, visible: false }));
                            const res = await api.put(`/api/booking/swap-down/${id}`);
                            if (res.data?.status === 'cancelled') {
                                showToast("Booking Auto-Cancelled (3 Skips)", "error");
                            } else {
                                showToast("Swapped with next customer", "success");
                            }
                            fetchAppointments(selectedDate);
                        } catch (err) {
                            showToast("Skip failed", "error");
                        }
                    }
                }
            ]
        );
    };

    const handleStart = async (id) => {
        const app = appointments.find(a => a._id === id);
        if (!app) return;

        if (app.isOfflineBooking) {
            try {
                await api.post(`/api/booking/verify-otp-and-start/${id}`, { otp: "000000" });
                fetchAppointments(selectedDate);
                showToast("Session Started", "success");
            } catch (err) {
                showToast("Failed to start", "error");
            }
        } else {
            setCurrentStartId(id);
            setShowOtpModal(true);
        }
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

    const offlineExpressParams = useMemo(() => appointments.filter(a => a.status !== 'cancelled' && isExpressApp(a)).length, [appointments, isExpressApp]);

    return (
        <div className="min-h-screen bg-[#F4F5F7] flex justify-center">
            <div className="w-full max-w-[450px] bg-[#F4F5F7] min-h-screen shadow-2xl relative pb-24">
                <CustomAlert {...alertConfig} onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))} />
                <OtpModal
                    visible={showOtpModal}
                    onClose={() => { setShowOtpModal(false); setCurrentStartId(null); }}
                    onVerify={handleVerifyOtp}
                    loading={verifyingOtp}
                />

                {/* HEADER */}
                <div className="bg-white rounded-b-[32px] px-6 header-safe-pt pb-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] z-20 relative border-b border-gray-100/50">
                    {/* Top Row: Nav & Title */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-[42px] h-[42px] rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mr-4 active:scale-95 transition-transform"
                            >
                                <ChevronLeft size={22} className="text-[#1C1C1E]" strokeWidth={2.5} />
                            </button>
                            <div>
                                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1 opacity-80">Today's Queue</p>
                                <h1 className="text-[22px] font-[900] text-[#1C1C1E] tracking-tight leading-none">Manager</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Est Wait Time Pill */}
                            <div className="bg-[#F3E5F5] border border-[#E1BEE7] rounded-xl px-2.5 py-1.5 flex flex-col items-center justify-center min-w-[50px]">
                                <Clock size={14} className="text-[#6A1B9A] mb-0.5" />
                                <p className="text-[11px] font-[900] text-[#1C1C1E] leading-none">{totalWaitTime}m</p>
                            </div>
                            <button
                                onClick={() => navigate('/queue-history')}
                                className="w-[42px] h-[42px] rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <History size={20} className="text-[#1C1C1E] opacity-80" strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row: Date & Actions */}
                    <div className="flex justify-between items-center">
                        <div className="bg-white border border-gray-100 rounded-full pl-1.5 pr-4 py-1.5 flex items-center shadow-sm relative overflow-hidden">
                            <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center mr-3">
                                <Calendar size={13} className="text-[#6A1B9A]" strokeWidth={2.5} />
                            </div>
                            <span className="text-[13px] font-extrabold text-[#1C1C1E] tracking-tight">{format(selectedDate, "MMM dd, yyyy")}</span>
                            <input
                                type="date"
                                value={format(selectedDate, "yyyy-MM-dd")}
                                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchAppointments(selectedDate)}
                                className="w-[42px] h-[42px] rounded-full border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-700 active:bg-gray-50 active:scale-95 transition-all"
                            >
                                <RefreshCcw size={16} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => navigate('/walk-in')}
                                className="h-[42px] pl-4 pr-5 rounded-full bg-[#6A1B9A] flex items-center text-white shadow-lg shadow-purple-900/20 active:scale-95 transition-transform active:bg-[#5a1682]"
                            >
                                <Plus size={16} className="mr-2" strokeWidth={3} />
                                <span className="font-[900] text-[12px] uppercase tracking-wide">Walk-in</span>
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
                                            isChairBusy={isChairBusy}
                                            readyToStartIds={readyToStartIds}
                                            onPressCard={() => navigate(`/appointments/${item._id}`)}
                                            onSkip={handleSkip}
                                            onUpdateStatus={updateStatus}
                                            onCollectPayment={() => updateStatus(item._id, 'payment_collected')}
                                            onStart={handleStart}
                                            onPromote={(id) => {
                                                api.put(`/api/booking/promote/${id}`).then(() => fetchAppointments(selectedDate));
                                            }}
                                            offlineExpressCount={offlineExpressParams}
                                            MAX_OFFLINE_EXPRESS={MAX_OFFLINE_EXPRESS}
                                            onAlmostDone={handleAlmostDone}
                                            onAdjustTime={handleAdjustTime}
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
