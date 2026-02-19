import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, RefreshCcw, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TwoFactorVerificationScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { verifyTwoFactorOtp } = useAuth();
    const email = location.state?.email || 'your email';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
    const inputRefs = React.useRef([]);

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
            const success = await verifyTwoFactorOtp(email, otpCode);
            if (success) {
                showToast('Verification Successful!', 'success');
                setTimeout(() => navigate('/profile'), 800);
            } else {
                showToast('Invalid verification code');
            }
        } catch (err) {
            showToast('Verification failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12 flex justify-center">
            <div className="w-full max-w-[450px] bg-slate-50 min-h-screen flex flex-col px-6">

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
                        className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-900 border border-slate-200 active:scale-95 transition-transform"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="px-5 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">2FA Protection</span>
                    </div>
                    <div className="w-12" />
                </div>

                {/* TITLE AREA */}
                <div className="mb-12 text-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-20 bg-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100"
                    >
                        <ShieldCheck size={32} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-slate-900 mb-3">Two-Factor Auth</h1>
                    <p className="text-slate-500 font-bold leading-relaxed px-4 text-sm">
                        Extra layer of security active on your account.<br />
                        Enter the code sent to <span className="text-slate-900 font-black">{email}</span>
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
                            className={`w-full aspect-square text-2xl font-black text-center rounded-2xl border-2 transition-all outline-none ${digit ? 'border-emerald-600 bg-white shadow-lg shadow-emerald-50' : 'border-slate-200 bg-white focus:border-emerald-200'
                                }`}
                        />
                    ))}
                </div>

                {/* ACTION BUTTONS */}
                <div className="space-y-6">
                    <button
                        onClick={handleVerify}
                        disabled={loading}
                        className="w-full h-[72px] bg-slate-900 rounded-[36px] flex items-center justify-center gap-3 text-white font-black text-lg active:scale-95 transition-transform disabled:opacity-50 shadow-xl shadow-slate-200"
                    >
                        {loading ? <RefreshCcw className="animate-spin" size={24} /> : (
                            <>
                                <span>Verify & Access</span>
                                <ArrowRight size={24} />
                            </>
                        )}
                    </button>

                    <div className="flex flex-col items-center gap-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Having trouble?</p>
                        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 text-xs font-black uppercase tracking-widest active:scale-95 transition-transform">
                            <KeyRound size={14} />
                            Use Backup Code
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TwoFactorVerificationScreen;
