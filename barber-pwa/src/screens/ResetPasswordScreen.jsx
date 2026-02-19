import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, ShieldCheck, RefreshCcw, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import api from '../utils/api';

const ResetPasswordScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { email, otp } = location.state || {};

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

    const showToast = (message, type = 'error') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleReset = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            showToast('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            showToast('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/password/reset', { email, otp, password });
            showToast('Password reset successfully!', 'success');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-12 flex justify-center">
            <div className="w-full max-w-[450px] bg-white min-h-screen flex flex-col px-6">

                {/* TOAST */}
                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 24, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className={`fixed top-0 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-[24px] shadow-2xl flex items-center gap-3 min-w-[320px] ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                        >
                            {toast.type === 'success' ? <CheckCircle2 className="text-white" size={20} /> : <AlertCircle className="text-white" size={20} />}
                            <span className="text-white font-black text-sm">{toast.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* HEADER */}
                <div className="pt-8 mb-12 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100 active:scale-95 transition-transform"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="px-5 py-2 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-2">
                        <Lock size={10} className="text-indigo-600" />
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Secure Reset</span>
                    </div>
                    <div className="w-12" />
                </div>

                {/* TITLE AREA */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-black text-slate-900 mb-3">New Password</h1>
                    <p className="text-slate-500 font-bold leading-relaxed px-4 text-sm">
                        Create a strong, unique password to protect your account security.
                    </p>
                </div>

                {/* FORM */}
                <form onSubmit={handleReset} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-16 rounded-2xl bg-slate-50 border-2 border-slate-50 px-12 font-bold text-slate-900 outline-none focus:border-indigo-200 focus:bg-white transition-all"
                                placeholder="••••••••"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Lock size={20} />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full h-16 rounded-2xl bg-slate-50 border-2 border-slate-50 px-12 font-bold text-slate-900 outline-none focus:border-indigo-200 focus:bg-white transition-all"
                                placeholder="••••••••"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <ShieldCheck size={20} />
                            </div>
                        </div>
                    </div>

                    {/* STRENGTH INDICATORS */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Security Rule</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-snug">
                                Must be at least 6 characters and include one special symbol (!@#$) for maximum security.
                            </p>
                        </div>
                    </div>

                    {/* SUBMIT */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[72px] bg-slate-900 rounded-[36px] flex items-center justify-center gap-3 text-white font-black text-lg active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {loading ? <RefreshCcw className="animate-spin" size={24} /> : (
                            <>
                                <span>Update Password</span>
                                <CheckCircle2 size={24} />
                            </>
                        )}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default ResetPasswordScreen;
