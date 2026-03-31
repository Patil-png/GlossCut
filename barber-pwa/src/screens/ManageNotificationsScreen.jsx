import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Bell, CheckCircle2, AlertTriangle,
    X, ShieldCheck, Zap, Loader2, Info, MessageCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationIcon = ({ size = 18 }) => (
    <img src="/ic_stat_notification_icon.png" style={{ width: size, height: size }} alt="Notification" />
);
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const InfoCard = ({ icon: Icon, title, desc }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100/50 transition-colors hover:bg-white hover:shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-gray-100 flex-shrink-0">
            <Icon size={18} />
        </div>
        <div className="flex flex-col">
            <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-tight">{title}</h4>
            <p className="text-[11px] font-bold text-gray-400 mt-1 leading-relaxed">{desc}</p>
        </div>
    </div>
);

const ManageNotificationsScreen = () => {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ visible: false, type: 'success', message: '' });

    const showToast = useCallback((message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }, []);

    const handleToggle = async () => {
        if (isSaving) return;
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);
        setIsSaving(true);

        try {
            const success = await updateProfile({ notificationsEnabled: newValue });
            if (success) {
                showToast(newValue ? 'Notifications Activated' : 'Notifications Paused', 'success');
            } else {
                throw new Error("Update failed");
            }
        } catch (error) {
            console.error("Toggle Error:", error);
            setNotificationsEnabled(!newValue);
            showToast('Connection error. Could not save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 flex justify-center">
            <div className="w-full max-w-[450px] relative min-h-screen flex flex-col overflow-hidden">

                {/* Background Decor */}
                <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-md z-40">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                        <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[15px] font-[900] text-gray-900 uppercase tracking-[0.2em]">Preferences</h1>
                    <div className="w-10" />
                </div>

                <div className="px-8 pb-10">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center mb-12">
                        <motion.div
                            className="w-28 h-28 relative mb-8"
                            animate={{ scale: notificationsEnabled ? [1, 1.05, 1] : 1 }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${notificationsEnabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            <div className={`w-full h-full rounded-[40px] flex items-center justify-center relative z-10 shadow-xl border-4 border-white ${notificationsEnabled ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-gray-100 text-gray-400'
                                }`}>
                                <img 
                                    src="/ic_stat_notification_icon.png" 
                                    style={{ 
                                        width: 48, 
                                        height: 48, 
                                        filter: notificationsEnabled ? 'brightness(0) invert(1)' : 'grayscale(1) opacity(0.5)' 
                                    }} 
                                    alt="Notification" 
                                />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-white shadow-sm z-20 ${notificationsEnabled ? 'bg-emerald-500' : 'bg-rose-500'
                                }`} />
                        </motion.div>

                        <h2 className="text-3xl font-[1000] text-gray-900 mb-4 tracking-tighter">
                            {notificationsEnabled ? "Stay Connected" : "Station Silent"}
                        </h2>
                        <p className="text-sm font-bold text-gray-400 leading-relaxed max-w-[300px]">
                            {notificationsEnabled
                                ? "You'll receive real-time updates for bookings, payments, and support."
                                : "Turn on notifications to never miss a client request or payment update."}
                        </p>
                    </div>

                    {/* Main Switch Card */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[14px] font-black text-gray-900 uppercase tracking-tight">Push Notifications</span>
                                <span className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Master Control</span>
                            </div>
                            <button
                                onClick={handleToggle}
                                disabled={isSaving}
                                className={`w-16 h-9 rounded-full relative transition-all duration-300 ${notificationsEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-gray-200'
                                    }`}
                            >
                                <motion.div
                                    className="absolute top-1 bottom-1 w-7 bg-white rounded-full shadow-md"
                                    animate={{ left: notificationsEnabled ? 'calc(100% - 32px)' : '4px' }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                                {isSaving && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
                                        <Loader2 size={16} className="animate-spin text-gray-400" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-4">Transmission Suite</h3>
                        <InfoCard icon={ShieldCheck} title="Service Requests" desc="Instant alerts when clients book or modify services." />
                        <InfoCard icon={Zap} title="Payment Triggers" desc="Real-time status updates for UPI and Cash payouts." />
                        <InfoCard icon={MessageCircle} title="Support Channels" desc="Direct communication for administrative notices." />
                        <InfoCard icon={NotificationIcon} title="System Alerts" desc="Critical security and platform maintenance updates." />
                    </div>
                </div>

                {/* TOAST */}
                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: -100, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none"
                        >
                            <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'
                                }`}>
                                {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                <p className="font-bold text-[13px] tracking-wide">{toast.message}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ManageNotificationsScreen;
