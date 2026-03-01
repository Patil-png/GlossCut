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
            <header className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="max-w-2xl"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-amber-200/50 shadow-sm text-amber-600 text-[11px] font-black uppercase tracking-[0.15em] mb-6">
                                <Zap size={12} className="fill-amber-500" />
                                <span>Premium Network Explorer</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-[1.1] text-slate-900">
                                Locate Your Next <span className="text-amber-500">Masterpiece</span>
                            </h1>
                            <p className="text-slate-600 text-lg md:text-xl leading-relaxed max-w-xl">
                                Discover Nagpur & Amravati's elite grooming specialists. Real-time availability, instant booking, and premium standards.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                                            <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                        +2k
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-200/50">
                                    <Star size={16} className="text-amber-500 fill-amber-500" />
                                    <span>Trusted by local style enthusiasts</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="w-full lg:w-96"
                        >
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-[2rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                                <div className="relative bg-white border border-slate-200/50 rounded-[1.8rem] p-4 shadow-xl shadow-slate-200/50">
                                    <div className="flex items-center gap-3 mb-4 px-2">
                                        <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center">
                                            <Search size={14} className="text-white" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Find Your Zone</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search shops or areas..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-bold text-lg"
                                        />
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20} />
                                    </div>
                                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                        {['Nagpur', 'Amravati', 'Luxury', 'Budget'].map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => setSearchTerm(tag === searchTerm ? '' : tag)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${searchTerm === tag ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* Map Section with Glass Floating Overlays */}
            <section className="px-6 pb-20 max-w-7xl mx-auto h-[650px] md:h-[750px] relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="w-full h-full rounded-[2.5rem] overflow-hidden border border-slate-200/50 shadow-2xl relative"
                >
                    {loading ? (
                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-amber-500/20 rounded-full" />
                                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-900 font-bold text-xl mb-1">Calibrating Spatial Data</p>
                                <p className="text-slate-400 text-sm">Aligning latest shop coordinates...</p>
                            </div>
                        </div>
                    ) : (
                        <ShopsMap shops={filteredShops} userLocation={userLocation} />
                    )}

                    {/* Stats Floating Panel */}
                    {!loading && (
                        <div className="absolute top-8 left-8 z-[1000] hidden md:block group">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/90 backdrop-blur-xl border border-white/50 p-6 rounded-[2rem] shadow-2xl shadow-slate-900/10 min-w-[200px]"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Search</span>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-4xl font-black text-slate-900 leading-none">{filteredShops.length}</p>
                                        <p className="text-xs font-bold text-slate-500 mt-1">Found in your view</p>
                                    </div>
                                    <div className="h-px bg-slate-200/50" />
                                    <div className="flex items-center gap-2 text-amber-600 font-bold text-xs cursor-pointer hover:gap-3 transition-all">
                                        <span>View all matching results</span>
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </section>

            {/* Why Choose GlossCut - Visual Features */}
            <section className="py-32 bg-white relative overflow-hidden">
                <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-slate-50 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <span className="text-amber-500 font-black text-xs uppercase tracking-[0.3em] mb-4 block">The Experience</span>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">Built for Modern <span className="text-amber-500 underline decoration-slate-200 underline-offset-8">Grooming</span></h2>
                        <p className="text-slate-500 text-lg">We've combined world-class technology with elite styling experts to redefine how you discover your signature look.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Zap className="text-amber-500" size={28} />,
                                title: "Instant Booking",
                                desc: "Skip the queue. Book your preferred slot in 3 taps directly from the map view.",
                                color: "bg-amber-500/5"
                            },
                            {
                                icon: <Shield className="text-blue-500" size={28} />,
                                title: "Verified Standard",
                                desc: "Every partner on our map undergoes a rigorous 20-point quality and hygiene check.",
                                color: "bg-blue-500/5"
                            },
                            {
                                icon: <Sparkles className="text-emerald-500" size={28} />,
                                title: "Premium Visuals",
                                desc: "Explore high-definition galleries and verified ratings before you even step in.",
                                color: "bg-emerald-500/5"
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -10 }}
                                className="group p-10 rounded-[2.5rem] bg-[#FDFDFF] border border-slate-100 hover:border-amber-200/50 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-500"
                            >
                                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-black mb-4 text-slate-900">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA Strip */}
            <section className="max-w-7xl mx-auto px-6 pb-20">
                <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden text-center md:text-left">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[100px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="max-w-xl">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ready to find your best look yet?</h2>
                            <p className="text-slate-400 text-lg">Join 20,000+ users who have already found their perfect salon through GlossCut.</p>
                        </div>
                        <button className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
                            Get the App Now
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ShopsMapPage;
