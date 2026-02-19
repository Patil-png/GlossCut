import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Modal,
  Platform,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Alert,
  Keyboard,
  SectionList,
  ScrollView,
  FlatList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import OptimizedImage from "../components/OptimizedImage.jsx";
import { FlashList } from "@shopify/flash-list";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView, NativeViewGestureHandler } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import {
  ArrowLeft,
  Clock,
  Plus,
  Trash,
  User,
  Star,
  MapPin,
  Edit,
  ChevronRight,
  Zap,
  CheckCircle,
  AlertCircle,
  Camera,
  Sparkles,
  Scissors,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw,
  X,
  DollarSign,
  ArrowRight,
  GripVertical,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import api from "../utils/api";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STATUSBAR_HEIGHT =
  Platform.OS === "ios" ? 40 : StatusBar.currentHeight || 24;
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BLURHASH = "L5D]X]~q004n00~q009F00?b~qIV";

// --- UTILS ---
const compressImage = async (uri) => {
  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  } catch (error) {
    console.log("Compression failed", error);
    return uri;
  }
};

const triggerHaptic = (style = "Light") => {
  if (Platform.OS !== "web") {
    const method =
      style === "Medium"
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(method);
  }
};

// --- SUB-COMPONENTS (Memoized) ---
const SkeletonItem = React.memo(
  ({ width, height, borderRadius = 12, style }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);
    return (
      <Animated.View
        style={[
          { width, height, borderRadius, backgroundColor: "#F0F2F5", opacity },
          style,
        ]}
      />
    );
  }
);

const FormSkeleton = () => (
  <View style={{ padding: 20 }}>
    <SkeletonItem
      width="100%"
      height={200}
      borderRadius={24}
      style={{ marginBottom: 30 }}
    />
    <SkeletonItem width={120} height={20} style={{ marginBottom: 15 }} />
    <View style={{ gap: 15 }}>
      <SkeletonItem width="100%" height={70} borderRadius={16} />
      <SkeletonItem width="100%" height={70} borderRadius={16} />
      <SkeletonItem width="100%" height={70} borderRadius={16} />
    </View>
  </View>
);

const TopToast = React.memo(({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  useEffect(() => {
    let timer;
    if (visible) {
      Animated.spring(translateY, {
        toValue: STATUSBAR_HEIGHT + 10,
        useNativeDriver: true,
        damping: 15,
        stiffness: 120,
        mass: 0.8,
      }).start();
      timer = setTimeout(() => hideToast(), 3000);
    } else {
      hideToast();
    }
    return () => clearTimeout(timer);
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (visible && onHide) onHide();
    });
  };

  const getTheme = () => {
    switch (type) {
      case "success":
        return { bg: "#27AE60", icon: <CheckCircle size={18} color="#fff" /> };
      case "error":
        return { bg: "#EB5757", icon: <AlertCircle size={18} color="#fff" /> };
      case "warning":
        return { bg: "#F2994A", icon: <Zap size={18} color="#fff" /> };
      default:
        return { bg: "#333", icon: <Sparkles size={18} color="#fff" /> };
    }
  };
  const theme = getTheme();
  return (
    <Animated.View
      style={[
        styles.premiumToast,
        { transform: [{ translateY }], backgroundColor: theme.bg },
      ]}
    >
      <View style={styles.toastIconContainer}>{theme.icon}</View>
      <Text style={styles.premiumToastText}>{message}</Text>
    </Animated.View>
  );
});

const ScalePress = React.memo(
  ({ onPress, style, children, disabled, onLongPress }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;
    const onPressIn = () =>
      Animated.spring(scaleValue, {
        toValue: 0.97,
        useNativeDriver: true,
        friction: 4,
      }).start();
    const onPressOut = () =>
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }).start();

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={{ width: style?.width }}
      >
        <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

