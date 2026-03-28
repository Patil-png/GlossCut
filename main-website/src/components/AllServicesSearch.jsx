import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Search, Clock, Sparkles,
  Zap, User,
  ShieldCheck, X, ChevronRight,
  MousePointerClick, MapPinOff, MapPin,
  Smartphone, Monitor, Info, Settings2
} from 'lucide-react';

// Sub-components
import ProviderCard from './ProviderCard';
import ShopDetailsModal from './ShopDetailsModal';

// API Cache and Request Management (Persisted across refreshes via sessionStorage)
const STALE_TIME = 2 * 60 * 1000; // 2 minutes (Industry best practice for dynamic search)
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (Total survival in storage)

const getCachedData = (key) => {
  // 1. Try Memory Map first (fastest)
  const cached = apiCache.get(key);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    return { data: cached.data, isFresh: age < STALE_TIME };
  }

  // 2. Try Session Storage (persists across refreshes)
  try {
    const sessionData = sessionStorage.getItem(`cache_${key}`);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      const age = Date.now() - parsed.timestamp;
      if (age < CACHE_DURATION) {
        apiCache.set(key, parsed); // Sync back to memory
        return { data: parsed.data, isFresh: age < STALE_TIME };
      }
    }
  } catch (e) { console.warn("Cache read failed", e); }
  return { data: null, isFresh: false };
};

const setCachedData = (key, data) => {
  const payload = { data, timestamp: Date.now() };
  apiCache.set(key, payload);
  try {
    sessionStorage.setItem(`cache_${key}`, JSON.stringify(payload));
  } catch (e) { console.warn("Cache write failed", e); }
};

const apiCache = new Map();

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
// --- STYLING UTILITIES ---
const Shimmer = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent shadow-[0_0_40px_rgba(255,255,255,0.3)]" />
);

// Optimized Background: Removed complex blurs on moving objects for performance
// Optimized Background: Mobile Hero Style + Desktop Premium
// --- 1. Light Premium Background (Orbs + Noise) ---
const Background = memo(() => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
    <div className="absolute inset-0 w-full h-full block lg:hidden z-0 overflow-hidden">
      <div className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }} />
      <div className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)' }} />
      <div className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[80px] opacity-25 mix-blend-multiply" style={{ background: 'radial-gradient(circle, #f59e0b 0%, #eab308 100%)' }} />
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
    </div>
    <div className="hidden lg:block absolute inset-0 w-full h-full z-0 overflow-hidden bg-gray-50">
      <div className="absolute inset-0 bg-gray-100/60" />
      <div
        className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-30 mix-blend-multiply animate-float"
        style={{ background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)' }}
      />
      <div
        className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-25 mix-blend-multiply animate-float-delayed"
        style={{ background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)' }}
      />
      <div
        className="absolute top-[30%] left-[20%] w-[30vw] h-[30vw] rounded-full blur-[90px] opacity-15 mix-blend-multiply animate-float-slow"
        style={{ background: 'radial-gradient(circle, #86efac 0%, #4ade80 100%)' }}
      />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
    </div>
  </div>
));


// --- HELPER: HAVERSINE DISTANCE (AIR DISTANCE) ---
const getAirDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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
    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("mousemove", moveCursor);
    }
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 border border-gray-900/30 bg-gray-900/5 rounded-full pointer-events-none z-[9999] hidden md:block will-change-transform"
      style={{ translateX: cursorXSpring, translateY: cursorYSpring }}
    >
      <div className="absolute inset-0 bg-gray-900/10 rounded-full" />
    </motion.div>
  );
};

// --- CONFIGURATION ---
const CATEGORY_OPTIONS = [
  { label: 'Mens', value: 'barber', icon: User },
  { label: 'Womens', value: 'women', icon: Sparkles },
  { label: 'Pet Care', value: 'petcare', icon: ShieldCheck },
];

const FILTER_OPTIONS = [
  { label: 'Online Now', value: 'Online' },
  { label: 'Top Rated', value: 'Rating' },
  { label: 'Most Reviewed', value: 'Number of Reviews' },
  { label: 'Fastest Service', value: 'Average Time' },
];

