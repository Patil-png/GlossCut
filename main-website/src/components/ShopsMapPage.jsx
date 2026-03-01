import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { Search, MapPin, ChevronRight, X, Sparkles, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ShopsMap from './ShopsMap';
import ShopDetailsModal from './ShopDetailsModal';

const ShopsMapPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [shops, setShops] = useState([]);
    const [allBarbersData, setAllBarbersData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Modal state
    const [selectedShop, setSelectedShop] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchShops = useCallback(async () => {
        try {
            const [shopRes, barberRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_API_URL}/api/shop/all`),
                axios.get(`${process.env.REACT_APP_API_URL}/api/barber-card/all`)
            ]);

            if (Array.isArray(shopRes.data)) {
                const approvedShops = shopRes.data.filter(shop =>
                    shop.approvalStatus === 'approved' &&
                    shop.location &&
                    shop.location.coordinates &&
                    shop.location.coordinates[0] !== 0
                );
                setShops(approvedShops);
            }

            if (Array.isArray(barberRes.data)) {
                // Map reviews array to length to prevent React render objects error
                const formattedBarbers = barberRes.data.map(b => ({
                    ...b,
                    reviews: Array.isArray(b.reviews) ? b.reviews.length : (b.reviewCount || b.reviews || 0)
                }));
                setAllBarbersData(formattedBarbers.filter(b => b.approvalStatus === 'approved'));
            }
        } catch (error) {
            console.error("Failed to fetch data for map", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShops();
        window.scrollTo(0, 0);

        let watchId = null;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation([latitude, longitude]);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                },
                { enableHighAccuracy: true }
            );
        }

        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [fetchShops]);

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shop.address && shop.address.toLowerCase().includes(searchTerm.toLowerCase()))
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
                                    {isSearchFocused && searchTerm && filteredShops.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-3xl rounded-[2rem] border border-slate-200/50 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] max-h-[380px] overflow-y-auto z-[1002]"
                                        >
                                            {filteredShops.map((shop, i) => (
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
                                                            <div className="flex items-center gap-3 mt-1 underline-offset-2">
                                                                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">OPEN NOW</span>
                                                                <span className="text-[8px] font-black text-amber-500 flex items-center gap-1 uppercase tracking-tighter">
                                                                    <Sparkles size={8} className="fill-amber-500" />
                                                                    {Number(shop.shopRating || 5).toFixed(1)} Rating
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover/item:bg-amber-500 group-hover/item:text-white transition-all transform group-hover/item:translate-x-1 shadow-sm">
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </button>
                                            ))}
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
                    </div>

                    <ShopDetailsModal
                        isOpen={isModalOpen}
                        shop={selectedShop}
                        onClose={closeModal}
                        barbers={allBarbersData}
                        onBarberClick={handleBarberClick}
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
                    margin-top: 100px !important;
                    margin-left: 20px !important;
                }
                .leaflet-control-zoom-in, .leaflet-control-zoom-out {
                    background: white !important;
                    color: #0f172a !important;
                    border: 1px solid rgba(0, 0, 0, 0.05) !important;
                    border-radius: 12px !important;
                    margin-bottom: 4px !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
                }
            `}</style>
        </div>
    );
};

export default ShopsMapPage;
