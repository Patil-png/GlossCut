import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  Search, MapPin, Star, Clock, Sparkles,
  Zap, LayoutGrid, Users, User,
  ArrowRight, ShieldCheck, X
} from 'lucide-react';

// Helper function to get valid image URL
const getValidImageUrl = (imageField) => {
  if (typeof imageField === 'string' && imageField.trim()) {
    return `${process.env.REACT_APP_API_URL}${imageField}`;
  }
  return 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80';
};

// --- VISUAL ASSETS & COMPONENTS ---

const Background = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-[#020202]">
    {/* Subtle Noise Texture */}
    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
    
    {/* Geometric Floor */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

    {/* Moving Orbs */}
    <motion.div
      animate={{ 
        opacity: [0.15, 0.25, 0.15], 
        scale: [1, 1.2, 1],
        x: [0, 50, 0],
        y: [0, 30, 0]
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[-10%] left-[10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[100px]"
    />
    <motion.div
      animate={{ 
        opacity: [0.1, 0.2, 0.1], 
        scale: [1, 1.1, 1],
        x: [0, -30, 0] 
      }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute top-[20%] right-[0%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px]"
    />
  </div>
);

const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 border border-white/30 bg-white/5 backdrop-blur-[1px] rounded-full pointer-events-none z-[9999] hidden md:block"
      style={{
        translateX: cursorXSpring,
        translateY: cursorYSpring,
      }}
    >
        <div className="absolute inset-0 bg-white/20 rounded-full blur-sm" />
    </motion.div>
  );
};

// Reusable Status Badge
const StatusBadge = ({ isAvailable }) => (
  <div className={`
    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md border shadow-lg
    ${isAvailable 
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' 
      : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5'
    }
  `}>
    <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
    {isAvailable ? 'Open Now' : 'Closed'}
  </div>
);

const ProviderCard = ({ provider, onClick, clickCount }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group relative w-full h-full"
    >
      {/* Glow Effect behind card */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      <div className="relative flex flex-col h-full bg-[#0a0a0a] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-2xl transition-all duration-300 group-hover:border-white/10">
        
        {/* Image Area */}
        <div className="relative h-56 overflow-hidden">
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.7 }}
            src={provider.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'}
            alt={provider.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
          
          <div className="absolute top-4 right-4 z-10">
            <StatusBadge isAvailable={provider.isAvailable} />
          </div>

          <div className="absolute top-4 left-4 z-10 flex gap-2">
            {provider.rating > 0 && (
              <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 text-xs font-medium text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{provider.rating.toFixed(1)}</span>
              </div>
            )}
             <div className="hidden group-hover:flex items-center gap-1 bg-blue-500/20 backdrop-blur-md px-2 py-1 rounded-full border border-blue-500/20 text-xs font-medium text-blue-300 animate-in fade-in slide-in-from-left-2">
                <Sparkles className="w-3 h-3" />
                <span>Popular</span>
              </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-col flex-1 p-5 pt-2">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{provider.name}</h3>
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <span className="line-clamp-1">{provider.address}</span>
              </p>
            </div>
          </div>

          {/* Tags/Services */}
          <div className="flex flex-wrap gap-2 mt-3 mb-4">
             {provider.services?.slice(0, 3).map((s, i) => (
               <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/5">
                 {typeof s === 'string' ? s : s.name}
               </span>
             ))}
             {(provider.services?.length || 0) > 3 && (
                <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-gray-500 border border-white/5">
                  +{provider.services.length - 3} more
                </span>
             )}
          </div>

          <div className="mt-auto pt-4 border-t border-white/5">
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-gray-500">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>Next slot: Today</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{provider.todaysBookings} booked</span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onClick(provider)}
                disabled={!provider.isAvailable}
                className={`
                  relative overflow-hidden pl-4 pr-3 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-300
                  ${provider.isAvailable
                    ? 'bg-white text-black hover:bg-blue-50'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {provider.isAvailable ? (
                  <>
                    <span>Book</span>
                    <div className="bg-black/10 rounded-full p-0.5">
                       <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </>
                ) : (
                  <span>Closed</span>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BarberCard = ({ barber, onClick }) => {
  const maxAppointments = barber.owner?.maxAppointmentsPerDay || 10;
  const fullness = Math.min((barber.todaysBookings / maxAppointments) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative bg-[#121212] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/20 transition-all duration-300"
      onClick={() => onClick(barber)}
    >
      <div className="flex p-3 gap-4">
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-800">
          <img 
            src={barber.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'} 
            alt={barber.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
           <div className="absolute bottom-1 right-1">
             <div className={`w-3 h-3 rounded-full border-2 border-[#121212] ${barber.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
           </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <h4 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">{barber.name}</h4>
            {barber.rating > 0 && (
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {barber.rating.toFixed(1)}
                </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-2">{barber.tag || 'Stylist'}</p>
          
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
             <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {barber.avgAppointmentTime}</span>
             <span className="w-1 h-1 bg-gray-700 rounded-full" />
             <span className="flex items-center gap-1">{barber.reviews} reviews</span>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                barber.isAvailable 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-white/5 text-gray-500'
            }`}
          >
            {barber.isAvailable ? 'Select Barber' : 'Unavailable'}
          </motion.button>
        </div>
      </div>
      
      {/* Capacity Bar at bottom */}
      {barber.isAvailable && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
            <div 
                className={`h-full ${fullness > 80 ? 'bg-red-500' : 'bg-green-500'}`} 
                style={{ width: `${fullness}%` }}
            />
        </div>
      )}
    </motion.div>
  );
};

const ShopDetailsModal = ({ isOpen, shop, onClose, barbers, onBarberClick }) => {
  if (!isOpen || !shop) return null;

  const shopMemberIds = [shop.owner?._id, ...(shop.staff || []).map(staff => staff._id)].filter(id => id);
  const shopBarbers = barbers.filter(barber =>
    shopMemberIds.includes(barber.barberId) && barber.approvalStatus === 'approved'
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-5xl h-[90vh] md:h-[85vh] bg-[#0f0f0f] md:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Banner Header */}
        <div className="relative h-48 md:h-64 shrink-0">
            <img
                src={getValidImageUrl(shop.image || shop.owner?.profilePicture)}
                className="w-full h-full object-cover opacity-60"
                alt="cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/50 to-transparent" />
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
            >
                <X className="w-6 h-6" />
            </button>
            
            <div className="absolute bottom-0 left-0 p-6 w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                                {shop.category || 'Barber Shop'}
                             </span>
                             <div className="flex items-center gap-1 text-amber-400">
                                 <Star className="w-3.5 h-3.5 fill-amber-400" />
                                 <span className="text-sm font-bold">{shop.rating.toFixed(1)}</span>
                             </div>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">{shop.name}</h2>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <MapPin className="w-4 h-4" />
                            {shop.address}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {/* Enhanced Professional Selection Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 relative"
            >
              {/* Background Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-xl opacity-50"></div>

              <div className="relative bg-gradient-to-r from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          Select a Professional
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                          <p className="text-blue-400 text-sm font-medium">Choose who you want to book with</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Verified Experts</span>
                      </div>
                      <div className="w-px h-4 bg-white/10"></div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Instant Booking</span>
                      </div>
                      <div className="w-px h-4 bg-white/10"></div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <ShieldCheck className="w-4 h-4" />
                        <span>100% Secure</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Counter Badge */}
                  <div className="ml-6">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      className="relative"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-30"></div>
                      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 rounded-xl border border-white/20 shadow-xl">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white tabular-nums">
                            {shopBarbers.length}
                          </div>
                          <div className="text-xs text-blue-200 font-medium uppercase tracking-wider">
                            Available
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>Team Readiness</span>
                    <span className="font-medium">{shopBarbers.filter(b => b.isAvailable).length}/{shopBarbers.length} Online</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(shopBarbers.filter(b => b.isAvailable).length / shopBarbers.length) * 100}%` }}
                      transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {shopBarbers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {shopBarbers.map((barber) => (
                      <BarberCard
                        key={barber.id}
                        barber={barber}
                        onClick={onBarberClick}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <Users className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-gray-400">No staff currently available.</p>
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
};

const AllServicesSearch = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  // --- ORIGINAL STATE LOGIC PRESERVED ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [allProviders, setAllProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [clickCounts, setClickCounts] = useState({});
  const [serviceFilter, setServiceFilter] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allBarbersData, setAllBarbersData] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  const fetchProviders = useCallback(async () => {
    if (isFetching) return;
    setIsFetching(true);

    try {
      const shopRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shop/all`);
      const barberRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/barber-card/all`);

      if (Array.isArray(shopRes.data) && Array.isArray(barberRes.data)) {
        const formattedData = [];

        for (const shop of shopRes.data) {
          if (shop.approvalStatus !== 'approved') continue;
          const shopBarbers = barberRes.data.filter((barber) => barber.shopId === shop._id);
          let totalTodaysBookings = 0;
          let totalMaxAppointments = 0;

          if (shop.owner?.isAvailable) {
            totalMaxAppointments += shop.owner.maxAppointmentsPerDay || 10;
          }
          for (const staff of shop.staff || []) {
            if (staff.isAvailable) {
              totalMaxAppointments += staff.maxAppointmentsPerDay || 10;
            }
          }

          const barberBookingsCount = {};
          try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const barberIds = [shop.owner._id, ...(shop.staff || []).map(s => s._id)].filter(id => id);

            if (barberIds.length > 0 && isAuthenticated) {
              const token = localStorage.getItem('customerAuthToken') || localStorage.getItem('barberAuthToken');
              if (token) {
                const bookingRes = await axios.get(
                  `${process.env.REACT_APP_API_URL}/api/booking/barber-appointments-batch?barberIds=${barberIds.join(',')}&date=${today.toISOString().split('T')[0]}`,
                  { headers: { 'x-auth-token': token } }
                );

                if (bookingRes.data) {
                  Object.keys(bookingRes.data).forEach(barberId => {
                    barberBookingsCount[barberId] = bookingRes.data[barberId];
                  });
                }
              }
            }
          } catch (error) {
            console.warn('Error fetching todays bookings, using fallback values:', error.message);
          }

          // Fallback values if not authenticated or API failed
          if (!barberBookingsCount[shop.owner._id]) {
            barberBookingsCount[shop.owner._id] = shopBarbers.find(b => b.barberId === shop.owner._id)?.todaysBookings || 0;
          }
          for (const staff of shop.staff || []) {
            if (!barberBookingsCount[staff._id]) {
              barberBookingsCount[staff._id] = shopBarbers.find(b => b.barberId === staff._id)?.todaysBookings || 0;
            }
          }

          if (!barberBookingsCount[shop.owner._id]) {
            barberBookingsCount[shop.owner._id] = shopBarbers.find(b => b.barberId === shop.owner._id)?.todaysBookings || 0;
          }
          for (const staff of shop.staff || []) {
            if (!barberBookingsCount[staff._id]) {
              barberBookingsCount[staff._id] = shopBarbers.find(b => b.barberId === staff._id)?.todaysBookings || 0;
            }
          }

          totalTodaysBookings = Object.values(barberBookingsCount).reduce((sum, count) => sum + count, 0);

          const shopCard = {
            id: shop._id,
            type: "shop",
            owner: { ...shop.owner, maxAppointmentsPerDay: totalMaxAppointments },
            staff: shop.staff || [],
            name: shop.name || "Unknown Shop",
            address: shop.address || "Location Unavailable",
            image: getValidImageUrl(shop.image || shop.owner?.profilePicture),
            rating: shop.rating || 0,
            reviews: shop.totalReviews || shop.reviews || 0,
            services: shop.services || [],
            category: shop.category || "Barber",
            tag: shop.tag,
            avgAppointmentTime: shop.avgAppointmentTime || "30 min",
            totalServices: shop.services?.length || 0,
            isAvailable: !!shop.isAvailable,
            todaysBookings: totalTodaysBookings,
            listingTier: shop.listingTier,
            totalBarbers: shop.totalBarbers || 1,
            shopRating: shop.shopRating || shop.rating || 0,
            approvalStatus: shop.approvalStatus,
          };
          formattedData.push(shopCard);

          for (const barber of shopBarbers) {
            if (barber.approvalStatus !== 'approved') continue;
            const barberCard = {
              id: barber.id,
              type: "barber",
              barberId: barber.barberId,
              shopId: barber.shopId,
              name: barber.name || "Unknown Barber",
              address: barber.address || shop.address || "Location Unavailable",
              image: getValidImageUrl(barber.image) || (barber.barberId?.profilePicture ? getValidImageUrl(barber.barberId.profilePicture) : "https://via.placeholder.com/150"),
              rating: barber.rating || 0,
              reviews: Array.isArray(barber.reviews) ? barber.reviews.length : barber.reviews || 0,
              services: barber.services || [],
              category: barber.category || "General",
              tag: barber.specialties?.[0] || barber.tag || "General",
              avgAppointmentTime: barber.avgAppointmentTime || "30 min",
              totalServices: barber.services?.length || 0,
              isAvailable: barber.isAvailable && shop.isAvailable,
              todaysBookings: barberBookingsCount[barber.barberId] || 0,
              shopName: barber.shopName || shop.name,
              listingTier: barber.listingTier,
              parentShopId: shop._id,
              owner: { _id: barber.barberId },
              approvalStatus: barber.approvalStatus,
            };
            formattedData.push(barberCard);
          }
        }

        const independentBarbers = barberRes.data.filter((barber) => !barber.shopId);
        for (const barber of independentBarbers) {
          if (barber.approvalStatus !== 'approved') continue;
          const barberCard = {
            id: barber.id,
            type: "barber",
            barberId: barber.barberId,
            shopId: null,
            name: barber.name || "Unknown Barber",
            address: barber.address || "No address",
            image: getValidImageUrl(barber.image) || (barber.barberId?.profilePicture ? getValidImageUrl(barber.barberId.profilePicture) : "https://via.placeholder.com/150"),
            rating: barber.rating || 0,
            reviews: Array.isArray(barber.reviews) ? barber.reviews.length : barber.reviews || 0,
            services: barber.services || [],
            category: barber.category || "General",
            tag: barber.specialties?.[0] || barber.tag || "General",
            avgAppointmentTime: barber.avgAppointmentTime || "30 min",
            totalServices: barber.services?.length || 0,
            isAvailable: barber.isAvailable,
            todaysBookings: barber.todaysBookings || 0,
            shopName: barber.shopName || "Independent",
            listingTier: barber.listingTier,
            parentShopId: null,
            owner: { _id: barber.barberId },
            approvalStatus: barber.approvalStatus,
          };
          formattedData.push(barberCard);
        }

        const shops = formattedData.filter(item => item.type === 'shop');
        const barbers = formattedData.filter(item => item.type === 'barber');

        setAllProviders([...shops, ...barbers]);
        setAllBarbersData(barbers);
        setFilteredProviders(shops);
      }
    } catch (err) {
      console.error("Failed to fetch providers", err);
      // Dummy data retained for robustness
      const dummyData = Array.from({length: 6}).map((_, i) => ({
          id: `dummy-${i}`,
          name: `Elite Studio ${i+1}`,
          address: `${100+i} Fashion Avenue, Downtown`,
          rating: 4.5 + (i * 0.1),
          reviews: 120 + i * 10,
          avgAppointmentTime: `${30 + i * 5} min`,
          totalServices: 10 + i,
          todaysBookings: 5 + i,
          isAvailable: i % 3 !== 0,
          category: i % 2 === 0 ? "Barber" : "Women's Salon",
          tag: i % 2 === 0 ? "Men's Grooming" : "Hair & Spa",
          type: i % 4 === 0 ? "shop" : "barber",
          approvalStatus: 'approved',
          services: ["Haircut", "Beard Trim", "Facial"]
      }));
      setAllProviders(dummyData);
      setFilteredProviders(dummyData);
    }
    setLoading(false);
    setIsFetching(false);
  }, [isFetching, isAuthenticated]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    const service = searchParams.get('service');
    if (service) {
      setServiceFilter(service);
      navigate('/all-services-search', { replace: true });
    }
  }, [navigate, searchParams]);

  const performSortAndFilter = useCallback((query, filters, serviceParam) => {
    let list = [...allProviders];

    if (serviceParam) {
      list = list.filter(provider => {
        const hasService = provider.services && provider.services.some(service => {
          const serviceName = typeof service === 'string' ? service : service.name;
          return serviceName && serviceName.toLowerCase().includes(serviceParam.toLowerCase());
        });
        return hasService;
      });
    }

    switch (activeCategory) {
      case 'all':
        list = list.filter(provider => provider.type === 'shop');
        break;
      case 'barber':
        list = list.filter(provider =>
          provider.type === 'shop' &&
          (provider.category === "Barber" || provider.category === "Unisex")
        );
        break;
      case 'women':
        list = list.filter(provider =>
          provider.type === 'shop' &&
          (provider.category === "Women's Salon" || provider.category === "Unisex")
        );
        break;
      case 'petcare':
        list = list.filter(provider =>
          provider.type === 'shop' &&
          provider.category === "Pet Care"
        );
        break;
      default: break;
    }

    if (filters.includes('Online')) {
      list = list.filter(provider => provider.isAvailable);
    }
    if (filters.includes('Offline')) {
      list = list.filter(provider => !provider.isAvailable);
    }

    if (query && query.trim() && !serviceParam) {
      const searchTerm = query.toLowerCase().trim();
      list = list.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm) ||
        provider.address.toLowerCase().includes(searchTerm) ||
        provider.category.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.includes('Rating')) {
      list.sort((a, b) => b.rating - a.rating);
    } else if (filters.includes('Number of Reviews')) {
      list.sort((a, b) => b.reviews - a.reviews);
    } else if (filters.includes('Average Time')) {
      list.sort((a, b) => {
        const timeA = parseInt(a.avgAppointmentTime.replace(/\D/g, '')) || 0;
        const timeB = parseInt(b.avgAppointmentTime.replace(/\D/g, '')) || 0;
        return timeA - timeB;
      });
    } else {
      list.sort((a, b) => b.rating - a.rating);
    }

    setFilteredProviders(list);
  }, [allProviders, activeCategory]);

  useEffect(() => {
    if (!loading) {
      performSortAndFilter(searchQuery, activeFilters, serviceFilter);
    }
  }, [searchQuery, activeFilters, loading, allProviders, activeCategory, serviceFilter, performSortAndFilter]);

  const handleFilterToggle = (filter) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveFilters([]);
    setActiveCategory('all');
    setServiceFilter('');
    navigate('/all-services-search', { replace: true });
  };

  const handleCardClick = async (provider) => {
    const currentCount = clickCounts[provider.id] || 0;
    const newClickCount = currentCount + 1;
    setClickCounts(prev => ({ ...prev, [provider.id]: newClickCount }));

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/shop/increment-click/${provider.id}`);
    } catch (error) {
      console.error("Failed to increment click count", error);
    }

    if (provider.type === 'shop') {
      setSelectedShop(provider);
      setIsModalOpen(true);
      return;
    }

    if (provider.isAvailable) {
      if (!isAuthenticated) {
        navigate('/login', {
          state: {
            returnTo: '/booking-appointment',
            barberData: provider
          }
        });
        return;
      }
      navigate('/booking-appointment', { state: { barberData: provider } });
    }
  };

  const handleBarberClick = (barber) => {
    setIsModalOpen(false);
    setSelectedShop(null);

    if (barber.isAvailable) {
      if (!isAuthenticated) {
        navigate('/login', {
          state: {
            returnTo: '/booking-appointment',
            barberData: barber
          }
        });
        return;
      }
      navigate('/booking-appointment', { state: { barberData: barber } });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedShop(null);
  };

  // --- NEW UI LAYOUT ---
  
  const categoryOptions = [
    { label: 'All Services', value: 'all', icon: LayoutGrid },
    { label: 'Barbers', value: 'barber', icon: User },
    { label: 'Salons', value: 'women', icon: Sparkles },
    { label: 'Pet Care', value: 'petcare', icon: ShieldCheck },
  ];

  const filterOptions = [
    { label: 'Online Now', value: 'Online' },
    { label: 'Top Rated', value: 'Rating' },
    { label: 'Most Reviewed', value: 'Number of Reviews' },
    { label: 'Fastest Service', value: 'Average Time' },
  ];

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-blue-500/30 selection:text-blue-200 relative overflow-x-hidden">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <CustomCursor />
      <Background />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center text-center mb-12 mt-8 md:mt-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-medium backdrop-blur-md mb-6 hover:bg-white/10 transition-colors cursor-default"
          >
             <Zap size={12} className="text-yellow-400 fill-yellow-400" />
             <span>The Premium Booking Network</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500"
          >
            Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">perfect match.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl leading-relaxed"
          >
            Discover top-rated local professionals. Real-time availability, verified reviews, and instant booking confirmation.
          </motion.p>
        </div>

        {/* Floating Dock: Search & Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky top-4 z-40 mb-12"
        >
          <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-full p-2 shadow-2xl shadow-black/50 ring-1 ring-white/5">
            <div className="flex flex-col md:flex-row gap-2">

              {/* Search Bar */}
              <div className="relative flex-1 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                    <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search professionals, services, or locations..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full h-12 md:h-14 bg-[#1a1a1a]/50 md:bg-transparent border border-white/5 md:border-none rounded-xl md:rounded-none pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-0 transition-all text-sm md:text-base"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearFilters}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={16}  />
                  </button>
                )}
              </div>

              <div className="hidden md:block w-px h-8 bg-white/10 self-center mx-2"></div>

              {/* Desktop Categories */}
              <div className="hidden md:flex bg-[#1a1a1a] rounded-full p-1 border border-white/5">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleCategoryChange(opt.value)}
                    className={`
                      relative px-5 h-12 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300
                      ${activeCategory === opt.value ? 'text-white' : 'text-gray-400 hover:text-white'}
                    `}
                  >
                    {activeCategory === opt.value && (
                      <motion.div 
                        layoutId="activeCategory"
                        className="absolute inset-0 bg-[#2a2a2a] rounded-full shadow-lg border border-white/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                         <opt.icon size={16} /> {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Mobile Categories & Filters (Inside the dock on mobile) */}
            <div className="md:hidden mt-2 pt-2 border-t border-white/5 px-1 pb-1">
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categoryOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleCategoryChange(opt.value)}
                        className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          activeCategory === opt.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#1a1a1a] text-gray-400 border border-white/5'
                        }`}
                      >
                         <opt.icon size={12} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex justify-center mt-4">
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full px-4">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleFilterToggle(opt.value)}
                      className={`
                        whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 backdrop-blur-sm
                        ${activeFilters.includes(opt.value)
                          ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
          </div>
        </motion.div>

        {/* Results Grid */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-16 h-16 relative">
                 <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-400 animate-pulse font-medium">Locating professionals...</p>
            </div>
          ) : filteredProviders.length > 0 ? (
            <motion.div 
              layout 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8"
            >
              <AnimatePresence>
                {filteredProviders.map((provider) => (
                  <ProviderCard 
                    key={provider.id} 
                    provider={provider} 
                    onClick={handleCardClick}
                    clickCount={clickCounts}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-[#0a0a0a] rounded-3xl border border-dashed border-white/10">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
              <p className="text-gray-500 max-w-sm">We couldn't find any professionals matching your specific criteria. Try adjusting your filters.</p>
              <button 
                onClick={handleClearFilters}
                className="mt-6 px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        <ShopDetailsModal
          isOpen={isModalOpen}
          shop={selectedShop}
          onClose={closeModal}
          barbers={allBarbersData}
          onBarberClick={handleBarberClick}
        />

      </div>
    </div>
  );
};

export default AllServicesSearch;
