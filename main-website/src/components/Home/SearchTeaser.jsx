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
                <div className="bg-white/90 backdrop-blur-3xl rounded-[2rem] p-3 md:p-4 border border-white/40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transform -translate-y-6 lg:-translate-y-16 ring-1 ring-black/5 relative overflow-hidden">
                    {/* Subtle decorative gradient blob behind inputs */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-violet-50/50 via-transparent to-green-50/50 pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row gap-3">

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
                                className="w-full pl-11 pr-4 py-4 bg-gray-50/50 hover:bg-white border border-gray-200/60 rounded-2xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet-100 focus:border-violet-500 text-gray-900 placeholder-gray-400 transition-all text-[15px] font-medium shadow-inner"
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
                                className="w-full pl-11 pr-4 py-4 bg-gray-50/50 hover:bg-white border border-gray-200/60 rounded-2xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet-100 focus:border-violet-500 text-gray-900 placeholder-gray-400 transition-all text-[15px] font-medium shadow-inner"
                            />
                        </div>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            className="group relative overflow-hidden bg-[#111] hover:bg-black text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-gray-200 active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap text-[15px] md:w-auto w-full"
                        >
                            <span className="relative z-10">Find</span>
                            {/* Animated Arrow on Hover */}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" />

                            {/* Button sheen effect */}
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
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
                            className="px-4 py-1.5 bg-white/70 backdrop-blur-md hover:bg-white text-gray-600 hover:text-black rounded-full text-[11px] font-semibold transition-all border border-gray-200 hover:border-black/20 shadow-sm hover:shadow-lg hover:-translate-y-0.5"
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