import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Calendar, ArrowDownLeft, TrendingUp, TrendingDown,
    Users, DollarSign, Lock, RotateCw, ArrowUpRight,
    Target, BarChart3, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

// --- COMPONENTS ---

const SkeletonLoader = () => (
    <div className="p-5 animate-pulse pt-24">
        <div className="h-32 bg-gray-200 rounded-3xl mb-6"></div>
        <div className="h-48 bg-gray-200 rounded-3xl mb-6"></div>
        <div className="flex gap-4 mb-6">
            <div className="flex-1 h-24 bg-gray-200 rounded-2xl"></div>
            <div className="flex-1 h-24 bg-gray-200 rounded-2xl"></div>
        </div>
        <div className="h-40 bg-gray-200 rounded-3xl"></div>
    </div>
);

const GoalWidget = ({ currentEarnings, target = 50000 }) => {
    const progress = Math.min(Math.max((currentEarnings / target) * 100, 0), 100);
    const remaining = Math.max(target - currentEarnings, 0);

    return (
        <div className="mx-5 mt-4 mb-6">
            <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">
                <div className="flex justify-between items-center mb-3 relative z-10">
                    <h3 className="text-base font-extrabold text-[#1C1C1E] flex items-center">
                        Monthly Goal <Target size={18} className="ml-1.5 text-red-500" />
                    </h3>
                    <span className="text-sm font-bold text-gray-400">{progress.toFixed(0)}%</span>
                </div>

                <div className="h-2.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-[#6A1B9A] rounded-full"
                    />
                </div>

                <div className="flex justify-between items-end relative z-10">
                    <p className="text-xs text-gray-400 font-medium">
                        {remaining > 0 ? `₹${remaining.toLocaleString('en-IN')} to reach target` : "Target smashed! 🔥"}
                    </p>
                    <p className="text-base font-black text-[#1C1C1E]">₹{target.toLocaleString('en-IN')}</p>
                </div>
            </div>
        </div>
    );
};


const TransactionItem = ({ transaction }) => (
    <div className="flex items-center justify-between p-4 mb-3 bg-white border border-gray-100 rounded-[20px] shadow-sm">
        <div className="flex items-center flex-1 min-w-0 mr-4"> {/* Added min-w-0 and mr-4 */}
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex-shrink-0 flex items-center justify-center mr-3.5"> {/* Added flex-shrink-0 */}
                <ArrowDownLeft size={20} className="text-[#6366F1]" />
            </div>
            <div className="flex-1 min-w-0"> {/* Added min-w-0 */}
                <h4 className="text-[15px] font-bold text-[#1C1C1E] mb-1 truncate block"> {/* Added block */}
                    {transaction.description || "Service Booking"}
                </h4>
                <p className="text-xs font-medium text-gray-500 truncate block"> {/* Added truncate block */}
                    {format(new Date(transaction.date), "MMM d")}, {transaction.time ? (
                        (() => {
                            try {
                                const [h, m] = transaction.time.split(':');
                                const d = new Date();
                                d.setHours(parseInt(h), parseInt(m));
                                return format(d, "h:mm a");
                            } catch (e) { return transaction.time; }
                        })()
                    ) : format(new Date(transaction.date), "h:mm a")}
                </p>
            </div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0"> {/* Added flex-shrink-0, removed min-w-[72px] to let it size naturally but prevent shrink */}
            <span className="text-base font-extrabold text-[#10B981] whitespace-nowrap"> {/* Added whitespace-nowrap */}
                +₹{transaction.amount.toFixed(0)}
            </span>
            <div className="mt-1 px-2 py-0.5 bg-green-50 rounded-lg">
                <span className="text-[10px] font-bold text-[#10B981] tracking-wide">PAID</span>
            </div>
        </div>
    </div>
);


