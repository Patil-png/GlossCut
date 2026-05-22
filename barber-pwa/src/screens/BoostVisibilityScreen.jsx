import React, { useState, useEffect, useRef } from 'react';
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
import LeafletMap from '../components/LeafletMap';

// --- COMPONENTS ---

const SectionHeader = ({ title, icon: Icon }) => (
    <div className="flex items-center w-full px-6 mb-5 mt-6">
        {/* Header Pill */}
        <div className="bg-[#FAF7FD] px-4 py-1.5 rounded-full border border-[#6A1B9A]/10 shadow-[0_2px_4px_rgba(106,27,154,0.02)] flex items-center gap-2 mr-2.5 flex-shrink-0">
            {Icon && <Icon size={14} className="text-[#6A1B9A]" />}
            <h2 className="text-[10.5px] font-[800] text-[#6A1B9A] uppercase tracking-[0.08em]">{title}</h2>
        </div>
        {/* Header Line */}
        <div className="flex-1 h-[1.5px] bg-[#6A1B9A]/10 rounded-full" />
    </div>
);

const InfoRow = ({ icon: Icon, label, value, subValue, onClick, canEdit = true, isLast }) => (
    <div
        onClick={canEdit ? onClick : undefined}
        className={`flex items-center p-4 bg-white ${!isLast ? 'border-b border-gray-100' : ''} ${canEdit ? 'cursor-pointer active:bg-gray-50' : ''} transition-colors`}
    >
        <div className="w-10 h-10 rounded-full bg-[#6A1B9A]/10 flex items-center justify-center mr-3 flex-shrink-0">
            <Icon size={20} className="text-[#6A1B9A]" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[13px] text-gray-500 font-medium mb-0.5">{label}</p>
            <p className="text-[15px] text-gray-900 font-bold truncate">{value}</p>
            {subValue && (
                <p className="text-[12px] text-[#6A1B9A] font-medium mt-0.5">{subValue}</p>
            )}
        </div>
        {canEdit && (
            <ChevronRight size={16} className="text-gray-400 ml-2 flex-shrink-0" />
        )}
    </div>
);

