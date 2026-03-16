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
                            name: cat.name,
                            emoji: cat.emoji || '✨',
                            color: cat.color || '#4C763B',
                            // Calculate light version of the color for background
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

    const handleTagClick = (tag) => {
        navigate(`/all-services-search?service=${encodeURIComponent(tag)}`);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="py-6 px-4 md:py-4 relative z-20">
            <div className="max-w-4xl mx-auto">
                {/* Search Container */}
                <div className="bg-white/90 backdrop-blur-3xl rounded-[2rem] p-2 md:p-4 border border-white/40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transform -translate-y-6 lg:-translate-y-16 ring-1 ring-black/5 relative overflow-hidden">

                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-violet-50/50 via-transparent to-green-50/50 pointer-events-none" />

                    {/* Flex row on all screens, but gap changes */}
                    <div className="relative flex flex-row gap-2 md:gap-3">

                        {/* Tracking ID Input - Main focus on mobile */}
                        <div className="flex-1 relative group">
                            <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors pointer-events-none">
                                <Hash className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter Queue ID..."
                                value={trackingId}
                                onChange={(e) => setTrackingId(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full pl-9 md:pl-11 pr-3 py-3.5 md:py-4 bg-gray-50/50 hover:bg-white border border-gray-200/60 rounded-2xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet-100 focus:border-violet-500 text-gray-900 placeholder-gray-400 transition-all text-sm md:text-[15px] font-medium shadow-inner"
                                maxLength={24}
                            />
                        </div>

                        {/* Divider (Hidden on mobile) */}
                        <div className="hidden md:block w-px bg-gray-200 my-2"></div>

                        {/* Service Input - Kept hidden on mobile to avoid overcrowding */}
                        <div className="hidden md:flex flex-1 relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors pointer-events-none">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Service (e.g. Haircut)..."
                                value={serviceQuery}
                                onChange={(e) => setServiceQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full pl-11 pr-4 py-4 bg-gray-50/50 hover:bg-white border border-gray-200/60 rounded-2xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet-100 focus:border-violet-500 text-gray-900 placeholder-gray-400 transition-all text-[15px] font-medium shadow-inner"
                            />
                        </div>

                        {/* Search Button - Now sits next to input on mobile */}
                        <button
                            onClick={handleSearch}
                            className="group relative overflow-hidden bg-[#111] hover:bg-black text-white px-5 md:px-10 py-3.5 md:py-4 rounded-2xl font-bold transition-all shadow-xl active:scale-[0.95] flex items-center justify-center gap-2 whitespace-nowrap text-sm md:text-[15px]"
                        >
                            <span className="relative z-10 md:block hidden">
                                {trackingId ? 'Track' : 'Find'}
                            </span>
                            {/* Icon only on mobile to save space if needed, or keep both */}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" />

                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </button>
                    </div>
                </div>

                {/* Popular Tags - DESKTOP PILLS */}
                <div className="hidden md:flex mt-4 flex-wrap gap-3 justify-center lg:-translate-y-12 relative z-10 px-4">
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="text-[10px] font-black text-[#4C763B] mr-1 py-2 uppercase tracking-[0.2em]"
                    >
                        Trending:
                    </motion.span>
                    {popularCategories.slice(0, 3).map((cat, idx) => (
                        <motion.button
                            key={cat.name}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleTagClick(cat.name)}
                            className="px-5 py-2 bg-white/60 backdrop-blur-xl hover:bg-white text-gray-700 hover:text-black rounded-2xl text-[12px] font-bold transition-all border border-white/50 hover:border-[#4C763B]/30 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.12)] flex items-center gap-2 group"
                        >
                            <span className="text-base group-hover:scale-110 transition-transform duration-300">{cat.emoji}</span>
                            <span>{cat.name}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Popular Categories - MOBILE CARDS SCROLL */}
                <div className="md:hidden mt-8 -translate-y-4 relative z-10 w-full">
                    <div className="px-4 mb-4 flex items-center justify-between">
                        <h3 className="text-[11px] font-black text-[#4C763B] uppercase tracking-[0.15em]">Categories</h3>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[#4C763B]/20 to-transparent ml-4" />
                    </div>

                    <div className="flex gap-4 px-4 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory">
                        {popularCategories.map((cat, index) => (
                            <motion.button
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTagClick(cat.name)}
                                className="flex-shrink-0 flex flex-col items-center justify-center w-28 h-32 bg-white rounded-[2rem] shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] border border-gray-100/80 relative overflow-hidden group snap-center"
                            >
                                {/* Background Decorative element */}
                                <div
                                    className="absolute -top-4 -right-4 w-12 h-12 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-60"
                                    style={{ backgroundColor: cat.color }}
                                />

                                {/* Icon/Emoji container */}
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-sm transform group-hover:rotate-6 transition-all duration-500 text-2xl"
                                    style={{
                                        backgroundColor: `${cat.color}15`,
                                        color: cat.color
                                    }}
                                >
                                    {cat.emoji}
                                </div>

                                {/* Label */}
                                <div className="px-2">
                                    <span className="text-[11px] font-black text-gray-800 text-center leading-[1.2] block tracking-tighter">
                                        {cat.name.split(' ').map((word, i) => (
                                            <span key={i} className="block">{word}</span>
                                        ))}
                                    </span>
                                </div>

                                {/* Active Indicator (Subtle bottom bar) */}
                                <div
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                                    style={{ backgroundColor: cat.color }}
                                />
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default SearchTeaser;