const StaffEarningsList = ({ data }) => {
    const [expandedId, setExpandedId] = useState(null);

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => b.totalEarnings - a.totalEarnings);
    }, [data]);

    const maxEarnings = sortedData.length > 0 ? sortedData[0].totalEarnings : 0;

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="px-5 pb-24">
            <h3 className="text-lg font-extrabold text-[#1C1C1E] mb-4 flex items-center">
                Staff Leaderboard <span className="ml-2">🏆</span>
            </h3>

            <div className="space-y-4">
                {sortedData.map((staff, index) => {
                    const isExpanded = expandedId === staff.id;
                    const progress = maxEarnings > 0 ? (staff.totalEarnings / maxEarnings) * 100 : 0;
                    const isTopPerformer = index === 0 && staff.totalEarnings > 0;

                    return (
                        <div
                            key={staff.id}
                            className={`bg-white rounded-[24px] border transition-all duration-300 shadow-sm overflow-hidden ${isExpanded ? 'border-indigo-500 ring-4 ring-indigo-50/50' : 'border-gray-100'
                                }`}
                        >
                            <div
                                className="p-5 cursor-pointer active:bg-gray-50 transition-colors"
                                onClick={() => toggleExpand(staff.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${isTopPerformer ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-400' : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            <span className="text-lg font-black">{staff.name.charAt(0)}</span>
                                            {isTopPerformer && (
                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                                    <span className="text-[10px]">🏆</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-[15px] font-bold text-[#1C1C1E] flex items-center gap-1.5">
                                                {staff.name}
                                                {isTopPerformer && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">Top Earner</span>}
                                            </h4>
                                            <p className="text-xs font-medium text-gray-500">{staff.role}</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-base font-black text-[#1C1C1E]">
                                            ₹{staff.totalEarnings.toLocaleString("en-IN")}
                                        </p>
                                        <div className={`inline-flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronLeft size={14} className="-rotate-90 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-4">
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={`h-full rounded-full ${isTopPerformer ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                        />
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="mt-3 flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        AVG/DAY: <span className="text-gray-900">₹{Math.round(staff.totalEarnings / Math.max(1, new Date().getDate()))}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        PROJECTED: <span className="text-indigo-600">₹{staff.projectedEarnings?.toLocaleString('en-IN') || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="border-t border-gray-50 bg-gray-50/50"
                                    >
                                        <div className="p-5 space-y-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Daily Breakdown</p>
                                            {staff.dailyBreakdown.map((dateItem, idx) => (
                                                <div key={idx} className="flex justify-between items-start">
                                                    <div className="flex-1 min-w-0 mr-4">
                                                        <p className="text-[13px] font-bold text-gray-900 mb-0.5">
                                                            {format(new Date(dateItem.date), "MMM d, yyyy")}
                                                        </p>
                                                        <p className="text-[11px] font-medium text-gray-400 truncate">
                                                            {dateItem.services.join(", ")}
                                                        </p>
                                                    </div>
                                                    <span className="text-[13px] font-black text-green-600">
                                                        ₹{dateItem.amount}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// --- MAIN SCREEN ---
const EarningsScreen = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    // State
    const [filter, setFilter] = useState("month"); // day, week, month
    const [viewMode, setViewMode] = useState("personal"); // personal, staff
    const [loading, setLoading] = useState(true);
    const [earningsData, setEarningsData] = useState(null);
    const [staffEarnings, setStaffEarnings] = useState([]);
    const [isShopOwner, setIsShopOwner] = useState(false);
    const [subscriptionError, setSubscriptionError] = useState(false);
    const [recentTransactions, setRecentTransactions] = useState([]);


    // Initial Data Fetch
    useEffect(() => {
        if (user) {
            checkShopOwnership();
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, viewMode]);

    const checkShopOwnership = async () => {
        if (!user) return;
        try {
            const res = await api.get('/api/shop/my-shop');
            if (res.status === 200 && (res.data.owner === user.id || res.data.isMainOwner)) {
                setIsShopOwner(true);
            }
        } catch (e) { console.error("Not owner", e); }
    };

    const fetchData = async () => {
        setLoading(true);
        setSubscriptionError(false);
        try {
            await refreshUser();
            if (viewMode === 'staff') {
                const res = await api.get(`/api/earnings/staff?filter=${filter}&clientDate=${new Date().toISOString()}`);
                setStaffEarnings(res.data);
            } else {
                const res = await api.get(`/api/earnings?filter=${filter}&page=1&clientDate=${new Date().toISOString()}`);
                setEarningsData(res.data);
                setRecentTransactions(res.data.recentTransactions || []);
            }
        } catch (e) {
            console.error(e);
            if (e.response?.status === 403) setSubscriptionError(true);
        } finally {
            setLoading(false);
        }
    };

    // Derived Data for Stats
    const totalBookings = earningsData?.totalBookings || 0;
    const activeCustomers = earningsData?.totalCustomers || 0;
    const projected7Days = earningsData?.forecast7Days || 0;
    const projected30Days = earningsData?.forecast30Days || 0;

    const currentEarnings = earningsData?.totalEarnings || 0;
    const growthPercentage = earningsData?.growth || 0;

    // Gated UI
    const isSubscribed = user?.isSubscribed || user?.subscriptionStatus === 'active';

    if (!loading && (!isSubscribed || subscriptionError)) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
                <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-xl">
                    <div className="w-20 h-20 bg-[#E0E7FF] rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock size={32} className="text-[#6366F1]" />
                    </div>
                    <h2 className="text-2xl font-black text-[#1C1C1E] mb-3">Unlock Analytics</h2>
                    <p className="text-[#64748B] mb-8 leading-relaxed">
                        Track your earnings, monitor performance, and view staff leaderboards with Premium.
                    </p>
                    <button
                        onClick={() => navigate('/services')}
                        className="w-full py-4 rounded-xl bg-[#6366F1] text-white font-bold shadow-lg shadow-indigo-200 active:scale-[0.98] transition-transform"
                    >
                        View Plans
                    </button>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm font-bold text-gray-400">Go Back</button>
                </div>
            </div>
        );
    }

    if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex justify-center"><div className="w-full max-w-[390px]"><SkeletonLoader /></div></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex justify-center">
            <div className="w-full max-w-[450px] bg-[#F8FAFC] min-h-screen shadow-2xl relative">

                {/* HEADER */}
                <div className="bg-gradient-to-br from-[#6366F1] to-[#4338CA] pt-safe-top pt-4 pb-6 px-6 rounded-b-[30px] relative overflow-hidden">
                    {/* Native-style Blobs */}
                    <div className="absolute top-[-40px] right-[-30px] w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
                    <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-white/5 blur-lg pointer-events-none"></div>
                    <div className="absolute top-[20px] left-[30%] w-20 h-20 rounded-full bg-white/5 blur-md pointer-events-none"></div>
                    <div className="absolute bottom-[40px] right-[-40px] w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none"></div>

                    {/* Navbar */}
                    <div className="flex justify-between items-center relative z-10">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform text-white border border-white/10">
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </button>

                        <span className="text-white text-lg font-black tracking-tight mx-auto">Financial Overview</span>

                        <div className="w-10"></div> {/* Spacer to balance the back button */}
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="relative z-20 pb-24 -mt-6">

                    {/* 1. View Mode Toggle (Moved here from topbar) */}
                    {isShopOwner && (
                        <div className="mx-5 mb-4">
                            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl flex border border-gray-100 shadow-sm">
                                <button
                                    onClick={() => setViewMode('personal')}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'personal' ? 'bg-[#1C1C1E] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                    My Income
                                </button>
                                <button
                                    onClick={() => setViewMode('staff')}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'staff' ? 'bg-[#1C1C1E] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                    Staff Income
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2. Goal Widget Card */}
                    {viewMode === 'personal' && (
                        <GoalWidget currentEarnings={currentEarnings} target={50000} />
                    )}

                    {viewMode === 'personal' ? (
                        <div className="px-5">
                            {/* 2. Monthly Income Card */}
                            <div className="bg-gradient-to-br from-[#7B1FA2] to-[#4A148C] rounded-[32px] p-6 text-white mb-6 relative overflow-hidden shadow-xl shadow-purple-200">
                                {/* Decor */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <p className="text-purple-200 text-xs font-bold tracking-wider uppercase">
                                        {filter === 'month' ? "Monthly Income" : filter === 'week' ? "Weekly Income" : "Daily Income"}
                                    </p>
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <BarChart3 size={18} className="text-white" />
                                    </div>
                                </div>

                                <h2 className="text-4xl font-black mb-6 relative z-10 tracking-tight">
                                    ₹{currentEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h2>

                                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 relative z-10">
                                    {growthPercentage >= 0 ? (
                                        <TrendingUp size={14} className="text-green-300" />
                                    ) : (
                                        <TrendingDown size={14} className="text-red-300" />
                                    )}
                                    <span className={`text-xs font-bold ${growthPercentage >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                        {growthPercentage >= 0 ? '+' : ''}{growthPercentage}%
                                    </span>
                                    <span className="text-purple-200 text-xs ml-1">vs previous {filter}</span>
                                </div>
                            </div>


                            {/* 3. Time Filters */}
                            <div className="bg-white rounded-2xl p-1.5 flex mb-6 shadow-sm border border-gray-100">
                                {['day', 'week', 'month'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all ${filter === f
                                            ? 'bg-[#1C1C1E] text-white shadow-md'
                                            : 'text-gray-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        {f === 'day' ? 'Today' : f}
                                    </button>
                                ))}
                            </div>

                            {/* 4. Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                                    <div className="w-10 h-10 bg-[#E0E7FF] rounded-xl flex items-center justify-center mb-3">
                                        <Users size={20} className="text-[#6366F1]" />
                                    </div>
                                    <p className="text-2xl font-black text-[#1C1C1E] mb-1">{activeCustomers}</p>
                                    <p className="text-xs text-gray-500 font-medium">Active Customers</p>
                                </div>
                                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                                    <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center mb-3">
                                        <Calendar size={20} className="text-[#4CAF50]" />
                                    </div>
                                    <p className="text-2xl font-black text-[#1C1C1E] mb-1">{totalBookings}</p>
                                    <p className="text-xs text-gray-500 font-medium">Total Bookings</p>
                                </div>
                            </div>

                            {/* 5. AI Projection */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-extrabold text-[#1C1C1E]">AI Projection</h3>
                                    <span className="bg-[#6366F1] text-white text-[10px] font-black px-2 py-1 rounded-md">PRO</span>
                                </div>

                                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                                    <div className="mb-6">
                                        <p className="text-xs text-gray-400 font-medium mb-1">Next 7 Days</p>
                                        <div className="flex justify-between items-end">
                                            <p className="text-xl font-black text-[#1C1C1E]">₹{projected7Days.toLocaleString('en-IN')}</p>
                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
                                                <div className="h-full bg-[#8E24AA] w-3/4 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-50">
                                        <p className="text-xs text-gray-400 font-medium mb-1">Next 30 Days</p>
                                        <p className="text-xl font-black text-[#1C1C1E]">₹{projected30Days.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 6. Recent Transactions */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-extrabold text-[#1C1C1E]">Recent Transactions</h3>
                                    <button className="text-[#6366F1] text-xs font-bold">See All</button>
                                </div>

                                <div className="h-[340px] overflow-y-auto bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 custom-scrollbar">
                                    {recentTransactions && recentTransactions.length > 0 ? (
                                        recentTransactions.map((item) => (
                                            <TransactionItem key={item.id} transaction={item} />
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                                <DollarSign size={24} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-400 text-sm">No recent transactions</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <StaffEarningsList data={staffEarnings} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default EarningsScreen;
