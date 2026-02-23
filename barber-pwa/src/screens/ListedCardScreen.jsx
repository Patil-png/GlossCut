import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ArrowLeft, Store, Phone, Tag, ChevronRight, Navigation,
    WifiOff, AlertCircle, CheckCircle, Info, Camera, Trash2, Sparkles, Zap, User, Star, Loader, Settings, Clock, QrCode, X, Calendar,
    Activity, ChevronDown, RefreshCw, Navigation2
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// --- UTILS ---
const getProcessedImageUri = (imagePath, userProfilePic) => {
    if (!imagePath) return userProfilePic || null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${import.meta.env.VITE_API_URL || 'https://api.glosscut.com'}${imagePath}`;
};

const calculateDailyDuration = (logs, targetDate, operatingHours) => {
    if (!logs || logs.length === 0) return null;

    let totalMinutes = 0;
    let inTime = null;

    const timeToMins = (t) => {
        if (!t) return null;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    // Helper to get closing minutes for a specific date
    const getClosingMinutes = (dateStr) => {
        if (!operatingHours) return null;
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayIdx = new Date(dateStr).getDay();
        const closeTime = operatingHours[days[dayIdx]]?.close;
        return timeToMins(closeTime);
    };

    const dayClosingMinutes = getClosingMinutes(targetDate);

    logs.forEach(log => {
        if (log.type === 'in') {
            inTime = timeToMins(log.time);
        } else if (log.type === 'out' && inTime !== null) {
            let outTime = timeToMins(log.time);

            // Auto-Cap at closing time if scan out was late
            if (dayClosingMinutes !== null) {
                // If closing spans midnight (close < open), adjust for comparison
                const openTime = timeToMins(operatingHours[Object.keys(operatingHours)[new Date(targetDate).getDay()]]?.open);
                let actualOut = outTime;
                let actualClose = dayClosingMinutes;
                if (actualClose < openTime && actualOut < openTime) {
                    // Both are after midnight
                } else if (actualClose < openTime && actualOut >= openTime) {
                    // Out is before midnight, Close is after midnight
                } else if (actualClose >= openTime && actualOut < openTime) {
                    // Out is after midnight, Close is before midnight (unlikely but handle)
                    actualOut = dayClosingMinutes;
                }

                if (actualClose < openTime) {
                    // Window spans midnight
                    const normalizedOut = outTime < openTime ? outTime + 1440 : outTime;
                    const normalizedClose = dayClosingMinutes + 1440;
                    if (normalizedOut > normalizedClose) outTime = dayClosingMinutes;
                } else {
                    if (outTime > dayClosingMinutes) outTime = dayClosingMinutes;
                }
            }

            if (outTime !== null && (outTime > inTime || (dayClosingMinutes < inTime && outTime < inTime))) {
                // Calculation for duration logic with midnight span is complex; keeping it simple for now
                // but ensuring outTime is capped correctly.
                let duration = 0;
                if (outTime < inTime) {
                    duration = (outTime + 1440) - inTime;
                } else {
                    duration = outTime - inTime;
                }
                totalMinutes += duration;
            }
            inTime = null;
        }
    });

    if (inTime !== null) {
        const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const nowMins = istNow.getHours() * 60 + istNow.getMinutes();

        // Check if the targetDate shift is currently "Active" (within the open-close window)
        const getIsCurrentlyInWindow = () => {
            if (!operatingHours) return false;
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayIdx = new Date(targetDate).getDay();
            const hours = operatingHours[days[dayIdx]];
            if (!hours?.open || !hours?.close) return false;

            const openMins = timeToMins(hours.open);
            const closeMins = timeToMins(hours.close);

            // Check if istNow (natural time) falls into the targetDate's business window
            const istDateStr = istNow.toISOString().split('T')[0];
            const yesterdayIst = new Date(istNow);
            yesterdayIst.setDate(yesterdayIst.getDate() - 1);
            const yesterdayIstStr = yesterdayIst.toISOString().split('T')[0];

            if (targetDate === istDateStr) {
                // Targeting natural today
                if (closeMins > openMins) return nowMins >= openMins && nowMins < closeMins;
                else return nowMins >= openMins || nowMins < closeMins;
            } else if (targetDate === yesterdayIstStr) {
                // Targeting natural yesterday - check if shift crosses midnight and is still active
                if (closeMins < openMins) return nowMins < closeMins;
            }
            return false;
        };

        if (getIsCurrentlyInWindow()) {
            let endMinutes = nowMins;
            let duration = 0;
            if (endMinutes < inTime) {
                duration = (endMinutes + 1440) - inTime;
            } else {
                duration = endMinutes - inTime;
            }
            totalMinutes += duration;
        } else {
            // It's a past shift with a missing OUT -> Auto-Logout at closing time
            if (dayClosingMinutes !== null) {
                let duration = 0;
                if (dayClosingMinutes < inTime) {
                    duration = (dayClosingMinutes + 1440) - inTime;
                } else {
                    duration = dayClosingMinutes - inTime;
                }
                totalMinutes += duration;
            } else {
                return "MISSING OUT";
            }
        }
    }

    if (totalMinutes === 0 && inTime === null) return null;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// --- COMPONENTS ---

const TopToast = ({ visible, message, type, onHide }) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(onHide, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible, onHide]);

    if (!visible) return null;

    let bg = '#333';
    let icon = <Sparkles size={18} color="#fff" />;

    if (type === 'success') { bg = '#10B981'; icon = <CheckCircle size={18} color="#fff" />; }
    else if (type === 'error') { bg = '#EF4444'; icon = <AlertCircle size={18} color="#fff" />; }
    else if (type === 'warning') { bg = '#F59E0B'; icon = <Zap size={18} color="#fff" />; }

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
        >
            <div
                className="flex items-center gap-3 px-5 py-3 rounded-full shadow-xl min-w-[300px] pointer-events-auto"
                style={{ backgroundColor: bg }}
            >
                <div>{icon}</div>
                <span className="text-white font-bold text-sm flex-1">{message}</span>
            </div>
        </motion.div>
    );
};

const ScalePress = ({ onClick, children, disabled, className }) => (
    <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={!disabled ? onClick : undefined}
        className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        {children}
    </motion.div>
);

const ModernHeader = ({ title, subtitle, onBack, onSettings, showSettings }) => (
    <div className="bg-gradient-to-br from-[#6366F1] to-[#4338CA] pt-6 pb-8 px-6 rounded-b-[36px] relative overflow-hidden mb-6">
        <div className="absolute top-[-40px] right-[-30px] w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-white/5 blur-lg pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
            <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-colors"
            >
                <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <div className="flex flex-col items-center">
                <h1 className="text-xl font-black text-white tracking-tight">{title}</h1>
                {subtitle && <p className="text-white/80 text-xs font-semibold mt-0.5">{subtitle}</p>}
            </div>
            <div className="w-10" />
        </div>
    </div>
);

const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-3 mb-4 px-1">
        <h2 className="text-base font-black text-gray-800 uppercase tracking-wider">{title}</h2>
        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100">LIVE</span>
    </div>
);

const InfoRow = ({ icon: Icon, label, value, onClick, canEdit = true }) => (
    <ScalePress onClick={onClick} disabled={!canEdit} className="mb-3 w-full">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={22} className="text-indigo-600" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-base font-bold text-gray-900 truncate pr-4">{value}</p>
                </div>
            </div>
            {canEdit ? (
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <ChevronRight size={18} className="text-indigo-600" />
                </div>
            ) : (
                <div className="bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                    <span className="text-[10px] font-bold text-green-600 tracking-wide">OFFICIAL</span>
                </div>
            )}
        </div>
    </ScalePress>
);

const ShopCardPreview = ({ shopData }) => {
    const totalBarbers = 1 + (shopData?.staff?.length || 0);
    const avgRating = shopData?.rating > 0 ? shopData.rating.toFixed(1) : "New Member";
    const imageUri = getProcessedImageUri(shopData?.image, null);

    return (
        <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-gray-100 mb-6 relative group transform transition-transform hover:scale-[1.01]">
            <div className="h-[200px] bg-gray-100 relative overflow-hidden">
                {imageUri ? (
                    <img src={imageUri} alt="Shop" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                        <Store size={48} />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-4 left-4">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
                        <Sparkles size={12} className="text-yellow-400" />
                        <span className="text-white text-xs font-bold">{avgRating}</span>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-2xl font-black text-gray-900 truncate pr-2">
                        {shopData?.name || "Initializing..."}
                    </h3>
                    <CheckCircle size={18} className="text-indigo-500 flex-shrink-0" fill="white" />
                </div>
                <div className="flex items-center gap-1 text-gray-500 mb-4">
                    <MapPin size={12} />
                    <p className="text-sm font-medium truncate">{shopData?.address || "Address pending"}</p>
                </div>

                <div className="h-px bg-gray-100 mb-4" />

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-bold text-gray-600">{totalBarbers} Professionals</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <div className="flex items-center gap-1.5 text-indigo-600">
                        <Zap size={14} fill="currentColor" />
                        <span className="text-sm font-bold">{shopData?.category || "Premium Service"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN SCREEN ---

// --- OPTIMIZED SUB-COMPONENTS ---

const DailyLogItem = React.memo(({ log, getUri }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-100 rounded-[24px] p-4 shadow-sm flex items-center justify-between hover:border-indigo-100 transition-colors group"
    >
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 overflow-hidden border border-gray-50 flex-shrink-0">
                {log.workerId?.profilePicture ? (
                    <img src={getUri(log.workerId.profilePicture)} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <User size={24} />
                    </div>
                )}
            </div>
            <div>
                <p className="text-[15px] font-black text-gray-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                    {log.workerId?.name || "Unknown Staff"}
                </p>
                <div className="flex flex-wrap gap-1.5 items-center">
                    {log.logs.map((pulse, i) => (
                        <span key={i} className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase border ${pulse.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            {pulse.type} {pulse.time}
                        </span>
                    ))}
                    {calculateDailyDuration(log.logs, log.date, log.shopId?.operatingHours) && (
                        calculateDailyDuration(log.logs, log.date, log.shopId?.operatingHours) === 'MISSING OUT' ? (
                            <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 animate-pulse uppercase">
                                Missing OUT
                            </span>
                        ) : (
                            <span className="text-[9px] font-black text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-lg border border-indigo-100/50">
                                TOTAL: {calculateDailyDuration(log.logs, log.date, log.shopId?.operatingHours)}
                            </span>
                        )
                    )}
                </div>
            </div>
        </div>
        <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 mb-1">
                {log.logs[log.logs.length - 1].type === 'in' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
            </div>
            <p className={`text-xs font-black tracking-tighter ${log.logs[log.logs.length - 1].type === 'in' ? 'text-emerald-500' : 'text-gray-400'}`}>
                {log.logs[log.logs.length - 1].type === 'in' ? 'LOGGED IN' : 'OUT'}
            </p>
        </div>
    </motion.div>
));

const MonthlyReportItem = React.memo(({ report, isExpanded, onToggle, getUri }) => (
    <div className="bg-white border border-gray-100 rounded-[28px] overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div
            onClick={onToggle}
            className="p-5 flex items-center justify-between cursor-pointer active:bg-gray-50 transition-colors"
        >
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[20px] bg-indigo-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    {report.worker.profilePicture ? (
                        <img src={getUri(report.worker.profilePicture)} className="w-full h-full object-cover" />
                    ) : (
                        <User size={28} className="text-indigo-400" />
                    )}
                </div>
                <div>
                    <h5 className="text-[17px] font-black text-gray-900 tracking-tight leading-tight">{report.worker.name}</h5>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-100">
                            <Activity size={10} />
                            <span className="text-[10px] font-black uppercase">{report.totalDays} Days</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attendance</span>
                    </div>
                </div>
            </div>
            <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"
            >
                <ChevronDown size={20} />
            </motion.div>
        </div>

        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-6 space-y-4"
                >
                    <div className="h-px bg-gray-50" />
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Staff Deep-Dive</p>
                    <div className="grid gap-3">
                        {report.days.slice().reverse().map((day, dIdx) => (
                            <motion.div
                                key={dIdx}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: dIdx * 0.05 }}
                                className="flex justify-between items-start bg-[#F8FAFC] p-4 rounded-2xl border border-gray-100 group hover:bg-white transition-colors"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                            <Calendar size={12} className="text-indigo-400" />
                                            {new Date(day.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                        {calculateDailyDuration(day.logs, day.date, report.shopOperatingHours) && (
                                            calculateDailyDuration(day.logs, day.date, report.shopOperatingHours) === 'MISSING OUT' ? (
                                                <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 uppercase">
                                                    Missing OUT
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-indigo-100 shadow-sm">
                                                    {calculateDailyDuration(day.logs, day.date, report.shopOperatingHours)}
                                                </span>
                                            )
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {day.logs.map((log, lIdx) => (
                                            <span key={lIdx} className={`text-[8px] font-black px-2 py-0.5 rounded-lg border shadow-sm ${log.type === 'in' ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-red-600 border-red-100'}`}>
                                                {log.type.toUpperCase()} • {log.time}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {day.logs[day.logs.length - 1].type === 'in' && (
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter">Live</span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
));

const ListedCardScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    const [shopData, setShopData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingStaff, setPendingStaff] = useState([]);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [monthlyLogs, setMonthlyLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [attendanceViewMode, setAttendanceViewMode] = useState('daily'); // 'daily' or 'monthly'
    const [expandedWorkerId, setExpandedWorkerId] = useState(null);

    const showToast = (message, type = 'info') => setToast({ visible: true, message, type });

    const fetchPendingStaff = useCallback(async () => {
        try {
            const res = await api.get('/api/shop/staff/pending');
            setPendingStaff(res.data);
        } catch (err) { console.error("Error fetching pending staff:", err); }
    }, []);

    const fetchShopData = useCallback(async () => {
        try {
            const res = await api.get('/api/shop/my-shop');
            setShopData(res.data);
            if (res.data?.isMainOwner) fetchPendingStaff();
        } catch (err) {
            console.error("Fetch Error:", err);
            showToast("Failed to load shop data", "error");
        } finally {
            setLoading(false);
        }
    }, [fetchPendingStaff]);


    useEffect(() => {
        fetchShopData();
    }, [fetchShopData]);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('shopImage', file);

        try {
            showToast("Uploading...", "info");
            const res = await api.post('/api/shop/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            let imageUrl = res.data.imageUrl;
            if (imageUrl.includes('r2.dev')) {
                imageUrl = imageUrl.replace("https://pub-260d10bc28ca4ff894255965492ab1dd.r2.dev", "https://images.glosscut.com");
            }

            // Optimize: Optimistic update
            setShopData(prev => ({ ...prev, image: imageUrl }));
            await api.put('/api/shop', { image: imageUrl });
            showToast("Cover image updated!", "success");
        } catch (err) {
            showToast("Upload failed", "error");
        }
    };

    const handleApproveStaff = async (barberId) => {
        try {
            await api.put(`/api/shop/staff/approve/${barberId}`);
            showToast("Staff approved", "success");
            fetchPendingStaff();
            fetchShopData(); // Refresh to see them in team
        } catch (err) { showToast("Action failed", "error"); }
    };

    const handleRejectStaff = async (barberId) => {
        try {
            await api.put(`/api/shop/staff/reject/${barberId}`);
            showToast("Request rejected", "info");
            fetchPendingStaff();
        } catch (err) { showToast("Action failed", "error"); }
    };

    const handleRemoveStaff = async (barber) => {
        if (!window.confirm(`Remove ${barber.name} from your team?`)) return;

        try {
            const res = await api.post('/api/barber-card/request-delete', {
                reason: "Barber card deletion requested by shop owner",
                targetBarberId: barber._id
            });
            if (res.status === 200) {
                showToast("Removal request sent", "success");
                fetchShopData();
            }
        } catch (err) {
            showToast(err.response?.data?.msg || "Failed to remove", "error");
        }
    };

    const handlePinLocation = async () => {
        if (!navigator.geolocation) return showToast("Geolocation not supported", "error");

        showToast("Getting location...", "info");
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                await api.put('/api/shop', { location: { type: "Point", coordinates: [longitude, latitude] } });
                showToast("Location pinned!", "success");
                setShopData(prev => ({ ...prev, location: { type: "Point", coordinates: [longitude, latitude] } }));
            } catch (err) {
                showToast("Failed to save location", "error");
            }
        }, () => showToast("Location denied", "error"));
    };

    const fetchAttendanceLogs = async () => {
        if (!shopData?._id) return;
        setLogsLoading(true);
        try {
            const res = await api.get(`/api/attendance/stats/${shopData._id}`);
            setAttendanceLogs(res.data);
        } catch (err) {
            console.error("Error fetching logs:", err);
        } finally {
            setLogsLoading(false);
        }
    };

    const fetchMonthlyAttendance = async () => {
        if (!shopData?._id) return;
        setLogsLoading(true);
        try {
            const res = await api.get(`/api/attendance/monthly/${shopData._id}`);
            setMonthlyLogs(res.data);
        } catch (err) {
            console.error("Error fetching monthly logs:", err);
            showToast("Failed to load monthly report", "error");
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        if (showAttendanceModal) {
            if (attendanceViewMode === 'daily') {
                fetchAttendanceLogs();
            } else {
                fetchMonthlyAttendance();
            }
        }
    }, [showAttendanceModal, attendanceViewMode]);

    if (loading) return (
        <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
            <Loader className="animate-spin text-indigo-600" size={32} />
        </div>
    );

    const isMainOwner = shopData?.isMainOwner;

    return (
        <div className="min-h-screen bg-[#F4F5F7] pb-24 flex justify-center">
            <div className="w-full max-w-[450px] bg-[#F4F5F7] min-h-screen shadow-2xl relative">
                <TopToast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                <ModernHeader
                    title="Premium Profile"
                    subtitle="Managing your digital presence"
                    onBack={() => navigate(-1)}
                />

                <div className="px-5">
                    {isMainOwner && (shopData?.approvalStatus === 'pending' || (shopData?.changeDetails && shopData.changeDetails.length > 0)) && shopData?.approvalStatus !== 'rejected' && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 p-5 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-[28px] shadow-sm flex items-start gap-4 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 blur-2xl" />
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-indigo-200">
                                <Sparkles size={24} />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-sm font-black text-[#1C1C1E] mb-1">Updates Under Review</h4>
                                <p className="text-[12px] leading-relaxed text-gray-500 font-medium italic">
                                    "Your shop profile changes are currently being reviewed by GLOSSCUT. They will be live once confirmed."
                                </p>
                            </div>
                        </motion.div>
                    )}

                    <div className="mb-8">
                        <SectionHeader title="Live Appearance" />
                        <ShopCardPreview shopData={shopData} />
                    </div>

                    <div className="mb-8">
                        <SectionHeader title="Establishment Details" />
                        <InfoRow
                            icon={Store}
                            label="Shop Name"
                            value={shopData?.name}
                            onClick={() => navigate('/edit-shop-name', { state: { currentName: shopData?.name } })}
                            canEdit={isMainOwner}
                        />
                        <InfoRow
                            icon={MapPin}
                            label="Location"
                            value={shopData?.address}
                            onClick={() => navigate('/edit-shop-address', { state: { currentAddress: shopData?.address } })}
                            canEdit={isMainOwner}
                        />
                        <InfoRow
                            icon={Phone}
                            label="Contact"
                            value={shopData?.phone}
                            onClick={() => navigate('/edit-shop-phone', { state: { currentPhone: shopData?.phone } })}
                            canEdit={isMainOwner}
                        />
                        <InfoRow
                            icon={Tag}
                            label="Category"
                            value={shopData?.category || "Barber Shop"}
                            onClick={() => navigate('/edit-category', { state: { currentCategory: shopData?.category } })}
                            canEdit={isMainOwner}
                        />
                        <InfoRow
                            icon={Camera}
                            label="Portfolio Media"
                            value="Update Cover Image"
                            onClick={() => fileInputRef.current?.click()}
                            canEdit={isMainOwner}
                        />
                        <InfoRow
                            icon={Clock}
                            label="Operating Hours"
                            value="Configure Timing"
                            onClick={() => navigate('/edit-operating-hours', { state: { currentOperatingHours: shopData?.operatingHours } })}
                            canEdit={isMainOwner}
                        />
                    </div>

                    <div className="mb-8">
                        <SectionHeader title="Map Presence" />
                        <ScalePress onClick={handlePinLocation} className="w-full">
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md cursor-pointer">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Navigation size={22} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Visibility Status</p>
                                    <p className={`text-base font-bold ${shopData?.location?.coordinates ? 'text-emerald-500' : 'text-gray-900'}`}>
                                        {shopData?.location?.coordinates ? "Marked at live location" : "Pin Your Location"}
                                    </p>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <ChevronRight size={18} className="text-indigo-600" />
                                </div>
                            </div>
                        </ScalePress>
                    </div>

                    {isMainOwner && (
                        <div className="mb-8">
                            <SectionHeader title="Management Tools" />
                            <ScalePress onClick={() => setShowAttendanceModal(true)} className="w-full">
                                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <QrCode size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Daily Attendance</p>
                                        <p className="text-base font-bold text-gray-900">Attendance & Logs</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                        <ChevronRight size={18} className="text-indigo-600" />
                                    </div>
                                </div>
                            </ScalePress>
                        </div>
                    )}

                    {isMainOwner && shopData?.staff?.length > 0 && (
                        <div className="mb-8">
                            <SectionHeader title="Team Members" />
                            <div className="space-y-3">
                                {shopData.staff.map(staff => (
                                    <div key={staff._id} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                            {staff.profilePicture ? (
                                                <img src={getProcessedImageUri(staff.profilePicture)} alt="Staff" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={16} /></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase">Staff Member</p>
                                            <p className="text-sm font-bold text-gray-900">{staff.name}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveStaff(staff)}
                                            className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isMainOwner && pendingStaff.length > 0 && (
                        <div className="mb-8">
                            <SectionHeader title="Barber Partnerships" />
                            <div className="space-y-4">
                                {pendingStaff.map(staff => (
                                    <div key={staff._id} className="bg-yellow-50/50 border border-yellow-200 rounded-2xl p-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-yellow-900">{staff.name}</h4>
                                                <p className="text-xs font-medium text-yellow-700">Requested to join</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleRejectStaff(staff.barberId?._id)}
                                                className="flex-1 py-2.5 rounded-xl border-2 border-red-100 text-red-500 font-bold text-sm hover:bg-red-50"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={() => handleApproveStaff(staff.barberId?._id)}
                                                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-600"
                                            >
                                                Accept Partner
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- ATTENDANCE MODAL --- */}
                <AnimatePresence>
                    {showAttendanceModal && (
                        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAttendanceModal(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="bg-white w-full max-w-[450px] rounded-t-[32px] sm:rounded-[32px] overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-30">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                                <Activity size={22} className="animate-pulse" />
                                            </div>
                                            <h3 className="text-xl font-[1000] text-gray-900 tracking-tighter">Attendance Hub</h3>
                                        </div>
                                        {/* Premium Seamless Toggle */}
                                        <div className="mt-5 flex bg-gray-100/80 p-1.5 rounded-2xl w-[260px] relative">
                                            <button
                                                onClick={() => setAttendanceViewMode('daily')}
                                                className={`flex-1 py-2 rounded-xl text-[11px] font-[900] tracking-widest transition-all relative z-10 ${attendanceViewMode === 'daily' ? 'text-gray-900' : 'text-gray-400'}`}
                                            >
                                                TODAY
                                            </button>
                                            <button
                                                onClick={() => setAttendanceViewMode('monthly')}
                                                className={`flex-1 py-2 rounded-xl text-[11px] font-[900] tracking-widest transition-all relative z-10 ${attendanceViewMode === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}
                                            >
                                                MONTHLY
                                            </button>
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm border border-gray-100"
                                                animate={{ x: attendanceViewMode === 'daily' ? 0 : '100%' }}
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAttendanceModal(false)}
                                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all border border-gray-100 active:scale-90 flex-shrink-0"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="overflow-y-auto p-6 space-y-8 flex-1 scrollbar-none">
                                    <AnimatePresence mode="wait">
                                        {attendanceViewMode === 'daily' ? (
                                            <motion.div
                                                key="daily"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="space-y-8"
                                            >
                                                {/* Cinematic QR Code Section */}
                                                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50/80 to-indigo-100/30 rounded-[40px] p-8 border border-white shadow-inner relative overflow-hidden group">
                                                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-700" />
                                                    <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-700" />

                                                    <div className="bg-white p-5 rounded-[36px] shadow-2xl mb-6 border-4 border-white active:scale-95 transition-transform cursor-pointer relative">
                                                        <QRCodeCanvas
                                                            value={JSON.stringify({
                                                                type: 'attendance',
                                                                shopId: shopData?._id,
                                                                name: shopData?.name,
                                                                date: new Date().toISOString().split('T')[0]
                                                            })}
                                                            size={190}
                                                            level="H"
                                                            includeMargin={true}
                                                            imageSettings={{
                                                                src: "/logog-circle.png",
                                                                x: undefined, y: undefined, height: 40, width: 40, excavate: true,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="text-center relative z-10">
                                                        <div className="flex items-center justify-center gap-2 mb-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                                                            <p className="text-xs font-[1000] text-indigo-900 tracking-widest uppercase">Scanner Active</p>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] px-8 leading-relaxed opacity-80">
                                                            Staff must scan within the shop geozone to log shift
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Daily Logs List */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-5 px-1">
                                                        <h4 className="text-[13px] font-[1000] text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                                            LIVE LOGS
                                                        </h4>
                                                        <button
                                                            onClick={fetchAttendanceLogs}
                                                            disabled={logsLoading}
                                                            className={`flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-wide hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all ${logsLoading ? 'opacity-50' : 'active:scale-95'}`}
                                                        >
                                                            <RefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} />
                                                            Sync
                                                        </button>
                                                    </div>

                                                    {logsLoading && attendanceLogs.length === 0 ? (
                                                        <div className="space-y-3">
                                                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-3xl animate-pulse" />)}
                                                        </div>
                                                    ) : attendanceLogs.length === 0 ? (
                                                        <div className="bg-gray-50/50 rounded-[32px] p-12 text-center border-2 border-dashed border-gray-100">
                                                            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                                                <Clock className="text-gray-300" size={32} />
                                                            </div>
                                                            <p className="text-sm font-black text-gray-400 uppercase tracking-wider">No logs recorded today</p>
                                                            <p className="text-[10px] text-gray-300 font-bold uppercase mt-1">Updates will appear here as staff scan</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {attendanceLogs.map((log) => (
                                                                <DailyLogItem
                                                                    key={log._id}
                                                                    log={log}
                                                                    getUri={getProcessedImageUri}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="monthly"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center justify-between px-1">
                                                    <h4 className="text-[13px] font-[1000] text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                                        MONTHLY DASHBOARD
                                                    </h4>
                                                    <button
                                                        onClick={fetchMonthlyAttendance}
                                                        disabled={logsLoading}
                                                        className={`flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-wide px-3 py-1.5 rounded-xl transition-all ${logsLoading ? 'opacity-50' : 'active:scale-95'}`}
                                                    >
                                                        <RefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} />
                                                        Refresh
                                                    </button>
                                                </div>

                                                {logsLoading && monthlyLogs.length === 0 ? (
                                                    <div className="space-y-4">
                                                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-[32px] animate-pulse" />)}
                                                    </div>
                                                ) : monthlyLogs.length === 0 ? (
                                                    <div className="bg-gray-50/50 rounded-[32px] p-12 text-center border-2 border-dashed border-gray-100">
                                                        <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                                            <Calendar className="text-gray-300" size={32} />
                                                        </div>
                                                        <p className="text-sm font-black text-gray-400 uppercase tracking-wider">No records found for {new Date().toLocaleDateString('en-US', { month: 'long' })}</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {monthlyLogs.map((report) => (
                                                            <MonthlyReportItem
                                                                key={report.worker._id}
                                                                report={report}
                                                                isExpanded={expandedWorkerId === report.worker._id}
                                                                onToggle={() => setExpandedWorkerId(expandedWorkerId === report.worker._id ? null : report.worker._id)}
                                                                getUri={getProcessedImageUri}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="p-6 bg-white border-t border-gray-100 flex items-center gap-4 sticky bottom-0 z-30">
                                    <button
                                        onClick={() => setShowAttendanceModal(false)}
                                        className="flex-1 py-4 bg-[#1C1C1E] text-white rounded-2xl font-black text-[13px] tracking-widest shadow-xl shadow-gray-200 active:scale-[0.98] transition-all uppercase"
                                    >
                                        Dismiss Hub
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ListedCardScreen;