const BarberCardPreview = React.memo(
  ({ barberData, theme, onImageLoadStart, onImageLoad }) => {
    return (
      <View
        style={[
          styles.barberCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.dark ? "#333" : "#F0F0F0",
          },
        ]}
      >
        <View style={styles.cardImageContainer}>
          {barberData.image ? (
            <OptimizedImage
              source={barberData.image.uri}
              style={styles.cardImage}
              contentFit="cover"
              placeholder={BLURHASH}
              transition={300}
              onLoadStart={
                onImageLoadStart
                  ? () => onImageLoadStart(barberData.image.uri)
                  : undefined
              }
              onLoad={
                onImageLoad
                  ? () => onImageLoad(barberData.image.uri)
                  : undefined
              }
            >
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.gradientOverlay}
              />
              <View style={styles.cardTopBadgeRow}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>
                    {barberData.rating > 0
                      ? barberData.rating.toFixed(1)
                      : "New"}
                  </Text>
                  <Star
                    size={10}
                    color="#fff"
                    fill="#fff"
                    style={{ marginLeft: 2 }}
                  />
                </View>
              </View>
            </OptimizedImage>
          ) : (
            <View
              style={[
                styles.cardImageContainer,
                {
                  backgroundColor: "#F5F5F5",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={{ fontSize: 40, fontWeight: "bold", color: "#DDD" }}>
                {barberData.name?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text
              style={[styles.cardTitle, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {barberData.name || "Your Name Here"}
            </Text>
            <View style={styles.verifiedBadge}>
              <CheckCircle
                size={12}
                color={theme.colors.primary}
                fill={theme.colors.card}
              />
            </View>
          </View>
          <Text
            style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}
          >
            {barberData.address || "Shop Address, City"}
          </Text>
          <View style={styles.separator} />
          <View style={styles.cardStatsRow}>
            <View style={styles.statItem}>
              <Clock size={14} color={theme.colors.textSecondary} />
              <Text
                style={[styles.statText, { color: theme.colors.textSecondary }]}
              >
                {barberData.avgAppointmentTime || "30 min"}
              </Text>
            </View>
            <View style={styles.dot} />
            <View style={styles.statItem}>
              <Scissors size={14} color={theme.colors.textSecondary} />
              <Text
                style={[styles.statText, { color: theme.colors.textSecondary }]}
              >
                {barberData.totalServices || 0} Services
              </Text>
            </View>
          </View>
          <View style={styles.cardActionRow}>
            <View style={styles.availabilityIndicator}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: barberData.isAvailable
                      ? "#27AE60"
                      : "#EB5757",
                  },
                ]}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: barberData.isAvailable ? "#27AE60" : "#EB5757",
                }}
              >
                {barberData.isAvailable
                  ? "Accepting Bookings"
                  : "Currently Offline"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

const InfoRow = React.memo(
  ({ icon: Icon, label, value, theme, onPress, canEdit = true, shakeAnim }) => {
    return (
      <Animated.View style={[{ transform: [{ translateX: shakeAnim || 0 }] }]}>
        <ScalePress
          onPress={canEdit ? onPress : undefined}
          disabled={!canEdit}
          style={styles.infoRowContainer}
        >
          <View style={[styles.infoRowInner, {
            backgroundColor: theme.colors.card,
            borderColor: theme.dark ? '#1E293B' : '#F1F5F9',
            shadowColor: theme.dark ? '#000' : '#6366F1',
          }]}>
            {/* Gradient icon bubble */}
            <LinearGradient
              colors={[theme.colors.primary + '30', theme.colors.primary + '10']}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon size={20} color={theme.colors.primary} strokeWidth={2.5} />
            </LinearGradient>
            <View style={styles.infoRowLeft}>
              <View style={{ marginLeft: 14 }}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  {label}
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]} numberOfLines={1}>
                  {value}
                </Text>
              </View>
            </View>
            {canEdit ? (
              <View style={[styles.chevronBox, { backgroundColor: theme.colors.primary + '12' }]}>
                <ChevronRight size={16} color={theme.colors.primary} strokeWidth={2.5} />
              </View>
            ) : (
              <View style={[styles.lockedBadge, { backgroundColor: '#10B98115' }]}>
                <Text style={styles.lockedBadgeText}>AUTO</Text>
              </View>
            )}
          </View>
        </ScalePress>
      </Animated.View>
    );
  }
);

// --- MAIN SCREEN ---
const CreateBarberCardScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { barberCard, updatedName, updatedServices } = route.params || {}; // OPTIMIZATION: Check for updated params

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, damping: 15, stiffness: 100, useNativeDriver: true }),
    ]).start();
  }, []);
  const triggerShake = useCallback(() => {
    triggerHaptic("Medium");
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // State - Use pendingChanges if available, otherwise approved data
  const initialData = barberCard ? {
    name: barberCard.pendingChanges?.name || barberCard.name,
    services: barberCard.pendingChanges?.services || barberCard.services || [],
    avgAppointmentTime: barberCard.pendingChanges?.avgAppointmentTime || barberCard.avgAppointmentTime,
    isAvailable: barberCard.pendingChanges?.isAvailable !== undefined ? barberCard.pendingChanges.isAvailable : barberCard.isAvailable,
    image: barberCard.pendingChanges?.image || barberCard.image,
    approvalStatus: barberCard.approvalStatus || 'approved',
  } : {
    name: user?.name || "",
    services: [],
    avgAppointmentTime: "30 min",
    isAvailable: true,
    image: null,
    approvalStatus: 'approved',
  };

  // Baseline data for dirty checking
  const baselineData = useRef(initialData);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const [name, setName] = useState(initialData.name);
  const [services, setServices] = useState(initialData.services);
  const [avgAppointmentTime, setAvgAppointmentTime] = useState(
    initialData.avgAppointmentTime
  );
  const [isAvailable, setIsAvailable] = useState(initialData.isAvailable);
  const [barberCardImage, setBarberCardImage] = useState(initialData.image);
  const [approvalStatus, setApprovalStatus] = useState(initialData.approvalStatus);
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [existingCard, setExistingCard] = useState(!!barberCard);
  const [maxAppointments, setMaxAppointments] = useState(
    user?.maxAppointmentsPerDay || ""
  );
  const [hasDraft, setHasDraft] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true); // OPTIMIZATION: Track initial load

  // Modal State
  const [availableServices, setAvailableServices] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [servicePrice, setServicePrice] = useState("");
  const [serviceTime, setServiceTime] = useState("");
  const [selectedServiceForAdding, setSelectedServiceForAdding] =
    useState(null);
  const [shopData, setShopData] = useState(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Request Cancellation Ref
  const abortControllerRef = useRef(null);

  const showToast = useCallback(
    (message, type = "info") => setToast({ visible: true, message, type }),
    []
  );
  const formatPrice = (text) => text.replace(/[^0-9]/g, "");

  // --- OPTIMIZATION: Instant Updates from Navigation ---
  // Using useFocusEffect ensures this runs every time we return to the screen
  useFocusEffect(
    useCallback(() => {
      if (route.params?.updatedName) {
        setName(route.params.updatedName);
        // We generally don't want to clear it immediately to avoid loops, 
        // but since we check value equality, setName won't trigger re-renders if same.
      }
      if (route.params?.updatedServices) {
        setServices(route.params.updatedServices);
      }
    }, [route.params?.updatedName, route.params?.updatedServices])
  );

  // --- AUTO-CALCULATE AVG TIME ---
  useEffect(() => {
    if (services.length > 0) {
      const totalTime = services.reduce((sum, s) => sum + (parseInt(s.time) || 0), 0);
      const avg = Math.round(totalTime / services.length);
      setAvgAppointmentTime(`${avg} min`);
    } else {
      setAvgAppointmentTime("30 min");
    }
  }, [services]);

  // --- LOGIC: Drafts ---
  useEffect(() => {
    const saveDraft = async () => {
      if (name || services.length > 0) {
        const draftData = {
          name,
          services,
          avgAppointmentTime,
          isAvailable,
          barberCardImage,
        };
        await AsyncStorage.setItem(
          "barber_card_draft",
          JSON.stringify(draftData)
        );
      }
    };
    const timer = setTimeout(saveDraft, 2000);
    return () => clearTimeout(timer);
  }, [
    name,
    services,
    avgAppointmentTime,
    isAvailable,
    barberCardImage,
  ]);

  useEffect(() => {
    const checkDraft = async () => {
      if (!existingCard) {
        const draft = await AsyncStorage.getItem("barber_card_draft");
        if (draft) setHasDraft(true);
      }
    };
    checkDraft();
  }, [existingCard]);

  const loadDraft = async () => {
    const draft = await AsyncStorage.getItem("barber_card_draft");
    if (draft) {
      const data = JSON.parse(draft);
      setName(data.name);
      setServices(data.services);
      setBarberCardImage(data.barberCardImage);
      showToast("Draft restored!", "success");
      setHasDraft(false);
    }
  };

  // --- LOGIC: Services ---
  const removeService = useCallback(
    (serviceId) => {
      triggerHaptic();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      showToast("Service removed", "success");
    },
    [showToast]
  );

  const handleEditService = useCallback((service) => {
    triggerHaptic();
    setEditingService(service);
    setServicePrice(service.price);
    setServiceTime(service.time);
    setShowServiceModal(true);
  }, []);

  const handleModalSave = useCallback(() => {
    triggerHaptic();
    if (!servicePrice.trim() || !serviceTime.trim())
      return showToast("Required fields missing", "error");
    const targetService = editingService || selectedServiceForAdding;

    // Safety check
    if (!targetService) return;

    const newService = {
      id: editingService ? editingService.id : Date.now().toString(),
      serviceId: targetService.serviceId || targetService._id,
      name: targetService.name,
      price: servicePrice.trim(),
      time: serviceTime.trim(),
      // Normalise to Title Case so "hair" → "Hair" and tab matching always works
      category: targetService.category
        ? targetService.category.charAt(0).toUpperCase() + targetService.category.slice(1).toLowerCase()
        : 'General',
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (editingService) {
      setServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? newService : s))
      );
      showToast("Service updated", "success");
      // Switch menu tab to the category being edited so user sees the updated card
      setSelectedServiceMenuTab(newService.category || 'General');
    } else {
      setServices((prev) => [...prev, newService]);
      showToast("Service added", "success");
      // Auto-switch Service Menu tab to the newly added service's category
      setSelectedServiceMenuTab(newService.category || 'General');
    }
    setShowServiceModal(false);
    setEditingService(null);
    setSelectedServiceForAdding(null);
    setServicePrice("");
    setServiceTime("");
  }, [
    servicePrice,
    serviceTime,
    editingService,
    selectedServiceForAdding,
    showToast,
  ]);

  const handleModalClose = useCallback(() => {
    setSelectedServiceForAdding(null);
    setEditingService(null);
    setShowServiceModal(false);
  }, []);

  // --- DATA FETCHING (OPTIMIZED SWR) ---
  const fetchAvailableServices = useCallback(async () => {
    try {
      const res = await api.get('/api/barber-card/services');
      setAvailableServices(res.data);
    } catch (err) {
      console.log("Service fetch error", err);
    }
  }, []);

  const fetchShopData = useCallback(async () => {
    try {
      const res = await api.get('/api/shop/my-shop');
      setShopData(res.data);
    } catch (err) {
      console.log("Shop data fetch error", err);
    }
  }, []);

  const fetchExistingCard = useCallback(
    async (isBackground = false) => {
      // OPTIMIZATION: Only show Skeleton on FIRST load. Subsequent loads are background/silent.
      if (!isBackground) setIsLoadingData(true);

      // Request Cancellation Logic
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await api.get('/api/barber-card/my-card', {
          signal: abortControllerRef.current.signal,
        });

        if (response.data) {
          const data = response.data;
          // Use pendingChanges if available, otherwise approved data
          const currentData = {
            name: user?.name || data.pendingChanges?.name || data.name,
            services: data.pendingChanges?.services || data.services || [],
            avgAppointmentTime: data.pendingChanges?.avgAppointmentTime || data.avgAppointmentTime,
            isAvailable: data.pendingChanges?.isAvailable !== undefined ? data.pendingChanges.isAvailable : data.isAvailable,
            image: data.pendingChanges?.image || data.image,
          };

          // CRITICAL FIX: Do NOT overwrite local form data (Name, Services) on background refreshes.
          // The user might be editing them. Only set them on first load.
          if (!isBackground) {
            setName(currentData.name);
            setServices(currentData.services);

            // Set other fields that are less likely to be "mid-edit" but safer to set
            setServices(currentData.services);
            setAvgAppointmentTime(currentData.avgAppointmentTime);
            setIsAvailable(currentData.isAvailable);
            setApprovalStatus(data.approvalStatus);

            let barberCardImageUri = currentData.image;
            if (
              barberCardImageUri &&
              barberCardImageUri.startsWith("http") &&
              barberCardImageUri.includes("r2.dev")
            ) {
              barberCardImageUri = barberCardImageUri.replace(
                "https://pub-260d10bc28ca4ff894255965492ab1dd.r2.dev",
                "https://images.glosscut.com"
              );
            } else if (
              barberCardImageUri &&
              !barberCardImageUri.startsWith("http")
            ) {
              barberCardImageUri = `${process.env.EXPO_PUBLIC_API_URL}${barberCardImageUri}`;
            }
            if (barberCardImageUri) setBarberCardImage(barberCardImageUri);
            setExistingCard(true);

            // Update baseline
            baselineData.current = {
              name: currentData.name,
              services: currentData.services,
              avgAppointmentTime: currentData.avgAppointmentTime,
              isAvailable: currentData.isAvailable,
              image: barberCardImageUri || currentData.image
            };
          }
        }
      } catch (err) {
        if (err.name === 'CanceledError') {
          // Request cancelled, ignore
        } else if (err.response?.status !== 404) {
          console.error("Error fetching card:", err);
        }
      } finally {
        if (!isBackground) setIsLoadingData(false);
        setIsFirstLoad(false);
      }
    },
    []
  );

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchAvailableServices(), fetchShopData()]);
    };
    init();
  }, []);

  // --- OPTIMIZATION: Instant Updates from Navigation ---
  // Using useFocusEffect ensures this runs every time we return to the screen
  useFocusEffect(
    useCallback(() => {
      // CRITICAL FIX: If we just updated the name/services via navigation params, 
      // DO NOT fetch stale data from backend. Trust the params.
      // AUTO-SAVE: If existing card, sync changes to backend immediately to persist across sessions.
      if (route.params?.updatedName || route.params?.updatedServices) {
        setIsLoadingData(false);
        setIsFirstLoad(false);

        const newName = route.params?.updatedName || name;
        const newServices = route.params?.updatedServices || services;

        if (route.params?.updatedName) setName(route.params.updatedName);
        if (route.params?.updatedServices) setServices(route.params.updatedServices);

        if (existingCard) {
          const data = {
            name: newName.trim(),
            services: newServices,
            isAvailable
          };
          if (avgAppointmentTime !== "30 min") data.avgAppointmentTime = avgAppointmentTime;
          if (barberCardImage) data.image = barberCardImage;

          // Silent background save
          api.put('/api/barber-card', data).catch(err => console.log("Auto-save failed", err));
        }
        return;
      }

      // OPTIMIZATION: Pass 'true' if it's NOT the first load (Background Refresh)
      // pass !isFirstLoad to make subsequent calls silent
      fetchExistingCard(!isFirstLoad);
      fetchShopData();
      fetchAvailableServices();
    }, [fetchExistingCard, fetchShopData, fetchAvailableServices, isFirstLoad, route.params, existingCard, name, services, isAvailable, avgAppointmentTime, barberCardImage])
  );

  // --- SYNC WITH USER PROFILE ---
  // If user updates their name in Identity screen, sync it here automatically
  useEffect(() => {
    if (user?.name && user.name !== name) {
      // Always sync if providing a seamless "Identity = Display Name" experience.
      setName(user.name);
    }
  }, [user, name]);

  // --- ACTIONS ---
  const pickBarberCardImage = useCallback(async () => {
    try {
      triggerHaptic();
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showToast("Camera roll permissions required", "error");
          return;
        }
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      if (!result.canceled) {
        const originalUri = result.assets[0].uri;
        const compressedUri = await compressImage(originalUri); // Compress

        const filename = compressedUri.split("/").pop();
        const type = `image/${filename.split(".").pop()}`;

        const uploadUrl = '/api/barber-card/upload-image'; // Defined locally to avoid reference error

        const formData = new FormData();
        formData.append("barberCardImage", {
          uri: compressedUri,
          name: filename,
          type,
        });

        const uploadRes = await api.post(uploadUrl, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        if (uploadRes.data && uploadRes.data.imageUrl) {
          let imageUrl = uploadRes.data.imageUrl;
          if (imageUrl.includes("r2.dev"))
            imageUrl = imageUrl.replace(
              "https://pub-260d10bc28ca4ff894255965492ab1dd.r2.dev",
              "https://images.glosscut.com"
            );
          setBarberCardImage(imageUrl);
          showToast("Image uploaded successfully", "success");
          if (existingCard)
            await api.put(
              '/api/barber-card',
              { image: imageUrl }
            );
        }
      }
    } catch (error) {
      showToast(`Upload Error: ${error.message}`, "error");
    }
  }, [existingCard, showToast]);

  const handleSave = useCallback(async () => {
    triggerHaptic("Medium");
    if (!name.trim()) {
      triggerShake();
      return showToast("Please enter your professional name", "error");
    }
    if (services.length === 0)
      return showToast("Please add at least one service", "warning");

    // Dirty Check
    const currentImage = barberCardImage;
    // Helper to safely stringify (handling potential undefined/null)
    const safeStringify = (obj) => JSON.stringify(obj || "");

    // Sort services by ID or name to ensure order doesn't falsely trigger (unless order matters)
    // Assuming backend respects order, we should compare strictly. 

    const isNameChanged = name.trim() !== (baselineData.current.name || "").trim();
    // Helper to sort services preventing order-only saves
    const sortServices = (list) => {
      if (!list) return [];
      return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    };
    // Compare sorted arrays to ignore order changes
    const isServicesChanged = JSON.stringify(sortServices(services)) !== JSON.stringify(sortServices(baselineData.current.services));
    const isTimeChanged = avgAppointmentTime !== baselineData.current.avgAppointmentTime;
    const isAvailChanged = isAvailable !== baselineData.current.isAvailable;
    const isImageChanged = currentImage !== baselineData.current.image;

    if (!isNameChanged && !isServicesChanged && !isTimeChanged && !isAvailChanged && !isImageChanged) {
      return showToast("No changes to save", "info");
    }

    setLoading(true);
    try {
      const data = { name: name.trim(), services, isAvailable };
      if (avgAppointmentTime !== "30 min")
        data.avgAppointmentTime = avgAppointmentTime;
      if (barberCardImage) data.image = barberCardImage;

      if (existingCard)
        await api.put('/api/barber-card', data);
      else await api.post('/api/barber-card', data);
      await AsyncStorage.removeItem("barber_card_draft");
      showToast(
        existingCard ? "Profile updated!" : "Profile created!",
        "success"
      );

      // Update baseline after successful save
      baselineData.current = {
        name: name.trim(),
        services: services,
        avgAppointmentTime: avgAppointmentTime === "30 min" ? undefined : avgAppointmentTime, // Match payload structure logic if needed, but state is better
        // Actually better to sync with what we have in state
        avgAppointmentTime,
        isAvailable,
        image: barberCardImage
      };

      setTimeout(() => navigation.goBack(), 1500);
    } catch (err) {
      console.error("Save Error:", err);
      showToast(err.response?.data?.msg || "Network Error: check console", "error");
    } finally {
      setLoading(false);
    }
  }, [
    name,
    services,
    isAvailable,
    avgAppointmentTime,
    barberCardImage,
    existingCard,
    navigation,
    showToast,
  ]);

  // ─── Catalog: pro-level category tab filter ───────────────────────────────
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogTab, setSelectedCatalogTab] = useState('All');

  const CAT_META = {
    'Hair': { color: '#6366F1', emoji: '✂️' },
    'Beard': { color: '#F59E0B', emoji: '🧔' },
    'Skin': { color: '#10B981', emoji: '✨' },
    'Color': { color: '#EC4899', emoji: '🎨' },
    'Shave': { color: '#3B82F6', emoji: '🪒' },
    'Kids': { color: '#8B5CF6', emoji: '🧒' },
    'Eyebrow': { color: '#14B8A6', emoji: '👁️' },
    'Massage': { color: '#F97316', emoji: '💆' },
    'General': { color: '#64748B', emoji: '💈' },
  };
  // Normalize category to Title Case so "hair", "HAIR", "Hair" all map correctly
  const normalizeCat = (cat) => {
    if (!cat) return 'General';
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  };
  const getCatMeta = (cat) => {
    const normalized = normalizeCat(cat);
    return CAT_META[normalized] || CAT_META[cat] || { color: '#64748B', emoji: '💈' };
  };
  const getCatColor = (cat) => getCatMeta(cat).color;

  // All unique categories in the pool
  const catalogTabs = useMemo(() => {
    const cats = [...new Set(
      availableServices
        .filter(svc => !services.some(s => s.serviceId === svc._id))
        .map(svc => svc.category || 'General')
    )];
    return ['All', ...cats];
  }, [availableServices, services]);

  // Reset tab when modal reopens
  useEffect(() => {
    if (showServiceModal && !editingService && !selectedServiceForAdding) {
      setSelectedCatalogTab('All');
      setCatalogSearch('');
    }
  }, [showServiceModal, editingService, selectedServiceForAdding]);

  // Services filtered by search + active tab (already-added excluded)
  const catalogListData = useMemo(() => {
    return availableServices.filter(svc => {
      if (services.some(s => s.serviceId === svc._id)) return false;
      if (selectedCatalogTab !== 'All' && (svc.category || 'General') !== selectedCatalogTab) return false;
      if (!catalogSearch.trim()) return true;
      const q = catalogSearch.toLowerCase();
      return svc.name?.toLowerCase().includes(q) || svc.description?.toLowerCase().includes(q);
    });
  }, [availableServices, services, selectedCatalogTab, catalogSearch]);

  // Per-category counts for tab badges
  const catCounts = useMemo(() => {
    const pool = availableServices.filter(svc => !services.some(s => s.serviceId === svc._id));
    const map = { All: pool.length };
    pool.forEach(svc => {
      const c = svc.category || 'General';
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }, [availableServices, services]);

  // ─── Enrich saved services with category from catalog (backend may not store it) ───────
  const enrichedServices = useMemo(() => {
    return services.map(svc => {
      if (svc.category && svc.category !== 'General') return svc;
      const catalogSvc = availableServices.find(a => a._id === svc.serviceId || a._id === svc.id);
      const derivedCat = catalogSvc?.category
        ? catalogSvc.category.charAt(0).toUpperCase() + catalogSvc.category.slice(1).toLowerCase()
        : (svc.category || 'General');
      return { ...svc, category: derivedCat };
    });
  }, [services, availableServices]);

  // ─── Service Menu: category filter tabs (for already-added services) ───────
  const [selectedServiceMenuTab, setSelectedServiceMenuTab] = useState('All');

  // Auto-reset tab if the category disappears (service removed)
  useEffect(() => {
    const cats = [...new Set(enrichedServices.map(s => normalizeCat(s.category)))];
    if (selectedServiceMenuTab !== 'All' && !cats.includes(selectedServiceMenuTab)) {
      setSelectedServiceMenuTab('All');
    }
  }, [enrichedServices, selectedServiceMenuTab]);

  const serviceMenuTabs = useMemo(() => {
    // Derive tabs from enrichedServices so catalog-looked-up categories are used
    const cats = [...new Set(enrichedServices.map(s => normalizeCat(s.category)))];
    return ['All', ...cats];
  }, [enrichedServices]);

  const serviceMenuCounts = useMemo(() => {
    const map = { All: enrichedServices.length };
    enrichedServices.forEach(s => {
      const c = normalizeCat(s.category);
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }, [enrichedServices]);

  // Services shown in the draggable list — filtered by selected tab, using enriched categories
  const filteredMenuServices = useMemo(() => {
    if (selectedServiceMenuTab === 'All') return enrichedServices;
    return enrichedServices.filter(s => normalizeCat(s.category) === selectedServiceMenuTab);
  }, [enrichedServices, selectedServiceMenuTab]);

  // onDragEnd: merges reordered filtered items back into the raw services state by id
  const handleMenuDragEnd = useCallback(({ data: reordered }) => {
    triggerHaptic();
    if (selectedServiceMenuTab === 'All') {
      // Reordered contains enriched items; strip to just the ids to reorder services
      const idOrder = reordered.map(r => r.id);
      setServices(prev => idOrder.map(id => prev.find(s => s.id === id)).filter(Boolean));
    } else {
      // Only the filtered category was reordered; splice back by id
      const reorderedIds = reordered.map(r => r.id);
      setServices(prev => {
        const result = [...prev];
        // Positions of items in this category within prev
        const positions = prev
          .map((s, i) => ({ s, i }))
          .filter(({ s }) => normalizeCat(enrichedServices.find(e => e.id === s.id)?.category) === selectedServiceMenuTab)
          .map(({ i }) => i);
        positions.forEach((pos, idx) => {
          const srcItem = prev.find(s => s.id === reorderedIds[idx]);
          if (srcItem) result[pos] = srcItem;
        });
        return result;
      });
    }
  }, [selectedServiceMenuTab, enrichedServices]);

  // Computed category meta for the modal (edit or add)
  const activeModalCatMeta = useMemo(() =>
    getCatMeta((editingService?.category || selectedServiceForAdding?.category) || 'General'),
    [editingService, selectedServiceForAdding]
  );

  const displayedServices = useMemo(() => {
    const filtered = availableServices.filter(
      (service) => !services.some((s) => s.serviceId === service._id)
    );
    return filtered.slice(0, page * ITEMS_PER_PAGE);
  }, [availableServices, services, page]);

  const handleLoadMore = useCallback(() => {
    const totalAvailable = availableServices.filter(
      (service) => !services.some((s) => s.serviceId === service._id)
    ).length;
    if (displayedServices.length < totalAvailable) {
      setPage((prev) => prev + 1);
    }
  }, [availableServices, services, displayedServices.length]);

  const handleAppointmentSettings = useCallback(
    () =>
      navigation.navigate("AppointmentSettings", {
        currentMaxAppointments: maxAppointments,
        onUpdate: (newValue) => setMaxAppointments(newValue.toString()),
      }),
    [maxAppointments, navigation]
  );

  const previewBarberData = useMemo(
    () => ({
      name: name || "Professional Name",
      address: shopData?.address || "Shop Address",
      image: barberCardImage
        ? { uri: barberCardImage }
        : user?.profilePicture
          ? { uri: user.profilePicture }
          : null,
      rating: 4.8,
      reviews: 124,
      avgAppointmentTime,
      totalServices: services.length,
      isAvailable,
      tag: "Hair Specialist",
      category: "Barber",
    }),
    [
      name,
      barberCardImage,
      user?.profilePicture,
      avgAppointmentTime,
      services.length,
      isAvailable,
      shopData,
    ]
  );

  // --- RENDER DRAGGABLE ITEM ---
  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }) => {
      const catColor = getCatColor(item.category || 'General');
      return (
        <ScaleDecorator>
          <TouchableOpacity
            onLongPress={() => { triggerHaptic(); drag(); }}
            onPress={() => handleEditService(item)}
            disabled={isActive}
            style={[
              styles.serviceItem,
              {
                backgroundColor: isActive ? theme.colors.background : theme.colors.card,
                borderColor: isActive ? catColor : theme.colors.border,
                elevation: isActive ? 10 : 2,
              },
            ]}
          >
            {/* Category accent bar on left */}
            <View style={[styles.serviceAccentBar, { backgroundColor: catColor }]} />

            <View style={styles.serviceItemLeft}>
              {/* Emoji icon */}
              <View style={[styles.serviceEmojiBox, { backgroundColor: catColor + '18' }]}>
                <Text style={{ fontSize: 16 }}>{getCatMeta(item.category || 'General').emoji}</Text>
              </View>
              <GripVertical size={18} color={isActive ? catColor : theme.colors.textSecondary} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.serviceName, { color: theme.colors.text }]}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <View style={[styles.serviceCatPill, { backgroundColor: catColor + '18' }]}>
                    <Text style={[styles.serviceCatPillText, { color: catColor }]}>{item.category || 'General'}</Text>
                  </View>
                  <Text style={[styles.serviceMeta, { color: theme.colors.textSecondary }]}>⏱ {item.time} min</Text>
                </View>
              </View>
            </View>
            <View style={styles.serviceItemRight}>
              <Text style={[styles.servicePrice, { color: theme.colors.text }]}>₹{item.price}</Text>
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); removeService(item.id); }}
                style={styles.deleteIconBtn}
              >
                <Trash size={15} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </ScaleDecorator>
      );
    },
    [theme, handleEditService, removeService]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <StatusBar
          barStyle={theme.dark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.background}
        />
        <TopToast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast((p) => ({ ...p, visible: false }))}
        />

        {/* ── PREMIUM HEADER ── */}
        <AnimatedGradient
          colors={[theme.colors.primary, theme.colors.primary + 'DD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerWrapper, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}
        >
          <View style={styles.headerBlob1} />
          <View style={styles.headerBlob2} />
          <View style={styles.headerBlob3} />
          <View style={styles.headerBlob4} />

          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={22} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitleText}>
                {barberCard ? 'Edit Barber Card' : 'Create Barber Card'}
              </Text>
              <Text style={styles.headerSubtitleText}>
                {barberCard ? 'Update your public profile' : 'Build your professional identity'}
              </Text>
            </View>

            <View style={{ width: 42 }} />
          </View>
        </AnimatedGradient>

        {/* ── PENDING APPROVAL BANNER ── */}
        {approvalStatus === 'pending' && (
          <View style={styles.pendingBanner}>
            <View style={styles.pendingIconBox}>
              <Clock size={18} color="#92400E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Changes Pending Approval</Text>
              <Text style={styles.pendingBody}>You can continue editing, updates will be merged.</Text>
            </View>
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {isLoadingData ? (
            <FormSkeleton />
          ) : (
            <DraggableFlatList
              data={filteredMenuServices}
              onDragEnd={handleMenuDragEnd}
              keyExtractor={(item) => item.id}
              renderItem={renderDraggableItem}
              extraData={selectedServiceMenuTab}
              containerStyle={[styles.scrollContent, { flex: 1 }]}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <>
                  <View style={[styles.section, { marginTop: 28 }]}>
                    <View style={styles.sectionHeader}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        Live Preview
                      </Text>
                      <View style={styles.betaBadge}>
                        <Text style={styles.betaText}>PUBLIC VIEW</Text>
                      </View>
                    </View>
                    <BarberCardPreview
                      barberData={previewBarberData}
                      theme={theme}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: theme.colors.text, marginBottom: 15 },
                      ]}
                    >
                      Essential Details
                    </Text>
                    <InfoRow
                      icon={User}
                      label="Display Name"
                      value={name || "Set Name"}
                      theme={theme}
                      onPress={() =>
                        navigation.navigate("EditName", {
                          currentName: name,
                          onUpdate: setName,
                        })
                      }
                      shakeAnim={shakeAnimation}
                    />
                    <InfoRow
                      icon={Camera}
                      label="Cover Image"
                      value={barberCardImage ? "Image Added" : "Add Image"}
                      theme={theme}
                      onPress={pickBarberCardImage}
                    />
                    <InfoRow
                      icon={Clock}
                      label="Slot Duration"
                      value={avgAppointmentTime}
                      theme={theme}
                      canEdit={false}
                    />
                    <InfoRow
                      icon={Zap}
                      label="Daily Limit"
                      value={
                        maxAppointments
                          ? `${maxAppointments} Slots`
                          : "Unlimited"
                      }
                      theme={theme}
                      onPress={handleAppointmentSettings}
                    />
                  </View>

                  <View style={[styles.section, { marginBottom: 0 }]}>
                    <View style={styles.sectionHeaderRow}>
                      <View>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                          Service Menu
                        </Text>
                        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                          {services.length} Active · {selectedServiceMenuTab !== 'All' ? `Showing ${filteredMenuServices.length} ${selectedServiceMenuTab}` : 'All Categories'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => { triggerHaptic(); setShowServiceModal(true); }}
                        style={[styles.smallActionBtn, { backgroundColor: theme.colors.primary }]}
                      >
                        <Plus size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    {/* ── Service Menu category filter tabs ── */}
                    {services.length > 0 && (
                      /* NativeViewGestureHandler prevents DraggableFlatList's RNGH from
                         intercepting horizontal swipes so the ScrollView scrolls correctly */
                      <NativeViewGestureHandler disallowInterruption={true}>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={[styles.tabsRow, { paddingHorizontal: 0, paddingTop: 2 }]}
                          style={{ flexGrow: 0, marginBottom: 12 }}
                          nestedScrollEnabled
                        >
                          {serviceMenuTabs.map((tab) => {
                            const isActive = selectedServiceMenuTab === tab;
                            const meta = tab === 'All'
                              ? { color: theme.colors.primary, emoji: '💈' }
                              : getCatMeta(tab);
                            const count = serviceMenuCounts[tab] || 0;
                            return (
                              <TouchableOpacity
                                key={tab}
                                activeOpacity={0.8}
                                onPress={() => { triggerHaptic(); setSelectedServiceMenuTab(tab); }}
                                style={[
                                  styles.tabChip,
                                  isActive
                                    ? { backgroundColor: meta.color, borderColor: meta.color }
                                    : { backgroundColor: meta.color + '12', borderColor: meta.color + '30' },
                                ]}
                              >
                                <Text style={styles.tabEmoji}>{meta.emoji}</Text>
                                <Text style={[styles.tabLabel, { color: isActive ? '#FFF' : meta.color }]}>
                                  {tab}
                                </Text>
                                <View style={[
                                  styles.tabCountBubble,
                                  { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : meta.color + '20' }
                                ]}>
                                  <Text style={[styles.tabCount, { color: isActive ? '#FFF' : meta.color }]}>
                                    {count}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </NativeViewGestureHandler>
                    )}
                  </View>
                </>
              }
              ListFooterComponent={
                <View style={{ paddingBottom: 40, minHeight: 80 }}>
                  {/* Case 1: No services at all */}
                  {services.length === 0 && (
                    <View style={[styles.emptyServices, { borderColor: theme.colors.border, marginHorizontal: 20 }]}>
                      <Scissors size={40} color={theme.colors.border} />
                      <Text style={[styles.emptyServiceText, { color: theme.colors.textSecondary }]}>
                        No services added yet
                      </Text>
                      <TouchableOpacity onPress={() => setShowServiceModal(true)} style={{ marginTop: 10 }}>
                        <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                          + Add First Service
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {/* Case 2: Services exist but none match the selected category tab */}
                  {services.length > 0 && filteredMenuServices.length === 0 && selectedServiceMenuTab !== 'All' && (
                    <View style={[styles.emptyServices, { borderColor: getCatColor(selectedServiceMenuTab) + '40', marginHorizontal: 20 }]}>
                      <Text style={{ fontSize: 32 }}>{getCatMeta(selectedServiceMenuTab).emoji}</Text>
                      <Text style={[styles.emptyServiceText, { color: theme.colors.textSecondary }]}>
                        No {selectedServiceMenuTab} services added yet
                      </Text>
                      <TouchableOpacity
                        onPress={() => { triggerHaptic(); setShowServiceModal(true); }}
                        style={[styles.addCatBtn, { backgroundColor: getCatColor(selectedServiceMenuTab) + '15', borderColor: getCatColor(selectedServiceMenuTab) + '40' }]}
                      >
                        <Plus size={14} color={getCatColor(selectedServiceMenuTab)} />
                        <Text style={{ color: getCatColor(selectedServiceMenuTab), fontWeight: '700', fontSize: 13 }}>
                          Add {selectedServiceMenuTab} Service
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              }
            />
          )}
        </KeyboardAvoidingView>

        <View
          style={[
            styles.footerContainer,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <ScalePress
            onPress={handleSave}
            disabled={loading}
            style={{ width: "100%" }}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary]}
              style={[styles.footerBtn, { opacity: loading ? 0.8 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.footerBtnText}>
                    {existingCard ? "Save Changes" : "Create Profile"}
                  </Text>
                  <ArrowRight
                    size={20}
                    color="#fff"
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </LinearGradient>
          </ScalePress>
        </View>

        <Modal
          visible={showServiceModal}
          animationType="slide"
          transparent
          onRequestClose={handleModalClose}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={handleModalClose}
              />
              <View
                style={[
                  styles.sheetContainer,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <Text
                    style={[styles.sheetTitle, { color: theme.colors.text }]}
                  >
                    {editingService ? "Edit Service" : "Add Service"}
                  </Text>
                  <TouchableOpacity
                    onPress={handleModalClose}
                    style={styles.closeBtn}
                  >
                    <X size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {(editingService || selectedServiceForAdding) ? (
                  <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>

                    {/* ── Service Hero Card ── */}
                    <LinearGradient
                      colors={[activeModalCatMeta.color + '22', activeModalCatMeta.color + '08']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.modalHeroCard, { borderColor: activeModalCatMeta.color + '30' }]}
                    >
                      <View style={[styles.modalHeroIconBox, { backgroundColor: activeModalCatMeta.color + '25' }]}>
                        <Text style={{ fontSize: 30 }}>{activeModalCatMeta.emoji}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={[styles.modalHeroName, { color: theme.colors.text }]} numberOfLines={2}>
                          {(editingService || selectedServiceForAdding)?.name}
                        </Text>
                        <View style={[styles.modalHeroCatPill, { backgroundColor: activeModalCatMeta.color + '20' }]}>
                          <Text style={[styles.modalHeroCatText, { color: activeModalCatMeta.color }]}>
                            {(editingService || selectedServiceForAdding)?.category || 'General'}
                          </Text>
                        </View>
                      </View>
                      {editingService && (
                        <View style={[styles.modalEditBadge, { backgroundColor: activeModalCatMeta.color }]}>
                          <Text style={styles.modalEditBadgeText}>EDITING</Text>
                        </View>
                      )}
                    </LinearGradient>

                    {/* ── Price + Time Cards ── */}
                    <View style={styles.modalInputRow}>
                      {/* Price */}
                      <View style={[styles.modalInputCard, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        shadowColor: activeModalCatMeta.color,
                      }]}>
                        <View style={[styles.modalInputTopBar, { backgroundColor: activeModalCatMeta.color + '18' }]}>
                          <DollarSign size={13} color={activeModalCatMeta.color} strokeWidth={2.5} />
                          <Text style={[styles.modalInputLabel, { color: activeModalCatMeta.color }]}>PRICE</Text>
                        </View>
                        <Text style={[styles.modalInputCurrencyLabel, { color: theme.colors.textSecondary }]}>₹</Text>
                        <TextInput
                          value={servicePrice}
                          onChangeText={(t) => setServicePrice(formatPrice(t))}
                          style={[styles.modalBigInput, { color: theme.colors.text }]}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={theme.colors.textSecondary}
                          autoFocus
                        />
                      </View>

                      {/* Time */}
                      <View style={[styles.modalInputCard, {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        shadowColor: activeModalCatMeta.color,
                      }]}>
                        <View style={[styles.modalInputTopBar, { backgroundColor: activeModalCatMeta.color + '18' }]}>
                          <Clock size={13} color={activeModalCatMeta.color} strokeWidth={2.5} />
                          <Text style={[styles.modalInputLabel, { color: activeModalCatMeta.color }]}>DURATION</Text>
                        </View>
                        <TextInput
                          value={serviceTime}
                          onChangeText={setServiceTime}
                          style={[styles.modalBigInput, { color: theme.colors.text }]}
                          keyboardType="numeric"
                          placeholder="30"
                          placeholderTextColor={theme.colors.textSecondary}
                        />
                        <Text style={[styles.modalInputCurrencyLabel, { color: theme.colors.textSecondary, fontSize: 13 }]}>min</Text>
                      </View>
                    </View>

                    {/* ── Action Buttons ── */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.modalBackBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                        onPress={handleModalClose}
                      >
                        <ArrowLeft size={16} color={theme.colors.textSecondary} strokeWidth={2.5} />
                        <Text style={{ color: theme.colors.textSecondary, fontWeight: '600', fontSize: 14 }}>Back</Text>
                      </TouchableOpacity>
                      <LinearGradient
                        colors={[activeModalCatMeta.color, activeModalCatMeta.color + 'BB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.modalConfirmGradient}
                      >
                        <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleModalSave} activeOpacity={0.85}>
                          <CheckCircle size={18} color="#FFF" strokeWidth={2.5} />
                          <Text style={styles.modalConfirmText}>
                            {editingService ? 'Update Service' : 'Add to Menu'}
                          </Text>
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  </View>
                ) : (
                  <View style={{ height: 480 }}>

                    {/* ── SEARCH BAR ── */}
                    <View style={[styles.proSearchBar, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                      <Text style={{ fontSize: 15 }}>🔍</Text>
                      <TextInput
                        style={[styles.proSearchInput, { color: theme.colors.text }]}
                        placeholder="Search haircut, beard, skin…"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={catalogSearch}
                        onChangeText={setCatalogSearch}
                        autoCorrect={false}
                      />
                      {catalogSearch.length > 0 && (
                        <TouchableOpacity
                          onPress={() => setCatalogSearch('')}
                          style={[styles.proSearchClear, { backgroundColor: theme.colors.border }]}
                        >
                          <X size={12} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* ── HORIZONTAL CATEGORY TABS ── */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.tabsRow}
                      style={{ flexGrow: 0 }}
                    >
                      {catalogTabs.map((tab) => {
                        const isActive = selectedCatalogTab === tab;
                        const meta = tab === 'All'
                          ? { color: theme.colors.primary, emoji: '💈' }
                          : getCatMeta(tab);
                        const count = catCounts[tab] || 0;
                        return (
                          <TouchableOpacity
                            key={tab}
                            activeOpacity={0.8}
                            onPress={() => { triggerHaptic(); setSelectedCatalogTab(tab); }}
                            style={[
                              styles.tabChip,
                              isActive
                                ? { backgroundColor: meta.color, borderColor: meta.color }
                                : { backgroundColor: meta.color + '12', borderColor: meta.color + '30' },
                            ]}
                          >
                            <Text style={styles.tabEmoji}>{meta.emoji}</Text>
                            <Text style={[styles.tabLabel, { color: isActive ? '#FFF' : meta.color }]}>
                              {tab}
                            </Text>
                            <View style={[
                              styles.tabCountBubble,
                              { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : meta.color + '20' }
                            ]}>
                              <Text style={[styles.tabCount, { color: isActive ? '#FFF' : meta.color }]}>
                                {count}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* ── SERVICE CARDS ── */}
                    <FlatList
                      data={catalogListData}
                      keyExtractor={(item) => item._id}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                      style={{ flex: 1 }}
                      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
                      renderItem={({ item }) => {
                        const meta = getCatMeta(item.category || 'General');
                        return (
                          <TouchableOpacity
                            activeOpacity={0.82}
                            onPress={() => {
                              triggerHaptic();
                              setSelectedServiceForAdding(item);
                              setServicePrice('300');
                              setServiceTime('30');
                            }}
                            style={[styles.proServiceCard, {
                              backgroundColor: theme.colors.background,
                              borderColor: theme.colors.border,
                            }]}
                          >
                            {/* Left accent bar */}
                            <View style={[styles.proCardAccent, { backgroundColor: meta.color }]} />

                            {/* Icon bubble */}
                            <View style={[styles.proCardIcon, { backgroundColor: meta.color + '18' }]}>
                              <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                            </View>

                            {/* Text */}
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={[styles.proCardName, { color: theme.colors.text }]} numberOfLines={1}>
                                {item.name}
                              </Text>
                              <View style={[styles.proCardCatPill, { backgroundColor: meta.color + '18' }]}>
                                <Text style={[styles.proCardCatText, { color: meta.color }]}>
                                  {item.category || 'General'}
                                </Text>
                              </View>
                            </View>

                            {/* Add button */}
                            <LinearGradient
                              colors={[meta.color, meta.color + 'CC']}
                              style={styles.proAddBtn}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <Plus size={16} color="#FFF" strokeWidth={3} />
                            </LinearGradient>
                          </TouchableOpacity>
                        );
                      }}
                      ListEmptyComponent={
                        <View style={styles.proEmptyState}>
                          <Text style={{ fontSize: 32 }}>🔍</Text>
                          <Text style={[styles.proEmptyText, { color: theme.colors.textSecondary }]}>
                            {catalogSearch ? 'No services match your search.' : 'All services already added!'}
                          </Text>
                        </View>
                      }
                    />
                  </View>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Premium gradient header ──
  // --- PREMIUM HEADER ---
  headerWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    paddingTop: STATUSBAR_HEIGHT + 10,
  },
  headerBlob1: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.08)', top: -40, right: -30 },
  headerBlob2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -20 },
  headerBlob3: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', top: 20, left: '30%' },
  headerBlob4: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 40, right: -40 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: '100%' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitleText: { fontSize: 18, fontWeight: "900", color: '#FFF', letterSpacing: -0.5 },
  headerSubtitleText: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 2 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  // Decorative blobs inside header
  headerIconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  headerPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: '#FFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.70)',
    fontWeight: '500',
    marginTop: 3,
    textAlign: 'center',
  },
  headerActionBtn: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Pending approval banner ──
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    gap: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  pendingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  pendingBody: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '500',
    lineHeight: 16,
  },
  // ── Clean top bar ──────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  topBarBack: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  topBarSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  scrollContent: { paddingBottom: 40 },
  section: { paddingHorizontal: 20, marginBottom: 30 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  sectionSubtitle: { fontSize: 13, marginTop: 2, fontWeight: "500" },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  betaBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  betaText: { color: "#27AE60", fontSize: 10, fontWeight: "800" },
  barberCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  cardImageContainer: { height: 180, backgroundColor: "#eee" },
  cardImage: { width: "100%", height: "100%" },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  cardTopBadgeRow: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27AE60",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  ratingText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  cardContent: { padding: 16 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: "800", flex: 1 },
  verifiedBadge: { marginLeft: 6 },
  cardSubtitle: { fontSize: 14, fontWeight: "500" },
  separator: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 12 },
  cardStatsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { fontSize: 13, fontWeight: "600" },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    marginHorizontal: 10,
  },
  cardActionRow: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  availabilityIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  infoRowContainer: { marginBottom: 12 },
  infoRowInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  infoRowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: { fontSize: 16, fontWeight: "600" },

  // ── InfoRow chevron + locked badge ──
  chevronBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },

  smallActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Service items (draggable) ──
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingLeft: 0,
    paddingRight: 14,
    borderRadius: 16,
    marginBottom: 10,
    marginHorizontal: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  serviceAccentBar: {
    width: 5,
    alignSelf: 'stretch',
    marginRight: 12,
  },
  serviceEmojiBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  serviceCatPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  serviceCatPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  serviceItemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  serviceName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  serviceMeta: { fontSize: 11 },
  serviceItemRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  servicePrice: { fontSize: 16, fontWeight: "700" },
  deleteIconBtn: {
    padding: 6,
    backgroundColor: "rgba(235, 87, 87, 0.1)",
    borderRadius: 8,
  },
  emptyServices: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    opacity: 0.6,
  },
  emptyServiceText: { marginTop: 10, fontSize: 14, fontWeight: "600" },
  addCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  reorderControls: { flexDirection: "row", gap: 5 },
  moveBtn: { padding: 8, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 8 },
  footerContainer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
  },
  footerBtn: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  footerBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 22, fontWeight: "800" },
  closeBtn: { padding: 8, backgroundColor: "#F5F5F5", borderRadius: 20 },
  serviceHeroName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  inputRow: { flexDirection: "row", gap: 15, marginBottom: 30 },
  bigInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#999",
    marginBottom: 8,
  },
  bigInput: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
    padding: 0,
  },
  modalActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textBtn: { padding: 15 },
  primaryBtn: {
    flex: 1,
    marginLeft: 15,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  listSubHeader: {
    paddingHorizontal: 24,
    marginBottom: 10,
    fontWeight: "600",
    fontSize: 13,
  },
  catalogItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  catalogItemText: { fontSize: 16, fontWeight: "600" },
  addBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCatalog: { padding: 30, alignItems: "center" },
  premiumToast: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  toastIconContainer: { marginRight: 12 },
  premiumToastText: { fontWeight: "700", fontSize: 14, color: "#fff", flex: 1 },

  // ── Pro-level catalog UI ──────────────────────────────────────────────────
  // Search bar
  proSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  proSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  proSearchClear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Category tab pills (horizontal scroll)
  tabsRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1.5,
    gap: 5,
    marginRight: 8,
  },
  tabEmoji: { fontSize: 14 },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabCountBubble: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabCount: {
    fontSize: 10,
    fontWeight: '800',
  },

  // Service card in FlatList
  proServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    paddingVertical: 14,
    paddingRight: 14,
  },
  proCardAccent: {
    width: 4,
    alignSelf: 'stretch',
    marginRight: 12,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  proCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proCardName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  proCardCatPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  proCardCatText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  proAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  // Empty state
  proEmptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  proEmptyText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Edit / Add Service modal ─────────────────────────────────────────────
  modalHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  modalHeroIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeroName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  modalHeroCatPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  modalHeroCatText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  modalEditBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  modalEditBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.6,
  },
  // Price / Time input cards (side by side)
  modalInputRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  modalInputCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  modalInputTopBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 5,
  },
  modalInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  modalInputCurrencyLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
  },
  modalBigInput: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 12,
    width: '100%',
    letterSpacing: -0.5,
  },
  // Action buttons row
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  modalConfirmGradient: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  modalConfirmText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default CreateBarberCardScreen;
