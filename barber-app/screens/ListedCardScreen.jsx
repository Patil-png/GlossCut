import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
  Modal,
  Easing,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import {
  Star,
  Clock,
  MapPin,
  ArrowLeft,
  Store,
  Phone,
  Plus,
  Trash,
  Tag,
  Megaphone,
  CreditCard,
  ChevronRight,
  Navigation,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Info,
  Hash,
} from "lucide-react-native";
import * as Location from "expo-location";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import MapView from "react-native-maps";

const { width } = Dimensions.get("window");
const STATUSBAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight : 44;

// --- 1. PREMIUM MACRO-COMPONENTS ---

/**
 * Animated Toast Notification (Like Zomato/Uber)
 */
const Toast = ({ visible, message, type, theme }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }).start();
    }
  }, [visible]);

  let bg = theme.colors.card;
  let icon = <Info size={20} color={theme.colors.text} />;
  let textColor = theme.colors.text;

  if (type === "success") {
    bg = "#E8F5E9"; // Soft Green
    icon = <CheckCircle size={20} color="#2E7D32" />;
    textColor = "#1B5E20";
  } else if (type === "error") {
    bg = "#FFEBEE"; // Soft Red
    icon = <AlertCircle size={20} color="#C62828" />;
    textColor = "#B71C1C";
  }

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY }], backgroundColor: bg },
      ]}
    >
      {icon}
      <Text style={[styles.toastText, { color: textColor }]}>{message}</Text>
    </Animated.View>
  );
};

/**
 * Premium Confirmation Modal (Like iOS/Airbnb)
 */
const CustomConfirmModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  theme,
  confirmText = "Delete",
  isDestructive = true,
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
        >
          <View
            style={[
              styles.modalIconBubble,
              { backgroundColor: isDestructive ? "#FFEBEE" : "#E3F2FD" },
            ]}
          >
            {isDestructive ? (
              <Trash size={24} color="#D32F2F" />
            ) : (
              <Info size={24} color="#1976D2" />
            )}
          </View>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text
            style={[styles.modalMessage, { color: theme.colors.textSecondary }]}
          >
            {message}
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={onCancel}>
              <Text
                style={[
                  styles.modalBtnText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalBtnConfirm,
                {
                  backgroundColor: isDestructive
                    ? "#D32F2F"
                    : theme.colors.primary,
                },
              ]}
              onPress={onConfirm}
            >
              <Text
                style={[
                  styles.modalBtnText,
                  { color: "#fff", fontWeight: "bold" },
                ]}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- 2. LAYOUT COMPONENTS ---

const ModernHeader = ({ title, onBack, theme }) => (
  <View
    style={[
      styles.modernHeader,
      {
        paddingTop: STATUSBAR_HEIGHT + 10,
        backgroundColor: theme.colors.background,
      },
    ]}
  >
    <TouchableOpacity
      onPress={onBack}
      style={[
        styles.iconButton,
        { backgroundColor: theme.colors.card, shadowColor: theme.colors.text },
      ]}
    >
      <ArrowLeft size={20} color={theme.colors.text} />
    </TouchableOpacity>
    <Text style={[styles.modernHeaderTitle, { color: theme.colors.text }]}>
      {title}
    </Text>
    <View style={{ width: 40 }} />
  </View>
);

const SectionHeader = ({ title, theme }) => (
  <View style={styles.sectionHeaderContainer}>
    <Text style={[styles.sectionHeaderTitle, { color: theme.colors.text }]}>
      {title}
    </Text>
    <View
      style={[
        styles.sectionHeaderLine,
        { backgroundColor: theme.colors.border },
      ]}
    />
  </View>
);