const AllServicesSearch = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // --- ORIGINAL STATE LOGIC PRESERVED ---
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [allProviders, setAllProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('barber');

  const [serviceFilter, setServiceFilter] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allBarbersData, setAllBarbersData] = useState([]);
  const [rateLimited, setRateLimited] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [showLocationGuide, setShowLocationGuide] = useState(false);

  // Search Debounce Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Pagination State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isMobile ? 5 : 9;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- DISTANCE STATE ---
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('last_user_location');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });
  const [airDistances, setAirDistances] = useState({});

  // --- PROVIDER FILTERING & PAGINATION (Relocated for correctly using Visibility deps) ---
  // Memoize filtered and sorted providers to prevent unnecessary recalculations
  const filteredProviders = useMemo(() => {
    if (!activeCategory) return [];
    let list = [...allProviders];

    // Service/Category filter (from URL params)
    if (serviceFilter) {
      const lowerFilter = serviceFilter.toLowerCase();
      list = list.filter(provider => {
        // 1. Check if ANY service name or service category matches
        const hasMatchingService = provider.services && provider.services.some(service => {
          const serviceName = (typeof service === 'string' ? service : service.name) || '';
          const serviceCat = (typeof service === 'object' ? service.category : '') || '';
          return serviceName.toLowerCase().includes(lowerFilter) ||
            serviceCat.toLowerCase().includes(lowerFilter);
        });

        // 2. Check if the shop's own category matches
        const shopCatMatches = provider.category && provider.category.toLowerCase().includes(lowerFilter);

        return hasMatchingService || shopCatMatches;
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
    if (debouncedSearchQuery && debouncedSearchQuery.trim() && !serviceFilter) {
      const searchTerm = debouncedSearchQuery.toLowerCase().trim();
      list = list.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm) ||
        provider.address.toLowerCase().includes(searchTerm) ||
        provider.category.toLowerCase().includes(searchTerm)
      );
    }

    // --- OPTIMIZED SORTING ENGINE ---
    // Pre-calculate distance map once to avoid expensive Lookups inside sort comparison
    const distanceScoreMap = new Map();
    list.forEach(item => {
      const pId = item.id || item._id;
      const dist = parseFloat(airDistances[pId] || 99999);
      distanceScoreMap.set(pId, dist);
    });

    list.sort((a, b) => {
      // 1. Global Priority (Pinned to top)
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;

      // 2. Existing Sorting Logic
      if (activeFilters.includes('Rating')) {
        return (b.rating || 0) - (a.rating || 0);
      } else if (activeFilters.includes('Number of Reviews')) {
        return (b.reviews || 0) - (a.reviews || 0);
      } else if (activeFilters.includes('Average Time')) {
        const timeA = parseInt(a.avgAppointmentTime?.replace(/\D/g, '') || '0');
        const timeB = parseInt(b.avgAppointmentTime?.replace(/\D/g, '') || '0');
        return timeA - timeB;
      } else {
        // Default: Preserve backend order (Truly Closest 9 as pre-sorted by API)
        // Only fallback to distance calculation if airDistances are already known
        const distA = distanceScoreMap.get(a.id || a._id);
        const distB = distanceScoreMap.get(b.id || b._id);
        if (distA !== undefined && distB !== undefined && distA !== 99999) {
          return distA - distB;
        }
        return 0; // Keep original API order
      }
    });

    // Final De-duplication Safety (Client-side defense)
    const uniqueIds = new Set();
    list = list.filter(provider => {
      const pId = provider.id || provider._id;
      if (!pId || uniqueIds.has(pId)) return false;
      uniqueIds.add(pId);
      return true;
    });

    return list;
  }, [allProviders, activeCategory, activeFilters, debouncedSearchQuery, serviceFilter, airDistances]);

  const visibleProviders = useMemo(() => {
    return filteredProviders.slice(0, currentPage * itemsPerPage);
  }, [filteredProviders, currentPage, itemsPerPage]);

  const fetchProviders = useCallback(async (lat, lng, pageToFetch = 1) => {
    try {
      const shopsCacheKey = (lat && lng) ? `shops_near_${lat.toFixed(3)}_${lng.toFixed(3)}_page_${pageToFetch}` : `shops_all_page_${pageToFetch}`;
      const barbersCacheKey = `barbers_all_page_${pageToFetch}`;

      const { data: cachedShops, isFresh: shopsFresh } = getCachedData(shopsCacheKey);
      const { data: cachedBarbers, isFresh: barbersFresh } = getCachedData(barbersCacheKey);
      
      let shopData = cachedShops;
      let barberData = cachedBarbers;
      const masterBookingMap = new Map();

      // --- ENTERPRISE THROTTLING: Skip server hit if data is < 2 mins old ---
      if (shopsFresh && barbersFresh && pageToFetch === 1) {
        // Data is fresh enough, we don't need to burden the VPS with another search
        console.log(`🚀 Efficiency: Serving "Fresh" Page 1 from Local Memory.`);
      } else if (!shopData || !barberData || !shopsFresh || !barbersFresh) {
        // Fetch only if strictly needed (Stale or Missing)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const statsUrl = `${process.env.REACT_APP_API_URL}/api/booking/todays-stats?date=${today.toISOString().split('T')[0]}`;
        const token = localStorage.getItem('customerAuthToken') || localStorage.getItem('barberAuthToken');

        // --- BLAZING FAST PARALLEL FETCHING: Fetch everything in ONE round-trip ---
        const shopUrl = (lat && lng)
          ? `${process.env.REACT_APP_API_URL}/api/shop/all?userLat=${lat}&userLng=${lng}&limit=${itemsPerPage}&page=${pageToFetch}`
          : `${process.env.REACT_APP_API_URL}/api/shop/all?limit=${itemsPerPage}&page=${pageToFetch}`;

        const [shopRes, barberRes, statsRes] = await Promise.all([
          !shopData ? dedupedRequest(shopsCacheKey, () => axios.get(shopUrl)) : Promise.resolve({ data: shopData }),
          !barberData ? dedupedRequest(barbersCacheKey, () => axios.get(`${process.env.REACT_APP_API_URL}/api/barber-card/all?limit=${itemsPerPage}&page=${pageToFetch}`)) : Promise.resolve({ data: barberData }),
          dedupedRequest('global_stats', () => axios.get(statsUrl, token ? { headers: { 'x-auth-token': token } } : {}))
        ]);

        if (!shopData) {
          shopData = shopRes.data;
          setCachedData(shopsCacheKey, shopData);
        }
        if (!barberData) {
          barberData = barberRes.data;
          setCachedData(barbersCacheKey, barberData);
        }
        
        // Populate stats immediately
        if (statsRes?.data) {
          Object.entries(statsRes.data).forEach(([bId, count]) => masterBookingMap.set(bId, count));
        }
      }

      if (Array.isArray(shopData) && Array.isArray(barberData)) {
        // --- PRE-PROCESSING: O(N) Maps for O(1) Access ---
        const barberMap = new Map();
        const independentBarbers = [];

        barberData.forEach(barber => {
          if (barber.approvalStatus === 'approved') {
            if (barber.shopId) {
              if (!barberMap.has(barber.shopId)) barberMap.set(barber.shopId, []);
              barberMap.get(barber.shopId).push(barber);
            } else {
              independentBarbers.push(barber);
            }
          }
        });

        const shops = [];
        const barbers = [];

        // --- SINGLE PASS MAPPING: Shops & Their Barbers ---
        for (const shop of shopData) {
          if (shop.approvalStatus !== 'approved') continue;

          const shopBarbers = barberMap.get(shop._id) || [];

          // Pre-calculate aggregate stats
          let totalMaxAppointments = 0;
          if (shop.owner?.isAvailable) totalMaxAppointments += shop.owner.maxAppointmentsPerDay || 10;
          if (shop.staff) {
            shop.staff.forEach(staff => {
              if (staff.isAvailable) totalMaxAppointments += staff.maxAppointmentsPerDay || 10;
            });
          }

          // Build ID list for booking aggregate
          const shopStaffIds = [shop.owner?._id, ...shopBarbers.map(b => b.barberId)].filter(Boolean);
          const shopBookingCount = shopStaffIds.reduce((sum, id) => sum + (masterBookingMap.get(id) || 0), 0);

          const shopCard = {
            id: shop._id,
            _id: shop._id,
            type: "shop",
            owner: { ...shop.owner, maxAppointmentsPerDay: totalMaxAppointments },
            staff: shop.staff || [],
            name: shop.name || "Unknown Shop",
            address: shop.address || "Location Unavailable",
            location: shop.location,
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
            isPriority: !!shop.isPriority,
            totalBarbers: shop.totalBarbers || 1,
            shopRating: shop.shopRating || shop.rating || 0,
            approvalStatus: shop.approvalStatus,
            shopImages: shop.shopImages || [],
          };
          shops.push(shopCard);

          for (const barber of shopBarbers) {
            barbers.push({
              id: barber._id || barber.id,
              _id: barber._id || barber.id,
              type: "barber",
              barberId: barber.barberId,
              shopId: barber.shopId,
              location: barber.location,
              name: barber.name || "Unknown Barber",
              address: barber.address || shop.address || "Location Unavailable",
              phone: shop.phone || barber.barberId?.phone,
              image: barber.image ? (typeof barber.image === 'object' ? barber.image.uri : getValidImageUrl(barber.image)) : (barber.barberId?.profilePicture ? getValidImageUrl(barber.barberId.profilePicture) : "/GlossCut.png"),
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
            });
          }
        }

        // --- INDEPENDENT BARBERS ---
        for (const barber of independentBarbers) {
          barbers.push({
            id: barber._id || barber.id,
            _id: barber._id || barber.id,
            type: "barber",
            barberId: barber.barberId,
            shopId: null,
            location: barber.location,
            name: barber.name || "Unknown Barber",
            address: barber.address || "No address",
            phone: barber.barberId?.phone,
            image: barber.image ? (typeof barber.image === 'object' ? barber.image.uri : getValidImageUrl(barber.image)) : (barber.barberId?.profilePicture ? getValidImageUrl(barber.barberId.profilePicture) : "/GlossCut.png"),
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
          });
        }

        // 1. SMART UPDATE: If it's the 1st page (Refresh), REPLACE everything for accuracy.
        // If it's Page 2+, APPEND for seamless scrolling.
        const newBatch = [...shops, ...barbers];

        if (pageToFetch === 1) {
          setAllProviders(newBatch);
          setAllBarbersData(barbers);
        } else {
          setAllProviders(prev => {
            const existingIds = new Set(prev.map(p => p.id || p._id));
            const uniqueNew = newBatch.filter(p => !existingIds.has(p.id || p._id));
            return [...prev, ...uniqueNew];
          });

          setAllBarbersData(prev => {
            const existingIds = new Set(prev.map(b => b.id || b._id));
            const uniqueNewBarbers = barbers.filter(b => !existingIds.has(b.id || b._id));
            return [...prev, ...uniqueNewBarbers];
          });
        }
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
  }, [itemsPerPage]);


  // --- EFFECT: CHECK PERMISSION STATUS ---
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setPermissionState(result.state);
        result.onchange = () => setPermissionState(result.state);
      });
    }
  }, []);

  const requestLocationPermission = useCallback(() => {
    // --- INSTANT BOOTSTRAP: Use Cached Data if available ---
    const initialLat = userLocation?.latitude;
    const initialLng = userLocation?.longitude;
    
    // If we have a stored location, fetch immediately to skip the 5s GPS wait
    if (initialLat && initialLng) {
      fetchProviders(initialLat, initialLng);
    } else {
      fetchProviders(); // Fallback to IP-based proximty guessing in backend
    }

    if (window.navigator.geolocation) {
      window.navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newLoc = { latitude: lat, longitude: lng };
          setUserLocation(newLoc);
          try {
            localStorage.setItem('last_user_location', JSON.stringify(newLoc));
          } catch (e) {}
          
          setLocationDenied(false);
          setPermissionState('granted');
          
          // --- REFINEMENT: Update once GPS is exact ---
          fetchProviders(lat, lng);
        },
        (error) => {
          console.warn("GPS Refinement failed, staying with fallback:", error.message);
          if (error.code === 1) { 
            setLocationDenied(true);
            setPermissionState('denied');
          }
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    } else {
      setLocationDenied(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProviders]);

  // --- EFFECT: FETCH USER LOCATION THEN LOAD PROVIDERS ---
  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  // --- EFFECT: FETCH CURRENT PAGE DATA ON PAGE CHANGE ---
  useEffect(() => {
    if (currentPage > 1 && userLocation) {
      setLoading(true);
      fetchProviders(userLocation.latitude, userLocation.longitude, currentPage).finally(() => setLoading(false));
    }
  }, [currentPage, userLocation, fetchProviders]);

  useEffect(() => {
    // Recalculate air distances when new providers are added
    const canCalculate = userLocation && allProviders.length > 0;

    if (canCalculate) {
      // --- 1. LAZY AIR DISTANCES (Only for Visible Items) ---
      const airMap = { ...airDistances };
      let newlyAdded = false;

      // PERFORMANCE FIX: Only calculate for what's actually on screen or about to be (visibleProviders)
      visibleProviders.forEach(p => {
        const id = p.id || p._id;
        if (!airMap[id] && p.location?.coordinates?.length === 2 && (p.location.coordinates[0] !== 0 || p.location.coordinates[1] !== 0)) {
          const dist = getAirDistance(
            userLocation.latitude,
            userLocation.longitude,
            p.location.coordinates[1],
            p.location.coordinates[0]
          );
          airMap[id] = dist.toFixed(1);
          newlyAdded = true;
        }
      });
      if (newlyAdded) {
        setAirDistances(airMap);
      }
    }
  }, [userLocation, visibleProviders, airDistances, allProviders.length]);

  // --- 2. LAZY ROAD DISTANCES (On-Demand for Visible Items Only) ---
  useEffect(() => {
    // OPTIMIZATION for 500 concurrent users: Disabled automatic UI-blocking OSRM requests.
    // Relying on lightning-fast Air Distance for the search grid.
    return;
  }, [userLocation, visibleProviders, allProviders]);

  useEffect(() => {
    const service = searchParams.get('service');
    if (service) {
      setServiceFilter(service);
      setActiveCategory('all');
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


  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
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
    setActiveCategory('barber');
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

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#4C763B]/30 selection:text-[#4C763B] relative overflow-x-hidden">
      <Helmet>
        <title>{searchQuery && searchQuery.trim()
          ? (searchQuery.toLowerCase().includes('near me')
            ? `Top Rated ${searchQuery} | Real-Time Booking | GlossCut`
            : `Best Salon Booking: ${searchQuery} | GlossCut`)
          : "Find Best Salons & Barbers | GlossCut Search"}
        </title>
        <meta name="description" content={searchQuery && searchQuery.trim()
          ? (searchQuery.toLowerCase().includes('near me')
            ? `Finding a ${searchQuery} has never been easier. Skip the wait and book instantly at top-rated local shops on GlossCut.`
            : `Book appointments at ${searchQuery} instantly on GlossCut. Compare prices, check real-time availability, and skip the wait.`)
          : "Search top-rated salons, barbers, and spas near you. Compare prices, check availability, and book appointments instantly."}
        />
        <link rel="canonical" href="https://www.glosscut.com/all-services-search" />
      </Helmet>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes premium-aura {
          0%, 100% { box-shadow: 0 0 15px rgba(76, 118, 59, 0.15); border-color: rgba(76, 118, 59, 0.3); }
          50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.4); border-color: rgba(34, 197, 94, 0.6); }
        }
        @keyframes float-guide {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-premium-aura {
          animation: premium-aura 3s infinite ease-in-out;
        }
        .animate-float-guide {
          animation: float-guide 3s infinite ease-in-out;
        }
        .shimmer-overlay { display: none; }
        
        /* Custom Premium Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(76, 118, 59, 0.2);
          border-radius: 10px;
          transition: background 0.3s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(76, 118, 59, 0.4);
        }
        
        body {
          overflow-x: hidden;
          scroll-behavior: smooth;
        }
      `}</style>

      <CustomCursor />
      <Background />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* Hero Section - Immersive & Premium */}
        <div className="flex flex-col items-center justify-center text-center mb-8 md:mb-10 mt-20 md:mt-32 px-4 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/40 backdrop-blur-xl border border-white/60 text-[#4C763B] text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 shadow-xl shadow-gray-200/20"
          >
            <div className="w-2 h-2 rounded-full bg-[#4C763B] animate-pulse" />
            <span>The Premium Booking Network</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 text-gray-900 max-w-5xl leading-[0.95] md:leading-[0.9]"
          >
            Find your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#4C763B] via-green-600 to-emerald-700">
              perfect match.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-xs md:text-lg max-w-2xl leading-relaxed font-medium"
          >
            Discover top-rated local professionals. Real-time availability, <br className="hidden md:block" />
            verified reviews, and instant booking confirmation.
          </motion.p>
        </div>


        {/* Floating Dock: Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky top-24 md:top-28 z-40 mb-3 md:mb-12"
        >
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl md:rounded-[2.5rem] p-2.5 md:p-2 shadow-xl shadow-gray-200/50 border border-white/20 relative overflow-hidden group">
            <div className="flex flex-col md:flex-row gap-3 md:gap-2">

              {/* Search Bar */}
              <div className="relative flex-1 group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4C763B] transition-colors z-10">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Service, Shop, or Area..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full h-11 md:h-14 bg-gray-50/50 md:bg-transparent border border-gray-100 md:border-none rounded-xl md:rounded-none pl-12 pr-10 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4C763B]/10 md:focus:ring-0 transition-all text-sm md:text-base font-bold"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearFilters}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="hidden md:block w-px h-10 bg-gray-200 self-center mx-4"></div>

              {/* Desktop Categories */}
              <div className="relative group">
                {!activeCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#4C763B] text-white px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/40 animate-float-guide z-50 pointer-events-none border border-white/20"
                  >
                    Click to Start <span className="ml-1">👇</span>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#4C763B] rotate-45 border-b border-r border-white/20"></div>
                  </motion.div>
                )}
                <div
                  className={`hidden md:flex relative overflow-hidden bg-gray-100 rounded-full p-1 border transition-all duration-500 ${!activeCategory ? 'animate-premium-aura' : 'border-gray-200'}`}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleCategoryChange(opt.value)}
                      className={`
                        relative px-6 h-12 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300
                        ${activeCategory === opt.value
                          ? 'text-[#4C763B]'
                          : !activeCategory
                            ? 'text-gray-900 hover:bg-white hover:shadow-lg hover:scale-105 active:scale-95'
                            : 'text-gray-500 hover:text-gray-900'
                        }
                      `}
                    >
                      {activeCategory === opt.value && (
                        <motion.div
                          layoutId="activeCategory"
                          className="absolute inset-0 bg-white rounded-full shadow-sm border border-gray-200/50 animate-premium-aura"
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
            </div>

            {/* Mobile Categories & Filters (Inside the dock on mobile) */}
            <div className="md:hidden mt-2 pt-2 border-t border-gray-200 px-1 pb-1 relative">
              {!activeCategory && (
                <div className="text-[10px] font-black text-[#4C763B] uppercase mb-2 animate-pulse flex items-center gap-1">
                  <MousePointerClick size={10} /> Choose your service below
                </div>
              )}
              {/* Mobile-Optimized Segmented Control */}
              <div className="flex md:hidden bg-gray-100/50 p-1 rounded-xl gap-1">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleCategoryChange(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-black transition-all ${activeCategory === opt.value
                      ? 'bg-white text-[#4C763B] shadow-md ring-1 ring-gray-200 scale-[1.02]'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    <opt.icon size={11} className={activeCategory === opt.value ? 'text-[#4C763B]' : 'text-gray-400'} />
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Desktop Toggles */}
              <div className="hidden md:flex flex-wrap justify-center gap-2 pb-2">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleCategoryChange(opt.value)}
                    className={`whitespace-nowrap px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center gap-1.5 md:gap-2 ${activeCategory === opt.value
                      ? 'bg-[#4C763B] text-white shadow-lg shadow-[#4C763B]/20 animate-premium-aura'
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
        </motion.div>


        {/* Primary Filter Pill Section */}
        <div className="flex justify-center mb-2 md:mb-12 mt-2 md:-mt-6 relative z-30">
          <div className="flex md:flex-wrap flex-nowrap md:justify-center justify-start gap-2.5 px-4 overflow-x-auto scrollbar-hide max-w-full pb-3 md:pb-0">
            {FILTER_OPTIONS.map((opt) => {
              const Icon = opt.value === 'Online' ? Clock :
                opt.value === 'Rating' ? Sparkles :
                  opt.value === 'Number of Reviews' ? User :
                    opt.value === 'Average Time' ? Zap : Sparkles;

              const isActive = activeFilters.includes(opt.value);

              return (
                <button
                  key={opt.value}
                  onClick={() => handleFilterToggle(opt.value)}
                  className={`
                    group relative flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black tracking-tight transition-all duration-300 whitespace-nowrap
                    ${isActive
                      ? 'bg-[#4C763B] text-white shadow-xl shadow-emerald-500/20 scale-105 ring-1 ring-emerald-500/10'
                      : 'bg-white border border-gray-100 text-gray-700 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-md hover:-translate-y-0.5'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="filter-aura"
                      className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"
                    />
                  )}
                  <Icon size={12} className={`${isActive ? 'text-emerald-200' : 'text-gray-400 group-hover:text-emerald-500'} transition-colors`} />
                  <span className="relative z-10">{opt.label}</span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-1 h-1 bg-white rounded-full ml-0.5"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Warning Alert */}
        <AnimatePresence>
          {locationDenied && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="mt-1 mb-4 mx-auto max-w-2xl px-2 lg:fixed lg:bottom-8 lg:right-8 lg:w-[400px] lg:m-0 lg:max-w-none lg:z-[3005]"
            >
              <div className="bg-red-50/80 backdrop-blur-md border border-red-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <MapPinOff size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-900">
                    {permissionState === 'denied' ? 'Action Required: Location Blocked' : 'Location Access Disabled'}
                  </h4>
                  <p className="text-xs text-red-700/80 mt-0.5">
                    {permissionState === 'denied'
                      ? "You've blocked location access. Please click the 'Lock' icon 🔒 in your browser address bar and select 'Allow' to see nearest shops."
                      : "Your nearest shops will not be visible since location is disabled. Please enable it for a personalized experience."
                    }
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {permissionState !== 'denied' ? (
                      <button
                        onClick={requestLocationPermission}
                        className="flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 transition-all shadow-md active:scale-95"
                      >
                        <MapPin size={12} />
                        Enable Location Now
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowLocationGuide(true)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-white border border-red-200 text-red-600 text-[11px] font-bold rounded-lg hover:bg-red-50 transition-all shadow-sm active:scale-95"
                      >
                        <Info size={12} />
                        How to Unblock Location?
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setLocationDenied(false)}
                  className="p-2 hover:bg-red-100/50 rounded-full text-red-400 hover:text-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Grid */}
        <div className="min-h-[400px]">
          {rateLimited ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50 rounded-3xl border border-dashed border-red-200">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Rate Limit Exceeded</h3>
              <p className="text-red-400 max-w-sm mb-4">Too many requests from this IP. Please wait 15 minutes before trying again.</p>
              <p className="text-gray-500 text-sm">The rate limit will reset automatically.</p>
            </div>
          ) : (loading && allProviders.length === 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={`skeleton-${i}`} className="bg-white border border-gray-200 rounded-[1.5rem] overflow-hidden h-[450px] relative shadow-xl shadow-gray-200/50">
                  <div className="h-56 bg-gray-100 relative overflow-hidden">
                    <Shimmer />
                  </div>
                  <div className="p-5 flex flex-col h-[calc(100%-14rem)] space-y-4">
                    <div className="h-7 w-3/4 bg-gray-100 rounded-lg relative overflow-hidden"><Shimmer /></div>
                    <div className="h-4 w-1/2 bg-gray-100 rounded relative overflow-hidden"><Shimmer /></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 w-16 bg-gray-100 rounded-md relative overflow-hidden"><Shimmer /></div>
                      <div className="h-6 w-20 bg-gray-100 rounded-md relative overflow-hidden"><Shimmer /></div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-gray-100 rounded relative overflow-hidden"><Shimmer /></div>
                        <div className="h-3 w-16 bg-gray-100 rounded relative overflow-hidden"><Shimmer /></div>
                      </div>
                      <div className="h-10 w-24 bg-gray-100 rounded-xl relative overflow-hidden"><Shimmer /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : visibleProviders.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8">
                <AnimatePresence mode="popLayout" initial={false}>
                  {visibleProviders.map((provider, index) => (
                    <motion.div
                      key={provider.id || provider._id}
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                        delay: Math.min(index % itemsPerPage * 0.05, 0.5)
                      }}
                    >
                      <ProviderCard
                        provider={provider}
                        distance={airDistances[provider.id || provider._id]}
                        onClick={handleCardClick}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More Pagination */}
              {visibleProviders.length >= currentPage * itemsPerPage && (
                <div className="mt-16 flex justify-center pb-8">
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={loading}
                    className="group relative px-6 py-3 bg-white border border-gray-200 rounded-full font-bold text-gray-700 shadow-sm hover:border-[#4C763B]/30 hover:text-[#4C763B] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 overflow-hidden"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#4C763B]/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? 'Loading...' : 'Load More Professionals'}
                      {!loading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : !activeCategory ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-32 h-32 bg-amber-50 rounded-full flex items-center justify-center mb-10 shadow-inner relative"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-amber-200/30 rounded-full blur-xl"
                />
                <Sparkles className="w-12 h-12 text-amber-500 relative z-10" />
              </motion.div>
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Choose Your Service</h3>
              <p className="text-gray-500 max-w-sm font-medium leading-relaxed">
                Select a category above to find the highest-rated <br />
                <span className="text-[#4C763B] font-bold">Barbers, Salons, or Pet Care</span> professionals near you.
              </p>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="mt-12 text-amber-600 flex flex-col items-center gap-2"
              >
                <ChevronRight className="-rotate-90 w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/60">Choose category above</span>
              </motion.div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-500 max-w-sm">We couldn't find any professionals matching your specific criteria. Try adjusting your filters.</p>
              <button
                onClick={handleClearFilters}
                className="mt-6 px-6 py-2.5 bg-gray-900 text-white font-bold rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 active:scale-95"
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
          airDistances={airDistances}
        />
        <LocationGuideModal
          isOpen={showLocationGuide}
          onClose={() => setShowLocationGuide(false)}
        />
      </div >
    </div >
  );
};

// --- LOCATION GUIDE MODAL COMPONENT ---
const LocationGuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[3000] flex items-start justify-center px-4 md:px-6 pt-24 md:pt-32 overflow-y-auto custom-scrollbar shadow-2xl"
      >
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                <MapPinOff size={24} />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Enable Location</h3>
                <p className="text-xs md:text-sm text-gray-500 font-medium">Follow these steps to unblock</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="overflow-y-auto p-6 md:p-8 space-y-8 flex-1 custom-scrollbar">
            {/* Desktop Instructions */}
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Monitor size={20} />
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 text-sm">On Desktop (Chrome/Edge/Brave)</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">Click the <span className="p-1 px-1.5 bg-gray-100 rounded border border-gray-200 text-gray-900 font-bold mx-0.5 inline-flex items-center gap-1">🔒 Lock</span> icon in the address bar (left of the URL).</p>
                  </div>
                  <div className="flex items-start gap-3 text-red-600">
                    <span className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 animate-pulse">2</span>
                    <p className="text-xs leading-relaxed font-black">Enable the <span className="font-black underline underline-offset-2">Location</span> toggle to "Allow" or "On".</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">Refresh the page to see your nearest shops.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Mobile Instructions */}
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <Smartphone size={20} />
              </div>
              <div className="space-y-6">
                <h4 className="font-bold text-gray-900 text-sm">On Mobile (Chrome & Safari)</h4>

                {/* Chrome Mobile */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black uppercase text-gray-500 border border-gray-200">Chrome</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">Tap the <span className="inline-flex items-center gap-1 p-1 px-1.5 bg-gray-100 rounded border border-gray-200 text-gray-900 font-bold mx-0.5"><Settings2 size={12} /> Tune</span> icon left of the URL.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">Go to <span className="font-bold text-gray-900">Permissions</span> &gt; <span className="font-bold text-red-600 animate-pulse">Location</span> and select "Allow".</p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Safari Mobile */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black uppercase text-gray-500 border border-gray-200">Safari</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">Tap the <span className="inline-flex items-center gap-1 p-1 px-1.5 bg-gray-100 rounded border border-gray-200 text-gray-900 font-bold mx-0.5 animate-pulse text-base leading-none">AA</span> icon (or Lock) in the address bar.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">Tap <span className="font-bold text-gray-900">Website Settings</span> &gt; <span className="font-bold text-red-600 animate-pulse">Location</span> and choose "Allow".</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                    <span className="font-black uppercase mr-1">Still Hidden?</span> Check your phone's main <span className="font-bold text-amber-800">Settings &gt; Privacy &gt; Location Services</span> and ensure your browser is allowed to access your location.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 flex items-center justify-center px-8 border-t border-gray-100 shrink-0">
            <button
              onClick={() => window.location.reload()}
              className="w-full h-12 md:h-14 bg-[#4C763B] text-white font-black rounded-2xl shadow-xl shadow-[#4C763B]/20 hover:bg-[#3D5F2F] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              I've Enabled it. Refresh Now.
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AllServicesSearch;
