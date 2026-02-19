import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Bell, BellRing, BellOff, Info,
    ShieldCheck, Smartphone, Settings2, Lock,
    CheckCircle2, ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const SettingCard = ({ icon: Icon, title, desc, color }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon size={18} className="text-current" />
        </div>
        <div>
            <h4 className="text-[14px] font-bold text-[#1C1C1E]">{title}</h4>
            <p className="text-[11px] text-gray-500 font-medium leading-tight">{desc}</p>
        </div>
    </div>
);

const NotificationSettingsScreen = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const { theme } = useTheme();

    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(user?.notificationsEnabled || false);

    const handleToggle = async () => {
        const newValue = !enabled;
        setEnabled(newValue);
        setLoading(true);
        try {
            await api.put('/api/users/profile', { notificationsEnabled: newValue });
            await refreshUser();
        } catch (err) {
            console.error("Toggle Error:", err);
            setEnabled(!newValue); // Revert
        } finally {
            setLoading(false);
        }
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
                        <h1 className="text-lg font-black text-[#1C1C1E]">Settings</h1>
                        <div className="w-10" />
                    </div>
                </header>

                <main className="flex-1 px-6 pt-8 pb-24">

                    {/* Hero Section */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 relative ${enabled ? 'bg-indigo-100' : 'bg-gray-100'
                                }`}
                        >
                            <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${enabled ? 'bg-indigo-500' : 'bg-transparent'
                                }`} />
                            {enabled ? (
                                <BellRing size={40} className="text-indigo-500 relative z-10" />
                            ) : (
                                <BellOff size={40} className="text-gray-400 relative z-10" />
                            )}
                        </motion.div>
                        <h2 className="text-2xl font-black text-[#1C1C1E] mb-2">Push Notifications</h2>
                        <p className="text-sm text-gray-500 font-medium px-4">
                            Stay updated with new bookings, cancellations, and important system alerts.
                        </p>
                    </div>

                    {/* Toggle Card */}
                    <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-gray-100 mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? 'bg-indigo-50 text-indigo-500' : 'bg-gray-50 text-gray-400'
                                    }`}>
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1C1C1E]">App Notifications</h3>
                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Master Toggle</p>
                                </div>
                            </div>

                            <button
                                onClick={handleToggle}
                                disabled={loading}
                                className={`w-12 h-6 rounded-full relative transition-colors duration-300 active:scale-95 ${enabled ? 'bg-indigo-500' : 'bg-gray-200'
                                    }`}
                            >
                                <motion.div
                                    animate={{ x: enabled ? 26 : 2 }}
                                    className="w-5 h-5 bg-white rounded-full shadow-md"
                                />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                <Info size={16} className="text-gray-400 mt-0.5" />
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                    This option only controls system alerts. Ensure browser notifications are enabled in your device settings.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* What you'll receive */}
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] mb-4 ml-2">What you'll receive</p>
                    <div className="mb-8">
                        <SettingCard
                            icon={CheckCircle2}
                            title="New Bookings"
                            desc="Real-time alerts when clients book a slot."
                            color="bg-green-50 text-green-500"
                        />
                        <SettingCard
                            icon={Bell}
                            title="Reminders"
                            desc="Stay ahead with upcoming appointment alerts."
                            color="bg-orange-50 text-orange-500"
                        />
                        <SettingCard
                            icon={ShieldCheck}
                            title="Account Security"
                            desc="Alerts for logins from new devices/browsers."
                            color="bg-blue-50 text-blue-500"
                        />
                    </div>

                    {/* Browser Link */}
                    <div className="text-center">
                        <p className="text-xs text-gray-400 font-medium mb-4">
                            Trouble receiving alerts?
                        </p>
                        <button className="flex items-center gap-2 mx-auto text-indigo-500 font-black text-xs uppercase tracking-widest border border-indigo-100 px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors">
                            Device Permissions
                            <ExternalLink size={14} />
                        </button>
                    </div>

                </main>
            </div>
        </div>
    );
};

export default NotificationSettingsScreen;
