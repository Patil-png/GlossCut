import React, { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Hash, Search, ArrowRight, Scissors, Sparkles, Paintbrush, User } from 'lucide-react';
import { motion } from 'framer-motion';

const SearchTeaser = memo(() => {
    const navigate = useNavigate();
    const [trackingId, setTrackingId] = useState('');
    const [serviceQuery, setServiceQuery] = useState('');

    const [popularCategories, setPopularCategories] = useState([
        { name: 'Haircut', icon: Scissors, color: 'text-orange-500', bg: 'bg-orange-50', emoji: '💇‍♂️' },
        { name: 'Skin Care', icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-50', emoji: '✨' },
        { name: 'MakeUp', icon: Paintbrush, color: 'text-pink-500', bg: 'bg-pink-50', emoji: '💄' },
        { name: 'Men\'s Grooming', icon: User, color: 'text-green-500', bg: 'bg-green-50', emoji: '🤵' },
    ]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Fetch categories and filter for global ones (shopId is null)
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`);
                if (res.data && Array.isArray(res.data)) {
                    const globalCats = res.data
                        .filter(cat => cat.shopId === null || !cat.shopId)
                        .sort((a, b) => {
                            const order = { 'male': 1, 'unisex': 2, 'female': 3 };
                            const aOrder = order[a.gender] || 4;
                            const bOrder = order[b.gender] || 4;
                            return aOrder - bOrder;
                        })
                        .slice(0, 5); // Fetch up to 5 for mobile

                    if (globalCats.length > 0) {
                        setPopularCategories(globalCats.map(cat => ({
                            name: cat.name.split(' ').slice(0, 2).join(' '),
                            emoji: cat.emoji || '✨',
                            color: cat.color || '#4C763B',
                            bg: `${cat.color}10` || '#f0f9ff'
                        })));
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch categories, using defaults', err);
            }
        };
        fetchCategories();
    }, []);

    const handleSearch = () => {
        if (trackingId.trim()) {
            const searchId = trackingId.trim();
            const formattedId = searchId.length === 6 ? searchId.toUpperCase() : searchId;
            navigate(`/track-queue/${formattedId}`);
            return;
        }

        if (serviceQuery.trim()) {
            navigate(`/all-services-search?service=${encodeURIComponent(serviceQuery.trim())}`);
            return;
        }

        navigate(`/all-services-search`);
    };

    const handleTagClick = () => {
        navigate(`/all-services-search`);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="pt-6 pb-2 px-4 md:py-4 relative z-20"
        >
            <div className="max-w-4xl mx-auto">
                {/* Search Container */}
                <div className="bg-white/95 backdrop-blur-xl rounded-full md:rounded-[1.5rem] p-1.5 md:p-2 border border-black/5 md:border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transform -translate-y-6 lg:-translate-y-16 ring-1 ring-black/5 relative overflow-hidden">
                    <div className="flex flex-row md:flex-row items-center md:items-center gap-1.5 md:gap-0 relative z-10 transition-all duration-300">
                        <div className="flex-1 flex items-center bg-gray-50/80 md:bg-transparent rounded-full md:rounded-none px-2 md:px-0 transition-all duration-300">
                            {/* Service / Shop Search (Left) - Hidden on Mobile */}
                            <div className="hidden md:flex flex-1 relative items-center group">
                                <Search className="absolute left-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={serviceQuery}
                                    onChange={(e) => setServiceQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Search barbers..."
                                    className="w-full pl-12 pr-2 py-3 md:py-3.5 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none text-base font-medium truncate"
                                />
                                <div className="hidden md:block w-px h-8 bg-gray-200" />
                            </div>

                            {/* Tracking ID (Middle) - Full width on Mobile */}
                            <div className="flex-1 md:w-56 relative flex items-center group">
                                <Hash className="absolute left-4 md:left-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    value={trackingId}
                                    onChange={(e) => setTrackingId(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter Tracking ID..."
                                    className="w-full pl-10 md:pl-10 pr-2 py-4 md:py-3.5 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none text-[15px] md:text-base font-medium uppercase truncate"
                                    maxLength={6}
                                />
                            </div>
                        </div>

                        {/* Search Button (Right) */}
                        <div className="flex-none">
                            <button
                                onClick={handleSearch}
                                className="aspect-square md:aspect-auto p-3 md:px-8 md:py-3 bg-gray-900 hover:bg-black text-white rounded-[1.2rem] md:rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200 group active:scale-95"
                            >
                                <span className="hidden md:inline lg:inline">Find Services</span>
                                <span className="hidden md:inline lg:hidden">Find</span>
                                <ArrowRight className="md:group-hover:translate-x-1 transition-transform" size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Decorative subtle gradient inside search bar */}
                    <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
                </div>

                {/* Popular Tags */}
                <div className="mt-2 md:mt-2 px-4 flex flex-wrap items-center justify-center gap-2 md:gap-3 transform -translate-y-4 lg:-translate-y-12">
                    <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mr-1">Tending:</span>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {popularCategories.map((cat, idx) => {
                            return (
                                <button
                                    key={idx}
                                    onClick={handleTagClick}
                                    className="group relative flex items-center gap-2.5 px-3.5 py-1.5 md:px-4 md:py-2 bg-white/60 hover:bg-white border border-gray-100 hover:border-gray-200 rounded-full transition-all duration-300 hover:shadow-md active:scale-95 overflow-hidden"
                                >
                                    {/* Icon / Emoji */}
                                    <span className="text-base transform group-hover:scale-110 transition-transform duration-300">
                                        {cat.emoji || '✨'}
                                    </span>
                                    
                                    {/* Label */}
                                    <span className="text-[11px] md:text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                                        {cat.name}
                                    </span>
                                    
                                    {/* Subtle indicator bar on hover */}
                                    <div 
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 rounded-t-full transition-all duration-300 group-hover:w-12"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

export default SearchTeaser;