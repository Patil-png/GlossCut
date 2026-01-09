import React, { useState, useEffect, useRef,useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ImageBackground,
  Animated,
  Modal,
  FlatList,
  Platform,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import OptimizedImage from "../components/OptimizedImage.jsx";
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
  Bookmark,
  Camera,
  Sparkles,
  Scissors,
  WifiOff,
  ServerCrash,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");
const STATUSBAR_HEIGHT =
  Platform.OS === "ios" ? 40 : StatusBar.currentHeight || 24;

// --- 1. ANIMATED TOAST COMPONENT (TOP NOTIFICATION) ---
const TopToast = ({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide In
      Animated.spring(translateY, {
        toValue: STATUSBAR_HEIGHT + 10,
        useNativeDriver: true,
        friction: 5,
        tension: 40,
      }).start();

      // Auto Hide after 3 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
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

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#00C853"; // Green
      case "error":
        return "#FF4757"; // Red
      case "warning":
        return "#FFA000"; // Orange
      default:
        return "#333";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} color="#fff" />;
      case "error":
        return <AlertCircle size={20} color="#fff" />;
      case "warning":
        return <Zap size={20} color="#fff" />;
      default:
        return <Sparkles size={20} color="#fff" />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY }], backgroundColor: getBackgroundColor() },
      ]}
    >
      <View style={styles.toastIcon}>{getIcon()}</View>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

// --- MICRO-INTERACTION WRAPPER ---
const ScalePress = ({ onPress, style, children, disabled }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
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
};

