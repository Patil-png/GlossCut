import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Search, Star, Clock,
    MapPin, Tag, ChevronRight, Loader2,
    Filter, X, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { barbersData } from '../data/barbers';

const BarberSearchScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { forFriend } = location.state || {};

    const [searchQuery, setSearchQuery] = useState('');
    const [activeSort, setActiveSort] = useState('Rating');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading animation parity
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const sortOptions = [
        { label: 'Rating', value: 'Rating' },
        { label: 'Total Reviews', value: 'Number of Reviews' },
        { label: 'Average Time', value: 'Avg. Appointment Time' },
        { label: 'Number of Services', value: 'Number of Services' },
    ];

    const filteredBarbers = useMemo(() => {
        let list = [...barbersData];

        // Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            list = list.filter(barber =>
                barber.name.toLowerCase().includes(query) ||
                barber.address.toLowerCase().includes(query)
            );
        }

        // Sort
        switch (activeSort) {
            case 'Rating':
                list.sort((a, b) => b.rating - a.rating);
                break;
            case 'Number of Reviews':
                list.sort((a, b) => b.reviews - a.reviews);
                break;
            case 'Number of Services':
                list.sort((a, b) => b.totalServices - a.totalServices);
                break;
            case 'Avg. Appointment Time':
                list.sort((a, b) => parseInt(a.avgAppointmentTime) - parseInt(b.avgAppointmentTime));
                break;
            default:
                list.sort((a, b) => b.rating - a.rating);
        }
        return list;
    }, [searchQuery, activeSort]);

    const BarberCard = ({ item, index }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/barber-profile/${item.id}`, { state: { forFriend } })}
            className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 mb-6 group active:scale-[0.98] transition-all"
        >
            <div className="relative h-48 w-full overflow-hidden">
                <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name} />
                <div className="absolute top-4 left-4 bg-emerald-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-lg backdrop-blur-md">
                    <Star size={14} fill="currentColor" />
                    <span className="text-[13px] font-black">{item.rating}</span>
                </div>
            </div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{item.name}</h3>
                    <div className="bg-rose-50 text-rose-500 px-3 py-1 rounded-lg border border-rose-100 flex items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.tag}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-gray-400 mb-5">
                    <MapPin size={14} className="text-indigo-400" />
                    <p className="text-[13px] font-bold truncate">{item.address}</p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-50 text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span className="text-[12px] font-bold">{item.avgAppointmentTime}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                    <div className="flex items-center gap-1.5">
                        <Star size={14} />
                        <span className="text-[12px] font-bold">{item.reviews} Reviews</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                    <div className="flex items-center gap-1.5">
                        <Tag size={14} />
                        <span className="text-[12px] font-bold">{item.totalServices} Svcs</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-8 text-center">
                <div className="relative w-32 h-32 mb-8">
                    <motion.div
                        className="absolute inset-0 rounded-[40px] bg-indigo-500/10"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="w-full h-full rounded-[40px] bg-white border border-gray-100 flex items-center justify-center text-indigo-600 shadow-xl">
                        <Search size={40} className="animate-pulse" />
                    </div>
                </div>
                <h2 className="text-2xl font-[1000] text-gray-900 tracking-tighter mb-2">Locating Artisans</h2>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Curating the best for you...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 flex justify-center">
            <div className="w-full max-w-[450px] relative min-h-screen flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 pt-10 pb-6 sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-xl z-40">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
                            <ArrowLeft size={22} className="text-gray-900" strokeWidth={2.5} />
                        </button>
                        <h1 className="text-2xl font-[1000] text-gray-900 tracking-tighter">Nearby Shops</h1>
                        <div className="w-11" />
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or area..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 bg-white border border-gray-100 rounded-2xl pl-14 pr-6 font-bold text-gray-900 shadow-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="px-6 py-2 overflow-x-auto flex gap-3 no-scrollbar scroll-smooth">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setActiveSort(option.value)}
                            className={`whitespace-nowrap px-5 py-2.5 rounded-xl border text-[12px] font-black tracking-wide uppercase transition-all flex items-center gap-2 ${activeSort === option.value
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100'
                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                }`}
                        >
                            {activeSort === option.value && <SlidersHorizontal size={12} />}
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Barber List */}
                <div className="p-6">
                    {filteredBarbers.length > 0 ? (
                        filteredBarbers.map((barber, idx) => (
                            <BarberCard key={barber.id} item={barber} index={idx} />
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 mb-6">
                                <X size={32} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900">No matches found</h3>
                            <p className="text-sm font-bold text-gray-400 mt-2">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BarberSearchScreen;
