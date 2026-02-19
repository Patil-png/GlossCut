import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, TrendingUp, ReceiptText,
    Calendar, Download, IndianRupee,
    BarChart3, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const TaxSummaryScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [taxSummary, setTaxSummary] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [availableYears, setAvailableYears] = useState([]);

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
        setAvailableYears(years);
    }, []);

    const fetchSummary = useCallback(async (year) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/earnings/tax-summary?year=${year}`);
            setTaxSummary(res.data);
        } catch (err) {
            console.error('Error fetching tax summary:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary(selectedYear);
    }, [selectedYear, fetchSummary]);

    const SummaryCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{title}</p>
                <p className="text-lg font-black text-gray-900">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                        <ChevronLeft size={20} className="text-[#1C1C1E]" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[17px] font-bold text-[#1C1C1E] tracking-tight">Tax Summary</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="px-6 py-8">
                {/* YEAR PICKER */}
                <div className="mb-8 overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4 ml-1">
                        <Calendar size={14} className="text-gray-400" />
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Financial Year</h4>
                    </div>
                    <div className="relative group">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full h-14 pl-4 pr-10 bg-slate-50 border-none rounded-2xl font-black text-gray-900 appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <BarChart3 size={18} />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Crunching Numbers...</p>
                    </div>
                ) : taxSummary ? (
                    <div className="space-y-4">
                        <div className="ml-1">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Financial Breakdown</h4>
                        </div>

                        <SummaryCard
                            title="Gross Earnings"
                            value={`₹${taxSummary.totalGrossEarnings.toLocaleString()}`}
                            icon={IndianRupee}
                            color="bg-indigo-50 text-indigo-600"
                        />
                        <SummaryCard
                            title="GST Collected"
                            value={`₹${taxSummary.totalGSTCollected.toLocaleString()}`}
                            icon={ReceiptText}
                            color="bg-amber-50 text-amber-600"
                        />
                        <div className="bg-emerald-600 p-6 rounded-[32px] shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 translate-y-[-24px]" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Total Net Earnings</p>
                                    <p className="text-3xl font-black text-white">₹{taxSummary.totalNetEarnings.toLocaleString()}</p>
                                </div>
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                    <TrendingUp size={28} className="text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
                                    <ShieldCheck size={20} className="text-slate-400" />
                                </div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Bookings</p>
                                <p className="text-xl font-black text-gray-900">{taxSummary.numberOfBookings}</p>
                            </div>
                            <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
                                    <BarChart3 size={20} className="text-slate-400" />
                                </div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg. Value</p>
                                <p className="text-xl font-black text-gray-900">₹{Math.round(taxSummary.averageBookingValue)}</p>
                            </div>
                        </div>

                        {/* DOWNLOAD REPORT */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="w-full h-16 bg-slate-900 text-white rounded-[24px] font-black text-sm flex items-center justify-center gap-3 mt-8 shadow-xl shadow-slate-900/10 transition-all active:bg-slate-800"
                        >
                            <Download size={18} />
                            Download Detailed Tax Report
                        </motion.button>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                            <ReceiptText size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">No Data Yet</h3>
                        <p className="text-xs font-bold text-gray-400 leading-relaxed mt-2">We couldn't find any financial records for this year.</p>
                    </div>
                )}

                <div className="mt-12 text-center opacity-30">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[2px]">Compliant with GST Framework v2.4</p>
                </div>
            </main>
        </div>
    );
};

export default TaxSummaryScreen;
