import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Shield, Bell, MapPin,
    Mic, CheckCircle2, XCircle,
    Settings, ArrowRight
} from 'lucide-react';

const PrivacySetting = ({ icon: Icon, title, description, isEnabled, onClick, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="mb-4"
    >
        <div
            onClick={onClick}
            className="group relative cursor-pointer active:scale-[0.98] transition-all"
        >
            {/* Outer shadow card */}
            <div className="absolute inset-0 bg-gray-200 rounded-[24px] translate-y-1" />

            <div className="relative bg-white rounded-[22px] p-4 flex items-center border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mr-4 shrink-0 transition-colors group-hover:bg-indigo-100">
                    <Icon size={22} className="text-indigo-600" />
                </div>

                <div className="flex-1 min-w-0 mr-2">
                    <h3 className="text-sm font-bold text-gray-900 mb-0.5">{title}</h3>
                    <p className="text-xs text-gray-400 font-medium leading-relaxed truncate">
                        {description}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${isEnabled
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            : 'bg-red-50 border-red-100 text-red-600'
                        }`}>
                        {isEnabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span className="text-[10px] font-black uppercase tracking-wider">
                            {isEnabled ? 'Allowed' : 'Denied'}
                        </span>
                    </div>
                    <ArrowRight size={14} className="text-gray-300" />
                </div>
            </div>
        </div>
    </motion.div>
);

const PrivacyCheckupScreen = () => {
    const navigate = useNavigate();
    const [permissions, setPermissions] = useState({
        notifications: false,
        location: false,
        microphone: false
    });

    const checkPermissions = async () => {
        const results = {
            notifications: Notification.permission === 'granted',
            location: false,
            microphone: false
        };

        // Check Location
        try {
            const geoStatus = await navigator.permissions.query({ name: 'geolocation' });
            results.location = geoStatus.state === 'granted';
        } catch (e) {
            console.log('Location permission check failed');
        }

        // Check Microphone (simulated check as direct query isn't standard for mic in all browsers)
        try {
            const micStatus = await navigator.permissions.query({ name: 'microphone' });
            results.microphone = micStatus.state === 'granted';
        } catch (e) {
            console.log('Microphone permission check failed');
        }

        setPermissions(results);
    };

    useEffect(() => {
        checkPermissions();
        // Listener for focus to refresh permissions
        window.addEventListener('focus', checkPermissions);
        return () => window.removeEventListener('focus', checkPermissions);
    }, []);

    const openSettings = () => {
        // In browsers, we can't open specific permission settings,
        // but we can show instructions or try to trigger a request.
        alert("To change permissions, please click the lock icon in your browser's address bar.");
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                >
                    <ChevronLeft size={24} className="text-gray-900" strokeWidth={2.5} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Privacy Check-up</h1>
                <div className="w-10" />
            </header>

            <main className="px-6 py-8 pb-32">
                {/* HERO */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="relative mb-6">
                        <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center relative">
                            <Shield size={48} className="text-indigo-600" />
                            <div className="absolute -bottom-2 px-3 py-1 bg-emerald-100 border-2 border-white rounded-full flex items-center gap-1 shadow-sm">
                                <CheckCircle2 size={12} className="text-emerald-600" />
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Protected</span>
                            </div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Device Permissions</h2>
                    <p className="text-[15px] text-gray-500 font-medium leading-relaxed max-w-[90%] mx-auto">
                        Review permissions granted to this browser. These are controlled by your browser's security settings.
                    </p>
                </div>

                {/* PERMISSION LIST */}
                <div className="space-y-4">
                    <PrivacySetting
                        index={0}
                        icon={Bell}
                        title="Notifications"
                        description="Push alerts for bookings and updates."
                        isEnabled={permissions.notifications}
                        onClick={openSettings}
                    />
                    <PrivacySetting
                        index={1}
                        icon={MapPin}
                        title="Location Services"
                        description="Used for tracking and proximity."
                        isEnabled={permissions.location}
                        onClick={openSettings}
                    />
                    <PrivacySetting
                        index={2}
                        icon={Mic}
                        title="Microphone"
                        description="Used for in-app communication."
                        isEnabled={permissions.microphone}
                        onClick={openSettings}
                    />
                </div>

                {/* INSTRUCTIONS */}
                <div className="mt-12 p-6 bg-slate-100 rounded-[28px] border border-slate-200 text-center">
                    <Settings size={28} className="text-slate-400 mx-auto mb-4" />
                    <h4 className="text-sm font-black text-slate-700 mb-3 tracking-wide">How to fix denied permissions?</h4>
                    <div className="text-xs text-slate-500 font-bold leading-relaxed space-y-3 mb-6">
                        <p>If a permission shows as <span className="text-red-500">DENIED</span>, you need to manually enable it in your browser settings.</p>
                        <div className="text-left bg-white/50 p-4 rounded-xl space-y-2">
                            <p>1. Click the <Lock size={12} className="inline-block mr-1" /> icon in the address bar</p>
                            <p>2. Locate the specific permission</p>
                            <p>3. Toggle it to "Allow"</p>
                            <p>4. Refresh the page to apply changes</p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full h-12 bg-white rounded-2xl border border-slate-300 text-sm font-bold text-slate-700 active:scale-95 transition-transform"
                    >
                        Refresh Status
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PrivacyCheckupScreen;
