import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Star, MapPin, Phone,
    Tag, MessageCircle, Clock, ShieldCheck,
    Zap, CheckCircle2, AlertCircle, XCircle,
    Trophy, Scissors, MoreVertical, Loader2,
    Calendar, User, IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import SwipeButton from '../components/SwipeButton';

const BarberProfileViewScreen = () => {
    const { barberId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [shopData, setShopData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deactivating, setDeactivating] = useState(false);
    const [deactivated, setDeactivated] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const showToast = useCallback((message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }, []);

    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (e) => {
        const scrollPosition = e.target.scrollLeft;
        const width = e.target.clientWidth;
        const index = Math.round(scrollPosition / width);
        setActiveIndex(index);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                // Use actual barberId or fall back to current user
                const targetId = barberId || user?.id || user?._id;
                const res = await api.get(`/api/shop/barber/${targetId}`);
                setShopData(res.data);
            } catch (err) {
                console.error("Fetch Profile Error:", err);
                showToast("Unable to load profile details.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [barberId, user, showToast]);

    const handleDeactivate = async () => {
        setDeactivating(true);
        try {
            const targetId = barberId || user?.id || user?._id;
            await api.put(`/api/shop/barber/cancel-listing/${targetId}`);
            showToast("Listing deactivated successfully!", "success");
            setDeactivated(true);
            setTimeout(() => navigate(-1), 2000);
        } catch (err) {
            console.error("Deactivate Error:", err);
            showToast("Failed to cancel listing.", "error");
        } finally {
            setDeactivating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Curating Your Profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-32 flex justify-center">
            <div className="w-full max-w-[450px] relative min-h-screen flex flex-col">

                {/* Header Overlay */}
                <div className="absolute top-0 left-0 right-0 z-40 px-6 pt-10 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm flex items-center justify-center active:scale-95 transition-transform text-white">
                        <ArrowLeft size={22} strokeWidth={2.5} />
                    </button>
                    <button className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm flex items-center justify-center text-white">
                        <MoreVertical size={20} />
                    </button>
                </div>

                {/* Hero Section */}
                <div className="relative h-[450px] overflow-hidden">
                    {shopData?.shopImages?.length > 0 ? (
                        <div
                            onScroll={handleScroll}
                            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full"
                        >
                            {shopData.shopImages.map((img, idx) => {
                                const imageUrl = getProcessedImageUri(img);
                                return (
                                    <div key={idx} className="w-full h-full shrink-0 snap-center relative flex items-center justify-center overflow-hidden bg-black">
                                        {/* Blurred background */}
                                        <img
                                            src={imageUrl}
                                            alt="blur-bg"
                                            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110"
                                        />
                                        {/* Foreground contained */}
                                        <img
                                            src={imageUrl}
                                            alt={`Shop ${idx + 1}`}
                                            className="relative z-10 max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : shopData?.image ? (
                        <img
                            src={shopData.image.startsWith('http') ? shopData.image : `${import.meta.env.VITE_API_URL}${shopData.image}`}
                            className="w-full h-full object-cover"
                            alt="Shop"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white/20">
                            <Scissors size={64} />
                            <span className="mt-4 font-black uppercase tracking-widest text-[10px]">No Gallery Image</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/20 pointer-events-none z-20" />

                    {shopData?.shopImages?.length > 0 && (
                        <div className="absolute bottom-32 left-8 flex gap-1.5">
                            {shopData.shopImages.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`}
                                />
                            ))}
                        </div>
                    )}

                    <div className="absolute bottom-10 left-8 right-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="px-3 py-1 bg-indigo-600 rounded-full flex items-center gap-1.5 border border-indigo-400 shadow-lg shadow-indigo-500/20">
                                <ShieldCheck size={12} className="text-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Verified Partner</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-[1000] text-white tracking-tighter leading-none mb-2">
                            {shopData?.name || "Premium Barber"}
                        </h1>
                        <div className="flex items-center gap-2 text-white/60">
                            <MapPin size={14} className="text-indigo-400" />
                            <p className="text-sm font-bold truncate">{shopData?.address || "Location Access Enabled"}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="mt-[-40px] relative z-10 px-6">
                    <div className="bg-white rounded-[40px] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-50 flex flex-col">

                        {/* Highlights Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-10">
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                    <MessageCircle size={20} />
                                </div>
                                <span className="text-[15px] font-black text-gray-900 mt-2">{shopData?.reviews || 0}</span>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reviews</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 border-x border-gray-50">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                                    <Star size={20} fill="currentColor" />
                                </div>
                                <span className="text-[15px] font-black text-gray-900 mt-2">{shopData?.rating?.toFixed(1) || "New"}</span>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rating</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                                    <Trophy size={20} />
                                </div>
                                <span className="text-[15px] font-black text-gray-900 mt-2">
                                    {shopData?.selectedListingPlace?.tierId ? `#${shopData.selectedListingPlace.tierId}` : "Top"}
                                </span>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Position</span>
                            </div>
                        </div>

                        <div className="h-px w-full bg-gray-50 mb-10" />

                        {/* Business Info */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Business Insights</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-indigo-600 shadow-sm">
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Identity</p>
                                            <p className="text-[15px] font-black text-gray-900">{shopData?.phone || "Private"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-emerald-500 shadow-sm">
                                            <Tag size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Niche / Category</p>
                                            <p className="text-[15px] font-black text-gray-900">{shopData?.category || "Men's Luxury"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deactivation Area */}
                {!deactivated && (
                    <div className="px-6 mt-12 mb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="bg-rose-50 rounded-[40px] p-8 border border-rose-100 flex flex-col gap-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                                    <AlertCircle size={22} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-rose-900 tracking-tight">Pause Client Access?</h4>
                                    <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mt-1">Temporary deactivation</p>
                                </div>
                            </div>
                            <p className="text-[13px] font-bold text-rose-900/40 leading-relaxed italic">
                                "Deactivating will hide your profile from the map. You can re-enable it anytime from your dashboard."
                            </p>
                            <SwipeButton
                                onSwipe={handleDeactivate}
                                title="Slide to Deactivate"
                                color="#E11D48"
                                secondaryColor="#FFFFFF"
                            />
                        </div>
                    </div>
                )}

                {deactivated && (
                    <div className="px-6 mt-12 mb-20">
                        <div className="bg-gray-100 rounded-[40px] p-8 border border-gray-200 flex items-center justify-center gap-3">
                            <XCircle size={24} className="text-gray-400" />
                            <span className="text-lg font-black text-gray-400">Listing Deactivated</span>
                        </div>
                    </div>
                )}

                {/* TOAST PANEL */}
                <AnimatePresence>
                    {toast.visible && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="fixed bottom-24 left-0 right-0 z-50 flex justify-center px-8"
                        >
                            <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border ${toast.type === 'error' ? 'bg-rose-600 border-rose-500 text-white' :
                                toast.type === 'warning' ? 'bg-amber-500 border-amber-400 text-white' :
                                    'bg-emerald-600 border-emerald-500 text-white'
                                }`}>
                                {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                                <span className="font-bold text-[13px] tracking-wide">{toast.message}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BarberProfileViewScreen;
