import { useState, useEffect, memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CreditCard, Star,
  MapPin, ChevronDown, Smartphone,
  ShieldCheck, Clock, Check, Zap, ArrowRight,
  LayoutDashboard,
  Wallet, Store, Tag, Users, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- Data Constants ---
const FAQS = [
  { q: "Do I pay extra using GlossCut?", a: "No extra charges for basic bookings. You pay the same price as the shop menu." },
  { q: "Can I cancel a booking?", a: "Yes, you can cancel up to 1 hour before your slot for a full refund." },
  { q: "Is UPI payment secure?", a: "Absolutely. We use banking-grade security for all UPI transactions." },
];

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// --- Sub-Components ---

// Lazy loaded components
const LazyFeaturedBarbers = lazy(() => import('./FeaturedBarbers').catch(() => ({ default: () => <div className="py-10 text-center text-zinc-500">Loading Barbers...</div> })));

// --- HERO COMPONENT (Restored to Original Spacing) ---
const Hero = memo(() => {
  const navigate = useNavigate();

  return (
    // Restored original spacious padding
    <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-48 overflow-hidden bg-[#020202]">
      {/* Premium Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] bg-[radial-gradient(circle,rgba(217,119,6,0.08)_0%,transparent_70%)] blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(circle,rgba(30,58,138,0.05)_0%,transparent_70%)] blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] mask-image-gradient"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Restored wide gap */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Text Content */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Live Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-900/60 border border-white/5 mb-8 backdrop-blur-md shadow-lg ring-1 ring-white/5"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
              </div>
              <span className="text-zinc-300 text-xs font-medium tracking-wide uppercase">
                Live in <span className="text-amber-400 font-bold">Amravati & Nagpur</span>
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 font-serif"
            >
              Book your barber <br />
              <span className="relative inline-block">
                <span className="absolute -inset-1 blur-2xl bg-amber-500/20 rounded-full"></span>
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
                  in seconds.
                </span>
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light"
            >
              GlossCut elevates your grooming. Discover nearby talent, skip the queue with real-time slots, and pay instantly via UPI.
            </motion.p>

            {/* Buttons & Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center lg:items-start w-full"
            >
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-10">
                <button className="group relative flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] w-full sm:w-auto overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Smartphone className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Download App</span>
                </button>

                <button
                  onClick={() => navigate('/barber-account-creation')}
                  className="flex items-center justify-center gap-3 bg-zinc-900/50 text-zinc-100 border border-zinc-700/50 px-8 py-4 rounded-xl font-bold text-lg hover:bg-zinc-800 hover:border-zinc-500 transition-all w-full sm:w-auto backdrop-blur-sm"
                >
                  List Your Shop
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-5">
                <div className="flex -space-x-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-[3px] border-[#020202] bg-zinc-800 flex items-center justify-center overflow-hidden shadow-lg">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <div className="flex text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" className="mr-0.5" />)}
                    </div>
                    <span className="font-bold text-white ml-1">4.9</span>
                  </div>
                  <p className="text-zinc-500 text-sm font-medium">Trusted by 10k+ users</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Side Visual - Restored Large Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: 10 }}
            animate={{ opacity: 1, x: 0, rotateY: -10 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative hidden lg:block perspective-1000"
          >
            <div className="relative mx-auto max-w-sm">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-amber-500/10 rounded-full blur-[80px]"></div>

              <div className="bg-[#111] rounded-[3rem] p-3 border border-zinc-700/50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative z-10 ring-1 ring-white/10">

                <div className="h-[580px] overflow-hidden rounded-[2.2rem] bg-[#0a0a0a] relative flex flex-col">

                  <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/50 to-transparent z-20"></div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#111] rounded-b-2xl z-20 border-b border-l border-r border-zinc-800"></div>

                  <div className="pt-12 px-5 pb-6 flex-1 overflow-y-auto no-scrollbar relative">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <p className="text-xs text-zinc-400 font-medium tracking-wide">Good Evening,</p>
                        <h3 className="text-white font-serif text-xl">Aditya</h3>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 ring-1 ring-amber-500/20">
                        <Users size={18} />
                      </div>
                    </div>

                    <div className="relative mb-6 group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-zinc-900 rounded-2xl p-5 border border-zinc-700/50 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={60} /></div>

                        <div className="inline-block bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded mb-3 uppercase tracking-wider">Confirmed</div>
                        <h3 className="text-white font-bold text-xl mb-1">Fade & Beard Trim</h3>
                        <p className="text-zinc-400 text-sm mb-4">Today, 5:00 PM</p>

                        <div className="flex items-center gap-3 pt-3 border-t border-dashed border-zinc-700">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-amber-500">
                            <MapPin size={14} />
                          </div>
                          <div>
                            <p className="text-xs text-zinc-300 font-bold">Urban Cuts Studio</p>
                            <p className="text-[10px] text-zinc-500">Raja Peth, Amravati</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 flex justify-between items-end">
                      <h4 className="text-white font-bold">Nearby</h4>
                      <span className="text-amber-500 text-xs font-medium cursor-pointer">View all</span>
                    </div>

                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer">
                          <div className="h-14 w-14 rounded-lg bg-zinc-800 relative overflow-hidden shrink-0">
                            <img src={`https://images.unsplash.com/photo-${i === 1 ? '1585747860715-2ba37e788b70' : i === 2 ? '1503951914875-452162b7f30a' : '1599351436213-9971f64d6bad'}?w=200&q=80`} className="object-cover w-full h-full opacity-80" alt="shop" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-white font-bold text-sm truncate">The Grooming Co.</h5>
                            <p className="text-zinc-500 text-xs truncate">Men's Salon • Unisex</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Star size={10} className="text-amber-500 fill-amber-500" />
                              <span className="text-[10px] text-zinc-300">4.8 (120)</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-16 bg-[#111] border-t border-zinc-800 flex justify-around items-center px-4 relative z-20">
                    <div className="flex flex-col items-center gap-1 text-amber-500"><Search size={20} /><div className="w-1 h-1 bg-amber-500 rounded-full"></div></div>
                    <div className="flex flex-col items-center gap-1 text-zinc-600"><Clock size={20} /></div>
                    <div className="flex flex-col items-center gap-1 text-zinc-600"><Wallet size={20} /></div>
                  </div>
                </div>
              </div>

              {/* Floating Notification Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-20 -right-12 bg-zinc-900/90 backdrop-blur-xl p-3 rounded-xl shadow-2xl border border-zinc-700 ring-1 ring-black/50 z-20 w-32"
              >
                <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400 w-fit mb-2">
                  <Check size={14} strokeWidth={3} />
                </div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Payment</p>
                <p className="text-xs text-white font-bold">Success</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-32 -left-12 bg-zinc-900/90 backdrop-blur-xl p-3 rounded-xl shadow-2xl border border-zinc-700 ring-1 ring-black/50 z-20 w-36"
              >
                <div className="bg-amber-500/20 p-1.5 rounded-lg text-amber-400 w-fit mb-2">
                  <Clock size={14} strokeWidth={3} />
                </div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Wait Time</p>
                <p className="text-xs text-white font-bold">0 mins saved</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

// --- COMPACT CONTENT SECTIONS (Reduced Padding) ---

const ValueProps = memo(() => {
  const props = [
    {
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      title: "Instant Booking",
      desc: "Real-time slots. No more waiting in queues.",
      border: "hover:border-amber-500/30",
      bg: "hover:bg-amber-500/5"
    },
    {
      icon: <CreditCard className="w-5 h-5 text-white" />,
      title: "UPI Payments",
      desc: "Safe, direct payments to your barber via any app.",
      border: "hover:border-zinc-500/30",
      bg: "hover:bg-zinc-500/5"
    },
    {
      icon: <Tag className="w-5 h-5 text-amber-400" />,
      title: "Smart Deals",
      desc: "Dynamic pricing and festival promos.",
      border: "hover:border-amber-500/30",
      bg: "hover:bg-amber-500/5"
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-white" />,
      title: "Verified Shops",
      desc: "100% verified barbers with genuine reviews.",
      border: "hover:border-zinc-500/30",
      bg: "hover:bg-zinc-500/5"
    },
  ];

  return (
    // Compact: py-10
    <section id="features" className="py-10 relative z-10 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {props.map((prop, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              // Compact: p-5/6
              className={`group relative bg-[#0a0a0a] border border-white/5 rounded-xl p-5 lg:p-6 overflow-hidden transition-all duration-500 ${prop.border} ${prop.bg}`}
            >
              {/* Subtle Gradient Spot */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-[50px] group-hover:bg-white/10 transition-all duration-500"></div>

              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mb-4 border border-white/10 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ease-out`}>
                  {prop.icon}
                </div>

                <h3 className="text-base font-bold text-white mb-2 tracking-tight">{prop.title}</h3>
                <p className="text-zinc-500 text-sm leading-snug group-hover:text-zinc-400 transition-colors">{prop.desc}</p>
              </div>
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
        <div className="bg-zinc-900/60 backdrop-blur-2xl rounded-2xl p-2 lg:p-2 border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] transform -translate-y-6 lg:-translate-y-32 ring-1 ring-white/5">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors pointer-events-none">
                <MapPin className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Detect location or type area..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-transparent rounded-xl focus:outline-none focus:bg-black/60 focus:ring-1 focus:ring-amber-500/50 text-white placeholder-zinc-600 transition-all text-sm font-medium"
              />
            </div>

            <div className="hidden md:block w-px bg-white/5 my-2"></div>

            <div className="hidden md:flex flex-1 relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors pointer-events-none">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Haircut, Shave, Massage..."
                value={serviceQuery}
                onChange={(e) => setServiceQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-transparent rounded-xl focus:outline-none focus:bg-black/60 focus:ring-1 focus:ring-amber-500/50 text-white placeholder-zinc-600 transition-all text-sm font-medium"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap text-sm"
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
              className="px-2.5 py-0.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full text-[11px] font-medium transition-colors border border-zinc-700/50 hover:border-zinc-600"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

const BarberOnboarding = () => {
  const navigate = useNavigate();

  return (
    // Compact: py-16/20
    <section className="py-16 lg:py-20 bg-[#050505] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(180,83,9,0.08),transparent_50%)]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-[2rem] border border-zinc-800/60 overflow-hidden shadow-2xl">

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-0">

            {/* Left Content - Compact Padding */}
            <div className="p-6 lg:p-10 flex flex-col justify-center relative z-20">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 bg-amber-900/20 border border-amber-500/10 px-2.5 py-0.5 rounded-full text-amber-500 text-[9px] font-bold uppercase tracking-widest mb-4 w-fit">
                  <Store size={10} /> Partner Program
                </div>

                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-[1.1] font-serif">
                  Barber Shop Owner? <br />
                  <span className="text-zinc-500">Level up your business.</span>
                </h2>

                <p className="text-zinc-400 text-base mb-8 leading-relaxed max-w-md font-light">
                  List your shop on GlossCut in 5 minutes. Get more bookings, reduce no-shows, and manage payments easily.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    { text: 'Zero listing fees', icon: <Zap size={16} className="text-amber-400" /> },
                    { text: 'Instant daily payouts', icon: <Wallet size={16} className="text-amber-400" /> },
                    { text: 'Advanced analytics', icon: <LayoutDashboard size={16} className="text-amber-400" /> }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-zinc-200 text-sm font-medium group">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-colors">
                        {item.icon}
                      </div>
                      {item.text}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/barber-account-creation')}
                  className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all flex items-center gap-2 w-full sm:w-auto justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  Start Partner Registration <ArrowRight size={16} />
                </button>
              </motion.div>
            </div>

            {/* Right Visual Side */}
            <div className="relative min-h-[350px] lg:min-h-auto bg-[#080808] lg:border-l border-zinc-800/50 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03),transparent_60%)]"></div>

              <motion.div
                initial={{ opacity: 0, rotateY: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative w-full max-w-[85%] perspective-1000"
              >
                <div className="bg-[#0c0c0c] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden relative">
                  <div className="h-8 border-b border-zinc-800 flex items-center px-3 gap-2 bg-[#0a0a0a]">
                    <div className="flex gap-1.5 opacity-50">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-white">₹24,500<span className="text-zinc-600 text-sm font-normal">.00</span></h3>
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">+12%</div>
                    </div>

                    {/* Bars */}
                    <div className="h-20 flex items-end gap-1.5 mb-6">
                      {[30, 50, 45, 75, 55, 90, 80].map((h, i) => (
                        <div key={i} className="flex-1 bg-zinc-800/50 rounded-t-sm overflow-hidden h-full flex items-end">
                          <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: `${h}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="w-full bg-gradient-to-t from-amber-700 to-amber-500 opacity-90"
                          ></motion.div>
                        </div>
                      ))}
                    </div>

                    {/* List */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">A</div>
                          <span className="text-zinc-300 text-[10px] font-medium">Amit K.</span>
                        </div>
                        <span className="text-emerald-400 text-[10px] font-bold">+₹450</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-[10px] font-bold">R</div>
                          <span className="text-zinc-300 text-[10px] font-medium">Rahul S.</span>
                        </div>
                        <span className="text-emerald-400 text-[10px] font-bold">+₹250</span>
                      </div>
                    </div>
                  </div>
                </div>
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
    // Compact: py-12/16
    <section className="py-12 lg:py-16 bg-[#020202]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 font-serif">Frequently Asked Questions</h2>
          <p className="text-zinc-500 text-sm">Everything you need to know about booking with GlossCut.</p>
        </div>

        <div className="space-y-2">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex justify-between items-center p-4 text-left"
              >
                <span className={`font-medium text-sm pr-4 transition-colors ${openIndex === idx ? 'text-amber-400' : 'text-zinc-200'}`}>
                  {faq.q}
                </span>
                <ChevronDown className={`text-zinc-600 transform transition-transform duration-300 flex-shrink-0 ${openIndex === idx ? 'rotate-180 text-amber-400' : ''}`} size={16} />
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 text-zinc-400 text-sm leading-relaxed">
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
    <div className="min-h-screen bg-[#020202] font-sans text-zinc-200 selection:bg-amber-500/30 selection:text-amber-100">
      <main>
        <Hero />
        <div className="relative -mt-24 z-20 hidden md:block">
          <SearchTeaser />
        </div>
        <ValueProps />
        <Suspense fallback={<div className="py-12 bg-[#050505] flex justify-center"><div className="w-6 h-6 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div></div>}>
          <LazyFeaturedBarbers />
        </Suspense>
        <BarberOnboarding />
        <FAQ />
      </main>

      <footer className="py-6 text-center border-t border-zinc-900 bg-[#020202]">
        <p className="text-zinc-600 text-[10px] sm:text-xs">© 2024 GlossCut Technologies. Made with precision.</p>
      </footer>
    </div>
  );
}

export default HomeScreen;