const SubscriptionAdvantageSection = () => (
    <div className="mx-5 mb-6 rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white to-[#f5f5f5]" />
        <div className="relative p-5">
            <div className="flex items-center mb-4">
                <Zap size={20} className="text-[#6A1B9A] mr-2" />
                <h3 className="text-lg font-extrabold text-gray-900">Boost Advantages</h3>
            </div>

            <div className="space-y-3 mb-5">
                {[
                    { title: "Priority Search", desc: "Appear at the top of local search results." },
                    { title: "Map Visibility", desc: "Your shop becomes visible on the customer map." },
                    { title: "Instant Booking", desc: "Customers can find and book you 24/7." }
                ].map((item, idx) => (
                    <div key={idx} className="flex items-start">
                        <CheckCircle size={16} className="text-[#00C853] mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-[13px] text-gray-600 leading-snug">
                            <span className="font-bold text-gray-900">{item.title}:</span> {item.desc}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-[#6A1B9A]/5 rounded-xl p-4 border border-[#6A1B9A]/10">
                <h4 className="text-[12px] font-bold text-[#6A1B9A] uppercase tracking-wide mb-2">
                    Visible Changes For Customers:
                </h4>
                <div className="space-y-2">
                    {["Featured listing in search results", "Active shop pin on the Map"].map((text, idx) => (
                        <div key={idx} className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#6A1B9A] mr-2" />
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
    const { user, setUser, isMainOwner } = useAuth();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [shopData, setShopData] = useState(null);
    const [timeLeft, setTimeLeft] = useState("");

    // Logic States
    const [processing, setProcessing] = useState(false);
    const [mapMode, setMapMode] = useState(false);
    const [region, setRegion] = useState(null);

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

    // Countdown Timer logic
    useEffect(() => {
        let interval;
        if (isSubscribed && user?.subscriptionExpiry) {
            const calculateTime = () => {
                const now = new Date();
                const expiry = new Date(user.subscriptionExpiry);
                const diff = expiry - now;

                if (diff <= 0) {
                    setTimeLeft("Expired");
                    return;
                }

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                if (hours > 24) {
                    setTimeLeft(`${Math.floor(hours / 24)} days left`);
                } else if (hours > 0) {
                    setTimeLeft(`${hours}h ${mins}m left`);
                } else {
                    setTimeLeft(`${mins}m left`);
                }
            };

            calculateTime();
            interval = setInterval(calculateTime, 1000 * 60); // Update every minute
        }
        return () => clearInterval(interval);
    }, [isSubscribed, user?.subscriptionExpiry]);


    const handleSubscribe = async () => {
        if (!selectedPlan || processing) return;

        setProcessing(true);
        try {
            // 1. Get Key
            const configRes = await api.get("/api/payment/config");
            const rzpKey = configRes.data.key;

            // 2. Create Order
            const orderRes = await api.post("/api/subscription/order", {
                planId: selectedPlan._id,
            });

            const options = {
                key: rzpKey,
                amount: orderRes.data.amount,
                currency: "INR",
                name: "GlossCut Barber Subscription",
                description: `Subscription: ${selectedPlan.name}`.replace(/[^\x20-\x7E]/g, '').trim(),
                image: "https://glosscut.com/logo.png", // Replace with actual logo URL
                order_id: orderRes.data.id,
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone,
                },
                theme: { color: "#6A1B9A" },
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post("/api/subscription/verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (verifyRes.data.success) {
                            alert("Subscription activated successfully!");
                            setUser((prev) => ({
                                ...prev,
                                subscriptionStatus: "active",
                                subscriptionExpiry: verifyRes.data.subscription.endDate,
                            }));
                            navigate(0); // Refresh page
                        }
                    } catch (err) {
                        alert("Payment verification failed. Please contact support.");
                        console.error(err);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert(response.error.description);
                setProcessing(false);
            });
            rzp.open();

        } catch (err) {
            console.error("Order creation failed:", err);
            alert("Could not initiate payment.");
            setProcessing(false);
        }
    };

    const handlePinLocation = async () => {
        if (!isSubscribed) {
            alert("Subscription Required to Pin Location");
            return;
        }

        setMapMode(true);

        if (shopData?.location?.coordinates) {
            setRegion({
                latitude: shopData.location.coordinates[1],
                longitude: shopData.location.coordinates[0],
                latitudeDelta: 0.005,
                longitudeDelta: 0.005
            });
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setRegion({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005
                    });
                },
                (error) => {
                    console.error(error);
                    alert("Could not fetch location. Please enable permissions.");
                    // Fallback to center of India or default
                    setRegion({ latitude: 20.5937, longitude: 78.9629, latitudeDelta: 0.5, longitudeDelta: 0.5 });
                }
            );
        }
    };

    const handleConfirmLocation = async () => {
        if (!region) return;

        try {
            await api.put('/api/shop', {
                location: {
                    type: "Point",
                    coordinates: [region.longitude, region.latitude],
                },
            });

            alert("Location pinned successfully!");
            setMapMode(false);
            const shopRes = await api.get("/api/shop/my-shop");
            setShopData(shopRes.data);

        } catch (err) {
            console.error(err);
            alert("Failed to update location");
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="animate-spin text-[#6A1B9A]" size={32} />
            </div>
        );
    }

    // --- MAP VIEW ---
    if (mapMode) {
        return (
            <div className="min-h-screen bg-[#F4F5F7] flex justify-center">
                <div className="w-full max-w-[450px] bg-white h-screen relative flex flex-col">
                    <div className="flex-1 relative">
                        <LeafletMap
                            initialRegion={region}
                            onRegionChangeComplete={setRegion}
                        />
                        {/* Back Button */}
                        <button
                            onClick={() => setMapMode(false)}
                            className="absolute top-4 left-4 z-[1000] w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
                        >
                            <ArrowLeft size={20} className="text-gray-900" />
                        </button>
                    </div>

                    <div className="bg-white p-5 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] z-20">
                        <p className="text-center text-sm text-gray-500 mb-4">
                            Move map to adjust pin position
                        </p>
                        <button
                            onClick={handleConfirmLocation}
                            className="w-full bg-[#6A1B9A] text-white py-4 rounded-xl font-bold text-[16px] shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-all"
                        >
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN SCREEN ---
    return (
        <div className="min-h-screen bg-[#FFFFFF] flex justify-center font-sans">
            <div className="w-full max-w-[450px] bg-[#FFFFFF] min-h-screen shadow-2xl relative pb-32">

                {/* PREMIUM HEADER - Native Match */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#6A1B9A] to-[#6A1B9A] pb-6 rounded-b-[32px] shadow-lg">
                    {/* Native-like Animated Blobs (4 blobs) */}
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[-80px] right-[-60px] w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-60"
                    />
                    <motion.div
                        animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-[-40px] left-[-40px] w-60 h-60 bg-white/10 rounded-full blur-3xl opacity-60"
                    />
                    <motion.div
                        animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[20%] left-[20%] w-32 h-32 bg-white/5 rounded-full blur-2xl"
                    />
                    <motion.div
                        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-[20%] right-[10%] w-40 h-40 bg-white/5 rounded-full blur-2xl"
                    />

                    <div className="relative z-10 px-6 pt-5 pb-2 flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-[40px] h-[40px] rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 active:scale-95 transition-transform"
                        >
                            <ArrowLeft size={20} className="text-white" strokeWidth={2.5} />
                        </button>
                        <h1 className="text-[18px] font-[800] text-white tracking-tight">
                            Subscription Plans
                        </h1>
                        <div className="w-[40px]" />
                    </div>
                </div>

                {/* CONTENT */}
                <div className="mt-[-24px] relative z-20">

                    {/* Active Subscription Card */}
                    {isSubscribed && (
                        <div className="mx-6 mb-8">
                            <div className="relative">
                                {/* Card Body */}
                                <div className={`rounded-[28px] p-6 relative overflow-hidden z-20 ${user?.isTrial ? 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]' : 'bg-gradient-to-br from-[#6A1B9A] to-[#6A1B9A]'}`}>
                                    <div className="relative z-10 text-white">
                                        <div className="flex items-center mb-5">
                                            <div className="w-[52px] h-[52px] rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mr-4 shadow-inner border border-white/10">
                                                {user?.isTrial ? <Sparkles size={28} className="text-white" /> : <Crown size={28} className="text-white" />}
                                            </div>
                                            <div>
                                                <h3 className="text-[19px] font-[800] tracking-tight text-white mb-1">
                                                    {user?.isTrial ? "Trial Membership" : "Premium Member"}
                                                </h3>
                                                <div className="flex items-center">
                                                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-sm mr-2 border border-white/10">
                                                        <ShieldCheck size={12} className="mr-1.5 text-white" fill="currentColor" />
                                                        <span className="text-[11px] font-[700] tracking-wide text-white">
                                                            {user?.isTrial ? "JOINING BONUS" : "ACTIVE PLAN"}
                                                        </span>
                                                    </div>
                                                    {timeLeft && (
                                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-sm">
                                                            <span className="text-[11px] font-medium text-white/90">
                                                                {timeLeft}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[14px] text-white/90 font-medium leading-relaxed">
                                            {isMainOwner ? "Your shop is fully unlocked and visible." : "Shop owner's premium plan covers you."}
                                        </p>
                                    </div>
                                </div>
                                {/* Native Shadow Element */}
                                <div
                                    className={`absolute top-4 left-0 right-0 h-full rounded-[28px] z-10 opacity-40 blur-lg transform translate-y-2 scale-[0.92] ${user?.isTrial ? 'bg-[#8B5CF6]' : 'bg-[#6A1B9A]'}`}
                                />
                            </div>
                        </div>
                    )}

                    {(!isSubscribed || user?.isTrial) && (
                        <>
                            <SubscriptionAdvantageSection />

                            <SectionHeader title="Select Your Plan" icon={Tag} />

                            {/* Plans Scroll */}
                            <div className="overflow-x-auto pb-10 px-6 flex space-x-5 no-scrollbar snap-x snap-mandatory">
                                {user?.isTrial && (
                                    <div
                                        className="snap-center min-w-[290px] rounded-[26px] p-6 border-[2px] border-[#6A1B9A] bg-[#f5f5f5] relative transform scale-100 shadow-[0_10px_25px_-5px_rgba(106,27,154,0.15)]"
                                    >
                                        <div className="absolute top-0 right-0 bg-[#6A1B9A] text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl rounded-tr-[22px] tracking-wider shadow-sm">
                                            ACTIVE
                                        </div>

                                        <div className="flex items-center mb-5 pt-1">
                                            <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center mr-4 bg-[#6A1B9A]/10">
                                                <Sparkles size={24} className="text-[#6A1B9A]" />
                                            </div>
                                            <div>
                                                <h3 className="text-[17px] font-[800] text-gray-900 leading-tight">Joining Bonus</h3>
                                                <p className="text-[12px] text-gray-500 font-[700] mt-0.5 uppercase tracking-wide">Free Trial Access</p>
                                            </div>
                                        </div>

                                        <div className="mb-6 pl-1">
                                            <span className="text-[32px] font-[900] text-[#6A1B9A] tracking-tight">₹0</span>
                                            <span className="text-[13px] text-gray-500 font-[600] ml-1">/ 1 Month</span>
                                        </div>

                                        <div className="space-y-3 mb-2">
                                            {[
                                                "Full Map Visibility",
                                                "Growth Tools Unlocked",
                                                "Premium Badge",
                                                "Priority Support"
                                            ].map((feature, idx) => (
                                                <div key={idx} className="flex items-center">
                                                    <CheckCircle size={15} className="text-[#6A1B9A] fill-[#6A1B9A]/10 flex-shrink-0" />
                                                    <span className="text-[13px] text-gray-800 ml-3 font-medium truncate">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {plans.map((plan) => {
                                    const isSelected = selectedPlan?._id === plan._id;
                                    return (
                                        <div
                                            key={plan._id}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={`snap-center min-w-[290px] rounded-[26px] p-6 border-[2px] transition-all duration-300 cursor-pointer relative
                                                ${isSelected
                                                    ? 'bg-[#f5f5f5] border-[#6A1B9A] scale-100 shadow-[0_10px_25px_-5px_rgba(106,27,154,0.15)] z-10'
                                                    : 'bg-white border-transparent scale-[0.96] opacity-70 shadow-sm hover:opacity-100'}`
                                            }
                                        >
                                            {isSelected && (
                                                <div className="absolute top-0 right-0 bg-[#6A1B9A] text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl rounded-tr-[22px] tracking-wider shadow-sm">
                                                    SELECTED
                                                </div>
                                            )}

                                            <div className="flex items-center mb-5 pt-1">
                                                <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center mr-4 transition-colors ${isSelected ? 'bg-[#6A1B9A]/10' : 'bg-gray-100'}`}>
                                                    <Sparkles size={22} className={isSelected ? 'text-[#6A1B9A]' : 'text-gray-400'} />
                                                </div>
                                                <h3 className={`text-[17px] font-[800] leading-tight ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{plan.name}</h3>
                                            </div>

                                            <div className="mb-6 pl-1">
                                                <span className={`text-[32px] font-[900] tracking-tight ${isSelected ? 'text-[#6A1B9A]' : 'text-gray-400'}`}>₹{plan.price}</span>
                                                <span className="text-[13px] text-gray-400 font-[600] ml-1">/ {plan.durationDays} days</span>
                                            </div>

                                            <div className="space-y-3 mb-2">
                                                {plan.features?.slice(0, 3).map((feature, idx) => (
                                                    <div key={idx} className="flex items-center">
                                                        <CheckCircle size={15} className={`flex-shrink-0 transition-colors ${isSelected ? 'text-[#6A1B9A] fill-[#6A1B9A]/10' : 'text-gray-300'}`} />
                                                        <span className={`text-[13px] ml-3 font-medium truncate ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>{feature}</span>
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
                            <div className="mx-6 bg-white rounded-[24px] overflow-hidden shadow-sm border border-[rgba(0,0,0,0.04)]">
                                <InfoRow
                                    icon={Tag}
                                    label="Current Rank"
                                    value={(() => {
                                        const listing = shopData?.selectedListingPlaces?.[0];
                                        if (!listing) return "Standard Tier";
                                        return listing.tierId === 1 ? "Elite Rank" : "Premium Rank";
                                    })()}
                                    subValue={(() => {
                                        const listing = shopData?.selectedListingPlaces?.[0];
                                        if (!listing) return "Boost to improve";
                                        return `Active in ${listing.areaId?.name || 'Search'}`;
                                    })()}
                                    onClick={() => navigate('/listing-tiers')}
                                />
                                <InfoRow
                                    icon={Megaphone}
                                    label="Featured Ad"
                                    value="Run an Ad Campaign"
                                    subValue="Get more customers"
                                    isLast
                                />
                            </div>

                            <SectionHeader title="Location & Map Support" icon={MapPin} />
                            <div className="mx-6 bg-white rounded-[28px] shadow-[0_8px_16px_rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.04)] p-6 mb-10">
                                <div className="flex items-start justify-between mb-5">
                                    <div>
                                        <h3 className="text-[17px] font-[800] text-gray-900 mb-1">Map Visibility</h3>
                                        <p className={`text-[13px] font-[600] ${isSubscribed && shopData?.location?.coordinates ? 'text-[#6A1B9A]' : 'text-gray-400'}`}>
                                            {!isSubscribed ? "Subscription Required to Pin" : (shopData?.location?.coordinates ? "● Active on Search" : "○ Not Pinned Yet")}
                                        </p>
                                    </div>
                                    <div className={`w-[48px] h-[48px] rounded-[18px] flex items-center justify-center ${isSubscribed ? 'bg-[#6A1B9A]/10' : 'bg-gray-100'}`}>
                                        {!isSubscribed ? <Lock size={22} className="text-gray-400" /> : <Navigation size={22} className="text-[#6A1B9A]" />}
                                    </div>
                                </div>

                                {shopData?.location?.coordinates && (
                                    <div className="bg-gray-50 rounded-xl p-3 mb-5 border border-dashed border-gray-200 flex items-center">
                                        <MapPin size={14} className="text-gray-400 mr-2" />
                                        <p className="text-[12px] text-gray-500 font-mono font-bold tracking-tight">
                                            {shopData.location.coordinates[1]?.toFixed(5)}, {shopData.location.coordinates[0]?.toFixed(5)}
                                        </p>
                                    </div>
                                )}

                                <div className="flex space-x-3">
                                    <button
                                        className="flex-1 h-[52px] rounded-2xl border-[1.5px] border-gray-200 text-[14px] font-[700] text-gray-700 flex items-center justify-center active:bg-gray-50 transition-colors"
                                        onClick={() => alert("Manual input available in map mode on app")}
                                    >
                                        <Hash size={16} className="mr-2 text-gray-400" />
                                        Manual
                                    </button>
                                    <button
                                        className={`flex-[1.5] h-[52px] rounded-2xl text-[14px] font-[700] text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all ${isSubscribed ? 'bg-[#6A1B9A]' : 'bg-gray-300 cursor-not-allowed shadow-none'}`}
                                        onClick={handlePinLocation}
                                    >
                                        <MapPin size={16} className="mr-2" />
                                        Pin on Map
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* NATIVE FOOTER - Sticky */}
                {isMainOwner && (
                    <div className="fixed bottom-0 w-full max-w-[450px] bg-white border-t border-[rgba(0,0,0,0.05)] px-6 pt-5 pb-8 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] rounded-t-[32px]">
                        {!isSubscribed ? (
                            <>
                                <div className="flex items-center mb-5 pl-1">
                                    {/* Custom Checkbox */}
                                    <div
                                        onClick={() => setIsAgreed(!isAgreed)}
                                        className={`w-[22px] h-[22px] rounded-[7px] border-[2px] cursor-pointer transition-all flex items-center justify-center mr-3 ${isAgreed ? 'bg-[#6A1B9A] border-[#6A1B9A]' : 'bg-transparent border-gray-300'}`}
                                    >
                                        {isAgreed && <CheckCircle size={15} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <p className="text-[13px] text-gray-500 leading-tight font-medium">
                                        I agree to the <span className="text-[#6A1B9A] font-[700] cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); window.open("https://glosscut.com/terms"); }}>Terms & Conditions</span>
                                    </p>
                                </div>
                                <button
                                    onClick={handleSubscribe}
                                    disabled={!isAgreed || processing}
                                    className={`w-full h-[62px] text-white rounded-[20px] font-[900] text-[17px] tracking-wide shadow-[0_10px_25px_rgba(106,27,154,0.3)] active:scale-[0.98] transition-all flex items-center justify-center ${(!isAgreed || processing) ? 'bg-gray-300 shadow-none cursor-not-allowed' : 'bg-[#6A1B9A]'}`}
                                >
                                    {processing ? <Loader2 className="animate-spin mr-3" size={24} /> : null}
                                    {processing ? "Processing..." : "Subscribe Now"}
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-[62px] bg-gray-50 rounded-[20px] border border-gray-100 px-6">
                                <div className="w-10 h-10 rounded-full bg-[#6A1B9A]/10 flex items-center justify-center mr-4">
                                    {user?.isTrial ? <Sparkles size={20} className="text-[#6A1B9A]" /> : <ShieldCheck size={20} className="text-[#6A1B9A]" />}
                                </div>
                                <p className="text-[15px] font-[700] text-gray-900">
                                    {user?.isTrial ? "Currently on Free Trial" : "Active Membership"}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BoostVisibilityScreen;
