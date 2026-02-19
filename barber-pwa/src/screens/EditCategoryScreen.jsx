import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, AlertCircle, Info, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CategoryCard = ({ title, description, isSelected, isDisabled, onClick }) => (
    <motion.div
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        onClick={!isDisabled ? onClick : undefined}
        className={`relative p-6 rounded-[28px] border-2 transition-all cursor-pointer overflow-hidden ${isSelected ? 'bg-white border-[#6A1B9A] shadow-[0_12px_40px_rgba(106,27,154,0.08)]' : 'bg-white border-gray-100 shadow-sm opacity-80'}`}
    >
        <div className="flex items-center justify-between mb-2">
            <h3 className={`text-lg font-[900] ${isSelected ? 'text-[#6A1B9A]' : 'text-gray-900'}`}>{title}</h3>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#6A1B9A] border-[#6A1B9A]' : 'border-gray-200'}`}>
                {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
            </div>
        </div>
        <p className={`text-[13px] font-bold leading-relaxed ${isSelected ? 'text-[#6A1B9A]/70' : 'text-gray-400'}`}>
            {description}
        </p>

        {isDisabled && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                <Lock size={20} className="text-gray-300" />
            </div>
        )}
    </motion.div>
);

const EditCategoryScreen = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { updateProfile } = useAuth();

    const [selectedCategory, setSelectedCategory] = useState(state?.currentCategory || '');
    const [listingConfirmed, setListingConfirmed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const showToast = (message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    useEffect(() => {
        const fetchShopStatus = async () => {
            try {
                const res = await api.get('/api/shop/my-shop');
                setListingConfirmed(res.data.listingConfirmed);
                if (res.data.category) setSelectedCategory(res.data.category);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchShopStatus();
    }, []);

    const handleSave = async () => {
        if (listingConfirmed) return;
        setSubmitting(true);
        try {
            const res = await api.put('/api/shop/category', { category: selectedCategory });
            if (res.data.success) {
                showToast('Category updated!', 'success');
                // Optional: update local user context if needed
                setTimeout(() => navigate(-1), 1500);
            }
        } catch (err) {
            showToast('Failed to save changes.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmListing = async () => {
        setConfirming(true);
        try {
            const res = await api.put('/api/shop/confirm-listing', {});
            if (res.data.success) {
                setListingConfirmed(true);
                showToast('Shop listing is now live!', 'success');
                setTimeout(() => navigate(-1), 1500);
            }
        } catch (err) {
            showToast('Confirmation failed.', 'error');
        } finally {
            setConfirming(false);
        }
    };

    const categories = [
        { id: 'Barber', title: 'Barber Shop', desc: 'Classic men\'s grooming and haircuts.' },
        { id: 'Women\'s Salon', title: 'Women\'s Salon', desc: 'Specialized hair, beauty, and spa services.' },
        { id: 'Unisex', title: 'Unisex Salon', desc: 'Professional grooming for everyone.' },
        { id: 'Pet Care', title: 'Pet Care', desc: 'Grooming and hygiene for your pets.' }
    ];

    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#6A1B9A]" size={32} />
        </div>
    );

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
                            <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-xl pointer-events-auto ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-gray-900'}`}>
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
                    <div className="flex flex-col items-center">
                        <h1 className="text-[17px] font-[900] text-gray-900">Establishment Type</h1>
                        {listingConfirmed && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <ShieldCheck size={10} className="text-[#6A1B9A]" />
                                <span className="text-[9px] font-black text-[#6A1B9A] uppercase tracking-widest">Verified</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={listingConfirmed || submitting}
                        className={`text-[15px] font-black ${listingConfirmed || submitting ? 'text-gray-300' : 'text-[#6A1B9A]'}`}
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : "Save"}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pb-32">
                    <div className="mt-6 mb-8">
                        <h2 className="text-3xl font-[900] text-gray-900 leading-[1.1] tracking-tight mb-4">
                            What type of shop do you manage?
                        </h2>
                        <p className="text-[15px] font-bold text-gray-500 leading-relaxed">
                            This selection helps us customize your dashboard and improve your search visibility.
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {categories.map(cat => (
                            <CategoryCard
                                key={cat.id}
                                title={cat.title}
                                description={cat.desc}
                                isSelected={selectedCategory === cat.id}
                                isDisabled={listingConfirmed}
                                onClick={() => setSelectedCategory(cat.id)}
                            />
                        ))}
                    </div>

                    {/* Lockdown Notice */}
                    {listingConfirmed && (
                        <div className="mt-8 bg-indigo-50/30 border border-dashed border-indigo-200 rounded-[28px] p-6 text-center">
                            <Lock size={20} className="text-indigo-400 mx-auto mb-3" />
                            <p className="text-[13px] font-bold text-indigo-900/60 leading-relaxed">
                                Your category is locked as your profile is verified. Please contact support to change your establishment type.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                {!listingConfirmed && (
                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] to-transparent z-40">
                        <div className="max-w-[450px] mx-auto w-full">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleConfirmListing}
                                disabled={confirming || !selectedCategory}
                                className={`w-full h-16 rounded-[22px] font-black text-lg text-white shadow-xl flex items-center justify-center gap-3 transition-all ${confirming || !selectedCategory ? 'bg-gray-300 shadow-none' : 'bg-[#6A1B9A] shadow-purple-900/20'}`}
                            >
                                {confirming ? <Loader2 className="animate-spin" /> : "Confirm & List Online"}
                                {!confirming && (
                                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                )}
                            </motion.button>
                            <p className="text-center mt-4 text-[11px] font-[800] text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                <ShieldCheck size={12} /> Secure Listing Verification
                            </p>
                        </div>
                    </div>
                )}

                {listingConfirmed && (
                    <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center z-40">
                        <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-100 shadow-lg flex items-center gap-3">
                            <CheckCircle size={18} className="text-emerald-500" />
                            <span className="text-sm font-black text-gray-900">Verified Listing Status</span>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default EditCategoryScreen;
