import { useState, useEffect, memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CreditCard, Star,
  MapPin, ChevronDown, ChevronRight, Smartphone,
  ShieldCheck, Clock, Sparkles, Check, Zap, ArrowRight,
  LayoutDashboard,
  Wallet, Store, MapPinned, Flame, Tag, Users, Scissors
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

// Lazy loaded components for better performance
const LazyFeaturedBarbers = lazy(() => import('./FeaturedBarbers').catch(() => ({ default: () => <div>Loading...</div> })));

// --- OPTIMIZED HERO COMPONENT ---
const Hero = memo(() => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-40 overflow-hidden bg-neutral-950">
      {/* Simplified Background - Barber Theme (Dark & Gold) */}
      <div className="absolute inset-0 bg-[#050505] pointer-events-none">
         {/* Static gradient backgrounds - shifted to warm tones */}
         <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-b from-amber-900/10 via-transparent to-transparent opacity-60"></div>
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Text Content */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Live Badge - Styled like a shop open sign */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-900/80 border border-amber-500/30 mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <div className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></div>
              </div>
              <span className="text-amber-100/80 text-xs lg:text-sm font-semibold tracking-wide uppercase">
                Live in <span className="text-amber-400 font-bold">Amravati & Nagpur</span>
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6 lg:mb-8 font-serif">
              Book your barber <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-600 drop-shadow-sm">
                in seconds.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-zinc-400 mb-8 lg:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              GlossCut makes grooming easy. Search nearby shops, pick a slot, and pay via UPI — <span className="text-zinc-200 border-b border-amber-500/50">check your spot in lines.</span>
            </p>

            {/* Buttons & Social Proof */}
            <div className="flex flex-col items-center lg:items-start w-full">
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-8">
                <button className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-600 to-amber-500 text-black px-8 py-4 rounded-xl font-bold text-lg hover:from-amber-500 hover:to-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] w-full sm:w-auto active:scale-95">
                  <Smartphone className="w-5 h-5 fill-black" />
                  <span>Download App</span>
                </button>

                <button
                  onClick={() => navigate('/barber-account-creation')}
                  className="flex items-center justify-center gap-3 bg-zinc-900/80 text-white border border-zinc-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-zinc-800 hover:border-zinc-500 transition-all w-full sm:w-auto"
                >
                  List Your Shop
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4 bg-zinc-900/40 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="flex -space-x-3">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center overflow-hidden grayscale hover:grayscale-0 transition-all">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                     </div>
                   ))}
                </div>
                <div className="text-sm">
                   <div className="flex items-center gap-1">
                      <div className="flex text-amber-500"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/></div>
                      <span className="font-bold text-white">4.9/5</span>
                   </div>
                   <p className="text-zinc-500">from 10k+ users</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Visual - Barber App Mockup */}
          <div className="relative hidden lg:block">
             <div className="relative mx-auto max-w-sm perspective-1000">
                {/* Decorative Ring */}
                <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full transform scale-90 translate-y-10"></div>

                {/* Main Card / Phone Mockup - Darker, sleeker */}
                <div className="bg-zinc-950 rounded-[2.5rem] p-4 border-[6px] border-zinc-800 shadow-2xl relative z-10">
                   {/* Screen Content */}
                   <div className="pt-8 pb-4 px-3 space-y-4 h-[500px] overflow-hidden rounded-[1.8rem] bg-neutral-900 relative">
                      
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-zinc-950 rounded-b-xl z-20"></div>

                      {/* App Header */}
                      <div className="flex justify-between items-center px-2 mt-2">
                         <div>
                            <p className="text-xs text-zinc-400">Welcome back,</p>
                            <h3 className="text-white font-bold text-lg font-serif tracking-wide">Aditya</h3>
                         </div>
                         <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <Users size={20} />
                         </div>
                      </div>

                      {/* Active Appointment Card - The "Ticket" look */}
                      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-4 shadow-lg border-l-4 border-amber-500 relative overflow-hidden group">
                         {/* Barber Pole Texture */}
                         <div className="absolute top-0 right-0 w-20 h-20 opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]"></div>
                         
                         <div className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-sm inline-block mb-2 uppercase tracking-wider">Upcoming</div>
                         <h3 className="text-white font-bold text-lg">Fade & Beard Trim</h3>
                         <p className="text-zinc-400 text-sm">Today, 5:00 PM</p>
                         <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                            <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
                               <MapPin size={12} className="text-amber-500" />
                            </div>
                            <p className="text-xs text-zinc-300">Urban Cuts</p>
                         </div>
                      </div>

                      {/* Nearby List */}
                      <div className="space-y-3">
                         <div className="flex justify-between items-center px-1">
                            <h4 className="text-white font-bold text-sm">Nearby Shops</h4>
                            <span className="text-amber-500 text-xs font-medium">See all</span>
                         </div>
                         {[1,2].map(i => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                               <div className="h-12 w-12 rounded-lg bg-zinc-800 relative overflow-hidden">
                                  <img src={`https://images.unsplash.com/photo-${i === 1 ? '1585747860715-2ba37e788b70' : '1503951914875-452162b7f30a'}?w=200&q=80`} className="object-cover w-full h-full grayscale-[0.3]" alt="shop" />
                               </div>
                               <div className="flex-1">
                                  <h5 className="text-white font-bold text-sm">The Grooming Co.</h5>
                                  <div className="flex items-center gap-2 mt-1">
                                     <Star size={10} className="text-amber-500 fill-amber-500" />
                                     <span className="text-xs text-zinc-400">4.8 • 1.2km</span>
                                  </div>
                               </div>
                               <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black">
                                  <ChevronRight size={14} />
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Floating elements - Updated Colors */}
                <div className="absolute top-16 -right-8 bg-zinc-900 p-3 rounded-xl shadow-2xl border border-zinc-700/50">
                  <div className="bg-green-900/30 p-1.5 rounded-lg text-green-400 w-fit mb-1 border border-green-500/20">
                    <Check size={16} />
                  </div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Payment Success</p>
                </div>

                <div className="absolute bottom-20 -left-8 bg-zinc-900 p-3 rounded-xl shadow-2xl border border-zinc-700/50">
                   <div className="bg-amber-900/30 p-1.5 rounded-lg text-amber-400 w-fit mb-1 border border-amber-500/20">
                     <Clock size={16} />
                   </div>
                   <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">45 mins saved</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
});

