import React, { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Search } from 'lucide-react';

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
        <div className="py-4 px-4 relative z-20">
            <div className="max-w-4xl mx-auto">
                {/* Adjusted overlap for taller Hero: -translate-y-32 */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-2 lg:p-2 border border-gray-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] transform -translate-y-6 lg:-translate-y-32 ring-1 ring-black/5">
                    <div className="flex flex-col md:flex-row gap-2">
                        <div className="flex-1 relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors pointer-events-none">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Detect location or type area..."
                                value={locationQuery}
                                onChange={(e) => setLocationQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-black/10 text-gray-900 placeholder-gray-500 transition-all text-sm font-medium"
                            />
                        </div>

                        <div className="hidden md:block w-px bg-gray-200 my-2"></div>

                        <div className="hidden md:flex flex-1 relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors pointer-events-none">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Haircut, Shave, Massage..."
                                value={serviceQuery}
                                onChange={(e) => setServiceQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-black/10 text-gray-900 placeholder-gray-500 transition-all text-sm font-medium"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="bg-black hover:bg-gray-800 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-gray-200 active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap text-sm"
                        >
                            Find
                        </button>
                    </div>
                </div>

                {/* Adjusted tag margin for taller Hero */}
                <div className="mt-2 flex flex-wrap gap-2 justify-center lg:-translate-y-28 relative z-10">
                    <span className="text-[10px] font-bold text-zinc-500 mr-2 py-1 uppercase tracking-wider">Popular:</span>
                    {popularServices.slice(0, 4).map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            className="px-2.5 py-0.5 bg-white hover:bg-gray-100 text-gray-600 hover:text-black rounded-full text-[11px] font-medium transition-colors border border-gray-200 hover:border-gray-300 shadow-sm"
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
