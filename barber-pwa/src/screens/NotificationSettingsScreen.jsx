import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Bell, BellRing, BellOff, Info,
    ShieldCheck, Smartphone,
    CheckCircle2, ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

const NotificationIcon = ({ size = 18, grayscale = false }) => (
    <img 
        src="/ic_stat_notification_icon.png" 
        style={{ 
            width: size, 
            height: size, 
            filter: grayscale ? 'grayscale(1) opacity(0.5)' : 'none' 
        }} 
        alt="Notification" 
    />
);
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

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

    useEffect(() => {
        // Check actual SW subscription status on mount
        const checkSubscription = async () => {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    setEnabled(true);
                } else {
                    setEnabled(false);
                }
            }
        };
        checkSubscription();
    }, []);

    const subscribeUserToPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('Push notifications are not supported by your browser.');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Permission not granted for Notification');
                return false;
            }

            const registration = await navigator.serviceWorker.ready;
            
            // Get VAPID public key from backend
            const vapidResponse = await api.get('/api/webpush/vapid-public-key');
            const vapidPublicKey = vapidResponse.data.publicKey;
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            // Subscribe
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });

            // Send subscription to backend
            await api.post('/api/webpush/subscribe', { subscription });
            return true;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            alert('Failed to subscribe: ' + error.message);
            return false;
        }
    };

    const unsubscribeUserFromPush = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                await api.post('/api/webpush/unsubscribe');
            }
            return true;
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
            return false;
        }
    };

    const handleToggle = async () => {
        setLoading(true);
        const newValue = !enabled;
        
        try {
            if (newValue) {
                const success = await subscribeUserToPush();
                if (success) {
                    setEnabled(true);
                    await api.put('/api/users/profile', { notificationsEnabled: true });
                }
            } else {
                const success = await unsubscribeUserFromPush();
                if (success) {
                    setEnabled(false);
                    await api.put('/api/users/profile', { notificationsEnabled: false });
                }
            }
            if (refreshUser) await refreshUser();
        } catch (err) {
            console.error("Toggle Error:", err);
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
                                <img src="/ic_stat_notification_icon.png" style={{ width: 40, height: 40 }} alt="Notification" />
                            ) : (
                                <img src="/ic_stat_notification_icon.png" style={{ width: 40, height: 40, filter: 'grayscale(1) opacity(0.5)' }} alt="Notification" />
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

                    {/* Notification Preview */}
                    <div className="mb-8">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] mb-4 xl-2 ml-2">How it looks</p>
                        
                        {/* iOS Style Mock Notification */}
                        <motion.div 
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-[24px] p-4 flex gap-4 items-start relative overflow-hidden"
                            style={{ boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}
                        >
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                                <img src="/ic_stat_notification_icon.png" style={{ width: 24, height: 24 }} alt="Notification" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-[13px] font-bold text-[#1C1C1E]">SetKarr</h4>
                                    <span className="text-[10px] text-gray-400 font-medium">now</span>
                                </div>
                                <h5 className="text-[13px] font-bold text-[#1C1C1E] leading-tight">New Walk-in Booking!</h5>
                                <p className="text-[12px] text-gray-600 font-medium mt-0.5 leading-snug">Rahul is here for a Haircut & Beard Trim.</p>
                            </div>
                        </motion.div>
                        <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
                            Notifications appear natively on your device's lock screen.
                        </p>
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
                            icon={NotificationIcon}
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
                            Trouble receiving alerts? Make sure you have added the app to your Home Screen.
                        </p>
                        <button 
                            onClick={() => window.open('https://support.apple.com/en-us/HT204681', '_blank')}
                            className="flex items-center gap-2 mx-auto text-indigo-500 font-black text-xs uppercase tracking-widest border border-indigo-100 px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
                        >
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
