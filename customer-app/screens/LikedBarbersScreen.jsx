import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  ArrowLeft,
  Bookmark,
  AlertTriangle,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Search,
  HeartOff,
  X,
  Scissors,
  CheckCircle,
  Zap,
} from "lucide-react-native";
import axios from "axios";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = 280;

// --- 1. MEMOIZED ALERT COMPONENT ---
const ModernAlert = React.memo(({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 50,
          friction: 9,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      const timer = setTimeout(() => hide(), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        localStyles.alertWrapper,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: type === "error" ? "#FF3B30" : "#1A1A1A",
        },
      ]}
    >
      {type === "error" ? (
        <AlertTriangle color="#FFF" size={18} />
      ) : (
        <ShieldCheck color="#4ADE80" size={18} />
      )}
      <Text style={localStyles.alertText}>{message}</Text>
    </Animated.View>
  );
});

// --- 2. PREMIUM EMPTY STATE COMPONENT ---
const EmptyState = ({ theme, onExplore, dynamicStyles }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[dynamicStyles.emptyContainer, { opacity: fadeAnim }]}
    >
      <View style={dynamicStyles.iconCircle}>
        <HeartOff size={48} color={theme.colors.primary} strokeWidth={1.5} />
      </View>
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
        <Search size={18} color="#FFF" />
        <Text style={dynamicStyles.exploreButtonText}>Explore Services</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

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
      image: {uri: shop.owner.profilePicture},
      rating: shop.owner.rating || 0,
      reviewCount: getReviewCount(null, shop.reviews),
      category: shop.category || 'Barber',
      avgAppointmentTime: shop.avgAppointmentTime || '30 min',
      totalServices: shop.services?.length || 0,
      isAvailable: shop.owner.isAvailable,
      todaysBookings: bookingsPerProvider,
      listingTier: shop.listingTier,
      shopName: shop.name,
      owner: { ...shop.owner, maxAppointmentsPerDay: shop.owner?.maxAppointmentsPerDay || 10 },
    };
  }, [shop, bookingsPerProvider]);

  const staffBarbers = useMemo(() => (shop.staff || []).map((staffMember, index) => {
    return {
      id: staffMember._id || `staff-${index}`,
      type: 'barber',
      barberId: staffMember._id,
      name: staffMember.name || 'Unknown Provider',
      address: shop.address,
      image: {uri: staffMember.profilePicture || 'https://via.placeholder.com/150'},
      rating: staffMember.rating || 0,
      reviewCount: 0,
      category: shop.category || 'Barber',
      avgAppointmentTime: shop.avgAppointmentTime || '30 min',
      totalServices: shop.services?.length || 0,
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
             <View style={{flex: 1}}>
                <Text style={[styles.modalTitle, {color: theme.colors.text}]} numberOfLines={1}>{shop.name}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                   <View style={{backgroundColor: theme.colors.card, padding: 4, borderRadius: 6, marginRight: 6}}>
                        <MapPin size={12} color={theme.colors.primary} />
                   </View>
                   <Text style={[styles.modalSubtitle, {color: theme.colors.textSecondary}]} numberOfLines={1}>{shop.address}</Text>
                </View>
             </View>
             <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={theme.colors.text} />
             </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
              <View style={styles.sectionHeader}>
                 <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Shop Owner</Text>
                 <View style={styles.sectionLine} />
              </View>
              <ShopProviderCard
                item={ownerBarber}
                isLiked={checkIsLiked(ownerBarber.id)}
                premiumInfo={premiumAvailability[ownerBarber.id]}
                theme={theme}
                styles={styles}
                onPress={onCardPress}
                onLikePress={onLike}
                onCheckAppointment={onBook}
                isSmall={true}
                showLikeButton={true}
              />

              {staffBarbers.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                     <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Expert Team ({staffBarbers.length})</Text>
                     <View style={styles.sectionLine} />
                  </View>
                  {staffBarbers.map((barber) => (
                    <ShopProviderCard
                      key={barber.id}
                      item={barber}
                      isLiked={checkIsLiked(barber.id)}
                      premiumInfo={premiumAvailability[barber.id]}
                      theme={theme}
                      styles={styles}
                      onPress={onCardPress}
                      onLikePress={onLike}
                      onCheckAppointment={onBook}
                      isSmall={true}
                      showLikeButton={true}
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

// --- 4. SHOP PROVIDER CARD (for modal) ---
const ShopProviderCard = React.memo(
  ({ item, isLiked, premiumInfo, theme, styles, onPress, onLikePress, onCheckAppointment, isSmall = false, showLikeButton = true }) => {

    const { fullness, isAlmostFull, hasPremiumSlots, maxAppointments } = useMemo(() => {
      const maxApps = item.owner?.maxAppointmentsPerDay
        ? Math.max(item.todaysBookings, item.owner.maxAppointmentsPerDay)
        : 20;
      const full = Math.min((item.todaysBookings / maxApps) * 100, 100);
      return {
        maxAppointments: maxApps,
        fullness: full,
        isAlmostFull: full > 90,
        hasPremiumSlots: premiumInfo && premiumInfo.count > 0,
      };
    }, [item.todaysBookings, item.owner, premiumInfo]);

    const capacityText = useMemo(() => {
      if (isAlmostFull && hasPremiumSlots) return `${premiumInfo.count} Premium Slots`;
      if (fullness > 90) return "High Demand";
      return `${maxAppointments - item.todaysBookings} slots left`;
    }, [isAlmostFull, hasPremiumSlots, fullness, maxAppointments, item.todaysBookings, premiumInfo]);

    const handlePress = useCallback(() => onPress(item), [onPress, item]);
    const handleLike = useCallback(() => onLikePress(item.id), [onLikePress, item.id]);
    const handleBook = useCallback(() => onCheckAppointment(item), [onCheckAppointment, item]);

    const reviewCountDisplay = typeof item.reviewCount === 'number'
      ? item.reviewCount
      : (Array.isArray(item.reviews) ? item.reviews.length : 0);

    return (
      <Pressable onPress={handlePress} style={[styles.barberCard, isSmall && styles.smallCard]}>
        <View style={[styles.cardImageContainer, isSmall && { height: 180 }]}>
          <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.gradientOverlay} />

          <View style={styles.cardTopRow}>
            <View style={styles.glassBadge}>
              <Text style={styles.ratingBadgeText}>{item.rating > 0 ? item.rating.toFixed(1) : "New"}</Text>
              <Star size={12} color="#000" fill="#000" style={{ marginLeft: 3, marginBottom: 1 }} />
            </View>

            {showLikeButton && (
              <TouchableOpacity style={styles.heartButton} onPress={handleLike} activeOpacity={0.7}>
                <Bookmark size={20} color={isLiked ? "#FF3B30" : "#fff"} fill={isLiked ? "#FF3B30" : "transparent"} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.cardBottomInfo}>
            {!item.isAvailable ? (
              <View style={[styles.statusPill, { backgroundColor: "#FF3B30" }]}>
                 <Clock size={12} color="#fff" style={{marginRight:4}} strokeWidth={3}/>
                <Text style={[styles.statusText, {color: '#fff'}]}>CLOSED</Text>
              </View>
            ) : (
              <View style={styles.statusPill}>
                <View style={styles.liveDotWrapper}>
                  <View style={styles.liveDot} />
                </View>
                <Text style={styles.statusText}>OPEN NOW</Text>
              </View>
            )}
             {hasPremiumSlots && isAlmostFull && (
              <View style={[styles.statusPill, { backgroundColor: "#FFD700", marginLeft: 8 }]}>
                <Zap size={12} color="#000" fill="#000" style={{marginRight: 2}} />
                <Text style={[styles.statusText, {color: '#000'}]}>PREMIUM</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardHeaderCol}>
            <Text style={[styles.barberName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                <MapPin size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.shopName, { color: theme.colors.textSecondary, marginLeft: 4 }]} numberOfLines={1}>{item.shopName || item.address}</Text>
            </View>
          </View>

          {item.type !== "shop" && (
            <>
              <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                     <Clock size={14} color={theme.colors.textSecondary} />
                     <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{item.avgAppointmentTime}</Text>
                  </View>

                  <View style={styles.dotSeparator} />

                  <View style={styles.metaItem}>
                     <Scissors size={14} color={theme.colors.textSecondary} />
                     <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{item.totalServices} Services</Text>
                  </View>

                  <View style={styles.dotSeparator} />

                  <View style={styles.metaItem}>
                     <Star size={14} color={theme.colors.textSecondary} />
                     <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{reviewCountDisplay} Reviews</Text>
                  </View>
              </View>

              <View style={styles.cardFooter}>
                {item.isAvailable && (
                  <View style={styles.capacityContainer}>
                    <View style={{flexDirection:'row', alignItems: 'center', marginBottom: 6}}>
                       <Text style={[styles.capacityText, { color: fullness > 80 ? '#FF3B30' : '#27AE60' }]}>{capacityText}</Text>
                    </View>
                    <View style={styles.capacityBarTrack}>
                      <Animated.View style={[styles.capacityBarFill, { width: `${fullness}%`, backgroundColor: fullness > 80 ? "#FF3B30" : "#27AE60" }]} />
                    </View>
                  </View>
                )}

                <TouchableOpacity
                   style={[styles.bookButton, { backgroundColor: item.isAvailable ? theme.colors.primary : theme.colors.border }]}
                   onPress={handleBook}
                   activeOpacity={item.isAvailable ? 0.7 : 1}
                   disabled={!item.isAvailable}
                >
                  <Text style={[styles.bookButtonText, { color: item.isAvailable ? '#fff' : '#999' }]}>
                     {item.isAvailable ? 'Live Queue' : 'Closed'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Pressable>
    );
  },
  (prev, next) => prev.item.id === next.item.id && prev.item.todaysBookings === next.item.todaysBookings && prev.item.isAvailable === next.item.isAvailable && prev.isLiked === next.isLiked
);

// --- 5. OPTIMIZED CARD COMPONENT ---
const LikedServiceCard = React.memo(
  ({ item, theme, cardStyles, onPress, onUnlike }) => {
    const maxAppointments = item.owner
      ? Math.max(item.todaysBookings, item.owner.maxAppointmentsPerDay)
      : item.todaysBookings;

  return (
      <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [
          cardStyles.premiumCard,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View style={cardStyles.imageWrapper}>
          <Image
            source={item.image}
            style={cardStyles.cardImage}
            resizeMode="cover"
          />
          {item.rating > 0 && (
            <View style={cardStyles.ratingBadge}>
              <Star size={10} color="#FFD700" fill="#FFD700" />
              <Text style={cardStyles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onUnlike(item._id)}
            style={cardStyles.likeTrigger}
          >
            <Bookmark size={22} color="#FF3B30" fill="#FF3B30" />
          </TouchableOpacity>
        </View>

        <View style={cardStyles.cardContent}>
          <View style={cardStyles.titleRow}>
            <Text
              style={[cardStyles.shopName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={cardStyles.tagBadge}>
              <Text style={cardStyles.tagText}>
                {item.tag || item.category}
              </Text>
            </View>
          </View>

          <View style={cardStyles.infoGrid}>
            <View style={cardStyles.infoItem}>
              <MapPin size={12} color="#888" />
              <Text style={cardStyles.infoLabel} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
            <View style={cardStyles.infoItem}>
              <Clock size={12} color="#888" />
              <Text style={cardStyles.infoLabel}>
                {item.avgAppointmentTime}
              </Text>
            </View>
          </View>

          <View style={cardStyles.progressContainer}>
            <View style={cardStyles.progressHeader}>
              <Text style={cardStyles.progressTitle}>Availability Today</Text>
              <Text style={cardStyles.progressValue}>
                {item.todaysBookings}/{maxAppointments}
              </Text>
            </View>
            <View style={cardStyles.progressBarBg}>
              <View
                style={[
                  cardStyles.progressBarFill,
                  {
                    width: `${(item.todaysBookings / maxAppointments) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </Pressable>
    );
  },
  (prev, next) =>
    prev.item._id === next.item._id && prev.theme.dark === next.theme.dark
);

// --- MAIN SCREEN ---
const LikedBarbersScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { likedProviders, unlikeProvider } = useAuth();

  const [likedBarbers, setLikedBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  const dynamicStyles = useMemo(() => getStyles(theme), [theme]);

  useEffect(() => {
    let isMounted = true;
    const fetchLikedBarbers = async () => {
      try {
        // Fetch liked providers from the new API
        const likedProvidersRes = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/api/liked-barbers`
        );
        const likedProviders = likedProvidersRes.data.likedProviders || [];

        console.log('Liked providers from API:', likedProviders.length);

        if (likedProviders.length > 0) {
          // Transform the liked providers data to match our expected format
          const transformedLikedBarbers = likedProviders.map(provider => ({
            _id: provider._id,
            id: provider._id,
            barberId: provider.barberId,
            name: provider.name,
            address: provider.address,
            image: provider.image,
            rating: provider.rating,
            reviews: provider.reviews || [],
            reviewCount: provider.reviewCount || 0,
            services: provider.services || [],
            category: provider.category,
            tag: provider.tag,
            avgAppointmentTime: provider.avgAppointmentTime,
            totalServices: provider.totalServices || 0,
            isAvailable: provider.isAvailable,
            todaysBookings: provider.todaysBookings || 0,
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
        setToast({
          visible: true,
          message: "Failed to load favorites. Please try again.",
          type: "error",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLikedBarbers();
    return () => {
      isMounted = false;
    };
  }, [likedProviders]);

  const handleUnlike = useCallback(
    async (id) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const success = await unlikeProvider(id, 'barber');
      if (success) {
        setToast({
          visible: true,
          message: "Removed from favorites",
          type: "info",
        });
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
      userTier: "premium",
    });
  }, [navigation]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          dynamicStyles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />

        <ModernAlert
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
        />

        <View style={dynamicStyles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={dynamicStyles.backCircle}
          >
            <ArrowLeft size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={dynamicStyles.headerTitle}>Favorites</Text>
            <Text style={dynamicStyles.secureText}>
              Privacy Encrypted Selection
            </Text>
          </View>
        </View>

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
            data={likedBarbers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <LikedServiceCard
                item={item}
                theme={theme}
                cardStyles={dynamicStyles}
                onPress={() => handlePress(item)}
                onUnlike={handleUnlike}
              />
            )}
            contentContainerStyle={dynamicStyles.list}
            showsVerticalScrollIndicator={false}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: CARD_HEIGHT,
              offset: CARD_HEIGHT * index,
              index,
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// --- STYLING ---
const localStyles = StyleSheet.create({
  alertWrapper: {
    position: "absolute",
    alignSelf: "center",
    width: width - 40,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  alertText: { color: "#FFF", fontWeight: "700", marginLeft: 10, fontSize: 13 },
});

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      paddingBottom: 10,
    },
    backCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.dark ? "#222" : "#F0F0F0",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: "900",
      color: theme.colors.text,
      letterSpacing: -1,
    },
    secureText: {
      fontSize: 10,
      color: "#4ADE80",
      fontWeight: "800",
      marginTop: 2,
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    // Empty State Styling
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
      marginTop: -40,
    },
    iconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.primary + "10",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 10,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 14,
      color: "#888",
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 30,
    },
    exploreButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 25,
      paddingVertical: 14,
      borderRadius: 30,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    exploreButtonText: {
      color: "#FFF",
      fontWeight: "800",
      fontSize: 15,
      marginLeft: 8,
    },

    list: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50 },
    premiumCard: {
      height: CARD_HEIGHT - 20,
      backgroundColor: theme.dark ? "#1A1A1A" : "#FFF",
      borderRadius: 24,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.dark ? "#333" : "#F0F0F0",
      overflow: "hidden",
    },
    imageWrapper: { height: "55%", width: "100%", position: "relative" },
    cardImage: { width: "100%", height: "100%" },
    ratingBadge: {
      position: "absolute",
      top: 12,
      left: 12,
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
    },
    ratingText: {
      color: "#FFF",
      fontSize: 11,
      fontWeight: "800",
      marginLeft: 3,
    },
    unlikeTrigger: {
      position: "absolute",
      top: 10,
      right: 10,
      backgroundColor: "#FFF",
      padding: 8,
      borderRadius: 20,
    },
    cardContent: { padding: 15, flex: 1, justifyContent: "space-between" },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    shopName: { fontSize: 17, fontWeight: "800", flex: 1, marginRight: 10 },
    tagBadge: {
      backgroundColor: "#007BFF15",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    tagText: { color: "#007BFF", fontSize: 10, fontWeight: "700" },
    infoGrid: { flexDirection: "row", marginTop: 8 },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 15,
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: "#888",
      marginLeft: 4,
      fontWeight: "500",
    },
    progressContainer: { marginTop: 10 },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 5,
    },
    progressTitle: { fontSize: 11, fontWeight: "600", color: "#888" },
    progressValue: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.text,
    },
    progressBarBg: {
      height: 5,
      backgroundColor: theme.dark ? "#333" : "#F0F0F0",
      borderRadius: 3,
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: "#007BFF",
      borderRadius: 3,
    },

    // Modal Styles
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject },
    modalContent: { maxHeight: height * 0.85, height: 'auto', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 30 },
    modalHandleContainer: { alignItems: 'center', paddingVertical: 14 },
    modalHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, lineHeight: 26 },
    modalSubtitle: { fontSize: 14, fontWeight: '600' },
    closeBtn: { padding: 6, backgroundColor: theme.colors.card, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '800', marginRight: 10 },
    sectionLine: { flex: 1, height: 1, backgroundColor: theme.colors.border, opacity: 0.5 },

    // Card Styles for Modal
    barberCard: { backgroundColor: theme.colors.card, borderRadius: 24, marginBottom: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: theme.colors.border },
    smallCard: { marginBottom: 16, borderRadius: 20, shadowOpacity: 0.04 },
    cardImageContainer: { height: 180, width: "100%", overflow: 'hidden', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    cardImage: { width: "100%", height: "100%", justifyContent: 'space-between' },
    gradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(0,0,0,0.5)' },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
    glassBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity: 0.1, shadowRadius: 4 },
    ratingBadgeText: { fontSize: 12, fontWeight: '800', color: '#000' },
    heartButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    cardBottomInfo: { padding: 12, flexDirection: 'row', alignItems: 'center' },
    statusPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#fff', shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity: 0.1, shadowRadius: 4 },
    liveDotWrapper: { width: 8, height: 8, marginRight: 4, justifyContent: 'center', alignItems: 'center' },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00C853' },
    statusText: { color: '#000', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    cardBody: { padding: 16, paddingTop: 14 },
    cardHeaderCol: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8 },
    barberName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, lineHeight: 26 },
    shopName: { fontSize: 15, fontWeight: '500' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 16, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
    dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, marginHorizontal: 10 },
    cardFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    capacityContainer: { flex: 1, marginRight: 16, paddingBottom: 2 },
    capacityBarTrack: { height: 4, backgroundColor: theme.dark ? '#333' : '#E0E0E0', borderRadius: 2, overflow: 'hidden' },
    capacityBarFill: { height: '100%', borderRadius: 2 },
    capacityText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    bookButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 14, shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowOffset: {width:0, height:3}, shadowRadius: 6, elevation: 3 },
    bookButtonText: { fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
  });

export default LikedBarbersScreen;
