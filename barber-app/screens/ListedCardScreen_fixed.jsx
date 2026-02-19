import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
  Modal,
  Easing,
  Alert, // Added Alert
} from "react-native";
import { Image } from "expo-image";
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
  Camera,
  XCircle,
  Trash2, // Added Trash2
  Edit2, // Added Edit2
  Upload, // Added Upload
} from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import * as Location from "expo-location";
import * as SecureStore from 'expo-secure-store'; // Added SecureStore
import api, { API_URL } from "../utils/api"; // Added API_URL import
import { LinearGradient } from "expo-linear-gradient";
import LeafletMap from "../components/LeafletMap";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Added useSafeAreaInsets

const { width } = Dimensions.get("window");
const STATUSBAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight : 44;

// OPTIMIZATION #3: Static Constant (Created once in memory)
const BLURHASH = 'L5D]X]~q004n00~q009F00?b~qIV';
const GlossCutLogo = require('../assets/GlossCut.png');

// --- HELPER FUNCTIONS ---
const getProcessedImageUri = (imagePath, userProfilePic) => {
  if (!imagePath) return userProfilePic;
  if (imagePath.startsWith("http")) return imagePath;
  return `${process.env.EXPO_PUBLIC_API_URL}${imagePath}`;
};

// --- OPTIMIZATION #2: SKELETON LOADER COMPONENTS ---
// (Refactored to use StyleSheet)
const SkeletonItem = memo(({ width, height, borderRadius = 8, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#E1E9EE",
          opacity,
        },
        style,
      ]}
    />
  );
});

// Skeleton styles that don't depend on theme
const skeletonStyles = StyleSheet.create({
  skContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  skSpacer: {
    width: 40,
  },
  skSectionTitle: {
    marginBottom: 15,
  },
  skCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#eee',
  },
  skCardContent: {
    padding: 16,
  },
  skCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  skCardTextLine: {
    marginBottom: 15,
  },
  skStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skListContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  skListItem: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skSeparator: {
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  skListIcon: {
    marginRight: 16,
  },
  skListTextBottom: {
    marginBottom: 6,
  },
});

const DashboardSkeleton = memo(() => (
  <View style={skeletonStyles.skContainer}>
    {/* Header Skeleton */}
    <View style={skeletonStyles.skHeader}>
      <SkeletonItem width={40} height={40} borderRadius={20} />
      <SkeletonItem width={120} height={30} />
      <View style={skeletonStyles.skSpacer} />
    </View>

    {/* Section Title */}
    <SkeletonItem width={100} height={20} style={skeletonStyles.skSectionTitle} />
    {/* Shop Card Skeleton */}
    <View style={skeletonStyles.skCard}>
      <SkeletonItem width="100%" height={180} borderRadius={0} />
      <View style={skeletonStyles.skCardContent}>
        <View style={skeletonStyles.skCardRow}>
          <SkeletonItem width={150} height={24} />
          <SkeletonItem width={60} height={20} />
        </View>
        <SkeletonItem width={200} height={16} style={skeletonStyles.skCardTextLine} />
        <View style={skeletonStyles.skStatsRow}>
          <SkeletonItem width={80} height={40} />
          <SkeletonItem width={80} height={40} />
        </View>
      </View>
    </View>

    {/* Info Rows Skeleton */}
    <SkeletonItem width={120} height={20} style={skeletonStyles.skSectionTitle} />
    <View style={skeletonStyles.skListContainer}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[skeletonStyles.skListItem, i !== 4 && skeletonStyles.skSeparator]}>
          <SkeletonItem width={40} height={40} borderRadius={12} style={skeletonStyles.skListIcon} />
          <View>
            <SkeletonItem width={80} height={12} style={skeletonStyles.skListTextBottom} />
            <SkeletonItem width={150} height={16} />
          </View>
        </View>
      ))}
    </View>
  </View>
));

// --- 1. PREMIUM MACRO-COMPONENTS ---

const Toast = memo(({ visible, message, type, theme }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const styles = getStyles(theme);

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
});

