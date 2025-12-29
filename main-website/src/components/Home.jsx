import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Calendar, CreditCard, Scissors, Star,
  MapPin, ChevronDown, ChevronRight, Smartphone,
  ShieldCheck, Clock, Sparkles, Check, Zap, ArrowRight,
  TrendingUp, Activity
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- Data Constants ---
const FAQS = [
  { q: "Do I pay extra using GlossCut?", a: "No extra charges for basic bookings. You pay the same price as the shop menu." },
  { q: "Can I cancel a booking?", a: "Yes, you can cancel up to 1 hour before your slot for a full refund." },
  { q: "Is UPI payment secure?", a: "Absolutely. We use banking-grade security for all UPI transactions." },
];

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// --- Sub-Components ---

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-28 pb-24 lg:pt-32 lg:pb-48 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] bg-indigo-600/10 rounded-full blur-[100px] lg:blur-[120px]" />
         <div className="absolute bottom-0 right-0 w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] bg-blue-600/10 rounded-full blur-[80px] lg:blur-[100px]" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] lg:bg-[size:24px_24px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 lg:px-4 lg:py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs lg:text-sm font-semibold mb-6 lg:mb-8 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5 lg:h-2 lg:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 lg:h-2 lg:w-2 bg-indigo-500"></span>
              </span>
              Live in Pune, Nagpur & Mumbai
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-4xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 lg:mb-8">
              Book your barber <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400">in seconds.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-md lg:text-xl text-slate-400 mb-8 lg:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed px-2 lg:px-0">
              GlossCut makes grooming easy. Search nearby shops, pick a slot, and pay via UPI — no waiting in lines.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center lg:justify-start px-4 lg:px-0">
              <button className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-2xl font-bold text-base lg:text-lg hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] lg:shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transform hover:-translate-y-1">
                <Smartphone size={18} />
                Download App
              </button>
              <button
                onClick={() => navigate('/barber-account-creation')}
                className="flex items-center justify-center gap-2 bg-slate-900/50 text-white border border-white/10 px-6 lg:px-8 py-3 lg:py-4 rounded-2xl font-bold text-base lg:text-lg hover:bg-white/5 transition-all backdrop-blur-md"
              >
                List Your Shop
              </button>
            </motion.div>
          </motion.div>

          {/* Animated Illustration */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="relative hidden lg:block"
          >
             <div className="relative z-10 transform perspective-1000 rotate-y-12 rotate-x-6 hover:rotate-0 transition-transform duration-700">
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-6 max-w-sm mx-auto border border-white/10 shadow-2xl">
                   {/* Notch */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl"></div>
                   
                   {/* Mock UI Content */}
                   <div className="pt-8 space-y-6">
                      <div className="flex justify-between items-center">
                         <div className="h-8 w-8 rounded-full bg-white/10"></div>
                         <div className="h-4 w-24 rounded-full bg-white/5"></div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                         <h3 className="text-white font-bold text-lg mb-1">Upcoming Cut</h3>
                         <p className="text-indigo-100 text-sm mb-4">Tomorrow, 10:00 AM</p>
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white/20 rounded-full backdrop-blur-md"></div>
                            <div>
                               <div className="h-3 w-20 bg-white/30 rounded mb-1"></div>
                               <div className="h-2 w-12 bg-white/20 rounded"></div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-3">
                         {[1,2,3].map(i => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                               <div className="h-12 w-12 rounded-lg bg-slate-800"></div>
                               <div className="flex-1">
                                  <div className="h-3 w-24 bg-white/10 rounded mb-2"></div>
                                  <div className="h-2 w-16 bg-white/5 rounded"></div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Floating Badge */}
                   <motion.div 
                     animate={{ y: [0, -15, 0] }}
                     transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                     className="absolute -bottom-8 -left-12 bg-slate-800/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/10 flex items-center gap-4"
                   >
                     <div className="bg-green-500/20 p-3 rounded-xl text-green-400">
                       <Check size={24} />
                     </div>
                     <div>
                       <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Status</p>
                       <p className="font-bold text-white text-lg">Confirmed</p>
                     </div>
                   </motion.div>
                </div>
             </div>
             
             {/* Background Blob */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ValueProps = () => {
  const props = [
    { icon: <Clock className="w-5 h-5 lg:w-6 lg:h-6" />, title: "Instant Booking", desc: "Real-time slots. No more waiting." },
    { icon: <CreditCard className="w-5 h-5 lg:w-6 lg:h-6" />, title: "UPI Payments", desc: "Safe, direct payments to your barber." },
    { icon: <Sparkles className="w-5 h-5 lg:w-6 lg:h-6" />, title: "Festival Promos", desc: "Local offers that save you money." },
    { icon: <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6" />, title: "Verified Shops", desc: "Trusted barbers with real ratings." },
  ];

  return (
    <section id="features" className="py-1 lg:py-24 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
        >
          {props.map((prop, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              whileHover={{ y: -8 }}
              className="bg-slate-950 p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                 <div className="w-10 h-10 lg:w-14 lg:h-14 bg-indigo-500/10 rounded-xl lg:rounded-2xl flex items-center justify-center text-indigo-400 mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                   {prop.icon}
                 </div>
                 <h3 className="text-md lg:text-xl font-bold text-white mb-2 lg:mb-3">{prop.title}</h3>
                 <p className="text-slate-400 leading-relaxed text-xs lg:text-base">{prop.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const SearchTeaser = () => {
  const navigate = useNavigate();
  const [locationQuery, setLocationQuery] = useState('');
  const [serviceQuery, setServiceQuery] = useState('');
  const [popularServices, setPopularServices] = useState(['Near Me', 'Haircut', 'Beard Trim', 'Facial', 'Kid\'s Cut']);

  // Fetch popular services on component mount
  useEffect(() => {
    const fetchPopularServices = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/shop/all`);
        if (Array.isArray(res.data)) {
          // Extract all unique service names from all shops
          const allServices = new Set();
          res.data.forEach(shop => {
            if (shop.services && Array.isArray(shop.services)) {
              shop.services.forEach(service => {
                if (service.name && service.name.trim()) {
                  allServices.add(service.name.trim());
                }
              });
            }
          });

          // Convert to array and shuffle, then take first 5
          const servicesArray = Array.from(allServices);
          const shuffled = servicesArray.sort(() => 0.5 - Math.random());
          const selectedServices = shuffled.slice(0, 5);

          // If we don't have enough services, supplement with defaults
          while (selectedServices.length < 5) {
            const defaults = ['Haircut', 'Beard Trim', 'Facial', 'Kid\'s Cut', 'Massage'];
            const nextDefault = defaults.find(d => !selectedServices.includes(d));
            if (nextDefault) selectedServices.push(nextDefault);
            else break;
          }

          setPopularServices(selectedServices);
        }
      } catch (err) {
        console.error("Failed to fetch popular services", err);
        // Keep default services if API fails
      }
    };

    fetchPopularServices();
  }, []);

  const handleSearch = () => {
    // Navigate to all services search with query parameters
    const params = new URLSearchParams();
    if (locationQuery.trim()) params.append('location', locationQuery.trim());
    if (serviceQuery.trim()) params.append('service', serviceQuery.trim());

    const queryString = params.toString();
    navigate(`/all-services-search${queryString ? `?${queryString}` : ''}`);
  };

  const handleTagClick = (tag) => {
    // Navigate with the tag as a service search
    navigate(`/all-services-search?service=${encodeURIComponent(tag)}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="py-6 lg:py-8 px-4 relative z-20">
      <div className="max-w-4xl mx-auto bg-slate-900/80 backdrop-blur-xl rounded-2xl lg:rounded-[2rem] shadow-2xl p-4 lg:p-6 border border-white/10 transform -translate-y-6 lg:-translate-y-32">
        <div className="flex flex-col md:flex-row gap-3 lg:gap-4">
          <div className="flex-1 relative group">
            <MapPin className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors w-4 h-4 lg:w-5 lg:h-5" />
            <input
              type="text"
              placeholder="Detect location or type area..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 lg:py-4 bg-slate-950 border border-white/10 rounded-xl lg:rounded-2xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500 transition-all text-sm lg:text-base"
            />
          </div>
          <div className="hidden md:flex flex-1 relative group">
            <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors w-4 h-4 lg:w-5 lg:h-5" />
            <input
              type="text"
              placeholder="Haircut, Shave, Massage..."
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 lg:py-4 bg-slate-950 border border-white/10 rounded-xl lg:rounded-2xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500 transition-all text-sm lg:text-base"
            />
          </div>
          <button
             onClick={handleSearch}
             className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 lg:px-10 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 text-sm lg:text-base"
          >
            Find
          </button>
        </div>

        <div className="mt-4 lg:mt-6 flex flex-wrap gap-2 justify-center md:justify-start">
          <span className="text-xs lg:text-sm font-medium text-slate-500 mr-1 lg:mr-2 py-1">Popular:</span>
          {popularServices.slice(0, 4).map(tag => (
            <button
               key={tag}
               onClick={() => handleTagClick(tag)}
               className="px-3 lg:px-4 py-1 lg:py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-full text-xs lg:text-sm font-medium transition-colors border border-white/5"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

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
    navigate('/booking-appointment', {
       state: {
          barberData: {
             id: barber.id,
             name: barber.name,
             image: barber.img,
             address: barber.address || 'Local Shop', // Fallback address
             rating: barber.rating,
             owner: { _id: `owner_${barber.id}` } // Mock owner ID if not present in fallback
          }
       }
    });
 };

  if (loading) {
    return (
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-3xl font-extrabold text-white mb-2">Featured Barbers</p>
              <p className="text-slate-400 ">Top rated grooming experts near you</p>
            </div>
          </div>
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[300px] bg-slate-900 rounded-3xl border border-white/5 animate-pulse h-80"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-slate-950 relative overflow-hidden">
       {/* Background glow */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center md:text-left md:flex md:justify-between md:items-end mb-8 lg:mb-12">
          <div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-2 lg:mb-2">Featured Barbers</h2>
            <p className="text-slate-400 text-sm lg:text-[18px] leading-relaxed">Top rated grooming experts near you with the top Ratings</p>
          </div>
          <button
            onClick={() => navigate('/all-services-search')}
            className="hidden md:flex items-center text-indigo-400 font-bold hover:gap-2 transition-all hover:text-indigo-300 mt-4 md:mt-0"
          >
            View All <ChevronRight size={20} />
          </button>
        </div>

        {error && (
          <div className="text-center py-8 bg-red-500/10 rounded-2xl border border-red-500/20">
            <p className="text-red-400 mb-0">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map((barber) => (
            <motion.div
              key={barber.id}
              whileHover={{ y: -10 }}
              className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/5 group relative"
            >
              <div className="h-56 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                <img 
                   src={barber.img} 
                   alt={barber.name} 
                   className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                />
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                   {barber.verified && (
                      <span className="bg-blue-600/90 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                         <ShieldCheck size={12} /> Verified
                      </span>
                   )}
                </div>
              </div>
              
              <div className="p-6 relative z-20 -mt-12">
                 <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg mb-3 backdrop-blur-md">
                    <Star size={12} className="text-amber-400" fill="currentColor" />
                    <span className="text-amber-200 font-bold text-xs">{barber.rating?.toFixed(1) || '0.0'}</span>
                 </div>

                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[18px]  text-white leading-tight">{barber.name}</h3>
                </div>
                
                <div className="flex items-center gap-4 text-[13px] text-slate-400 mb-4">
                   <div className="text-slate-300 font-medium">Starts ₹{barber.price || 150}</div>
                </div>

                <button 
                  onClick={() => handleBook(barber)}
                  className="w-full bg-white/5 hover:bg-indigo-600 text-white border border-white/10 hover:border-indigo-500 px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group/btn"
                >
                  Book Appointment <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AITeaser = () => {
  return (
    <section className="py-10 lg:py-24 bg-slate-950 relative overflow-hidden">
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] lg:bg-[size:32px_32px]"></div>

      {/* Spotlight */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] lg:w-[800px] lg:h-[800px] bg-indigo-600/10 rounded-full blur-[80px] lg:blur-[120px] translate-x-1/2 -translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 rounded-full text-indigo-300 text-xs lg:text-sm font-medium mb-4 lg:mb-6">
              <Sparkles size={12} className="animate-pulse" /> Beta Access
            </div>
            <h2 className="text-2xl lg:text-5xl font-extrabold text-white mb-4 lg:mb-6 leading-tight">
              Not sure what style <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">suits you best?</span>
            </h2>
            <p className="text-slate-400 text-sm lg:text-lg mb-6 lg:mb-8 max-w-md leading-relaxed">
              Try our <strong>AI Style Suggestor</strong>. Upload a photo and get personalized haircut ideas based on your face shape analysis.
            </p>
          </div>

          <div className="relative mt-8 lg:mt-0">
            {/* Cyberpunk Card */}
            <div className="aspect-square rounded-2xl lg:rounded-[2.5rem] bg-slate-900 border border-white/10 relative overflow-hidden flex items-center justify-center shadow-2xl max-w-sm mx-auto lg:max-w-none">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>

              {/* Scan Line Animation */}
              <div className="absolute w-full h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)] top-0 animate-[scan_3s_ease-in-out_infinite]"></div>

              {/* HUD Overlay */}
              <div className="absolute inset-0 border-[15px] lg:border-[20px] border-slate-950/50"></div>
              <div className="absolute top-6 lg:top-8 right-6 lg:right-8 flex gap-1">
                 <div className="w-1 h-1 bg-red-500 rounded-full animate-ping"></div>
                 <div className="w-1 h-1 bg-red-500 rounded-full"></div>
              </div>

              <div className="relative z-10 bg-slate-950/80 backdrop-blur-md p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-white/10 text-center transform translate-y-16 lg:translate-y-20">
                <div className="flex items-center justify-center gap-2 text-indigo-400 text-xs font-mono mb-2 uppercase tracking-widest">
                   <Activity size={12} /> Analysis Complete
                </div>
                <p className="text-xl lg:text-2xl font-bold text-white mb-1">Fade Cut</p>
                <p className="text-slate-400 text-xs">Confidence Score: 98%</p>
              </div>
            </div>

            {/* Background Decor */}
            <div className="absolute -bottom-6 lg:-bottom-10 -right-6 lg:-right-10 w-24 h-24 lg:w-40 lg:h-40 bg-purple-500/20 rounded-full blur-2xl lg:blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

const BarberOnboarding = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Version */}
      <section className="md:hidden py-16 bg-slate-950 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-slate-900 to-slate-900"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">
               Partner Program
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
              Own a barber shop?
            </h2>
            <p className="text-slate-300 text-base font-medium leading-relaxed max-w-md mx-auto">
              List your shop on GlossCut in 5 minutes. Get more bookings, reduce no-shows, and manage payments easily.
            </p>
          </div>

          {/* Benefits List */}
          <div className="mb-8">
            <ul className="space-y-3">
              {['Zero listing fees', 'Instant daily payouts', 'Advanced customer analytics'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white font-medium text-sm">
                  <div className="p-1 rounded-full bg-amber-500 text-slate-900 flex-shrink-0">
                     <Check size={10} strokeWidth={4} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-800/60 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/10 text-center">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 mb-2 mx-auto">
                 <TrendingUp size={16} />
              </div>
              <h4 className="text-slate-400 text-xs uppercase font-bold mb-1">Revenue</h4>
              <p className="text-xl font-bold text-white">₹8,450</p>
              <p className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1">
                 <ArrowRight size={8} className="-rotate-45" /> +12%
              </p>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/10 text-center">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 mb-2 mx-auto">
                 <Calendar size={16} />
              </div>
              <h4 className="text-slate-400 text-xs uppercase font-bold mb-1">Bookings</h4>
              <p className="text-xl font-bold text-white">24</p>
              <p className="text-slate-400 text-xs">Today</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={() => navigate('/barber-account-creation')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-4 rounded-2xl font-bold text-[14px] hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              Start Partner Registration
            </button>
          </div>
        </div>
      </section>

      {/* Desktop Version */}
      <section className="hidden md:block py-16 lg:py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl lg:rounded-[3rem] p-6 lg:p-8 xl:p-20 overflow-hidden group">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-slate-900 to-slate-900 border border-amber-500/20"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

            {/* Content */}
            <div className="relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div>
                <div className="inline-block px-3 lg:px-4 py-1 lg:py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-4 lg:mb-6">
                   Partner Program
                </div>
                <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 lg:mb-6">
                  Own a barber shop?
                </h2>
                <p className="text-slate-300 text-base lg:text-lg mb-6 lg:mb-10 font-medium leading-relaxed">
                  List your shop on GlossCut in 5 minutes. Get more bookings, reduce no-shows, and manage payments easily with our pro dashboard.
                </p>

                <ul className="space-y-3 lg:space-y-4 mb-6 lg:mb-10">
                  {['Zero listing fees', 'Instant daily payouts', 'Advanced customer analytics'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 lg:gap-3 text-white font-medium text-sm lg:text-base">
                      <div className="p-1 rounded-full bg-amber-500 text-slate-900">
                         <Check size={10} strokeWidth={4} />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/barber-account-creation')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-6 lg:px-10 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] lg:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                >
                  Start Partner Registration
                </button>
              </div>

              <div className="hidden lg:block relative">
                {/* Floating Cards */}
                <div className="relative z-10 grid grid-cols-2 gap-6">
                  <div className="bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/10 transform translate-y-12">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-4">
                       <TrendingUp size={20} />
                    </div>
                    <h4 className="text-slate-400 text-xs uppercase font-bold mb-1">Today's Revenue</h4>
                    <p className="text-3xl font-bold text-white">₹8,450</p>
                    <p className="text-emerald-400 text-xs font-bold mt-2 flex items-center gap-1">
                       <ArrowRight size={10} className="-rotate-45" /> +12% vs last week
                    </p>
                  </div>

                  <div className="bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/10">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-4">
                       <Calendar size={20} />
                    </div>
                    <h4 className="text-slate-400 text-xs uppercase font-bold mb-1">Appointments</h4>
                    <p className="text-3xl font-bold text-white">24</p>
                    <p className="text-slate-400 text-xs mt-2">4 slots remaining</p>
                  </div>
                </div>

                {/* Back Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-amber-500/10 blur-3xl rounded-full -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-16 lg:py-24 bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl lg:text-3xl font-extrabold text-white text-center mb-8 lg:mb-12">Frequently Asked Questions</h2>
        <div className="space-y-3 lg:space-y-4">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="border border-white/5 rounded-xl lg:rounded-2xl overflow-hidden bg-slate-900/30">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex justify-between items-center p-4 lg:p-6 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-bold text-slate-200 text-sm lg:text-base pr-2">{faq.q}</span>
                <ChevronDown className={`text-slate-500 transform transition-transform duration-300 flex-shrink-0 ${openIndex === idx ? 'rotate-180 text-white' : ''}`} size={16}  />
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 lg:p-6 pt-0 text-slate-400 leading-relaxed border-t border-white/5 text-sm lg:text-base">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Main Page Component ---

function HomeScreen() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-indigo-500/30">
      <main>
        <Hero />
        <div className="relative -mt-20 z-20">
          <SearchTeaser />
        </div>
        <ValueProps />
        <FeaturedBarbers />
        <AITeaser />
        <BarberOnboarding />
        <FAQ />
      </main>
    </div>
  );
}

export default HomeScreen;
