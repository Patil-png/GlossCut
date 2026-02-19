import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShieldCheck, CheckCircle, Lock, Smartphone, Loader2, Check } from 'lucide-react';
import api from '../utils/api';

const EditShopPhoneScreen = () => {
    const navigate = useNavigate();
    const { state } = useLocation();

    // Extract number from +91 form if needed
    const initialPhone = state?.currentPhone || '';
    const cleanPhone = initialPhone.startsWith('+91') ? initialPhone.slice(3) : initialPhone;

    const [shopPhone, setShopPhone] = useState(cleanPhone);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const showToast = (message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleTextChange = (e) => {
        const cleaned = e.target.value.replace(/[^0-9]/g, '');
        if (cleaned.length <= 10) setShopPhone(cleaned);
    };

    const handleUpdate = async () => {
        if (shopPhone.length !== 10) {
            showToast('Please enter a valid 10-digit phone number.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.put('/api/shop', { phone: `+91${shopPhone}` });
            if (res.status === 200) {
                showToast('Phone number updated! Pending approval.', 'success');
                setTimeout(() => navigate(-1), 1500);
            }
        } catch (err) {
            showToast('Update failed. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const isValid = shopPhone.length === 10;

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex justify-center">
            <div className="w-full max-w-[450px] bg-[#F8F9FA] min-h-screen flex flex-col relative px-6">

                {/* Toast */}
                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 20, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none px-6"
                        >
                            <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-xl pointer-events-auto ${toast.type === 'success' ? 'bg-[#10B981]' : toast.type === 'error' ? 'bg-[#EF4444]' : 'bg-gray-900'}`}>
                                {toast.type === 'success' ? <Check size={18} className="text-white" /> : <AlertCircle size={18} className="text-white" />}
                                <span className="text-white text-sm font-bold">{toast.message}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="pt-10 pb-10 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[17px] font-[900] text-gray-900">Update Contact</h1>
                    <div className="w-10" />
                </div>

                <div className="flex-1">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center mb-12">
                        <div className="w-20 h-20 rounded-[28px] bg-purple-50 flex items-center justify-center mb-6 relative">
                            <Smartphone size={36} className="text-[#6A1B9A]" />
                            <div className="absolute inset-0 rounded-[28px] border border-[#6A1B9A]/10 animate-ping opacity-20" />
                        </div>
                        <h2 className="text-2xl font-[900] text-gray-900 tracking-tight text-center mb-2">New Shop Number</h2>
                        <p className="text-[14px] font-bold text-gray-500 text-center leading-relaxed max-w-[80%] mx-auto">
                            This number will be visible to customers on your booking page for support.
                        </p>
                    </div>

                    {/* Input Section */}
                    <div className="space-y-6">
                        <div className={`flex items-center bg-white h-[80px] rounded-[24px] border-2 transition-all px-6 gap-4 ${isValid ? 'border-[#6A1B9A] shadow-[0_12px_30px_rgba(106,27,154,0.08)]' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2 pr-4 border-r border-gray-100">
                                <span className="text-xl">🇮🇳</span>
                                <span className="text-lg font-black text-gray-900">+91</span>
                            </div>

                            <input
                                className="flex-1 bg-transparent text-xl font-black text-gray-900 placeholder-gray-300 focus:outline-none tracking-[2px]"
                                placeholder="00000 00000"
                                type="tel"
                                value={shopPhone}
                                onChange={handleTextChange}
                            />

                            <AnimatePresence>
                                {isValid && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center"
                                    >
                                        <CheckCircle size={16} className="text-white" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Trust Indicator */}
                        <div className="flex items-center justify-center gap-2 opacity-60">
                            <ShieldCheck size={14} className="text-gray-500" />
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-none">Verified connection secured</span>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="pb-10 pt-4 bg-[#F8F9FA]">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleUpdate}
                        disabled={submitting || !isValid}
                        className={`w-full h-16 rounded-[22px] font-black text-lg text-white shadow-xl flex items-center justify-center gap-3 transition-all ${submitting || !isValid ? 'bg-gray-300 shadow-none' : 'bg-[#6A1B9A] shadow-purple-900/20'}`}
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : (isValid ? "Update Number" : "Enter 10 Digits")}
                    </motion.button>

                    <div className="flex items-center justify-center gap-1.5 mt-4 opacity-40">
                        <Lock size={12} className="text-gray-900" />
                        <span className="text-[11px] font-[800] text-gray-900 uppercase tracking-wider">Changes require verification</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EditShopPhoneScreen;
