import React, { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Hash, Search, ArrowRight, Scissors, Sparkles, Paintbrush, User } from 'lucide-react';

const SearchTeaser = memo(() => {
    const navigate = useNavigate();
    const [trackingId, setTrackingId] = useState('');
    const [serviceQuery, setServiceQuery] = useState('');

    const [popularServices, setPopularServices] = useState(['Near Me', 'Haircut', 'Beard Trim', 'Facial', 'Kid\'s Cut']);

    // Static categories for Mobile Card View (matching user design)
    const mobileCategories = [
        { name: 'Haircut', icon: Scissors, color: 'text-orange-500', bg: 'bg-orange-50' },
        { name: 'Skin Care', icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-50' },
        { name: 'MakeUp', icon: Paintbrush, color: 'text-pink-500', bg: 'bg-pink-50' },
        { name: 'Men\'s Grooming', icon: User, color: 'text-green-500', bg: 'bg-green-50' },
    ];

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/services`);
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    setPopularServices(res.data.map(s => s.name));
                }
            } catch (err) {
                console.warn('Failed to fetch services, using defaults', err);
            }
        };
        fetchServices();
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

                {/* Popular Tags */}
                {/* Popular Tags - DESKTOP PILLS */}
                <div className="hidden md:flex mt-2 flex-wrap gap-2 justify-center lg:-translate-y-12 relative z-10 px-2">
                    <span className="text-[10px] font-bold text-gray-500 mr-2 py-1.5 uppercase tracking-wider">
                        Trending:
                    </span>
                    {popularServices.slice(0, 4).map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            className="px-4 py-1.5 bg-white/70 backdrop-blur-md hover:bg-white text-gray-600 hover:text-black rounded-full text-[11px] font-semibold transition-all border border-gray-200 hover:border-black/20 shadow-sm hover:shadow-lg hover:-translate-y-0.5"
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Popular Categories - MOBILE CARDS SCROLL */}
                <div className="md:hidden mt-6 -translate-y-4 relative z-10 w-full overflow-x-auto pb-4 no-scrollbar">
                    <div className="flex gap-3 px-1">
                        {mobileCategories.map((cat, index) => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleTagClick(cat.name)}
                                    className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-28 bg-white rounded-2xl shadow-[0_10px_20px_-5px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden group active:scale-95 transition-all"
                                >
                                    {/* Subtle gradient background inside card */}
                                    <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${cat.color.replace('text-', 'from-').replace('500', '100')} to-transparent`} />

                                    <div className={`w-10 h-10 ${cat.bg} rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className={`w-5 h-5 ${cat.color}`} />
                                    </div>
                                    <span className="text-[11px] font-extrabold text-gray-700 text-center leading-tight px-1 tracking-tight">
                                        {cat.name.split(' ').map((word, i) => (
                                            <span key={i} className="block">{word}</span>
                                        ))}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default SearchTeaser;