import React, { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Search, ArrowRight } from 'lucide-react';

const SearchTeaser = memo(() => {
    const navigate = useNavigate();
    const [locationQuery, setLocationQuery] = useState('');
    const [serviceQuery, setServiceQuery] = useState('');
    const [popularServices, setPopularServices] = useState(['Near Me', 'Haircut', 'Beard Trim', 'Facial', 'Kid\'s Cut']);

    /* Real Services Fetch */
    useEffect(() => {
        const fetchServices = async () => {
            try {
                // Fetch centrally managed services (Admin Panel)
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/services`);
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    // Extract names from objects
                    setPopularServices(res.data.map(s => s.name));
                }
            } catch (err) {
                console.warn('Failed to fetch services, using defaults', err);
            }
        };
        fetchServices();
    }, []);

    const handleSearch = () => {
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
                <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-4 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform -translate-y-6 lg:-translate-y-16 ring-1 ring-black/5">

                    <div className="flex flex-col md:flex-row gap-3">

                        {/* Location Input */}
                        <div className="flex-1 relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors pointer-events-none">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Detect location..."
                                value={locationQuery}
                                onChange={(e) => setLocationQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-gray-900 placeholder-gray-500 transition-all text-sm font-medium shadow-sm"
                            />
                        </div>

                        {/* Divider (Hidden on mobile) */}
                        <div className="hidden md:block w-px bg-gray-200 my-2"></div>

                        {/* Service Input - Hidden on mobile */}
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
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-gray-900 placeholder-gray-500 transition-all text-sm font-medium shadow-sm"
                            />
                        </div>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            className="group relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap text-sm md:w-auto w-full"
                        >
                            <span>Find</span>
                            {/* Animated Arrow on Hover */}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>

                {/* Popular Tags */}
                <div className="mt-2 flex flex-wrap gap-2 justify-center lg:-translate-y-12 relative z-10 px-2">
                    <span className="hidden md:block text-[10px] font-bold text-gray-500 mr-2 py-1.5 uppercase tracking-wider">
                        Trending:
                    </span>
                    {popularServices.slice(0, 4).map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            className="px-3 py-1 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-600 hover:text-violet-700 rounded-full text-[11px] font-medium transition-all border border-gray-200/60 hover:border-violet-200 shadow-sm hover:shadow-md"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
});

export default SearchTeaser;