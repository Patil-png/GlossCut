import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { MapPin, Search, Filter, Layers, Navigation } from 'lucide-react';
import ShopsMap from './ShopsMap';

const ShopsMapPage = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchShops = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/shop/all`);
            if (Array.isArray(res.data)) {
                // Only show approved shops with coordinates
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
    }, [fetchShops]);

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shop.address && shop.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30">
            <Helmet>
                <title>Store Locator | Find GlossCut Salons Near You</title>
                <meta name="description" content="Use our interactive map to find the best salon shops and barbers in your city. Real-time availability and instant booking." />
            </Helmet>

            {/* Header Content */}
            <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-2xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold mb-4">
                            <Navigation size={12} />
                            <span>Interactive Shop Finder</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                            Explore <span className="text-amber-500">Premium Salons</span>
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Find the best grooming experts in Nagpur & Amravati. Zoom in, explore markers, and book your next style instantly.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full md:w-96"
                    >
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search by shop name or area..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all font-medium"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Map Section */}
            <section className="px-6 pb-20 max-w-7xl mx-auto h-[600px] md:h-[700px]">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full h-full relative"
                >
                    {loading ? (
                        <div className="w-full h-full bg-[#111] rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-4">
                            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium">Initializing Map...</p>
                        </div>
                    ) : (
                        <ShopsMap shops={filteredShops} />
                    )}

                    {/* Left Floating Info Overlay */}
                    {!loading && (
                        <div className="absolute top-6 left-6 z-[1000] hidden md:block">
                            <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Displaying</p>
                                <p className="text-2xl font-black text-amber-500">{filteredShops.length} <span className="text-white text-sm font-bold">Shops Found</span></p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </section>

            {/* Info Section */}
            <section className="py-20 bg-[#080808] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                        <div>
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                                <Layers className="text-amber-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 tracking-tight">Real-Time Locations</h3>
                            <p className="text-gray-400 leading-relaxed">All coordinates are updated in real-time, ensuring you always find the closest open shop.</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                                <Filter className="text-amber-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 tracking-tight">Dynamic Search</h3>
                            <p className="text-gray-400 leading-relaxed">Instantly filter shops by name or locality to narrow down your choices without reloading.</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                                <MapPin className="text-amber-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 tracking-tight">Verified Partners</h3>
                            <p className="text-gray-400 leading-relaxed">Every shop on our map is a verified GlossCut partner, ensuring high-quality service standards.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ShopsMapPage;
