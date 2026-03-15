import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, ArrowRight, ShieldCheck, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';

const FeaturedShops = ({ shops }) => {
    const navigate = useNavigate();

    if (!shops || shops.length === 0) return null;

    return (
        <section className="relative w-full py-16 lg:py-20 px-5 sm:px-6 lg:px-8 z-30 overflow-hidden">
            {/* Background Orbs for Premium feel */}
            <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] bg-[#4C763B]/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[10%] left-[-10%] w-[250px] h-[250px] bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest mb-4"
                        >
                            <Star size={12} fill="currentColor" />
                            Admin's Top Choice
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.1]"
                        >
                            Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] to-green-600">Salons.</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-500 mt-4 text-base md:text-lg font-medium leading-relaxed"
                        >
                            Handpicked premium grooming experiences, verified for excellence.
                        </motion.p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                    {shops.map((shop, index) => (
                        <motion.div
                            key={shop._id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-gray-100/50 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-500 cursor-pointer"
                            onClick={() => navigate(`/all-services-search?barberId=${shop._id}`)}
                        >
                            {/* Image Container */}
                            <div className="relative h-64 sm:h-72 overflow-hidden">
                                <img
                                    src={shop.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800'}
                                    alt={shop.name}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                                
                                {/* Top Badges */}
                                <div className="absolute top-5 left-5 z-20 flex gap-2">
                                    <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-2xl shadow-sm flex items-center gap-1.5 border border-white/20">
                                        <Star size={12} className="text-amber-500" fill="currentColor" />
                                        <span className="text-xs font-black text-gray-900">{shop.rating || '4.8'}</span>
                                    </div>
                                </div>

                                <div className="absolute top-5 right-5 z-20">
                                    <div className="bg-[#4C763B] text-white p-2 rounded-full shadow-lg ring-4 ring-white/30">
                                        <ShieldCheck size={14} className="text-white" />
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="absolute bottom-20 left-5 z-20">
                                    <div className={`px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm shadow-sm flex items-center gap-1.5 border border-white/20`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${shop.isAvailable !== false ? 'bg-green-500' : 'bg-red-400'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-900">
                                            {shop.isAvailable !== false ? 'Live Now' : 'Closed'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Content Card */}
                            <div className="relative z-20 px-4 -mt-16 pb-6">
                                <div className="bg-white/95 backdrop-blur-md border border-white/50 p-6 rounded-[2rem] shadow-lg shadow-gray-200/50 group-hover:border-green-100 transition-colors">
                                    <div className="mb-4 pb-4 border-b border-gray-100/80 border-dashed">
                                        <h3 className="font-black text-xl text-gray-900 mb-2 truncate tracking-tight group-hover:text-[#4C763B] transition-colors">
                                            {shop.name}
                                        </h3>
                                        <div className="flex items-center text-gray-500 text-xs font-bold leading-tight">
                                            <MapPin size={12} className="mr-1.5 text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{shop.address || 'Local Shop'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-[0.2em] mb-0.5">
                                                TOTAL REVIEWS
                                            </p>
                                            <p className="text-gray-900 font-black text-xl">
                                                {shop.reviewsCount || 0}
                                            </p>
                                        </div>

                                        <button
                                            className="group/btn relative overflow-hidden bg-gray-900 text-white px-6 py-3.5 rounded-2xl text-sm font-black shadow-xl shadow-gray-900/10 active:scale-95 transition-all w-32"
                                        >
                                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#4C763B] to-green-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                Book <Scissors size={14} className="group-hover/btn:-rotate-45 transition-transform duration-300" />
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedShops;
