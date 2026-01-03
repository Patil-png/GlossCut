import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CreditCard, Star,
  MapPin, ChevronDown, ChevronRight, Smartphone,
  ShieldCheck, Clock, Sparkles, Check, Zap, ArrowRight,
  ScanFace, Wand2, LayoutDashboard,
  Wallet, Store, MapPinned, Flame, Tag, Users
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

// --- UPDATED HERO COMPONENT ---
const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-32 lg:pt-40 lg:pb-60 overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-slate-950 pointer-events-none">
         {/* Animated Aurora Gradients */}
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
         <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite]" />
         <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
         
         {/* Grid Texture */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Text Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center lg:text-left flex flex-col items-center lg:items-start"
          >
            {/* Live Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/50 border border-indigo-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.2)] mb-8 group cursor-default transition-all hover:border-indigo-500/50">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-indigo-200 text-xs lg:text-sm font-semibold tracking-wide">
                Live in <span className="text-white">Pune, Nagpur & Mumbai</span>
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6 lg:mb-8">
              Book your barber <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">
                in seconds.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p variants={fadeInUp} className="text-lg lg:text-xl text-slate-400 mb-8 lg:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              GlossCut makes grooming easy. Search nearby shops, pick a slot, and pay via UPI — <span className="text-slate-200">no waiting in lines.</span>
            </motion.p>

            {/* Buttons & Social Proof */}
            <motion.div variants={fadeInUp} className="flex flex-col items-center lg:items-start w-full">
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-8">
                <button className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-500 transition-all shadow-[0_4px_20px_rgba(79,70,229,0.4)] hover:shadow-[0_6px_25px_rgba(79,70,229,0.6)] hover:-translate-y-1 w-full sm:w-auto group">
                  <Smartphone className="w-5 h-5 group-hover:animate-bounce" />
                  <span>Download App</span>
                </button>
                
                <button
                  onClick={() => navigate('/barber-account-creation')}
                  className="flex items-center justify-center gap-3 bg-slate-900/80 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-md w-full sm:w-auto"
                >
                  List Your Shop
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                     </div>
                   ))}
                </div>
                <div className="text-sm">
                   <div className="flex items-center gap-1">
                      <div className="flex text-amber-400"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/></div>
                      <span className="font-bold text-white">4.9/5</span>
                   </div>
                   <p className="text-slate-500">from 10k+ users</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side Visual - Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative hidden lg:block"
          >
             <div className="relative z-10 transform perspective-1000 rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out">
                
                {/* Main Card / Phone Mockup */}
                <div className="relative bg-slate-900/90 backdrop-blur-2xl rounded-[3rem] p-6 max-w-sm mx-auto border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
                   
                   {/* Notch */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-950 rounded-b-2xl z-20"></div>
                   
                   {/* Screen Content */}
                   <div className="pt-8 pb-4 px-2 space-y-6 h-[500px] overflow-hidden relative rounded-2xl bg-slate-950">
                      {/* Status Bar Mock */}
                      <div className="flex justify-between items-center px-2 mb-2 opacity-50">
                         <div className="text-[10px] text-white">9:41</div>
                         <div className="flex gap-1">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                         </div>
                      </div>

                      {/* App Header */}
                      <div className="flex justify-between items-center px-2">
                         <div>
                            <p className="text-xs text-slate-400">Welcome back,</p>
                            <h3 className="text-white font-bold text-lg">Aditya</h3>
                         </div>
                         <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <Users size={20} />
                         </div>
                      </div>
                      
                      {/* Active Appointment Card */}
                      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-5 shadow-lg relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700"></div>
                         <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                               <div className="bg-white/20 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md inline-block mb-2">Upcoming</div>
                               <h3 className="text-white font-bold text-xl">Fade & Beard Trim</h3>
                               <p className="text-indigo-100 text-sm">Today, 5:00 PM</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3 relative z-10">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                               <MapPin size={14} className="text-white" />
                            </div>
                            <p className="text-xs text-indigo-100 font-medium">Urban Cuts, Koramangala</p>
                         </div>
                      </div>

                      {/* Nearby List */}
                      <div className="space-y-4">
                         <div className="flex justify-between items-center px-1">
                            <h4 className="text-white font-bold">Nearby Shops</h4>
                            <span className="text-indigo-400 text-xs">See all</span>
                         </div>
                         {[1,2,3].map(i => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                               <div className="h-14 w-14 rounded-xl bg-slate-800 relative overflow-hidden">
                                  <img src={`https://images.unsplash.com/photo-${i === 1 ? '1585747860715-2ba37e788b70' : i === 2 ? '1503951914875-452162b7f30a' : '1621605815971-fbc98d665033'}?w=200&q=80`} className="object-cover w-full h-full" alt="shop" />
                               </div>
                               <div className="flex-1">
                                  <h5 className="text-white font-bold text-sm">The Grooming Co.</h5>
                                  <div className="flex items-center gap-2 mt-1">
                                     <Star size={10} className="text-amber-400 fill-amber-400" />
                                     <span className="text-xs text-slate-400">4.8 • 1.2km</span>
                                  </div>
                               </div>
                               <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                  <ChevronRight size={16} />
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Floating Elements (Decorations) */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
                  className="absolute top-20 -right-12 bg-slate-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/10 z-20 flex gap-3 items-center"
                >
                   <div className="bg-green-500/20 p-2.5 rounded-xl text-green-400">
                     <Check size={20} />
                   </div>
                   <div>
                     <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Payment</p>
                     <p className="font-bold text-white text-sm">Successful</p>
                   </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  className="absolute bottom-32 -left-12 bg-slate-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/10 z-20 flex gap-3 items-center"
                >
                   <div className="bg-amber-500/20 p-2.5 rounded-xl text-amber-400">
                     <Clock size={20} />
                   </div>
                   <div>
                     <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Time Saved</p>
                     <p className="font-bold text-white text-sm">45 mins</p>
                   </div>
                </motion.div>

             </div>
             
             {/* Back Glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/20 rounded-full blur-[80px] -z-10"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ValueProps = () => {
  const props = [
    { 
      icon: <Clock className="w-6 h-6 text-blue-400" />, 
      title: "Instant Booking", 
      desc: "Real-time slots. No more waiting.",
      gradient: "from-blue-500/20 to-cyan-500/20",
      border: "group-hover:border-blue-500/50"
    },
    { 
      icon: <CreditCard className="w-6 h-6 text-purple-400" />, 
      title: "UPI Payments", 
      desc: "Safe, direct payments to your barber.",
      gradient: "from-purple-500/20 to-pink-500/20",
      border: "group-hover:border-purple-500/50"
    },
    { 
      icon: <Tag className="w-6 h-6 text-amber-400" />, 
      title: "Festival Promos", 
      desc: "Local offers that save you money.",
      gradient: "from-amber-500/20 to-orange-500/20",
      border: "group-hover:border-amber-500/50"
    },
    { 
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />, 
      title: "Verified Shops", 
      desc: "Trusted barbers with real ratings.",
      gradient: "from-emerald-500/20 to-green-500/20",
      border: "group-hover:border-emerald-500/50"
    },
  ];

  return (
    <section id="features" className="py-12 lg:py-20 relative z-10">
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
              className={`group relative bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 lg:p-8 overflow-hidden hover:bg-slate-800/60 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 ${prop.border}`}
            >
              {/* Hover Glow Background */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${prop.gradient} blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full -mr-10 -mt-10 pointer-events-none`}></div>

              <div className="relative z-10">
                 <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${prop.gradient} flex items-center justify-center mb-6 border border-white/5 shadow-inner`}>
                   {prop.icon}
                 </div>
                 
                 <h3 className="text-xl font-bold text-white mb-3">{prop.title}</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">{prop.desc}</p>
              </div>

              {/* Decorative Corner Line */}
              <div className="absolute bottom-6 right-6 w-8 h-1 bg-white/5 rounded-full group-hover:w-16 group-hover:bg-white/10 transition-all duration-300"></div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900 rounded-[2rem] border border-white/5 animate-pulse h-[28rem]"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-slate-950 relative overflow-hidden">
       {/* Background glow */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-400 font-bold tracking-wider text-xs uppercase mb-2">
               <Flame size={14} className="fill-indigo-400" /> Top Rated
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white">Featured Barbers</h2>
            <p className="text-slate-400 text-sm lg:text-base mt-2 max-w-lg">
               Premium grooming experts in your area with the highest customer ratings.
            </p>
          </div>
          
          <button
            onClick={() => navigate('/all-services-search')}
            className="hidden md:flex items-center text-white bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border border-white/10"
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
              className="group bg-slate-900 rounded-[2rem] overflow-hidden border border-white/5 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
            >
              {/* Image Container */}
              <div className="relative h-60 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent z-10"></div>
                
                <img 
                   src={barber.img} 
                   alt={barber.name} 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                />
                
                {/* Top Badges */}
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                   <div className="bg-slate-900/80 backdrop-blur-md text-amber-400 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-white/5">
                      <Star size={12} fill="currentColor" /> {barber.rating?.toFixed(1) || '4.5'}
                   </div>
                </div>

                <div className="absolute top-4 right-4 z-20">
                   {barber.verified && (
                      <div className="bg-blue-500 text-white p-1.5 rounded-full shadow-lg" title="Verified Barber">
                         <ShieldCheck size={14} fill="currentColor" className="text-white" />
                      </div>
                   )}
                </div>
              </div>
              
              {/* Card Content */}
              <div className="p-6 pt-2 relative z-20 -mt-12">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/5 p-5 rounded-3xl">
                   {/* Header Info */}
                   <div className="mb-4">
                      <h3 className="font-bold text-xl text-white mb-1 leading-tight truncate">{barber.name}</h3>
                      <div className="flex items-center text-slate-400 text-xs">
                         <MapPinned size={12} className="mr-1" />
                         <span className="truncate max-w-[150px]">{barber.address || 'Local Shop'}</span>
                         <span className="mx-2">•</span>
                         <span className="text-indigo-400 font-medium">{barber.distance || '1.2 km'}</span>
                      </div>
                   </div>

                   {/* Pricing & Action */}
                   <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5">
                      <div>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Starting from</p>
                         <p className="text-white font-bold text-lg">₹{barber.price || 150}</p>
                      </div>
                      
                      <button 
                        onClick={() => handleBook(barber)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
                      >
                        Book <ArrowRight size={16} />
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
               className="inline-flex items-center text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
            >
               View All Barbers <ChevronRight size={16} />
            </button>
        </div>
      </div>
    </section>
  );
};

const AITeaser = () => {
  return (
    <section className="py-16 lg:py-28 bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 rounded-full text-purple-300 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles size={14} className="fill-purple-300 animate-pulse" /> New Feature
            </div>
            
            <h2 className="text-4xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.1]">
              Not sure what style <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
                suits you best?
              </span>
            </h2>
            
            <p className="text-slate-400 text-lg mb-8 max-w-lg leading-relaxed">
              Try our <strong>AI Style Suggestor</strong>. Upload a photo and get personalized haircut ideas based on your face shape analysis.
            </p>

            <button className="group flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all shadow-xl shadow-purple-500/10">
              <Wand2 size={20} className="group-hover:rotate-12 transition-transform text-purple-600" />
              <span>Try AI Stylist</span>
              <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Right Visual - Face Scan UI */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
             <div className="relative mx-auto max-w-[320px] lg:max-w-[380px]">
                {/* Floating Cards Animation */}
                <motion.div 
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-12 top-10 z-30 bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl hidden lg:block"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">98%</div>
                    <span className="font-bold text-white text-sm">Best Match</span>
                  </div>
                  <div className="text-xs text-slate-400">Texture Crop with Fade</div>
                </motion.div>

                <motion.div 
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -left-12 bottom-20 z-30 bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl hidden lg:block"
                >
                   <div className="flex items-center gap-2 mb-1">
                      <ScanFace size={16} className="text-blue-400" />
                      <span className="font-bold text-white text-xs uppercase tracking-wide">Analysis</span>
                   </div>
                   <div className="text-sm text-slate-300 font-medium">Face Shape: <span className="text-white">Oval</span></div>
                </motion.div>

                {/* Main Card */}
                <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 relative shadow-2xl bg-slate-900 group">
                   {/* Image */}
                   <img 
                     src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80" 
                     alt="AI Analysis" 
                     className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                   />
                   
                   {/* Scanning Line */}
                   <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-500/0 via-purple-500/50 to-purple-500/0 border-b-2 border-purple-400 opacity-50 animate-[scan_3s_ease-in-out_infinite] shadow-[0_0_20px_rgba(168,85,247,0.5)]"></div>

                   {/* UI Overlay */}
                   <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                         <div className="w-full h-full border-2 border-white/20 rounded-3xl relative">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-400 rounded-tl-lg -mt-0.5 -ml-0.5"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-400 rounded-tr-lg -mt-0.5 -mr-0.5"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-400 rounded-bl-lg -mb-0.5 -ml-0.5"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-400 rounded-br-lg -mb-0.5 -mr-0.5"></div>
                         </div>
                      </div>
                      
                      <div className="text-center pb-8">
                         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/50 backdrop-blur-xl border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-medium text-white tracking-widest uppercase">Processing</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Glow behind card */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 blur-2xl -z-10 rounded-[3rem]"></div>
             </div>
          </motion.div>
        </div>
      </div>
      
      {/* CSS Animation for Scanner */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { top: 90%; }
        }
      `}</style>
    </section>
  );
};

const BarberOnboarding = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 lg:py-32 bg-slate-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.05),transparent_40%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
          
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
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full text-amber-400 text-xs font-bold uppercase tracking-widest mb-6 w-fit">
                   <Store size={14} /> Partner Program
                </div>
                
                <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                  Own a barber shop?
                </h2>
                
                <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-md">
                  List your shop on GlossCut in 5 minutes. Get more bookings, reduce no-shows, and manage payments easily with our pro dashboard.
                </p>

                <ul className="space-y-4 mb-10">
                  {[
                    { text: 'Zero listing fees', icon: <Zap size={18} className="text-amber-400" /> },
                    { text: 'Instant daily payouts', icon: <Wallet size={18} className="text-amber-400" /> },
                    { text: 'Advanced customer analytics', icon: <LayoutDashboard size={18} className="text-amber-400" /> }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-slate-200 font-medium text-lg group">
                      <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-white/10 flex items-center justify-center group-hover:border-amber-500/50 transition-colors">
                         {item.icon}
                      </div>
                      {item.text}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/barber-account-creation')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  Start Partner Registration <ArrowRight size={20} />
                </button>
              </motion.div>
            </div>

            {/* Right Visual Side - The "Dashboard" */}
            <div className="relative min-h-[400px] lg:min-h-auto bg-slate-900/50 lg:border-l border-white/5 overflow-hidden flex items-center justify-center p-8 lg:p-0">
               
               {/* Background Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-600/20 rounded-full blur-[80px]"></div>

               {/* 3D Tilted Dashboard Card */}
               <motion.div 
                 initial={{ opacity: 0, rotateY: 15, rotateX: 5 }}
                 whileInView={{ opacity: 1, rotateY: -12, rotateX: 5 }}
                 viewport={{ once: true }}
                 transition={{ duration: 1, ease: "easeOut" }}
                 className="relative w-full max-w-md perspective-1000 transform lg:translate-x-8"
               >
                  <div className="bg-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
                     {/* Dashboard Header */}
                     <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-slate-900/50">
                        <div className="flex gap-1.5">
                           <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                           <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                           <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <div className="ml-auto text-[10px] text-slate-500 font-mono">dashboard.glosscut.pro</div>
                     </div>

                     {/* Dashboard Content */}
                     <div className="p-6 space-y-6">
                        {/* Total Revenue Widget */}
                        <div className="space-y-2">
                           <div className="flex justify-between items-end">
                              <div>
                                 <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                                 <h3 className="text-3xl font-bold text-white mt-1">₹24,500</h3>
                              </div>
                              <div className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">
                                 +12.5%
                              </div>
                           </div>
                           {/* Fake Graph */}
                           <div className="h-16 flex items-end gap-1">
                              {[40, 60, 45, 70, 65, 85, 80].map((h, i) => (
                                 <div key={i} className="flex-1 bg-amber-500/20 rounded-t-sm relative group" style={{ height: `${h}%` }}>
                                    <div className="absolute bottom-0 w-full bg-amber-500 rounded-t-sm transition-all duration-500" style={{ height: i === 6 ? '100%' : '0%' }}></div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Recent Activity List */}
                        <div className="space-y-3">
                           <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Live Activity</p>
                           {[
                              { name: 'Rahul S.', action: 'Booked Haircut', time: '2m ago', amt: '+₹250' },
                              { name: 'Amit K.', action: 'Completed', time: '15m ago', amt: '+₹450' }
                           ].map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                                       {item.name[0]}
                                    </div>
                                    <div>
                                       <p className="text-sm text-white font-medium">{item.name}</p>
                                       <p className="text-xs text-slate-500">{item.action}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-sm text-emerald-400 font-bold">{item.amt}</p>
                                    <p className="text-[10px] text-slate-600">{item.time}</p>
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
                     className="absolute -left-8 top-12 bg-slate-800 p-4 rounded-xl border border-white/10 shadow-xl flex gap-3 items-center z-30"
                  >
                     <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <Wallet size={20} />
                     </div>
                     <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Payout Processed</p>
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