import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
    ChevronLeft, Bell, Clock, Calendar,
    CheckCircle2, ShieldCheck, AlertTriangle, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const NotificationDetailScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { theme } = useTheme();

    const [notification, setNotification] = useState(location.state?.notification || null);
    const [loading, setLoading] = useState(!location.state?.notification);
    const [isRead, setIsRead] = useState(notification?.read || false);

    useEffect(() => {
        const fetchAndMarkRead = async () => {
            let currentNotif = notification;

            if (!currentNotif && id) {
                try {
                    const res = await api.get(`/api/notifications/${id}`);
                    currentNotif = res.data;
                    setNotification(res.data);
                } catch (err) {
                    console.error("Fetch Error:", err);
                } finally {
                    setLoading(false);
                }
            }

            if (currentNotif && !currentNotif.read) {
                try {
                    await api.put(`/api/notifications/${currentNotif._id}/read`);
                    setIsRead(true);
                } catch (err) {
                    console.error("Mark Read Error:", err);
                }
            }
        };

        fetchAndMarkRead();
    }, [id, notification]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!notification) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-10 text-center">
                <AlertTriangle size={64} className="text-gray-200 mb-6" />
                <h3 className="text-xl font-black text-[#1C1C1E] mb-2">Notice Unavailable</h3>
                <p className="text-sm text-gray-500 font-medium mb-8">We couldn't retrieve the details for this notification.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-[#1C1C1E] text-white px-8 py-3 rounded-2xl font-bold active:scale-95 transition-transform"
                >
                    Return to Inbox
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex justify-center">
            <div className="w-full max-w-[450px] bg-[#F8FAFC] min-h-screen shadow-2xl relative flex flex-col">

                {/* HEADER */}
                <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 backdrop-blur-xl px-6 py-4">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <ChevronLeft size={20} className="text-[#1C1C1E]" strokeWidth={2.5} />
                        </button>
                        <h1 className="text-[17px] font-bold text-[#1C1C1E] tracking-tight">Notification</h1>
                        <div className="w-10" />
                    </div>
                </header>

                <main className="flex-1 px-6 pb-24 pt-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[40px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden"
                    >
                        {/* Status Chip */}
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center">
                                <Bell size={32} className="text-indigo-500 fill-indigo-500/10" />
                            </div>
                            {isRead && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                                    <CheckCircle2 size={14} className="text-indigo-500" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Read</span>
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-[800] text-[#1C1C1E] leading-tight mb-6">
                            {notification.title}
                        </h2>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] rounded-xl border border-gray-100">
                                <Calendar size={14} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-600">
                                    {format(new Date(notification.date), 'EEE, MMM d')}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] rounded-xl border border-gray-100">
                                <Clock size={14} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-600">
                                    {format(new Date(notification.date), 'h:mm a')}
                                </span>
                            </div>
                        </div>

                        {/* Message */}
                        <div className="h-[2px] w-full bg-gray-50 mb-8" />
                        <p className="text-[17px] leading-relaxed text-gray-600 font-medium mb-10">
                            {notification.message}
                        </p>

                        {/* Trust Footer */}
                        <div className="flex items-center gap-4 p-5 bg-indigo-50/50 rounded-[24px] border border-indigo-100/50">
                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-indigo-100">
                                <ShieldCheck size={20} className="text-indigo-500" />
                            </div>
                            <div>
                                <h4 className="text-[13px] font-bold text-[#1C1C1E]">Official Communication</h4>
                                <p className="text-[11px] text-gray-400 font-medium">System generated message. No action required.</p>
                            </div>
                        </div>
                    </motion.div>
                </main>

                {/* Bottom Action */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent z-10 flex justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full max-w-[400px] h-16 bg-[#1C1C1E] text-white rounded-[24px] font-black tracking-tight flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl shadow-black/10"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetailScreen;
