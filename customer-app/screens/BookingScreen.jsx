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
      borderColor: isSelected ? "#22C55E" : theme.colors.border + "35",
      backgroundColor: isSelected ? "#F0FDF4" : "#FFFFFF",
      shadowOpacity: interpolate(glowOpacity.value, [0, 1], [0.03, 0.1], Extrapolate.CLAMP)
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
              isSelected ? { backgroundColor: "#22C55E" } : { backgroundColor: "#F3F4F6" }
            ]}>
              {isSelected ? (
                <Check size={16} color="#FFF" strokeWidth={3} />
              ) : (
                <Text style={{ fontSize: 18 }}>{catMeta?.emoji || "💈"}</Text>
              )}
            </View>

            <View style={styles.serviceTextStack}>
              <View style={styles.serviceHeaderRowMirror}>
                <Text
                  style={[styles.serviceNameMirror, isSelected ? { color: "#14532D" } : { color: "#111827" }]}
                >
                  {displayName}
                </Text>
              </View>

              <Text style={styles.serviceDescMirrorFixed}>
                {serviceData.time} min
              </Text>
            </View>
          </View>

          <View style={styles.serviceRightWrapper}>
            <Text style={[styles.servicePriceMirrorFixed, isSelected ? { color: "#15803D" } : { color: "#111827" }]}>
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
      case "success": return "#10B981";
      case "error": return "#EF4444";
      default: return "#1F2937";
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 16,
          right: 16,
          zIndex: 9999,
          backgroundColor: getBackgroundColor(),
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5
        },
        animatedStyle
      ]}
    >
      <View style={{ marginRight: 12 }}>
        {type === "success" ? <CheckCircle2 size={20} color="#FFF" /> : <AlertCircle size={20} color="#FFF" />}
      </View>
      <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14, flex: 1 }}>{message}</Text>
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
  const [selectedGender, setSelectedGender] = useState("male");
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
    const genderMatched = provider.services.filter(s => {
      const meta = getCatMeta(s.category);
      // Failsafe: if no meta, show it under unisex
      const serviceGender = (meta?.gender || 'unisex').toLowerCase();
      return serviceGender === 'unisex' || serviceGender === selectedGender.toLowerCase();
    });

    // 2. Category Tab Filter
    if (activeCategory === "All") return genderMatched;
    return genderMatched.filter(s => {
      const sCat = (s.category || "General").toString().toLowerCase().trim();
      const aCat = activeCategory.toString().toLowerCase().trim();
      return sCat === aCat;
    });
  }, [provider?.services, selectedGender, activeCategory, getCatMeta]);

  // Extract unique categories for tabs based on gender
  const availableCategories = useMemo(() => {
    if (!provider?.services) return ["All"];
    const cats = provider.services
      .filter(s => {
        const meta = getCatMeta(s.category);
        return meta.gender === 'unisex' || meta.gender === selectedGender;
      })
      .map(s => s.category || "General");

    const uniqueCats = [...new Set(cats)].sort();
    return ["All", ...uniqueCats.filter(c => c !== "General")];
  }, [provider?.services, selectedGender, getCatMeta]);

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
          backgroundColor: theme.colors.background
        },
        loadingContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background
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
          marginTop: -40,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          backgroundColor: theme.colors.background,
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 150,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.05,
          shadowRadius: 20,
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
          backgroundColor: "#E3F2FD",
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 20,
          marginLeft: 10
        },
        verifiedText: {
          fontSize: 11,
          fontWeight: "700",
          color: "#1976D2",
          marginLeft: 4
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
          backgroundColor: theme.colors.card,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginBottom: 30
        },
        safetyTextContainer: {
          marginLeft: 12,
          flex: 1
        },
        safetyTitle: {
          fontSize: 14,
          fontWeight: "700",
          color: theme.colors.text
        },
        safetySubtitle: {
          fontSize: 12,
          color: theme.colors.textSecondary,
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
          left: 12,
          right: 12,
          backgroundColor: "#1D8B1D", // Professional Vibrant Green
          borderRadius: 18, // Slightly less rounded for a more modern 'App' feel
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.2)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.35,
          shadowRadius: 18,
          elevation: 15,
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
          borderColor: "#1D8B1D",
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
          fontSize: 17,
          fontWeight: "900",
          letterSpacing: -0.2
        },
        itemsCount: {
          color: "rgba(255,255,255,0.9)",
          fontSize: 12,
          fontWeight: "700",
        },
        barRight: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        barPrice: {
          color: "#FFFFFF",
          fontSize: 18,
          fontWeight: "900",
        },
        continueText: {
          color: "#000000",
          fontWeight: "900",
          fontSize: 16,
          letterSpacing: 0.5,
          textTransform: "uppercase"
        },
        continueButton: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4
        },
        continueText: {
          color: "#000000",
          fontWeight: "900",
          fontSize: 16,
          letterSpacing: 1,
          textTransform: "uppercase"
        },
        contentSheet: {
          flex: 1,
          backgroundColor: "#FFFFFF", // Premium Website White
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          marginTop: -40,
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
          borderRadius: 14,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: "#F3F4F6",
          overflow: "hidden",
          elevation: 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.03,
          shadowRadius: 6,
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
          backgroundColor: "#22C55E",
          borderColor: "#22C55E",
        },
        // WEBSITE SELECTORS
        genderBox: {
          flexDirection: "row",
          backgroundColor: "rgba(0,0,0,0.03)",
          padding: 4,
          borderRadius: 14,
          marginBottom: 16,
        },
        genderTab: {
          flex: 1,
          paddingVertical: 10,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
        },
        genderTabActive: {
          backgroundColor: "#FFFFFF",
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        genderTabText: {
          fontSize: 11,
          fontWeight: "900",
          color: "#9CA3AF",
          textTransform: "uppercase",
        },
        genderTabTextActive: {
          color: "#166534",
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
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 14,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#E5E7EB",
        },
        categoryTabActive: {
          backgroundColor: "#111827",
          borderColor: "#111827",
        },
        categoryTabText: {
          fontSize: 13,
          fontWeight: "700",
          color: "#4B5563",
        },
        categoryTabTextActive: {
          color: "#FFFFFF",
        },
        catTabEmoji: {
          fontSize: 14,
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
          fontWeight: "900",
          color: "#111827",
          letterSpacing: -0.5,
        },
        sectionDivider: {
          flex: 1,
          height: 1,
          backgroundColor: theme.colors.border + "30"
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
                services = (barberCard.services || []).map(mapService);
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
            setProvider(res.data);
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
        // Automatically book as Basic
        await handleDirectBooking("Basic", servicesToBook, date, currentTime);
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

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const shareUrl = `https://glosscut.com/book/${provider.id || provider._id}`;
      const result = await Share.share({
        message: `Book a professional grooming session with ${provider.name} on GlossCut!\n\n${shareUrl}`,
        url: shareUrl,
        title: `Book ${provider.name} - GlossCut`
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: theme.colors.text }}>Provider not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, padding: 10 }}>
          <Text style={{ color: theme.colors.primary }}>Go Back</Text>
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

      {/* STICKY HEADER FADE-IN */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: insets.top + 64,
            backgroundColor: theme.colors.background,
            zIndex: 100,
            flexDirection: "row",
            alignItems: "center",
            paddingTop: insets.top,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border + "40"
          },
          headerTitleStyle
        ]}
      >
        <TouchableOpacity onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.goBack();
        }}>
          <ArrowLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "800", color: theme.colors.text, marginLeft: 16 }}>{provider.name}</Text>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* HERO IMAGE SECTION */}
        <View style={{ height: HERO_HEIGHT, overflow: "hidden" }}>
          <Animated.Image
            source={{ uri: provider.owner?.profilePicture || provider.image }}
            style={[{ width: "100%", height: "100%", resizeMode: "cover" }, heroStyle]}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.5)", "#000"]}
            style={[styles.gradientOverlay, { height: 250, position: 'absolute', bottom: 0, left: 0, right: 0 }]}
          />

          <View style={styles.headerNav}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              style={styles.glassButton}
            >
              <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
              <ArrowLeft size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.glassButton} onPress={handleShare}>
              <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
              <Share2 size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={{ position: "absolute", bottom: 60, left: 24, right: 24 }}>
            <Text style={[styles.providerName, { color: "#FFF", fontSize: 32, textShadowColor: "rgba(0,0,0,0.3)", textShadowRadius: 10, textShadowOffset: { width: 0, height: 2 } }]}>
              {provider.name}
            </Text>
          </View>
        </View>

        {/* CONTENT SHEET */}
        <View style={[
          styles.contentSheet,
          isTablet && {
            paddingHorizontal: width * 0.15,
            borderTopLeftRadius: 60,
            borderTopRightRadius: 60,
          }
        ]}>
          <View style={styles.headerRow}>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={14} color="#1976D2" />
              <Text style={styles.verifiedText}>PREMIUM PARTNER</Text>
            </View>
          </View>

          <Animated.View entering={FadeInRight.delay(200).springify()} style={styles.metaRow}>
            <Star size={18} color="#FBC02D" fill="#FBC02D" />
            <Text style={[styles.metaText, { color: theme.colors.text, fontWeight: "800", fontSize: 16 }]}>
              {provider.rating ? Number(provider.rating).toFixed(1) : "New"}
            </Text>
            <Text style={[styles.metaText, { marginLeft: 4 }]}>({provider.reviews || 0} reviews)</Text>
            <View style={[styles.dotSeparator, { marginLeft: 16 }]} />
            <Clock size={18} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>{provider.avgAppointmentTime || "30m"}</Text>
          </Animated.View>

          <Animated.View entering={FadeInRight.delay(300).springify()} style={[styles.metaRow, { marginTop: -12 }]}>
            <MapPin size={18} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>{provider.address}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.safetyBanner}>
            <View style={{ backgroundColor: theme.colors.primary + "15", padding: 10, borderRadius: 14 }}>
              <ShieldCheck size={26} color={theme.colors.primary} />
            </View>
            <View style={styles.safetyTextContainer}>
              <Text style={styles.safetyTitle}>GlossCut Secure</Text>
              <Text style={styles.safetySubtitle}>Verified professional with strict hygiene protocols.</Text>
            </View>
          </Animated.View>

          {/* WEBSITE MIRROR: GENDER SELECTOR */}
          <View style={styles.genderBox}>
            {['male', 'female', 'unisex'].map(gen => (
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
                  {gen === 'male' ? '♂ Men' : gen === 'female' ? '♀ Women' : '✨ Unisex'}
                </Text>
              </TouchableOpacity>
            ))}
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
                <Scissors size={40} color={theme.colors.border} />
                <Text style={{ marginTop: 12, color: theme.colors.textSecondary, fontWeight: "600" }}>No services found</Text>
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
          style={styles.glassBar}
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
                    source={{ uri: provider.owner?.profilePicture || provider.image }}
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
                <Text style={styles.viewCartText}>{isBooking ? "Booking..." : "View cart"}</Text>
                <Text style={styles.itemsCount}>{selectedServices.length} Services</Text>
              </View>
            </View>

            <View style={styles.barRight}>
              {isBooking ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Text style={styles.barPrice}>₹{totalPrice.toFixed(0)}</Text>
                  <ChevronRight size={20} color="#FFFFFF" strokeWidth={4} />
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
