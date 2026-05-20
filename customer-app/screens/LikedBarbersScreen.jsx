import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  useRef
} from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Platform,
  StatusBar,
  Pressable,
  Modal,
  ScrollView
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../utils/api";
import {
  ArrowLeft,
  ChevronLeft,
  Bookmark,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Search,
  HeartOff,
  X,
  Scissors,
  CheckCircle,
  Zap
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import BarberCard from "../src/components/BarberCard";


const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = 280;

const scale = width / 375;
const normalize = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  } else {
    return Math.round(newSize) - 1;
  }
};

const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'object' && image.uri) return image;
  if (typeof image === 'string') {
    if (image.startsWith('http') || image.startsWith('data:')) return { uri: image };
    const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://192.168.29.243:5000';
    return { uri: `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}` };
  }
  return image;
};

// --- 1. OPTIMIZED SUB-COMPONENTS ---

const Header = memo(({ onBack, insets, count }) => (
  <View 
    style={[localStyles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}
    accessibilityRole="header"
  >
    <TouchableOpacity 
      onPress={onBack} 
      style={localStyles.backBtn}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <ChevronLeft size={normalize(22)} color="#1E293B" strokeWidth={2.5} />
    </TouchableOpacity>
    <View style={{ alignItems: 'center' }}>
      <Text style={localStyles.headerTitle}>Favorites</Text>
      <Text style={localStyles.headerSubtitle}>{count} {count === 1 ? 'expert' : 'experts'} saved</Text>
    </View>
    <View style={{ width: normalize(40) }} />
  </View>
));

const CustomToast = memo(({ visible, message, type, animatedValue }) => {
  if (!visible) return null;

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const isSuccess = type === "success";
  const iconColor = isSuccess ? "#10B981" : "#EF4444";

  return (
    <Animated.View
      style={[
        localStyles.toastContainer,
        { transform: [{ translateY }] },
      ]}
      accessibilityLiveRegion="polite"
    >
      <View style={[localStyles.toastContent, { borderLeftColor: iconColor }]}>
        {isSuccess ? <CheckCircle size={20} color={iconColor} /> : <AlertCircle size={20} color={iconColor} />}
        <View style={localStyles.toastTextContainer}>
          <Text style={localStyles.toastMessage}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

// --- 2. PREMIUM EMPTY STATE COMPONENT ---
const EmptyState = ({ theme, onExplore, dynamicStyles }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance Animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();

    // Floating Loop Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[dynamicStyles.emptyContainer, { opacity: fadeAnim }]}
    >
      <Animated.View style={[dynamicStyles.iconCircle, { transform: [{ translateY: floatAnim }] }]}>
        <HeartOff size={normalize(48)} color={theme.colors.primary} strokeWidth={1.5} />
      </Animated.View>
      <Text style={[dynamicStyles.emptyTitle, { color: theme.colors.text }]}>
        No favorites yet
      </Text>
      <Text style={dynamicStyles.emptySubtitle}>
        Tap the bookmark icon on any service to save it here for quick booking.
      </Text>
      <TouchableOpacity
        style={[
          dynamicStyles.exploreButton,
          { backgroundColor: theme.colors.primary },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onExplore();
        }}
      >
        <Search size={normalize(18)} color="#FFF" />
        <Text style={dynamicStyles.exploreButtonText}>Explore Services</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedListItem = memo(({ children, index }) => {
  const itemAnim = useRef(new Animated.Value(30)).current;
  const itemFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(itemAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }),
      Animated.timing(itemFade, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: itemFade, transform: [{ translateY: itemAnim }] }}>
      {children}
    </Animated.View>
  );
});

// --- 3. SHOP DETAILS BOTTOM SHEET ---
const ShopDetailsSheet = ({ visible, shop, onClose, theme, styles, onLike, onBook, onCardPress, checkIsLiked, premiumAvailability }) => {
  if (!shop) return null;

  const getReviewCount = (data, fallback) => {
    if (typeof data?.reviewCount === 'number') return data.reviewCount;
    if (Array.isArray(fallback)) return fallback.length;
    return 0;
  };

  const totalProviders = 1 + (shop.staff?.length || 0); // owner + staff
  const bookingsPerProvider = totalProviders > 0 ? Math.floor(shop.todaysBookings / totalProviders) : 0;

  const ownerBarber = useMemo(() => {
    return {
      id: shop.owner._id || 'owner',
      type: 'barber',
      barberId: shop.owner._id,
      name: shop.owner.name,
      address: shop.address,
      image: { uri: shop.owner.profilePicture },
      rating: shop.owner.rating || 0,
      reviewCount: getReviewCount(null, shop.reviews),
      category: shop.category || 'Barber',
      avgAppointmentTime: shop.avgAppointmentTime || '30 min',
      totalServices: shop.services?.length || 0,
      services: shop.services || [],
      isAvailable: shop.owner.isAvailable,
      todaysBookings: bookingsPerProvider,
      listingTier: shop.listingTier,
      shopName: shop.name,
      owner: { ...shop.owner, maxAppointmentsPerDay: shop.owner?.maxAppointmentsPerDay || 10 }
    };
  }, [shop, bookingsPerProvider]);

  const staffBarbers = useMemo(() => (shop.staff || []).map((staffMember, index) => {
    return {
      id: staffMember._id || `staff-${index}`,
      type: 'barber',
      barberId: staffMember._id,
      name: staffMember.name || 'Unknown Provider',
      address: shop.address,
      image: { uri: staffMember.profilePicture || 'https://via.placeholder.com/150' },
      rating: staffMember.rating || 0,
      reviewCount: 0,
      category: shop.category || 'Barber',
      avgAppointmentTime: shop.avgAppointmentTime || '30 min',
      totalServices: shop.services?.length || 0,
      services: shop.services || [],
      isAvailable: staffMember.isAvailable,
      todaysBookings: bookingsPerProvider,
      listingTier: shop.listingTier,
      shopName: shop.name,
      owner: { maxAppointmentsPerDay: staffMember.maxAppointmentsPerDay || 10 }
    };
  }), [shop, bookingsPerProvider]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHandleContainer}>
            <View style={styles.modalHandle} />
          </View>

          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]} numberOfLines={1}>{shop.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <View style={{ backgroundColor: theme.colors.card, padding: 4, borderRadius: 6, marginRight: 6 }}>
                  <MapPin size={12} color={theme.colors.primary} />
                </View>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>{shop.address}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Shop Owner</Text>
              <View style={styles.sectionLine} />
            </View>
            <BarberCard
              item={ownerBarber}
              isLiked={checkIsLiked(ownerBarber.id)}
              premiumInfo={premiumAvailability[ownerBarber.id]}
              onPress={onCardPress}
              onLikePress={onLike}
              onBookPress={onBook}
              isSmall={true}
            />

            {staffBarbers.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Expert Team ({staffBarbers.length})</Text>
                  <View style={styles.sectionLine} />
                </View>
                {staffBarbers.map((barber) => (
                  <BarberCard
                    key={barber.id}
                    item={barber}
                    isLiked={checkIsLiked(barber.id)}
                    premiumInfo={premiumAvailability[barber.id]}
                    onPress={onCardPress}
                    onLikePress={onLike}
                    onBookPress={onBook}
                    isSmall={true}
                  />
                ))}
              </>
            )}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
};