const ValueProps = memo(() => {
  const props = [
    { 
      icon: <Clock className="w-6 h-6 text-amber-500" />, 
      title: "Instant Booking", 
      desc: "Real-time slots. No more waiting.",
      gradient: "from-amber-500/10 to-orange-500/10",
      border: "group-hover:border-amber-500/50"
    },
    { 
      icon: <CreditCard className="w-6 h-6 text-zinc-300" />, 
      title: "UPI Payments", 
      desc: "Safe, direct payments to your barber.",
      gradient: "from-zinc-500/10 to-slate-500/10",
      border: "group-hover:border-zinc-500/50"
    },
    { 
      icon: <Tag className="w-6 h-6 text-amber-500" />, 
      title: "Festival Promos", 
      desc: "Local offers that save you money.",
      gradient: "from-amber-500/10 to-yellow-500/10",
      border: "group-hover:border-amber-500/50"
    },
    { 
      icon: <ShieldCheck className="w-6 h-6 text-zinc-300" />, 
      title: "Verified Shops", 
      desc: "Trusted barbers with real ratings.",
      gradient: "from-zinc-500/10 to-slate-500/10",
      border: "group-hover:border-zinc-500/50"
    },
  ];

  return (
    <section id="features" className="py-12 lg:py-20 relative z-10 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {props.map((prop, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              className={`group relative bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 lg:p-8 overflow-hidden hover:bg-zinc-900/80 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 ${prop.border}`}
            >
              {/* Hover Glow Background */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${prop.gradient} blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full -mr-10 -mt-10 pointer-events-none`}></div>

              <div className="relative z-10">
                 <div className={`w-14 h-14 rounded-xl bg-zinc-950 flex items-center justify-center mb-6 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                   {prop.icon}
                 </div>
                 
                 <h3 className="text-xl font-bold text-white mb-3 font-serif tracking-wide">{prop.title}</h3>
                 <p className="text-zinc-400 text-sm leading-relaxed">{prop.desc}</p>
              </div>

              {/* Decorative Corner Line - Barber Sharpness */}
              <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[20px] border-r-[20px] border-b-transparent border-r-white/5 group-hover:border-r-amber-500/20 transition-all duration-300"></div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});


const SearchTeaser = memo(() => {
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
      <div className="max-w-4xl mx-auto bg-zinc-900/90 backdrop-blur-xl rounded-xl lg:rounded-2xl shadow-2xl p-4 lg:p-6 border border-zinc-700/50 transform -translate-y-6 lg:-translate-y-32 ring-1 ring-black/20">
        <div className="flex flex-col md:flex-row gap-3 lg:gap-4">
          <div className="flex-1 relative group">
            <MapPin className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors w-4 h-4 lg:w-5 lg:h-5" />
            <input
              type="text"
              placeholder="Detect location or type area..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 lg:py-4 bg-black/50 border border-zinc-700 rounded-lg lg:rounded-xl focus:outline-none focus:border-amber-500 text-white placeholder-zinc-500 transition-all text-sm lg:text-base focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
          <div className="hidden md:flex flex-1 relative group">
            <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors w-4 h-4 lg:w-5 lg:h-5" />
            <input
              type="text"
              placeholder="Haircut, Shave, Massage..."
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 lg:py-4 bg-black/50 border border-zinc-700 rounded-lg lg:rounded-xl focus:outline-none focus:border-amber-500 text-white placeholder-zinc-500 transition-all text-sm lg:text-base focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
          <button
              onClick={handleSearch}
              className="bg-amber-600 hover:bg-amber-500 text-black px-8 lg:px-10 py-3 lg:py-4 rounded-lg lg:rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-sm lg:text-base uppercase tracking-wider"
          >
            Find
          </button>
        </div>

        <div className="mt-4 lg:mt-6 flex flex-wrap gap-2 justify-center md:justify-start items-center">
          <span className="text-xs lg:text-sm font-semibold text-zinc-500 mr-1 lg:mr-2 py-1 uppercase tracking-wider">Popular:</span>
          {popularServices.slice(0, 4).map(tag => (
            <button
               key={tag}
               onClick={() => handleTagClick(tag)}
               className="px-3 lg:px-4 py-1 lg:py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-md text-xs lg:text-sm font-medium transition-colors border border-zinc-700 hover:border-zinc-500"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

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
      <section className="py-20 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-3xl font-extrabold text-white mb-2">Featured Barbers</p>
              <p className="text-zinc-400 ">Top rated grooming experts near you</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900 rounded-2xl border border-white/5 animate-pulse h-[28rem]"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-neutral-950 relative overflow-hidden">
       {/* Background glow - Gold/Warm */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-amber-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-500 font-bold tracking-wider text-xs uppercase mb-2">
               <Flame size={14} className="fill-amber-500" /> Top Rated
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white font-serif">Featured Barbers</h2>
            <p className="text-zinc-400 text-sm lg:text-base mt-2 max-w-lg">
               Premium grooming experts in your area with the highest customer ratings.
            </p>
          </div>
           
          <button
            onClick={() => navigate('/all-services-search')}
            className="hidden md:flex items-center text-white bg-zinc-800 hover:bg-zinc-700 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border border-zinc-700"
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
              className="group bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl hover:shadow-2xl hover:shadow-amber-900/10 transition-all duration-300"
            >
              {/* Image Container */}
              <div className="relative h-60 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent z-10"></div>
                
                <img 
                   src={barber.img} 
                   alt={barber.name} 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out grayscale-[0.2] group-hover:grayscale-0" 
                />
                
                {/* Top Badges */}
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                   <div className="bg-zinc-900/90 backdrop-blur-md text-amber-500 text-xs font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1 border border-amber-500/20 shadow-lg">
                      <Star size={12} fill="currentColor" /> {barber.rating?.toFixed(1) || '4.5'}
                   </div>
                </div>

                <div className="absolute top-4 right-4 z-20">
                   {barber.verified && (
                      <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-zinc-900" title="Verified Barber">
                         <ShieldCheck size={14} fill="currentColor" className="text-white" />
                      </div>
                   )}
                </div>
              </div>
              
              {/* Card Content */}
              <div className="p-6 pt-2 relative z-20 -mt-12">
                <div className="bg-zinc-800/80 backdrop-blur-xl border border-white/5 p-5 rounded-xl shadow-lg">
                   {/* Header Info */}
                   <div className="mb-4 border-b border-white/5 pb-4">
                      <h3 className="font-bold text-xl text-white mb-1 leading-tight truncate font-serif">{barber.name}</h3>
                      <div className="flex items-center text-zinc-400 text-xs">
                         <MapPinned size={12} className="mr-1" />
                         <span className="truncate max-w-[150px]">{barber.address || 'Local Shop'}</span>
                         <span className="mx-2 text-zinc-600">•</span>
                         <span className="text-amber-500 font-medium">{barber.distance || '1.2 km'}</span>
                      </div>
                   </div>

                   {/* Pricing & Action */}
                   <div className="flex items-center justify-between gap-3 pt-1">
                      <div>
                         <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Starting from</p>
                         <p className="text-white font-bold text-lg">₹{barber.price || 150}</p>
                      </div>
                      
                      <button 
                        onClick={() => handleBook(barber)}
                        className="bg-amber-600 hover:bg-amber-500 text-black px-5 py-3 rounded-lg text-sm font-bold transition-all shadow-lg shadow-amber-900/20 hover:shadow-amber-500/30 flex items-center gap-2"
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
               className="inline-flex items-center text-amber-500 font-bold hover:text-amber-400 transition-colors"
            >
               View All Barbers <ChevronRight size={16} />
            </button>
        </div>
      </div>
    </section>
  );
};



const BarberOnboarding = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 lg:py-32 bg-neutral-950 relative overflow-hidden">
      {/* Background Decor - Leather/Wood Tones */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,53,15,0.1),transparent_40%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative bg-gradient-to-b from-zinc-900 to-black rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl">
          
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-0">
            
            {/* Left Content Side */}
            <div className="p-8 lg:p-16 flex flex-col justify-center relative z-20">
              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full text-amber-500 text-xs font-bold uppercase tracking-widest mb-6 w-fit">
                   <Store size={14} /> Partner Program
                </div>
                
                <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight font-serif">
                  Own a barber shop?
                </h2>
                
                <p className="text-zinc-400 text-lg mb-8 leading-relaxed max-w-md">
                  List your shop on GlossCut in 5 minutes. Get more bookings, reduce no-shows, and manage payments easily with our pro dashboard.
                </p>

                <ul className="space-y-4 mb-10">
                  {[
                    { text: 'Zero listing fees', icon: <Zap size={18} className="text-amber-500" /> },
                    { text: 'Instant daily payouts', icon: <Wallet size={18} className="text-amber-500" /> },
                    { text: 'Advanced customer analytics', icon: <LayoutDashboard size={18} className="text-amber-500" /> }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-zinc-200 font-medium text-lg group">
                      <div className="w-10 h-10 rounded-full bg-zinc-800/50 border border-white/10 flex items-center justify-center group-hover:border-amber-500/50 transition-colors">
                         {item.icon}
                      </div>
                      {item.text}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/barber-account-creation')}
                  className="bg-amber-600 hover:bg-amber-500 text-black px-8 py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  Start Partner Registration <ArrowRight size={20} />
                </button>
              </motion.div>
            </div>

            {/* Right Visual Side - The "Dashboard" */}
            <div className="relative min-h-[400px] lg:min-h-auto bg-zinc-900/30 lg:border-l border-zinc-800 overflow-hidden flex items-center justify-center p-8 lg:p-0">
               
               {/* Background Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-900/20 rounded-full blur-[80px]"></div>

               {/* 3D Tilted Dashboard Card */}
               <motion.div 
                 initial={{ opacity: 0, rotateY: 15, rotateX: 5 }}
                 whileInView={{ opacity: 1, rotateY: -12, rotateX: 5 }}
                 viewport={{ once: true }}
                 transition={{ duration: 1, ease: "easeOut" }}
                 className="relative w-full max-w-md perspective-1000 transform lg:translate-x-8"
               >
                  <div className="bg-zinc-950 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden relative">
                     {/* Dashboard Header */}
                     <div className="h-12 border-b border-zinc-800 flex items-center px-4 gap-2 bg-zinc-900">
                        <div className="flex gap-1.5">
                           <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                           <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                           <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <div className="ml-auto text-[10px] text-zinc-500 font-mono">dashboard.glosscut.pro</div>
                     </div>

                     {/* Dashboard Content */}
                     <div className="p-6 space-y-6">
                        {/* Total Revenue Widget */}
                        <div className="space-y-2">
                           <div className="flex justify-between items-end">
                              <div>
                                 <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                                 <h3 className="text-3xl font-bold text-white mt-1">₹24,500</h3>
                              </div>
                              <div className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                                 +12.5%
                              </div>
                           </div>
                           {/* Fake Graph */}
                           <div className="h-16 flex items-end gap-1">
                              {[40, 60, 45, 70, 65, 85, 80].map((h, i) => (
                                 <div key={i} className="flex-1 bg-amber-900/30 rounded-t-sm relative group" style={{ height: `${h}%` }}>
                                    <div className="absolute bottom-0 w-full bg-amber-600 rounded-t-sm transition-all duration-500" style={{ height: i === 6 ? '100%' : '0%' }}></div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Recent Activity List */}
                        <div className="space-y-3">
                           <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Live Activity</p>
                           {[
                              { name: 'Rahul S.', action: 'Booked Haircut', time: '2m ago', amt: '+₹250' },
                              { name: 'Amit K.', action: 'Completed', time: '15m ago', amt: '+₹450' }
                           ].map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                                       {item.name[0]}
                                    </div>
                                    <div>
                                       <p className="text-sm text-white font-medium">{item.name}</p>
                                       <p className="text-xs text-zinc-500">{item.action}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-sm text-emerald-400 font-bold">{item.amt}</p>
                                    <p className="text-[10px] text-zinc-600">{item.time}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Floating Notification */}
                  <motion.div 
                     initial={{ x: 20, opacity: 0 }}
                     whileInView={{ x: -20, opacity: 1 }}
                     transition={{ delay: 0.5 }}
                     className="absolute -left-8 top-12 bg-zinc-800 p-4 rounded-xl border border-zinc-700 shadow-xl flex gap-3 items-center z-30"
                  >
                     <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <Wallet size={20} />
                     </div>
                     <div>
                        <p className="text-xs text-zinc-400 font-bold uppercase">Payout Processed</p>
                        <p className="text-white font-bold">₹8,240.00</p>
                     </div>
                  </motion.div>
               </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-16 lg:py-24 bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl lg:text-3xl font-extrabold text-white text-center mb-8 lg:mb-12 font-serif">Frequently Asked Questions</h2>
        <div className="space-y-3 lg:space-y-4">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex justify-between items-center p-4 lg:p-6 text-left hover:bg-zinc-800 transition-colors"
              >
                <span className="font-bold text-zinc-200 text-sm lg:text-base pr-2">{faq.q}</span>
                <ChevronDown className={`text-zinc-500 transform transition-transform duration-300 flex-shrink-0 ${openIndex === idx ? 'rotate-180 text-amber-500' : ''}`} size={16}  />
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 lg:p-6 pt-0 text-zinc-400 leading-relaxed border-t border-zinc-800 text-sm lg:text-base">
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
    <div className="min-h-screen bg-neutral-950 font-sans text-zinc-200 selection:bg-amber-500/30">
      <main>
        <Hero />
        <div className="relative -mt-20 z-20">
          <SearchTeaser />
        </div>
        <ValueProps />
        <Suspense fallback={<div className="py-20 bg-neutral-950 flex justify-center"><div className="animate-pulse text-zinc-400">Loading featured barbers...</div></div>}>
          <LazyFeaturedBarbers />
        </Suspense>
        <BarberOnboarding />
        <FAQ />
      </main>
    </div>
  );
}

export default HomeScreen;
