import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Linking,
  Dimensions,
  Platform,
  StatusBar,
  Pressable,
  Share,
  useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  FadeInDown,
  FadeInRight,
  Layout,
  withSpring
} from "react-native-reanimated";
import {
  ArrowLeft,
  ChevronLeft,
  Star,
  Clock,
  MapPin,
  Share2,
  ShieldCheck,
  Check,
  Map,
  ChevronRight,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Scissors,
  UserCheck,
  Sparkles,
  Waves,
  Zap,
  Hand,
  Palette,
  Wind
} from "lucide-react-native";
import api from "../utils/api";

// --- PERFORMANCE OPTIMIZATION: REMOVED CACHING TO FIX CONSTRUCTOR ERROR ---

// --- OPTIMIZATION: Memoized Child Components to prevent unnecessary re-renders ---
const ServiceItem = React.memo(
  ({ service, isSelected, onSelect, theme, styles, index, catMeta }) => {
    const serviceData = React.useMemo(() => ({
      name: service.name,
      price: service.price,
      time: service.time || "30",
      id: service.id || service._id,
      category: service.category || "General",
      description: service.description || "Professional grooming service tailored for your style."
    }), [service.name, service.price, service.time, service.id, service._id, service.description, service.category]);

    // Selection Animation
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);

    useEffect(() => {
      scale.value = withSpring(isSelected ? 1.01 : 1, { damping: 15 });
      glowOpacity.value = withSpring(isSelected ? 1 : 0);
    }, [isSelected]);

    const animatedCardStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      borderColor: isSelected ? "#1A1A1A" : "#F3F4F6",
      backgroundColor: "#FFFFFF",
      borderWidth: isSelected ? 1.5 : 1,
      shadowOpacity: interpolate(glowOpacity.value, [0, 1], [0.02, 0.08], Extrapolate.CLAMP)
    }));

    const handlePress = React.useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(serviceData.id);
    }, [onSelect, serviceData.id]);

    // PIXEL MIRROR: Safe Rendering for potentially encrypted backend objects
    const renderSafeValue = (val) => {
      if (!val) return "";
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val.content) return val.content;
      return JSON.stringify(val);
    };

    const displayPrice = React.useMemo(() => {
      const p = renderSafeValue(serviceData.price);
      if (!p) return "0";
      return p.toString().replace(/₹/g, '').trim();
    }, [serviceData.price]);

    const displayName = React.useMemo(() => renderSafeValue(serviceData.name), [serviceData.name]);
    const displayCategory = React.useMemo(() => renderSafeValue(serviceData.category), [serviceData.category]);

    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 30, 600)).springify()}
        layout={Layout.springify()}
        style={[
          styles.serviceCard,
          animatedCardStyle
        ]}
      >
        <TouchableOpacity
          style={styles.serviceContentWrapper}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          {/* PIXEL MIRROR: Absolute Color Strip */}
          <View style={[styles.sideStrip, { backgroundColor: catMeta?.color || theme.colors.primary }]} />

          <View style={styles.serviceLeftWrapper}>
            {/* PIXEL MIRROR: Solid Icon Box */}
            <View style={[
              styles.serviceIconContainerMirror,
              isSelected ? { backgroundColor: "#1A1A1A" } : { backgroundColor: "#F9F9F8" }
            ]}>
              {isSelected ? (
                <Check size={14} color="#C8FF00" strokeWidth={3.5} />
              ) : (
                <Text style={{ fontSize: 16 }}>{catMeta?.emoji || "💈"}</Text>
              )}
            </View>

            <View style={styles.serviceTextStack}>
              <View style={styles.serviceHeaderRowMirror}>
                <Text
                  style={[styles.serviceNameMirror, { color: "#1A1A1A", fontSize: 16 }]}
                >
                  {displayName}
                </Text>
              </View>

              {serviceData.description ? (
                <Text style={{
                  fontSize: 12,
                  fontFamily: "DMSans_400Regular",
                  color: "#606058",
                  marginTop: 4,
                  lineHeight: 16
                }} numberOfLines={2}>
                  {serviceData.description}
                </Text>
              ) : null}

              <Text style={[styles.serviceDescMirrorFixed, { marginTop: 6 }]}>
                {serviceData.time} min
              </Text>
            </View>
          </View>

          <View style={styles.serviceRightWrapper}>
            <Text style={[styles.servicePriceMirrorFixed, { color: "#1A1A1A" }]}>
              ₹{displayPrice}
            </Text>
            <View style={[styles.selectCircleMirror, isSelected && styles.selectCircleMirrorActive]}>
              {isSelected && <Check size={12} color="#FFF" strokeWidth={4} />}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isSelected === nextProps.isSelected &&
      (prevProps.service.id === nextProps.service.id || prevProps.service._id === nextProps.service._id) &&
      prevProps.service.name === nextProps.service.name &&
      prevProps.service.price === nextProps.service.price
    );
  }
);

