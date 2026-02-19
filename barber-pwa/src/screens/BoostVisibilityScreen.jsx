import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
    ArrowLeft,
    CheckCircle,
    Zap,
    MapPin,
    ShieldCheck,
    Tag,
    Crown,
    Sparkles,
    Megaphone,
    Navigation,
    Lock,
    Hash,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTS ---

const SectionHeader = ({ title, icon: Icon }) => (
    <div className="flex items-center px-5 mb-3 mt-6">
        {Icon && <Icon size={16} className="text-[#3742FA] mr-2" />}
        <h2 className="text-[15px] font-bold text-gray-500 uppercase tracking-wider">
            {title}
        </h2>
    </div>
);

const InfoRow = ({ icon: Icon, label, value, subValue, onClick, canEdit = true, isLast }) => (
    <div
        onClick={canEdit ? onClick : undefined}
        className={`flex items-center p-4 bg-white ${!isLast ? 'border-b border-gray-100' : ''} ${canEdit ? 'cursor-pointer active:bg-gray-50' : ''} transition-colors`}
    >
        <div className="w-10 h-10 rounded-full bg-[#3742FA]/10 flex items-center justify-center mr-3 flex-shrink-0">
            <Icon size={20} className="text-[#3742FA]" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[13px] text-gray-500 font-medium mb-0.5">{label}</p>
            <p className="text-[15px] text-gray-900 font-bold truncate">{value}</p>
            {subValue && (
                <p className="text-[12px] text-[#3742FA] font-medium mt-0.5">{subValue}</p>
            )}
        </div>
        {canEdit && (
            <ChevronRight size={16} className="text-gray-400 ml-2 flex-shrink-0" />
        )}
    </div>
);