const CustomConfirmModal = memo(({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  theme,
  confirmText = "Delete",
  isDestructive = true,
}) => {
  const styles = getStyles(theme);
  
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
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
          <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={onCancel}>
              <Text style={[styles.modalBtnText, { color: theme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalBtnConfirm,
                {
                  backgroundColor: isDestructive ? "#D32F2F" : theme.colors.primary,
                },
              ]}
              onPress={onConfirm}
            >
              <Text style={[styles.modalBtnText, { color: "#fff", fontWeight: "bold" }]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

// --- 2. LAYOUT COMPONENTS ---

const ModernHeader = memo(({ title, onBack, theme }) => {
  const styles = getStyles(theme);
  
  return (
    <View
      style={[
        styles.modernHeader,
        {
          paddingTop: Platform.OS === 'android' ? 45 : 15, // Increased for premium spacing
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
});

const SectionHeader = memo(({ title, theme }) => {
  const styles = getStyles(theme);
  
  return (
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
});

const InfoRow = memo(({
  icon: Icon,
  label,
  value,
  theme,
  onPress,
  canEdit = true,
  isLast,
}) => {
  const styles = getStyles(theme);
  
  return (
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
          { backgroundColor: theme.colors.iconBackground },
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
});

// --- 3. SHOP CARD PREVIEW COMPONENT ---
const ShopCardPreview = memo(({ shopData, theme }) => {
  const totalBarbers = 1 + (shopData?.staff?.length || 0);
  const avgRating = shopData?.rating && shopData.rating > 0 ? shopData.rating.toFixed(1) : "New";
  const styles = getStyles(theme);

  return (
    <View style={[styles.shopCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.shopImageContainer}>
        {shopData?.processedImage ? (
          <Image
            source={{ uri: shopData.processedImage }}
            style={styles.shopImage}
            contentFit="cover"
            transition={500}
            placeholder={BLURHASH}
            cachePolicy="disk"
          />
        ) : (
          <View
            style={[
              styles.shopImage,
              styles.imagePlaceholder,
              { backgroundColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.shopInitialLarge, { color: theme.colors.textSecondary }]}>
              {shopData?.name?.charAt(0)?.toUpperCase() || "S"}
            </Text>
          </View>
        )}
        <View style={styles.shopImageOverlay} />
        <View style={styles.shopHeaderOverlay}>
          <View style={[styles.shopRatingPill, { backgroundColor: avgRating > 0 ? '#FFD700' : '#666' }]}>
            <Star
              size={12}
              color={avgRating > 0 ? "#FF8C00" : "#fff"}
              fill={avgRating > 0 ? "#FF8C00" : "#fff"}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.shopRatingText, { color: avgRating > 0 ? '#000' : '#fff' }]}>
              {avgRating > 0 ? avgRating : "New"}
            </Text>
          </View>
        </View>
        <View style={styles.shopBottomOverlay}>
          <Text style={styles.shopCategoryTag} numberOfLines={1}>
            {shopData?.category || "Barber Shop"}
          </Text>
          <Text style={styles.shopLocationText}>
            <Text style={{ color: "#fff", fontSize: 10 }}>📍</Text> {shopData?.address?.split(',')[0] || 'Location'}
          </Text>
        </View>
      </View>

      <View style={styles.shopCardContent}>
        <View style={styles.shopTitleRow}>
          <Text
            style={[styles.shopName, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {shopData?.name || "Shop Name"}
          </Text>
          {(shopData?.selectedListingPlaces?.length > 0) && (
            <View style={styles.shopVerifiedBadge}>
              <CheckCircle size={10} color="#4CAF50" fill="#E8F5E9" />
              <Text style={styles.shopVerifiedText}>Verified</Text>
            </View>
          )}
        </View>
        <Text style={styles.shopFullAddressText} numberOfLines={1}>
          {shopData?.address || "Shop Address"}
        </Text>

        <View style={styles.shopStatsContainer}>
          <View style={styles.shopStatItem}>
            <Text style={[styles.shopStatValue, { color: theme.colors.primary }]}>
              {totalBarbers}
            </Text>
            <Text style={styles.shopStatLabel}>Barbers</Text>
          </View>
          <View style={styles.shopVerticalDivider} />
          <View style={styles.shopStatItem}>
            <Text style={[styles.shopStatValue, { color: theme.colors.primary }]}>
              {avgRating > 0 ? avgRating : "New"}
            </Text>
            <Text style={styles.shopStatLabel}>Rating</Text>
          </View>
        </View>
      </View>
    </View>
  );
});


// --- 4. MAIN SCREEN COMPONENT ---

const ListedCardScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // Ref to hold the AbortController so we can cancel requests
  const abortControllerRef = useRef(null);

  // Data State
  const [shopData, setShopData] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
    onConfirm: () => { },
  });
  const [networkError, setNetworkError] = useState(false);
  const [pendingStaff, setPendingStaff] = useState([]);

  // Fetch Pending Staff
  const fetchPendingStaff = useCallback(async () => {
    try {
      const res = await api.get('/api/shop/staff/pending');
      setPendingStaff(res.data);
    } catch (err) {
      console.log("Error fetching pending staff:", err);
    }
  }, []);

  // Handle Approve
  const handleApproveStaff = async (barberId) => {
    try {
      await api.put(`/api/shop/staff/approve/${barberId}`);
      showToast("Staff approved successfully", "success");
      fetchPendingStaff(); // Refresh list
    } catch (err) {
      showToast("Failed to approve staff", "error");
    }
  };

  // Handle Reject
  const handleRejectStaff = async (barberId) => {
    try {
      await api.put(`/api/shop/staff/reject/${barberId}`);
      showToast("Staff request rejected", "info");
      fetchPendingStaff(); // Refresh list
    } catch (err) {
      showToast("Failed to reject staff", "error");
    }
  };

  // Helper to show Toast
  const showToast = useCallback((message, type = "info") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  }, []);

  const fetchShopData = useCallback(async () => {
    setNetworkError(false);

    // OPTIMIZATION #2: AbortController Logic
    // Cancel any previous running request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Create new controller for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      const shopRes = await api.get(
        '/api/shop/my-shop',
        {
          timeout: 15000,
          signal: signal,
        }
      );

      const fetchedShopData = shopRes.data;
      fetchedShopData.processedImage = getProcessedImageUri(fetchedShopData.image, user?.profilePicture);

      setShopData(fetchedShopData);
      setLocationConfirmed(!!fetchedShopData?.location?.coordinates);

      if (fetchedShopData?.isMainOwner) {
        fetchPendingStaff();
      }
    } catch (err) {
      // Check if the error was due to us aborting it
      if (err.name === 'CanceledError') {
        console.log('Request canceled', err.message);
        return; // STOP execution here. Do not update state.
      }

      console.log("Fetch Error:", err.message);
      if (!shopData) {
        setNetworkError(true);
      } else {
        showToast("Sync failed. Showing cached data.", "error");
      }
    } finally {
      // Only update loading state if not canceled
      if (!signal.aborted) {
        setIsInitialLoad(false);
      }
    }
  }, [user, showToast, shopData, fetchPendingStaff]);

  useEffect(() => {
    const focusListener = navigation.addListener("focus", fetchShopData);

    // Cleanup on Unmount
    return () => {
      focusListener(); // Remove listener
      // Abort any pending requests when leaving the screen
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [navigation, fetchShopData]);

  // Trigger Custom Modal
  // Trigger Custom Modal
  const handleDeleteRequest = useCallback((barber) => {
    setConfirmModal({
      visible: true,
      title: "Remove Team Member?",
      message: `Are you sure you want to remove ${barber.name} from your team? This will submit a deletion request to the admin.`,
      onConfirm: () => performDelete(barber),
    });
  }, []);

  const performDelete = async (barber) => {
    setConfirmModal((prev) => ({ ...prev, visible: false }));
    try {
      const res = await api.post(
        '/api/barber-card/request-delete',
        {
          reason: "Barber card deletion requested by shop owner",
          targetBarberId: barber._id
        }
      );
      if (res.status === 200) {
        showToast("Request sent to admin for approval", "success");
        fetchShopData();
      }
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to request deletion", "error");
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
      await api.put(
        '/api/shop',
        {
          location: {
            type: "Point",
            coordinates: [region.longitude, region.latitude],
          },
        }
      );

      showToast("Location pinned successfully!", "success");
      setRegion(null);
      setLocationConfirmed(true);
      fetchShopData();
    } catch (err) {
      showToast("Failed to update location", "error");
    }
  };

  const handleImageUpload = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission Denied', 'Camera roll permissions are needed.', 'warning');
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        // const token = await AsyncStorage.getItem("token"); // Unused
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop();

        // Better MIME type handling
        let type = 'image/jpeg';
        if (filename.toLowerCase().endsWith('.png')) type = 'image/png';
        else if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) type = 'image/jpeg';
        else if (filename.toLowerCase().endsWith('.gif')) type = 'image/gif';
        else if (filename.toLowerCase().endsWith('.webp')) type = 'image/webp';

        const formData = new FormData();
        formData.append('shopImage', { uri: localUri, name: filename, type });

        // Use fetch instead of axios for reliable file uploads in RN
        const token = await SecureStore.getItemAsync('token');
        const uploadResponse = await fetch(`${API_URL}/api/shop/upload-image`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'x-auth-token': token,
            // 'Content-Type': 'multipart/form-data', // DO NOT SET THIS! Fetch sets it with boundary.
          },
          body: formData,
        });

        const data = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(data.msg || 'Upload failed');
        }

        if (data && data.imageUrl) {
          const imageUrl = getProcessedImageUri(data.imageUrl);
          setShopData(prevShop => prevShop ? { ...prevShop, image: imageUrl, processedImage: imageUrl } : null);

          // Update the shop record with the new image URL (this is a small JSON request, api.put is fine)
          const shopUpdateRes = await api.put('/api/shop', { image: imageUrl });

          if (shopUpdateRes.status === 200) {
            showToast('Success', 'Shop image updated! Pending approval.', 'success');
          } else {
            showToast('Warning', 'Image uploaded but DB update failed.', 'warning');
          }
        } else {
          showToast('Error', 'No image URL returned.', 'error');
        }
      } catch (error) {
        console.error("Upload error details:", error);
        if (error.code === "ERR_NETWORK") {
          showToast("Connection Error", "Please check your internet.", "network");
        } else {
          // Extract backend error message
          const msg = error.response?.data?.msg || error.message || 'Could not upload image.';
          showToast('Upload Failed', msg, 'error');
        }
      }
    }
  };

  // Get styles at the beginning of the component
  const styles = getStyles(theme);

  // --- RENDERING ---

  if (isInitialLoad && !shopData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.card + "80"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ height: STATUSBAR_HEIGHT }} />
        <DashboardSkeleton />
      </View>
    );
  }

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

  if (region) {
    return (
      <View style={styles.container}>
        <LeafletMap
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />
      <View style={styles.toastWrapper}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          theme={theme}
        />
      </View>

      <CustomConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
        theme={theme}
      />

      <LinearGradient
        colors={[theme.colors.background, theme.colors.card + "80"]}
        style={StyleSheet.absoluteFill}
      />

      <ModernHeader
        title="Shop Profile"
        onBack={() => navigation.navigate("Home")}
        theme={theme}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              source="https://cdn-icons-png.flaticon.com/512/3209/3209265.png"
              style={styles.promoImage}
              contentFit="contain"
            />
          </View>
        )}

        {shopData?.isMainOwner && (
          <>
            {/* PENDING STAFF SECTION - PREMIUM UI */}
            {pendingStaff.length > 0 && (
              <View style={{ marginBottom: 10 }}>
                <SectionHeader title={`Pending Requests (${pendingStaff.length})`} theme={theme} />
                {pendingStaff.map((staff) => (
                  <View
                    key={staff._id}
                    style={{
                      backgroundColor: theme.colors.card,
                      borderRadius: 16,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 5,
                      elevation: 2,
                      padding: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image
                        source={staff.barberId.profilePicture ? { uri: getProcessedImageUri(staff.barberId.profilePicture) } : GlossCutLogo}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "#eee",
                          marginRight: 12,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: theme.colors.text }}>
                          {staff.barberId.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>
                          Requesting to join
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => handleRejectStaff(staff.barberId._id)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#FFEBEE',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: '#FFCDD2'
                          }}
                        >
                          <XCircle size={16} color="#C62828" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleApproveStaff(staff.barberId._id)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: theme.colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <CheckCircle size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ACTIVE STAFF SECTION - NEW */}
            {shopData?.staff?.length > 0 && (
              <View style={{ marginBottom: 10 }}>
                <SectionHeader title={`Team Members (${shopData.staff.length})`} theme={theme} />
                {shopData.staff.map((staff) => (
                  <View
                    key={staff._id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: theme.colors.card,
                      padding: 12,
                      borderRadius: 16,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 5,
                      elevation: 2,
                    }}
                  >
                    <Image
                      source={staff.profilePicture ? { uri: getProcessedImageUri(staff.profilePicture) } : GlossCutLogo}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "#eee",
                        marginRight: 12,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: theme.colors.text }}>
                        {staff.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>
                        {staff.phone}
                      </Text>
                    </View>

                    {/* Status Badge */}
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: '#E8F5E9',
                      marginRight: shopData?.isMainOwner ? 10 : 0
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: "bold", color: '#2E7D32' }}>ACTIVE</Text>
                    </View>

                    {/* Remove Action - Compact Icon Button */}
                    {shopData?.isMainOwner && (
                      <TouchableOpacity
                        onPress={() => handleDeleteRequest(staff)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: '#FFEBEE',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: '#FFCDD2'
                        }}
                      >
                        <Trash2 size={14} color="#C62828" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            <SectionHeader title="Your Listings" theme={theme} />

            <ShopCardPreview
              shopData={shopData}
              theme={theme}
            />

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
                icon={Camera}
                label="Shop Image"
                value="Upload Photo"
                theme={theme}
                onPress={handleImageUpload}
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


          </>
        )}



        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- STYLES (Fixed for theme access) ---
const getStyles = (theme) => StyleSheet.create({
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
  // --- Premium Header ---
  modernHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 24,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + "20",
    backgroundColor: theme.colors.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14, // Squircle shape
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernHeaderTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  // --- Premium Shop Card Styles ---
  shopCard: {
    backgroundColor: "#fff",
    borderRadius: 28, // More rounded
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18, // Deeper shadow
    shadowRadius: 30, // Softer, more diffused shadow
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    overflow: "hidden",
    marginHorizontal: 20,
    marginTop: 24,
  },
  shopImageContainer: {
    height: 200, // Taller image
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  shopImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  shopImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100, // Larger overlay
    backgroundColor: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)",
    opacity: 0.8,
  },
  shopHeaderOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shopRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopRatingText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  shopBottomOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  shopCategoryTag: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  shopLocationText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
  },
  shopCardContent: {
    padding: 20,
  },
  shopTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  shopName: {
    fontSize: 20, // Larger name
    fontWeight: "900", // Bolder
    flex: 1,
    letterSpacing: -0.3,
  },
  shopVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  shopVerifiedText: {
    fontSize: 10,
    color: "#2E7D32",
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  shopFullAddressText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 14,
    lineHeight: 18,
  },
  shopStatsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(248, 249, 250, 0.8)",
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  shopStatItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  shopStatValue: {
    fontSize: 18, // Larger stats
    fontWeight: "900",
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  shopStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.8,
    letterSpacing: 0.3,
  },
  shopVerticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginHorizontal: 14,
  },
  shopInitialLarge: {
    fontSize: 56, // Larger initial
    fontWeight: "900",
    textTransform: "uppercase",
  },
  // --- Premium Details List ---
  detailsIsland: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: theme.colors.card,
  },
  modernInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContent: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    opacity: 0.8,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  ownerTag: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(238, 238, 238, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  ownerTagText: {
    fontSize: 9,
    color: "#616161",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  // --- Premium Promo/Staff ---
  promoContainer: {
    margin: 20,
    borderRadius: 28,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  promoContent: {
    flex: 1,
    paddingRight: 16,
  },
  promoTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  promoText: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 20,
    opacity: 0.85,
  },
  promoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButton: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 32,
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  // --- Premium Pending Request Styles ---
  rejectBtn: {
    backgroundColor: "rgba(244, 67, 54, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
    shadowColor: "rgba(244, 67, 54, 0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  rejectBtnText: {
    color: "#D32F2F",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  approveBtn: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  approveBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.3,
  },
});

export default ListedCardScreen;