// --- PREVIEW COMPONENT ---
const BarberCardPreview = ({ barberData, theme, onImageLoadStart, onImageLoad, onImageError }) => {
  const fullness = 50;
  const capacityText = fullness > 90 ? "Almost Full" : "5 slots left";

  return (
    <View style={[styles.barberCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      {/* --- Image Section --- */}
      <View style={styles.cardImageContainer}>
        {barberData.image ? (
          <OptimizedImage
            source={barberData.image.uri}
            style={styles.cardImage}
            contentFit="cover"
            onLoadStart={onImageLoadStart ? () => onImageLoadStart(barberData.image.uri) : undefined}
            onLoad={onImageLoad ? () => onImageLoad(barberData.image.uri) : undefined}
          >
            <View style={styles.gradientOverlay} />

            <View style={styles.cardTopRow}>
              <View style={styles.glassBadge}>
                <Text style={styles.ratingBadgeText}>{barberData.rating > 0 ? barberData.rating.toFixed(1) : "New"}</Text>
                <Star size={12} color="#000" fill="#000" style={{ marginLeft: 3, marginBottom: 1 }} />
              </View>
            </View>

            <View style={styles.cardBottomInfo}>
              {!barberData.isAvailable ? (
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
            </View>
          </OptimizedImage>
        ) : (
          <View style={[styles.cardImageContainer, { backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' }]}>
            <LinearGradient
              colors={[theme.colors.border, theme.colors.background]}
              style={StyleSheet.absoluteFill}
            />
            <Text
              style={[
                { fontSize: 50, fontWeight: "bold", color: theme.colors.textSecondary },
              ]}
            >
              {barberData.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
      </View>

      {/* --- Content Section --- */}
      <View style={styles.cardBody}>
        <View style={styles.cardHeaderCol}>
          <Text style={[styles.barberName, { color: theme.colors.text }]} numberOfLines={1}>{barberData.name || "Barber Name"}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
            <MapPin size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.shopName, { color: theme.colors.textSecondary, marginLeft: 4 }]} numberOfLines={1}>{barberData.address || "Shop Address, City"}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{barberData.avgAppointmentTime || "30 min"}</Text>
          </View>
          <View style={[styles.dotSeparator, { backgroundColor: theme.colors.border }]} />
          <View style={styles.metaItem}>
            <Scissors size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{barberData.totalServices || 0} Services</Text>
          </View>
          <View style={[styles.dotSeparator, { backgroundColor: theme.colors.border }]} />
          <View style={styles.metaItem}>
            <Star size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{barberData.reviews || 0} Reviews</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {barberData.isAvailable && (
            <View style={styles.capacityContainer}>
              <View style={{flexDirection:'row', alignItems: 'center', marginBottom: 6}}>
                <Text style={[styles.capacityText, { color: fullness > 80 ? '#FF3B30' : '#27AE60' }]}>{capacityText}</Text>
              </View>
              <View style={[styles.capacityBarTrack, { backgroundColor: theme.dark ? '#333' : '#E0E0E0' }]}>
                <Animated.View style={[styles.capacityBarFill, { width: `${fullness}%`, backgroundColor: fullness > 80 ? "#FF3B30" : "#27AE60" }]} />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: barberData.isAvailable ? theme.colors.primary : theme.colors.border, shadowColor: barberData.isAvailable ? theme.colors.primary : '#000' }]}
            disabled={!barberData.isAvailable}
          >
            <Text style={[styles.bookButtonText, { color: barberData.isAvailable ? '#fff' : '#999' }]}>
              {barberData.isAvailable ? 'Live Queue' : 'Closed'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// --- INFO ROW COMPONENT ---
const InfoRow = ({
  icon: Icon,
  label,
  value,
  theme,
  onPress,
  canEdit = true,
}) => (
  <ScalePress
    onPress={canEdit ? onPress : undefined}
    disabled={!canEdit}
    style={styles.infoRowWrapper}
  >
    <View
      style={[
        styles.infoRow,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: theme.colors.primary + "15" },
        ]}
      >
        <Icon size={22} color={theme.colors.primary} strokeWidth={2} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
          {value}
        </Text>
      </View>
      {canEdit && (
        <View
          style={[
            styles.editIconContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Edit size={16} color={theme.colors.textSecondary} />
        </View>
      )}
    </View>
  </ScalePress>
);

const CreateBarberCardScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { barberCard } = route.params || {};

  // Toast State
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  // Helper to show toast
  const showToast = (message, type = "info") => {
    setToast({ visible: true, message, type });
  };

  const [name, setName] = useState(barberCard?.name || user?.name || "");
  const [services, setServices] = useState(barberCard?.services || []);
  const [specialties, setSpecialties] = useState(barberCard?.specialties || []);
  const [avgAppointmentTime, setAvgAppointmentTime] = useState(
    barberCard?.avgAppointmentTime || "30 min"
  );
  const [isAvailable, setIsAvailable] = useState(
    barberCard?.isAvailable !== undefined ? barberCard.isAvailable : true
  );
  const [barberCardImage, setBarberCardImage] = useState(
    barberCard?.image || null
  );
  const [loading, setLoading] = useState(false);
  const [existingCard, setExistingCard] = useState(!!barberCard);
  const [maxAppointments, setMaxAppointments] = useState(user?.maxAppointmentsPerDay || '');

  const [availableServices, setAvailableServices] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [servicePrice, setServicePrice] = useState("");
  const [serviceTime, setServiceTime] = useState("");
  const [selectedServiceForAdding, setSelectedServiceForAdding] =
    useState(null);
  const [shopData, setShopData] = useState(null);

  // --- SAFE MODAL TEXT INPUT HANDLER (PROMPT REPLACEMENT) ---
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptConfig, setPromptConfig] = useState({
    title: "",
    value: "",
    placeholder: "",
    callback: null,
  });

  const safePrompt = (title, placeholder, currentValue, callback) => {
    // Android doesn't support Alert.prompt, so we use a custom approach or just a Modal
    // For simplicity in this robust version, we will assume we use the Modal we built below
    // But since the requirement is "don't change functionality", we keep Alert.prompt for iOS
    // and provide a fallback or ensure we use the provided Modal for editing details.

    // To strictly follow "looks good on android" and "no crashes", we avoid Alert.prompt on Android.
    if (Platform.OS === "ios") {
      // Use standard alert prompt on iOS (it's clean)
      // Note: Alert.prompt is not available in 'react-native' types by default sometimes,
      // but works in runtime. If it fails, we catch it.
      try {
        // @ts-ignore
        Alert.prompt(title, placeholder, callback, "plain-text", currentValue);
      } catch (e) {
        // Fallback if needed
        setPromptConfig({ title, placeholder, value: currentValue, callback });
        setPromptVisible(true);
      }
    } else {
      // Android Prompt Custom Implementation
      setPromptConfig({ title, placeholder, value: currentValue, callback });
      setPromptVisible(true);
    }
  };

  const pickBarberCardImage = async () => {
    try {
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
        quality: 0.8,
      });

      if (!result.canceled) {
        const localUri = result.assets[0].uri;
        const filename = localUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Authentication token missing");

        // Upload to server (will be stored on images.glosscut.com)
        const uploadUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/upload-image`;
        console.log('🖼️ Barber Card Upload: Attempting upload to:', uploadUrl);

        const formData = new FormData();
        formData.append('barberCardImage', {
          uri: localUri,
          name: filename,
          type,
        });

        const uploadRes = await axios.post(
          uploadUrl,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "x-auth-token": token,
            },
          }
        );

        if (uploadRes.data && uploadRes.data.imageUrl) {
          // Convert R2 URL to Cloudflare domain for FREE fetching
          let imageUrl = uploadRes.data.imageUrl;
          if (imageUrl.includes('pub-260d10bc28ca4ff894255965492ab1dd.r2.dev')) {
            imageUrl = imageUrl.replace('https://pub-260d10bc28ca4ff894255965492ab1dd.r2.dev', 'https://images.glosscut.com');
            console.log('🔥 FREE UPLOAD: Converted R2 URL to Cloudflare:', imageUrl);
          }

          setBarberCardImage(imageUrl);
          showToast("Image uploaded successfully", "success");

          // Auto-save the cloud URL to the barber card
          try {
            const token = await AsyncStorage.getItem("token");
            if (token && existingCard) {
              const saveData = { image: imageUrl };
              await axios.put(
                `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card`,
                saveData,
                {
                  headers: { "x-auth-token": token },
                }
              );
              console.log('🖼️ Barber Card: Cloud image auto-saved to database');
            }
          } catch (saveErr) {
            console.error('⚠️ Failed to auto-save cloud image:', saveErr);
            // Don't show error toast to user as the upload was successful
          }
        } else {
          showToast("Upload failed: No URL returned", "error");
        }
      }
    } catch (error) {
      console.error("Image upload error:", error);
      const errorMsg =
        error.response?.data?.msg || error.message || "Network Error";
      showToast(`Upload Error: ${errorMsg}`, "error");
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([fetchAvailableServices(), fetchShopData()]);

        if (barberCard) {
          setName(barberCard.name);
          setServices(barberCard.services || []);
          setSpecialties(barberCard.specialties || []);
          setAvgAppointmentTime(barberCard.avgAppointmentTime);
          setIsAvailable(barberCard.isAvailable);
          setExistingCard(true);
        } else {
          await fetchExistingCard();
        }
      } catch (e) {
        showToast("Connection failed. Working offline.", "warning");
      }
    };
    initializeData();
  }, [barberCard, user]);

  // Refetch data when screen is focused (after returning from other screens)
  useFocusEffect(
    useCallback(() => {
      const refetchData = async () => {
        try {
          console.log('🔄 Refetching barber card data on screen focus...');
          // Always refetch existing card data to get latest changes
          await fetchExistingCard();
          // Refetch shop data in case it changed
          await fetchShopData();
          console.log('✅ Barber card data refetched successfully');
        } catch (e) {
          console.error('❌ Error refetching barber card data:', e);
        }
      };
      refetchData();
    }, []) // Remove barberCard dependency to always refetch
  );

  const fetchExistingCard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/my-card`,
        {
          headers: { "x-auth-token": token },
        }
      );

    if (response.data) {
      setName(response.data.name);
      setServices(response.data.services || []);
      setSpecialties(response.data.specialties || []);
      setAvgAppointmentTime(response.data.avgAppointmentTime);
      setIsAvailable(response.data.isAvailable);

      // Update image using FREE fetching logic - convert R2 URLs to Cloudflare domain
      let barberCardImageUri = response.data.image;

      if (barberCardImageUri) {
        if (barberCardImageUri.startsWith("http")) {
          // HTTP URL - convert R2 to Cloudflare domain for FREE fetching
          if (barberCardImageUri.includes('pub-260d10bc28ca4ff894255965492ab1dd.r2.dev')) {
            barberCardImageUri = barberCardImageUri.replace('https://pub-260d10bc28ca4ff894255965492ab1dd.r2.dev', 'https://images.glosscut.com');
            console.log('🔥 FREE FETCHING: Converted R2 URL to Cloudflare:', barberCardImageUri);
          }
          // Otherwise use HTTP URL as-is
        } else {
          // Relative path - prepend API URL
          barberCardImageUri = `${process.env.EXPO_PUBLIC_API_URL}${barberCardImageUri}`;
        }
      } else {
        // Fallback to user profile picture
        barberCardImageUri = user?.profilePicture;
      }

      console.log('🖼️ CreateBarberCard: Fetched barber card image:', {
        rawImage: response.data.image,
        processedUri: barberCardImageUri,
        userProfileImage: user?.profilePicture
      });

      if (barberCardImageUri) setBarberCardImage(barberCardImageUri);

      setExistingCard(true);
    } else {
      setExistingCard(false);
    }
    } catch (err) {
      // Handle 404 silently - it's normal for new users
      if (err.response?.status === 404) {
        setExistingCard(false);
      } else {
        // Only log actual errors, not expected 404s for new users
        console.error('Error fetching existing barber card:', err.response?.data || err.message);
      }
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/services`,
        {
          headers: { "x-auth-token": token },
        }
      );
      setAvailableServices(res.data);
    } catch (err) {
      // Don't show toast here to avoid spamming on load, just log
      console.log("Service fetch error", err);
    }
  };

  const fetchShopData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/shop/my-shop`,
        {
          headers: { "x-auth-token": token },
        }
      );
      setShopData(res.data);
    } catch (err) {
      console.log("Shop data fetch error", err);
    }
  };

  const removeService = (serviceId) => {
    setServices(services.filter((s) => s.id !== serviceId));
    showToast("Service removed", "success");
  };

  const removeSpecialty = (specialty) => {
    setSpecialties(specialties.filter((s) => s !== specialty));
  };

  const updateAvailability = async (newStatus) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showToast("You are not logged in", "error");
        return;
      }

      const data = { isAvailable: newStatus };
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card`,
        data,
        {
          headers: { "x-auth-token": token },
        }
      );
      setIsAvailable(newStatus);
      showToast(
        newStatus
          ? "Status set to Available"
          : "Status set to Offline",
        "success"
      );
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  // Removed unused functions for input

  // --- DELETE LOGIC ---
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const handleDeleteBarberCard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/barber-card`, {
        headers: { "x-auth-token": token },
      });
      showToast("Card deleted successfully", "success");
      setTimeout(() => navigation.goBack(), 1000);
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to delete card", "error");
    } finally {
      setDeleteModalVisible(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast("Please enter your professional name", "error");
      return;
    }

    if (services.length === 0) {
      showToast("Please add at least one service", "warning");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showToast("You are not logged in", "error");
        setLoading(false);
        return;
      }

      const data = {
        name: name.trim(),
        services,
        specialties,
        isAvailable,
      };
      if (avgAppointmentTime !== "30 min") {
        data.avgAppointmentTime = avgAppointmentTime;
      }
      if (barberCardImage) {
        data.image = barberCardImage;
      }

      let response;
      if (existingCard) {
        response = await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card`,
          data,
          {
            headers: { "x-auth-token": token },
          }
        );
        showToast("Profile updated successfully!", "success");
      } else {
        response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card`,
          data,
          {
            headers: { "x-auth-token": token },
          }
        );
        showToast("Profile created successfully!", "success");
      }



      setTimeout(() => navigation.goBack(), 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg || "Network Error. Please check internet.";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* STATUS BAR CONFIG */}
      <StatusBar
        barStyle={theme.dark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* BACKGROUND */}
      <LinearGradient
        colors={[theme.colors.background, theme.colors.card]}
        style={StyleSheet.absoluteFill}
      />

      {/* TOAST NOTIFICATION (ABSOLUTE TOP) */}
      <TopToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      {/* HEADER - Adjusted for Android/iOS */}
      <View
        style={[
          styles.header,
          { marginTop: Platform.OS === "android" ? STATUSBAR_HEIGHT : 0 },
        ]}
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Live Preview Label */}
          <View style={styles.previewLabelContainer}>
            <Sparkles
              size={14}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.previewLabel, { color: theme.colors.primary }]}
            >
              LIVE PREVIEW
            </Text>
          </View>

          {/* Card Preview */}
          <BarberCardPreview
            barberData={{
              name: name || "Professional Name",
              address: "Shop Address",
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
              tag: specialties[0] || "Hair Specialist",
              category: "Barber",
            }}
            theme={theme}
            onImageLoadStart={(uri) => console.log('🖼️ CreateBarberCard Preview: Load started for:', uri)}
            onImageLoad={(uri) => console.log('✅ CreateBarberCard Preview: Successfully loaded:', uri)}
            onImageError={(uri, error) => console.log('❌ CreateBarberCard Preview: Failed to load:', uri, 'Error:', error.nativeEvent)}
          />

          {/* Delete Button (Conditional) */}
          {existingCard &&
            (!shopData?.isMainOwner ||
              (shopData?.isMainOwner && shopData?.staff?.length === 0)) && (
              <ScalePress
                onPress={() => setDeleteModalVisible(true)}
                style={styles.deleteContainer}
              >
                <View style={styles.deleteContent}>
                  <Trash size={18} color="#FF4757" />
                  <Text style={styles.deleteText}>Delete Card</Text>
                </View>
              </ScalePress>
            )}

          {/* Basic Details Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Basic Details
            </Text>

            <InfoRow
              icon={User}
              label="Professional Name"
              value={name || "Professional Name"}
              theme={theme}
              onPress={() => navigation.navigate('EditName', { currentName: name, onUpdate: (newName) => setName(newName) })}
            />
            <InfoRow
              icon={Camera}
              label="Profile Photo"
              value={barberCardImage ? "Photo Updated" : "Upload Photo"}
              theme={theme}
              onPress={pickBarberCardImage}
            />
            <InfoRow
              icon={Clock}
              label="Avg. Slot Time"
              value={avgAppointmentTime}
              theme={theme}
              canEdit={false}
            />

            <InfoRow
              icon={Clock}
              label="Max Appointments / Day"
              value={maxAppointments ? maxAppointments.toString() : "Set limit"}
              theme={theme}
              onPress={() => navigation.navigate('AppointmentSettings', {
                currentMaxAppointments: maxAppointments,
                onUpdate: (newValue) => setMaxAppointments(newValue.toString())
              })}
            />
          </View>

          {/* Services Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  Service Menu
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Manage your prices & timings
                </Text>
              </View>
              <ScalePress
                onPress={() => setShowServiceModal(true)}
                style={[
                  styles.addButton,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Plus size={24} color="#fff" />
              </ScalePress>
            </View>

            {services.map((service, index) => (
              <ScalePress
                key={service.id}
                onPress={() => {
                  setEditingService(service);
                  setServicePrice(service.price);
                  setServiceTime(service.time);
                  setShowServiceModal(true);
                }}
              >
                <View
                  style={[
                    styles.serviceCard,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.serviceLeft}>
                    <Text
                      style={[
                        styles.serviceCardTitle,
                        { color: theme.colors.text },
                      ]}
                    >
                      {service.name}
                    </Text>
                    <View style={styles.serviceMetaRow}>
                      <Clock size={12} color={theme.colors.textSecondary} />
                      <Text
                        style={[
                          styles.serviceMetaText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {service.time} min
                      </Text>
                    </View>
                  </View>
                  <View style={styles.serviceRight}>
                    <Text
                      style={[
                        styles.servicePriceTag,
                        { color: theme.colors.primary },
                      ]}
                    >
                      ₹{service.price}
                    </Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        removeService(service.id);
                      }}
                      style={styles.miniDeleteBtn}
                    >
                      <Trash size={16} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </ScalePress>
            ))}

            {services.length === 0 && (
              <View
                style={[
                  styles.emptyStateContainer,
                  { borderColor: theme.colors.border, borderStyle: "dashed" },
                ]}
              >
                <Scissors
                  size={32}
                  color={theme.colors.textSecondary}
                  style={{ opacity: 0.5 }}
                />
                <Text
                  style={[
                    styles.emptyStateText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  No services added yet
                </Text>
                <Text
                  style={[
                    styles.emptyStateSub,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Add services like Haircut, Shave etc.
                </Text>
              </View>
            )}
          </View>



          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Save Button */}
      <View
        style={[
          styles.floatingFooter,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ScalePress
          onPress={handleSave}
          disabled={loading}
          style={{ width: "100%" }}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={[styles.saveButton, loading && { opacity: 0.8 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator
                  color="#fff"
                  size="small"
                  style={{ marginRight: 10 }}
                />
                <Text style={[styles.saveButtonText, { color: "#fff" }]}>
                  Saving...
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.saveButtonText, { color: "#fff" }]}>
                  {barberCard ? "Save Changes" : "Publish Profile"}
                </Text>
                <ArrowLeft
                  size={20}
                  color="#fff"
                  style={{ transform: [{ rotate: "180deg" }] }}
                />
              </>
            )}
          </LinearGradient>
        </ScalePress>
      </View>

      {/* --- MODALS --- */}

      {/* 1. Android/Fallback Prompt Modal */}
      <Modal
        visible={promptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPromptVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.colors.card,
                height: "auto",
                paddingBottom: 30,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.colors.text, marginTop: 10 },
              ]}
            >
              {promptConfig.title}
            </Text>
            <TextInput
              style={[
                styles.modernInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  marginTop: 15,
                },
              ]}
              placeholder={promptConfig.placeholder}
              placeholderTextColor={theme.colors.textSecondary}
              value={promptConfig.value}
              onChangeText={(t) =>
                setPromptConfig((prev) => ({ ...prev, value: t }))
              }
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <ScalePress
                style={[
                  styles.outlineBtn,
                  { borderColor: theme.colors.border },
                ]}
                onPress={() => setPromptVisible(false)}
              >
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </ScalePress>
              <ScalePress
                style={[
                  styles.fillBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {
                  if (promptConfig.callback)
                    promptConfig.callback(promptConfig.value);
                  setPromptVisible(false);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>OK</Text>
              </ScalePress>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.colors.card,
                height: "auto",
                paddingBottom: 40,
              },
            ]}
          >
            <View style={{ alignItems: "center", marginVertical: 10 }}>
              <View
                style={{
                  backgroundColor: "#FFEBEE",
                  padding: 15,
                  borderRadius: 50,
                  marginBottom: 15,
                }}
              >
                <Trash size={30} color="#FF4757" />
              </View>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Delete Card?
              </Text>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  textAlign: "center",
                  marginTop: 5,
                  paddingHorizontal: 20,
                }}
              >
                This action cannot be undone. You will lose all reviews and
                bookings associated with this card.
              </Text>
            </View>
            <View style={styles.modalBtnRow}>
              <ScalePress
                style={[
                  styles.outlineBtn,
                  { borderColor: theme.colors.border },
                ]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </ScalePress>
              <ScalePress
                style={[styles.fillBtn, { backgroundColor: "#FF4757" }]}
                onPress={handleDeleteBarberCard}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Delete
                </Text>
              </ScalePress>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Service Editor Modal */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowServiceModal(false);
          setEditingService(null);
          setServicePrice("");
          setServiceTime("");
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalSheet,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {editingService ? "Edit Service" : "Add New Service"}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowServiceModal(false)}
                  style={styles.closeBtn}
                >
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontWeight: "600",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>

              {editingService ? (
                // EDIT MODE
                <View style={styles.formContent}>
                  <View
                    style={[
                      styles.serviceHeaderPreview,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.editServiceName,
                        { color: theme.colors.text },
                      ]}
                    >
                      {editingService.name}
                    </Text>
                  </View>

                  <View style={styles.inputRow}>
                    <View style={styles.inputWrapper}>
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Price (₹)
                      </Text>
                      <TextInput
                        style={[
                          styles.modernInput,
                          {
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.background,
                          },
                        ]}
                        value={servicePrice}
                        onChangeText={setServicePrice}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.textSecondary}
                      />
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Duration (min)
                      </Text>
                      <TextInput
                        style={[
                          styles.modernInput,
                          {
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.background,
                          },
                        ]}
                        value={serviceTime}
                        onChangeText={setServiceTime}
                        placeholder="30"
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.textSecondary}
                      />
                    </View>
                  </View>

                  <ScalePress
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.colors.primary, marginTop: 20 },
                    ]}
                    onPress={() => {
                      if (!servicePrice.trim() || !serviceTime.trim()) {
                        showToast("Please fill all fields", "error");
                        return;
                      }
                      const updatedServices = services.map((s) =>
                        s.id === editingService.id
                          ? { ...s, price: servicePrice, time: serviceTime }
                          : s
                      );
                      setServices(updatedServices);
                      setShowServiceModal(false);
                      setEditingService(null);
                      setServicePrice("");
                      setServiceTime("");
                      showToast("Service updated", "success");
                    }}
                  >
                    <Text style={styles.actionButtonText}>Update Service</Text>
                  </ScalePress>
                </View>
              ) : selectedServiceForAdding ? (
                // ADD DETAILS MODE
                <View style={styles.formContent}>
                  <View
                    style={[
                      styles.serviceHeaderPreview,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.editServiceName,
                        { color: theme.colors.text },
                      ]}
                    >
                      {selectedServiceForAdding.name}
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      {selectedServiceForAdding.category}
                    </Text>
                  </View>

                  <View style={styles.inputRow}>
                    <View style={styles.inputWrapper}>
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Price (₹)
                      </Text>
                      <TextInput
                        style={[
                          styles.modernInput,
                          {
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.background,
                          },
                        ]}
                        value={servicePrice}
                        onChangeText={setServicePrice}
                        placeholder="e.g 250"
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.textSecondary}
                        autoFocus
                      />
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Duration (min)
                      </Text>
                      <TextInput
                        style={[
                          styles.modernInput,
                          {
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.background,
                          },
                        ]}
                        value={serviceTime}
                        onChangeText={setServiceTime}
                        placeholder="e.g 30"
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.textSecondary}
                      />
                    </View>
                  </View>

                  <View style={styles.modalBtnRow}>
                    <ScalePress
                      style={[
                        styles.outlineBtn,
                        { borderColor: theme.colors.border },
                      ]}
                      onPress={() => {
                        setSelectedServiceForAdding(null);
                        setServicePrice("");
                        setServiceTime("");
                      }}
                    >
                      <Text style={{ color: theme.colors.text }}>Back</Text>
                    </ScalePress>
                    <ScalePress
                      style={[
                        styles.fillBtn,
                        { backgroundColor: theme.colors.primary },
                      ]}
                      onPress={() => {
                        if (!servicePrice.trim() || !serviceTime.trim()) {
                          showToast("Price and Time are required", "error");
                          return;
                        }
                        const newService = {
                          id: Date.now().toString(),
                          serviceId: selectedServiceForAdding._id,
                          name: selectedServiceForAdding.name,
                          price: servicePrice.trim(),
                          time: serviceTime.trim(),
                        };
                        setServices([...services, newService]);
                        setSelectedServiceForAdding(null);
                        setServicePrice("");
                        setServiceTime("");
                        showToast("Service added successfully", "success");
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        Add Service
                      </Text>
                    </ScalePress>
                  </View>
                </View>
              ) : (
                // SELECTION MODE
                <FlatList
                  data={availableServices.filter(
                    (service) =>
                      !services.some((s) => s.serviceId === service._id)
                  )}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <ScalePress
                      onPress={() => {
                        setSelectedServiceForAdding(item);
                        setServicePrice("300");
                        setServiceTime("30");
                      }}
                    >
                      <View
                        style={[
                          styles.serviceOptionItem,
                          { borderBottomColor: theme.colors.border },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.serviceOptionTitle,
                              { color: theme.colors.text },
                            ]}
                          >
                            {item.name}
                          </Text>
                          <Text
                            style={[
                              styles.serviceOptionDesc,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {item.description}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.addCircle,
                            { backgroundColor: theme.colors.primary },
                          ]}
                        >
                          <Plus size={16} color="#fff" />
                        </View>
                      </View>
                    </ScalePress>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <CheckCircle size={40} color={theme.colors.primary} />
                      <Text
                        style={[
                          styles.emptyStateText,
                          { color: theme.colors.text, marginTop: 15 },
                        ]}
                      >
                        All services added!
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    zIndex: 10,
    // Android Padding handled inline via STATUSBAR_HEIGHT
  },
  // --- TOAST STYLES ---
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  toastIcon: {
    marginRight: 12,
  },
  toastText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
  },

  // --- EXISTING STYLES (Refined) ---
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 120, // Space for floating footer
  },
  previewLabelContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // --- BARBER CARD STYLES ---
  barberCard: { borderRadius: 24, marginBottom: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, borderWidth: 1, marginHorizontal: 20, marginTop: 15 },

  // Card Image Area
  cardImageContainer: { height: 180, width: "100%", overflow: 'hidden', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  cardImage: { width: "100%", height: "100%", justifyContent: 'space-between' },
  gradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(0,0,0,0.5)' },

  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  glassBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity: 0.1, shadowRadius: 4 },
  ratingBadgeText: { fontSize: 12, fontWeight: '800', color: '#000' },

  cardBottomInfo: { padding: 12, flexDirection: 'row', alignItems: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#fff', shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity: 0.1, shadowRadius: 4 },
  liveDotWrapper: { width: 8, height: 8, marginRight: 4, justifyContent: 'center', alignItems: 'center' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00C853' },
  statusText: { color: '#000', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // --- CARD BODY CONTENT ---
  cardBody: { padding: 16, paddingTop: 14 },

  // Header Row
  cardHeaderCol: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8 },
  barberName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, lineHeight: 26 },
  shopName: { fontSize: 15, fontWeight: '500' },

  // NEW: Meta Row (Time, Services, Reviews)
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 10 },

  // Footer Actions
  cardFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  capacityContainer: { flex: 1, marginRight: 16, paddingBottom: 2 },
  capacityBarTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  capacityBarFill: { height: '100%', borderRadius: 2 },
  capacityText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  bookButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 14, shadowOpacity: 0.3, shadowOffset: {width:0, height:3}, shadowRadius: 6, elevation: 3 },
  bookButtonText: { fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },

  // --- SECTION STYLES ---
  sectionContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },

  // --- INFO ROW STYLES ---
  infoRowWrapper: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  editIconContainer: {
    padding: 8,
    borderRadius: 20,
  },

  // --- APPOINTMENT SETTINGS STYLES ---
  inputSection: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 12, letterSpacing: 1, opacity: 0.6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 16,
    paddingHorizontal: 20, height: 68,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  input: { flex: 1, fontSize: 24, fontWeight: '700', height: '100%' },

  // --- SERVICE ITEM STYLES ---
  serviceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4, // Accent flair
    borderLeftColor: "#4CAF50", // Success green or theme primary
  },
  serviceLeft: {
    flex: 1,
  },
  serviceCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  serviceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceMetaText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  serviceRight: {
    alignItems: "flex-end",
  },
  servicePriceTag: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  miniDeleteBtn: {
    padding: 6,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    borderRadius: 16,
    borderWidth: 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  emptyStateSub: {
    fontSize: 13,
    marginTop: 4,
  },

  // --- SPECIALTIES STYLES ---
  specialtiesWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  specialtyChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
  },
  specialtyLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  removeChipIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  // --- DELETE BUTTON ---
  deleteContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  deleteContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFEBEE",
    borderRadius: 20,
  },
  deleteText: {
    color: "#FF4757",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 13,
  },

  // --- FLOATING FOOTER ---
  floatingFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 20,
  },
  saveButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginRight: 8,
  },

  // --- MODAL SHEET STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 40,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E0E0E0",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 5,
  },
  formContent: {
    paddingBottom: 20,
  },
  serviceHeaderPreview: {
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  editServiceName: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputWrapper: {
    flex: 0.48,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "600",
    marginLeft: 4,
  },
  modernInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  outlineBtn: {
    flex: 0.3,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    marginRight: 10,
  },
  fillBtn: {
    flex: 0.7,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  // --- SERVICE LIST IN MODAL ---
  serviceOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  serviceOptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  serviceOptionDesc: {
    fontSize: 12,
  },
  addCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
});

export default CreateBarberCardScreen;
