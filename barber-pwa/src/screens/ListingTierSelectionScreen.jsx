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
    Info,
    User,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ListingTierSelectionScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [shopData, setShopData] = useState(null);
    const [availableAreas, setAvailableAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [availability, setAvailability] = useState({});
    const [userActivePlan, setUserActivePlan] = useState(null); // Metadata for current user's active plan

    const fetchAvailability = async (areaId, category) => {
        try {
            const res = await api.get(`/api/payment/listing-availability?areaId=${areaId || 'default'}&category=${category}`);
            // Backend now returns { availability, userActivePlan }
            setAvailability(res.data.availability || {});
            setUserActivePlan(res.data.userActivePlan || null);

            // If the user has an active plan in ANOTHER category, ensure we show it
            if (res.data.userActivePlan && res.data.userActivePlan.category !== category) {
                // Keep the existing selectedCategory but note that user is locked elsewhere
            }
        } catch (error) {
            console.error("Failed to fetch availability", error);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const shopRes = await api.get("/api/shop/my-shop");
                setShopData(shopRes.data);

                let initialCategory = shopRes.data.category;
                if (initialCategory === 'Unisex') {
                    initialCategory = 'Barber'; // Default starting view
                }
                setSelectedCategory(initialCategory);

                if (shopRes.data?.location?.coordinates) {
                    const [lng, lat] = shopRes.data.location.coordinates;
                    const areasRes = await api.get(`/api/areas/check-location?lat=${lat}&lng=${lng}`);
                    setAvailableAreas(areasRes.data);

                    const area = areasRes.data.length > 0 ? areasRes.data[0] : null;
                    setSelectedArea(area);

                    if (initialCategory) {
                        fetchAvailability(area?._id, initialCategory);
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

    // Re-fetch when category or area changes
    useEffect(() => {
        if (selectedCategory && (selectedArea !== undefined)) {
            fetchAvailability(selectedArea?._id, selectedCategory);
        }
    }, [selectedCategory, selectedArea]);

    // Check if user has active plan in CURRENT area (cross-category)
    const hasAnyActivePlan = !!userActivePlan;

    // Check if the plan is in the CURRENTLY SELECTED category
    const planInCurrentCategory = userActivePlan?.category === selectedCategory;

    const handleSelectTier = (tierId, price, status) => {
        if (status?.isBooked) return; // Prevent clicking booked slots (including yours)
        if (hasAnyActivePlan && !status?.isMine) return; // Block selecting other tiers if one is active ANYWHERE in this area

        navigate('/payment', {
            state: {
                paymentType: 'listing-tier',
                tier: tierId,
                areaId: selectedArea?._id || 'default',
                category: selectedCategory,
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

    const categories = [
        { id: 'Barber', name: 'Barber (Mens)', icon: User },
        { id: "Women's Salon", name: "Women's Salon", icon: Users }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
            <div className="w-full max-w-[450px] bg-white min-h-screen shadow-2xl relative flex flex-col pb-40">

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

                <div className="flex-1 px-6 -mt-12 z-20">

                    {/* Location & Category Selection Container */}
                    <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 mb-6 space-y-5">
                        {/* Location Section */}
                        <div className="flex items-center justify-between mb-1">
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

                        {/* Category Picker for Unisex Shops */}
                        {shopData?.category === 'Unisex' && (
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Target Section</p>
                                <div className="flex gap-2">
                                    {categories.map((cat) => {
                                        const Icon = cat.icon;
                                        const isActive = selectedCategory === cat.id;
                                        // A category is clickable if no plan exists or if it's the category with the active plan
                                        const isClickable = !hasAnyActivePlan || (userActivePlan?.category === cat.id);

                                        return (
                                            <TouchableOpacity
                                                key={cat.id}
                                                onClick={() => isClickable && setSelectedCategory(cat.id)}
                                                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${isActive
                                                    ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100'
                                                    : 'bg-white border-gray-100'
                                                    } ${!isClickable ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                                            >
                                                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                                                <span className={`text-[10px] font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                                    {cat.id === 'Barber' ? 'Mens' : 'Womens'}
                                                </span>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </div>
                                {hasAnyActivePlan && (
                                    <div className="mt-3 p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-2">
                                        <CheckCircle size={14} className="text-indigo-600" />
                                        <p className="text-[9px] text-indigo-800 font-black uppercase tracking-tight">
                                            Active Priority in {userActivePlan.category === 'Barber' ? 'Mens' : 'Womens'} Section
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {!hasLocation ? (
                            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-4">
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

                        {hasAnyActivePlan && (
                            <div className="bg-indigo-50/50 rounded-2xl p-3 border border-indigo-100 flex items-center gap-2 mb-2">
                                <Info size={14} className="text-indigo-600" />
                                <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">
                                    Limit: One active placement per shop
                                </p>
                            </div>
                        )}

                        {[1, 2].map((tierId) => {
                            const areaPricing = selectedArea?.tierPricing?.find(t => t.tierId === tierId);
                            const price = areaPricing ? areaPricing.price : (1000 - (tierId - 1) * 100);

                            // Status from availability map (current category)
                            const status = availability[tierId];

                            // Specific check for isMine from userActivePlan cross-category
                            const isMineInThisCategory = status?.isMine;
                            const isMineElsewhere = hasAnyActivePlan && !isMineInThisCategory;

                            const getRankName = (id) => {
                                if (id === 1) return "Elite Rank";
                                if (id === 2) return "Premium Rank";
                                return "Base Boost";
                            };

                            const getRankColor = (id) => {
                                if ((status?.isBooked && !isMineInThisCategory) || (hasAnyActivePlan && !isMineInThisCategory)) return "text-gray-400";
                                if (id === 1) return "text-amber-500";
                                if (id === 2) return "text-indigo-600";
                                return "text-gray-600";
                            };

                            return (
                                <TouchableOpacity
                                    key={tierId}
                                    onClick={() => handleSelectTier(tierId, price, status)}
                                    className={`rounded-3xl p-5 border shadow-sm flex items-center justify-between transition-all active:scale-[0.98] ${isMineInThisCategory
                                        ? 'bg-indigo-50 border-indigo-200 shadow-indigo-100'
                                        : (status?.isBooked || hasAnyActivePlan ? 'bg-gray-50 border-gray-100 opacity-60 grayscale cursor-not-allowed' : 'bg-white border-gray-100 hover:border-indigo-200')
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isMineInThisCategory ? 'bg-white' : (tierId === 1 ? 'bg-amber-50' : 'bg-gray-50')}`}>
                                            {tierId === 1 ? <Crown size={24} className={status?.isBooked && !isMineInThisCategory ? 'text-gray-300' : 'text-amber-500'} /> : <Sparkles size={22} className={status?.isBooked && !isMineInThisCategory ? 'text-gray-300' : 'text-indigo-400'} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className={`text-[15px] font-black tracking-tight ${getRankColor(tierId)}`}>
                                                    {getRankName(tierId)}
                                                </p>
                                                {isMineInThisCategory && (
                                                    <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-tighter">My Active Plan</span>
                                                )}
                                                {status?.isBooked && !isMineInThisCategory && (
                                                    <span className="text-[9px] font-black bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Already Booked</span>
                                                )}
                                                {hasAnyActivePlan && !isMineInThisCategory && (
                                                    <span className="text-[9px] font-black bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Locked</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pos. #{tierId} in {selectedArea?.name || 'Search'}</p>
                                            </div>
                                            {isMineInThisCategory && status.lockedAt && (
                                                <div className="mt-2 flex flex-col gap-0.5 bg-indigo-100/30 p-2 rounded-xl border border-indigo-100/50">
                                                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-tight">
                                                        Paid ₹{status.price} • {status.duration || 30} Days
                                                    </p>
                                                    <p className="text-[9px] text-indigo-600/70 font-bold uppercase tracking-tighter">
                                                        Expires: {new Date(new Date(status.lockedAt).getTime() + (status.duration || 30) * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            {status?.isBooked && !isMineInThisCategory ? (
                                                <p className="text-xs font-black text-gray-400 uppercase">Unavailable</p>
                                            ) : hasAnyActivePlan && !isMineInThisCategory ? (
                                                <p className="text-xs font-black text-gray-300 uppercase">Blocked</p>
                                            ) : isMineInThisCategory ? (
                                                <div className="flex flex-col items-end">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center mb-1 shadow-md shadow-indigo-200">
                                                        <CheckCircle size={14} className="text-white" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Active</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-lg font-black text-gray-900 tracking-tighter">₹{price}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">/ Month</p>
                                                </>
                                            )}
                                        </div>
                                        {(!status?.isBooked && !hasAnyActivePlan) && <ChevronRight size={18} className="text-gray-300" />}
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
