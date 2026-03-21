import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, ArrowRight, ShieldCheck, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';

const FeaturedShops = ({ shops }) => {
    const navigate = useNavigate();

    const getShopStatus = (shop) => {
        // If barber has manually toggled "Live", show that first
        if (shop.isAvailable === true) {
            return { status: 'Live Now', color: 'text-green-600', bg: 'bg-green-50' };
        }

        const now = new Date();
        const currentHour = now.getHours();

        // Hardcoded 9 AM to 9 PM rule as requested
        if (currentHour >= 9 && currentHour < 21) {
            return { status: 'Open Now', color: 'text-green-600', bg: 'bg-green-50' };
        } else {
            return { status: 'Closed', color: 'text-gray-500', bg: 'bg-gray-50' };
        }
    };

    if (!shops || shops.length === 0) return null;

    return (
        <section className="relative w-full pt-12 pb-12 lg:py-16 px-5 sm:px-6 lg:px-8 z-30">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-3">
                    <div className="max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider mb-4"
                        >
                            <Star size={12} fill="currentColor" />
                            Admin's Choice
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight"
                        >
                            Featured <span className="text-[#4C763B]">Salons</span>
                        </motion.h2>
                    </div>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        onClick={() => navigate('/all-services-search')}
                        className="group flex items-center gap-2 text-sm font-bold text-[#4C763B] hover:text-green-700 transition-colors"
                    >
                        View all shops <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                    {shops.map((shop, index) => {
                        const statusObj = getShopStatus(shop);
                        return (
                            <motion.div
                                key={shop._id}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="group relative bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-300 cursor-pointer"
                                onClick={() => navigate(`/all-services-search?barberId=${shop._id}`)}
                            >
                                {/* Image Section */}
                                <div className="relative h-56 sm:h-60 overflow-hidden bg-gray-100">
                                    <img
                                        src={shop.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800'}
                                        alt={shop.name}
                                        className="w-full h-full object-cover transform group-hover:scale-[1.03] transition-transform duration-500"
                                    />
                                    
                                    {/* Mockup Badges */}
                                    <div className="absolute top-4 left-4">
                                        <div className="bg-white/95 px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-white/50">
                                            <Star size={12} className="text-amber-500" fill="currentColor" />
                                            <span className="text-[11px] font-black text-gray-900">{shop.rating || '4.8'}</span>
                                        </div>
                                    </div>

                                    <div className="absolute top-4 right-4">
                                        <div className="bg-[#4C763B] text-white p-1.5 rounded-full shadow-lg border border-white/20">
                                            <ShieldCheck size={14} />
                                        </div>
                                    </div>
                                    
                                    {/* Availability Tag */}
                                    <div className="absolute bottom-12 left-4 z-10">
                                        <div className={`px-2.5 py-1 rounded-full ${statusObj.bg} shadow-sm flex items-center gap-1.5 border border-white/20`}>
                                            <div className={`w-1 h-1 rounded-full ${statusObj.status.includes('Open') || statusObj.status.includes('Live') ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className={`text-[9px] font-black uppercase tracking-wider ${statusObj.color}`}>
                                                {statusObj.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section (Compact Floating) */}
                                <div className="relative z-20 px-4 -mt-10 pb-5">
                                    <div className="bg-white p-5 rounded-[2rem] shadow-lg border border-gray-100">
                                        <h3 className="font-black text-lg text-[#111] mb-2 truncate">
                                            {shop.name}
                                        </h3>
                                        <div className="flex items-center text-gray-400 bg-gray-50 px-2 py-1.5 rounded-xl mb-6">
                                            <MapPin size={12} className="mr-1.5 flex-shrink-0" />
                                            <span className="text-[10px] font-bold truncate">{shop.address || 'Local Shop'}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest mb-0.5">
                                                    TOTAL REVIEWS
                                                </p>
                                                <p className="text-[#111] font-black text-xl">
                                                    {shop.reviews || 0}
                                                </p>
                                            </div>

                                            <button
                                                className="bg-[#111] text-white px-5 py-3 rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all flex items-center gap-2 group/btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/all-services-search?shopId=${shop._id}`);
                                                }}
                                            >
                                                Book <Scissors size={14} className="group-hover/btn:-rotate-45 transition-transform" />
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
