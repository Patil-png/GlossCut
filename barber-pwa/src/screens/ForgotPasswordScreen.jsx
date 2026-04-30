import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Check, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import { useTheme } from '../context/ThemeContext';

const ForgotPasswordScreen = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isValidEmail, setIsValidEmail] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });


    // Email Validation Logic
    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsValidEmail(emailRegex.test(email));
    }, [email]);

    const showToast = (message, type = 'error') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'error' }), 3000);
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();

        if (!email) {
            showToast('Please enter your email address');
            return;
        }

        if (!isValidEmail) {
            showToast('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            await api.post('/api/password/forgot', { email });
            showToast('OTP sent successfully!', 'success');
            setTimeout(() => {
                navigate('/otp-verification', { state: { email } });
            }, 1500);
        } catch (err) {
            let errorMessage = 'Account not found or error occurred';
            if (err.response && err.response.data && err.response.data.msg) {
                errorMessage = err.response.data.msg;
            }
            showToast(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center items-start pt-12 px-6">
            <div className="w-full max-w-[450px] flex flex-col">

                {/* TOAST */}
                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 min-w-[300px] border ${toast.type === 'success'
                                ? 'bg-emerald-500 border-emerald-400 text-white'
                                : 'bg-rose-500 border-rose-400 text-white'
                                }`}
                        >
                            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* HEADER */}
                <div className="mb-10 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 active:scale-90 transition-transform shadow-sm"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Reset Password</h1>
                    <div className="w-12" />
                </div>

                {/* HERO ICON */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-center text-indigo-600 mb-8"
                >
                    <Lock size={40} />
                </motion.div>

                {/* CONTENT */}
                <div className="mb-10">
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter leading-none">
                        Forgot Password?
                    </h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Enter your email securely. We'll send you a One Time Password to reset your account.
                    </p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSendOTP} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1">
                            Email Address
                        </label>
                        <div className="relative group">
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isValidEmail ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-indigo-600'}`}>
                                <Mail size={20} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="glosscut@company.com"
                                className={`w-full h-16 bg-white border-2 rounded-2xl pl-12 pr-12 font-bold text-slate-900 outline-none transition-all shadow-sm ${isValidEmail ? 'border-emerald-100 focus:border-emerald-200' : 'border-slate-100 focus:border-indigo-100'}`}
                                autoComplete="email"
                                required
                            />
                            {isValidEmail && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                    <Check size={20} />
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full h-16 rounded-2xl flex items-center justify-between px-8 text-white font-black text-lg shadow-2xl transition-all active:scale-95 disabled:opacity-70 ${isValidEmail ? 'bg-slate-900 shadow-slate-200' : 'bg-slate-300 shadow-none'
                            }`}
                    >
                        <span>{loading ? 'Sending OTP...' : 'Send OTP'}</span>
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <ChevronRight size={20} />
                        </div>
                    </button>
                </form>

            </div>
        </div>
    );
};

export default ForgotPasswordScreen;
