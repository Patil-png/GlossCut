
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
    <section className="py-20 lg:py-28 bg-gray-50 relative overflow-hidden">
      {/* Background Texture - Consistent with Home */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      {/* Soft Background Orbs - Consistent with Home Mobile/Desktop */}
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-[#4C763B]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-6">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-[#4C763B] font-bold tracking-wide text-xs uppercase mb-4"
            >
              <Flame size={12} className="fill-[#4C763B]" /> Top Rated Professionals
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-4"
            >
              Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] to-green-600">Barbers.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-500 leading-relaxed"
            >
              Discover the elite grooming experts in your area. verified for quality, hygiene, and customer satisfaction.
            </motion.p>
          </div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            onClick={() => navigate('/all-services-search')}
            className="hidden md:flex items-center gap-2 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full text-sm font-semibold transition-all border border-gray-200 shadow-sm hover:shadow-md active:scale-95"
          >
            Explore All <ChevronRight size={16} />
          </motion.button>
        </div>

        {error && (
          <div className="text-center py-8 bg-red-500/5 rounded-2xl border border-red-500/10 mb-12">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {barbers.map((barber, index) => (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative bg-white rounded-[2rem] overflow-hidden border border-gray-200/60 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500"
            >
              {/* Image Container */}
              <div className="relative h-72 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                <Image
                  src={barber.img}
                  alt={barber.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                {/* Top Badges */}
                <div className="absolute top-5 left-5 z-20 flex gap-2">
                  <div className="bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    {barber.rating?.toFixed(1) || '4.5'}
                  </div>
                </div>

                <div className="absolute top-5 right-5 z-20">
                  {barber.verified && (
                    <div className="bg-[#4C763B] text-white p-1.5 rounded-full shadow-lg ring-2 ring-white/50 animate-in fade-in zoom-in duration-300">
                      <ShieldCheck size={14} className="text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Content Card */}
              <div className="relative z-20 px-4 -mt-16 pb-4">
                <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-5 rounded-[1.5rem] shadow-lg shadow-gray-200/50">

                  {/* Title & Location */}
                  <div className="mb-4 pb-4 border-b border-gray-100/80 border-dashed">
                    <h3 className="font-bold text-xl text-gray-900 mb-2 leading-tight truncate tracking-tight">{barber.name}</h3>
                    <div className="flex items-center text-gray-500 text-xs font-medium">
                      <div className="flex items-center bg-gray-100 px-2 py-1 rounded-md max-w-[60%]">
                        <MapPinned size={12} className="mr-1.5 text-gray-400" />
                        <span className="truncate">{barber.address || 'Local Shop'}</span>
                      </div>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-[#4C763B]">{barber.distance || '1.2 km'}</span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">STARTING AT</p>
                      <p className="text-gray-900 font-extrabold text-xl">₹{barber.price || 150}</p>
                    </div>

                    <button
                      onClick={() => handleBook(barber)}
                      className="group/btn relative overflow-hidden bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-gray-900/20 active:scale-95 transition-all w-32"
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

        {/* Mobile View All Button */}
        <div className="mt-12 text-center md:hidden">
          <button
            onClick={() => navigate('/all-services-search')}
            className="inline-flex items-center justify-center w-full px-6 py-4 bg-white border border-gray-200 rounded-full text-gray-900 font-bold shadow-sm active:scale-95 transition-all"
          >
            View All Barbers <ChevronRight size={16} className="ml-2" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBarbers;