// ShopProviderCard removed in favor of BarberCard


// --- MAIN SCREEN ---
const LikedBarbersScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { likedProviders, unlikeProvider } = useAuth();

  const [likedBarbers, setLikedBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info"
  });

  const filteredLikedBarbers = useMemo(() => {
    if (!searchQuery) return likedBarbers;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return likedBarbers.filter(barber => 
      (barber.name || "").toLowerCase().includes(lowerQuery) ||
      (barber.address || "").toLowerCase().includes(lowerQuery) ||
      (barber.shopName || "").toLowerCase().includes(lowerQuery)
    );
  }, [likedBarbers, searchQuery]);

  const toastAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToast(p => ({ ...p, visible: false })));
    }, 3000);
  }, []);

  const dynamicStyles = useMemo(() => getStyles(theme, insets), [theme, insets]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetchLikedBarbers = async () => {
        try {
          // Fetch liked providers from the new API
          const likedProvidersRes = await api.get('/api/liked-barbers');
          const providers = likedProvidersRes.data.likedProviders || [];

          console.log('Liked providers from API:', providers.length);

          let stats = {};
          try {
            const todayStr = new Date().toISOString().split('T')[0];
            const statsRes = await api.get(`/api/booking/todays-stats?date=${todayStr}`, { timeout: 4000 });
            if (statsRes.data) {
              stats = statsRes.data;
            }
          } catch (statsErr) {
            console.warn("Failed to fetch today's bookings stats in LikedBarbersScreen:", statsErr.message);
          }

          if (providers.length > 0) {
            // Transform the liked providers data to match our expected format
            const transformedLikedBarbers = providers.map(provider => ({
              _id: provider._id,
              id: provider._id,
              barberId: provider.barberId,
              name: provider.name,
              address: provider.address,
              image: (typeof provider.image === 'string' && provider.image.includes('placeholder')) ? null : provider.image,
              rating: provider.rating,
              reviews: provider.reviews || 0,
              reviewCount: (typeof provider.reviews === 'number' ? provider.reviews : 0) || provider.reviewCount || (Array.isArray(provider.reviews) ? provider.reviews.length : 0) || 0,
              numberOfReviews: (typeof provider.reviews === 'number' ? provider.reviews : 0) || provider.numberOfReviews || provider.reviewCount || (Array.isArray(provider.reviews) ? provider.reviews.length : 0) || 0,
              services: provider.services || [],
              category: provider.category,
              tag: provider.tag,
              avgAppointmentTime: provider.avgAppointmentTime,
              totalServices: provider.totalServices || 0,
              isAvailable: provider.isAvailable,
              todaysBookings: stats[provider.barberId] || stats[provider._id] || provider.todaysBookings || 0,
              shopName: provider.shopName,
              type: 'barber',
              likedAt: provider.likedAt
            }));

            console.log('Transformed liked barbers:', transformedLikedBarbers.length);
            setLikedBarbers(transformedLikedBarbers);
          } else {
            setLikedBarbers([]);
          }
        } catch (err) {
          console.error('Error fetching liked providers:', err);
          showToast("Failed to load favorites. Please try again.", "error");
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchLikedBarbers();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleUnlike = useCallback(
    async (id) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const success = await unlikeProvider(id, 'barber');
      if (success) {
        showToast("Removed from favorites", "info");
      }
    },
    [unlikeProvider]
  );

  const handlePress = useCallback(
    (item) => {
      if (item.type === "shop") {
        setSelectedShop(item);
        return;
      }
      navigation.navigate("Booking", { barberData: item });
    },
    [navigation]
  );

  const handleCardPressForModal = useCallback((item) => {
    setSelectedShop(null);
    navigation.navigate("Booking", { barberData: item });
  }, [navigation]);

  const handleCheckAppointment = useCallback((item) => {
    setSelectedShop(null);
    navigation.navigate("Appointmentcheckpage", {
      barberData: item,
      userTier: "premium"
    });
  }, [navigation]);

  return (
    <View
        style={[
          dynamicStyles.container,
          { backgroundColor: "#FFFFFF" },
        ]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={[localStyles.toastWrapper, { top: insets.top + 10 }]}>
          <CustomToast visible={toast.visible} message={toast.message} type={toast.type} animatedValue={toastAnim} />
        </View>

        <Header onBack={() => navigation.goBack()} insets={insets} count={likedBarbers.length} />

        {loading ? (
          <View style={dynamicStyles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : likedBarbers.length === 0 ? (
          <EmptyState
            theme={theme}
            onExplore={() => navigation.navigate("Home")}
            dynamicStyles={dynamicStyles}
          />
        ) : (
          <FlatList
            data={filteredLikedBarbers}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <AnimatedListItem index={index}>
                <BarberCard
                  item={item}
                  isLiked={true}
                  onPress={handlePress}
                  onLikePress={() => handleUnlike(item._id)}
                  onBookPress={handleCheckAppointment}
                  isSmall={false}
                />
              </AnimatedListItem>
            )}
            contentContainerStyle={dynamicStyles.list}
            ListHeaderComponent={
              <View style={dynamicStyles.sectionHeader}>
                <View style={dynamicStyles.headerPill}>
                  <Text style={dynamicStyles.headerPillText}>Saved Professionals</Text>
                </View>
                <View style={dynamicStyles.headerLine} />
              </View>
            }

            showsVerticalScrollIndicator={false}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: CARD_HEIGHT,
              offset: CARD_HEIGHT * index,
              index
            })}
          />
        )}

        {/* SHOP DETAILS MODAL */}
        <ShopDetailsSheet
          visible={!!selectedShop}
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
          theme={theme}
          styles={dynamicStyles}
          onLike={handleUnlike}
          onBook={handleCheckAppointment}
          onCardPress={handleCardPressForModal}
          checkIsLiked={(id) => likedBarbers.some(barber => barber._id === id)}
          premiumAvailability={{}}
        />
      </View>
  );
};

