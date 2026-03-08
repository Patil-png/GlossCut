import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { Search, MapPin, ChevronRight, X, Sparkles, Check, Navigation } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ShopsMap from './ShopsMap';
import ShopDetailsModal from './ShopDetailsModal';

const ShopsMapPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const [shops, setShops] = useState([]);
    const [allBarbersData, setAllBarbersData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Modal state
    const [selectedShop, setSelectedShop] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roadDistances, setRoadDistances] = useState({});
    const [airDistances, setAirDistances] = useState({});

    // --- DISTANCE HELPERS ---
    const getAirDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const fetchRoadDistances = async (userCoords, shops) => {
        if (!userCoords || !shops.length) return {};
        try {
            const shopCoords = shops
                .filter(s => s.location?.coordinates?.length === 2 && (s.location.coordinates[0] !== 0 || s.location.coordinates[1] !== 0))
                .map(s => `${s.location.coordinates[0]},${s.location.coordinates[1]}`)
                .join(';');

            if (!shopCoords) return {};

            const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
            const url = `${protocol}//router.project-osrm.org/table/v1/driving/${userCoords[1]},${userCoords[0]};${shopCoords}?sources=0&annotations=distance`;

            const response = await fetch(url, { mode: 'cors' });
            const data = await response.json();

            if (data.code === 'Ok' && data.distances && data.distances[0]) {
                const distanceMap = {};
                const shopIds = shops
                    .filter(s => s.location?.coordinates?.length === 2 && (s.location.coordinates[0] !== 0 || s.location.coordinates[1] !== 0))
                    .map(s => s._id || s.id);

                data.distances[0].slice(1).forEach((dist, index) => {
                    if (dist !== null && shopIds[index]) {
                        distanceMap[shopIds[index]] = (dist / 1000).toFixed(1);
                    }
                });
                return distanceMap;
            }
        } catch (error) {
            console.error("OSRM Error:", error);
        }
        return {};
    };

    // --- EFFECT: CALCULATE DISTANCES ---
    useEffect(() => {
        if (userLocation && shops.length > 0) {
            // 1. Air Distances
            const airMap = {};
            shops.forEach(s => {
                if (s.location?.coordinates?.length === 2) {
                    const dist = getAirDistance(userLocation[0], userLocation[1], s.location.coordinates[1], s.location.coordinates[0]);
                    airMap[s._id || s.id] = dist.toFixed(1);
                }
            });
            setAirDistances(airMap);

            // 2. Road Distances
            fetchRoadDistances(userLocation, shops).then(roadMap => {
                if (Object.keys(roadMap).length > 0) {
                    setRoadDistances(prev => ({ ...prev, ...roadMap }));
                }
            });
        }
    }, [userLocation, shops]);

    const fetchShops = useCallback(async (lat, lng) => {
        try {
            const shopUrl = (lat && lng)
                ? `${process.env.REACT_APP_API_URL}/api/shop/all?userLat=${lat}&userLng=${lng}`
                : `${process.env.REACT_APP_API_URL}/api/shop/all`;

            const [shopRes, barberRes] = await Promise.all([
                axios.get(shopUrl),
                axios.get(`${process.env.REACT_APP_API_URL}/api/barber-card/all`)
            ]);

            if (Array.isArray(shopRes.data) && Array.isArray(barberRes.data)) {
                const barbers = barberRes.data.filter(b => b.approvalStatus === 'approved');

                const approvedShops = shopRes.data
                    .filter(shop =>
                        shop.approvalStatus === 'approved' &&
                        shop.location?.coordinates &&
                        shop.location.coordinates[0] !== 0
                    )
                    .map(shop => {
                        // Calculate Shop's Real Rating & Review Count based on its specialists
                        const shopUniqueId = String(shop._id || shop.id);
                        const shopBarbers = barbers.filter(b =>
                            String(b.shopId || '') === shopUniqueId ||
                            String(b.parentShopId || '') === shopUniqueId
                        );

                        let currentRating = Number(shop.shopRating || shop.rating || 0);
                        let totalReviews = Number(shop.totalReviews || shop.reviews || 0);

                        const barberReviewsTotal = shopBarbers.reduce((sum, b) => {
                            const count = typeof b.reviews === 'number' ? b.reviews : (Array.isArray(b.reviews) ? b.reviews.length : (b.reviewCount || 0));
                            return sum + Number(count || 0);
                        }, 0);

                        // Use aggregate reviews if shop has none
                        if (!totalReviews || totalReviews === 0) totalReviews = barberReviewsTotal;

                        // Use average rating if shop has no rating or is very low
                        if ((!currentRating || currentRating === 0) && shopBarbers.length > 0) {
                            const validBarbersWithRatings = shopBarbers.filter(b => {
                                const r = Number(b.rating || b.avgRating || b.barberId?.rating || 0);
                                return r > 0;
                            });

                            if (validBarbersWithRatings.length > 0) {
                                const total = validBarbersWithRatings.reduce((sum, b) => {
                                    const rating = Number(b.rating || b.avgRating || b.barberId?.rating || 0);
                                    return sum + rating;
                                }, 0);
                                currentRating = total / validBarbersWithRatings.length;
                            }
                        }

                        // Final check to ensure we have a valid number
                        currentRating = Number(currentRating) || 0;

                        return {
                            ...shop,
                            shopRating: currentRating,
                            rating: currentRating,
                            totalReviews: totalReviews,
                            reviews: totalReviews,
                            totalBarbers: shopBarbers.length
                        };
                    });

                setShops(approvedShops);

                const formattedBarbers = barbers.map(b => ({
                    ...b,
                    reviews: Array.isArray(b.reviews) ? b.reviews.length : (b.reviewCount || b.reviews || 0)
                }));
                setAllBarbersData(formattedBarbers);
            }
        } catch (error) {
            console.error("Failed to fetch data for map", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);

        let watchId = null;
        if (navigator.geolocation) {
            // Get location first before fetching to trigger backend $geoNear optimization
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation([latitude, longitude]);
                    fetchShops(latitude, longitude);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    fetchShops(); // Fallback query if blocked
                },
                { enableHighAccuracy: true, timeout: 4000 }
            );

            // Keep watching for live updates
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation([latitude, longitude]);
                },
                (error) => {
                    console.error("Geolocation watch error:", error);
                },
                { enableHighAccuracy: true }
            );
        } else {
            fetchShops(); // Fallback if absolutely no geo support
        }

        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [fetchShops]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Sync selectedShop when shops data updates (e.g. after ratings are calculated)
    useEffect(() => {
        if (selectedShop && shops.length > 0) {
            const updated = shops.find(s => String(s._id || s.id) === String(selectedShop._id || selectedShop.id));
            if (updated && (updated.shopRating !== selectedShop.shopRating || updated.totalReviews !== selectedShop.totalReviews)) {
                setSelectedShop(updated);
            }
        }
    }, [shops, selectedShop]);

    // Handle deep-linking via ?select={shopId}
    useEffect(() => {
        const selectId = searchParams.get('select');
        if (selectId && shops.length > 0) {
            const targetShop = shops.find(s => String(s._id || s.id) === String(selectId));
            if (targetShop) {
                console.log("📍 Deep-linking to Shop:", targetShop.name);
                setSelectedShop(targetShop);
            }
        }
    }, [searchParams, shops]);

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (shop.address && shop.address.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    );

    const handleShopClick = useCallback((shop) => {
        // Find the full shop details from our shops array
        const fullShop = shops.find(s => s._id === shop._id);
        setSelectedShop(fullShop || shop);
        setIsModalOpen(true);
    }, [shops]);

    const handleBarberClick = useCallback((barber) => {
        setIsModalOpen(false);
        setSelectedShop(null);

        if (barber.isAvailable) {
            if (!isAuthenticated) {
                navigate('/login', {
                    state: {
                        returnTo: '/booking-appointment',
                        barberData: barber
                    }
                });
                return;
            }
            navigate('/booking-appointment', { state: { barberData: barber } });
        }
    }, [isAuthenticated, navigate]);

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedShop(null);
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-amber-500/30">
            <Helmet>
                <title>Store Locator | Find GlossCut Salons</title>
                <meta name="description" content="Use our interactive map to find the best salon shops and barbers in your city." />
            </Helmet>

            {/* Content Section with Top Spacing for Navbar */}
            <div className="pt-24 md:pt-36 pb-20 px-4 md:px-6 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-amber-500/[0.03] blur-[120px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-amber-500/[0.02] blur-[100px] rounded-full -ml-20 -mb-20 pointer-events-none" />

                <div className="max-w-7xl mx-auto">
                    {/* Header/Title Area */}
                    <div className="mb-8 md:mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100/50 text-amber-600 text-[10px] font-black uppercase tracking-widest mb-4"
                        >
                            <Sparkles size={10} className="animate-pulse" />
                            <span>Premium Network</span>
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 md:mb-6">
                            Find Your <span className="text-amber-500">Perfect Style</span>
                        </h1>
                        <p className="text-slate-600 text-sm md:text-lg leading-relaxed max-w-2xl font-medium opacity-90 mb-8">
                            Explore Nagpur & Amravati's elite grooming network. Real-time availability,
                            verified experts, and premium standards at your fingertips.
                        </p>

                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-wrap gap-4 items-center"
                        >
                            <div className="flex items-center gap-2 text-[10px] md:text-xs font-black text-slate-500 bg-slate-50/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>VERIFIED PARTNERS</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] md:text-xs font-black text-slate-500 bg-slate-50/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/50">
                                <Sparkles size={12} className="text-amber-500" />
                                <span>TRUSTED BY 20K+ USERS</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Integrated Search & Map Section */}
                    <div className="relative">
                        {/* Search Bar - Positioned over the map but cleared of Navbar */}
                        <div className="absolute top-6 left-6 right-6 z-[1001] pointer-events-none md:max-w-md">
                            <motion.div
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="relative pointer-events-auto"
                            >
                                <div className={`relative flex items-center bg-white/95 backdrop-blur-2xl rounded-2xl md:rounded-3xl border transition-all duration-300 shadow-xl ${isSearchFocused ? 'border-amber-500 ring-4 ring-amber-500/5' : 'border-slate-200/50'}`}>
                                    <div className="pl-5 text-slate-400">
                                        <Search size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search shops or areas..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                        className="w-full bg-transparent py-4 md:py-5 px-3 text-slate-900 font-bold placeholder-slate-400 outline-none text-sm md:text-base"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="pr-5 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Results Dropdown */}
                                <AnimatePresence>
                                    {isSearchFocused && searchTerm && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-3xl rounded-[2rem] border border-slate-200/50 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] max-h-[380px] overflow-y-auto z-[1002]"
                                        >
                                            {filteredShops.length > 0 ? (
                                                filteredShops.map((shop, i) => (
                                                    <button
                                                        key={shop._id || i}
                                                        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-all duration-300 border-b border-slate-50 last:border-0 text-left group/item"
                                                        onMouseDown={() => {
                                                            handleShopClick(shop);
                                                            setIsSearchFocused(false);
                                                        }}
                                                    >
                                                        {/* Shop Thumbnail */}
                                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-100 flex-shrink-0 group-hover/item:border-amber-200 group-hover/item:scale-105 transition-all duration-500 shadow-sm text-amber-600 flex items-center justify-center">
                                                            <img
                                                                src={shop.image || '/GlossCut.png'}
                                                                alt={shop.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => e.target.src = '/GlossCut.png'}
                                                            />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <p className="font-black text-slate-900 text-sm truncate leading-tight group-hover/item:text-amber-600 transition-colors uppercase tracking-tight">{shop.name}</p>
                                                                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                                                                    <Check size={10} className="text-white" strokeWidth={4} />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <p className="text-[10px] text-slate-400 font-bold truncate flex items-center gap-1.5 opacity-80 uppercase tracking-widest leading-none">
                                                                    <MapPin size={10} className="text-amber-500" />
                                                                    {shop.address || 'Premium Partner Site'}
                                                                </p>
                                                                <div class="flex items-center gap-3 mt-1 underline-offset-2">
                                                                    <span class={`text-[8px] font-black px-2 py-0.5 rounded-full border ${shop.isAvailable !== false ? 'text-emerald-600 bg-emerald-50 border-emerald-100/50' : 'text-slate-400 bg-slate-100 border-slate-200/50'}`}>
                                                                        {shop.isAvailable !== false ? 'OPEN NOW' : 'CLOSED'}
                                                                    </span>
                                                                    {shop.isPriority ? (
                                                                        <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1 uppercase tracking-tighter">
                                                                            <Sparkles size={8} />
                                                                            FEATURED
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[8px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 flex items-center gap-1 uppercase tracking-tighter">
                                                                            <Sparkles size={8} />
                                                                            PREMIUM
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover/item:bg-amber-500 group-hover/item:text-white transition-all transform group-hover/item:translate-x-1 shadow-sm">
                                                            <ChevronRight size={16} />
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                                        <Search size={24} className="text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-900 font-black text-base mb-1 tracking-tight">NO SHOPS FOUND</p>
                                                    <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-[200px]">
                                                        We couldn't find any salons matching "{searchTerm}"
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>

                        {/* Map Container - Now "Inside" the section */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.99 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative h-[550px] md:h-[750px] w-full rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border-4 md:border-8 border-white shadow-[0_32px_80px_-20px_rgba(0,0,0,0.12)] bg-slate-50"
                        >
                            {loading ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-amber-500/10 rounded-full" />
                                        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Initializing Live Feed</p>
                                </div>
                            ) : (
                                <ShopsMap
                                    shops={filteredShops}
                                    userLocation={userLocation}
                                    onShopClick={handleShopClick}
                                    selectedShop={selectedShop}
                                />
                            )}

                            {/* Status Pill Inside Map */}
                            <div className="absolute bottom-6 left-6 z-[1001] pointer-events-none">
                                <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-2xl shadow-black/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                                    <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
                                        {filteredShops.length} Active Studios
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Shop Preview Section - Now "Locked" Below Map */}
                        <AnimatePresence>
                            {selectedShop && !isModalOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: 30, height: 0 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 md:mt-6 bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-[2rem] p-3 md:p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] border border-slate-200/40 flex flex-col md:flex-row gap-4 md:gap-6 items-center group relative group/card">
                                        {/* Decorative Background Glow */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-orange-500/[0.02] rounded-[inherit] pointer-events-none" />

                                        {/* Shop Image with Premium Frame */}
                                        <div className="relative w-full md:w-36 h-32 md:h-36 rounded-xl md:rounded-[1.2rem] overflow-hidden flex-shrink-0 border-2 border-white shadow-lg">
                                            <img
                                                src={selectedShop.image || '/GlossCut.png'}
                                                alt=""
                                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                                                onError={(e) => e.target.src = '/GlossCut.png'}
                                            />
                                        </div>

                                        {/* Shop Info details */}
                                        <div className="flex-1 min-w-0 w-full">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                {selectedShop.isPriority ? (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest border border-amber-600 shadow-sm">
                                                        <Sparkles size={7} />
                                                        <span>FEATURED</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[8px] font-black uppercase tracking-widest border border-amber-200/20">
                                                        <Sparkles size={7} />
                                                        <span>Premium</span>
                                                    </div>
                                                )}
                                                {selectedShop.verifiedShop && (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[8px] font-black uppercase tracking-widest border border-blue-200/20">
                                                        <Check size={7} />
                                                        <span>Verified</span>
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="text-lg md:text-xl font-bold text-slate-900 truncate mb-1 uppercase tracking-tight group-hover/card:text-amber-600 transition-colors">
                                                {selectedShop.name}
                                            </h3>

                                            <p className="flex items-start gap-1.5 text-slate-500 text-[10px] md:text-xs font-medium mb-3 opacity-80 leading-relaxed max-w-xl line-clamp-1">
                                                <MapPin size={12} className="text-amber-500 shrink-0" />
                                                {selectedShop.address}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-3 md:gap-5">
                                                <div className="flex items-center gap-3 text-[10px] font-bold">
                                                    {roadDistances[selectedShop._id || selectedShop.id] && (
                                                        <div className="flex items-center gap-1.5 bg-slate-50/50 px-2 py-1 rounded-lg border border-slate-200/50 text-slate-600">
                                                            <Navigation size={8} className="text-amber-500" />
                                                            <span>{roadDistances[selectedShop._id || selectedShop.id]} km</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 md:ml-auto w-full md:w-auto mt-2 md:mt-0">
                                                    <button
                                                        onClick={() => setIsModalOpen(true)}
                                                        className="flex-1 md:flex-none bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-lg md:rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 group/btn"
                                                    >
                                                        Services
                                                        <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedShop(null)}
                                                        className="w-10 h-10 rounded-lg md:rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-200/50"
                                                        title="Dismiss"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <ShopDetailsModal
                        isOpen={isModalOpen}
                        shop={selectedShop}
                        onClose={closeModal}
                        barbers={allBarbersData}
                        onBarberClick={handleBarberClick}
                        roadDistances={roadDistances}
                        airDistances={airDistances}
                    />
                </div>
            </div>

            <style>{`
                .leaflet-container {
                    height: 100% !important;
                    width: 100% !important;
                    background: #f8fafc !important;
                }
                .leaflet-control-zoom {
                    border: none !important;
                    margin-top: 120px !important;
                    margin-left: 20px !important;
                    z-index: 1000 !important;
                }
                .leaflet-control-zoom-in, .leaflet-control-zoom-out {
                    background: white !important;
                    color: #0f172a !important;
                    border: 1px solid rgba(0, 0, 0, 0.05) !important;
                    border-radius: 12px !important;
                    margin-bottom: 6px !important;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important;
                    font-weight: bold !important;
                    width: 40px !important;
                    height: 40px !important;
                    line-height: 40px !important;
                }
                
                /* PREMIUM MARKER SCSS-like Styles */
                .custom-shop-marker {
                    background: none !important;
                    border: none !important;
                }
                
                .marker-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                .is-selected .marker-pin-outer {
                    transform: scale(1.2);
                    box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
                }
                
                .is-selected .marker-label {
                    background: #ef4444;
                    color: white;
                    transform: translateY(-4px) scale(1.1);
                }

                .marker-pin-outer {
                    position: relative;
                    width: 44px;
                    height: 44px;
                    background: white;
                    border-radius: 50%;
                    padding: 3px;
                    border: 2px solid #ef4444;
                    box-shadow: 0 8px 15px rgba(0,0,0,0.15);
                    z-index: 2;
                }
                
                .marker-image-wrapper {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    overflow: hidden;
                    background: #f1f5f9;
                }
                
                .marker-image {
                    width: 100%;
                    height: 100%;
                    object-cover: cover;
                }
                
                .marker-bottom-arrow {
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 10px solid #ef4444;
                    z-index: 1;
                }
                
                .marker-label {
                    margin-top: 6px;
                    background: white;
                    padding: 2px 8px;
                    border-radius: 20px;
                    font-size: 10px;
                    font-weight: 900;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    border: 1px solid rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                }

                .marker-label.is-new {
                    background: #faf5ff;
                    color: #7e22ce;
                    border: 1px solid #e9d5ff;
                }
                
                .user-pulse {
                    width: 20px;
                    height: 20px;
                    background: #3b82f6;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
            `}</style>
        </div>
    );
};

export default ShopsMapPage;
