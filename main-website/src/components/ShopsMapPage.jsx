import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Search, Star, Shield, Zap, Sparkles, ChevronRight } from 'lucide-react';
import ShopsMap from './ShopsMap';

const ShopsMapPage = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userLocation, setUserLocation] = useState(null);

    const fetchShops = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/shop/all`);
            if (Array.isArray(res.data)) {
                const approvedShops = res.data.filter(shop =>
                    shop.approvalStatus === 'approved' &&
                    shop.location &&
                    shop.location.coordinates &&
                    shop.location.coordinates[0] !== 0
                );
                setShops(approvedShops);
            }
        } catch (error) {
            console.error("Failed to fetch shops for map", error);
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-amber-500/30 overflow-x-hidden">
            <Helmet>
                <title>Store Locator | Find GlossCut Salons Near You</title>
                <meta name="description" content="Use our interactive map to find the best salon shops and barbers in your city. Real-time availability and instant booking." />
            </Helmet>

            {/* Premium Header with Dynamic Gradient */}
            <header className="relative pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-500/[0.08] to-transparent pointer-events-none" />
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-amber-500/20 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

                <div className="max-w-7xl mx-auto relative z-10 text-center lg:text-left">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 md:gap-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="max-w-2xl mx-auto lg:mx-0"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-amber-200/50 shadow-sm text-amber-600 text-[11px] font-black uppercase tracking-[0.15em] mb-6">
                                <Sparkles size={12} className="text-amber-500 animate-pulse" />
                                <span>Premium Experience</span>
                            </div>
                            <h1 className="text-[2.6rem] md:text-7xl font-black mb-4 md:mb-6 tracking-tight leading-[1.05] text-slate-900">
                                Discover Your <span className="text-amber-500">Perfect Style</span>
                            </h1>
                            <p className="text-slate-600 text-base md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium opacity-90">
                                Nagpur & Amravati's elite grooming network at your fingertips. Real-time availability and premium standards.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4 items-center justify-center lg:justify-start">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-md">
                                            <img src={`https://i.pravatar.cc/100?u=shoppage${i}`} alt="user" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                        +5K
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[12px] md:text-sm font-bold text-slate-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-200/50 shadow-sm">
                                    <Star size={14} className="text-amber-500 fill-amber-500" />
                                    <span>Trusted by 20k+ Users</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="w-full lg:w-[420px]"
                        >
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-[2rem] md:rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                                <div className="relative bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] md:rounded-[2.2rem] p-5 md:p-6 shadow-2xl shadow-slate-200/60">
                                    <div className="flex items-center justify-between mb-4 md:mb-6 px-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                                <Search size={18} className="text-white" />
                                            </div>
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Search</span>
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 animate-pulse">LIVE</div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Explore shops or areas..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-slate-50/50 border-2 border-transparent rounded-xl md:rounded-2xl py-4 md:py-5 pl-11 md:pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500/30 focus:bg-white transition-all font-bold text-base md:text-lg"
                                        />
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* Map Section with Glass Floating Overlays */}
            <section className="px-4 md:px-6 pb-20 max-w-7xl mx-auto h-[550px] md:h-[750px] relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="w-full h-full rounded-[2rem] md:rounded-[3.5rem] overflow-hidden border-4 md:border-8 border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] relative group"
                >
                    {loading ? (
                        <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-amber-500/10 rounded-full" />
                                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-900 font-bold text-xl mb-1">Calibrating Map</p>
                                <p className="text-slate-400 text-sm">Aligning elite locations...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <ShopsMap shops={filteredShops} userLocation={userLocation} />

                            {/* Mobile Floating Status Pill */}
                            <div className="map-status-pill md:hidden">
                                <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                                        {filteredShops.length} Premium Shops Found
                                    </span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Desktop Stats Floating Panel */}
                    {!loading && (
                        <div className="absolute top-8 left-8 z-[1000] hidden md:block group/stats">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-slate-900/90 backdrop-blur-2xl border border-white/20 p-6 rounded-[2.5rem] shadow-2xl shadow-black/20 min-w-[220px] relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/20 blur-2xl rounded-full -mr-12 -mt-12 group-hover/stats:bg-amber-500/40 transition-colors duration-500" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Live</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-4xl font-black text-white leading-none tracking-tighter">{filteredShops.length}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-2 tracking-[0.2em] uppercase">Verified Partners</p>
                                        </div>
                                        <div className="h-px bg-white/10" />
                                        <div className="flex items-center gap-2 text-amber-500 font-bold text-[10px] tracking-wider uppercase cursor-pointer hover:gap-3 transition-all group-hover/stats:text-amber-400">
                                            <span>Explore Top Rated</span>
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </section>

            {/* Why Choose GlossCut - Visual Features (Compacted & Premium) */}
            <section className="py-16 md:py-24 bg-white relative overflow-hidden">
                <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-slate-50 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
                        <span className="text-amber-500 font-extrabold text-[10px] md:text-[11px] uppercase tracking-[0.3em] mb-3 block">The Experience</span>
                        <h2 className="text-[2.2rem] md:text-5xl font-black tracking-tight text-slate-900 mb-4 leading-tight">Elite <span className="text-amber-500 underline decoration-slate-200 underline-offset-8">Standards</span></h2>
                        <p className="text-slate-500 text-sm md:text-lg font-medium opacity-80 px-2">We've combined world-class technology with elite styling experts to redefine your signature look.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                        {[
                            {
                                icon: <Zap className="text-amber-500" size={24} />,
                                title: "Instant Booking",
                                desc: "Skip the queue. Book your preferred slot in 3 taps directly from the map view.",
                                color: "bg-amber-500/5"
                            },
                            {
                                icon: <Shield className="text-blue-500" size={24} />,
                                title: "Verified Standard",
                                desc: "Every partner on our map undergoes a rigorous 20-point quality check.",
                                color: "bg-blue-500/5"
                            },
                            {
                                icon: <Sparkles className="text-emerald-500" size={24} />,
                                title: "Premium Visuals",
                                desc: "Explore high-definition galleries and verified ratings before you step in.",
                                color: "bg-emerald-500/5"
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -8 }}
                                className="group p-6 md:p-10 rounded-[2rem] bg-[#FDFDFF] border border-slate-100 hover:border-amber-200/50 hover:shadow-2xl transition-all duration-500 ease-out"
                            >
                                <div className={`w-12 h-12 md:w-16 md:h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                    {React.cloneElement(feature.icon, { size: 32, className: feature.icon.props.className + " md:scale-125" })}
                                </div>
                                <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4 text-slate-900 tracking-tight">{feature.title}</h3>
                                <p className="text-slate-500 text-xs md:text-base leading-relaxed font-medium opacity-80">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ShopsMapPage;
