import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, AlertCircle, X, Loader2, CalendarClock, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const EditMaxAppointmentsScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, refreshUser } = useAuth();

    const [maxAppointments, setMaxAppointments] = useState(location.state?.currentMaxAppointments || user?.maxAppointmentsPerDay || '');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const showToast = (message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleSave = async () => {
        if (!maxAppointments || isNaN(maxAppointments)) return showToast("Enter a valid number", "error");

        const numValue = parseInt(maxAppointments, 10);
        if (numValue <= 0) return showToast("Capacity must be greater than 0", "error");

        setLoading(true);
        try {
            await api.put('/api/auth/user', { maxAppointmentsPerDay: numValue });
            await refreshUser();
            showToast("Settings saved successfully!", "success");

            setTimeout(() => {
                navigate('/create-barber-card', {
                    state: { ...location.state, updatedMaxAppointments: numValue },
                    replace: true
                });
            }, 1500);
        } catch (err) {
            showToast(err.response?.data?.msg || "Save failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex justify-center pb-12">
            <div className="w-full max-w-[450px] bg-[#F8F9FA] relative min-h-screen flex flex-col">

                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 20, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none px-6"
                        >
                            <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${toast.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' :
                                    toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' :
                                        'bg-gray-900/90 border-gray-700 text-white'
                                }`}>
                                {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                                <p className="font-bold text-sm tracking-wide">{toast.message}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-md z-30">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[17px] font-[900] text-gray-900 uppercase tracking-widest">Settings</h1>
                    <div className="w-10" />
                </div>

                <div className="px-8 pt-8 flex-1">
                    {/* Hero Section */}
                    <div className="flex flex-col items-start mb-12">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-100 relative mb-8"
                        >
                            <CalendarClock size={28} className="text-white" strokeWidth={2.5} />
                        </motion.div>
                        <h2 className="text-3xl font-[950] text-gray-900 leading-tight">
                            Daily Capacity
                        </h2>
                        <p className="text-[15px] text-gray-400 font-bold mt-4 leading-relaxed tracking-tight">
                            Manage your booking limits to prevent overbooking and maintain quality service.
                        </p>
                    </div>

                    {/* Input Group */}
                    <div className="space-y-6">
                        <div className="group">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1 block opacity-70">
                                Max Appointments / Day
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={maxAppointments}
                                    onChange={(e) => setMaxAppointments(e.target.value)}
                                    placeholder="0"
                                    maxLength={3}
                                    className="w-full bg-white border-2 border-gray-100 rounded-[28px] px-8 py-7 text-3xl font-black text-gray-900 placeholder:text-gray-100 focus:border-indigo-500/20 focus:outline-none transition-all shadow-sm group-hover:shadow-md"
                                />
                                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                    <span className="text-sm font-black text-gray-300 uppercase tracking-widest">Slots</span>
                                </div>
                            </div>
                        </div>

                        {/* Info Footer */}
                        <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                                    <ShieldCheck size={16} className="text-indigo-500" />
                                </div>
                                <span className="text-[12px] font-black text-gray-400 tracking-widest uppercase">Safe Booking</span>
                            </div>
                            <p className="text-[13px] text-gray-500 font-bold leading-relaxed">
                                Setting a limit ensures you only receive the amount of bookings you can realistically handle in a single day.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Button */}
                <div className="px-8 pb-10">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full h-16 bg-gray-900 rounded-[32px] text-white font-[950] text-lg shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                                <span>Save Changes</span>
                                <ArrowRight size={20} strokeWidth={3} />
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EditMaxAppointmentsScreen;
