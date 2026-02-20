import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, AlertCircle, Check, Loader2, Navigation, ShieldCheck, Home } from 'lucide-react';
import api from '../utils/api';

const EditShopAddressScreen = () => {
    const navigate = useNavigate();
    const { state } = useLocation();

    const [shopAddress, setShopAddress] = useState(state?.currentAddress || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const showToast = (message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleUpdate = async () => {
        if (!shopAddress.trim()) { showToast('Address cannot be empty.', 'error'); return; }

        setIsSubmitting(true);
        try {
            const res = await api.put('/api/shop', { address: shopAddress });
            if (res.status === 200) {
                showToast('Address updated! Pending approval.', 'success');
                setTimeout(() => navigate(-1), 1500);
            }
        } catch (err) {
            showToast('Failed to update. Server error.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                <div className="pt-10 pb-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[17px] font-[900] text-gray-900">Store Location</h1>
                    <div className="w-10" />
                </div>

                <div className="flex-1 overflow-y-auto pb-32">
                    {/* Animated Map Hero */}
                    <div className="mb-10 relative h-[200px] bg-indigo-50/50 rounded-[32px] overflow-hidden border border-indigo-100/50 flex items-center justify-center">
                        {/* Decorative Roads */}
                        <div className="absolute top-[30%] w-[120%] h-3 bg-indigo-100/40 -rotate-12" />
                        <div className="absolute left-[40%] h-[120%] w-3 bg-indigo-100/40 rotate-12" />

                        {/* Animated Pin */}
                        <motion.div
                            animate={{ y: [0, -15, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-10 flex flex-col items-center"
                        >
                            <div className="w-14 h-14 rounded-full bg-[#6A1B9A] border-4 border-white shadow-xl flex items-center justify-center">
                                <Home size={24} className="text-white" fill="currentColor" />
                            </div>
                            <div className="w-2 h-4 bg-[#6A1B9A] -mt-1 rounded-full" />
                            <div className="w-6 h-2 bg-[#6A1B9A]/10 rounded-full mt-1 blur-[1px]" />
                        </motion.div>

                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/50">
                            <h3 className="text-sm font-black text-gray-900 mb-1">Precisely Locate Your Shop</h3>
                            <p className="text-[11px] font-bold text-gray-500">Accurate addresses reduce cancellations by 30%</p>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Complete Address</label>
                                {shopAddress.length > 10 && <Check size={14} className="text-emerald-500" />}
                            </div>

                            <div className={`flex items-start bg-white min-h-[140px] rounded-2xl border-2 transition-all p-4 ${shopAddress ? 'border-[#6A1B9A] shadow-[0_8px_20px_rgba(106,27,154,0.05)]' : 'border-gray-100'}`}>
                                <textarea
                                    className="flex-1 bg-transparent text-lg font-bold text-gray-900 placeholder-gray-300 focus:outline-none resize-none leading-relaxed h-full"
                                    placeholder="Flat No, Building, Street, Landmark..."
                                    value={shopAddress}
                                    onChange={(e) => setShopAddress(e.target.value)}
                                />
                                <MapPin size={20} className="text-gray-300 ml-2 mt-1" />
                            </div>
                        </div>

                        {/* Privacy Shield */}
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                <ShieldCheck size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-[14px] font-black text-emerald-900 mb-1">Privacy Protected</h4>
                                <p className="text-[12px] font-bold text-emerald-600/80 leading-tight">
                                    Your exact address is only shared with customers.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] to-transparent z-40">
                    <div className="max-w-[450px] mx-auto w-full">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleUpdate}
                            disabled={isSubmitting || !shopAddress.trim()}
                            className={`w-full h-16 rounded-[22px] font-black text-lg text-white shadow-xl flex items-center justify-center gap-3 transition-all ${isSubmitting || !shopAddress.trim() ? 'bg-gray-300 shadow-none' : 'bg-[#6A1B9A] shadow-purple-900/20'}`}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Save Location"}
                            {!isSubmitting && <Navigation size={18} fill="currentColor" className="ml-1" />}
                        </motion.button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EditShopAddressScreen;
