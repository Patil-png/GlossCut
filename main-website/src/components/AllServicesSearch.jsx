import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Search, MapPin, Star, Clock, Sparkles,
  Calendar, Zap, Filter, LayoutGrid, Users, User,
  ArrowRight, ShieldCheck, CheckCircle2, XCircle, X
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
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050505]">
    {/* Grid Floor - Optimized for mobile */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] md:bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

    {/* Ambient Glows - Reduced for mobile performance */}
    <motion.div
      animate={{ opacity: [0.2, 0.3, 0.2], scale: [1, 1.05, 1] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[-5%] md:top-[-10%] left-[15%] md:left-[20%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-[#1F6FEB]/8 md:bg-[#1F6FEB]/10 rounded-full blur-[60px] md:blur-[120px]"
    />
    <motion.div
      animate={{ opacity: [0.15, 0.25, 0.15], scale: [1, 1.1, 1] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute top-[15%] md:top-[10%] right-[5%] md:right-[10%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-[#FFB703]/8 md:bg-[#FFB703]/10 rounded-full blur-[50px] md:blur-[100px]"
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
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 border-2 border-[#1F6FEB] rounded-full pointer-events-none z-[9999] hidden md:block mix-blend-difference"
      style={{
        translateX: cursorXSpring,
        translateY: cursorYSpring,
      }}
    />
  );
};

const ProviderCard = ({ provider, onClick, clickCount }) => {
  // Calculate capacity information like customer app
  const maxAppointments = provider.owner?.maxAppointmentsPerDay || 20;
  const fullness = Math.min((provider.todaysBookings / maxAppointments) * 100, 100);
  const isAlmostFull = fullness > 90;
  const capacityText = isAlmostFull ? "High Demand" : `${maxAppointments - provider.todaysBookings} slots left`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(31,111,235,0.15)" }}
      className="group relative bg-[#0f172a]/40 backdrop-blur-md border border-white/5 rounded-xl lg:rounded-2xl overflow-hidden flex flex-col h-full"
    >
      {/* Image Section */}
      <div className="relative h-40 lg:h-48 overflow-hidden">
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
          src={provider.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'}
          alt={provider.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-80" />

        {/* Badges */}
        <div className="absolute top-2 lg:top-3 left-2 lg:left-3 flex gap-1.5 lg:gap-2">
           <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full border border-white/10 text-xs font-medium text-[#FFB703]">
             <Star className="w-2.5 h-2.5 lg:w-3 lg:h-3 fill-[#FFB703]" />
             {provider.rating > 0 ? provider.rating.toFixed(1) : "New"}
           </div>
        </div>

        <div className="absolute top-2 lg:top-3 right-2 lg:right-3">
          {!provider.isAvailable ? (
            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-md px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full border border-red-500/30 text-xs font-bold text-red-400">
              <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5 mr-1" />
              CLOSED
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-green-500/20 backdrop-blur-md px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full border border-green-500/30 text-xs font-bold text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-1" />
              OPEN NOW
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 lg:p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1.5 lg:mb-2">
          <h3 className="text-sm lg:text-lg font-bold text-white group-hover:text-[#1F6FEB] transition-colors leading-tight line-clamp-2">{provider.name}</h3>
        </div>

        <div className="flex items-center gap-1 lg:gap-1.5 mb-2 lg:mb-3 text-sm text-gray-400">
          <MapPin className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-[#1F6FEB] flex-shrink-0" />
          <span className="truncate text-xs lg:text-sm">{provider.address}</span>
        </div>





        <div className="mt-auto space-y-1.5 lg:space-y-2.5">
          <div className="flex items-center justify-end text-[10px] lg:text-xs text-gray-500 px-1">
             <span className="flex items-center gap-0.5 lg:gap-1"><Calendar className="w-2 h-2 lg:w-2.5 lg:h-2.5" /> {provider.todaysBookings} Today</span>
          </div>

          <div className="flex gap-1.5 lg:gap-2">
             <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onClick(provider)}
                disabled={!provider.isAvailable}
                className={`flex-1 py-2 lg:py-2.5 px-2.5 lg:px-3 rounded-md lg:rounded-lg font-semibold text-xs lg:text-sm flex items-center justify-center gap-1 lg:gap-1.5 transition-all duration-300 ${
                  provider.isAvailable
                    ? 'bg-gradient-to-r from-[#1F6FEB] to-[#3b82f6] text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                }`}
              >
                {provider.isAvailable ? 'Live Queue' : 'Closed'}
                {provider.isAvailable && <ArrowRight className="w-3 h-3 lg:w-3.5 lg:h-3.5" />}
             </motion.button>

             <motion.button
               whileTap={{ scale: 0.98 }}
               onClick={() => alert(`Checking appointments for ${provider.name}`)}
               className="p-2 lg:p-2.5 rounded-md lg:rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
             >
               <Calendar className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
             </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Barber Card Component for Modal
const BarberCard = ({ barber, onClick }) => {
  // Calculate capacity information for individual barber
  const maxAppointments = barber.owner?.maxAppointmentsPerDay || 10; // Default for individual barber
  const fullness = Math.min((barber.todaysBookings / maxAppointments) * 100, 100);
  const isAlmostFull = fullness > 90;
  const capacityText = isAlmostFull ? "High Demand" : `${maxAppointments - barber.todaysBookings} slots left`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(31,111,235,0.15)" }}
      className="group relative bg-[#0f172a]/40 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden flex flex-col h-full cursor-pointer"
      onClick={() => onClick(barber)}
    >
      {/* Image Section */}
      <div className="relative h-32 overflow-hidden">
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
          src={barber.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'}
          alt={barber.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-80" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10 text-xs font-medium text-[#FFB703]">
            <Star className="w-2.5 h-2.5 fill-[#FFB703]" />
            {barber.rating > 0 ? barber.rating.toFixed(1) : "New"}
          </div>
        </div>

        <div className="absolute top-2 right-2">
          {!barber.isAvailable ? (
            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-red-500/30 text-xs font-bold text-red-400">
              <Clock className="w-3 h-3 mr-1" />
              CLOSED
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-green-500/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-green-500/30 text-xs font-bold text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-1" />
              OPEN NOW
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm font-bold text-white group-hover:text-[#1F6FEB] transition-colors leading-tight line-clamp-2">{barber.name}</h3>
        </div>

        <div className="flex items-center gap-1 mb-2 text-xs text-gray-400">
          <span className="truncate">{barber.tag || 'General'}</span>
        </div>

        {/* Meta Row: Time • Services • Reviews */}
        <div className="flex items-center mb-3 flex-wrap">
          <div className="flex items-center gap-1 mr-3">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">{barber.avgAppointmentTime}</span>
          </div>
          <div className="w-1 h-1 bg-gray-600 rounded-full mx-2"></div>
          <div className="flex items-center gap-1 mr-3">
            <Sparkles className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">{barber.totalServices} Services</span>
          </div>
          <div className="w-1 h-1 bg-gray-600 rounded-full mx-2"></div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">{barber.reviews} Reviews</span>
          </div>
        </div>

        {/* Capacity Information */}
        {barber.isAvailable && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold ${fullness > 80 ? 'text-red-400' : 'text-green-400'}`}>
                {capacityText}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${fullness > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${fullness}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="mt-auto">
          <div className="flex items-center justify-between text-[9px] text-gray-500 px-1 mb-2">
            <span className="flex items-center gap-0.5">
              <Calendar className="w-1.5 h-1.5" /> {barber.todaysBookings} Today
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`w-full py-1.5 px-2 rounded-md font-semibold text-xs flex items-center justify-center gap-1 transition-all duration-300 ${
              barber.isAvailable
                ? 'bg-gradient-to-r from-[#1F6FEB] to-[#3b82f6] text-white shadow-lg shadow-blue-500/20'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
            }`}
          >
            {barber.isAvailable ? 'Book Now' : 'Unavailable'}
            {barber.isAvailable && <ArrowRight className="w-3 h-3" />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Shop Details Modal Component
const ShopDetailsModal = ({ isOpen, shop, onClose, barbers, onBarberClick }) => {
  if (!isOpen || !shop) return null;

  // Get approved barbers for this shop by matching barberId with shop owner/staff IDs
  const shopMemberIds = [shop.owner?._id, ...(shop.staff || []).map(staff => staff._id)].filter(id => id);

  const shopBarbers = barbers.filter(barber =>
    shopMemberIds.includes(barber.barberId) && barber.approvalStatus === 'approved'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-6xl max-h-[90vh] bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={getValidImageUrl(shop.image)}
                  alt={shop.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-white">{shop.name}</h2>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{shop.address}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{shop.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{shop.totalBarbers} Team Members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{shop.todaysBookings} Today's Bookings</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {shopBarbers.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-[#1F6FEB]" />
                <h3 className="text-lg font-semibold text-white">Available Barbers ({shopBarbers.length})</h3>
              </div>
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                <AnimatePresence>
                  {shopBarbers.map((barber) => (
                    <BarberCard
                      key={barber.id}
                      barber={barber}
                      onClick={onBarberClick}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Barbers Available</h3>
              <p className="text-gray-400 text-center">There are currently no approved barbers at this shop.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Helper for click count safety
const currentClickCount = (clickCounts, id) => clickCounts[id] || 0;

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





  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    const service = searchParams.get('service');
    if (service) {
      setServiceFilter(service);
      // Clear URL parameters after applying the filter
      navigate('/all-services-search', { replace: true });
    }
  }, []); // Run only once on mount

  useEffect(() => {
    if (!loading) {
      performSortAndFilter(searchQuery, activeFilters, serviceFilter);
    }
  }, [searchQuery, activeFilters, loading, allProviders, activeCategory, serviceFilter]);

  const fetchProviders = async () => {
    if (isFetching) return; // Prevent multiple concurrent fetches
    setIsFetching(true);

    try {
      // Fetch both shop data and barber card data like BarberSearchScreen
      const shopRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shop/all`);
      const barberRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/barber-card/all`);

      if (Array.isArray(shopRes.data) && Array.isArray(barberRes.data)) {
        const formattedData = [];

        for (const shop of shopRes.data) {
          // Only include approved shops
          if (shop.approvalStatus !== 'approved') continue;

          const shopBarbers = barberRes.data.filter((barber) => barber.shopId === shop._id);

          // Calculate shop-level metrics
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

          // Calculate todays bookings from barber data
          const barberBookingsCount = {};
          try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const barberIds = [shop.owner._id, ...(shop.staff || []).map(s => s._id)].filter(id => id);

            if (barberIds.length > 0) {
              const bookingRes = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/booking/barber-appointments-batch?barberIds=${barberIds.join(',')}&date=${today.toISOString().split('T')[0]}`,
                {
                  headers: {
                    'x-auth-token': localStorage.getItem('customerAuthToken') || localStorage.getItem('barberAuthToken')
                  }
                }
              );

              if (bookingRes.data) {
                // The API returns an object with barberId as keys and counts as values
                Object.keys(bookingRes.data).forEach(barberId => {
                  barberBookingsCount[barberId] = bookingRes.data[barberId];
                });
              }
            }
          } catch (error) {
            console.warn('Error fetching todays bookings, using fallback values:', error.message);
            // Use fallback values from barber data
            barberBookingsCount[shop.owner._id] = shopBarbers.find(b => b.barberId === shop.owner._id)?.todaysBookings || 0;
            for (const staff of shop.staff || []) {
              barberBookingsCount[staff._id] = shopBarbers.find(b => b.barberId === staff._id)?.todaysBookings || 0;
            }
          }

          // Set fallback values
          if (!barberBookingsCount[shop.owner._id]) {
            barberBookingsCount[shop.owner._id] = shopBarbers.find(b => b.barberId === shop.owner._id)?.todaysBookings || 0;
          }
          for (const staff of shop.staff || []) {
            if (!barberBookingsCount[staff._id]) {
              barberBookingsCount[staff._id] = shopBarbers.find(b => b.barberId === staff._id)?.todaysBookings || 0;
            }
          }

          totalTodaysBookings = Object.values(barberBookingsCount).reduce((sum, count) => sum + count, 0);

          // Create shop card (shown first)
          const shopCard = {
            id: shop._id,
            type: "shop",
            owner: { ...shop.owner, maxAppointmentsPerDay: totalMaxAppointments },
            staff: shop.staff || [],
            name: shop.name || "Unknown Shop",
            address: shop.address || "Location Unavailable",
            image: getValidImageUrl(shop.image),
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

          // Create individual barber cards (shown after shops)
          for (const barber of shopBarbers) {
            // Only include approved barbers
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

        // Handle independent barbers (not associated with shops)
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

        // Separate shops and barbers for display logic
        const shops = formattedData.filter(item => item.type === 'shop');
        const barbers = formattedData.filter(item => item.type === 'barber');

        // Set data - show shops initially (filtered by category)
        setAllProviders([...shops, ...barbers]);
        setAllBarbersData(barbers);
        setFilteredProviders(shops); // Show shops initially
      }
    } catch (err) {
      console.error("Failed to fetch providers", err);
      // Dummy data for visual demonstration if API fails or is empty
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
          approvalStatus: 'approved'
      }));
      setAllProviders(dummyData);
      setFilteredProviders(dummyData);
    }
    setLoading(false);
    setIsFetching(false);
  };

  const performSortAndFilter = (query, filters, serviceParam) => {
    let list = [...allProviders]; // Create a copy to avoid mutating original

    // Apply service-based filtering from URL parameter
    if (serviceParam) {
      console.log('Filtering by service:', serviceParam);
      console.log('Available providers before filtering:', list.length);
      list = list.filter(provider => {
        const hasService = provider.services && provider.services.some(service => {
          // Check if service has name property, or if service itself is a string
          const serviceName = typeof service === 'string' ? service : service.name;
          return serviceName && serviceName.toLowerCase().includes(serviceParam.toLowerCase());
        });
        if (hasService) {
          console.log('Provider has service:', provider.name, provider.services);
        }
        return hasService;
      });
      console.log('Available providers after filtering:', list.length);
    }

    // Apply category filtering - filter shops by category
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
    }

    // Apply availability filtering
    if (filters.includes('Online')) {
      list = list.filter(provider => provider.isAvailable);
    }
    if (filters.includes('Offline')) {
      list = list.filter(provider => !provider.isAvailable);
    }

    // Apply search query filtering (only if no service parameter is set)
    if (query && query.trim() && !serviceParam) {
      const searchTerm = query.toLowerCase().trim();
      list = list.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm) ||
        provider.address.toLowerCase().includes(searchTerm) ||
        provider.category.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
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
      // Default sorting by rating when no specific sort is selected
      list.sort((a, b) => b.rating - a.rating);
    }

    setFilteredProviders(list);
  };

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
    // Clear URL parameters
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

    // If it's a shop, open the modal to show barbers
    if (provider.type === 'shop') {
      setSelectedShop(provider);
      setIsModalOpen(true);
      return;
    }

    // If it's a barber, proceed with booking
    if (provider.isAvailable) {
      // Check if user is authenticated before allowing booking
      if (!isAuthenticated) {
        // Redirect to login page with return URL
        navigate('/login', {
          state: {
            returnTo: '/booking-appointment',
            barberData: provider
          }
        });
        return;
      }

      // User is authenticated, proceed with booking
      navigate('/booking-appointment', { state: { barberData: provider } });
    }
  };

  const handleBarberClick = (barber) => {
    // Close modal and navigate to booking
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
    { label: 'Barbers', value: 'barber', icon: User }, // Using User icon as generic for barber/person
    { label: 'Salons', value: 'women', icon: Sparkles },
    { label: 'Pet Care', value: 'petcare', icon: ShieldCheck },
  ];

  const filterOptions = [
    { label: 'Online', value: 'Online' },
    { label: 'Offline', value: 'Offline' },
    { label: 'Rating', value: 'Rating' },
    { label: 'Total Reviews', value: 'Number of Reviews' },
    { label: 'Average Time', value: 'Average Time' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#1F6FEB] selection:text-white relative">
      <CustomCursor />
      <Background />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 lg:py-12">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 lg:mb-16"
        >
          <div className="inline-flex items-center gap-2 mt-14 lg:mt-14 px-3 lg:px-4 py-1 lg:py-1.5 rounded-full bg-white/5 border border-white/10 text-[#1F6FEB] text-xs font-bold tracking-widest uppercase mb-4 backdrop-blur-md">
             <Sparkles size={12}/>
             <span>Premium Network</span>
          </div>
          <h1 className="text-3xl lg:text-7xl font-bold tracking-tight mb-4 lg:mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500 px-4 lg:px-0">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1F6FEB] to-[#3b82f6]">Perfect Match.</span>
          </h1>
          <p className="hidden lg:block text-base lg:text-lg text-gray-400 max-w-2xl mx-auto px-4 lg:px-0 leading-relaxed">
            Discover and book the highest rated professionals in your area. Real-time availability, instant booking.
          </p>
        </motion.div>

        {/* Search & Filter Dock */}
        <div className="relative mb-8 lg:mb-12">
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl lg:rounded-3xl p-3 lg:p-4 shadow-2xl shadow-black/50">
            <div className="flex flex-col md:flex-row gap-3 lg:gap-4 items-center">

              {/* Search Bar */}
              <div className="relative w-full md:flex-1 group">
                <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#1F6FEB] transition-colors w-4 h-4 lg:w-5 lg:h-5" />
                <input
                  type="text"
                  placeholder="Search by name or location..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-[#050505]/50 border border-white/10 rounded-xl lg:rounded-2xl py-3 lg:py-4 pl-10 lg:pl-12 pr-10 lg:pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1F6FEB]/50 focus:border-[#1F6FEB] transition-all text-sm lg:text-base"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearFilters}
                    className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                    title="Clear all filters"
                  >
                    <X size={14}  />
                  </button>
                )}
              </div>

              {/* Category Tabs - Desktop */}
              <div className="hidden md:flex bg-[#050505]/50 p-1.5 rounded-2xl border border-white/10">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleCategoryChange(opt.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
                      activeCategory === opt.value
                        ? 'bg-[#1F6FEB] text-white shadow-lg shadow-blue-900/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <opt.icon size={16} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Categories & Filters */}
            <div className="flex flex-col gap-3 lg:gap-4 mt-3 lg:mt-4 md:mt-0">
               {/* Mobile Categories */}
               <div className="flex md:hidden gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleCategoryChange(opt.value)}
                      className={`whitespace-nowrap px-3 lg:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeCategory === opt.value
                          ? 'bg-[#1F6FEB] text-white'
                          : 'bg-white/5 text-gray-400 border border-white/5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
               </div>

               {/* Advanced Filters */}
               <div className="pt-3 lg:pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    <Filter size={12} />
                    <span>Filters:</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {filterOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleFilterToggle(opt.value)}
                        className={`whitespace-nowrap px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 ${
                          activeFilters.includes(opt.value)
                            ? 'bg-[#FFB703]/10 border-[#FFB703] text-[#FFB703]'
                            : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#1F6FEB] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400 animate-pulse">Scanning network...</p>
            </div>
          ) : filteredProviders.length > 0 ? (
            <motion.div 
              layout 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
              <p className="text-gray-400">Try adjusting your filters or search area.</p>
            </div>
          )}
        </div>

        {/* Shop Details Modal */}
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

// --- ADDITIONAL UTILS ---

// Using Lucide User icon component which was imported
const UserIcon = ({className}) => <User className={className} />;

export default AllServicesSearch;
