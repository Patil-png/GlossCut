import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ArrowLeft, Store, Phone, Tag, ChevronRight, Navigation,
    WifiOff, AlertCircle, CheckCircle, ShieldCheck, Info, Camera, Trash2, Sparkles, Zap, User, Star, Loader, Settings, Clock, QrCode, X, Calendar,
    Activity, ChevronDown, RefreshCw, Navigation2, Plus, Loader2, Mail, Lock, UserPlus
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

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Helper to get closing minutes for a specific date
    const getClosingMinutes = (dateStr) => {
        if (!operatingHours) return null;
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
                const openTime = timeToMins(operatingHours[days[new Date(targetDate).getDay()]]?.open) || 0;

                // If window spans midnight
                if (dayClosingMinutes < openTime) {
                    const normalizedOut = outTime < openTime ? outTime + 1440 : outTime;
                    const normalizedClose = dayClosingMinutes + 1440;
                    if (normalizedOut > normalizedClose) outTime = dayClosingMinutes;
                } else {
                    if (outTime > dayClosingMinutes) outTime = dayClosingMinutes;
                }
            }

            if (outTime !== null) {
                let duration = 0;
                if (outTime < inTime) duration = (outTime + 1440) - inTime;
                else duration = outTime - inTime;

                // Safety check: skip crazy long durations (e.g. > 20h) for same-day logic
                if (duration < 1200) totalMinutes += duration;
            }
            inTime = null;
        }
    });

    if (inTime !== null) {
        const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const nowMins = istNow.getHours() * 60 + istNow.getMinutes();
        const istDateStr = istNow.toLocaleDateString('en-CA');

        // Check if the targetDate shift is currently "Active"
        const getIsCurrentlyInWindow = () => {
            if (!operatingHours) return false;
            const dayIdxToday = istNow.getDay();
            const openMinsToday = timeToMins(operatingHours[days[dayIdxToday]]?.open) || 540;

            const yesterdayIst = new Date(istNow);
            yesterdayIst.setDate(yesterdayIst.getDate() - 1);
            const yesterdayIstStr = yesterdayIst.toLocaleDateString('en-CA');

            // Determine what the "Business Today" date string is
            const businessTodayStr = nowMins < openMinsToday ? yesterdayIstStr : istDateStr;

            return targetDate === businessTodayStr;
        };

        if (getIsCurrentlyInWindow()) {
            let duration = 0;
            if (nowMins < inTime) duration = (nowMins + 1440) - inTime;
            else duration = nowMins - inTime;
            if (duration < 1200) totalMinutes += duration;
        } else {
            // It's a past shift with a missing OUT -> Auto-Logout at closing time
            if (dayClosingMinutes !== null) {
                let duration = 0;
                if (dayClosingMinutes < inTime) duration = (dayClosingMinutes + 1440) - inTime;
                else duration = dayClosingMinutes - inTime;
                if (duration < 1200) totalMinutes += duration;
            } else {
                return "MISSING OUT";
            }
        }
    }

    if (totalMinutes === 0 && inTime === null) return null;
    if (totalMinutes < 0) return null;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
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

    let bg = 'rgba(15, 23, 42, 0.95)'; // dark slate fallback
    let icon = <Sparkles size={16} color="#fff" />;

    if (type === 'success') { bg = 'rgba(16, 185, 129, 0.95)'; icon = <CheckCircle size={16} color="#fff" />; }
    else if (type === 'error') { bg = 'rgba(239, 68, 68, 0.95)'; icon = <AlertCircle size={16} color="#fff" />; }
    else if (type === 'warning') { bg = 'rgba(245, 158, 11, 0.95)'; icon = <Zap size={16} color="#fff" />; }

    return (
        <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none"
        >
            <div
                className="flex items-center gap-3 px-5 py-3.5 rounded-[20px] shadow-xl backdrop-blur-md min-w-[280px] pointer-events-auto border border-white/10"
                style={{ backgroundColor: bg }}
            >
                <div className="flex-shrink-0">{icon}</div>
                <span className="text-white font-black text-xs tracking-wider uppercase flex-1">{message}</span>
            </div>
        </motion.div>
    );
};

const ScalePress = ({ onClick, children, disabled, className }) => (
    <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={!disabled ? onClick : undefined}
        className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        {children}
    </motion.div>
);

const ModernHeader = ({ title, subtitle, onBack }) => (
    <header className="sticky top-0 z-50 bg-[#F8FAFC]/85 backdrop-blur-md border-b border-slate-100 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
            <button
                onClick={onBack}
                className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center active:scale-95 hover:bg-slate-50 transition-all cursor-pointer text-slate-800"
            >
                <ArrowLeft size={18} strokeWidth={3} className="text-slate-700" />
            </button>
            <div className="flex flex-col items-center text-center">
                <h1 className="text-base font-[900] text-[#1C1C1E] uppercase tracking-tight leading-none">{title}</h1>
                {subtitle && (
                    <p className="text-indigo-600 text-[8px] font-black tracking-[0.2em] mt-1.5 uppercase leading-none">
                        {subtitle}
                    </p>
                )}
            </div>
            <div className="w-10" />
        </div>
    </header>
);

const SectionHeader = ({ title, isLive = false }) => (
    <div className="flex items-center w-full mb-5 px-1.5">
        {/* Header Pill */}
        <div className="bg-[#F8F9FA] px-4 py-1.5 rounded-full border border-black/[0.06] shadow-[0_2px_4px_rgba(0,0,0,0.03)] flex items-center gap-2 mr-2.5 flex-shrink-0">
            <h2 className="text-[10px] font-[900] text-[#1A1A1A] uppercase tracking-[0.1em]">{title}</h2>
            {isLive && (
                <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">LIVE</span>
                </div>
            )}
        </div>
        {/* Header Line */}
        <div className="flex-1 h-[1.5px] bg-black/[0.08] rounded-full" />
    </div>
);

