import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Search, Clock, Sparkles,
  Zap, User,
  ShieldCheck, X, ChevronRight
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
// --- STYLING UTILITIES ---
const Shimmer = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent shadow-[0_0_40px_rgba(255,255,255,0.3)]" />
);

// Optimized Background: Removed complex blurs on moving objects for performance
// Optimized Background: Mobile Hero Style + Desktop Premium
const Background = memo(() => (
  <div className="absolute inset-0 z-0 pointer-events-none bg-white overflow-hidden">
    <div className="absolute inset-0 w-full h-full block lg:hidden z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
      <div
        className="absolute top-[-5%] right-[-15%] w-[90vw] h-[90vw] rounded-full blur-[60px] opacity-40 mix-blend-multiply transform-gpu will-change-transform"
        style={{
          background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)',
        }}
      />
      <div
        className="absolute bottom-[5%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[70px] opacity-30 mix-blend-multiply transform-gpu will-change-transform"
        style={{
          background: 'radial-gradient(circle, #db2777 0%, #9333ea 100%)',
        }}
      />
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
    </div>

    <div className="hidden lg:block absolute inset-0 w-full h-full z-0 overflow-hidden bg-gray-50">
      <div className="absolute inset-0 bg-gray-100/60" />
      <div
        className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-30 mix-blend-multiply animate-float transform-gpu will-change-transform"
        style={{
          background: 'radial-gradient(circle, #4C763B 0%, #22C55E 100%)',
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-25 mix-blend-multiply animate-float-delayed transform-gpu will-change-transform"
        style={{
          background: 'radial-gradient(circle, #22C55E 0%, #4C763B 100%)',
        }}
      />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
    </div>
  </div>
));

// --- TESTING UTILITY: LOCATION PICKER MAP ---
const LocationPickerMap = ({ manualLat, manualLng, onLocationChange, serviceAreas = [] }) => {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);
  const areasLayerRef = useRef(null);

  useEffect(() => {
    if (!window.L || !mapRef.current) return;

    if (!leafletMap.current) {
      const initialLat = parseFloat(manualLat) || 20.8971;
      const initialLng = parseFloat(manualLng) || 77.7646;

      leafletMap.current = window.L.map(mapRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(leafletMap.current);

      markerRef.current = window.L.marker([initialLat, initialLng], {
        draggable: true
      }).addTo(leafletMap.current);

      markerRef.current.on('dragend', (event) => {
        const marker = event.target;
        const position = marker.getLatLng();
        onLocationChange(position.lat.toFixed(4), position.lng.toFixed(4));
      });

      leafletMap.current.on('click', (event) => {
        const { lat, lng } = event.latlng;
        markerRef.current.setLatLng([lat, lng]);
        onLocationChange(lat.toFixed(4), lng.toFixed(4));
      });

      areasLayerRef.current = window.L.layerGroup().addTo(leafletMap.current);
    }

    // Update service area polygons
    if (leafletMap.current && areasLayerRef.current && serviceAreas.length > 0) {
      areasLayerRef.current.clearLayers();
      serviceAreas.forEach(area => {
        if (area.polygon?.coordinates?.[0]) {
          // Leaflet expects [lat, lng], GeoJSON is [lng, lat]
          const latLngs = area.polygon.coordinates[0].map(coord => [coord[1], coord[0]]);
          window.L.polygon(latLngs, {
            color: '#4C763B',
            fillColor: '#4C763B',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 5'
          }).bindPopup(`<b>Area:</b> ${area.name}`)
            .addTo(areasLayerRef.current);
        }
      });
    }

    // Update marker if coordinates changed manually via inputs
    const currentLat = parseFloat(manualLat);
    const currentLng = parseFloat(manualLng);
    if (!isNaN(currentLat) && !isNaN(currentLng) && markerRef.current) {
      const markerPos = markerRef.current.getLatLng();
      if (markerPos.lat !== currentLat || markerPos.lng !== currentLng) {
        markerRef.current.setLatLng([currentLat, currentLng]);
        leafletMap.current.setView([currentLat, currentLng]);
      }
    }

    // Invalidate size in case of container changes
    setTimeout(() => {
      if (leafletMap.current) leafletMap.current.invalidateSize();
    }, 100);

  }, [manualLat, manualLng, onLocationChange, serviceAreas]);

  return (
    <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden border border-amber-200 mt-4 relative z-0">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-amber-700 shadow-sm border border-amber-100">
        PIN MODE: DRAG OR CLICK
      </div>
    </div>
  );
};

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

// --- HELPER: ROAD DISTANCE (OSRM BATCH) ---
const fetchRoadDistances = async (userCoords, shops) => {
  try {
    if (!userCoords || shops.length === 0) return {};

    const shopCoords = shops
      .filter(s => s.location?.coordinates?.length === 2 && (s.location.coordinates[0] !== 0 || s.location.coordinates[1] !== 0))
      .map(s => ({
        id: s._id || s.id,
        coords: `${s.location.coordinates[0]},${s.location.coordinates[1]}`
      }));

    if (shopCoords.length === 0) return {};

    // OSRM Public server usually has a limit of 100 coordinates
    const CHUNK_SIZE = 100;
    const distanceMap = {};
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

    for (let i = 0; i < shopCoords.length; i += CHUNK_SIZE) {
      const chunk = shopCoords.slice(i, i + CHUNK_SIZE);
      const chunkCoordsCombined = chunk.map(c => c.coords).join(';');
      const url = `${protocol}//router.project-osrm.org/table/v1/driving/${userCoords.longitude},${userCoords.latitude};${chunkCoordsCombined}?sources=0&annotations=distance`;

      try {
        const response = await fetch(url, { mode: 'cors' });
        const data = await response.json();

        if (data.code === 'Ok' && data.distances && data.distances[0]) {
          data.distances[0].slice(1).forEach((dist, index) => {
            if (dist !== null && chunk[index]) {
              const km = (dist / 1000).toFixed(1);
              distanceMap[chunk[index].id] = km;
            }
          });
        }
      } catch (chunkError) {
        console.warn(`OSRM Chunk ${i / CHUNK_SIZE} fetch error:`, chunkError);
      }
    }

    return distanceMap;
  } catch (error) {
    console.error('OSRM Distance Error:', error);
    return {};
  }
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

// --- CONFIGURATION ---
const CATEGORY_OPTIONS = [
  { label: 'Barbers', value: 'barber', icon: User },
  { label: 'Salons', value: 'women', icon: Sparkles },
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
  const [activeCategory, setActiveCategory] = useState(null);

  const [serviceFilter, setServiceFilter] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allBarbersData, setAllBarbersData] = useState([]);
  const [rateLimited, setRateLimited] = useState(false);
  const [serviceAreas, setServiceAreas] = useState([]);

  // --- TESTING STATE (TO BE REMOVED LATER) ---
  const [isTestMode, setIsTestMode] = useState(false);
  const [manualLat, setManualLat] = useState('20.8971');
  const [manualLng, setManualLng] = useState('77.7646');

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
  const [userLocation, setUserLocation] = useState(null);
  const [roadDistances, setRoadDistances] = useState({});
  const [airDistances, setAirDistances] = useState({});

  const fetchProviders = useCallback(async (lat, lng) => {
    try {
      const shopsCacheKey = (lat && lng) ? `shops_near_${lat.toFixed(3)}_${lng.toFixed(3)}` : 'shops_all';
      const barbersCacheKey = 'barbers_all';

      const cachedShops = getCachedData(shopsCacheKey);
      const cachedBarbers = getCachedData(barbersCacheKey);

      let shopData = cachedShops;
      let barberData = cachedBarbers;

      if (!shopData || !barberData) {
        // --- PARALLEL FETCHING: 3x Faster Initial Load ---
        const shopUrl = (lat && lng)
          ? `${process.env.REACT_APP_API_URL}/api/shop/all?userLat=${lat}&userLng=${lng}&limit=1000`
          : `${process.env.REACT_APP_API_URL}/api/shop/all?limit=1000`;

        const [shopRes, barberRes] = await Promise.all([
          !shopData ? dedupedRequest(shopsCacheKey, () => axios.get(shopUrl)) : Promise.resolve({ data: shopData }),
          !barberData ? dedupedRequest(barbersCacheKey, () => axios.get(`${process.env.REACT_APP_API_URL}/api/barber-card/all`)) : Promise.resolve({ data: barberData })
        ]);

        if (!shopData) {
          shopData = shopRes.data;
          setCachedData(shopsCacheKey, shopData);
        }
        if (!barberData) {
          barberData = barberRes.data;
          setCachedData(barbersCacheKey, barberData);
        }
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
          const ids = [shop.owner?._id, ...shopBarbers.map(b => b.barberId)].filter(id => id);

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

        // 3. Optimized Global Fetch (Single API Call)
        const masterBookingMap = new Map();

        // We fetch stats for everyone in 1 efficient call, regardless of specific IDs
        // This is much faster than batching 50 at a time
        try {
          const token = localStorage.getItem('customerAuthToken') || localStorage.getItem('barberAuthToken');

          const statsRes = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/booking/todays-stats?date=${today.toISOString().split('T')[0]}`,
            token ? { headers: { 'x-auth-token': token } } : {}
          );

          if (statsRes.data) {
            Object.entries(statsRes.data).forEach(([bId, count]) => {
              masterBookingMap.set(bId, count);
            });
          }
        } catch (error) {
          console.warn('Global stats fetch failed', error);
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
            _id: shop._id,
            type: "shop",
            owner: { ...shop.owner, maxAppointmentsPerDay: totalMaxAppointments },
            staff: shop.staff || [],
            name: shop.name || "Unknown Shop",
            address: shop.address || "Location Unavailable",
            location: shop.location, // Ensure location is preserved for distance calc
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
          formattedData.push(shopCard);

          for (const barber of shopBarbers) {
            const barberCard = {
              id: barber._id || barber.id,
              _id: barber._id || barber.id,
              type: "barber",
              barberId: barber.barberId,
              shopId: barber.shopId,
              location: barber.location, // Ensure location is preserved
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
            };
            formattedData.push(barberCard);
          }
        }

        // 5. Map Data to Cards (Independent Barbers)

        for (const barber of independentBarbers) {
          const barberCard = {
            id: barber._id || barber.id,
            _id: barber._id || barber.id,
            type: "barber",
            barberId: barber.barberId,
            shopId: null,
            location: barber.location, // Ensure location is preserved
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
  }, []);

  // Fetch service areas for testing
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/areas`);
        setServiceAreas(res.data);
      } catch (err) {
        console.warn("Failed to fetch service areas", err);
      }
    };
    fetchAreas();
  }, []);

  // --- EFFECT: FETCH USER LOCATION THEN LOAD PROVIDERS ---
  useEffect(() => {
    if (isTestMode) {
      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLng);
      setUserLocation({ latitude: lat, longitude: lng });
      fetchProviders(lat, lng);
      return;
    }

    if (window.navigator.geolocation) {
      window.navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ latitude: lat, longitude: lng });
          fetchProviders(lat, lng);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          fetchProviders(); // Fallback
        },
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 10000 }
      );
    } else {
      fetchProviders();
    }
  }, [fetchProviders, isTestMode, manualLat, manualLng]);

  // --- EFFECT: CALCULATE DISTANCES ---
  const hasFetchedDistances = React.useRef(false);

  useEffect(() => {
    if (userLocation && allProviders.length > 0 && !hasFetchedDistances.current) {
      hasFetchedDistances.current = true; // Mark as fetched immediately to prevent re-renders triggering it

      // 1. Air Distances (Fallback) - Fast
      const airMap = {};
      allProviders.forEach(p => {
        if (p.location?.coordinates?.length === 2 && (p.location.coordinates[0] !== 0 || p.location.coordinates[1] !== 0)) {
          const dist = getAirDistance(
            userLocation.latitude,
            userLocation.longitude,
            p.location.coordinates[1],
            p.location.coordinates[0]
          );
          airMap[p.id || p._id] = dist.toFixed(1);
        }
      });
      setAirDistances(airMap);

      // 2. Road Distances (OSRM) - Optimized
      // Only fetch road distance for SHOPS to stay under API limits (100 coords)
      const shopsOnly = allProviders.filter(p => p.type === 'shop' && p.location?.coordinates?.length === 2 && (p.location.coordinates[0] !== 0 || p.location.coordinates[1] !== 0));

      if (shopsOnly.length > 0) {
        fetchRoadDistances(userLocation, shopsOnly).then(roadMap => {
          if (roadMap && Object.keys(roadMap).length > 0) {
            const fullRoadMap = { ...roadMap };

            // Map shop distance to its assigned barbers/staff
            allProviders.forEach(p => {
              if (p.type === 'barber' && p.parentShopId) {
                if (roadMap[p.parentShopId]) {
                  fullRoadMap[p.id || p._id] = roadMap[p.parentShopId];
                }
              }
            });

            setRoadDistances(prev => ({ ...prev, ...fullRoadMap }));
          } else {
            console.warn("🚫 No road distances received from OSRM.");
          }
        }).catch(err => {
          console.error("❌ Road distance calculation failed completely:", err);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, allProviders.length]); // Added allProviders.length to ensure calculation runs when providers are loaded

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
    if (!activeCategory) return [];
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
    if (debouncedSearchQuery && debouncedSearchQuery.trim() && !serviceFilter) {
      const searchTerm = debouncedSearchQuery.toLowerCase().trim();
      list = list.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm) ||
        provider.address.toLowerCase().includes(searchTerm) ||
        provider.category.toLowerCase().includes(searchTerm)
      );
    }

    // Sorting
    list.sort((a, b) => {
      // 1. Global Priority (Pinned to top)
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;

      // 2. Existing Sorting Logic
      if (activeFilters.includes('Rating')) {
        return b.rating - a.rating;
      } else if (activeFilters.includes('Number of Reviews')) {
        return b.reviews - a.reviews;
      } else if (activeFilters.includes('Average Time')) {
        const timeA = parseInt(a.avgAppointmentTime?.replace(/\D/g, '') || '0');
        const timeB = parseInt(b.avgAppointmentTime?.replace(/\D/g, '') || '0');
        return timeA - timeB;
      } else {
        // Default: Sort by Distance
        const idA = a.id || a._id;
        const idB = b.id || b._id;
        const distA = parseFloat(roadDistances[idA] || airDistances[idA] || 99999);
        const distB = parseFloat(roadDistances[idB] || airDistances[idB] || 99999);
        return distA - distB;
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
  }, [allProviders, activeCategory, activeFilters, debouncedSearchQuery, serviceFilter, roadDistances, airDistances]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage);

  const visibleProviders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProviders.slice(start, start + itemsPerPage);
  }, [filteredProviders, currentPage, itemsPerPage]);

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
    setActiveCategory(null);
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

        @keyframes pulse-premium {
          0%, 100% { border-color: #fbbf24; box-shadow: 0 0 15px rgba(251, 191, 36, 0.2); transform: scale(1); }
          50% { border-color: #f59e0b; box-shadow: 0 0 25px rgba(245, 158, 11, 0.4); transform: scale(1.01); }
        }
        .animate-pulse-premium {
          animation: pulse-premium 2s infinite ease-in-out;
        }
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
              <div
                className={`hidden md:flex bg-gray-100 rounded-full p-1 border transition-all duration-500 ${!activeCategory ? 'animate-pulse-premium' : 'border-gray-200'}`}
              >
                {CATEGORY_OPTIONS.map((opt) => (
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
              {!activeCategory && (
                <div className="text-[10px] font-black text-amber-600 uppercase mb-2 animate-pulse flex items-center gap-1">
                  <Sparkles size={10} /> Choose your service below
                </div>
              )}
              <div className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide transition-all ${!activeCategory ? 'animate-pulse-premium rounded-xl px-1' : ''}`}>
                {CATEGORY_OPTIONS.map((opt) => (
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
              {FILTER_OPTIONS.map((opt) => (
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

        {/* --- TESTING TOOLS (Visible ONLY in Test Mode) --- */}
        <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm relative z-20">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isTestMode}
                onChange={() => {
                  setIsTestMode(!isTestMode);
                  hasFetchedDistances.current = false; // Allow re-calculation
                }}
                className="w-4 h-4 accent-amber-600"
              />
              <span className="text-sm font-bold text-amber-900">Enable Manual Location (Testing)</span>
            </label>

            {isTestMode && (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-amber-600 font-bold uppercase">Latitude</span>
                  <input
                    type="text"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    className="px-3 py-1 bg-white border border-amber-200 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 ring-amber-500"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-amber-600 font-bold uppercase">Longitude</span>
                  <input
                    type="text"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    className="px-3 py-1 bg-white border border-amber-200 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 ring-amber-500"
                  />
                </div>
                <button
                  onClick={() => {
                    hasFetchedDistances.current = false;
                    fetchProviders(parseFloat(manualLat), parseFloat(manualLng));
                  }}
                  className="px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
                >
                  Apply & Refetch
                </button>
              </div>
            )}
          </div>

          {isTestMode && (
            <LocationPickerMap
              manualLat={manualLat}
              manualLng={manualLng}
              serviceAreas={serviceAreas}
              onLocationChange={(lat, lng) => {
                setManualLat(lat);
                setManualLng(lng);
              }}
            />
          )}

          <p className="mt-2 text-[10px] text-amber-500">
            Note: This tool is for testing geofencing and proximity sorting. You can manually enter coordinates or **drag the map pin** to see how the shops re-sort!
          </p>
        </div>

        {/* Results Grid */}
        <div className="min-h-[400px]">
          {
            rateLimited ? (
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
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8"
                >
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
                          distance={roadDistances[provider.id || provider._id] || airDistances[provider.id || provider._id]}
                          onClick={handleCardClick}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Premium Pagination */}
                {totalPages > 1 && (
                  <div className="mt-16 flex flex-wrap items-center justify-center gap-2 pb-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2.5 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      <ChevronRight className="rotate-180 w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-100/50 backdrop-blur-md rounded-2xl border border-gray-200/50">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        // Show limited page numbers on mobile for better UI
                        if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                          if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="px-1 text-gray-400">...</span>;
                          return null;
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`
                            min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all duration-300
                            ${currentPage === page
                                ? 'bg-[#4C763B] text-white shadow-lg shadow-[#4C763B]/20 scale-110'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                              }
                          `}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2.5 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      <ChevronRight className="w-5 h-5" />
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
          roadDistances={roadDistances}
          airDistances={airDistances}
        />

      </div>
    </div>
  );
};

export default AllServicesSearch;
