
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, MapPinned, Scissors, Flame, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Image from './Image';

const FeaturedBarbers = () => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedBarbers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/shop/featured-barbers`);
        let barbersData = response.data;

        // Fallback mock data for missing categories
        const fallbackData = [
          { id: 'fallback-1', name: "The Gentleman's Cut", rating: 4.8, distance: "1.2 km", price: 200, nextSlot: "10:30 AM", img: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80", verified: true, category: 'Barber' },
          { id: 'fallback-2', name: "Style Studio Pune", rating: 4.6, distance: "2.5 km", price: 150, nextSlot: "11:00 AM", img: "https://images.unsplash.com/photo-1503951914875-452162b7f30a?w=800&q=80", verified: true, category: "Women's Salon" },
          { id: 'fallback-3', name: "Urban Grooming", rating: 4.9, distance: "0.8 km", price: 350, nextSlot: "10:15 AM", img: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80", verified: true, category: 'Barber' },
          { id: 'fallback-4', name: "Pet Paradise", rating: 4.7, distance: "1.5 km", price: 250, nextSlot: "9:30 AM", img: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80", verified: true, category: 'Pet Care' },
        ];

        // Group API data by category
        const groupedByCategory = barbersData.reduce((acc, barber) => {
          const category = barber.category || 'Barber';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(barber);
          return acc;
        }, {});

        // For categories not returned by API, use fallback data
        const expectedCategories = ['Barber', "Women's Salon", 'Pet Care'];
        expectedCategories.forEach(category => {
          if (!groupedByCategory[category] || groupedByCategory[category].length === 0) {
            // Add fallback data for missing category
            const fallbackForCategory = fallbackData.filter(barber => barber.category === category);
            if (fallbackForCategory.length > 0) {
              groupedByCategory[category] = fallbackForCategory;
            }
          }
        });

        // Select top-rated barber from each category
        const topRatedBarbers = Object.values(groupedByCategory).map(categoryBarbers => {
          return categoryBarbers.reduce((top, current) =>
            (current.rating || 0) > (top.rating || 0) ? current : top
          );
        });

        setBarbers(topRatedBarbers);
        setError(null);
      } catch (err) {
        console.error('Error fetching featured barbers:', err);
        setError('Failed to load featured barbers');
        // Fallback mock data - select top-rated from each category
        const fallbackData = [
          { id: '1', name: "The Gentleman's Cut", rating: 4.8, distance: "1.2 km", price: 200, nextSlot: "10:30 AM", img: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80", verified: true, category: 'Barber' },
          { id: '2', name: "Style Studio Pune", rating: 4.6, distance: "2.5 km", price: 150, nextSlot: "11:00 AM", img: "https://images.unsplash.com/photo-1503951914875-452162b7f30a?w=800&q=80", verified: true, category: "Women's Salon" },
          { id: '3', name: "Urban Grooming", rating: 4.9, distance: "0.8 km", price: 350, nextSlot: "10:15 AM", img: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80", verified: true, category: 'Barber' },
          { id: '4', name: "Pet Paradise", rating: 4.7, distance: "1.5 km", price: 250, nextSlot: "9:30 AM", img: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80", verified: true, category: 'Pet Care' },
          { id: '5', name: "Universal Cuts", rating: 4.5, distance: "2.0 km", price: 180, nextSlot: "10:45 AM", img: "https://images.unsplash.com/photo-1503951914875-452162b7f30a?w=800&q=80", verified: true, category: 'Unisex' },
        ];

        const groupedFallback = fallbackData.reduce((acc, barber) => {
          const category = barber.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(barber);
          return acc;
        }, {});

        const topRatedFallback = Object.values(groupedFallback).map(categoryBarbers => {
          return categoryBarbers.reduce((top, current) =>
            (current.rating || 0) > (top.rating || 0) ? current : top
          );
        });

        setBarbers(topRatedFallback);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBarbers();
  }, []);

  const handleBook = (barber) => {
    // Navigate to AllServicesSearch with barberId to find and show the shop that contains this barber
    navigate(`/all-services-search?barberId=${barber.id}`);
  };

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-3xl font-extrabold text-gray-900 mb-2">Featured Barbers</p>
              <p className="text-gray-500 ">Top rated grooming experts near you</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-2xl border border-gray-100 animate-pulse h-[28rem]"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-gray-50 relative overflow-hidden">
      {/* Background glow - Pink/Warm */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-pink-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-pink-600 font-bold tracking-wider text-xs uppercase mb-2">
              <Flame size={14} className="fill-pink-600" /> Top Rated
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 font-serif">Featured Barbers</h2>
            <p className="text-gray-500 text-sm lg:text-base mt-2 max-w-lg">
              Premium grooming experts in your area with the highest customer ratings.
            </p>
          </div>

          <button
            onClick={() => navigate('/all-services-search')}
            className="hidden md:flex items-center text-gray-700 bg-white hover:bg-gray-50 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border border-gray-200 shadow-sm"
          >
            View All <ChevronRight size={16} className="ml-1" />
          </button>
        </div>

        {error && (
          <div className="text-center py-8 bg-red-500/10 rounded-2xl border border-red-500/20 mb-8">
            <p className="text-red-400 mb-0">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {barbers.map((barber) => (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200 transition-all duration-300"
            >
              {/* Image Container */}
              <div className="relative h-60 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent z-10"></div>

                <Image
                  src={barber.img}
                  alt={barber.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out grayscale-[0.2] group-hover:grayscale-0"
                />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <div className="bg-white/90 backdrop-blur-md text-pink-600 text-xs font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1 border border-pink-100 shadow-sm">
                    <Star size={12} fill="currentColor" /> {barber.rating?.toFixed(1) || '4.5'}
                  </div>
                </div>

                <div className="absolute top-4 right-4 z-20">
                  {barber.verified && (
                    <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white" title="Verified Barber">
                      <ShieldCheck size={14} fill="currentColor" className="text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 pt-2 relative z-20 -mt-12">
                <div className="bg-white/95 backdrop-blur-xl border border-gray-100 p-5 rounded-xl shadow-lg">
                  {/* Header Info */}
                  <div className="mb-4 border-b border-gray-100 pb-4">
                    <h3 className="font-bold text-xl text-gray-900 mb-1 leading-tight truncate font-serif">{barber.name}</h3>
                    <div className="flex items-center text-gray-500 text-xs">
                      <MapPinned size={12} className="mr-1" />
                      <span className="truncate max-w-[150px]">{barber.address || 'Local Shop'}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-pink-600 font-medium">{barber.distance || '1.2 km'}</span>
                    </div>
                  </div>

                  {/* Pricing & Action */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Starting from</p>
                      <p className="text-gray-900 font-bold text-lg">₹{barber.price || 150}</p>
                    </div>

                    <button
                      onClick={() => handleBook(barber)}
                      className="bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-lg text-sm font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      Book <Scissors size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center md:hidden">
          <button
            onClick={() => navigate('/all-services-search')}
            className="inline-flex items-center text-pink-600 font-bold hover:text-pink-500 transition-colors"
          >
            View All Barbers <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBarbers;