// --- STYLING ---
const localStyles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  headerTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5
  },
  headerSubtitle: {
    fontSize: normalize(10),
    color: "#64748B",
    fontWeight: "600",
    marginTop: normalize(2)
  },
  backBtn: {
    padding: normalize(8),
    borderRadius: normalize(12),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  toastWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2000,
    alignItems: "center"
  },
  toastContainer: {
    width: width - 40,
    backgroundColor: "#FFF",
    borderRadius: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  toastContent: {
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  toastTextContainer: {
    flex: 1
  },
  toastMessage: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600"
  }
});

const getStyles = (theme, insets) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFFFFF" },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 20,
      paddingHorizontal: 0,
    },
    headerPill: {
      backgroundColor: '#F8F9FA',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 100,
      marginRight: 10,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.06)',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    headerPillText: {
      color: '#1A1A1A',
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      fontWeight: '800'
    },
    headerLine: {
      flex: 1,
      height: 1.5,
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
      borderRadius: 1
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: normalize(20),
      paddingBottom: normalize(10)
    },
    backCircle: {
      width: normalize(42),
      height: normalize(42),
      borderRadius: normalize(21),
      backgroundColor: "#F8FAFC",
      justifyContent: "center",
      alignItems: "center",
      marginRight: normalize(15)
    },
    headerTitle: {
      fontSize: normalize(26),
      fontWeight: "900",
      color: "#0F172A",
      letterSpacing: -1
    },
    secureText: {
      fontSize: normalize(10),
      color: "#10B981",
      fontWeight: "800",
      marginTop: normalize(2)
    },
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: normalize(20),
      paddingVertical: normalize(15),
      borderBottomWidth: 1,
      borderBottomColor: "#F1F5F9"
    },
    listHeaderAccent: {
      width: 4,
      height: 16,
      backgroundColor: '#0F172A',
      borderRadius: 2,
      marginRight: 10
    },
    listHeaderTitle: {
      fontSize: normalize(16),
      fontWeight: '800',
      flex: 1
    },
    listHeaderBadge: {
      paddingHorizontal: normalize(10),
      paddingVertical: normalize(4),
      borderRadius: 12,
      backgroundColor: "#F1F5F9"
    },
    listHeaderBadgeText: {
      fontSize: normalize(12),
      fontWeight: '800',
      color: "#0F172A"
    },

    // Empty State Styling
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: normalize(40),
      marginTop: normalize(-40),
      backgroundColor: "#FFFFFF"
    },
    iconCircle: {
      width: normalize(100),
      height: normalize(100),
      borderRadius: normalize(50),
      backgroundColor: "#F1F5F9",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: normalize(20)
    },
    emptyTitle: {
      fontSize: normalize(22),
      fontWeight: "800",
      marginBottom: normalize(10),
      textAlign: "center"
    },
    emptySubtitle: {
      fontSize: normalize(14),
      color: "#888",
      textAlign: "center",
      lineHeight: normalize(20),
      marginBottom: normalize(30)
    },
    exploreButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: normalize(25),
      paddingVertical: normalize(14),
      borderRadius: normalize(30)
    },
    exploreButtonText: {
      color: "#FFF",
      fontWeight: "800",
      fontSize: normalize(15),
      marginLeft: normalize(8)
    },

    list: { paddingHorizontal: normalize(20), paddingTop: normalize(10), paddingBottom: insets.bottom + normalize(60) },
    premiumCard: {
      height: normalize(CARD_HEIGHT - 20),
      backgroundColor: theme.dark ? "#1A1A1A" : "#FFF",
      borderRadius: normalize(24),
      marginBottom: normalize(20),
      borderWidth: 1,
      borderColor: theme.dark ? "#333" : "#F0F0F0",
      overflow: "hidden"
    },
    imageWrapper: { height: "55%", width: "100%", position: "relative" },
    cardImage: { width: "100%", height: "100%" },
    ratingBadge: {
      position: "absolute",
      top: normalize(12),
      left: normalize(12),
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: normalize(8),
      paddingVertical: normalize(4),
      borderRadius: normalize(10),
      flexDirection: "row",
      alignItems: "center"
    },
    ratingText: {
      color: "#FFF",
      fontSize: normalize(11),
      fontWeight: "800",
      marginLeft: normalize(3)
    },
    unlikeTrigger: {
      position: "absolute",
      top: normalize(10),
      right: normalize(10),
      backgroundColor: "#FFF",
      padding: normalize(8),
      borderRadius: normalize(20)
    },
    cardContent: { padding: normalize(15), flex: 1, justifyContent: "space-between" },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    shopName: { fontSize: normalize(17), fontWeight: "800", flex: 1, marginRight: normalize(10) },
    tagBadge: {
      backgroundColor: "#007BFF15",
      paddingHorizontal: normalize(8),
      paddingVertical: normalize(4),
      borderRadius: normalize(6)
    },
    tagText: { color: "#007BFF", fontSize: normalize(10), fontWeight: "700" },
    infoGrid: { flexDirection: "row", marginTop: normalize(8) },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: normalize(15),
      flex: 1
    },
    infoLabel: {
      fontSize: normalize(12),
      color: "#888",
      marginLeft: normalize(4),
      fontWeight: "500"
    },
    progressContainer: { marginTop: normalize(10) },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: normalize(5)
    },
    progressTitle: { fontSize: normalize(11), fontWeight: "600", color: "#888" },
    progressValue: {
      fontSize: normalize(11),
      fontWeight: "700",
      color: theme.colors.text
    },
    progressBarBg: {
      height: normalize(5),
      backgroundColor: theme.dark ? "#333" : "#F0F0F0",
      borderRadius: normalize(3)
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: "#007BFF",
      borderRadius: normalize(3)
    },

    // Modal Styles
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,20,20,0.5)' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject },
    modalContent: {
      maxHeight: height * 0.85,
      height: 'auto',
      borderTopLeftRadius: normalize(28),
      borderTopRightRadius: normalize(28),
      paddingHorizontal: normalize(20),
      paddingTop: normalize(10),
      backgroundColor: theme.colors.card,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    modalHandleContainer: { alignItems: 'center', paddingVertical: normalize(14) },
    modalHandle: { width: normalize(36), height: normalize(4), backgroundColor: theme.colors.border, borderRadius: normalize(2) },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: normalize(20) },
    modalTitle: { fontSize: normalize(22), fontWeight: '900', letterSpacing: -0.5, lineHeight: normalize(26), color: theme.colors.text },
    modalSubtitle: { fontSize: normalize(14), fontWeight: '600', color: theme.colors.textSecondary },
    closeBtn: { padding: normalize(6), backgroundColor: theme.colors.card, borderRadius: normalize(16), borderWidth: 0.5, borderColor: theme.colors.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: normalize(12) },
    sectionTitle: { fontSize: normalize(16), fontWeight: '800', marginRight: normalize(10), color: theme.colors.text },
    sectionLine: { flex: 1, height: 0.5, backgroundColor: theme.colors.border, opacity: 0.7 },

    // Card Styles for Modal
    barberCard: { backgroundColor: theme.colors.card, borderRadius: normalize(24), marginBottom: normalize(2), borderWidth: 1, borderColor: theme.colors.border },
    smallCard: { marginBottom: normalize(16), borderRadius: normalize(20), shadowOpacity: 0.04 },
    cardImageContainer: { height: normalize(180), width: "100%", overflow: 'hidden', borderTopLeftRadius: normalize(24), borderTopRightRadius: normalize(24) },
    cardImage: { width: "100%", height: "100%", justifyContent: 'space-between' },
    gradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(0,0,0,0.5)' },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', padding: normalize(12) },
    glassBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, paddingVertical: normalize(4), paddingHorizontal: normalize(10), borderRadius: normalize(12), borderWidth: 0.5, borderColor: theme.colors.border },
    ratingBadgeText: { fontSize: normalize(12), fontWeight: '800', color: theme.colors.text },
    heartButton: { width: normalize(32), height: normalize(32), borderRadius: normalize(16), backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    cardBottomInfo: { padding: normalize(12), flexDirection: 'row', alignItems: 'center' },
    statusPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(4), paddingHorizontal: normalize(8), borderRadius: normalize(8), backgroundColor: theme.colors.card, borderWidth: 0.5, borderColor: theme.colors.border },
    liveDotWrapper: { width: normalize(8), height: normalize(8), marginRight: normalize(4), justifyContent: 'center', alignItems: 'center' },
    liveDot: { width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: theme.colors.accent },
    statusText: { color: theme.colors.text, fontSize: normalize(10), fontWeight: '800', letterSpacing: 0.5 },
    cardBody: { padding: normalize(16), paddingTop: normalize(14) },
    cardHeaderCol: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: normalize(8) },
    barberName: { fontSize: normalize(22), fontWeight: '800', letterSpacing: -0.5, lineHeight: normalize(26) },
    shopName: { fontSize: normalize(15), fontWeight: '500' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: normalize(10), marginBottom: normalize(16), flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: normalize(14), fontWeight: '600', marginLeft: normalize(6) },
    dotSeparator: { width: normalize(4), height: normalize(4), borderRadius: normalize(2), backgroundColor: theme.colors.border, marginHorizontal: normalize(10) },
    cardFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    capacityContainer: { flex: 1, marginRight: normalize(16), paddingBottom: normalize(2) },
    capacityBarTrack: { height: normalize(4), backgroundColor: '#F0F0F0', borderRadius: normalize(2), overflow: 'hidden' },
    capacityBarFill: { height: '100%', borderRadius: normalize(2) },
    capacityText: { fontSize: normalize(12), fontWeight: '800', letterSpacing: 0.5 },
    bookButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(12), paddingHorizontal: normalize(22), borderRadius: normalize(14), backgroundColor: theme.colors.primary },
    bookButtonText: { fontWeight: '700', fontSize: normalize(15), letterSpacing: 0.3, color: '#FFFFFF' },
  });

export default LikedBarbersScreen;
