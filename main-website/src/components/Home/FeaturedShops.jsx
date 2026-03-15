import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

const FeaturedShops = ({ shops }) => {
    const navigate = useNavigate();

    if (!shops || shops.length === 0) return null;

    return (
        <section className="relative w-full py-12 px-5 sm:px-6 lg:px-8 z-30">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                            <Star size={12} fill="currentColor" />
                            Admin's Top Picks
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                            Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] to-green-600">Salons</span>
                        </h2>
                        <p className="text-gray-500 mt-2 text-sm md:text-base font-medium">Handpicked premium grooming experiences for you.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shops.map((shop) => (
                        <div
                            key={shop._id}
                            className="group relative bg-white/70 backdrop-blur-md rounded-3xl p-4 border border-gray-100 hover:border-green-200 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500 cursor-pointer overflow-hidden"
                            onClick={() => navigate('/all-services-search')}
                        >
                            {/* Glow Effect */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors duration-500" />
                            
                            <div className="relative flex flex-col h-full">
                                {/* Image Wrapper */}
                                <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden mb-5">
                                    <img
                                        src={shop.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800'}
                                        alt={shop.name}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    
                                    {/* Availability Badge */}
                                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${shop.isAvailable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-400'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-900">
                                            {shop.isAvailable ? 'Live Now' : 'Closed'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 px-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#4C763B] transition-colors">{shop.name}</h3>
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100">
                                            <Star size={12} className="text-amber-500" fill="currentColor" />
                                            <span className="text-xs font-black text-gray-900">{shop.rating || '4.8'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-gray-400 mb-4">
                                        <MapPin size={14} className="group-hover:text-green-500 transition-colors" />
                                        <span className="text-xs font-medium truncate">{shop.address}</span>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-1">
                                            <ShieldCheck size={14} className="text-blue-500" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verified Shop</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[#4C763B] font-bold text-sm">
                                            Book Slot
                                            <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedShops;
