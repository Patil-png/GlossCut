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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import OptimizedImage from "../components/OptimizedImage.jsx";
import { FlashList } from "@shopify/flash-list";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
          <View
            style={[
              styles.infoRowInner,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <View style={styles.infoRowLeft}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.dark ? "#333" : "#F7F8F9" },
                ]}
              >
                <Icon size={20} color={theme.colors.primary} strokeWidth={2} />
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {label}
                </Text>
                <Text
                  style={[styles.infoValue, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {value}
                </Text>
              </View>
            </View>
            {canEdit && <ChevronRight size={20} color={theme.colors.border} />}
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
      category: targetService.category,
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (editingService) {
      setServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? newService : s))
      );
      showToast("Service updated", "success");
    } else {
      setServices((prev) => [...prev, newService]);
      showToast("Service added", "success");
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
      return (
        <ScaleDecorator>
          <TouchableOpacity
            onLongPress={() => {
              triggerHaptic();
              drag();
            }}
            onPress={() => handleEditService(item)}
            disabled={isActive}
            style={[
              styles.serviceItem,
              {
                backgroundColor: isActive
                  ? theme.colors.background
                  : theme.colors.card,
                borderColor: isActive
                  ? theme.colors.primary
                  : theme.colors.border,
                elevation: isActive ? 10 : 0,
              },
            ]}
          >
            <View style={styles.serviceItemLeft}>
              <GripVertical
                size={20}
                color={
                  isActive ? theme.colors.primary : theme.colors.textSecondary
                }
                style={{ marginRight: 10 }}
              />
              <View>
                <Text
                  style={[styles.serviceName, { color: theme.colors.text }]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.serviceMeta,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {item.time} mins • {item.category || "General"}
                </Text>
              </View>
            </View>
            <View style={styles.serviceItemRight}>
              <Text style={[styles.servicePrice, { color: theme.colors.text }]}>
                ₹{item.price}
              </Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  removeService(item.id);
                }}
                style={styles.deleteIconBtn}
              >
                <Trash size={16} color={theme.colors.error || "#EB5757"} />
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

        {/* HEADER */}
        <View
          style={styles.header}
        >
          <ScalePress
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </ScalePress>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {barberCard ? "Edit Profile" : "Setup Profile"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {approvalStatus === 'pending' && (
          <View style={{ backgroundColor: '#FFF3CD', padding: 12, marginHorizontal: 20, marginBottom: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FFEEBA' }}>
            <Clock size={16} color="#856404" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#856404', fontWeight: '700', fontSize: 13 }}>Changes Pending Approval</Text>
              <Text style={{ color: '#856404', fontSize: 12 }}>You can continue editing, updates will be merged.</Text>
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
              data={services}
              onDragEnd={({ data }) => {
                setServices(data);
                triggerHaptic();
              }}
              keyExtractor={(item) => item.id}
              renderItem={renderDraggableItem}
              containerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <>
                  <View style={styles.section}>
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
                        <Text
                          style={[
                            styles.sectionTitle,
                            { color: theme.colors.text },
                          ]}
                        >
                          Service Menu
                        </Text>
                        <Text
                          style={[
                            styles.sectionSubtitle,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {services.length} Active Services
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          triggerHaptic();
                          setShowServiceModal(true);
                        }}
                        style={[
                          styles.smallActionBtn,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <Plus size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              }
              ListFooterComponent={
                <View style={{ height: 120 }}>
                  {services.length === 0 && (
                    <View
                      style={[
                        styles.emptyServices,
                        {
                          borderColor: theme.colors.border,
                          marginHorizontal: 20,
                        },
                      ]}
                    >
                      <Scissors size={40} color={theme.colors.border} />
                      <Text
                        style={[
                          styles.emptyServiceText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        No services added yet
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowServiceModal(true)}
                        style={{ marginTop: 10 }}
                      >
                        <Text
                          style={{
                            color: theme.colors.primary,
                            fontWeight: "700",
                          }}
                        >
                          + Add First Service
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

                {editingService || selectedServiceForAdding ? (
                  <View style={{ padding: 24 }}>
                    <Text
                      style={[
                        styles.serviceHeroName,
                        { color: theme.colors.text },
                      ]}
                    >
                      {editingService?.name || selectedServiceForAdding?.name}
                    </Text>
                    <View style={styles.inputRow}>
                      <View
                        style={[
                          styles.bigInputContainer,
                          {
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <Text style={styles.inputLabel}>PRICE (₹)</Text>
                        <TextInput
                          value={servicePrice}
                          onChangeText={(t) => setServicePrice(formatPrice(t))}
                          style={[
                            styles.bigInput,
                            { color: theme.colors.text },
                          ]}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={theme.colors.textSecondary}
                          autoFocus
                        />
                      </View>
                      <View
                        style={[
                          styles.bigInputContainer,
                          {
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <Text style={styles.inputLabel}>TIME (MIN)</Text>
                        <TextInput
                          value={serviceTime}
                          onChangeText={setServiceTime}
                          style={[
                            styles.bigInput,
                            { color: theme.colors.text },
                          ]}
                          keyboardType="numeric"
                          placeholder="30"
                          placeholderTextColor={theme.colors.textSecondary}
                        />
                      </View>
                    </View>
                    <View style={styles.modalActionRow}>
                      <TouchableOpacity
                        style={styles.textBtn}
                        onPress={handleModalClose}
                      >
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontWeight: "600",
                          }}
                        >
                          Back
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.primaryBtn,
                          { backgroundColor: theme.colors.primary },
                        ]}
                        onPress={handleModalSave}
                      >
                        <Text style={styles.primaryBtnText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ height: 400 }}>
                    <Text
                      style={[
                        styles.listSubHeader,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Select from catalog
                    </Text>
                    <FlashList
                      data={displayedServices}
                      estimatedItemSize={60}
                      keyExtractor={(item) => item._id}
                      onEndReached={handleLoadMore}
                      contentContainerStyle={{
                        paddingHorizontal: 24,
                        paddingBottom: 20,
                      }}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.catalogItem,
                            { borderBottomColor: theme.colors.border },
                          ]}
                          onPress={() => {
                            triggerHaptic();
                            setSelectedServiceForAdding(item);
                            setServicePrice("300");
                            setServiceTime("30");
                          }}
                        >
                          <Text
                            style={[
                              styles.catalogItemText,
                              { color: theme.colors.text },
                            ]}
                          >
                            {item.name}
                          </Text>
                          <View
                            style={[
                              styles.addBtnSmall,
                              { backgroundColor: theme.colors.background },
                            ]}
                          >
                            <Plus size={16} color={theme.colors.text} />
                          </View>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={
                        <View style={styles.emptyCatalog}>
                          <Text style={{ color: theme.colors.textSecondary }}>
                            No more services available.
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === "android" ? 45 : 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerActionBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
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
  smallActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  serviceItemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  serviceName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  serviceMeta: { fontSize: 12 },
  serviceItemRight: { flexDirection: "row", alignItems: "center", gap: 15 },
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
});

export default CreateBarberCardScreen;