const DetailRow = ({ icon: Icon, label, value, onClick, canEdit = true, isLast = false }) => {
    let gradient = "from-indigo-500 to-indigo-650";
    let textLight = "text-indigo-600";
    let bgLight = "bg-indigo-50/50";
    let glowColor = "rgba(99, 102, 241, 0.08)";

    const lowerLabel = (label || '').toLowerCase();
    if (lowerLabel.includes('name')) {
        gradient = "from-amber-400 via-amber-500 to-orange-500";
        textLight = "text-amber-600";
        bgLight = "bg-amber-50/50";
        glowColor = "rgba(245, 158, 11, 0.08)";
    } else if (lowerLabel.includes('location') || lowerLabel.includes('visibility') || lowerLabel.includes('map') || lowerLabel.includes('presence')) {
        gradient = "from-emerald-400 to-teal-500";
        textLight = "text-emerald-600";
        bgLight = "bg-emerald-50/50";
        glowColor = "rgba(16, 185, 129, 0.08)";
    } else if (lowerLabel.includes('contact')) {
        gradient = "from-blue-500 to-sky-500";
        textLight = "text-blue-600";
        bgLight = "bg-blue-50/50";
        glowColor = "rgba(59, 130, 246, 0.08)";
    } else if (lowerLabel.includes('category')) {
        gradient = "from-purple-500 to-indigo-650";
        textLight = "text-purple-600";
        bgLight = "bg-purple-50/50";
        glowColor = "rgba(139, 92, 246, 0.08)";
    } else if (lowerLabel.includes('media') || lowerLabel.includes('portfolio')) {
        gradient = "from-rose-500 to-pink-500";
        textLight = "text-rose-600";
        bgLight = "bg-rose-50/50";
        glowColor = "rgba(244, 63, 94, 0.08)";
    } else if (lowerLabel.includes('hours') || lowerLabel.includes('timing')) {
        gradient = "from-violet-500 to-purple-650";
        textLight = "text-violet-600";
        bgLight = "bg-violet-50/50";
        glowColor = "rgba(139, 92, 246, 0.08)";
    } else if (lowerLabel.includes('attendance')) {
        gradient = "from-indigo-500 to-indigo-650";
        textLight = "text-indigo-600";
        bgLight = "bg-indigo-50/50";
        glowColor = "rgba(99, 102, 241, 0.08)";
    }

    return (
        <div 
            onClick={canEdit ? onClick : undefined}
            className={`flex items-center justify-between py-4 ${!isLast ? 'border-b border-slate-100' : ''} ${canEdit ? 'cursor-pointer hover:bg-slate-50/40' : ''} transition-all duration-200 px-3 first:rounded-t-[28px] last:rounded-b-[28px] group relative overflow-hidden`}
        >
            {canEdit && (
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            )}
            
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                <div 
                    className={`w-10 h-10 rounded-[14px] bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-white shadow-md`}
                    style={{ boxShadow: `0 3px 10px ${glowColor}` }}
                >
                    <Icon size={16} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">{label}</p>
                    <div className="text-[13px] font-extrabold text-slate-800 truncate leading-tight">{value || "Not Configured"}</div>
                </div>
            </div>
            {canEdit ? (
                <div className={`w-7 h-7 rounded-lg ${bgLight} flex items-center justify-center transition-colors group-hover:bg-opacity-100 flex-shrink-0`}>
                    <ChevronRight size={14} strokeWidth={3} className={textLight} />
                </div>
            ) : (
                <div className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shadow-sm flex items-center gap-1 flex-shrink-0">
                    <CheckCircle size={8} className="text-emerald-500 fill-emerald-500 text-white" />
                    <span className="text-[7px] font-black text-emerald-600 tracking-wider uppercase">OFFICIAL</span>
                </div>
            )}
        </div>
    );
};

