import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronLeft, Users, Star, MessageSquare,
    TrendingUp, Calendar, ArrowRight, RefreshCw,
    Search, Filter, UserCheck, ShieldCheck, Zap, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CustomersServedScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [stats, setStats] = useState({
        totalCustomers: 0,
        customersServedList: []
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('month'); // day, week, month

    const fetchStats = useCallback(async () => {
        if (!refreshing) setLoading(true);
        try {
            const res = await api.get(`/api/earnings?filter=${filter}`);
            setStats({
                totalCustomers: res.data.totalCustomers || 0,
                customersServedList: res.data.customersServedList || []
            });
        } catch (err) {
            console.error("Failed to fetch customers served:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter, refreshing]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const getFilterLabel = (f) => {
        switch (f) {
            case 'day': return 'Today';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            default: return 'Period';
        }
    };

    const CustomerItem = ({ item, index }) => {
        const initials = item.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
        const isOffline = item.isOffline;

        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => !isOffline && navigate(`/customer-reviews/${item.id}`, { state: { customerName: item.name } })}
                className={`bg-white rounded-[32px] p-5 border border-gray-100 shadow-sm flex items-center justify-between transition-all ${!isOffline ? 'cursor-pointer active:scale-[0.98] hover:shadow-md' : 'opacity-80'}`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border ${isOffline ? 'bg-gray-50 border-gray-100 text-gray-400' : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-100 text-indigo-600'}`}>
                        {initials}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-[15px] font-black text-gray-900 leading-tight">{item.name}</h4>
                            {isOffline && (
                                <span className="text-[8px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md uppercase tracking-widest">Walk-in</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1">
                                <Star size={10} className={`${isOffline ? 'text-gray-300 fill-gray-300' : 'text-amber-400 fill-amber-400'}`} />
                                <span className="text-[11px] font-black text-gray-900">{item.rating || 'New'}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isOffline ? 'bg-gray-100' : 'bg-indigo-50'}`}>
                                <Zap size={8} className={`${isOffline ? 'text-gray-400 fill-gray-400' : 'text-indigo-600 fill-indigo-600'}`} />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isOffline ? 'text-gray-400' : 'text-indigo-600'}`}>{item.bookingCount || 0} Visits</span>
                            </div>
                        </div>
                    </div>
                </div>
                {!isOffline && (
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                        <ArrowRight size={14} />
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 flex justify-center">
            <div className="w-full max-w-[450px] relative min-h-screen flex flex-col overflow-hidden">

                {/* Background Decor */}
                <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-md z-40">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                        <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[15px] font-[900] text-gray-900 uppercase tracking-[0.2em]">Served</h1>
                    <button onClick={handleRefresh} className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                        <RefreshCw size={18} className={`${refreshing ? 'animate-spin' : ''} text-gray-400`} />
                    </button>
                </div>

                <div className="px-8 pt-4 flex-1">
                    {/* Hero Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-900 rounded-[40px] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden mb-10"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Customers Served</p>
                                    <h2 className="text-gray-300 font-bold text-xs uppercase tracking-widest">{getFilterLabel(filter)}</h2>
                                </div>
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <Users size={24} className="text-indigo-400" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-[950] tracking-tighter">{stats.totalCustomers}</span>
                                <TrendingUp size={24} className="text-emerald-400 mb-1" />
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                                <p className="text-[11px] font-bold text-gray-400">Keep growing your network!</p>
                                <div className="flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/20">
                                    <ShieldCheck size={12} className="text-emerald-400" />
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest text-[8px]">Active Shop</span>
                                </div>
                            </div>
                        </div>
                        {/* Abstract Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-16 -mt-16" />
                    </motion.div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-[24px]">
                        {['day', 'week', 'month'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* List Section */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            Recent People
                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px]">{stats.customersServedList.length}</span>
                        </h3>
                        <Filter size={16} className="text-gray-300" />
                    </div>

                    {loading && !refreshing ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest tracking-widest">Mining Data...</p>
                        </div>
                    ) : stats.customersServedList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                            <UserCheck size={48} className="text-gray-400 mb-6" />
                            <h4 className="text-lg font-black text-gray-900">No Customers Found</h4>
                            <p className="text-xs font-bold text-gray-500 max-w-[200px] mt-2 leading-relaxed">
                                We couldn't find any customers served in this period.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.customersServedList.map((item, idx) => (
                                <CustomerItem key={item.id || idx} item={item} index={idx} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Note */}
                <div className="mt-auto px-8 pb-10 flex items-center justify-center gap-3 opacity-30">
                    <div className="h-px bg-gray-900 flex-1" />
                    <span className="text-[8px] font-black uppercase tracking-[0.4em]">Analytics Engine 2.0</span>
                    <div className="h-px bg-gray-900 flex-1" />
                </div>

            </div>
        </div>
    );
};

export default CustomersServedScreen;
