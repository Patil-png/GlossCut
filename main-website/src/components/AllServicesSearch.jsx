import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Search, Clock, Sparkles,
  Zap, LayoutGrid, User,
  ShieldCheck, X
} from 'lucide-react';

// Sub-components
import ProviderCard from './ProviderCard';
import ShopDetailsModal from './ShopDetailsModal';

// API Cache and Request Management
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  apiCache.set(key, { data, timestamp: Date.now() });
};

// Request deduplication
const pendingRequests = new Map();

const dedupedRequest = async (key, requestFn) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
};

// Helper function to get valid image URL
export const getValidImageUrl = (imageField) => {
  if (typeof imageField === 'string' && imageField.trim()) {
    // Check for known local assets first
    if (imageField.includes('GlossCut.png') || imageField.includes('gloss_cut.png')) {
      return '/GlossCut.png';
    }
    if (imageField.startsWith('http://') || imageField.startsWith('https://')) {
      return imageField;
    }
    if (imageField.startsWith('/')) {
      return `${process.env.REACT_APP_API_URL}${imageField}`;
    }
    return imageField;
  }
  return '/GlossCut.png';
};

// --- VISUAL ASSETS ---

// Optimized Background: Removed complex blurs on moving objects for performance
// Optimized Background: Mobile Hero Style + Desktop Premium
const Background = memo(() => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-white overflow-hidden">
    {/* Base Gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />

    {/* 
        1. MOBILE BACKGROUND (Exact Replica from Home.jsx) 
        Visible only on screens < 1024px
    */}
    <div className="absolute inset-0 w-full h-full block lg:hidden">
      {/* Top Right - Stronger Brand Green Glow */}
      <div
        className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply"
        style={{
          background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)',
        }}
      />

      {/* Bottom Left - Rich Purple/Pink Accent */}
      <div
        className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply"
        style={{
          background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)',
        }}
      />

      {/* Center Right - Warm Golden Glow for vibrancy */}
      <div
        className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-25 mix-blend-multiply"
        style={{
          background: 'radial-gradient(circle, #f59e0b 0%, #eab308 100%)',
        }}
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
    </div>

    {/* 
        2. DESKTOP BACKGROUND (Animated Orbs)
        Visible only on screens >= 1024px 
    */}
    <div className="hidden lg:block absolute inset-0">
      <motion.div
        animate={{
          transform: ["translate(0px, 0px) scale(1)", "translate(20px, -20px) scale(1.1)", "translate(0px, 0px) scale(1)"]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#4C763B]/10 rounded-full blur-[80px]"
      />
      <motion.div
        animate={{
          transform: ["translate(0px, 0px) scale(1)", "translate(-20px, 30px) scale(1.2)", "translate(0px, 0px) scale(1)"]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 1 }}
        className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[90px]"
      />
      <div className="absolute bottom-[0%] right-[10%] w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[100px]" />
    </div>

    {/* Universal Noise Texture */}
    <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
  </div>
));