const StaffRow = ({ staff, onRemove, isLast, isMainOwner }) => {
    const avatar = getProcessedImageUri(staff.profilePicture, null);
    return (
        <div className={`flex items-center justify-between py-4 ${!isLast ? 'border-b border-slate-100' : ''} transition-all duration-200 px-3 first:rounded-t-[28px] last:rounded-b-[28px] group relative overflow-hidden`}>
            {isMainOwner && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-indigo-500 to-indigo-650 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                <div className="w-10 h-10 rounded-[14px] overflow-hidden border border-slate-100 shadow-inner flex-shrink-0 relative bg-slate-50 flex items-center justify-center text-slate-400">
                    {avatar ? (
                        <img src={avatar} alt={staff.name} className="w-full h-full object-cover" />
                    ) : (
                        <User size={16} strokeWidth={2.5} />
                    )}
                    <div className="absolute inset-0 border border-indigo-500/10 rounded-[14px]" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">Staff Member</p>
                    <div className="text-[13px] font-extrabold text-slate-800 truncate leading-tight uppercase tracking-tight">{staff.name}</div>
                </div>
            </div>
            {isMainOwner && (
                <button
                    onClick={() => onRemove(staff)}
                    className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-500 hover:text-white flex items-center justify-center text-red-500 active:scale-95 transition-all shadow-inner border border-red-100/30 flex-shrink-0"
                >
                    <Trash2 size={14} strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
};

const ShopCardPreview = ({ shopData }) => {
    const coverImage = getProcessedImageUri(shopData?.image || shopData?.owner?.profilePicture, null);
    const isAvailable = shopData?.isAvailable !== false;

    return (
        <div className="bg-white rounded-[24px] mb-4 border border-black/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.06)] relative overflow-hidden group transition-all duration-300 hover:shadow-2xl">
            {/* Image Area */}
            <div className="h-[225px] relative rounded-t-[24px] overflow-hidden bg-slate-100">
                {coverImage ? (
                    <img src={coverImage} alt={shopData?.name || "Shop"} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-2">
                        <Store size={40} className="text-slate-350" />
                        <span className="text-[9px] font-black tracking-widest uppercase text-slate-400">No Cover Image Uploaded</span>
                    </div>
                )}
                
                {/* Image Overlay */}
                <div className="absolute inset-0 bg-black/10 pointer-events-none z-10" />

                {/* Top-Right: Status Badge */}
                <div className="absolute top-3 right-3 z-20">
                    <div className={`flex flex-row items-center px-[10px] py-[6px] rounded-[20px] border shadow-sm ${isAvailable ? 'bg-[#FFF] border-[#F1F5F9]' : 'bg-[#000] border-transparent'}`}>
                        {/* Pulse Dot */}
                        <div className="w-2 h-2 mr-1.5 flex items-center justify-center relative">
                            {isAvailable && (
                                <div className="absolute w-2 h-2 rounded-full bg-[#10B981] animate-ping opacity-35" />
                            )}
                            <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-[#10B981]' : 'bg-[#64748B]'}`} />
                        </div>
                        <span className={`text-[10px] font-[800] uppercase tracking-[0.5px] ${isAvailable ? 'text-black' : 'text-white'}`}>
                            {isAvailable ? 'Open Now' : 'Closed'}
                        </span>
                    </div>
                </div>

                {/* Top-Left: Featured & Category Badges */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-[6px] items-start">
                    {(shopData?.isPriority || shopData?.listingTier === 'premium') && (
                        <div className="flex flex-row items-center bg-[#F59E0B] px-2 py-1 rounded-[12px] text-white gap-1">
                            <Sparkles size={10} className="text-white fill-white" />
                            <span className="text-white text-[9px] font-[900] ml-1 tracking-[1px]">FEATURED</span>
                        </div>
                    )}
                    <div className="bg-[#0F172A] border border-white/10 px-[10px] py-[5px] rounded-[6px] self-start">
                        <span className="text-[9px] font-[900] text-white tracking-[1.2px] uppercase">
                            {shopData?.category?.toUpperCase() || 'SALON'}
                        </span>
                    </div>
                </div>

                {/* Bottom-Left: Verified Badge */}
                {shopData?.isVerified && (
                    <div className="absolute bottom-[12px] left-[12px] z-20 flex flex-row items-center bg-[#3B82F6] px-2 py-1 rounded-[12px]">
                        <ShieldCheck size={12} className="text-white" />
                        <span className="text-white text-[10px] font-[800] ml-1">Verified</span>
                    </div>
                )}

                {/* Bottom-Right: Distance Badge */}
                {shopData?.location?.coordinates && (
                    <div className="absolute bottom-[10px] right-[10px] z-20 flex flex-row items-center bg-black/65 px-2 py-1 rounded-[20px] gap-1 text-white">
                        <Navigation size={10} className="text-white fill-white" />
                        <span className="text-white text-[10px] font-[800]">~1.2 km</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-4">
                <div className="flex justify-between items-center mb-0.5">
                    <h3 className="text-[19px] font-[800] tracking-[-0.5px] text-slate-900 flex-1 mr-2.5 truncate uppercase">
                        {shopData?.name || "Loading..."}
                    </h3>
                    <div className="flex items-center bg-slate-100 px-2 py-1 rounded-[8px] gap-1 ml-2">
                        <Star size={12} className="text-yellow-500 fill-[#F59E0B]" />
                        <span className="text-xs font-[800] text-slate-800 ml-1">
                            {shopData?.rating > 0 ? shopData.rating.toFixed(1) : 'New'}
                        </span>
                    </div>
                </div>
                <div className="flex items-start gap-1 text-slate-500">
                    <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[13px] text-slate-500 ml-[6px] flex-1 leading-[18px] truncate">
                        {shopData?.address || "Address pending"}
                    </p>
                </div>
            </div>
        </div>
    );
};


const DailyLogItem = React.memo(({ log, getUri, dark = false }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-[24px] p-4 flex items-center justify-between transition-colors group relative overflow-hidden shadow-sm ${
            dark 
                ? 'bg-[#131A2D] border-white/5 hover:border-indigo-500/30' 
                : 'bg-white border-slate-100 hover:border-indigo-100'
        }`}
    >
        {/* Glow Hover Indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-12 h-12 rounded-2xl overflow-hidden border flex-shrink-0 shadow-inner ${
                dark ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-100'
            }`}>
                {log.workerId?.profilePicture ? (
                    <img src={getUri(log.workerId.profilePicture)} className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center ${dark ? 'text-slate-500 bg-slate-900' : 'text-slate-350 bg-slate-50'}`}>
                        <User size={20} />
                    </div>
                )}
            </div>
            <div className="min-w-0">
                <p className={`text-[14px] font-black leading-tight mb-1.5 group-hover:text-indigo-400 transition-colors uppercase tracking-tight truncate pr-2 ${
                    dark ? 'text-slate-200' : 'text-slate-800'
                }`}>
                    {log.workerId?.name || "Staff Member"}
                </p>
                <div className="flex flex-wrap gap-1.5 items-center">
                    {log.logs.map((pulse, i) => (
                        <span key={i} className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase border tracking-wider shadow-sm ${
                            pulse.type === 'in' 
                                ? (dark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100') 
                                : (dark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-100')
                        }`}>
                            {pulse.type} {pulse.time}
                        </span>
                    ))}
                    {calculateDailyDuration(log.logs, log.date, log.shopId?.operatingHours) && (
                        calculateDailyDuration(log.logs, log.date, log.shopId?.operatingHours) === 'MISSING OUT' ? (
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border animate-pulse uppercase tracking-wider ${
                                dark ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-red-500 bg-red-50 border-red-100'
                            }`}>
                                Missing OUT
                            </span>
                        ) : (
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border tracking-wider ${
                                dark ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' : 'text-indigo-500 bg-indigo-50/50 border-indigo-105/50'
                            }`}>
                                TOTAL: {calculateDailyDuration(log.logs, log.date, log.shopId?.operatingHours)}
                            </span>
                        )
                    )}
                </div>
            </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
            <div className="flex items-center justify-end gap-1.5 mb-1">
                {log.logs[log.logs.length - 1].type === 'in' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Shift Status</p>
            </div>
            <p className={`text-[10px] font-black tracking-widest uppercase ${
                log.logs[log.logs.length - 1].type === 'in' ? 'text-emerald-500' : 'text-slate-400'
            }`}>
                {log.logs[log.logs.length - 1].type === 'in' ? 'LOGGED IN' : 'OFF DUTY'}
            </p>
        </div>
    </motion.div>
));

const MonthlyReportItem = React.memo(({ report, isExpanded, onToggle, getUri, dark = false }) => (
    <div className={`border rounded-[28px] overflow-hidden shadow-sm hover:shadow-md transition-all ${
        dark ? 'bg-[#131A2D] border-white/5' : 'bg-white border-slate-100'
    }`}>
        <div
            onClick={onToggle}
            className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${
                dark ? 'active:bg-slate-900' : 'active:bg-slate-50'
            }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-13 h-13 rounded-[18px] flex items-center justify-center overflow-hidden border shadow-inner flex-shrink-0 ${
                    dark ? 'bg-slate-900/50 border-white/5' : 'bg-indigo-50/30 border-slate-100'
                }`}>
                    {report.worker.profilePicture ? (
                        <img src={getUri(report.worker.profilePicture)} className="w-full h-full object-cover" />
                    ) : (
                        <User size={22} className={dark ? 'text-indigo-400' : 'text-indigo-455'} />
                    )}
                </div>
                <div>
                    <h5 className={`text-[15px] font-black tracking-tight leading-tight uppercase ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{report.worker.name}</h5>
                    <div className="flex items-center gap-2 mt-1.5">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                            dark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                            <Activity size={9} />
                            <span className="text-[8px] font-black uppercase tracking-wider">{report.totalDays} Active Days</span>
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Team Stats</span>
                    </div>
                </div>
            </div>
            <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                    dark ? 'bg-slate-900 text-slate-400 border-white/5' : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}
            >
                <ChevronDown size={18} strokeWidth={2.5} />
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
                    <div className={`h-px ${dark ? 'bg-white/5' : 'bg-slate-50'}`} />
                    <p className="text-[9px] font-black text-slate-450 uppercase tracking-[0.25em] mb-2 text-center">Daily Shift Timeline</p>
                    <div className={`grid gap-3 pl-2 border-l-2 ml-2 ${dark ? 'border-white/5' : 'border-slate-100/70'}`}>
                        {report.days.slice().reverse().map((day, dIdx) => (
                            <motion.div
                                key={dIdx}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: dIdx * 0.05 }}
                                className={`relative flex justify-between items-start p-4 rounded-2xl border transition-colors ${
                                    dark 
                                        ? 'bg-slate-950/40 border-white/5 hover:bg-slate-950/80' 
                                        : 'bg-slate-50/50 border-slate-100 hover:bg-white'
                                }`}
                            >
                                {/* Timeline Dot Overlay */}
                                <div className="absolute left-[-15px] top-[22px] w-2 h-2 rounded-full bg-indigo-400 border-2 border-white shadow-sm" />
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${dark ? 'text-slate-450' : 'text-slate-650'}`}>
                                            <Calendar size={11} className="text-indigo-400" />
                                            {new Date(day.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                        {calculateDailyDuration(day.logs, day.date, report.shopOperatingHours) && (
                                            calculateDailyDuration(day.logs, day.date, report.shopOperatingHours) === 'MISSING OUT' ? (
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-wider animate-pulse ${
                                                    dark ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-red-500 bg-red-50 border-red-100'
                                                }`}>
                                                    Missing OUT
                                                </span>
                                            ) : (
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded border tracking-wider ${
                                                    dark ? 'text-indigo-400 bg-slate-900 border-white/5 shadow-sm' : 'text-indigo-650 bg-white border-indigo-100 shadow-sm'
                                                }`}>
                                                    {calculateDailyDuration(day.logs, day.date, report.shopOperatingHours)}
                                                </span>
                                            )
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {day.logs.map((log, lIdx) => (
                                            <span key={lIdx} className={`text-[8px] font-black px-2 py-0.5 rounded border shadow-sm ${
                                                dark 
                                                    ? 'bg-slate-900 text-slate-350 border-white/5' 
                                                    : 'bg-white text-slate-600 border-slate-100'
                                            } ${log.type === 'in' ? (dark ? 'text-emerald-450 border-emerald-500/10' : 'text-emerald-600 border-emerald-100') : (dark ? 'text-red-450 border-red-500/10' : 'text-red-650 border-red-100')}`}>
                                                {log.type.toUpperCase()} • {log.time}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {day.logs[day.logs.length - 1].type === 'in' && (
                                    <div className="flex flex-col items-center gap-1 ml-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
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
    const multiFileInputRef = useRef(null);

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
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [addingStaff, setAddingStaff] = useState(false);
    const [newStaffData, setNewStaffData] = useState({ name: '', email: '', phone: '', password: '' });
    const [formErrors, setFormErrors] = useState({});

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

    const handleMultiImageUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        const currentCount = shopData?.shopImages?.length || 0;
        if (currentCount + files.length > 5) {
            showToast("Max 5 images allowed", "error");
            return;
        }

        const formData = new FormData();
        files.forEach(file => {
            formData.append('shopImages', file);
        });

        try {
            showToast(`Uploading ${files.length} images...`, "info");
            const res = await api.post('/api/shop/upload-shop-images', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setShopData(prev => ({ ...prev, shopImages: res.data.shopImages }));
                showToast("Gallery updated successfully!", "success");
            }
        } catch (err) {
            console.error("Multi-upload error:", err);
            showToast(err.response?.data?.msg || "Upload failed", "error");
        } finally {
            if (multiFileInputRef.current) multiFileInputRef.current.value = "";
        }
    };

    const handleDeleteShopImage = async (index) => {
        if (!window.confirm("Delete this image from gallery?")) return;

        try {
            showToast("Deleting image...", "info");
            const res = await api.delete(`/api/shop/delete-shop-image/${index}`);
            if (res.data.success) {
                setShopData(prev => ({ ...prev, shopImages: res.data.shopImages }));
                showToast("Image deleted", "success");
            }

        } catch (err) {
            showToast("Failed to delete image", "error");
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

    const handleCreateStaff = async () => {
        const { name, email, phone, password } = newStaffData;

        // 1. Basic empty check
        if (!name || !email || !phone || !password) {
            return showToast("Please fill all fields", "warning");
        }

        // 2. Email Format Validation
        if (!validateEmail(email)) {
            setFormErrors(prev => ({ ...prev, email: "Invalid email format" }));
            return showToast("Correct the email format", "warning");
        }

        // 3. Phone Digit Check (must be 10 digits)
        if (phone.length !== 10) {
            setFormErrors(prev => ({ ...prev, phone: "Phone must be 10 digits" }));
            return showToast("Phone must be exactly 10 digits", "warning");
        }

        setAddingStaff(true);
        setFormErrors({});
        try {
            // Send full details including the specific shopId we are viewing
            await api.post('/api/shop/staff/create', {
                ...newStaffData,
                phone: `+91${phone}`,
                shopId: shopData._id // <--- Explicit Linking
            });
            showToast("Staff account created!", "success");
            setShowAddStaffModal(false);
            setNewStaffData({ name: '', email: '', phone: '', password: '' });
            fetchShopData();
        } catch (err) {
            const data = err.response?.data;
            if (data?.field) {
                setFormErrors({ [data.field]: data.msg });
            } else {
                showToast(data?.msg || "Failed to create staff", "error");
            }
        } finally {
            setAddingStaff(false);
        }
    };

    const handleCheckExists = async (field, value) => {
        if (!value) return;

        // Validation before check
        if (field === 'email' && !validateEmail(value)) {
            setFormErrors(prev => ({ ...prev, email: "Invalid format" }));
            return;
        }
        if (field === 'phone' && value.length < 10) {
            return; // Don't check until it's 10 digits
        }

        try {
            const queryValue = field === 'phone' ? `+91${value}` : value;
            const res = await api.get(`/api/shop/staff/check-exists?${field}=${encodeURIComponent(queryValue)}`);
            if (res.data.exists) {
                setFormErrors(prev => ({ ...prev, [field]: res.data.msg }));
            } else {
                setFormErrors(prev => ({ ...prev, [field]: null }));
            }
        } catch (err) {
            console.error("Error checking field existence:", err);
        }
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
        <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
            <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                <Store size={24} className="text-amber-500 absolute animate-pulse" />
            </div>
            <span className="text-[10px] font-black tracking-[0.25em] text-slate-400 uppercase">GLOSSCUT PRESENT</span>
        </div>
    );

    const isMainOwner = shopData?.isMainOwner;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 flex justify-center">
            <div className="w-full max-w-[450px] bg-[#F8FAFC] min-h-screen shadow-[0_0_50px_rgba(0,0,0,0.06)] relative border-x border-slate-100/80">
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
                            className="mb-8 p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-[28px] shadow-[0_8px_32px_rgba(245,158,11,0.05)] flex items-start gap-4 relative overflow-hidden backdrop-blur-sm"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-505 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-amber-500/20 relative">
                                <Sparkles size={20} className="animate-pulse" />
                            </div>
                            <div className="relative z-10 flex-1">
                                <h4 className="text-xs font-black text-amber-800 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                                    Updates Under Review
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                                </h4>
                                <p className="text-[11px] leading-relaxed text-slate-600 font-medium italic">
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
                        <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden p-1">
                            <DetailRow
                                icon={Store}
                                label="Shop Name"
                                value={shopData?.name}
                                onClick={() => navigate('/edit-shop-name', { state: { currentName: shopData?.name } })}
                                canEdit={isMainOwner}
                            />
                            <DetailRow
                                icon={MapPin}
                                label="Location"
                                value={shopData?.address}
                                onClick={() => navigate('/edit-shop-address', { state: { currentAddress: shopData?.address } })}
                                canEdit={isMainOwner}
                            />
                            <DetailRow
                                icon={Phone}
                                label="Contact"
                                value={shopData?.phone}
                                onClick={() => navigate('/edit-shop-phone', { state: { currentPhone: shopData?.phone } })}
                                canEdit={isMainOwner}
                            />
                            <DetailRow
                                icon={Tag}
                                label="Category"
                                value={shopData?.category || "Barber Shop"}
                                onClick={() => navigate('/edit-category', { state: { currentCategory: shopData?.category } })}
                                canEdit={isMainOwner}
                            />
                            <DetailRow
                                icon={Camera}
                                label="Portfolio Media"
                                value="Update Cover Image"
                                onClick={() => fileInputRef.current?.click()}
                                canEdit={isMainOwner}
                            />
                            <DetailRow
                                icon={Clock}
                                label="Operating Hours"
                                value="Configure Timing"
                                onClick={() => navigate('/edit-operating-hours', { state: { currentOperatingHours: shopData?.operatingHours } })}
                                canEdit={isMainOwner}
                                isLast={true}
                            />
                        </div>
                    </div>

                    {isMainOwner && (
                        <div className="mb-8">
                            <SectionHeader title="Shop Gallery" />
                            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group/gallery">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Visual Portfolio</p>
                                        <p className="text-sm font-black text-slate-800">Showcase your shop ({shopData?.shopImages?.length || 0}/5)</p>
                                    </div>
                                    <button
                                        disabled={(shopData?.shopImages?.length || 0) >= 5}
                                        onClick={() => multiFileInputRef.current?.click()}
                                        className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-650 flex items-center justify-center text-white active:scale-95 transition-all shadow-md shadow-indigo-500/10 disabled:opacity-20 disabled:pointer-events-none hover:shadow-lg hover:shadow-indigo-500/25"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                    <input
                                        type="file"
                                        ref={multiFileInputRef}
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={handleMultiImageUpload}
                                    />
                                </div>

                                {shopData?.shopImages?.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        {shopData.shopImages.map((img, idx) => (
                                            <div key={idx} className="aspect-square rounded-[20px] overflow-hidden relative group/item border border-slate-100 shadow-sm bg-slate-950">
                                                <img
                                                    src={getProcessedImageUri(img)}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110 group-hover/item:opacity-80"
                                                    alt={`Gallery ${idx}`}
                                                />
                                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    <button
                                                        onClick={() => handleDeleteShopImage(idx)}
                                                        className="w-9 h-9 bg-white/90 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 active:scale-90 transition-all border border-slate-100"
                                                    >
                                                        <Trash2 size={15} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(shopData?.shopImages?.length || 0) < 5 && (
                                            <button
                                                onClick={() => multiFileInputRef.current?.click()}
                                                className="aspect-square rounded-[20px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-1.5 text-slate-350 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/20 active:scale-95 transition-all"
                                            >
                                                <Camera size={22} className="opacity-80" />
                                                <span className="text-[8px] font-black uppercase tracking-wider">Add More</span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => multiFileInputRef.current?.click()}
                                        className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[24px] cursor-pointer hover:bg-indigo-50/10 hover:border-indigo-300 transition-all group/empty"
                                    >
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-3 border border-slate-100 shadow-inner group-hover/empty:scale-110 transition-transform">
                                            <Camera size={24} className="text-slate-400 group-hover/empty:text-indigo-500 transition-colors" />
                                        </div>
                                        <p className="text-xs font-black text-slate-600 group-hover/empty:text-indigo-650 transition-colors uppercase tracking-wide">No gallery images yet</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Upload up to 5 portfolio photos</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mb-8">
                        <SectionHeader title="Visibility & Management" />
                        <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden p-1">
                            <DetailRow
                                icon={Navigation}
                                label="Visibility Status"
                                value={
                                    <div className="flex items-center gap-2">
                                        <span className={shopData?.location?.coordinates ? 'text-emerald-600' : 'text-slate-800'}>
                                            {shopData?.location?.coordinates ? "Marked at live location" : "Pin Your Location"}
                                        </span>
                                        {shopData?.location?.coordinates ? (
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                        ) : (
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                            </span>
                                        )}
                                    </div>
                                }
                                onClick={handlePinLocation}
                                canEdit={isMainOwner}
                                isLast={!isMainOwner}
                            />
                            {isMainOwner && (
                                <DetailRow
                                    icon={QrCode}
                                    label="Daily Attendance"
                                    value="Attendance & Logs"
                                    onClick={() => setShowAttendanceModal(true)}
                                    canEdit={isMainOwner}
                                    isLast={true}
                                />
                            )}
                        </div>
                    </div>

                    {isMainOwner && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <SectionHeader title="Team Members" />
                                <button
                                    onClick={() => setShowAddStaffModal(true)}
                                    className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 active:scale-90 transition-transform"
                                >
                                    <Plus size={18} strokeWidth={3} />
                                </button>
                            </div>
                            <div>
                                {shopData?.staff?.length > 0 ? (
                                    <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden p-1">
                                        {shopData.staff.map((staff, idx) => (
                                            <StaffRow
                                                key={staff._id}
                                                staff={staff}
                                                onRemove={handleRemoveStaff}
                                                isLast={idx === shopData.staff.length - 1}
                                                isMainOwner={isMainOwner}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white border border-slate-100 rounded-[28px] p-8 text-center shadow-sm hover:shadow-md transition-shadow duration-200">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No staff members yet</p>
                                        <button
                                            onClick={() => setShowAddStaffModal(true)}
                                            className="mt-4 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors uppercase tracking-widest border border-indigo-100"
                                        >
                                            + Add your first member
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {isMainOwner && pendingStaff.length > 0 && (
                        <div className="mb-8 animate-fadeIn">
                            <SectionHeader title="Barber Partnerships" />
                            <div className="space-y-4">
                                {pendingStaff.map(staff => (
                                    <div key={staff._id} className="bg-gradient-to-br from-amber-50/80 via-amber-50/45 to-transparent border border-amber-200 rounded-[28px] p-5 shadow-[0_8px_30px_rgba(245,158,11,0.03)] backdrop-blur-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
                                        <div className="flex items-center gap-4.5 mb-5">
                                            <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 flex-shrink-0">
                                                <User size={20} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight">{staff.name}</h4>
                                                <p className="text-[10px] font-black text-amber-700 tracking-wider uppercase mt-1">Requested to join</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleRejectStaff(staff.barberId?._id)}
                                                className="flex-1 py-3.5 rounded-2xl bg-white border border-red-200 text-red-500 font-black text-xs tracking-widest uppercase shadow-sm active:scale-98 hover:bg-red-50/50 hover:border-red-350 transition-all"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={() => handleApproveStaff(staff.barberId?._id)}
                                                className="flex-[1.5] py-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-black text-xs tracking-widest uppercase shadow-lg shadow-emerald-500/20 active:scale-98 hover:shadow-xl hover:shadow-emerald-500/35 transition-all"
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
                                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            />
                            {/* Futuristic Dark Glass layout */}
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="bg-[#0B0F19] text-white w-full max-w-[450px] rounded-t-[36px] sm:rounded-[36px] overflow-hidden relative z-10 flex flex-col max-h-[90vh] border-t sm:border border-white/10 shadow-[0_-15px_40px_rgba(0,0,0,0.5)]"
                            >
                                <style>{`
                                    @keyframes scanLaser {
                                        0% { top: 0%; opacity: 0; }
                                        10% { opacity: 1; }
                                        90% { opacity: 1; }
                                        100% { top: 100%; opacity: 0; }
                                    }
                                    .laser-line {
                                        animation: scanLaser 3s linear infinite;
                                        background: linear-gradient(to right, transparent, rgba(239, 68, 68, 0.8), rgba(239, 68, 68, 1), rgba(239, 68, 68, 0.8), transparent);
                                        height: 3px;
                                        width: 100%;
                                        position: absolute;
                                        z-index: 10;
                                        box-shadow: 0 0 15px rgba(239, 68, 68, 0.9), 0 0 5px rgba(239, 68, 68, 0.6);
                                    }
                                    .scanner-corner {
                                        position: absolute;
                                        width: 20px;
                                        height: 20px;
                                        border-color: rgba(99, 102, 241, 0.8);
                                        border-style: solid;
                                        z-index: 10;
                                    }
                                    .scanner-tl { top: 0; left: 0; border-width: 4px 0 0 4px; border-top-left-radius: 12px; }
                                    .scanner-tr { top: 0; right: 0; border-width: 4px 4px 0 0; border-top-right-radius: 12px; }
                                    .scanner-bl { bottom: 0; left: 0; border-width: 0 0 4px 4px; border-bottom-left-radius: 12px; }
                                    .scanner-br { bottom: 0; right: 0; border-width: 0 4px 4px 0; border-bottom-right-radius: 12px; }
                                `}</style>

                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0B0F19]/80 backdrop-blur-xl sticky top-0 z-30">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                                <Activity size={20} className="animate-pulse" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black tracking-tight uppercase">Attendance Hub</h3>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Shop ID: {shopData?._id || 'Official'}</p>
                                            </div>
                                        </div>
                                        {/* Toggle tab */}
                                        <div className="mt-5 flex bg-white/5 p-1 rounded-2xl w-[260px] relative border border-white/5">
                                            <button
                                                onClick={() => setAttendanceViewMode('daily')}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all relative z-10 uppercase ${attendanceViewMode === 'daily' ? 'text-slate-900' : 'text-slate-400'}`}
                                            >
                                                TODAY
                                            </button>
                                            <button
                                                onClick={() => setAttendanceViewMode('monthly')}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all relative z-10 uppercase ${attendanceViewMode === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}
                                            >
                                                MONTHLY
                                            </button>
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm"
                                                animate={{ x: attendanceViewMode === 'daily' ? 0 : '100%' }}
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAttendanceModal(false)}
                                        className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all border border-white/10 active:scale-90 flex-shrink-0"
                                    >
                                        <X size={18} strokeWidth={2.5} />
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
                                                {/* Cinematic QR Scanner Frame */}
                                                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950/40 via-slate-900/40 to-transparent rounded-[36px] p-8 border border-white/5 shadow-inner relative overflow-hidden group">
                                                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                                                    <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                                                    <div className="bg-white p-5 rounded-[28px] shadow-2xl mb-6 relative active:scale-95 transition-transform cursor-pointer overflow-hidden border border-slate-800">
                                                        <div className="absolute inset-2 border-2 border-dashed border-indigo-200/50 rounded-[20px] pointer-events-none" />
                                                        
                                                        {/* Scanner HUD Overlay */}
                                                        <div className="absolute inset-1 pointer-events-none">
                                                            <div className="scanner-corner scanner-tl" />
                                                            <div className="scanner-corner scanner-tr" />
                                                            <div className="scanner-corner scanner-bl" />
                                                            <div className="scanner-corner scanner-br" />
                                                            <div className="laser-line" />
                                                        </div>

                                                        <QRCodeCanvas
                                                            value={JSON.stringify({
                                                                type: 'attendance',
                                                                shopId: shopData?._id,
                                                                name: shopData?.name,
                                                                date: new Date().toISOString().split('T')[0]
                                                            })}
                                                            size={170}
                                                            level="H"
                                                            includeMargin={true}
                                                            imageSettings={{
                                                                src: "/logog-circle.png",
                                                                x: undefined, y: undefined, height: 36, width: 36, excavate: true,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="text-center relative z-10">
                                                        <div className="flex items-center justify-center gap-2 mb-2">
                                                            <span className="flex h-2 w-2 relative">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                            </span>
                                                            <p className="text-[10px] font-black text-emerald-450 tracking-widest uppercase">SCANNER ACTIVE</p>
                                                        </div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 leading-relaxed">
                                                            Staff must scan within the shop geozone to log shift
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Daily Logs List */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-5 px-1">
                                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <div className="w-1.5 h-3.5 bg-indigo-500 rounded-full" />
                                                            Live Staff Logs
                                                        </h4>
                                                        <button
                                                            onClick={fetchAttendanceLogs}
                                                            disabled={logsLoading}
                                                            className={`flex items-center gap-1.5 text-[9px] font-black text-indigo-405 uppercase tracking-wider bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl transition-all ${logsLoading ? 'opacity-50' : 'active:scale-95'}`}
                                                        >
                                                            <RefreshCw size={11} className={logsLoading ? 'animate-spin' : ''} />
                                                            Sync
                                                        </button>
                                                    </div>

                                                    {logsLoading && attendanceLogs.length === 0 ? (
                                                        <div className="space-y-3.5">
                                                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-3xl animate-pulse border border-white/5" />)}
                                                        </div>
                                                    ) : attendanceLogs.length === 0 ? (
                                                        <div className="bg-white/5 rounded-[28px] p-10 text-center border border-white/5">
                                                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
                                                                <Clock className="text-slate-500" size={24} />
                                                            </div>
                                                            <p className="text-xs font-black text-slate-355 uppercase tracking-wider">No logs recorded today</p>
                                                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Updates will appear here as staff scan</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3.5">
                                                            {attendanceLogs.map((log) => (
                                                                <DailyLogItem
                                                                    key={log._id}
                                                                    log={log}
                                                                    getUri={getProcessedImageUri}
                                                                    dark={true}
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
                                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <div className="w-1.5 h-3.5 bg-indigo-500 rounded-full" />
                                                        Monthly Dashboard
                                                    </h4>
                                                    <button
                                                        onClick={fetchMonthlyAttendance}
                                                        disabled={logsLoading}
                                                        className={`flex items-center gap-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-wider bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl transition-all ${logsLoading ? 'opacity-50' : 'active:scale-95'}`}
                                                    >
                                                        <RefreshCw size={11} className={logsLoading ? 'animate-spin' : ''} />
                                                        Refresh
                                                    </button>
                                                </div>

                                                {logsLoading && monthlyLogs.length === 0 ? (
                                                    <div className="space-y-4">
                                                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-[28px] animate-pulse border border-white/5" />)}
                                                    </div>
                                                ) : monthlyLogs.length === 0 ? (
                                                    <div className="bg-white/5 rounded-[28px] p-10 text-center border border-white/5">
                                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                                                            <Calendar className="text-slate-500" size={24} />
                                                        </div>
                                                        <p className="text-xs font-black text-slate-350 uppercase tracking-wider">No records found for {new Date().toLocaleDateString('en-US', { month: 'long' })}</p>
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
                                                                dark={true}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="p-6 bg-[#0B0F19]/90 border-t border-white/5 flex items-center gap-4 sticky bottom-0 z-30">
                                    <button
                                        onClick={() => setShowAttendanceModal(false)}
                                        className="flex-1 py-4 bg-[#151C2C] border border-white/10 text-white rounded-2xl font-black text-xs tracking-widest shadow-lg active:scale-[0.98] transition-all uppercase hover:bg-slate-900"
                                    >
                                        Dismiss Hub
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- ADD STAFF MODAL --- */}
                <AnimatePresence>
                    {showAddStaffModal && (
                        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAddStaffModal(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="bg-white w-full max-w-[450px] rounded-t-[32px] sm:rounded-[32px] overflow-hidden relative z-10 flex flex-col"
                            >
                                {/* Modal Header */}
                                <div className="p-7 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-indigo-50/10 to-transparent">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 relative group overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent group-hover:opacity-50 transition-opacity" />
                                            <UserPlus size={22} strokeWidth={2.5} className="relative z-10" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">Add Staff Member</h2>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">Direct Registration</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAddStaffModal(false)}
                                        className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-colors"
                                    >
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="p-7 space-y-7 max-h-[60vh] overflow-y-auto no-scrollbar">
                                    <div className="space-y-7">
                                        <div className="space-y-7">
                                            <div className="space-y-5">
                                                <div className="flex items-center justify-between px-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                        <p className="text-[11px] font-black text-indigo-550 uppercase tracking-[0.15em] leading-none">Account Credentials</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-300 italic">* Required</span>
                                                </div>

                                                <div className="space-y-5">
                                                    {/* Full Name Field */}
                                                    <div className="group space-y-2">
                                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1 group-focus-within:text-indigo-600 transition-colors flex items-center gap-2">
                                                            <div className="w-3 h-px bg-gray-200 group-focus-within:bg-indigo-300 transition-all group-focus-within:w-5" />
                                                            Full Name
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                                                                <User size={18} />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={newStaffData.name}
                                                                onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                                                                placeholder="e.g. John Doe"
                                                                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 pl-12 pr-5 text-sm font-bold text-gray-900 focus:ring-[6px] focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm shadow-slate-200/50 placeholder:text-slate-300 placeholder:font-medium"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Phone Field */}
                                                    <div className="group space-y-2">
                                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1 group-focus-within:text-indigo-600 transition-colors flex items-center gap-2">
                                                            <div className="w-3 h-px bg-gray-200 group-focus-within:bg-indigo-300 transition-all group-focus-within:w-5" />
                                                            Mobile Number
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                                                                <Phone size={18} />
                                                            </div>
                                                            {/* Enhanced Prefix UI */}
                                                            <div className="absolute left-11 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                                                <span className="text-[13px] font-black text-gray-400 group-focus-within:text-indigo-500 transition-colors">+91</span>
                                                                <div className="w-[1.5px] h-4 bg-gray-100 group-focus-within:bg-indigo-100 transition-colors" />
                                                            </div>
                                                            <input
                                                                type="tel"
                                                                value={newStaffData.phone}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                                    setNewStaffData({ ...newStaffData, phone: val });
                                                                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                                                                }}
                                                                onBlur={() => {
                                                                    if (newStaffData.phone.length === 10) {
                                                                        handleCheckExists('phone', newStaffData.phone);
                                                                    } else if (newStaffData.phone.length > 0) {
                                                                        setFormErrors(prev => ({ ...prev, phone: "Must be 10 digits" }));
                                                                    }
                                                                }}
                                                                placeholder="9876543210"
                                                                className={`w-full bg-slate-50/50 border ${formErrors.phone ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-100'} rounded-2xl py-4 pl-22 pr-5 text-sm font-bold text-gray-900 focus:ring-[6px] ${formErrors.phone ? 'focus:ring-red-500/5 focus:border-red-500' : 'focus:ring-indigo-500/5 focus:border-indigo-500'} focus:bg-white outline-none transition-all shadow-sm shadow-slate-200/50 placeholder:text-slate-300 placeholder:font-medium`}
                                                            />
                                                        </div>
                                                        {formErrors.phone && (
                                                            <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-bold text-red-500 px-2 mt-1.5 flex items-center gap-1.5 bg-red-50 py-1.5 rounded-lg border border-red-100/50 w-fit">
                                                                <AlertCircle size={12} className="fill-red-500 text-white" /> {formErrors.phone}
                                                            </motion.p>
                                                        )}
                                                    </div>

                                                    {/* Email Field */}
                                                    <div className="group space-y-2">
                                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1 group-focus-within:text-indigo-600 transition-colors flex items-center gap-2">
                                                            <div className="w-3 h-px bg-gray-200 group-focus-within:bg-indigo-300 transition-all group-focus-within:w-5" />
                                                            Email Address
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                                                                <Mail size={18} />
                                                            </div>
                                                            <input
                                                                type="email"
                                                                value={newStaffData.email}
                                                                onChange={(e) => {
                                                                    setNewStaffData({ ...newStaffData, email: e.target.value.toLowerCase().trim() });
                                                                    if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                                                                }}
                                                                onBlur={() => handleCheckExists('email', newStaffData.email)}
                                                                placeholder="staff@example.com"
                                                                className={`w-full bg-slate-50/50 border ${formErrors.email ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-100'} rounded-2xl py-4 pl-12 pr-5 text-sm font-bold text-gray-900 focus:ring-[6px] ${formErrors.email ? 'focus:ring-red-500/5 focus:border-red-500' : 'focus:ring-indigo-500/5 focus:border-indigo-500'} focus:bg-white outline-none transition-all shadow-sm shadow-slate-200/50 placeholder:text-slate-300 placeholder:font-medium`}
                                                            />
                                                        </div>
                                                        {formErrors.email && (
                                                            <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-bold text-red-500 px-2 mt-1.5 flex items-center gap-1.5 bg-red-50 py-1.5 rounded-lg border border-red-100/50 w-fit">
                                                                <AlertCircle size={12} className="fill-red-500 text-white" /> {formErrors.email}
                                                            </motion.p>
                                                        )}
                                                    </div>

                                                    {/* Password Field */}
                                                    <div className="group space-y-2">
                                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1 group-focus-within:text-indigo-600 transition-colors flex items-center gap-2">
                                                            <div className="w-3 h-px bg-gray-200 group-focus-within:bg-indigo-300 transition-all group-focus-within:w-5" />
                                                            Login Password
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                                                                <Lock size={18} />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={newStaffData.password}
                                                                onChange={(e) => setNewStaffData({ ...newStaffData, password: e.target.value })}
                                                                placeholder="Set Secure Password"
                                                                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 pl-12 pr-5 text-sm font-bold text-gray-900 focus:ring-[6px] focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm shadow-slate-200/50 placeholder:text-slate-300 placeholder:font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-5 bg-gradient-to-br from-indigo-50/80 to-slate-50/80 rounded-[2rem] border border-indigo-100/40 flex gap-4 shadow-sm">
                                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm border border-indigo-50">
                                                        <Info size={22} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Share Credentials</p>
                                                        <p className="text-[10px] font-bold text-indigo-700/70 leading-relaxed italic">
                                                            Your staff member will use this email and password to access their professional dashboard.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-7 bg-white border-t border-gray-50 flex items-center gap-4">
                                    <button
                                        onClick={() => setShowAddStaffModal(false)}
                                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-xs tracking-widest active:scale-[0.97] transition-all uppercase hover:bg-slate-50 hover:border-slate-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={addingStaff}
                                        onClick={handleCreateStaff}
                                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-indigo-650/20 active:scale-[0.97] transition-all uppercase disabled:opacity-40 flex items-center justify-center gap-2 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        {addingStaff ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Processing
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={16} fill="currentColor" />
                                                Create & Add
                                            </>
                                        )}
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
