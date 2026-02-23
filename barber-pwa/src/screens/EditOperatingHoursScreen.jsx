import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronLeft, Clock, Copy, ChevronDown,
    ChevronUp, Calendar, CheckCircle2, AlertCircle,
    Info, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Thursday', short: 'Thu' },
    { key: 'friday', label: 'Friday', short: 'Fri' },
    { key: 'saturday', label: 'Saturday', short: 'Sat' },
    { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const DayCard = ({ day, hours, isExpanded, onToggle, onUpdate, onToggleOpen, onCopyAll }) => {
    const isOpen = hours?.open && hours?.close;

    return (
        <div className={`mb-4 rounded-[28px] overflow-hidden border transition-all duration-300 ${isExpanded ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-100/30' : 'bg-white/60 border-gray-100 hover:border-gray-200'
            }`}>
            {/* Header */}
            <div
                onClick={onToggle}
                className="p-5 flex items-center justify-between cursor-pointer"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest transition-colors ${isOpen ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                        {day.short}
                    </div>
                    <div>
                        <h4 className="text-[15px] font-bold text-[#1C1C1E]">{day.label}</h4>
                        <p className={`text-[11px] font-bold uppercase tracking-widest ${isOpen ? 'text-indigo-500' : 'text-gray-400'
                            }`}>
                            {isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    {/* Toggle Switch */}
                    <button
                        onClick={() => onToggleOpen(!isOpen)}
                        className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${isOpen ? 'bg-indigo-500' : 'bg-gray-200'
                            }`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isOpen ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </button>
                    {isExpanded ? <ChevronUp size={20} className="text-gray-300" /> : <ChevronDown size={20} className="text-gray-300" />}
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 pb-6 border-t border-gray-50 pt-5"
                    >
                        {isOpen ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Open Time</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={hours.open || '09:00'}
                                                onChange={(e) => onUpdate('open', e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-[#1C1C1E] focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                            <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Close Time</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={hours.close || '21:00'}
                                                onChange={(e) => onUpdate('close', e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-[#1C1C1E] focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                            <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={onCopyAll}
                                    className="w-full py-3.5 bg-indigo-50 text-indigo-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors active:scale-95"
                                >
                                    <Copy size={14} />
                                    Apply to all days
                                </button>
                            </div>
                        ) : (
                            <div className="py-4 text-center">
                                <p className="text-sm font-medium text-gray-400">Shop is closed on this day.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const EditOperatingHoursScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [operatingHours, setOperatingHours] = useState(() => {
        const defaultHours = {};
        DAYS_OF_WEEK.forEach(day => {
            defaultHours[day.key] = { open: '', close: '' };
        });
        return location.state?.currentOperatingHours || defaultHours;
    });

    const [loading, setLoading] = useState(false);
    const [expandedDay, setExpandedDay] = useState('monday');
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/api/shop', { operatingHours });
            setSuccess(true);
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            console.error("Save Error:", err);
            alert("Failed to save schedule. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const updateDay = (dayKey, field, value) => {
        setOperatingHours(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                [field]: value
            }
        }));
    };

    const toggleOpen = (dayKey, shouldBeOpen) => {
        setOperatingHours(prev => ({
            ...prev,
            [dayKey]: shouldBeOpen ? { open: '09:00', close: '21:00' } : { open: '', close: '' }
        }));
    };

    const copyToAll = (sourceDay) => {
        const sourceHours = operatingHours[sourceDay];
        const newHours = {};
        DAYS_OF_WEEK.forEach(day => {
            newHours[day.key] = { ...sourceHours };
        });
        setOperatingHours(newHours);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex justify-center">
            <div className="w-full max-w-[450px] bg-[#F8FAFC] min-h-screen shadow-2xl relative flex flex-col">

                {/* HEADER */}
                <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <ChevronLeft size={20} className="text-[#1C1C1E]" strokeWidth={2.5} />
                        </button>
                        <div className="text-center">
                            <h1 className="text-lg font-black text-[#1C1C1E]">Schedule</h1>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Shop Availability</p>
                        </div>
                        <div className="w-10" />
                    </div>
                </header>

                <main className="flex-1 px-6 pt-6 pb-32 overflow-y-auto custom-scrollbar">

                    {/* Info Box */}
                    <div className="bg-indigo-50/50 p-5 rounded-[28px] border border-indigo-100/50 mb-8 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-indigo-100 flex-shrink-0">
                            <Calendar size={20} className="text-indigo-500" />
                        </div>
                        <p className="text-[13px] leading-relaxed text-gray-600 font-medium">
                            Set your operational hours for each day. Customers will only be able to book slots within these timings.
                        </p>
                    </div>

                    {/* Days List */}
                    <div className="space-y-1">
                        {DAYS_OF_WEEK.map((day) => (
                            <DayCard
                                key={day.key}
                                day={day}
                                hours={operatingHours[day.key]}
                                isExpanded={expandedDay === day.key}
                                onToggle={() => setExpandedDay(expandedDay === day.key ? null : day.key)}
                                onUpdate={(field, val) => updateDay(day.key, field, val)}
                                onToggleOpen={(val) => toggleOpen(day.key, val)}
                                onCopyAll={() => copyToAll(day.key)}
                            />
                        ))}
                    </div>
                </main>

                {/* FIXED FOOTER WITH SAVE BUTTON */}
                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] p-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent pointer-events-none">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 pointer-events-auto flex items-center justify-center gap-2 ${success
                                ? 'bg-emerald-500 text-white shadow-emerald-200'
                                : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
                            }`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : success ? (
                            <>
                                <CheckCircle2 size={18} />
                                Schedule Saved
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EditOperatingHoursScreen;
