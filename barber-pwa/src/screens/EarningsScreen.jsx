import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed Recharts due to React 19 incompatibility
import {
    ChevronLeft, Calendar, ArrowUpRight, TrendingUp,
    Users, DollarSign, Lock, AlertCircle, ChevronDown, ChevronUp,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

// --- COMPONENTS ---

const SkeletonLoader = () => (
    <div className="p-5 animate-pulse">
        <div className="h-64 bg-gray-200 rounded-3xl mb-6"></div>
        <div className="h-12 bg-gray-200 rounded-2xl mb-6"></div>
        <div className="flex gap-4">
            <div className="flex-1 h-32 bg-gray-200 rounded-2xl"></div>
            <div className="flex-1 h-32 bg-gray-200 rounded-2xl"></div>
        </div>
    </div>
);

const GoalWidget = ({ currentEarnings, target = 50000 }) => {
    const progress = Math.min(Math.max((currentEarnings / target) * 100, 0), 100);
    const remaining = Math.max(target - currentEarnings, 0);

    return (
        <div className="mx-5 mb-6">
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex justify-between items-center mb-3 relative z-10">
                    <h3 className="text-base font-extrabold text-[#1C1C1E] flex items-center">
                        Monthly Goal <span className="ml-1 text-lg">🎯</span>
                    </h3>
                    <span className="text-sm font-medium text-gray-500">{progress.toFixed(0)}%</span>
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
                    <p className="text-xs text-gray-500 font-medium">
                        {remaining > 0 ? `₹${remaining.toLocaleString('en-IN')} to reach target` : "Target smashed! 🔥"}
                    </p>
                    <p className="text-lg font-extrabold text-[#1C1C1E]">₹{target.toLocaleString('en-IN')}</p>
                </div>
            </div>
        </div>
    );
};

const TransactionItem = ({ transaction }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl mb-3 shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-[#F3E5F5] flex items-center justify-center shrink-0">
                <ArrowUpRight size={18} className="text-[#8E24AA]" />
            </div>
            <div className="min-w-0">
                <p className="font-bold text-[#1C1C1E] text-sm truncate">{transaction.description || "Service Booking"}</p>
                <p className="text-xs text-gray-400 font-medium text-nowrap">
                    {format(new Date(transaction.date), "MMM d, h:mm a")}
                </p>
            </div>
        </div>
        <div className="text-right shrink-0 ml-2">
            <p className="font-extrabold text-[#4CAF50] text-sm">+₹{transaction.amount.toFixed(0)}</p>
            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#E8F5E9] mt-1">
                <span className="text-[10px] font-bold text-[#2E7D32]">Paid</span>
            </div>
        </div>
    </div>
);

const StaffEarningsList = ({ data }) => {
    const [expandedId, setExpandedId] = useState(null);

    // Sort: High to Low
    const sortedData = useMemo(() => [...data].sort((a, b) => b.totalEarnings - a.totalEarnings), [data]);
    const maxEarnings = sortedData.length > 0 ? sortedData[0].totalEarnings : 0;

    return (
        <div className="px-5 pb-24">
            <h3 className="text-lg font-extrabold text-[#1C1C1E] mb-4 flex items-center">
                Staff Leaderboard <span className="ml-2 text-xl">🏆</span>
            </h3>

            {sortedData.map((staff, index) => {
                const isExpanded = expandedId === staff.id;
                const progress = maxEarnings > 0 ? (staff.totalEarnings / maxEarnings) * 100 : 0;
                const isTopPerformer = index === 0 && staff.totalEarnings > 0;

                return (
                    <motion.div
                        layout
                        key={staff.id}
                        onClick={() => setExpandedId(isExpanded ? null : staff.id)}
                        className={`bg-white rounded-[20px] mb-4 border transition-all cursor-pointer overflow-hidden ${isExpanded ? 'border-[#6A1B9A] shadow-md' : 'border-gray-100 shadow-sm'
                            }`}
                    >
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg relative ${isTopPerformer ? 'bg-[#FFF9C4] text-[#F57F17] border-2 border-[#FFD700]' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {staff.name.charAt(0)}
                                        {isTopPerformer && (
                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">🏆</div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-[#1C1C1E] text-sm flex items-center">
                                            {staff.name}
                                            {isTopPerformer && <span className="ml-1 text-[10px] text-[#F9A825] font-black bg-[#FFF9C4] px-1.5 rounded">#1</span>}
                                        </p>
                                        <p className="text-xs text-gray-400 font-medium">{staff.role}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-[#1C1C1E]">₹{staff.totalEarnings.toLocaleString('en-IN')}</p>
                                    {isExpanded ? <ChevronUp size={16} className="ml-auto text-gray-400 mt-1" /> : <ChevronDown size={16} className="ml-auto text-gray-400 mt-1" />}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                                <div
                                    className={`h-full rounded-full ${isTopPerformer ? 'bg-[#FBC02D]' : 'bg-[#AB47BC]'}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {/* Stats Row */}
                            <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                                <span>Avg/Day: <span className="text-gray-800 font-bold">₹{Math.round(staff.totalEarnings / Math.max(1, new Date().getDate()))}</span></span>
                                <span>Projected: <span className="text-[#6A1B9A] font-bold">₹{staff.projectedEarnings?.toLocaleString('en-IN') || 0}</span></span>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-gray-50 border-t border-gray-100"
                                >
                                    <div className="p-4">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Daily Breakdown</p>
                                        {staff.dailyBreakdown.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start mb-2 last:mb-0">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-700">{format(new Date(item.date), "MMM d")}</p>
                                                    <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{item.services.join(", ")}</p>
                                                </div>
                                                <p className="text-xs font-bold text-[#4CAF50]">+₹{item.amount}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
};

// --- MAIN SCREEN ---
const EarningsScreen = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const { theme } = useTheme(); // Can use for dark mode toggle if needed

    // State
    const [filter, setFilter] = useState("month"); // day, week, month
    const [viewMode, setViewMode] = useState("personal"); // personal, staff
    const [loading, setLoading] = useState(true);
    const [earningsData, setEarningsData] = useState(null);
    const [staffEarnings, setStaffEarnings] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [isShopOwner, setIsShopOwner] = useState(false);
    const [subscriptionError, setSubscriptionError] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        checkShopOwnership();
        fetchData();
    }, [user, filter, viewMode]);

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
            await refreshUser(); // Ensure sub status is fresh

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

    // Chart Data Preparation
    const chartData = useMemo(() => {
        const defaultData = [0, 0, 0, 0, 0, 0];
        let rawData = defaultData;

        if (earningsData) {
            if (filter === "day" && Array.isArray(earningsData.dailyEarnings)) rawData = earningsData.dailyEarnings;
            else if (filter === "week" && Array.isArray(earningsData.weeklyEarnings)) rawData = earningsData.weeklyEarnings;
            else if (Array.isArray(earningsData.monthlyEarnings)) rawData = earningsData.monthlyEarnings;
        }

        if (rawData.length === 0) rawData = defaultData;

        // Clean Data
        const data = rawData.map(val => Number.isFinite(Number(val)) ? Number(val) : 0);

        // Labels
        const labels = filter === "day"
            ? ["12a", "4a", "8a", "12p", "4p", "8p"]
            : filter === "week"
                ? ["S", "M", "T", "W", "T", "F", "S"]
                : ["1", "5", "10", "15", "20", "25"];

        // Format for Recharts
        return labels.map((label, i) => ({
            name: label,
            value: data[i] || 0
        }));
    }, [filter, earningsData]);

    // Gated UI
    const isSubscribed = user?.isSubscribed || user?.subscriptionStatus === 'active';

    if (!loading && (!isSubscribed || subscriptionError)) {
        return (
            <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-6">
                <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-xl">
                    <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock size={32} className="text-[#6A1B9A]" />
                    </div>
                    <h2 className="text-2xl font-black text-[#1C1C1E] mb-3">Unlock Analytics</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        Track your earnings, monitor performance, and view staff leaderboards with Premium.
                    </p>
                    <button
                        onClick={() => navigate('/services')} // Redirect to where they can buy/contact (using services for now)
                        className="w-full py-4 rounded-xl bg-[#6A1B9A] text-white font-bold shadow-lg shadow-purple-200 active:scale-[0.98] transition-transform"
                    >
                        View Plans
                    </button>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm font-bold text-gray-400">Go Back</button>
                </div>
            </div>
        );
    }

    if (loading) return <div className="min-h-screen bg-[#F4F5F7] flex justify-center"><div className="w-full max-w-[390px]"><SkeletonLoader /></div></div>;

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-[#F4F5F7] flex justify-center">
            <div className="w-full max-w-[390px] bg-[#F4F5F7] min-h-screen shadow-2xl relative">

                {/* HEADER */}
                <div className="bg-gradient-to-br from-[#6A1B9A] to-[#4A148C] text-white pt-8 pb-16 px-6 rounded-b-[40px] relative overflow-hidden">
                    {/* Background Blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                    {/* Nav */}
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 transition-transform">
                            <ChevronLeft size={20} />
                        </button>
                        <h1 className="text-lg font-bold">Analytics</h1>
                        <button className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 transition-transform">
                            <Download size={18} />
                        </button>
                    </div>

                    {/* Total Earnings Display */}
                    <div className="relative z-10 mb-2">
                        <p className="text-purple-200 font-medium text-sm mb-1">
                            {filter === 'day' ? "Today's Income" : filter === 'week' ? "Weekly Income" : "Monthly Income"}
                        </p>
                        <div className="flex items-baseline">
                            <span className="text-4xl font-black tracking-tight">
                                ₹{earningsData?.totalEarnings?.toLocaleString('en-IN') || 0}
                            </span>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-black/20 backdrop-blur-sm p-1 rounded-xl absolute bottom-6 left-6 right-6 z-10">
                        {['day', 'week', 'month'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-white text-[#6A1B9A] shadow-sm' : 'text-purple-100 hover:bg-white/5'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Container - Pull up over header */}
                <div className="relative -mt-10 z-20">
                    {/* View Switcher (Personal / Staff) */}
                    {isShopOwner && (
                        <div className="px-12 mb-6">
                            <div className="bg-white p-1 rounded-full shadow-sm flex border border-gray-100">
                                <button
                                    onClick={() => setViewMode('personal')}
                                    className={`flex-1 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${viewMode === 'personal' ? 'bg-[#6A1B9A] text-white shadow-md transform scale-105' : 'text-gray-400'
                                        }`}
                                >
                                    <TrendingUp size={14} /> My Stats
                                </button>
                                <button
                                    onClick={() => setViewMode('staff')}
                                    className={`flex-1 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${viewMode === 'staff' ? 'bg-[#6A1B9A] text-white shadow-md transform scale-105' : 'text-gray-400'
                                        }`}
                                >
                                    <Users size={14} /> Staff
                                </button>
                            </div>
                        </div>
                    )}

                    {viewMode === 'personal' ? (
                        <>
                            {/* CHART CARD */}
                            {/* CHART CARD */}
                            <div className="mx-5 mb-6 bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 h-[220px] relative">
                                {/* CUSTOM SVG CHART */}
                                <div className="w-full h-full relative flex items-end">
                                    <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8E24AA" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#8E24AA" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>

                                        {/* Grid Lines */}
                                        <line x1="0" y1="0" x2="100" y2="0" stroke="#f0f0f0" strokeWidth="0.5" />
                                        <line x1="0" y1="25" x2="100" y2="25" stroke="#f0f0f0" strokeWidth="0.5" />
                                        <line x1="0" y1="50" x2="100" y2="50" stroke="#f0f0f0" strokeWidth="0.5" />

                                        {/* Data Path */}
                                        {(() => {
                                            const data = chartData.map(d => d.value);
                                            const max = Math.max(...data, 1);
                                            const points = data.map((val, i) => {
                                                const x = (i / (data.length - 1)) * 100;
                                                const y = 50 - ((val / max) * 40); // Leave some top padding
                                                return `${x},${y}`;
                                            }).join(' ');

                                            const areaPoints = `${points} 100,50 0,50`;

                                            return (
                                                <>
                                                    <polygon points={areaPoints} fill="url(#chartGradient)" />
                                                    <polyline points={points} fill="none" stroke="#8E24AA" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                                                    {/* Dots */}
                                                    {data.map((val, i) => {
                                                        const x = (i / (data.length - 1)) * 100;
                                                        const y = 50 - ((val / max) * 40);
                                                        return (
                                                            <circle
                                                                key={i}
                                                                cx={x}
                                                                cy={y}
                                                                r="1.5"
                                                                fill="#6A1B9A"
                                                                stroke="#fff"
                                                                strokeWidth="0.5"
                                                            />
                                                        );
                                                    })}
                                                </>
                                            );
                                        })()}
                                    </svg>

                                    {/* Labels Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 font-medium translate-y-4">
                                        {chartData.map((d, i) => (
                                            <span key={i}>{d.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <GoalWidget currentEarnings={earningsData?.totalEarnings || 0} />

                            {/* Recent Transactions */}
                            <div className="px-5 pb-24">
                                <h3 className="text-lg font-extrabold text-[#1C1C1E] mb-4">Transactions</h3>
                                {recentTransactions.length > 0 ? (
                                    recentTransactions.map((t) => <TransactionItem key={t._id} transaction={t} />)
                                ) : (
                                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-gray-400 font-medium text-sm">No transactions yet</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <StaffEarningsList data={staffEarnings} />
                    )}
                </div>

            </div>
        </div>
    );
};

export default EarningsScreen;