const SubscriptionAdvantageSection = () => (
    <div className="mx-5 mb-6 rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white to-[#F4F5F7]" />
        <div className="relative p-5">
            <div className="flex items-center mb-4">
                <Zap size={20} className="text-[#3742FA] mr-2" />
                <h3 className="text-lg font-extrabold text-gray-900">Boost Advantages</h3>
            </div>

            <div className="space-y-3 mb-5">
                {[
                    { title: "Priority Search", desc: "Appear at the top of local search results." },
                    { title: "Map Visibility", desc: "Your shop becomes visible on the customer map." },
                    { title: "Instant Booking", desc: "Customers can find and book you 24/7." }
                ].map((item, idx) => (
                    <div key={idx} className="flex items-start">
                        <CheckCircle size={16} className="text-[#10B981] mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-[13px] text-gray-600 leading-snug">
                            <span className="font-bold text-gray-900">{item.title}:</span> {item.desc}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-[#3742FA]/5 rounded-xl p-4 border border-[#3742FA]/10">
                <h4 className="text-[12px] font-bold text-[#3742FA] uppercase tracking-wide mb-2">
                    Visible Changes For Customers:
                </h4>
                <div className="space-y-2">
                    {["Featured listing in search results", "Active shop pin on the Map"].map((text, idx) => (
                        <div key={idx} className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3742FA] mr-2" />
                            <p className="text-[13px] text-gray-600 font-medium">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const BoostVisibilityScreen = () => {
    const navigate = useNavigate();
    const { user, isMainOwner } = useAuth();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [shopData, setShopData] = useState(null);
    // const [timeLeft, setTimeLeft] = useState(""); // TODO: Implement countdown

    // Check subscription status
    const isSubscribed = (user?.isSubscribed || user?.subscriptionStatus === 'active') &&
        (user?.subscriptionExpiry ? new Date(user.subscriptionExpiry) > new Date() : true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansRes, shopRes] = await Promise.all([
                    api.get("/api/subscription/plans"),
                    api.get("/api/shop/my-shop")
                ]);

                setPlans(plansRes.data);
                if (plansRes.data.length > 0) setSelectedPlan(plansRes.data[0]);
                setShopData(shopRes.data);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubscribe = () => {
        // Placeholder for PWA Payment Integration (Razorpay Web)
        alert("Payment integration pending for PWA. Please use the mobile app for now.");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#3742FA]" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F5F7] flex justify-center">
            <div className="w-full max-w-[450px] bg-[#F4F5F7] min-h-screen shadow-2xl relative pb-24">

                {/* HEADER */}
                <div className="relative overflow-hidden bg-[#3742FA] pb-8 rounded-b-[40px] shadow-lg">
                    {/* Animated Background Blobs */}
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-[-20px] left-[-20px] w-48 h-48 bg-white/10 rounded-full blur-3xl"
                    />

                    <div className="relative z-10 px-5 pt-8 pb-4 flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-[42px] h-[42px] rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 active:scale-95 transition-transform"
                        >
                            <ArrowLeft size={20} className="text-white" />
                        </button>
                        <h1 className="text-[20px] font-extrabold text-white tracking-tight">
                            Subscription Plans
                        </h1>
                        <div className="w-[42px]" />
                    </div>
                </div>

                {/* CONTENT */}
                <div className="mt-[-20px] relative z-20">

                    {/* Active Subscription Card */}
                    {isSubscribed && (
                        <div className="mx-5 mb-6">
                            <div className={`rounded-3xl p-6 shadow-xl relative overflow-hidden ${user?.isTrial ? 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]' : 'bg-gradient-to-br from-[#4F46E5] to-[#6366F1]'}`}>
                                <div className="relative z-10 text-white">
                                    <div className="flex items-center mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mr-4">
                                            {user?.isTrial ? <Sparkles size={24} /> : <Crown size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">
                                                {user?.isTrial ? "Trial Membership" : "Premium Member"}
                                            </h3>
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm mt-1">
                                                <ShieldCheck size={12} className="mr-1" />
                                                <span className="text-[11px] font-bold">
                                                    {user?.isTrial ? "Joining Bonus" : "Active Plan"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-white/90 font-medium">
                                        {isMainOwner ? "Your shop is fully unlocked and visible." : "Shop owner's premium plan covers you."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {(!isSubscribed || user?.isTrial) && (
                        <>
                            <SubscriptionAdvantageSection />

                            <SectionHeader title="Select Your Plan" icon={Tag} />

                            {/* Plans Scroll */}
                            <div className="overflow-x-auto pb-6 px-5 flex space-x-4 no-scrollbar">
                                {plans.map((plan) => {
                                    const isSelected = selectedPlan?._id === plan._id;
                                    return (
                                        <div
                                            key={plan._id}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={`min-w-[280px] rounded-3xl p-5 border-2 transition-all duration-300 cursor-pointer relative bg-white shadow-sm
                                                ${isSelected ? 'border-[#3742FA] scale-100' : 'border-transparent scale-95 opacity-80'}`}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-0 right-0 bg-[#3742FA] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                                                    SELECTED
                                                </div>
                                            )}

                                            <div className="flex items-center mb-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isSelected ? 'bg-[#3742FA]/10' : 'bg-gray-100'}`}>
                                                    <Sparkles size={20} className={isSelected ? 'text-[#3742FA]' : 'text-gray-400'} />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                            </div>

                                            <div className="mb-4">
                                                <span className="text-3xl font-extrabold text-[#3742FA]">₹{plan.price}</span>
                                                <span className="text-sm text-gray-500 font-medium ml-1">/ {plan.durationDays} days</span>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                {plan.features?.slice(0, 3).map((feature, idx) => (
                                                    <div key={idx} className="flex items-center">
                                                        <CheckCircle size={14} className={isSelected ? 'text-[#3742FA]' : 'text-gray-400'} />
                                                        <span className="text-sm text-gray-600 ml-2 truncate">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {isMainOwner && (
                        <div className="pb-10">
                            <SectionHeader title="Growth & Rankings" icon={Crown} />
                            <div className="mx-5 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                                <InfoRow
                                    icon={Tag}
                                    label="Current Rank"
                                    value="Standard Tier"
                                    subValue="Boost to improve"
                                    onClick={() => navigate('/listed-card')}
                                />
                                <InfoRow
                                    icon={Megaphone}
                                    label="Featured Ad"
                                    value="Run an Ad Campaign"
                                    subValue="Get more customers"
                                    // onClick={() => navigate('/ad-placement')} // TODO: Route
                                    isLast
                                />
                            </div>

                            <SectionHeader title="Location & Map Support" icon={MapPin} />
                            <div className="mx-5 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900">Map Visibility</h3>
                                        <p className={`text-xs font-bold mt-1 ${isSubscribed && shopData?.location?.coordinates ? 'text-[#3742FA]' : 'text-gray-400'}`}>
                                            {!isSubscribed ? "Subscription Required to Pin" : (shopData?.location?.coordinates ? "● Active on Search" : "○ Not Pinned Yet")}
                                        </p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSubscribed ? 'bg-[#3742FA]/10' : 'bg-gray-100'}`}>
                                        {!isSubscribed ? <Lock size={20} className="text-gray-400" /> : <Navigation size={20} className="text-[#3742FA]" />}
                                    </div>
                                </div>

                                {shopData?.location?.coordinates && (
                                    <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-dashed border-gray-200">
                                        <p className="text-xs text-gray-500 font-mono text-center">
                                            {shopData.location.coordinates[1]?.toFixed(5)}, {shopData.location.coordinates[0]?.toFixed(5)}
                                        </p>
                                    </div>
                                )}

                                <div className="flex space-x-3">
                                    <button
                                        className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 flex items-center justify-center active:bg-gray-50"
                                        onClick={() => alert("Manual input available in app")}
                                    >
                                        <Hash size={16} className="mr-2 text-gray-400" />
                                        Manual
                                    </button>
                                    <button
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 ${isSubscribed ? 'bg-[#3742FA]' : 'bg-gray-300 cursor-not-allowed'}`}
                                        onClick={() => isSubscribed ? alert("Map pinning available in app") : alert("Subscribe first!")}
                                    >
                                        <MapPin size={16} className="mr-2" />
                                        Pin on Map
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Subscribe Button */}
                {(!isSubscribed || user?.isTrial) && (
                    <div className="fixed bottom-0 w-full max-w-[450px] bg-white border-t border-gray-100 p-5 pb-8 z-40">
                        <div className="flex items-center mb-3">
                            {/* Checkbox */}
                            <div className="w-5 h-5 rounded border border-[#3742FA] bg-[#3742FA] flex items-center justify-center mr-3">
                                <CheckCircle size={14} className="text-white" />
                            </div>
                            <p className="text-xs text-gray-500 leading-tight">
                                I agree to the <span className="text-[#3742FA] font-bold">Terms & Conditions</span>
                            </p>
                        </div>
                        <button
                            onClick={handleSubscribe}
                            className="w-full bg-[#3742FA] text-white py-4 rounded-2xl font-bold text-[16px] shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-all"
                        >
                            Subscribe Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BoostVisibilityScreen;
