import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Smartphone, ShieldCheck,
    AlertCircle, CheckCircle2, Loader2,
    ArrowRight, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const EditPhoneNumberScreen = () => {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    useEffect(() => {
        if (user?.phone) {
            const number = user.phone.startsWith('+91') ? user.phone.slice(3) : user.phone;
            setPhoneNumber(number);
        }
    }, [user]);

    const showToast = useCallback((message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }, []);

    const handleUpdatePhoneNumber = async (e) => {
        e?.preventDefault();

        if (phoneNumber.length !== 10) {
            showToast('Please enter a valid 10-digit number.', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const success = await updateProfile({ phone: `+91${phoneNumber}` });
            if (success) {
                showToast('Phone number updated successfully!', 'success');
                setTimeout(() => navigate(-1), 1500);
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            console.error('Update Phone Error:', error);
            showToast('Failed to update phone number.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex justify-center">
            <div className="w-full max-w-[450px] relative min-h-screen flex flex-col overflow-hidden">

                {/* Background Decor */}
                <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-indigo-500/3 rounded-full blur-3xl pointer-events-none" />

                {/* TOAST */}
                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 20, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none"
                        >
                            <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
                                    toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' :
                                        'bg-gray-900/90 border-gray-700 text-white'
                                }`}>
                                {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                <div className="flex flex-col">
                                    <p className="font-black text-[11px] uppercase tracking-widest opacity-60">
                                        {toast.type === 'success' ? 'Update Success' : 'Action Failed'}
                                    </p>
                                    <p className="font-bold text-[13px] tracking-wide">{toast.message}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="px-6 pt-10 pb-6 items-center gap-4 sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-md z-40 flex">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                        <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[15px] font-[900] text-gray-900 uppercase tracking-[0.2em]">Contact Details</h1>
                </div>

                <form onSubmit={handleUpdatePhoneNumber} className="p-8 flex-1 flex flex-col">

                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center text-center mb-12"
                    >
                        <div className="relative mb-8">
                            <motion.div
                                className="absolute inset-0 border-2 border-indigo-600 rounded-[35px] opacity-20"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <div className="w-24 h-24 bg-white rounded-[32px] shadow-xl border border-gray-100 flex items-center justify-center text-indigo-600 relative z-10">
                                <Smartphone size={40} strokeWidth={1.5} />
                            </div>
                        </div>
                        <h2 className="text-3xl font-[1000] text-gray-900 mb-4 tracking-tighter">Mobile Number</h2>
                        <p className="text-sm font-bold text-gray-400 leading-relaxed max-w-[280px]">
                            We'll use this number to send booking confirmations and updates.
                        </p>
                    </motion.div>

                    {/* Input Area */}
                    <div className="space-y-6">
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                            <div className={`h-[72px] rounded-[28px] border-2 transition-all flex items-center px-6 gap-4 bg-white shadow-sm overflow-hidden ${isFocused ? 'border-indigo-600 shadow-indigo-100' : 'border-gray-100'
                                }`}>
                                <div className="flex items-center gap-3 pr-4 border-r border-gray-100 h-1/2">
                                    <span className="text-xl">🇮🇳</span>
                                    <span className="text-[16px] font-black text-gray-900">+91</span>
                                </div>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    placeholder="98765 43210"
                                    maxLength={10}
                                    className="flex-1 bg-transparent border-none text-[18px] font-black text-gray-900 outline-none placeholder:text-gray-200 tracking-[0.05em]"
                                />
                                {phoneNumber.length === 10 && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                        <CheckCircle2 size={24} className="text-emerald-500" />
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Trust Badge */}
                        <div className="flex items-center justify-center gap-2 py-4 opacity-40">
                            <ShieldCheck size={14} className="text-gray-400" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Secured by GlossCut SafeGuard™</span>
                        </div>
                    </div>

                    <div className="mt-auto pt-10">
                        <button
                            type="submit"
                            disabled={isLoading || phoneNumber.length !== 10}
                            className={`w-full h-16 rounded-[28px] flex items-center justify-center gap-3 font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all text-[12px] ${phoneNumber.length === 10
                                    ? 'bg-indigo-600 text-white shadow-indigo-200'
                                    : 'bg-gray-100 text-gray-300 shadow-none cursor-default'
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Verify & Update
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPhoneNumberScreen;