// --- MODERN TOAST COMPONENT (Zomato/Blinkit Style) ---
const ToastNotification = ({ visible, message, type, onHide, topInset }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(topInset, { damping: 15, stiffness: 100 });
      opacity.value = withSpring(1);

      const timer = setTimeout(() => {
        handleHide();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      handleHide();
    }
  }, [visible]);

  const handleHide = () => {
    translateY.value = withSpring(-100);
    opacity.value = withSpring(0);
    if (onHide) setTimeout(onHide, 500);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value
  }));

  const getBackgroundColor = () => {
    switch (type) {
      case "success": return "#1A1A1A";
      case "error": return "#FF4444";
      default: return "#1A1A1A";
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 20,
          right: 20,
          zIndex: 9999,
          backgroundColor: getBackgroundColor(),
          borderRadius: 20,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
          alignSelf: 'center',
          maxWidth: '90%'
        },
        animatedStyle
      ]}
    >
      <View style={{ marginRight: 10 }}>
        {type === "success" ? <CheckCircle2 size={18} color="#C8FF00" /> : <AlertCircle size={18} color="#FFF" />}
      </View>
      <Text style={{ color: "#FFF", fontFamily: "DMSans_700Bold", fontSize: 13, flex: 1 }}>{message}</Text>
    </Animated.View>
  );
};

const BookingScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const { barberId, salonId, providerId, barberData } = route.params;

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedGender, setSelectedGender] = useState("all");
  const [categoriesMetadata, setCategoriesMetadata] = useState([]);
  const [isBooking, setIsBooking] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const { width, height: screenHeight } = useWindowDimensions();
  const isTablet = width > 768;
  const HERO_HEIGHT = isTablet ? 450 : 380;
  const [activeCategory, setActiveCategory] = useState("All");

  // Fetch Categories Metadata (Emojis/Colors)
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get("/api/categories");
        setCategoriesMetadata(res.data);
      } catch (err) {
        console.error("Failed to fetch categories metadata", err);
      }
    };
    fetchCats();
  }, []);

  const getCatMeta = useCallback((catName) => {
    if (!catName) return { color: "#64748B", emoji: "💈", gender: "unisex" };
    // Normalizing to handle backend case variations (e.g. HAIR vs Hair)
    const normalizedTarget = catName.toString().toLowerCase().trim();
    const found = categoriesMetadata.find(c => c.name?.toLowerCase().trim() === normalizedTarget);
    return found ? { color: found.color, emoji: found.emoji, gender: found.gender } : { color: "#64748B", emoji: "💈", gender: "unisex" };
  }, [categoriesMetadata]);

  // Website-Mirror filtering logic
  const filteredServices = useMemo(() => {
    if (!provider?.services) return [];

    // 1. Gender Filter
    let genderMatched = provider.services.filter(s => {
      if (!selectedGender || selectedGender === "all") return true;
      const meta = getCatMeta(s.category);
      // Failsafe: if no meta, show it under unisex
      const serviceGender = (meta?.gender || 'unisex').toLowerCase();
      return serviceGender === 'unisex' || serviceGender === selectedGender.toLowerCase();
    });

    // Sort: If barber has a categoryOrder, sort by categoryOrder first, keeping service order within categories
    if (provider.categoryOrder && provider.categoryOrder.length > 0) {
      const orderMap = {};
      provider.categoryOrder.forEach((cat, index) => {
        orderMap[cat.toLowerCase().trim()] = index;
      });
      genderMatched = [...genderMatched].sort((a, b) => {
        const catA = (a.category || "General").toLowerCase().trim();
        const catB = (b.category || "General").toLowerCase().trim();
        const indexA = orderMap[catA];
        const indexB = orderMap[catB];
        if (indexA !== undefined && indexB !== undefined) {
          if (indexA !== indexB) return indexA - indexB;
        } else if (indexA !== undefined) {
          return -1;
        } else if (indexB !== undefined) {
          return 1;
        }
        // Fallback to original database array index
        const indexInOrigA = provider.services.findIndex(s => (s.id || s._id) === (a.id || a._id));
        const indexInOrigB = provider.services.findIndex(s => (s.id || s._id) === (b.id || b._id));
        return indexInOrigA - indexInOrigB;
      });
    } else if (!selectedGender || selectedGender === "all") {
      // Sort by gender: male first, then female, then unisex
      genderMatched = [...genderMatched].sort((a, b) => {
        const genA = (getCatMeta(a.category)?.gender || 'unisex').toLowerCase();
        const genB = (getCatMeta(b.category)?.gender || 'unisex').toLowerCase();
        const score = { 'male': 1, 'female': 2, 'unisex': 3 };
        return (score[genA] || 3) - (score[genB] || 3);
      });
    }

    // 2. Category Tab Filter
    if (activeCategory === "All") return genderMatched;
    return genderMatched.filter(s => {
      const sCat = (s.category || "General").toString().toLowerCase().trim();
      const aCat = activeCategory.toString().toLowerCase().trim();
      return sCat === aCat;
    });
  }, [provider?.services, provider?.categoryOrder, selectedGender, activeCategory, getCatMeta]);

  // Extract unique categories for tabs based on gender
  const availableCategories = useMemo(() => {
    if (!provider?.services) return ["All"];
    const cats = provider.services
      .filter(s => {
        const meta = getCatMeta(s.category);
        return meta.gender === 'unisex' || meta.gender === selectedGender;
      })
      .map(s => s.category || "General");

    const uniqueCats = [...new Set(cats)];

    // Sort according to categoryOrder if available, otherwise alphabetical
    if (provider.categoryOrder && provider.categoryOrder.length > 0) {
      const orderMap = {};
      provider.categoryOrder.forEach((cat, index) => {
        orderMap[cat.toLowerCase().trim()] = index;
      });
      uniqueCats.sort((a, b) => {
        const indexA = orderMap[a.toLowerCase().trim()];
        const indexB = orderMap[b.toLowerCase().trim()];
        if (indexA !== undefined && indexB !== undefined) return indexA - indexB;
        if (indexA !== undefined) return -1;
        if (indexB !== undefined) return 1;
        return a.localeCompare(b);
      });
    } else {
      uniqueCats.sort();
    }

    return ["All", ...uniqueCats.filter(c => c !== "General")];
  }, [provider?.services, provider?.categoryOrder, selectedGender, getCatMeta]);

  // Handle active category reset on gender change
  useEffect(() => {
    setActiveCategory("All");
  }, [selectedGender]);

  // Alert State
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info"
  });

  // --- OPTIMIZATION: Memoize Styles ---
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: "#FFFFFF"
        },
        loadingContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF"
        },
        heroContainer: {
          height: 320,
          width: "100%",
          position: "relative"
        },
        heroImage: {
          width: "100%",
          height: "100%",
          resizeMode: "cover"
        },
        gradientOverlay: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 200,
          backgroundColor: "transparent"
        },
        headerNav: {
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          right: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          zIndex: 10
        },
        glassButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "rgba(255,255,255,0.75)",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.4)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5
        },
        contentSheet: {
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 150,
        },
        headerRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10
        },
        providerName: {
          fontSize: 26,
          fontWeight: "800",
          color: theme.colors.text,
          flex: 1,
          letterSpacing: -0.5
        },
        verifiedBadge: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#1A1A1A",
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 8,
          marginLeft: 0
        },
        verifiedText: {
          fontSize: 10,
          fontFamily: 'DMSans_700Bold',
          color: "#C8FF00",
          marginLeft: 4,
          letterSpacing: 0.5
        },
        metaRow: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 24
        },
        metaText: {
          fontSize: 14,
          color: theme.colors.textSecondary,
          marginLeft: 6,
          fontWeight: "500"
        },
        dotSeparator: {
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.colors.border,
          marginRight: 16
        },
        safetyBanner: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#F9F9F8",
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#E8E7E2",
          marginBottom: 24
        },
        safetyTextContainer: {
          marginLeft: 12,
          flex: 1
        },
        safetyTitle: {
          fontSize: 14,
          fontFamily: "PlusJakartaSans_700Bold",
          color: "#1A1A1A"
        },
        safetySubtitle: {
          fontSize: 12,
          fontFamily: "DMSans_400Regular",
          color: "#606058",
          marginTop: 2
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: theme.colors.text,
          marginBottom: 16
        },
        serviceCard: {
          backgroundColor: theme.colors.card,
          borderRadius: 20,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: theme.colors.border + "30",
          overflow: "hidden",
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 8,
        },
        serviceCardSelected: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        serviceContentWrapper: {
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
        },
        serviceIconContainer: {
          width: 40,
          height: 40,
          borderRadius: 14,
          backgroundColor: theme.colors.primary + "10",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        },
        serviceIconContainerSelected: {
          backgroundColor: "rgba(255,255,255,0.2)",
        },
        serviceMain: {
          flex: 1,
        },
        serviceName: {
          fontSize: 15,
          fontWeight: "800",
          color: theme.colors.text,
        },
        popularBadge: {
          backgroundColor: "#E3F2FD",
          paddingHorizontal: 6,
          paddingVertical: 1,
          borderRadius: 4,
          marginLeft: 6,
        },
        popularText: {
          fontSize: 8,
          fontWeight: "900",
          color: "#1976D2",
          letterSpacing: 0.5,
        },
        serviceDesc: {
          fontSize: 12,
          color: theme.colors.textSecondary,
          marginTop: 1,
          fontWeight: "500"
        },
        serviceFooter: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: 6,
        },
        servicePrice: {
          fontSize: 15,
          fontWeight: "900",
          color: theme.colors.text,
        },
        dotSeparatorSmall: {
          width: 2,
          height: 2,
          borderRadius: 1,
          backgroundColor: theme.colors.border,
          marginHorizontal: 6,
        },
        metaBadgeMini: {
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
        },
        metaTextMini: {
          fontSize: 11,
          color: theme.colors.textSecondary,
          fontWeight: "700",
        },
        addBtnCircle: {
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
          justifyContent: "center",
          alignItems: "center",
          marginLeft: 10,
        },
        addBtnCircleSelected: {
          backgroundColor: "rgba(255,255,255,0.3)",
          borderColor: "#FFF",
        },
        addBtnTextMini: {
          color: theme.colors.primary,
          fontSize: 16,
          fontWeight: "700",
          marginTop: -2,
        },
        textWhite: {
          color: "#FFF",
        },
        textWhite70: {
          color: "rgba(255,255,255,0.8)",
        },
        addButton: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.colors.text, // Deep Navy/Black
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        },
        addButtonSelected: {
          backgroundColor: "#FFF",
          borderWidth: 2,
          borderColor: theme.colors.primary
        },
        addButtonText: {
          fontSize: 13,
          fontWeight: "700",
          color: theme.colors.primary
        },
        addButtonTextSelected: {
          color: "#FFF",
          marginLeft: 4
        },
        glassBar: {
          position: "absolute",
          bottom: Math.max(insets.bottom, 20) + 8,
          left: 16,
          right: 16,
          backgroundColor: "#1A1A1A",
          borderRadius: 24,
          paddingVertical: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.1)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
          zIndex: 1000,
        },
        barLeft: {
          flexDirection: "row",
          alignItems: "center",
          flex: 1
        },
        thumbContainer: {
          flexDirection: "row",
          alignItems: "center",
          marginRight: 14,
        },
        thumbCircle: {
          width: 42,
          height: 42,
          borderRadius: 21,
          borderWidth: 2,
          borderColor: "#C8FF00",
          backgroundColor: "#FFF",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        thumbImage: {
          width: "100%",
          height: "100%",
          resizeMode: "cover",
        },
        textContainer: {
          flexDirection: "column",
        },
        viewCartText: {
          color: "#FFFFFF",
          fontSize: 15,
          fontFamily: "DMSans_700Bold",
          letterSpacing: -0.2
        },
        itemsCount: {
          color: "#A0A09A",
          fontSize: 11,
          fontFamily: "DMSans_500Medium",
        },
        barRight: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        barPrice: {
          color: "#C8FF00",
          fontSize: 17,
          fontFamily: "PlusJakartaSans_700Bold",
        },
        continueText: {
          color: "#C8FF00",
          fontFamily: "DMSans_700Bold",
          fontSize: 14,
          letterSpacing: 0.5,
          textTransform: "uppercase"
        },
        continueButton: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4
        },
        contentSheet: {
          flex: 1,
          backgroundColor: "#FFFFFF",
          padding: 24,
          paddingBottom: 120,
        },
        headerRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16
        },
        serviceCard: {
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: "#F3F4F6",
          overflow: "hidden",
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 8,
        },
        serviceContentWrapper: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 10,
          paddingLeft: 14, // Space for strip
        },
        sideStrip: {
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
        },
        serviceLeftWrapper: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
        },
        serviceIconContainerMirror: {
          width: 34,
          height: 34,
          borderRadius: 8,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 10,
        },
        serviceTextStack: {
          flex: 1,
        },
        serviceHeaderRowMirror: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        },
        serviceNameMirror: {
          fontSize: 15,
          fontWeight: "900",
          color: "#111827",
          lineHeight: 20,
        },
        catBadgeMiniPill: {
          backgroundColor: "#F3F4F6",
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        },
        catBadgeMiniText: {
          fontSize: 9,
          fontWeight: "800",
          color: "#6B7280",
          letterSpacing: 0.2,
        },
        serviceDescMirrorFixed: {
          fontSize: 12,
          fontWeight: "600",
          color: "#6B7280",
          marginTop: 2,
        },
        serviceRightWrapper: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginLeft: 8,
        },
        servicePriceMirrorFixed: {
          fontSize: 16,
          fontWeight: "900",
          color: "#111827",
        },
        selectCircleMirror: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: "#D1D5DB",
          alignItems: "center",
          justifyContent: "center",
        },
        selectCircleMirrorActive: {
          backgroundColor: "#1A1A1A",
          borderColor: "#1A1A1A",
        },
        // WEBSITE SELECTORS
        genderBox: {
          flexDirection: "row",
          backgroundColor: "#F3F2EE",
          padding: 4,
          borderRadius: 14,
          marginBottom: 4,
          borderWidth: 1,
          borderColor: "#E8E7E2"
        },
        genderTab: {
          flex: 1,
          paddingVertical: 10,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
        },
        genderTabActive: {
          backgroundColor: "#1A1A1A",
          elevation: 3,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
        genderTabText: {
          fontSize: 12,
          fontFamily: "DMSans_700Bold",
          color: "#606058",
          textTransform: "uppercase",
          letterSpacing: 0.5
        },
        genderTabTextActive: {
          color: "#FFFFFF",
        },
        // CATEGORY TABS MIRROR
        categoryBarContainer: {
          marginBottom: 16,
          marginHorizontal: -24,
          paddingVertical: 4,
        },
        categoryScrollContent: {
          paddingHorizontal: 24,
          gap: 8,
        },
        categoryTab: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 100,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#E8E7E2",
        },
        categoryTabActive: {
          backgroundColor: "#1A1A1A",
          borderColor: "#1A1A1A",
        },
        categoryTabText: {
          fontSize: 12,
          fontFamily: "DMSans_700Bold",
          color: "#606058",
        },
        categoryTabTextActive: {
          color: "#FFFFFF",
        },
        catTabEmoji: {
          fontSize: 13,
        },
        // SECTION TITLES MIRROR
        categorySection: {
          marginBottom: 12,
        },
        sectionHeaderRowMirror: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
          borderLeftWidth: 4,
          paddingLeft: 12,
          borderRadius: 2,
        },
        catEmojiLabel: {
          fontSize: 18,
          marginRight: 8,
        },
        sectionTitleMirror: {
          fontSize: 18,
          fontFamily: "PlusJakartaSans_700Bold",
          color: "#1A1A1A",
          letterSpacing: -0.5,
        },
        sectionDivider: {
          flex: 1,
          height: 1,
          backgroundColor: "#D8D7D2"
        },
        sectionHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          marginTop: 10
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
          fontFamily: "PlusJakartaSans_700Bold",
          letterSpacing: 0.6,
          textTransform: 'uppercase'
        },
        headerLine: {
          flex: 1,
          height: 1.5,
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          borderRadius: 1
        }
      }),
    [theme, insets]
  );

  // Helper to show toast
  const showToast = (message, type = "info") => {
    setToast({ visible: true, message, type });
    // Auto reset state handles in component
  };

  useEffect(() => {
    let isMounted = true;
    const fetchProvider = async () => {
      try {
        if (barberData) {
          // Use provided barber data, but fetch latest services if barberId available
          // Helper for safe mapping
          const mapService = (s) => {
            const getField = (obj, field) => {
              const val = obj[field] || (obj.serviceId && obj.serviceId[field]);
              if (!val) return null;
              if (typeof val === 'object' && val.content) return val.content;
              return val.toString();
            };

            return {
              id: s.serviceId || s.id || s._id || Date.now().toString(),
              name: getField(s, 'name') || "Unnamed Service",
              price: getField(s, 'price') || "0",
              time: getField(s, 'time') || "30",
              category: getField(s, 'category') || "General",
              barberId: barberData.barberId
            };
          };

          let services = (barberData.services || []).map(mapService);
          if (barberData.barberId) {
            try {
              const barberRes = await api.get(
                `/api/barber-card/all`
              );
              const barberCard = barberRes.data.find(b => b.barberId === barberData.barberId);
              if (barberCard) {
                const fetchedServices = (barberCard.services || []).map(mapService);
                if (fetchedServices.length > 0) {
                  services = fetchedServices;
                } else if (barberCard.shopId) {
                  // Fallback: If staff services are empty, find the owner's services (or any card with services) in the same shop
                  const ownerCard = barberRes.data.find(
                    b => b.shopId === barberCard.shopId && b.services && b.services.length > 0
                  );
                  if (ownerCard) {
                    services = (ownerCard.services || []).map(mapService);
                  }
                }
              }
            } catch (e) {
              console.log("Could not fetch latest barber services");
            }
          }
          const formattedProvider = {
            name: barberData.name,
            owner: { _id: barberData.barberId, profilePicture: barberData.image?.uri },
            services: services,
            address: barberData.address || "No address",
            rating: barberData.rating || 0,
            reviews: barberData.reviewCount || 0,
            avgAppointmentTime: barberData.avgAppointmentTime || "30 min",
            shopName: barberData.shopName,
            image: barberData.image?.uri,
            location: null, // No location for independent barbers
            categoryOrder: barberData.categoryOrder || [],
          };
          if (isMounted) setProvider(formattedProvider);
        } else {
          const id = barberId || salonId || providerId;
          if (!id) throw new Error("No Provider ID found");

          let res;
          try {
            // 1. Try direct shop lookup
            res = await api.get(`/api/shop/${id}`);
          } catch (shopErr) {
            try {
              // 2. Try barber card lookup (if id is a barber card id)
              res = await api.get(`/api/barber-card/${id}`);
            } catch (cardErr) {
              // 3. Try shop lookup by barber ID (if id is a user id)
              res = await api.get(`/api/shop/barber/${id}`);
            }
          }

          if (isMounted && res?.data) {
            let data = res.data;
            if (data.barberId && (!data.services || data.services.length === 0) && data.shopId) {
              try {
                const barberRes = await api.get(`/api/barber-card/all`);
                const ownerCard = barberRes.data.find(
                  b => b.shopId === data.shopId && b.services && b.services.length > 0
                );
                if (ownerCard) {
                  data = {
                    ...data,
                    services: ownerCard.services
                  };
                }
              } catch (e) {
                console.log("Could not fetch owner fallback services for deep linked barber card:", e);
              }
            }
            setProvider(data);
          } else {
            throw new Error("Provider not found");
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          showToast(
            "Failed to load provider details. Please check connection.",
            "error"
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProvider();
    return () => {
      isMounted = false;
    };
  }, [barberId, salonId, providerId, barberData]);

  // --- OPTIMIZATION: useCallback for Interaction Handlers ---
  const handleSelectService = useCallback((serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }, []);

  const handleDirectBooking = async (type, services, date, time) => {
    setIsBooking(true);
    try {
      const res = await api.post(
        `/api/booking`,
        {
          barberId: provider.owner._id,
          services,
          totalPrice,
          date,
          time,
          appointmentType: type
        },
        { timeout: 12000 }
      );

      showToast("Booking Confirmed!", "success");
      setTimeout(() => {
        // Redirect to Success state of PaymentConfirmation (BookingConfirm)
        navigation.navigate("PaymentConfirmation", {
          bookingId: res.data._id,
          paymentConfirmed: true,
          bookingOtp: res.data.otp,
          providerName: (provider.owner?.name && provider.owner.name !== "Barber") ? provider.owner.name : (provider.name || "Professional"),
          shopName: provider.shopName || provider.name || "GlossCut Studio",
          providerId: provider.owner?._id || provider._id,
          providerRating: provider.rating || 4.9,
          providerAddress: provider.address || "Location unavailable",
          selectedServices: services,
          totalPrice: totalPrice,
          serviceType: 'salon',
          bookingDate: date
        });
      }, 500);
    } catch (err) {
      console.error("Direct Booking Error:", err);
      const errMsg = err.response?.data?.msg;

      if (
        err.response?.status === 400 &&
        (errMsg === "This barber is fully booked for today." ||
          errMsg === "This barber is fully booked with high priority appointments.")
      ) {
        navigation.navigate("AppointmentFull", {
          barberId: provider.owner._id,
          providerName: provider.owner?.name || "Barber",
          shopName: provider.name || "GlossCut Shop",
          providerRating: provider.rating || 4.9,
          providerAddress: provider.address || "Location unavailable",
          date,
          time,
          services,
          totalPrice,
          failedAppointmentType: type
        });
      } else {
        showToast(errMsg || "Booking failed. Please try again.", "error");
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handleContinue = async () => {
    if (!provider || isBooking) return;

    const now = new Date();
    const date = now.toISOString();

    try {
      const response = await api.get(
        `/api/booking/check-premium-availability/${provider.owner._id}`,
        {
          params: { date },
          timeout: 8000,
        }
      );

      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;

      const servicesToBook = provider.services.filter((s) => {
        const sId = s.id || s._id;
        return selectedServices.includes(sId);
      });

      if (response.data.type === "premium") {
        navigation.navigate("AppointmentFull", {
          barberId: provider.owner._id,
          providerName: provider.owner?.name || "Barber",
          shopName: provider.name || "GlossCut Shop",
          providerRating: provider.rating || 4.9,
          providerAddress: provider.address || "Location unavailable",
          date: date,
          time: currentTime,
          services: servicesToBook,
          totalPrice: totalPrice,
          availablePremiumSlots: response.data.count,
          failedAppointmentType: "Basic"
        });
      } else {
        // Automatically book as Basic through OTP Verification
        navigation.navigate("BookingOTPVerification", {
          bookingPayload: {
            barberId: provider.owner._id,
            services: servicesToBook,
            totalPrice,
            date,
            time: currentTime,
            appointmentType: "Basic"
          },
          paymentParams: {
            providerName: (provider.owner?.name && provider.owner.name !== "Barber") ? provider.owner.name : (provider.name || "Professional"),
            shopName: provider.shopName || provider.name || "GlossCut Studio",
            providerId: provider.owner?._id || provider._id,
            providerRating: provider.rating || 4.9,
            providerAddress: provider.address || "Location unavailable",
            selectedServices: servicesToBook,
            totalPrice: totalPrice,
            serviceType: 'salon',
            bookingDate: date
          }
        });
      }
    } catch (error) {
      console.error("Booking Check Failed:", error);
      const errorMsg = error.response?.data?.msg || "Server unreachable. Try again.";
      showToast(errorMsg, "error");
    }
  };

  const openMaps = useCallback(() => {
    if (!provider?.location) {
      showToast("Location data not available", "error");
      return;
    }
    const scheme = Platform.select({ ios: "maps:0,0?q=", android: "geo:0,0?q=" });
    const latLng = `${provider.location.coordinates[1]},${provider.location.coordinates[0]}`;
    const label = encodeURIComponent(provider.name);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    Linking.openURL(url).catch(() => showToast("Could not open maps application", "error"));
  }, [provider]);

  const barberImageSource = useMemo(() => {
    if (!provider) return require("../assets/GlossCut.png");
    const img = provider.owner?.profilePicture || provider.image;
    if (!img) return require("../assets/GlossCut.png");
    if (typeof img === 'number') return img;
    if (typeof img === 'string') {
      if (img.includes("placeholder") || img.trim() === "") {
        return require("../assets/GlossCut.png");
      }
      return { uri: img };
    }
    if (img.uri) {
      if (img.uri.includes("placeholder") || img.uri.trim() === "") {
        return require("../assets/GlossCut.png");
      }
      return img;
    }
    return require("../assets/GlossCut.png");
  }, [provider]);

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const providerId = provider.id || provider._id;
      const shareUrl = `https://glosscut.com/book/${providerId}`;
      const playStoreUrl = `https://play.google.com/store/apps/details?id=com.glosscut.app`;
      const appStoreUrl = `https://apps.apple.com/app/glosscut/id123456789`;

      const message = `*GlossCut Booking* 💈\n\nBook a professional grooming session with *${provider.name}*!\n\nClick link to book directly:\n👉 ${shareUrl}\n\nDon't have the GlossCut app yet? Download it here:\nAndroid: ${playStoreUrl}\niOS: ${appStoreUrl}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;

      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({
          message: message,
          url: shareUrl,
          title: `Book ${provider.name} - GlossCut`
        });
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const totalPrice = useMemo(() => {
    if (!provider) return 0;
    return provider.services
      .filter((service) => {
        const sId = service.id || service._id;
        return selectedServices.includes(sId);
      })
      .reduce((total, service) => {
        const price = parseFloat(service.price.toString().replace("₹", ""));
        return total + (isNaN(price) ? 0 : price);
      }, 0);
  }, [selectedServices, provider]);

  const overallAverageTime = useMemo(() => {
    if (!provider || !provider.services || provider.services.length === 0) {
      return "30 min";
    }
    const total = provider.services.reduce((sum, service) => {
      const timeStr = service.time ? service.time.toString().toLowerCase().replace("min", "").replace("m", "").trim() : "30";
      const timeVal = parseInt(timeStr, 10);
      return sum + (isNaN(timeVal) ? 30 : timeVal);
    }, 0);
    const avg = Math.round(total / provider.services.length);
    return `${avg} min`;
  }, [provider]);

  const headerTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [HERO_HEIGHT - 150, HERO_HEIGHT - 100], [0, 1], Extrapolate.CLAMP);
    return { opacity };
  });

  const heroStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [-100, 0, 100], [1.2, 1, 1], Extrapolate.CLAMP);
    const translateY = interpolate(scrollY.value, [-100, 0, 100], [0, 0, 50], Extrapolate.CLAMP);
    return { transform: [{ scale }, { translateY }] };
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#1A1A1A", fontFamily: "DMSans_700Bold" }}>Provider not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, padding: 10 }}>
          <Text style={{ color: "#1A1A1A", fontFamily: "DMSans_700Bold" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* --- CUSTOM ALERT OVERLAY --- */}
      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
        topInset={insets.top + (Platform.OS === 'android' ? 10 : 0)}
      />

      {/* STATIC TOP HEADER BAR */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: Math.max(insets.top, 8) + 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6"
        }}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#F9FAFB',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#F3F4F6'
          }}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <ChevronLeft size={22} color="#111" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              fontFamily: "PlusJakartaSans_700Bold",
              color: '#111827',
              letterSpacing: -0.3
            }}
          >
            {provider.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleShare}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#F9FAFB',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#F3F4F6'
          }}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Share2 size={18} color="#111" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* CONTENT SHEET */}
        <View style={[
          styles.contentSheet,
          isTablet && {
            paddingHorizontal: width * 0.15,
          }
        ]}>
          {/* PROFILE CARD WRAPPER */}
          <View style={{
            borderWidth: 1,
            borderColor: "#E8E7E2",
            borderRadius: 24,
            backgroundColor: "#FDFDFD",
            padding: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.02,
            shadowRadius: 10,
            elevation: 2,
            marginTop: 10
          }}>
            {/* PROFILE AVATAR & EXP ROW */}
            <View style={{
              flexDirection: "row",
              alignItems: "flex-end",
              marginBottom: 20,
            }}>
              {/* Circular Avatar */}
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 1,
                borderColor: "#E8E7E2",
                overflow: "hidden",
                backgroundColor: "#EBEBEA",
              }}>
                <Image
                  source={barberImageSource}
                  style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                />
              </View>

              {/* Right Information Column */}
              <View style={{
                flex: 1,
                marginLeft: 16,
                paddingBottom: 2,
                justifyContent: "flex-end",
              }}>
                {/* Name */}
                <Text style={{
                  fontSize: 22,
                  fontFamily: "PlusJakartaSans_800ExtraBold",
                  color: "#1A1A1A",
                  marginBottom: 2,
                  letterSpacing: -0.5
                }}>
                  {provider.name}
                </Text>

                {/* Shop Name */}
                <Text style={{
                  fontSize: 12,
                  fontFamily: "DMSans_700Bold",
                  color: "#A0A09A",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: 0.5
                }}>
                  {provider.shopName || "GlossCut Studio Partner"}
                </Text>

                {/* Address */}
                <View style={{ flexDirection: "row", alignItems: "flex-start", opacity: 0.9, marginBottom: 6 }}>
                  <MapPin size={12} color="#606058" style={{ marginTop: 2, marginRight: 4 }} />
                  <Text style={{
                    fontFamily: "DMSans_500Medium",
                    fontSize: 12,
                    color: "#606058",
                    flex: 1,
                    lineHeight: 15
                  }}>
                    {provider.address || "Verified Studio"}
                  </Text>
                </View>


              </View>
            </View>

            {/* THREE-COLUMN HORIZONTAL DIVIDED METRICS SECTION */}
            <View style={{
              flexDirection: "row",
              borderTopWidth: 1,
              borderColor: "#E8E7E2",
              paddingTop: 16,
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              {/* Column 1: Rating */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                  <Star size={14} color="#FBC02D" fill="#FBC02D" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 16, fontFamily: "PlusJakartaSans_800ExtraBold", color: "#1A1A1A" }}>
                    {provider.rating ? Number(provider.rating).toFixed(1) : "New"}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, fontFamily: "DMSans_500Medium", color: "#A0A09A" }}>Rating</Text>
              </View>

              {/* Separator 1 */}
              <View style={{ width: 1, height: 24, backgroundColor: "#E8E7E2" }} />

              {/* Column 2: Reviews */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontFamily: "PlusJakartaSans_800ExtraBold", color: "#1A1A1A", marginBottom: 2 }}>
                  {provider.reviews || 0}
                </Text>
                <Text style={{ fontSize: 10, fontFamily: "DMSans_500Medium", color: "#A0A09A" }}>Reviews</Text>
              </View>

              {/* Separator 2 */}
              <View style={{ width: 1, height: 24, backgroundColor: "#E8E7E2" }} />

              {/* Column 3: Avg Duration */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                  <Clock size={14} color="#606058" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 16, fontFamily: "PlusJakartaSans_800ExtraBold", color: "#1A1A1A" }}>
                    {overallAverageTime}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, fontFamily: "DMSans_500Medium", color: "#A0A09A" }}>Avg. Time</Text>
              </View>
            </View>
          </View>

          {/* GENDER SELECTOR */}
          <View style={{ marginBottom: 4 }}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerPill}>
                <Text style={styles.headerPillText}>Select Preference</Text>
              </View>
              <View style={styles.headerLine} />
            </View>
            <View style={styles.genderBox}>
              {['all', 'male', 'female'].map(gen => (
                <TouchableOpacity
                  key={gen}
                  onPress={() => {
                    setSelectedGender(gen);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.genderTab,
                    selectedGender === gen && styles.genderTabActive
                  ]}
                >
                  <Text style={[
                    styles.genderTabText,
                    selectedGender === gen && styles.genderTabTextActive
                  ]}>
                    {gen === 'all' ? 'All' : gen === 'male' ? 'Men' : 'Women'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Navigation Bar */}
          {availableCategories.length > 1 && (
            <View style={styles.categoryBarContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {availableCategories.map((cat, idx) => {
                  const meta = getCatMeta(cat === "All" ? null : cat);
                  const isActive = activeCategory === cat;
                  return (
                    <TouchableOpacity
                      key={`cat-tab-${idx}-${cat}`}
                      onPress={() => {
                        setActiveCategory(cat);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        styles.categoryTab,
                        isActive && styles.categoryTabActive
                      ]}
                    >
                      <Text style={styles.catTabEmoji}>{cat === "All" ? "💈" : meta.emoji}</Text>
                      <Text style={[
                        styles.categoryTabText,
                        isActive && styles.categoryTabTextActive
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Website Mirror: Flat Service List (No Headers) */}
          <View style={[
            { marginBottom: 10 },
            isTablet && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }
          ]}>
            {filteredServices.length === 0 ? (
              <View style={{ padding: 40, alignItems: "center", width: '100%' }}>
                <Scissors size={40} color="#E8E7E2" />
                <Text style={{ marginTop: 12, color: "#606058", fontWeight: "600" }}>No services found</Text>
              </View>
            ) : (
              filteredServices.map((service, index) => {
                const serviceId = service.id || service._id || `s-${index}`;
                const meta = getCatMeta(service.category);
                return (
                  <View key={`service-wrap-${serviceId}`} style={isTablet ? { width: '49%' } : { width: '100%' }}>
                    <ServiceItem
                      index={index}
                      service={service}
                      catMeta={meta}
                      isSelected={selectedServices.includes(serviceId)}
                      onSelect={handleSelectService}
                      theme={theme}
                      styles={styles}
                    />
                  </View>
                );
              })
            )}
          </View>


        </View>
      </Animated.ScrollView>

      {/* PROFESSIONAL VIEW CART BAR (BLINKIT STYLE) */}
      {selectedServices.length > 0 && (
        <Animated.View
          entering={FadeInDown.springify().damping(15)}
          style={[
            styles.glassBar,
            isTablet && {
              left: width * 0.15 + 16,
              right: width * 0.15 + 16,
            }
          ]}
        >
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}
            onPress={handleContinue}
            disabled={isBooking}
            activeOpacity={0.9}
          >
            <View style={styles.barLeft}>
              {/* High-Definition Thumbnails */}
              <View style={styles.thumbContainer}>
                <View style={styles.thumbCircle}>
                  <Image
                    source={barberImageSource}
                    style={styles.thumbImage}
                  />
                </View>
                {selectedServices.length > 1 && (
                  <View style={[styles.thumbCircle, { marginLeft: -22, zIndex: -1 }]}>
                    <View style={{ backgroundColor: "#F3F4F6", width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 18 }}>
                        {getCatMeta(provider.services.find(s => (s.id || s._id) === selectedServices[1])?.category)?.emoji || "💈"}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.viewCartText}>{isBooking ? "Booking..." : "Review Selected"}</Text>
                <Text style={styles.itemsCount}>{selectedServices.length} Services</Text>
              </View>
            </View>

            <View style={styles.barRight}>
              {isBooking ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Text style={styles.continueText}>Continue</Text>
                  <ChevronRight size={18} color="#C8FF00" strokeWidth={3.5} />
                </>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

export default BookingScreen;
