import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, ArrowRight, ShieldCheck, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';

const FeaturedShops = ({ shops }) => {
    const navigate = useNavigate();

    const getShopStatus = (shop) => {
        // 1. Check if manually disabled
        if (shop.isAvailable === false) return { status: 'Closed', color: 'text-red-500', bg: 'bg-red-50' };

        // 2. Check Operating Hours
        if (!shop.operatingHours) return { status: 'Live Now', color: 'text-green-500', bg: 'bg-green-50' };

        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const now = new Date();
        const today = days[now.getDay()];
        const hours = shop.operatingHours[today];

        if (!hours || !hours.open || !hours.close || hours.open === 'Closed') {
            return { status: 'Closed Today', color: 'text-red-500', bg: 'bg-red-50' };
        }

        try {
            const [openH, openM] = hours.open.split(':').map(Number);
            const [closeH, closeM] = hours.close.split(':').map(Number);
            
            const openTime = new Date(now);
            openTime.setHours(openH, openM, 0);
            
            const closeTime = new Date(now);
            closeTime.setHours(closeH, closeM, 0);

            if (now >= openTime && now <= closeTime) {
                return { status: 'Open Now', color: 'text-green-600', bg: 'bg-green-50' };
            } else {
                return { status: 'Closed', color: 'text-gray-500', bg: 'bg-gray-50' };
            }
        } catch (e) {
            return { status: 'Live Now', color: 'text-green-600', bg: 'bg-green-50' };
        }
    };

    if (!shops || shops.length === 0) return null;

    return (
        <section className="relative w-full py-16 lg:py-24 px-5 sm:px-6 lg:px-8 z-30 overflow-hidden">
            {/* Background Orbs for Premium feel */}
            <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] bg-[#4C763B]/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[10%] left-[-10%] w-[250px] h-[250px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                    <div className="max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm"
                        >
                            <Star size={12} fill="currentColor" />
                            Admin's Top Choice
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.05]"
                        >
                            Featured <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#4C763B] via-green-600 to-[#4C763B] bg-[length:200%_auto] animate-gradient-text">Salons.</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-gray-500 mt-6 text-lg md:text-xl font-medium leading-relaxed"
                        >
                            Handpicked premium grooming experiences, verified for excellence.
                        </motion.p>
                    </div>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        onClick={() => navigate('/all-services-search')}
                        className="group flex items-center gap-3 bg-white px-8 py-4 rounded-full text-sm font-black text-gray-900 border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Explore More <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14">
                    {shops.map((shop, index) => {
                        const statusObj = getShopStatus(shop);
                        return (
                            <motion.div
                                key={shop._id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15, duration: 0.6 }}
                                className="group relative bg-white rounded-[3rem] overflow-hidden border border-gray-100/50 shadow-2xl shadow-gray-200/60 hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.12)] transition-all duration-700 cursor-pointer"
                                onClick={() => navigate(`/all-services-search?barberId=${shop._id}`)}
                            >
                                {/* Image Container */}
                                <div className="relative h-72 sm:h-80 overflow-hidden">
                                    <img
                                        src={shop.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800'}
                                        alt={shop.name}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-500" />
                                    
                                    {/* Top Left: Rating */}
                                    <div className="absolute top-6 left-6 z-20">
                                        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-white/40 ring-1 ring-black/5">
                                            <Star size={14} className="text-amber-500 animate-pulse" fill="currentColor" />
                                            <span className="text-sm font-black text-gray-900 tracking-tight">{shop.rating || '4.8'}</span>
                                        </div>
                                    </div>

                                    {/* Top Right: Verified */}
                                    <div className="absolute top-6 right-6 z-20">
                                        <div className="bg-[#4C763B] text-white p-2.5 rounded-full shadow-2xl ring-4 ring-white/40 transform group-hover:rotate-[360deg] transition-transform duration-1000">
                                            <ShieldCheck size={18} className="text-white" />
                                        </div>
                                    </div>

                                    {/* Status Badge - Floating */}
                                    <div className="absolute bottom-24 left-6 z-20">
                                        <div className={`px-4 py-2 rounded-2xl ${statusObj.bg} backdrop-blur-md shadow-lg flex items-center gap-2 border border-white/20 ring-1 ring-black/5`}>
                                            <div className={`w-2 h-2 rounded-full ${statusObj.status.includes('Open') || statusObj.status.includes('Live') ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`} />
                                            <span className={`text-xs font-black uppercase tracking-widest ${statusObj.color}`}>
                                                {statusObj.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Content Card */}
                                <div className="relative z-20 px-4 -mt-20 pb-8">
                                    <div className="bg-white/95 backdrop-blur-xl border border-white/50 p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 group-hover:ring-2 group-hover:ring-green-100/50 transition-all duration-500">
                                        <div className="mb-6 pb-6 border-b border-gray-100/80 border-dashed">
                                            <h3 className="font-black text-2xl text-gray-900 mb-3 truncate tracking-tight group-hover:text-[#4C763B] transition-colors">
                                                {shop.name}
                                            </h3>
                                            <div className="flex items-center text-gray-500 text-xs font-bold leading-tight bg-gray-50 px-3 py-2 rounded-xl border border-gray-100/50">
                                                <MapPin size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                                                <span className="truncate">{shop.address || 'Local Shop'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.25em] mb-1">
                                                    REVIEWS
                                                </p>
                                                <p className="text-gray-900 font-black text-2xl flex items-baseline gap-1">
                                                    {shop.reviewsCount || 0}
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
                                                </p>
                                            </div>

                                            <button
                                                className="group/btn relative overflow-hidden bg-gray-900 text-white px-8 py-4.5 rounded-[1.25rem] text-sm font-black shadow-2xl shadow-gray-900/20 active:scale-95 transition-all w-36"
                                            >
                                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#4C763B] via-green-600 to-[#1e3a12] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                                                <span className="relative z-10 flex items-center justify-center gap-2.5">
                                                    Book <Scissors size={18} className="group-hover/btn:-rotate-45 transition-transform duration-500" />
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FeaturedShops;
