import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Store, Check, AlertCircle, X, Sparkles, MapPin, Star, Loader2 } from 'lucide-react';
import api from '../utils/api';

const EditShopNameScreen = () => {
    const navigate = useNavigate();
    const { state } = useLocation();

    const [shopName, setShopName] = useState(state?.currentName || '');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const showToast = (message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleUpdate = async () => {
        if (!shopName.trim()) { showToast('Please enter a name.', 'error'); return; }
        if (shopName === state?.currentName) { showToast('No changes made.', 'info'); return; }

        setSubmitting(true);
        try {
            const res = await api.put('/api/shop', { name: shopName });
            if (res.status === 200) {
                showToast('Saved Successfully!', 'success');
                setTimeout(() => navigate(-1), 1500);
            }
        } catch (err) {
            showToast(err.response?.data?.msg || 'Update failed.', 'error');
        } finally {
            setSubmitting(false);
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
                <div className="pt-10 pb-8 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[17px] font-[900] text-gray-900">Edit Shop Name</h1>
                    <div className="w-10" />
                </div>

                <div className="flex-1 overflow-y-auto pb-32">
                    {/* Live Preview Card */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={14} className="text-[#6A1B9A]" />
                            <span className="text-[11px] font-black text-[#6A1B9A] uppercase tracking-widest">Live Preview</span>
                        </div>

                        <div className="bg-white rounded-[28px] p-4 flex items-center shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-gray-50">
                            <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center bg-gray-100 relative overflow-hidden mr-4">
                                <Store size={32} className="text-gray-300" />
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/20 to-gray-200/50" />
                                <div className="absolute bottom-[-10px] w-full bg-[#6A1B9A] flex items-center justify-center py-2.5">
                                    <div className="flex items-center gap-1">
                                        <span className="text-white text-[9px] font-black">4.8</span>
                                        <Star size={8} className="text-white" fill="white" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-[900] text-gray-900 truncate tracking-tight">{shopName || 'Your Shop Name'}</h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <MapPin size={12} className="text-gray-300" />
                                    <span className="text-[12px] font-bold text-gray-400">City Center • Unisex Salon</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-center mt-3 text-[11px] font-bold text-gray-400 italic">This is how customers will see your shop.</p>
                    </div>

                    {/* Input Section */}
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-black text-gray-900 mb-2.5 block ml-1">
                                Shop Name <span className="text-red-500">*</span>
                            </label>
                            <div className={`flex items-center bg-white h-16 rounded-2xl border-2 transition-all px-4 ${shopName ? 'border-[#6A1B9A] shadow-[0_8px_20px_rgba(106,27,154,0.05)]' : 'border-gray-100'}`}>
                                <Store size={20} className={shopName ? 'text-[#6A1B9A]' : 'text-gray-300'} />
                                <input
                                    className="flex-1 bg-transparent px-4 py-2 text-lg font-bold text-gray-900 placeholder-gray-300 focus:outline-none"
                                    placeholder="e.g. The Barber Club"
                                    value={shopName}
                                    onChange={(e) => setShopName(e.target.value)}
                                />
                                {shopName && (
                                    <button
                                        onClick={() => setShopName('')}
                                        className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"
                                    >
                                        <X size={14} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                            <p className="text-[12px] text-gray-400 font-bold mt-4 leading-relaxed ml-1">
                                Use a unique name to stand out in search results. Minimum 3 characters recommended.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] to-transparent z-40">
                    <div className="max-w-[450px] mx-auto w-full">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleUpdate}
                            disabled={submitting || !shopName.trim()}
                            className={`w-full h-16 rounded-[22px] font-black text-lg text-white shadow-xl flex items-center justify-center gap-3 transition-all ${submitting || !shopName.trim() ? 'bg-gray-300 shadow-none' : 'bg-[#6A1B9A] shadow-purple-900/20'}`}
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : "Save Changes"}
                            {!submitting && (
                                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                                    <Check size={16} strokeWidth={3} />
                                </div>
                            )}
                        </motion.button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EditShopNameScreen;