const InfoRow = ({
  icon: Icon,
  label,
  value,
  theme,
  onPress,
  canEdit = true,
  isLast,
}) => (
  <TouchableOpacity
    style={[
      styles.modernInfoRow,
      !isLast && {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border + "20",
      },
    ]}
    onPress={canEdit ? onPress : undefined}
    activeOpacity={canEdit ? 0.6 : 1}
  >
    <View
      style={[
        styles.iconContainer,
        { backgroundColor: theme.colors.primary + "15" },
      ]}
    >
      <Icon size={20} color={theme.colors.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[styles.infoValue, { color: theme.colors.text }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {!canEdit && (
        <View style={styles.ownerTag}>
          <Text style={styles.ownerTagText}>Admin</Text>
        </View>
      )}
    </View>
    {canEdit && (
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ChevronRight size={16} color={theme.colors.textSecondary} />
      </View>
    )}
  </TouchableOpacity>
);

// --- 3. BARBER CARD PREVIEW COMPONENT (matching CreateBarberCardScreen) ---

const BarberCardPreview = ({ barberData, theme }) => {
  const fullness = 50; // Default fullness for preview
  const capacityText = fullness > 90 ? "Almost Full" : "5 slots left";

  return (
    <View style={[styles.barberCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.imageContainer}>
        {barberData.image ? (
          <Image
            source={barberData.image}
            style={styles.barberImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.barberImage,
              styles.imagePlaceholder,
              { backgroundColor: theme.colors.border },
            ]}
          >
            <Text
              style={[
                styles.barberInitialLarge,
                { color: theme.colors.textSecondary },
              ]}
            >
              {barberData.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
        <View style={styles.imageOverlay} />
        <View style={styles.cardHeaderOverlay}>
          <View style={styles.ratingPill}>
            <Text style={styles.ratingText}>
              {barberData.rating?.toFixed(1) || "New"}
            </Text>
            <Star
              size={10}
              color="#fff"
              fill="#fff"
              style={{ marginLeft: 2 }}
            />
          </View>
          {!barberData.isAvailable ? (
            <View style={styles.offlinePill}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>Closed</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.glassLikeButton}>
              <Text style={{ color: "#fff", fontSize: 12 }}>★</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.cardBottomOverlay}>
          <Text style={styles.categoryTag} numberOfLines={1}>
            {barberData.tag || barberData.category || "General"}
          </Text>
          <Text style={styles.imageDistanceText}>
            <Text style={{ color: "#fff", fontSize: 10 }}>📍</Text> Nearby
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.barberName, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {barberData.name || "Barber Name"}
          </Text>
          <View style={styles.trendingBadge}>
            <Text style={{ color: "#FF5722", fontSize: 10 }}>⚡</Text>
            <Text style={styles.trendingText}>Popular</Text>
          </View>
        </View>
        <Text style={styles.fullAddressText} numberOfLines={1}>
          {barberData.address || "Shop Address"}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Clock size={14} color={theme.colors.textSecondary} />
            <Text style={styles.statText}>
              {barberData.avgAppointmentTime || "30 min"}
            </Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statText}>
              {barberData.reviews || 0} Reviews
            </Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statText}>
              {barberData.totalServices || 0} Services
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// --- 4. MAIN SCREEN COMPONENT ---

const ListedCardScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // Data State
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI States
  const [region, setRegion] = useState(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  // Interaction States
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [networkError, setNetworkError] = useState(false);

  // Helper to show Toast
  const showToast = (message, type = "info") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  const fetchShopData = async () => {
    setLoading(true);
    setNetworkError(false);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // Fetch shop data
      const shopRes = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/shop/my-shop`,
        {
          headers: { "x-auth-token": token },
          timeout: 15000,
        }
      );

      const shopData = shopRes.data;

      // Fetch barber cards for the shop
      let barbersData = [];
      try {
        const barberCardsRes = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/shop/${shopData._id}`,
          {
            headers: { "x-auth-token": token },
            timeout: 15000,
          }
        );
        barbersData = barberCardsRes.data || [];

        // Fetch customers served count for each barber
        for (let barber of barbersData) {
          try {
            const earningsRes = await axios.get(
              `${process.env.EXPO_PUBLIC_API_URL}/api/earnings?filter=lifetime`,
              {
                headers: { "x-auth-token": token },
                timeout: 10000,
              }
            );
            barber.customersServed = earningsRes.data.totalCustomers || 0;
          } catch (earningsErr) {
            console.log(`Could not fetch earnings for barber ${barber.name}`);
            barber.customersServed = 0;
          }
        }
      } catch (barberErr) {
        console.log("No barber cards found for shop, using fallback data");
        // Fallback to constructed data if no barber cards exist
        if (shopData.owner) {
          barbersData.push({
            id: shopData.owner._id || shopData.owner.id || "owner_id",
            _id: shopData.owner._id || shopData.owner.id || "owner_id",
            name: shopData.owner.name,
            profilePicture: shopData.owner.profilePicture,
            rating: shopData.owner.rating || 0,
            avgAppointmentTime: shopData.avgAppointmentTime || "30 min",
            specialties: shopData.owner.specialties || [
              shopData.tag || "General",
            ],
            isAvailable: shopData.owner.isAvailable ?? true,
            services:
              shopData.services?.filter(
                (service) => service.barberId === shopData.owner._id
              ) || [],
            address: shopData.address,
            tag: shopData.owner.specialties?.[0] || shopData.tag || "General",
            category: shopData.category || "Barber",
            customersServed: 0, // Will be updated if earnings API is available
          });
        }

        if (shopData.staff && Array.isArray(shopData.staff)) {
          shopData.staff.forEach((staff, index) => {
            barbersData.push({
              id: staff._id || staff.id || `staff_${index}`,
              _id: staff._id || staff.id || `staff_${index}`,
              name: staff.name,
              profilePicture: staff.profilePicture,
              rating: staff.rating || 0,
              avgAppointmentTime: "30 min",
              specialties: staff.specialties || [shopData.tag || "General"],
              isAvailable: staff.isAvailable ?? true,
              services:
                shopData.services?.filter(
                  (service) => service.barberId === staff._id
                ) || [],
              address: shopData.address,
              tag: staff.specialties?.[0] || shopData.tag || "General",
              category: shopData.category || "Barber",
              customersServed: 0, // Will be updated if earnings API is available
            });
          });
        }

        if (barbersData.length === 0 && user) {
          barbersData = [
            {
              id: user._id || "user_fallback",
              _id: user._id || "user_fallback",
              name: user.name,
              profilePicture: user.profilePicture,
              rating: user.rating || 0,
              avgAppointmentTime: user.avgAppointmentTime || "30 min",
              specialties: user.specialties || [user.tag || "General"],
              isAvailable: user.isAvailable ?? true,
              services: shopData.services || [],
              address: shopData.address,
              tag: user.specialties?.[0] || user.tag || "General",
              category: shopData.category || "Barber",
              customersServed: 0, // Will be updated if earnings API is available
            },
          ];
        }
      }

      const combinedData = {
        ...shopData,
        barbers: barbersData,
        isMainOwner: shopData.isMainOwner,
      };

      setShopData(combinedData);
      setLocationConfirmed(!!shopData?.location?.coordinates);
    } catch (err) {
      console.log("Fetch Error:", err.message);
      setNetworkError(true);
      showToast("Connection failed. Please check internet.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-refresh when screen comes into focus
    const focusListener = navigation.addListener("focus", fetchShopData);
    return focusListener;
  }, [navigation, user]);

  const handleUpdateCategory = async (newCategory) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/api/shop/category`,
        { category: newCategory },
        { headers: { "x-auth-token": token } }
      );
      fetchShopData();
      showToast("Category updated successfully", "success");
    } catch (err) {
      showToast("Failed to update category", "error");
    }
  };

  // Trigger Custom Modal
  const handleDeleteRequest = (barber) => {
    setConfirmModal({
      visible: true,
      title: "Remove Listing?",
      message: `Are you sure you want to remove ${barber.name}'s card? This action cannot be undone immediately.`,
      onConfirm: () => performDelete(barber),
    });
  };

  const performDelete = async (barber) => {
    setConfirmModal({ ...confirmModal, visible: false });
    try {
      const token = await AsyncStorage.getItem("token");
      if (barber._id === shopData.owner._id) {
        const res = await axios.delete(
          `${process.env.EXPO_PUBLIC_API_URL}/api/shop`,
          {
            headers: { "x-auth-token": token },
          }
        );
        if (res.status === 200) {
          showToast("Shop deleted successfully", "success");
          navigation.goBack();
        }
      } else {
        const res = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/request-delete`,
          {
            reason: "Barber card deletion requested by shop owner",
          },
          {
            headers: { "x-auth-token": token },
          }
        );
        if (res.status === 200) {
          showToast("Request sent to admin for approval", "success");
          fetchShopData();
        }
      }
    } catch (err) {
      showToast(
        err.response?.data?.msg || "Failed to request deletion",
        "error"
      );
    }
  };

  const handlePinLocation = async () => {
    try {
      if (shopData?.location?.coordinates) {
        setRegion({
          latitude: shopData.location.coordinates[1],
          longitude: shopData.location.coordinates[0],
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          showToast("Location permission denied", "error");
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    } catch (e) {
      showToast("Error accessing maps", "error");
    }
  };

  const handleConfirmLocation = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/api/shop`,
        {
          location: {
            type: "Point",
            coordinates: [region.longitude, region.latitude],
          },
        },
        { headers: { "x-auth-token": token } }
      );

      showToast("Location pinned successfully!", "success");
      setRegion(null);
      setLocationConfirmed(true);
      fetchShopData();
    } catch (err) {
      showToast("Failed to update location", "error");
    }
  };

  // --- RENDERING ---

  // 1. Loading State
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={{
            marginTop: 15,
            fontSize: 16,
            fontWeight: "500",
            color: theme.colors.textSecondary,
          }}
        >
          Loading Dashboard...
        </Text>
      </View>
    );
  }

  // 2. Network Error State
  if (networkError && !shopData) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 30,
          },
        ]}
      >
        <View style={styles.errorIconBubble}>
          <WifiOff size={40} color="#757575" />
        </View>
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
          No Internet Connection
        </Text>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          We couldn't reach the server. Please check your connection and try
          again.
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={fetchShopData}
        >
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          theme={theme}
        />
      </View>
    );
  }

  // 3. Map View State
  if (region) {
    return (
      <View style={styles.container}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
        />
        <SafeAreaView style={styles.mapOverlay}>
          <TouchableOpacity
            onPress={() => setRegion(null)}
            style={styles.mapBackButton}
          >
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.markerFixed}>
          <View style={styles.markerCircle}>
            <MapPin
              size={40}
              color={theme.colors.primary}
              fill={theme.colors.primary}
            />
          </View>
          <View style={styles.markerStem} />
        </View>
        <View style={styles.locationActionPanel}>
          <Text style={styles.dragText}>Move the map to place the pin</Text>
          <TouchableOpacity
            style={[
              styles.confirmLocationButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleConfirmLocation}
            disabled={loading}
          >
            <Text style={styles.confirmLocationButtonText}>
              Confirm Location
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toastWrapper}>
          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            theme={theme}
          />
        </View>
      </View>
    );
  }

  // 4. Main Dashboard State
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Toast Overlay */}
      <View style={styles.toastWrapper}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          theme={theme}
        />
      </View>

      {/* Modal Overlay */}
      <CustomConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
        theme={theme}
      />

      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.colors.background, theme.colors.card + "80"]}
        style={StyleSheet.absoluteFill}
      />

      <ModernHeader
        title="Shop Profile"
        onBack={() => navigation.goBack()}
        theme={theme}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Staff View: Call to Action */}
        {!shopData?.isMainOwner && (
          <View
            style={[
              styles.promoContainer,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <View style={styles.promoContent}>
              <Text style={[styles.promoTitle, { color: theme.colors.text }]}>
                Start Earning
              </Text>
              <Text
                style={[
                  styles.promoText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Create your personal digital card. Customers can book you
                directly.
              </Text>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => navigation.navigate("CreateBarberCard")}
              >
                <Plus size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Create My Card</Text>
              </TouchableOpacity>
            </View>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/3209/3209265.png",
              }}
              style={styles.promoImage}
            />
          </View>
        )}

        {/* Owner View: Barber Cards */}
        {shopData?.isMainOwner && (
          <>
            <SectionHeader title="Your Listings" theme={theme} />

            {shopData?.barbers && shopData.barbers.length > 0 ? (
              shopData.barbers.map((barber, index) => (
                <BarberCardPreview
                  key={barber.id || barber._id || `barber-${index}`}
                  barberData={{
                    name: barber.name,
                    address: barber.address || shopData?.address,
                    image: barber.image
                      ? { uri: barber.image }
                      : barber.profilePicture
                      ? { uri: barber.profilePicture }
                      : null,
                    rating: barber.rating || barber.avgRating || 0,
                    reviews: barber.reviewCount || barber.reviews || 0,
                    avgAppointmentTime: barber.avgAppointmentTime,
                    totalServices:
                      barber.totalServices || barber.services?.length || 0,
                    isAvailable: barber.isAvailable,
                    tag: barber.tag || barber.specialties?.[0] || "General",
                    category: barber.category || "Barber",
                  }}
                  theme={theme}
                />
              ))
            ) : (
              <View
                style={[
                  styles.emptyStateContainer,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <Text
                  style={[
                    styles.emptyStateText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  No barbers found.
                </Text>
              </View>
            )}

            {/* Shop Details Section */}
            <SectionHeader title="Shop Profile" theme={theme} />
            <View
              style={[
                styles.detailsIsland,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <InfoRow
                icon={Store}
                label="Shop Name"
                value={shopData?.name}
                theme={theme}
                onPress={() =>
                  navigation.navigate("EditShopName", {
                    currentName: shopData?.name,
                  })
                }
                canEdit={shopData?.isMainOwner}
              />
              <InfoRow
                icon={MapPin}
                label="Address"
                value={shopData?.address}
                theme={theme}
                onPress={() =>
                  navigation.navigate("EditShopAddress", {
                    currentAddress: shopData?.address,
                  })
                }
                canEdit={shopData?.isMainOwner}
              />
              <InfoRow
                icon={Phone}
                label="Contact Number"
                value={shopData?.phone}
                theme={theme}
                onPress={() =>
                  navigation.navigate("EditShopPhone", {
                    currentPhone: shopData?.phone,
                  })
                }
                canEdit={shopData?.isMainOwner}
              />
              <InfoRow
                icon={Tag}
                label="Category"
                value={shopData?.category}
                theme={theme}
                onPress={() =>
                  navigation.navigate("EditCategory", {
                    currentCategory: shopData?.category,
                  })
                }
                canEdit={shopData?.isMainOwner}
              />
              <InfoRow
                icon={Clock}
                label="Operating Hours"
                value="Configure Timing"
                theme={theme}
                onPress={() =>
                  navigation.navigate("EditOperatingHours", {
                    currentOperatingHours: shopData?.operatingHours,
                  })
                }
                canEdit={shopData?.isMainOwner}
              />
              <InfoRow
                icon={CreditCard}
                label="UPI Payment ID"
                value={shopData?.upiId || "Not Set"}
                theme={theme}
                onPress={() =>
                  navigation.navigate("EditUpi", {
                    currentUpiId: shopData?.upiId,
                  })
                }
                canEdit={shopData?.isMainOwner}
                isLast
              />
            </View>

            {/* Promotions Section */}
            <SectionHeader title="Growth & Ads" theme={theme} />
            <View
              style={[
                styles.detailsIsland,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <InfoRow
                icon={Tag}
                label="Current Plan"
                value={shopData?.listingTier || "Basic Plan"}
                theme={theme}
                onPress={() => {
                  let listingTierScreenName = "ListingTier";
                  if (shopData?.category === "Women's Salon")
                    listingTierScreenName = "WomenSalonListingTier";
                  else if (shopData?.category === "Pet Care")
                    listingTierScreenName = "PetCareListingTier";
                  navigation.navigate(listingTierScreenName);
                }}
              />
              <InfoRow
                icon={Megaphone}
                label="Boost Visibility"
                value="Create Ad Campaign"
                theme={theme}
                onPress={() => navigation.navigate("AdPlacementBooking")}
                isLast
              />
            </View>

            {/* Location Settings */}
            <SectionHeader title="Location Settings" theme={theme} />
            <View
              style={[
                styles.locationWidget,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <View style={styles.locationWidgetHeader}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.locWidgetTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    Map Pin
                  </Text>
                  <Text
                    style={[
                      styles.locWidgetSubtitle,
                      {
                        color: shopData?.location?.coordinates
                          ? "#4CAF50"
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {shopData?.location?.coordinates
                      ? "● Active on Search"
                      : "○ Not Pinned Yet"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.locIconBg,
                    { backgroundColor: theme.colors.primary + "15" },
                  ]}
                >
                  <Navigation size={22} color={theme.colors.primary} />
                </View>
              </View>

              {shopData?.location?.coordinates && (
                <View style={styles.coordBox}>
                  <Text
                    style={[
                      styles.coordText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    LAT: {shopData.location.coordinates[1]?.toFixed(5)} LONG:{" "}
                    {shopData.location.coordinates[0]?.toFixed(5)}
                  </Text>
                </View>
              )}

              <View style={styles.locationActions}>
                <TouchableOpacity
                  style={[
                    styles.smallActionBtn,
                    { borderColor: theme.colors.border },
                  ]}
                  // Removed 'onSave' to fix Serializable Warning
                  onPress={() =>
                    navigation.navigate("ManualLocationInput", {
                      currentLocation: shopData?.location,
                    })
                  }
                >
                  <Hash
                    size={16}
                    color={theme.colors.textSecondary}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.smallActionText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Manual
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filledActionBtn,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={handlePinLocation}
                >
                  <MapPin size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.filledActionText}>
                    {shopData?.location?.coordinates ? "Update Pin" : "Set Pin"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  // --- Toast Overlay ---
  toastWrapper: {
    position: "absolute",
    top: STATUSBAR_HEIGHT + 10,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50, // Pill shape
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  // --- Header ---
  modernHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modernHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  // --- Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  // --- Error State ---
  errorIconBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  // --- Headers & Sections ---
  sectionHeaderContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.8,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  // --- Barber Cards ---
  barberCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    overflow: "hidden",
    marginHorizontal: 20,
    marginTop: 20,
  },
  imageContainer: {
    height: 180,
    width: "100%",
    position: "relative",
  },
  barberImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "rgba(0,0,0,0.4)",
    opacity: 0.6,
  },
  cardHeaderOverlay: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#262626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  glassLikeButton: {
    backgroundColor: "rgba(255,255,255,0.9)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  offlinePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff4757",
    marginRight: 6,
  },
  offlineText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  cardBottomOverlay: {
    position: "absolute",
    bottom: 12,
    left: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
    marginRight: 10,
  },
  imageDistanceText: {
    color: "#f0f0f0",
    fontSize: 12,
    fontWeight: "500",
  },
  cardContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  barberName: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  trendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0E6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  trendingText: {
    fontSize: 10,
    color: "#FF5722",
    fontWeight: "700",
    marginLeft: 2,
  },
  fullAddressText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  verticalDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#ddd",
    marginHorizontal: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  capacityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressBarBg: {
    width: 60,
    height: 4,
    backgroundColor: "#eee",
    borderRadius: 2,
    marginRight: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  capacityText: {
    fontSize: 11,
    fontWeight: "600",
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#000000ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginRight: 4,
  },
  barberInitialLarge: {
    fontSize: 48,
    fontWeight: "bold",
  },
  emptyStateContainer: {
    marginHorizontal: 20,
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderStyle: "dashed",
  },
  emptyStateText: {
    fontSize: 15,
  },
  // --- Details List ---
  detailsIsland: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  modernInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  ownerTag: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#EEEEEE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownerTagText: {
    fontSize: 9,
    color: "#757575",
    fontWeight: "bold",
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  // --- Location Widget ---
  locationWidget: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  locationWidgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  locWidgetTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  locWidgetSubtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  locIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  coordBox: {
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  coordText: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  locationActions: {
    flexDirection: "row",
    gap: 12,
  },
  smallActionBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  smallActionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  filledActionBtn: {
    flex: 1.5,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  filledActionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  // --- Map Overlay ---
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    zIndex: 10,
  },
  mapBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    marginTop: STATUSBAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  markerFixed: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -40,
    alignItems: "center",
  },
  locationActionPanel: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  dragText: {
    fontSize: 13,
    color: "#757575",
    fontWeight: "500",
    marginBottom: 16,
  },
  confirmLocationButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmLocationButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // --- Promo/Staff ---
  promoContainer: {
    margin: 20,
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  promoContent: {
    flex: 1,
    paddingRight: 15,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  promoText: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
    opacity: 0.8,
  },
  promoImage: {
    width: 70,
    height: 70,
  },
  primaryButton: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});

export default ListedCardScreen;
