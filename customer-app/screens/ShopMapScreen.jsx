import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  PanResponder,
  ScrollView,
  Alert,
  Linking,
  Image as RNImage,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";
import OptimizedImage from "../components/OptimizedImage";
import {
  Navigation as NavigationIcon,
  Heart,
  X,
  Star as StarIcon,
  MapPin,
  Search,
  ArrowLeft,
  Store,
  Sparkles,
  Check as CheckIcon,
  ChevronRight,
  User,
  Phone,
} from "lucide-react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useTheme } from "../contexts/ThemeContext.jsx";
import api, { API_URL } from "../utils/api";
import { barbers as dummyBarbers } from "../data/barbers.js";

// --- CONSTANTS ---
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const DEFAULT_LAT = 20.9136;
const DEFAULT_LNG = 77.768;

// --- UTILS ---
const getImageUrl = (path) => {
  if (!path) return null;
  if (typeof path === 'string') {
    if (path.startsWith('http') || path.startsWith('data:')) {
      return path;
    }
    const baseUrl = API_URL?.replace(/\/$/, '') || 'http://192.168.29.243:5000';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
  if (path && path.uri) return path.uri;
  return path;
};

// --- RAPIDO/UBER STYLE MAP THEME ---
const uberMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
];

// --- COMPONENTS ---

/**
 * CUSTOM USER LOCATION MARKER
 */
const UserLocationMarker = memo(({ location }) => {
  if (!location) return null;

  return (
    <Marker
      coordinate={{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={999}
    >
      <View style={styles.userMarkerWrapper}>
        <View style={styles.userMarkerPulse} />
        <View style={styles.userMarkerCore}>
          <User size={12} color="#fff" strokeWidth={2.5} />
        </View>
      </View>
    </Marker>
  );
});

/**
 * Optimized Shop Marker
 */
const ShopMarker = memo(({ shop, onPress, isSelected }) => {
  const imageUrl = useMemo(() => getImageUrl(shop.image || shop.owner?.profilePicture), [shop.image, shop.owner]);

  return (
    <Marker
      coordinate={shop.location?.coordinates ? {
        latitude: shop.location.coordinates[1],
        longitude: shop.location.coordinates[0]
      } : null}
      onPress={() => onPress(shop)}
      tracksViewChanges={true}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={isSelected ? 999 : 1}
    >
      <View style={[styles.roundMarkerShadow, isSelected && styles.roundMarkerSelected]}>
        <View style={styles.roundMarkerInner}>
          <OptimizedImage
            source={imageUrl}
            style={styles.roundMarkerImage}
            contentFit="cover"
          />
        </View>
      </View>
    </Marker>
  );
});

/**
 * Bottom Sheet Detail Content
 */
const OperatingHourItem = memo(({ day, hours }) => {
  const openTime = hours?.open || hours?.startTime || hours?.start;
  const closeTime = hours?.close || hours?.endTime || hours?.end;
  const isClosed = !openTime || !closeTime || hours?.isClosed;

  return (
    <View style={styles.operatingHourRow}>
      <Text style={styles.dayText}>
        {day.charAt(0).toUpperCase() + day.slice(1)}
      </Text>
      <View style={styles.timePill}>
        <Text style={styles.hoursText}>
          {isClosed ? "Closed" : `${openTime} - ${closeTime}`}
        </Text>
      </View>
    </View>
  );
});



const BarberListItem = memo(({ barber, shopId, navigation }) => (
  <TouchableOpacity
    style={styles.barberListItem}
    onPress={() => {
      const id = shopId || barber.shopId || barber.parentShopId;
      if (id) {
        navigation.navigate('BarberSearch', {
          selectedShopId: typeof id === 'object' ? id._id : id,
          fromShopMapScreen: true
        });
      }
    }}
    activeOpacity={0.8}
  >
    <View style={styles.barberAvatarContainer}>
      <OptimizedImage
        source={getImageUrl(barber.image || barber.barberId?.profilePicture)}
        style={styles.barberListAvatar}
        contentFit="cover"
      />
      <View style={[styles.barberStatusDot, { backgroundColor: barber.isAvailable ? '#10b981' : '#cbd5e1' }]} />
    </View>
    <View style={styles.barberListInfo}>
      <View style={styles.barberListHeader}>
        <Text style={styles.barberListName}>{barber.name || "Barber"}</Text>
      </View>
      <View style={styles.barberListDetails}>
        <View style={styles.barberRatingBadge}>
          <StarIcon size={10} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 2 }} />
          <Text style={styles.barberRatingText}>{Number(barber.rating || 4.5).toFixed(1)}</Text>
        </View>
        <Text style={styles.barberReviewsCount}>
          ({barber.reviewCount || (Array.isArray(barber.reviews) ? barber.reviews.length : 0)} reviews)
        </Text>
      </View>
    </View>
    <ChevronRight size={18} color="#1A1A1A" />
  </TouchableOpacity>
));

