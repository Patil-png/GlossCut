import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, ShieldCheck, RefreshCcw, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const OTPVerificationScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || 'your email';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
    const inputRefs = useRef([]);

    const showToast = (message, type = 'error') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleChange = (value, index) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            showToast('Please enter the full 6-digit code');
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/password/verify', { email, otp: otpCode });
            showToast('Security Verified!', 'success');
            setTimeout(() => {
                navigate('/reset-password', { state: { email, otp: otpCode } });
            }, 800);
        } catch (err) {
            showToast(err.response?.data?.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await api.post('/api/password/forgot', { email });
            showToast('New code sent successfully', 'success');
        } catch (err) {
            showToast('Failed to resend code');
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
                    <div className="px-5 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Identity Auth</span>
                    </div>
                    <div className="w-12" />
                </div>

                {/* TITLE AREA */}
                <div className="mb-12 text-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100"
                    >
                        <Lock size={32} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-slate-900 mb-3">Verification Code</h1>
                    <p className="text-slate-500 font-bold leading-relaxed px-4">
                        We have sent a secure code to<br />
                        <span className="text-indigo-600 underline decoration-indigo-200 decoration-2 underline-offset-4">{email}</span>
                    </p>
                </div>

                {/* OTP INPUTS */}
                <div className="flex justify-between gap-2 mb-10">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => inputRefs.current[index] = el}
                            type="text"
                            inputMode="numeric"
                            value={digit}
                            onChange={(e) => handleChange(e.target.value, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={`w-full aspect-square text-2xl font-black text-center rounded-2xl border-2 transition-all outline-none ${digit ? 'border-indigo-600 bg-white shadow-lg shadow-indigo-50' : 'border-slate-100 bg-slate-50 focus:border-indigo-200'
                                }`}
                        />
                    ))}
                </div>

                {/* ACTION BUTTONS */}
                <div className="space-y-6">
                    <button
                        onClick={handleVerify}
                        disabled={loading}
                        className="w-full h-[72px] bg-slate-900 rounded-[36px] flex items-center justify-center gap-3 text-white font-black text-lg active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {loading ? <RefreshCcw className="animate-spin" size={24} /> : (
                            <>
                                <span>Verify Identity</span>
                                <ArrowRight size={24} />
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleResend}
                        className="w-full py-4 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-indigo-600 transition-colors"
                    >
                        Didn't receive code? <span className="text-indigo-600">Resend Code</span>
                    </button>
                </div>

                {/* FOOTER BADGE */}
                <div className="mt-auto pb-8 flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encryption</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OTPVerificationScreen;
