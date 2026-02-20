import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Bell, BellOff, CheckCheck, Inbox,
    Trash2, AlertCircle, RotateCw, Settings2, ShieldCheck,
    CheckCircle2, Clock, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

// --- COMPONENTS ---

const NotificationItem = React.memo(({ item, index, onRead, onDetail }) => {
    const isRead = item.read || item.isRead;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onDetail(item)}
            className={`group relative p-4 mb-3 rounded-[24px] cursor-pointer transition-all duration-300 border ${isRead
                ? 'bg-white/40 border-gray-100/50 hover:bg-white/60'
                : 'bg-white border-indigo-100 shadow-sm shadow-indigo-100/20 hover:shadow-indigo-100/40'
                }`}
        >
            {/* Status Indicator Bar */}
            {!isRead && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
            )}

            <div className="flex items-start gap-3.5">
                {/* Icon Container */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${isRead ? 'bg-gray-100' : 'bg-indigo-50'
                    }`}>
                    {isRead ? (
                        <CheckCheck size={18} className="text-gray-400" />
                    ) : (
                        <Bell size={18} className="text-indigo-500 fill-indigo-500/10" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-[15px] truncate pr-2 ${isRead ? 'font-medium text-gray-500' : 'font-bold text-[#1C1C1E]'
                            }`}>
                            {item.title}
                        </h4>
                        <span className={`text-[10px] font-bold whitespace-nowrap ${isRead ? 'text-gray-400' : 'text-indigo-500'
                            }`}>
                            {format(new Date(item.date), 'MMM d')}
                        </span>
                    </div>
                    <p className={`text-xs leading-relaxed line-clamp-2 ${isRead ? 'text-gray-400 font-normal' : 'text-gray-600 font-medium'
                        }`}>
                        {item.message}
                    </p>
                </div>
            </div>
        </motion.div>
    );
});

const EmptyInbox = () => (
    <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Inbox size={40} className="text-gray-200" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-black text-[#1C1C1E] mb-2">All Caught Up!</h3>
        <p className="text-sm text-gray-400 font-medium leading-relaxed">
            Your inbox is looking clean. No new notifications to display right now.
        </p>
    </div>
);

const SkeletonLoader = () => (
    <div className="space-y-4 pt-4">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse bg-white/50 h-24 rounded-[24px] border border-gray-100" />
        ))}
    </div>
);

// --- MAIN SCREEN ---

const NotificationsScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme } = useTheme();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchNotifications = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            const res = await api.get('/api/notifications');
            setNotifications(res.data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Unable to sync notifications. Check connection.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAllRead = async () => {
        if (notifications.every(n => n.read)) return;

        // Optimistic UI
        const previousNotifications = [...notifications];
        setNotifications(notifications.map(n => ({ ...n, read: true })));

        try {
            await api.put('/api/notifications/read-all');
        } catch (err) {
            setNotifications(previousNotifications);
            console.error("Mark All Read Error:", err);
        }
    };

    const handleNotificationDetail = (notification) => {
        navigate(`/notifications/${notification._id}`, { state: { notification } });
    };

    const unreadCount = useMemo(() =>
        notifications.filter(n => !n.read && !n.isRead).length,
        [notifications]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex justify-center">
            <div className="w-full max-w-[450px] bg-[#F8FAFC] min-h-screen shadow-2xl relative flex flex-col">

                {/* HEADER */}
                <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 backdrop-blur-xl border-b border-gray-100 px-6 pt-safe-top py-4">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <ChevronLeft size={20} className="text-[#1C1C1E]" strokeWidth={2.5} />
                        </button>

                        <div className="flex flex-col items-center">
                            <h1 className="text-lg font-black text-[#1C1C1E] tracking-tight">Activity</h1>
                            {unreadCount > 0 && (
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                    {unreadCount} New Alerts
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => navigate('/notification-settings')}
                            className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <Settings2 size={20} className="text-gray-400" />
                        </button>
                    </div>
                </header>

                {/* CONTENT */}
                <main className="flex-1 overflow-y-auto px-5 pb-24 pt-4 custom-scrollbar">

                    {/* Action Bar */}
                    <div className="flex justify-between items-center mb-6 px-1">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                <Bell size={14} className="text-white" />
                            </div>
                            <span className="text-sm font-bold text-[#1C1C1E]">Recent Notifications</span>
                        </div>

                        <button
                            onClick={handleMarkAllRead}
                            disabled={notifications.length === 0 || notifications.every(n => n.read)}
                            className="text-xs font-black text-indigo-500 uppercase tracking-wider disabled:opacity-30 flex items-center gap-1.5"
                        >
                            <CheckCheck size={14} />
                            Mark All Read
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {loading && !refreshing ? (
                            <SkeletonLoader key="skeleton" />
                        ) : error ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-20 text-center"
                            >
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle size={32} className="text-red-500" />
                                </div>
                                <p className="text-sm font-bold text-gray-400 px-10">{error}</p>
                                <button
                                    onClick={() => fetchNotifications()}
                                    className="mt-4 text-indigo-500 font-black text-xs uppercase tracking-widest"
                                >
                                    Retry Sync
                                </button>
                            </motion.div>
                        ) : notifications.length > 0 ? (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {notifications.map((n, i) => (
                                    <NotificationItem
                                        key={n._id || i}
                                        item={n}
                                        index={i}
                                        onDetail={handleNotificationDetail}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <EmptyInbox key="empty" />
                        )}
                    </AnimatePresence>
                </main>

                {/* Bottom Refresh Indicator */}
                {refreshing && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#1C1C1E] text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl z-50">
                        <RotateCw size={14} className="animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Syncing Inbox...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsScreen;