// Optimized Cursor: Dark for Light Theme
const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      requestAnimationFrame(() => {
        cursorX.set(e.clientX - 16);
        cursorY.set(e.clientY - 16);
      });
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 border border-gray-900/30 bg-gray-900/5 rounded-full pointer-events-none z-[9999] hidden md:block will-change-transform"
      style={{
        translateX: cursorXSpring,
        translateY: cursorYSpring,
      }}
    >
      <div className="absolute inset-0 bg-gray-900/10 rounded-full" />
    </motion.div>
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
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  const [serviceFilter, setServiceFilter] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allBarbersData, setAllBarbersData] = useState([]);
  const [rateLimited, setRateLimited] = useState(false);

  // Pagination / Progressive Loading State
  const [displayCount, setDisplayCount] = useState(12);
  const itemsPerPage = 12;

  const fetchProviders = useCallback(async () => {
    try {
      // Check cache first for shops data
      const shopsCacheKey = 'shops_all';
      let shopData = getCachedData(shopsCacheKey);

      if (!shopData) {
        const shopRes = await dedupedRequest(shopsCacheKey, () =>
          axios.get(`${process.env.REACT_APP_API_URL}/api/shop/all`)
        );
        shopData = shopRes.data;
        setCachedData(shopsCacheKey, shopData);
      }

      // Check cache first for barbers data
      const barbersCacheKey = 'barbers_all';
      let barberData = getCachedData(barbersCacheKey);

      if (!barberData) {
        const barberRes = await dedupedRequest(barbersCacheKey, () =>
          axios.get(`${process.env.REACT_APP_API_URL}/api/barber-card/all`)
        );
        barberData = barberRes.data;
        setCachedData(barbersCacheKey, barberData);
      }

      if (Array.isArray(shopData) && Array.isArray(barberData)) {
        // Use more efficient data processing with Maps for better performance
        const barberMap = new Map();
        barberData.forEach(barber => {
          if (barber.approvalStatus === 'approved') {
            if (barber.shopId) {
              if (!barberMap.has(barber.shopId)) {
                barberMap.set(barber.shopId, []);
              }
              barberMap.get(barber.shopId).push(barber);
            }
          }
        });

        const formattedData = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Efficient Data Processing & API Batching
        const allBarberIdsToFetch = new Set();
        const shopBarberMap = new Map(); // shopId -> [barberIds]

        // 1. Collect IDs from Shops
        for (const shop of shopData) {
          if (shop.approvalStatus !== 'approved') continue;

          // Identify barbers in this shop
          const shopBarbers = barberMap.get(shop._id) || [];
          const ids = [shop.owner._id, ...shopBarbers.map(b => b.barberId)].filter(id => id);

          if (ids.length > 0) {
            ids.forEach(id => allBarberIdsToFetch.add(id));
            shopBarberMap.set(shop._id, ids);
          }
        }

        // 2. Collect IDs from Independent Barbers
        const independentBarbers = barberData.filter(barber => !barber.shopId && barber.approvalStatus === 'approved');
        independentBarbers.forEach(barber => {
          if (barber.barberId) {
            allBarberIdsToFetch.add(barber.barberId);
          }
        });

        // 3. Smart Batch Fetching (Chunking Strategy)
        const masterBookingMap = new Map();

        if (isAuthenticated && allBarberIdsToFetch.size > 0) {
          try {
            const token = localStorage.getItem('customerAuthToken') || localStorage.getItem('barberAuthToken');
            if (token) {
              const uniqueIds = Array.from(allBarberIdsToFetch);
              const BATCH_SIZE = 50; // Safe URL length (50 IDs * ~24 chars = 1200 chars)
              const bookingPromises = [];

              // Create chunks
              for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
                const chunk = uniqueIds.slice(i, i + BATCH_SIZE);
                const chunkKey = `bookings_batch_${chunk[0]}_${chunk.length}_${today.toISOString().split('T')[0]}`; // Simple cache key based on first ID

                // Check if an identical batch request was cached (less likely but good practice)
                const cached = getCachedData(chunkKey);

                if (cached) {
                  bookingPromises.push(Promise.resolve({ data: cached }));
                } else {
                  bookingPromises.push(
                    dedupedRequest(chunkKey, () =>
                      axios.get(
                        `${process.env.REACT_APP_API_URL}/api/booking/barber-appointments-batch?barberIds=${chunk.join(',')}&date=${today.toISOString().split('T')[0]}`,
                        { headers: { 'x-auth-token': token } }
                      )
                    ).then(res => {
                      setCachedData(chunkKey, res.data);
                      return res;
                    })
                  );
                }
              }

              // Execute all batches in parallel
              const responses = await Promise.allSettled(bookingPromises);

              responses.forEach((res) => {
                if (res.status === 'fulfilled' && res.value?.data) {
                  Object.entries(res.value.data).forEach(([bId, count]) => {
                    masterBookingMap.set(bId, count);
                  });
                }
              });
            }
          } catch (error) {
            console.warn('Global batch booking fetch failed', error);
          }
        }

        // 4. Map Data to Cards (Shops)
        for (const shop of shopData) {
          if (shop.approvalStatus !== 'approved') continue;

          const shopBarbers = barberMap.get(shop._id) || [];
          let totalMaxAppointments = 0;

          if (shop.owner?.isAvailable) totalMaxAppointments += shop.owner.maxAppointmentsPerDay || 10;
          if (shop.staff) {
            shop.staff.forEach(staff => {
              if (staff.isAvailable) totalMaxAppointments += staff.maxAppointmentsPerDay || 10;
            });
          }

          // Aggregate booking counts from master map
          const ids = shopBarberMap.get(shop._id) || [];
          const shopBookingCount = ids.reduce((sum, id) => sum + (masterBookingMap.get(id) || 0), 0);

          const shopCard = {
            id: shop._id,
            type: "shop",
            owner: { ...shop.owner, maxAppointmentsPerDay: totalMaxAppointments },
            staff: shop.staff || [],
            name: shop.name || "Unknown Shop",
            address: shop.address || "Location Unavailable",
            phone: shop.phone || shop.owner?.phone,
            image: getValidImageUrl(shop.image || shop.owner?.profilePicture),
            rating: shop.rating || 0,
            reviews: shop.totalReviews || shop.reviews || 0,
            services: shop.services || [],
            category: shop.category || "Barber",
            tag: shop.tag,
            avgAppointmentTime: shop.avgAppointmentTime || "30 min",
            totalServices: shop.services?.length || 0,
            isAvailable: !!shop.isAvailable,
            todaysBookings: shopBookingCount,
            listingTier: shop.listingTier,
            totalBarbers: shop.totalBarbers || 1,
            shopRating: shop.shopRating || shop.rating || 0,
            approvalStatus: shop.approvalStatus,
          };
          formattedData.push(shopCard);

          for (const barber of shopBarbers) {
            const barberCard = {
              id: barber.id,
              type: "barber",
              barberId: barber.barberId,
              shopId: barber.shopId,
              name: barber.name || "Unknown Barber",
              address: barber.address || shop.address || "Location Unavailable",
              phone: shop.phone || barber.barberId?.phone,
              image: barber.image ? (typeof barber.image === 'object' ? barber.image.uri : getValidImageUrl(barber.image)) : (barber.barberId?.profilePicture ? getValidImageUrl(barber.barberId.profilePicture) : "https://via.placeholder.com/150"),
              rating: barber.rating || 0,
              reviews: Array.isArray(barber.reviews) ? barber.reviews.length : barber.reviews || 0,
              services: barber.services || [],
              category: barber.category || "General",
              tag: barber.specialties?.[0] || barber.tag || "General",
              avgAppointmentTime: barber.avgAppointmentTime || "30 min",
              totalServices: barber.services?.length || 0,
              isAvailable: barber.isAvailable && shop.isAvailable,
              todaysBookings: masterBookingMap.get(barber.barberId) || barber.todaysBookings || 0,
              shopName: barber.shopName || shop.name,
              listingTier: barber.listingTier,
              parentShopId: shop._id,
              owner: { _id: barber.barberId },
              approvalStatus: barber.approvalStatus,
            };
            formattedData.push(barberCard);
          }
        }

        // 5. Map Data to Cards (Independent Barbers)

        for (const barber of independentBarbers) {
          const barberCard = {
            id: barber.id,
            type: "barber",
            barberId: barber.barberId,
            shopId: null,
            name: barber.name || "Unknown Barber",
            address: barber.address || "No address",
            phone: barber.barberId?.phone,
            image: barber.image ? (typeof barber.image === 'object' ? barber.image.uri : getValidImageUrl(barber.image)) : (barber.barberId?.profilePicture ? getValidImageUrl(barber.barberId.profilePicture) : "https://via.placeholder.com/150"),
            rating: barber.rating || 0,
            reviews: Array.isArray(barber.reviews) ? barber.reviews.length : barber.reviews || 0,
            services: barber.services || [],
            category: barber.category || "General",
            tag: barber.specialties?.[0] || barber.tag || "General",
            avgAppointmentTime: barber.avgAppointmentTime || "30 min",
            totalServices: barber.services?.length || 0,
            isAvailable: barber.isAvailable,
            todaysBookings: masterBookingMap.get(barber.barberId) || barber.todaysBookings || 0,
            shopName: barber.shopName || "Independent",
            listingTier: barber.listingTier,
            parentShopId: null,
            owner: { _id: barber.barberId },
            approvalStatus: barber.approvalStatus,
          };
          formattedData.push(barberCard);
        }

        // Separate shops and barbers more efficiently
        const shops = [];
        const barbers = [];

        for (const item of formattedData) {
          if (item.type === 'shop') {
            shops.push(item);
          } else {
            barbers.push(item);
          }
        }

        setAllProviders([...shops, ...barbers]);
        setAllBarbersData(barbers);
      }
    } catch (err) {
      console.error("Failed to fetch providers", err);
      if (err.response?.status === 429) {
        setRateLimited(true);
      } else {
        // Dummy data retained for robustness
        const dummyData = Array.from({ length: 6 }).map((_, i) => ({
          id: `dummy-${i}`,
          name: `Elite Studio ${i + 1}`,
          address: `${100 + i} Fashion Avenue, Downtown`,
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
      }
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const service = searchParams.get('service');
    if (service) {
      setServiceFilter(service);
      navigate('/all-services-search', { replace: true });
    }
  }, [navigate, searchParams]);

  // Separate useEffect for shopId or barberId to ensure it runs after allProviders is loaded
  useEffect(() => {
    // Check for shopId parameter to auto-open shop modal
    const shopId = searchParams.get('shopId');
    const barberId = searchParams.get('barberId');

    if (allProviders.length > 0 && !loading) {
      let shop = null;

      if (shopId) {
        // Find shop by shopId
        shop = allProviders.find(provider => provider.type === 'shop' && provider.id === shopId);
      } else if (barberId) {
        // Find shop by barberId (owner or staff)
        shop = allProviders.find(provider =>
          provider.type === 'shop' &&
          (provider.owner?._id === barberId || (provider.staff && provider.staff.some(staff => staff._id === barberId)))
        );
      }

      if (shop) {
        setSelectedShop(shop);
        setIsModalOpen(true);
        // Remove parameters from URL after opening modal
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('shopId');
        newSearchParams.delete('barberId');
        navigate('/all-services-search?' + newSearchParams.toString(), { replace: true });
      }
    }
  }, [searchParams, allProviders, loading, navigate]);

  // Memoize filtered and sorted providers to prevent unnecessary recalculations
  const filteredProviders = useMemo(() => {
    let list = [...allProviders];

    // Service filter (from URL params)
    if (serviceFilter) {
      list = list.filter(provider => {
        const hasService = provider.services && provider.services.some(service => {
          const serviceName = typeof service === 'string' ? service : service.name;
          return serviceName && serviceName.toLowerCase().includes(serviceFilter.toLowerCase());
        });
        return hasService;
      });
    }

    // Category filter
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

    // Status filters
    if (activeFilters.includes('Online')) {
      list = list.filter(provider => provider.isAvailable);
    }
    if (activeFilters.includes('Offline')) {
      list = list.filter(provider => !provider.isAvailable);
    }

    // Search query filter (only if not using service filter)
    if (searchQuery && searchQuery.trim() && !serviceFilter) {
      const searchTerm = searchQuery.toLowerCase().trim();
      list = list.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm) ||
        provider.address.toLowerCase().includes(searchTerm) ||
        provider.category.toLowerCase().includes(searchTerm)
      );
    }

    // Sorting
    if (activeFilters.includes('Rating')) {
      list.sort((a, b) => b.rating - a.rating);
    } else if (activeFilters.includes('Number of Reviews')) {
      list.sort((a, b) => b.reviews - a.reviews);
    } else if (activeFilters.includes('Average Time')) {
      list.sort((a, b) => {
        const timeA = parseInt(a.avgAppointmentTime.replace(/\D/g, '')) || 0;
        const timeB = parseInt(b.avgAppointmentTime.replace(/\D/g, '')) || 0;
        return timeA - timeB;
      });
    } else {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [allProviders, activeCategory, activeFilters, searchQuery, serviceFilter]);

  // Progressive Loading Logic
  const visibleProviders = useMemo(() => {
    return filteredProviders.slice(0, displayCount);
  }, [filteredProviders, displayCount]);

  const loadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + itemsPerPage, filteredProviders.length));
  }, [filteredProviders.length]);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(itemsPerPage);
  }, [searchQuery, activeFilters, activeCategory, serviceFilter]);


  // Callbacks memoized to avoid re-rendering children
  const handleFilterToggle = useCallback((filter) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  }, []);

  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
  }, []);

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

  const handleCardClick = useCallback((provider) => {
    // Navigation / Modal Logic
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
  }, [isAuthenticated, navigate]);

  const handleBarberClick = useCallback((barber) => {
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
  }, [isAuthenticated, navigate]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedShop(null);
  }, []);

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
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] relative overflow-x-hidden">
      <Helmet>
        <title>Find Best Salons & Barbers | GlossCut Search</title>
        <meta name="description" content="Search top-rated salons, barbers, and spas near you. Compare prices, check availability, and book appointments instantly." />
      </Helmet>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <CustomCursor />
      <Background />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* Header Section */}
        <div className="flex flex-col items-center justify-center text-center mb-12 mt-20 md:mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4C763B]/5 border border-[#4C763B]/20 text-[#4C763B] text-xs font-bold backdrop-blur-md mb-6 hover:bg-[#4C763B]/10 transition-colors cursor-default"
          >
            <Zap size={12} className="text-[#4C763B] fill-[#4C763B]" />
            <span>The Premium Booking Network</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 text-gray-900"
          >
            Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C763B] to-green-600">perfect match.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-lg max-w-2xl leading-relaxed"
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
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl md:rounded-full p-2 shadow-xl shadow-gray-200/50 ring-1 ring-gray-200/50">
            <div className="flex flex-col md:flex-row gap-2">

              {/* Search Bar */}
              <div className="relative flex-1 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4C763B] transition-colors">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search professionals, services, or locations..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full h-12 md:h-14 bg-gray-50 md:bg-transparent border border-gray-100 md:border-none rounded-xl md:rounded-none pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all text-sm md:text-base font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearFilters}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="hidden md:block w-px h-8 bg-gray-200 self-center mx-2"></div>

              {/* Desktop Categories */}
              <div className="hidden md:flex bg-gray-100 rounded-full p-1 border border-gray-200">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleCategoryChange(opt.value)}
                    className={`
                      relative px-5 h-12 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300
                      ${activeCategory === opt.value ? 'text-[#4C763B]' : 'text-gray-500 hover:text-gray-900'}
                    `}
                  >
                    {activeCategory === opt.value && (
                      <motion.div
                        layoutId="activeCategory"
                        className="absolute inset-0 bg-white rounded-full shadow-sm border border-gray-200/50"
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
            <div className="md:hidden mt-2 pt-2 border-t border-gray-200 px-1 pb-1">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleCategoryChange(opt.value)}
                    className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeCategory === opt.value
                      ? 'bg-[#4C763B] text-white shadow-lg shadow-[#4C763B]/20'
                      : 'bg-white text-gray-600 border border-gray-200'
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
                        whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-300
                        ${activeFilters.includes(opt.value)
                      ? 'bg-[#4C763B]/10 border-[#4C763B]/30 text-[#4C763B]'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900 shadow-sm'
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
          {rateLimited ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50 rounded-3xl border border-dashed border-red-200">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Rate Limit Exceeded</h3>
              <p className="text-red-400 max-w-sm mb-4">Too many requests from this IP. Please wait 15 minutes before trying again.</p>
              <p className="text-gray-500 text-sm">The rate limit will reset automatically.</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={`skeleton-${i}`} className="bg-[#0a0a0a] border border-white/5 rounded-[1.5rem] overflow-hidden h-[420px] animate-pulse relative">
                  {/* Image Skeleton */}
                  <div className="h-56 bg-zinc-900/50" />

                  {/* Content Skeleton */}
                  <div className="p-5 flex flex-col h-[calc(100%-14rem)]">
                    <div className="h-7 w-3/4 bg-zinc-800/50 rounded-lg mb-3" />
                    <div className="h-4 w-1/2 bg-zinc-900/50 rounded mb-6" />

                    {/* Tags */}
                    <div className="flex gap-2 mb-6">
                      <div className="h-6 w-16 bg-zinc-900/50 rounded-md" />
                      <div className="h-6 w-20 bg-zinc-900/50 rounded-md" />
                      <div className="h-6 w-14 bg-zinc-900/50 rounded-md" />
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-zinc-900/50 rounded" />
                        <div className="h-3 w-16 bg-zinc-900/50 rounded" />
                      </div>
                      <div className="h-10 w-24 bg-zinc-800/50 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : visibleProviders.length > 0 ? (
            <>
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8"
              >
                <AnimatePresence mode="popLayout">
                  {visibleProviders.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      onClick={handleCardClick}

                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Infinite Scroll Sentinel */}
              <div
                ref={(node) => {
                  if (node && visibleProviders.length < filteredProviders.length) {
                    const observer = new IntersectionObserver(
                      (entries) => {
                        if (entries[0].isIntersecting) {
                          loadMore();
                        }
                      },
                      { threshold: 0.1, rootMargin: '100px' } // Load before reaching exact bottom
                    );
                    observer.observe(node);
                    return () => observer.disconnect();
                  }
                }}
                className="h-20 w-full flex items-center justify-center"
              >
                {visibleProviders.length < filteredProviders.length && (
                  <div className="w-6 h-6 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
                )}
              </div>
            </>
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
