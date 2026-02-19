import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ShieldCheck, Lock,
    AlertCircle, CheckCircle2, Info, Mail,
    ExternalLink, ArrowRight, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const EditEmailScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const showToast = useCallback((message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
    }, []);

    const handleSupportPress = () => {
        showToast('For security, email changes require manual verification support.', 'info');
        // In a real app, this might open a mailto or chat
        // window.location.href = "mailto:support@glosscut.com";
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex justify-center">
            <div className="w-full max-w-[450px] relative min-h-screen flex flex-col overflow-hidden">

                {/* Background Decor */}
                <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-50px] left-[-50px] w-[200px] h-[200px] bg-indigo-500/3 rounded-full blur-3xl pointer-events-none" />

                {/* TOAST */}
                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 20, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none"
                        >
                            <div className="px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 backdrop-blur-md border border-white/20 bg-gray-900/90 text-white">
                                {toast.type === 'info' ? <ShieldCheck size={20} className="text-indigo-400" /> : <AlertCircle size={20} className="text-rose-400" />}
                                <div className="flex flex-col">
                                    <p className="font-black text-[11px] uppercase tracking-widest opacity-60">Security Notice</p>
                                    <p className="font-bold text-[13px] tracking-wide">{toast.message}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="px-6 pt-10 pb-6 flex items-center gap-4 sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-md z-40">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                        <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[15px] font-[900] text-gray-900 uppercase tracking-[0.2em]">Security Center</h1>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10"
                    >
                        <h2 className="text-3xl font-[1000] text-gray-900 mb-4 tracking-tighter">Registered Identity</h2>
                        <p className="text-sm font-bold text-gray-400 leading-relaxed">
                            Manage your core account credentials and security preferences.
                        </p>
                    </motion.div>

                    {/* Info Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        onClick={handleSupportPress}
                        className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group"
                    >
                        {/* Interactive Shine */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <span>Primary Email</span>
                                    <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                                        <ShieldCheck size={10} />
                                        <span>Verified</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 animate-pulse">
                                <Lock size={18} />
                            </div>
                        </div>

                        <div className="mb-8 relative z-10">
                            <p className="text-xl font-black text-gray-900 break-all tracking-tight font-mono">
                                {user?.email || "No Email Registered"}
                            </p>
                        </div>

                        <div className="h-px w-full bg-gray-50 mb-6 relative z-10" />

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} className="text-indigo-600" />
                                <span className="text-[12px] font-bold text-gray-400">GlossCut SafeGuard™ Protected</span>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                    </motion.div>

                    {/* Helper Box */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8 bg-gray-50 rounded-3xl p-6 flex gap-4"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-gray-400 flex-shrink-0 shadow-sm border border-gray-100">
                            <Info size={18} />
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                            This email is cryptographically linked to your booking history.
                            Modifications are restricted to prevent unauthorized account takeovers.
                        </p>
                    </motion.div>

                    <div className="mt-auto pt-10">
                        <button
                            onClick={handleSupportPress}
                            className="w-full h-16 bg-gray-900 rounded-[28px] flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all text-[12px]"
                        >
                            Contact Support
                            <ExternalLink size={16} />
                        </button>
                        <p className="text-center mt-5 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                            Response time: ~2 hours
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditEmailScreen;
