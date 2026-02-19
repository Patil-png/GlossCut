import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronLeft, Wallet, ShieldCheck, CheckCircle2,
    AlertCircle, RotateCw, Info, Lock, ArrowRight,
    QrCode, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const EditUpiScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, refreshUser } = useAuth();

    const [upiId, setUpiId] = useState(location.state?.currentUpiId || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const isValidUpi = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId);

    const handleSave = async () => {
        if (!isValidUpi) {
            setError("Please enter a valid UPI ID (e.g. name@bank)");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await api.put('/api/shop', { upiId });
            await refreshUser();
            setSuccess(true);
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            console.error("Save Error:", err);
            setError(err.response?.data?.msg || "Failed to link UPI ID. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex justify-center">
            <div className="w-full max-w-[450px] bg-[#F8FAFC] min-h-screen shadow-2xl relative flex flex-col">

                {/* HEADER */}
                <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <ChevronLeft size={20} className="text-[#1C1C1E]" strokeWidth={2.5} />
                        </button>
                        <h1 className="text-lg font-black text-[#1C1C1E]">Payouts</h1>
                        <div className="w-10" />
                    </div>
                </header>

                <main className="flex-1 px-6 pt-10 pb-24">

                    {/* Hero Icon */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-24 h-24 mx-auto rounded-[32px] bg-indigo-50 flex items-center justify-center mb-6 shadow-sm border border-indigo-100"
                        >
                            <Wallet size={44} className="text-indigo-500" strokeWidth={1.5} />
                        </motion.div>
                        <h2 className="text-2xl font-black text-[#1C1C1E] mb-2 tracking-tight">Receive Payments</h2>
                        <p className="text-sm text-gray-500 font-medium px-8 leading-relaxed">
                            Link your primary UPI ID to receive direct payouts from your bookings.
                        </p>
                    </div>

                    {/* Trust Banner */}
                    <div className="bg-indigo-50/50 p-5 rounded-[28px] border border-indigo-100/50 mb-10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-indigo-100 flex-shrink-0">
                            <ShieldCheck size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-black text-[#1C1C1E]">Encrypted Setup</h4>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">Secure Transaction Logic</p>
                        </div>
                    </div>

                    {/* Input Field */}
                    <div className="space-y-2 mb-10">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] ml-2">UPI Identifier</label>
                        <div className={`relative group transition-all duration-300 ${upiId ? (isValidUpi ? 'ring-2 ring-green-100' : 'ring-2 ring-red-100') : ''
                            }`}>
                            <input
                                type="text"
                                value={upiId}
                                onChange={(e) => {
                                    setUpiId(e.target.value);
                                    setError(null);
                                }}
                                placeholder="yourname@bank"
                                className={`w-full h-16 bg-white border rounded-[24px] px-14 text-base font-bold text-[#1C1C1E] focus:outline-none transition-all ${upiId
                                        ? (isValidUpi ? 'border-green-500' : 'border-red-500')
                                        : 'border-gray-100 focus:border-indigo-500'
                                    } shadow-sm`}
                            />
                            <Wallet size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${upiId ? (isValidUpi ? 'text-green-500' : 'text-red-500') : 'text-gray-300'
                                }`} />

                            {upiId && (
                                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                    {isValidUpi ? (
                                        <CheckCircle2 size={22} className="text-green-500" />
                                    ) : (
                                        <AlertCircle size={22} className="text-red-500" />
                                    )}
                                </div>
                            )}
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-[13px] font-bold text-red-500 ml-2 mt-2 flex items-center gap-1.5"
                                >
                                    <AlertCircle size={14} />
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>
                        {!error && !upiId && (
                            <p className="text-[12px] text-gray-400 font-medium ml-2 mt-2 italic">
                                Format: username@bankname
                            </p>
                        )}
                    </div>

                    {/* Bottom Features */}
                    <div className="grid grid-cols-2 gap-3 mb-12">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                            <QrCode size={20} className="text-gray-400 mx-auto mb-2" />
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Dynamic QR</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                            <CreditCard size={20} className="text-gray-400 mx-auto mb-2" />
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Direct Payouts</p>
                        </div>
                    </div>

                </main>

                {/* Sticky Action Button */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent z-10 flex justify-center">
                    <button
                        onClick={handleSave}
                        disabled={loading || !upiId || !isValidUpi}
                        className={`w-full max-w-[400px] h-16 rounded-[24px] font-black tracking-tight flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-30 disabled:grayscale ${success ? 'bg-green-500 text-white shadow-green-100' : 'bg-indigo-500 text-white shadow-indigo-100'
                            }`}
                    >
                        {loading ? (
                            <RotateCw size={20} className="animate-spin" />
                        ) : success ? (
                            <>
                                <CheckCircle2 size={20} />
                                UPI Linked
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Verify & Link UPI ID
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditUpiScreen;
