import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
    ArrowLeft,
    Crown,
    Sparkles,
    MapPin,
    CheckCircle,
    ChevronRight,
    Loader2,
    Zap,
    Navigation,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LeafletMap from '../components/LeafletMap';

const ListingTierSelectionScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [shopData, setShopData] = useState(null);
    const [availableAreas, setAvailableAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [selectedTier, setSelectedTier] = useState(null);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const shopRes = await api.get("/api/shop/my-shop");
                setShopData(shopRes.data);

                if (shopRes.data?.location?.coordinates) {
                    const [lng, lat] = shopRes.data.location.coordinates;
                    const areasRes = await api.get(`/api/areas/check-location?lat=${lat}&lng=${lng}`);
                    setAvailableAreas(areasRes.data);

                    if (areasRes.data.length > 0) {
                        setSelectedArea(areasRes.data[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleSelectTier = (tierId, price) => {
        navigate('/payment', {
            state: {
                paymentType: 'listing-tier',
                tier: tierId,
                areaId: selectedArea?._id || 'default',
                category: shopData?.category, // Added category
                amount: price,
                areaName: selectedArea?.name || 'Standard Area'
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="animate-spin text-[#6A1B9A]" size={32} />
            </div>
        );
    }

    const hasLocation = shopData?.location?.coordinates;

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
            <div className="w-full max-w-[450px] bg-white min-h-screen shadow-2xl relative flex flex-col">

                {/* Header */}
                <div className="bg-gradient-to-br from-[#6A1B9A] to-[#8E24AA] pt-6 pb-20 px-6 rounded-b-[40px] relative overflow-hidden">
                    <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10 flex items-center justify-between mb-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30"
                        >
                            <ArrowLeft size={20} className="text-white" />
                        </button>
                        <h1 className="text-xl font-black text-white tracking-tight">Boost Visibility</h1>
                        <div className="w-10" />
                    </div>
                </div>

                <div className="flex-1 px-6 -mt-12 mb-32 z-20">

                    {/* Location Card */}
                    <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                    <MapPin size={20} className="text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shop Location</p>
                                    <p className="text-sm font-bold text-gray-900 truncate max-w-[180px]">
                                        {shopData?.address || "Location not set"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/boost-visibility')}
                                className="px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100"
                            >
                                <span className="text-[11px] font-bold text-gray-600 uppercase">Change</span>
                            </button>
                        </div>

                        {!hasLocation ? (
                            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-3">
                                <Info size={18} className="text-amber-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-amber-900 mb-1">Location Required</p>
                                    <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                                        Please pin your shop location on the map in 'Boost Visibility' settings to see area-specific priority pricing.
                                    </p>
                                </div>
                            </div>
                        ) : availableAreas.length > 0 ? (
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                                        Inside: {availableAreas[0].name}
                                    </p>
                                </div>
                                <Sparkles size={16} className="text-emerald-600" />
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                    Standard Indian Service Area
                                </p>
                                <Zap size={16} className="text-gray-400" />
                            </div>
                        )}
                    </div>

                    {/* Tier Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Available Tiers</h2>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase">Priority Rank</span>
                        </div>

                        {[1, 2].map((tierId) => {
                            const areaPricing = selectedArea?.tierPricing?.find(t => t.tierId === tierId);
                            const price = areaPricing ? areaPricing.price : (1000 - (tierId - 1) * 100);

                            const getRankName = (id) => {
                                if (id === 1) return "Elite Rank";
                                if (id === 2) return "Premium Rank";
                                if (id === 3) return "Priority Rank";
                                if (id === 4) return "Standard Plus";
                                return "Base Boost";
                            };

                            const getRankColor = (id) => {
                                if (id === 1) return "text-amber-500";
                                if (id === 2) return "text-indigo-600";
                                if (id === 3) return "text-emerald-600";
                                return "text-gray-600";
                            };

                            return (
                                <TouchableOpacity
                                    key={tierId}
                                    onClick={() => handleSelectTier(tierId, price)}
                                    className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tierId === 1 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                                            {tierId === 1 ? <Crown size={24} className="text-amber-500" /> : <Sparkles size={22} className="text-gray-400" />}
                                        </div>
                                        <div>
                                            <p className={`text-[15px] font-black tracking-tight ${getRankColor(tierId)}`}>
                                                {getRankName(tierId)}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pos. #{tierId} in {selectedArea?.name || 'Search'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-lg font-black text-gray-900 tracking-tighter">₹{price}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">/ Month</p>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-300" />
                                    </div>
                                </TouchableOpacity>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="fixed bottom-0 w-full max-w-[450px] bg-white border-t border-gray-100 p-6 z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                        <Info size={18} className="text-indigo-600 flex-shrink-0" />
                        <p className="text-[11px] text-indigo-900 font-medium leading-relaxed">
                            Listing tiers boost your placement in search results for customers within the selected service area.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper components - TouchableOpacity since we used it in the code
const TouchableOpacity = ({ children, onClick, className }) => (
    <div
        onClick={onClick}
        className={`cursor-pointer ${className}`}
    >
        {children}
    </div>
);

export default ListingTierSelectionScreen;