const RatingBar = memo(({ rating, percentage, count }) => (
  <View style={styles.ratingBarRow}>
    <View style={styles.ratingBarLabelContainer}>
      <Text style={styles.ratingBarLabel}>{rating}</Text>
      <StarIcon size={10} color="#f59e0b" fill="#f59e0b" style={{ marginLeft: 2 }} />
    </View>
    <View style={styles.ratingBarContainer}>
      <View
        style={[
          styles.ratingBarFill,
          { width: `${Math.max(0, Math.min(100, percentage * 100))}%` }
        ]}
      />
    </View>
    <Text style={styles.ratingBarCountText}>{count}</Text>
  </View>
));

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const ReviewItem = memo(({ review }) => (
  <View style={styles.reviewItemCard}>
    <View style={styles.reviewItemHeader}>
      <View style={[styles.reviewItemUser, { flex: 1, marginRight: 8 }]}>
        <View style={styles.reviewItemAvatar}>
          {review.userId?.profilePicture ? (
            <OptimizedImage
              source={getImageUrl(review.userId.profilePicture)}
              style={styles.reviewAvatarImage}
            />
          ) : (
            <View style={styles.reviewAvatarPlaceholder}>
              <Text style={styles.avatarInitial}>{(review.userId?.name || "A").charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewUserName} numberOfLines={1}>{review.userId?.name || "GlossCut Customer"}</Text>
          <Text style={styles.reviewItemDate}>{formatDate(review.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.reviewItemRating}>
        <StarIcon size={10} color="#f59e0b" fill="#f59e0b" />
        <Text style={styles.reviewItemRatingText}>{review.rating}</Text>
      </View>
    </View>
    <Text style={styles.reviewCommentText} numberOfLines={1}>
      {typeof review.comment === 'object' && review.comment !== null
        ? (review.comment.content || '')
        : String(review.comment || '')}
    </Text>
  </View>
));

const CollapsibleSection = memo(({ title, children, isExpanded, onToggle }) => (
  <View style={styles.collapsibleWrapper}>
    <TouchableOpacity
      style={styles.collapsibleHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>{title}</Text>
        </View>
        <View style={styles.headerLine} />
      </View>
      {isExpanded ? (
        <ChevronRight size={18} color="#1e293b" style={{ transform: [{ rotate: '90deg' }] }} />
      ) : (
        <ChevronRight size={18} color="#1e293b" />
      )}
    </TouchableOpacity>
    {isExpanded && <View style={styles.collapsibleContent}>{children}</View>}
  </View>
));

const ShopDetailContent = memo(({
  shop,
  distance,
  onClose,
  navigation,
  mapRef,
  location,
  shops,
  routeCoords,
  handleMarkerPress,
  initialRegion,
  headerOffset
}) => {


  const onBooking = useCallback(() => {
    navigation.navigate('BarberSearch', {
      selectedShopId: shop._id,
      fromShopMapScreen: true
    });
  }, [navigation, shop._id]);

  const shopImageSource = useMemo(() => getImageUrl(shop.image || shop.owner?.profilePicture), [shop.image, shop.owner]);

  const handleCall = useCallback(() => {
    if (shop.phone) Linking.openURL(`tel:${shop.phone}`);
    else Alert.alert("Not Available", "Phone number not provided by shop.");
  }, [shop.phone]);

  const handleOpenGoogleMaps = useCallback(() => {
    if (shop.location?.coordinates) {
      const lon = shop.location.coordinates[0];
      const lat = shop.location.coordinates[1];
      const name = encodeURIComponent(shop.shopName || shop.name || "GlossCut Salon");
      const url = Platform.select({
        ios: `maps://app?daddr=${lat},${lon}&q=${name}`,
        android: `google.navigation:q=${lat},${lon}`,
      });
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
      
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(webUrl);
        }
      }).catch(() => {
        Linking.openURL(webUrl);
      });
    } else {
      Alert.alert("Not Available", "Location coordinates not available.");
    }
  }, [shop]);

  const handleFitRoute = useCallback(() => {
    if (location && shop.location?.coordinates && mapRef.current) {
      const shopLon = shop.location.coordinates[0];
      const shopLat = shop.location.coordinates[1];
      const userLat = location.coords.latitude;
      const userLon = location.coords.longitude;
      
      mapRef.current.fitToCoordinates([
        { latitude: userLat, longitude: userLon },
        { latitude: shopLat, longitude: shopLon }
      ], {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true
      });
    } else if (shop.location?.coordinates && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: shop.location.coordinates[1],
        longitude: shop.location.coordinates[0],
        latitudeDelta: 0.015,
        longitudeDelta: 0.015
      }, 1000);
    }
  }, [location, shop.location, mapRef]);

  // --- SECTION: REAL DATA CALCULATIONS ---
  const reviewStats = useMemo(() => {
    // Combine reviews from all barbers
    const combinedReviews = [];
    if (Array.isArray(shop.barbers)) {
      shop.barbers.forEach(b => {
        if (Array.isArray(b.reviews)) {
          combinedReviews.push(...b.reviews);
        }
      });
    }

    const rawReviews = combinedReviews.length > 0 ? combinedReviews : (Array.isArray(shop.reviews) ? shop.reviews : []);
    const reviews = rawReviews.filter(r => r && r.rating !== undefined);

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    reviews.forEach(r => {
      const rate = Math.max(1, Math.min(5, Math.round(Number(r.rating || 0))));
      if (counts[rate] !== undefined) counts[rate]++;
      totalScore += Number(r.rating || 0);
    });

    const count = reviews.length;
    const displayTotal = count > 0 ? count : (shop.totalReviews || 0);
    const avg = count > 0 ? (totalScore / count) : Number(shop.rating || 0);

    // Sort by: 1. Rating (Highest first), 2. Date (Newest first)
    const sortedReviews = [...reviews].sort((a, b) => {
      if (b.rating !== a.rating) return Number(b.rating) - Number(a.rating);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return {
      counts,
      percentages: {
        5: count > 0 ? (counts[5] / count) : 0,
        4: count > 0 ? (counts[4] / count) : 0,
        3: count > 0 ? (counts[3] / count) : 0,
        2: count > 0 ? (counts[2] / count) : 0,
        1: count > 0 ? (counts[1] / count) : 0,
      },
      total: displayTotal,
      average: avg,
      sortedReviews
    };
  }, [shop.reviews, shop.rating, shop.totalReviews]);

  // --- SECTION: OPERATING HOURS RENDERER ---
  const hasOperatingHours = useMemo(() => {
    if (!shop.operatingHours) return false;
    if (Array.isArray(shop.operatingHours)) {
      return shop.operatingHours.length > 0;
    }
    if (typeof shop.operatingHours === 'object') {
      return Object.keys(shop.operatingHours).length > 0;
    }
    return false;
  }, [shop.operatingHours]);

  const renderOperatingHours = () => {
    if (!shop.operatingHours) return null;

    if (Array.isArray(shop.operatingHours)) {
      return shop.operatingHours.map((item, idx) => (
        <OperatingHourItem key={idx} day={item.day || `Day ${idx + 1}`} hours={item} />
      ));
    }

    return Object.entries(shop.operatingHours).map(([day, hours]) => (
      <OperatingHourItem key={day} day={day} hours={hours} />
    ));
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: headerOffset || 0, paddingBottom: 100 }}
    >
      {/* Studio Location Header */}
      <View style={[styles.sectionHeaderRow, { marginHorizontal: 16, marginTop: 16 }]}>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Studio Location</Text>
        </View>
        <View style={styles.headerLine} />
      </View>

      {/* Embed Map Card at the top of the bottom section details list */}
      <View style={[styles.sheetMapShadow, { marginTop: 0 }]}>
        <View style={styles.sheetMapInner}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            customMapStyle={uberMapStyle}
            initialRegion={initialRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            <UserLocationMarker location={location} />
            <ShopMarker
              key={shop._id}
              shop={shop}
              isSelected={true}
              onPress={() => { }}
            />

            {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeWidth={5}
                strokeColor="#2563EB"
                lineCap="round"
              />
            )}
          </MapView>

          {/* Floating Actions inside Map Card */}
          <View style={styles.mapActionOverlay}>
            <TouchableOpacity 
              style={styles.mapActionSquareBtn}
              onPress={handleFitRoute}
              activeOpacity={0.8}
            >
              <NavigationIcon size={16} color="#0f172a" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mapActionSquareBtn, { backgroundColor: '#10b981', borderColor: '#10b981' }]}
              onPress={handleOpenGoogleMaps}
              activeOpacity={0.8}
            >
              <MapPin size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Nested Road Distance Badge inside Map Card */}
          {distance && (
            <View style={styles.mapDistanceBadge}>
              <NavigationIcon size={11} color="#fff" />
              <Text style={styles.mapDistanceText}>{distance} km</Text>
            </View>
          )}
        </View>
      </View>

      {/* Studio Profile Header */}
      <View style={[styles.sectionHeaderRow, { marginHorizontal: 16 }]}>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Studio Profile</Text>
        </View>
        <View style={styles.headerLine} />
      </View>

      <View style={[styles.webStyleCard, { marginTop: 0 }]}>
        <View style={styles.webStyleCardBackground} />



        <View style={styles.webStyleRow}>
          <View style={styles.webStyleImageFrame}>
            <OptimizedImage
              source={shopImageSource}
              style={styles.webStyleImage}
              contentFit="cover"
              transition={300}
            />
          </View>

          <View style={styles.webStyleInfo}>
            <View style={styles.webStyleBadgeRow}>
              {shop.isPriority ? (
                <View style={styles.webFeaturedBadge}>
                  <StarIcon size={8} color="#fff" fill="#fff" />
                  <Text style={styles.webFeaturedBadgeText}>FEATURED</Text>
                </View>
              ) : (
                <View style={styles.webPremiumBadge}>
                  <Sparkles size={8} color="#f59e0b" />
                  <Text style={styles.webPremiumBadgeText}>Premium</Text>
                </View>
              )}
            </View>

            <Text style={styles.webShopName} numberOfLines={1}>
              {shop.shopName || shop.name || 'GlossCut Shop'}
            </Text>

            <View style={styles.webAddressRow}>
              <MapPin size={12} color="#f59e0b" style={{ marginRight: 4 }} />
              <Text style={styles.webAddressText} numberOfLines={1}>
                {shop.address || "Premium Partner Site"}
              </Text>
            </View>

            <View style={styles.webActionRow}>
              {distance && (
                <View style={styles.webDistancePill}>
                  <NavigationIcon size={10} color="#7C3AED" style={{ marginRight: 4 }} />
                  <Text style={styles.webDistanceText}>{distance} km</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={onBooking}
                style={styles.webBookPill}
                activeOpacity={0.8}
              >
                <Text style={styles.webBookPillText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.fullDetailSection}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>Barbers & Staff</Text>
          </View>
          <View style={styles.headerLine} />
        </View>

        {shop.barbers && shop.barbers.length > 0 ? shop.barbers.map((barber, idx) => (
          <BarberListItem key={barber._id || idx} barber={barber} shopId={shop._id} navigation={navigation} />
        )) : (
          <View style={styles.emptyBarbers}>
            <Text style={styles.emptyText}>No barbers listed for this shop</Text>
          </View>
        )}

        <View style={styles.sectionHeaderRow}>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>Customer Reviews</Text>
          </View>
          <View style={styles.headerLine} />
        </View>

        <View style={styles.reviewsCard}>
          <View style={styles.ratingOverview}>
            <View style={styles.ratingLeft}>
              <Text style={styles.overallRating}>{Number(reviewStats.average || 5.0).toFixed(1)}</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map(s => <StarIcon key={s} size={14} color="#f59e0b" fill={s <= Math.floor(reviewStats.average) ? "#f59e0b" : "transparent"} />)}
              </View>
              <Text style={styles.reviewCount}>{reviewStats.total} reviews</Text>
            </View>
            <View style={styles.ratingBreakdown}>
              {[5, 4, 3, 2, 1].map(r => (
                <RatingBar
                  key={r}
                  rating={r.toString()}
                  percentage={reviewStats.percentages[r]}
                  count={reviewStats.counts[r]}
                />
              ))}
            </View>
          </View>
        </View>

        {reviewStats.sortedReviews.length > 0 && (
          <View style={styles.recentReviewsList}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.headerPill}>
                <Text style={styles.headerPillText}>Recent Feedback</Text>
              </View>
              <View style={styles.headerLine} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reviewsScrollContainer}
            >
              {reviewStats.sortedReviews.slice(0, 5).map((review, idx) => (
                <ReviewItem key={review._id || idx} review={review} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Operating Hours shown statically below Customer Reviews */}
        {hasOperatingHours && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.headerPill}>
                <Text style={styles.headerPillText}>Operating Hours</Text>
              </View>
              <View style={styles.headerLine} />
            </View>
            <View style={styles.hoursCard}>
              {renderOperatingHours()}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
});

/**
 * MAIN SCREEN
 */
const ShopMapScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const mainMapRef = useRef(null);
  const mapRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [shops, setShops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [initialShopId, setInitialShopId] = useState(route.params?.shopId || null);

  const filteredShops = useMemo(() => {
    if (!searchQuery.trim()) return shops;
    const query = searchQuery.toLowerCase();
    return shops.filter(shop =>
      (shop.shopName || shop.name || '').toLowerCase().includes(query) ||
      (shop.address || '').toLowerCase().includes(query)
    );
  }, [shops, searchQuery]);

  const sheetHeight = useRef(new Animated.Value(0)).current;

  // Layout Constants for Non-Overlapping Blinkit Style
  const remainingHeight = useMemo(() => screenHeight, [screenHeight]);

  // Animate to user location when first detected
  useEffect(() => {
    if (location && mainMapRef.current && !route.params?.shopId) {
      mainMapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [location]);

  // Initial Data & Location
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        // --- SECTION 1: FETCH DATA IMMEDIATELY ---
        const fetchShopsData = async () => {
          try {
            const [shopRes, barberRes] = await Promise.all([
              api.get('/api/shop/all'),
              api.get('/api/barber-card/all')
            ]);

            if (isMounted && Array.isArray(shopRes.data)) {
              const barbersByShop = {};
              if (Array.isArray(barberRes.data)) {
                barberRes.data.forEach(b => {
                  const shopId = (b.shopId && typeof b.shopId === 'object') ? b.shopId._id : b.shopId;
                  if (shopId) {
                    if (!barbersByShop[shopId]) barbersByShop[shopId] = [];
                    barbersByShop[shopId].push(b);
                  }
                });
              }

              const formattedShops = shopRes.data.map(shop => {
                const shopIdStr = shop._id?.toString() || "";
                return {
                  ...shop,
                  shopName: shop.name || shop.shopName || shop.owner?.name || "GlossCut Salon",
                  image: shop.image || shop.owner?.profilePicture || shop.profilePicture,
                  barbers: barbersByShop[shopIdStr] || [],
                  totalReviews: shop.totalReviews || (Array.isArray(shop.reviews) ? shop.reviews.length : (typeof shop.reviews === 'number' ? shop.reviews : 0)),
                  reviews: Array.isArray(shop.reviews) ? shop.reviews : [],
                };
              });
              setShops(formattedShops);
            }
          } catch (apiErr) {
            console.error("API Fetch Error:", apiErr);
            if (isMounted) setShops(dummyBarbers);
          }
        };

        fetchShopsData();

        // --- SECTION 2: HANDLE LOCATION ---
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // 1. Get cached last known location instantly (UX: zero wait time)
          const lastLoc = await Location.getLastKnownPositionAsync();
          if (lastLoc && isMounted) {
            setLocation(lastLoc);
          }

          // 2. Fetch fresh location in background with Low accuracy for maximum speed
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low
          });
          if (isMounted) setLocation(loc);
        }
      } catch (e) {
        console.error("Initialization Error:", e);
        if (isMounted) setShops(dummyBarbers);
      }
    })();

    return () => { isMounted = false; };
  }, []);

  const fetchRoute = useCallback(async (userCoords, shopCoords) => {
    try {
      const [shopLng, shopLat] = shopCoords;
      const url = `http://router.project-osrm.org/route/v1/driving/${userCoords.longitude},${userCoords.latitude};${shopLng},${shopLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates.map(p => ({
          latitude: p[1],
          longitude: p[0]
        }));
        setRouteCoords(coords);
        setDistance((data.routes[0].distance / 1000).toFixed(1));

        // Calculate bounds to prevent extreme zoom-in for close shops (e.g. under 500m)
        if (coords.length > 0) {
          const lats = coords.map(c => c.latitude);
          const lngs = coords.map(c => c.longitude);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          const latDelta = maxLat - minLat;
          const lngDelta = maxLng - minLng;
          const MIN_DELTA = 0.006; // Safe zoom delta representing ~600m

          if (latDelta < MIN_DELTA && lngDelta < MIN_DELTA) {
            const centerLat = (minLat + maxLat) / 2;
            const centerLng = (minLng + maxLng) / 2;
            setTimeout(() => {
              mapRef.current?.animateToRegion({
                latitude: centerLat,
                longitude: centerLng,
                latitudeDelta: MIN_DELTA,
                longitudeDelta: MIN_DELTA,
              }, 600);
            }, 150);
          } else {
            setTimeout(() => {
              mapRef.current?.fitToCoordinates(coords, {
                edgePadding: { top: 80, right: 60, bottom: 60, left: 60 },
                animated: true
              });
            }, 150);
          }
        }
      }
    } catch (e) {
      console.warn("OSRM Route Error:", e);
    }
  }, []);

  const handleMarkerPress = useCallback(async (shop) => {
    setSelectedShop(shop);
    navigation.setParams({ isShopSelected: true });
    Animated.spring(sheetHeight, {
      toValue: remainingHeight,
      useNativeDriver: false,
      tension: 30,
      friction: 7
    }).start();

    if (!location && shop.location?.coordinates) {
      // Fallback offset slightly to center the shop pin if user location is not available
      const latOffset = 0.0025;
      mainMapRef.current?.animateToRegion({
        latitude: shop.location.coordinates[1] - latOffset,
        longitude: shop.location.coordinates[0],
        latitudeDelta: 0.015,
        longitudeDelta: 0.015
      }, 1000);
    }

    // Fetch Full Details for the selected shop (Services, Real Reviews, etc.)
    try {
      const res = await api.get(`/api/shop/${shop._id}`);
      if (res.data) {
        setSelectedShop(prev => ({
          ...prev,
          ...res.data, // Merge full details
          barbers: prev?.barbers || [], // Explicitly preserve the mapped barbers from all barber cards
          shopName: res.data.name || prev?.shopName,
          reviews: Array.isArray(res.data.reviews) ? res.data.reviews : (prev?.reviews || []), // Ensure real reviews list
        }));
      }
    } catch (e) {
      console.log("Could not fetch full shop details:", e.message);
    }

    if (location && shop.location?.coordinates) {
      fetchRoute(location.coords, shop.location.coordinates);
    }
  }, [location, fetchRoute, remainingHeight, sheetHeight, navigation]);

  useEffect(() => {
    if (initialShopId && shops.length > 0) {
      const shopToSelect = shops.find(s => s._id.toString() === initialShopId.toString());
      if (shopToSelect) {
        const timer = setTimeout(() => {
          handleMarkerPress(shopToSelect);
          setInitialShopId(null);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [initialShopId, shops, handleMarkerPress]);

  const handleMapPress = useCallback(() => {
    setRouteCoords([]);
    setSelectedShop(null);
    navigation.setParams({ isShopSelected: false, shopId: undefined });
    sheetHeight.setValue(0);
  }, [sheetHeight, navigation]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: () => { },
      onPanResponderMove: () => { },
      onPanResponderRelease: () => { }
    })
  ).current;

  const handleLocateMe = useCallback(() => {
    if (location) {
      mainMapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    }
  }, [location]);

  const handleBooking = useCallback(() => {
    if (selectedShop) {
      navigation.navigate('BarberSearch', {
        selectedShopId: selectedShop._id,
        fromShopMapScreen: true
      });
    }
  }, [navigation, selectedShop]);

  const initialRegion = useMemo(() => ({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  }), []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Background Map View (Always mounted for instant back transitions) */}
      <MapView
        ref={mainMapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={uberMapStyle}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        <UserLocationMarker location={location} />
        {filteredShops.map((shop, index) => (
          <ShopMarker
            key={shop._id || `shop-${index}`}
            shop={shop}
            isSelected={false}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {/* Bottom Sheet */}
      {selectedShop !== null && (
        <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
          <View style={{ flex: 1 }}>
            <ShopDetailContent
              shop={selectedShop}
              distance={distance}
              onClose={handleMapPress}
              navigation={navigation}
              mapRef={mapRef}
              location={location}
              shops={shops}
              routeCoords={routeCoords}
              handleMarkerPress={handleMarkerPress}
              initialRegion={initialRegion}
              headerOffset={insets.top + 105}
            />
          </View>
        </Animated.View>
      )}

      {/* Floating Header (now rendered AFTER the sheet, so it sits on top) */}
      <View
        style={[
          styles.header,
          {
            top: 0,
            paddingTop: insets.top + 10,
            backgroundColor: selectedShop !== null ? '#ffffff' : 'transparent',
            borderBottomWidth: selectedShop !== null ? 1 : 0,
            borderColor: selectedShop !== null ? '#f1f5f9' : 'transparent',
            elevation: selectedShop !== null ? 4 : 0,
            shadowOpacity: selectedShop !== null ? 0.05 : 0,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={selectedShop !== null ? handleMapPress : () => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        {selectedShop === null ? (
          <View style={styles.searchBar}>
            <Search size={20} color="#666" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for Barbershops..."
              placeholderTextColor="#94a3b8"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText} numberOfLines={1}>
              {selectedShop.shopName || selectedShop.name}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  map: { flex: 1 },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 }
    })
  },
  searchBar: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 }
    })
  },
  searchPlaceholder: { color: '#666', fontSize: 15, fontWeight: '500' },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 8,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  locateBtn: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    zIndex: 10,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  sheetBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    marginRight: 12,
  },
  sheetHandleArea: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 12,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
  },
  fullDetailSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 24,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  hoursCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  operatingHourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  dayText: {
    fontSize: 14,
    fontWeight: "750",
    color: '#1A1A1A'
  },
  timePill: {
    backgroundColor: '#F0EFE9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.05)',
  },
  timePillClosed: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
  },
  hoursText: {
    fontSize: 12,
    fontWeight: "800",
    color: '#1A1A1A'
  },
  hoursTextClosed: {
    color: '#ef4444',
  },

  barberListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  barberAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  barberListAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  barberStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  barberListInfo: {
    flex: 1
  },
  barberListHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  barberListName: {
    fontSize: 16,
    fontWeight: "800",
    color: '#1A1A1A'
  },
  barberListDetails: {
    flexDirection: "row",
    alignItems: "center"
  },
  barberRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EFE9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
  },
  webBookPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  webBookPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  barberRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  barberReviewsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 14,
  },
  headerPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  headerPillText: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#cbd5e1',
    opacity: 0.4,
    borderRadius: 1,
  },
  emptyBarbers: {
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    alignItems: 'center'
  },
  emptyText: {
    color: '#94a3b8',
    fontWeight: '600'
  },
  reviewsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  ratingOverview: {
    flexDirection: "row",
    alignItems: "center"
  },
  ratingLeft: {
    alignItems: "center",
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  overallRating: {
    fontSize: 32,
    fontWeight: "900",
    color: '#1A1A1A',
    marginBottom: 2,
  },
  starRow: {
    flexDirection: "row",
    marginBottom: 4,
    gap: 2
  },
  reviewCount: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: "600"
  },
  ratingBreakdown: {
    flex: 1,
    marginLeft: 16
  },
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  ratingBarLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 24,
  },
  ratingBarLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: '#64748b',
    textAlign: 'right',
  },
  ratingBarContainer: {
    flex: 1,
    height: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: "hidden"
  },
  ratingBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: '#f59e0b'
  },
  ratingBarCountText: {
    width: 28,
    fontSize: 10,
    fontWeight: "750",
    color: '#94a3b8',
    textAlign: 'right',
  },
  webStyleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  webStyleCardBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    opacity: 0.8,
    borderRadius: 24,
  },
  webStyleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  webStyleImageFrame: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  webStyleImage: {
    width: '100%',
    height: '100%',
  },
  webStyleInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 45,
  },
  webStyleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  webFeaturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    gap: 4,
  },
  webFeaturedBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
  },
  webPremiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  webPremiumBadgeText: {
    fontSize: 8,
    fontWeight: '00',
    color: '#f59e0b',
  },
  webVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.1)',
  },
  webVerifiedBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  webShopName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  webAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  webAddressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
  },
  webActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webDistancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  webDistanceText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  webBookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  webBookPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  webButtonsContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webServicesBtn: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  webServicesBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
  },
  webCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sheetContent: { padding: 12, paddingTop: 20, flex: 1 },
  welcomeText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  suggestionRow: { flexDirection: 'row', gap: 20, marginTop: 20 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  suggestionText: { fontWeight: '600', color: '#444' },
  shopName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.8 },
  shopAddress: { fontSize: 14, color: '#666', marginTop: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  statText: { fontWeight: '700', fontSize: 15 },
  dot: { color: '#ccc' },
  bookBtn: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  bookBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stickyFooter: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  // --- PERFECT ROUND MARKER STYLES ---
  roundMarkerShadow: {
    width: 34,
    height: 34,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ef4444',
    // Shadow goes on the outer layer (no overflow:hidden here)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundMarkerInner: {
    width: '100%',
    height: '100%',
    borderRadius: 100, // Dynamic circle clipping
    overflow: 'hidden', // Clipping happens here
    backgroundColor: '#f1f5f9',
  },
  roundMarkerSelected: {
    borderColor: '#1A1A1A',
    borderWidth: 2.5,
  },
  roundMarkerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  // --- USER MARKER STYLES ---
  userMarkerWrapper: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(26, 26, 26, 0.1)',
  },
  userMarkerCore: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.8,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  locateBtnContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  locateBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  // --- COLLAPSIBLE STYLES ---
  collapsibleWrapper: {
    marginBottom: 16,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  collapsibleContent: {
    paddingTop: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  recentReviewsList: {
    marginTop: 8,
  },
  reviewsScrollContainer: {
    paddingRight: 16,
    paddingBottom: 4,
  },
  reviewItemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    width: 280,
    minHeight: 90,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewItemUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewItemAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  reviewAvatarImage: {
    width: '100%',
    height: '100%',
  },
  reviewAvatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EFE9',
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  reviewUserName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  reviewItemDate: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 1,
  },
  reviewItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  reviewItemRatingText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#D97706',
  },
  reviewCommentText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '500',
  },
  sheetMapShadow: {
    height: 250,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  sheetMapInner: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mapDistanceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  mapDistanceText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
  },
  mapActionOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'column',
    gap: 8,
    zIndex: 30,
  },
  mapActionSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  hoursCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  operatingHourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  timePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hoursText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
});

export default ShopMapScreen;
