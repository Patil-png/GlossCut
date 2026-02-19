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
  UIManager,
  Easing,
} from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import * as Haptics from "expo-haptics";
import OptimizedImage from "../components/OptimizedImage";
import {
  Star,
  MapPin,
  ArrowLeft,
  Store,
  Phone,
  Trash,
  Tag,
  ChevronRight,
  Navigation,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Info,
  Camera,
  Trash2,
  Sparkles,
  Zap,
  User,
} from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import * as Location from "expo-location";
import * as SecureStore from 'expo-secure-store';
import api, { API_URL } from "../utils/api";
import { LinearGradient } from "expo-linear-gradient";
import LeafletMap from "../components/LeafletMap";

const { width, height } = Dimensions.get("window");
const STATUSBAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight : 44;
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BLURHASH = 'L5D]X]~q004n00~q009F00?b~qIV';
const GlossCutLogo = require('../assets/GlossCut.png');

const triggerHaptic = (style = "Light") => {
  if (Platform.OS !== "web") {
    const method =
      style === "Medium"
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(method);
  }
};

const getProcessedImageUri = (imagePath, userProfilePic) => {
  if (!imagePath) return userProfilePic;
  if (imagePath.startsWith("http")) return imagePath;
  return `${process.env.EXPO_PUBLIC_API_URL}${imagePath}`;
};

// --- SKELETON COMPONENTS ---
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

const skeletonStyles = StyleSheet.create({
  skContainer: { paddingHorizontal: 20, paddingTop: 20 },
  skHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  skSpacer: { width: 40 },
  skSectionTitle: { marginBottom: 15 },
  skCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 30, borderWidth: 1, borderColor: '#eee' },
  skCardContent: { padding: 16 },
  skCardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  skCardTextLine: { marginBottom: 15 },
  skStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  skListContainer: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  skListItem: { padding: 18, flexDirection: 'row', alignItems: 'center' },
  skSeparator: { borderBottomWidth: 1, borderColor: '#eee' },
  skListIcon: { marginRight: 16 },
  skListTextBottom: { marginBottom: 6 },
});

const DashboardSkeleton = memo(() => (
  <View style={skeletonStyles.skContainer}>
    <View style={skeletonStyles.skHeader}>
      <SkeletonItem width={40} height={40} borderRadius={20} />
      <SkeletonItem width={120} height={30} />
      <View style={skeletonStyles.skSpacer} />
    </View>
    <SkeletonItem width={100} height={20} style={skeletonStyles.skSectionTitle} />
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

// --- PREMIUM MACRO-COMPONENTS ---
const TopToast = memo(({ visible, message, type, onHide }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    let timer;
    if (visible) {
      Animated.spring(translateY, {
        toValue: STATUSBAR_HEIGHT + 10,
        useNativeDriver: true,
        damping: 12, // More "liquid" feel
        stiffness: 100,
        mass: 0.6,
      }).start();
      timer = setTimeout(() => hideToast(), 3500); // Slightly longer
    } else {
      hideToast();
    }
    return () => clearTimeout(timer);
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 400, // Smoother exit
      useNativeDriver: true,
      easing: Easing.in(Easing.back(1)),
    }).start(() => {
      if (visible && onHide) onHide();
    });
  };

  const getToastIcon = () => {
    switch (type) {
      case "success": return { bg: "#10B981", icon: <CheckCircle size={18} color="#fff" /> }; // Modern green
      case "error": return { bg: "#EF4444", icon: <AlertCircle size={18} color="#fff" /> }; // Modern red
      case "warning": return { bg: "#F59E0B", icon: <Zap size={18} color="#fff" /> }; // Modern amber
      default: return { bg: "#4B5563", icon: <Sparkles size={18} color="#fff" /> };
    }
  };

  const toastTheme = getToastIcon();

  return (
    <Animated.View style={[styles.premiumToast, { transform: [{ translateY }], backgroundColor: toastTheme.bg }]}>
      <View style={styles.toastIconContainer}>{toastTheme.icon}</View>
      <Text style={styles.premiumToastText}>{message}</Text>
    </Animated.View>
  );
});

const ScalePress = memo(({ onPress, style, children, disabled, onLongPress }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scaleValue, { toValue: 0.97, useNativeDriver: true, friction: 4 }).start();
  const onPressOut = () => Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

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
});

const CustomConfirmModal = memo(({ visible, title, message, onConfirm, onCancel, theme, confirmText = "Delete", isDestructive = true }) => {
  const styles = getStyles(theme);
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.modalIconBubble, { backgroundColor: isDestructive ? "#FFEBEE" : "#E3F2FD" }]}>
            {isDestructive ? <Trash size={24} color="#D32F2F" /> : <Info size={24} color="#1976D2" />}
          </View>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>{message}</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={onCancel}>
              <Text style={[styles.modalBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtnConfirm, { backgroundColor: isDestructive ? "#D32F2F" : theme.colors.primary }]} onPress={onConfirm}>
              <Text style={[styles.modalBtnText, { color: "#fff", fontWeight: "bold" }]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const ModernHeader = memo(({ title, subtitle, onBack, theme }) => {
  const styles = getStyles(theme);
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, damping: 15, stiffness: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
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
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <ArrowLeft size={22} color="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitleText}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitleText}>{subtitle}</Text>}
        </View>

        <View style={{ width: 42 }} />
      </View>
    </AnimatedGradient>
  );
});

const SectionHeader = memo(({ title, theme }) => {
  const styles = getStyles(theme);
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      <View style={styles.betaBadge}><Text style={styles.betaText}>LIVE</Text></View>
    </View>
  );
});

const InfoRow = memo(({ icon: Icon, label, value, theme, onPress, canEdit = true }) => {
  const styles = getStyles(theme);
  return (
    <ScalePress onPress={canEdit ? onPress : undefined} disabled={!canEdit} style={styles.infoRowContainer}>
      <View style={[
        styles.infoRowInner,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.dark ? '#1E293B' : '#F1F5F9',
          shadowColor: theme.colors.primary, // Radiant glow
        }
      ]}>
        <LinearGradient colors={[theme.colors.primary + '25', theme.colors.primary + '05']} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Icon size={22} color={theme.colors.primary} strokeWidth={2.5} />
        </LinearGradient>
        <View style={styles.infoRowLeft}>
          <View style={{ marginLeft: 16 }}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]} numberOfLines={1}>{value}</Text>
          </View>
        </View>
        {canEdit ? (
          <View style={[styles.chevronBox, { backgroundColor: theme.colors.primary + '10' }]}><ChevronRight size={18} color={theme.colors.primary} strokeWidth={3} /></View>
        ) : (
          <View style={[styles.lockedBadge, { backgroundColor: '#10B98110' }]}><Text style={styles.lockedBadgeText}>OFFICIAL</Text></View>
        )}
      </View>
    </ScalePress>
  );
});

const ShopCardPreview = memo(({ shopData, theme }) => {
  const totalBarbers = 1 + (shopData?.staff?.length || 0);
  const avgRating = shopData?.rating && shopData.rating > 0 ? shopData.rating.toFixed(1) : "New Member";
  const styles = getStyles(theme);
  return (
    <View style={[styles.shopCard, { backgroundColor: theme.colors.card, borderColor: theme.dark ? "#1E293B" : "#F1F5F9" }]}>
      <View style={styles.cardImageContainer}>
        {shopData?.processedImage ? (
          <OptimizedImage source={shopData.processedImage} style={styles.cardImage} contentFit="cover" placeholder={BLURHASH} transition={500}>
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)", "rgba(0,0,0,0.9)"]} style={styles.gradientOverlay} />
            <View style={styles.cardTopBadgeRow}>
              <View style={styles.ratingBadge}>
                <Sparkles size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                <Text style={styles.ratingText}>{avgRating}</Text>
                {shopData?.rating > 0 && <Star size={10} color="#FBBF24" fill="#FBBF24" style={{ marginLeft: 4 }} />}
              </View>
            </View>
          </OptimizedImage>
        ) : (
          <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={[styles.cardImageContainer, { justifyContent: "center", alignItems: "center" }]}>
            <Store size={48} color="#9CA3AF" />
          </LinearGradient>
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={1}>{shopData?.name || "Initializing Establishment..."}</Text>
          <View style={styles.verifiedBadge}><CheckCircle size={14} color={theme.colors.primary} fill={theme.colors.card} /></View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <MapPin size={12} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary, marginBottom: 0 }]} numberOfLines={1}>{shopData?.address || "Location pending configuration"}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.cardStatsRow}>
          <View style={styles.statItem}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 4 }} />
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{totalBarbers} Professionals</Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.statItem}>
            <Zap size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>{shopData?.category || "Premium Service"}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

// --- MAIN SCREEN COMPONENT ---
const ListedCardScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(theme);
  const abortControllerRef = useRef(null);

  const [shopData, setShopData] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [region, setRegion] = useState(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [confirmModal, setConfirmModal] = useState({ visible: false, title: "", message: "", onConfirm: () => { } });
  const [networkError, setNetworkError] = useState(false);
  const [pendingStaff, setPendingStaff] = useState([]);

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!isInitialLoad && shopData) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1)),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1)),
        }),
      ]).start();
    }
  }, [isInitialLoad, shopData]);

  const showToast = useCallback((message, type = "info") => {
    triggerHaptic(type === "error" ? "Medium" : "Light");
    setToast({ visible: true, message, type });
  }, []);

  const fetchPendingStaff = useCallback(async () => {
    try {
      const res = await api.get('/api/shop/staff/pending');
      setPendingStaff(res.data);
    } catch (err) { console.log("Error fetching pending staff:", err); }
  }, []);

  const handleApproveStaff = async (barberId) => {
    try {
      await api.put(`/api/shop/staff/approve/${barberId}`);
      showToast("Staff approved successfully", "success");
      fetchPendingStaff();
    } catch (err) { showToast("Failed to approve staff", "error"); }
  };

  const handleRejectStaff = async (barberId) => {
    try {
      await api.put(`/api/shop/staff/reject/${barberId}`);
      showToast("Staff request rejected", "info");
      fetchPendingStaff();
    } catch (err) { showToast("Failed to reject staff", "error"); }
  };

  const fetchShopData = useCallback(async () => {
    setNetworkError(false);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      const shopRes = await api.get('/api/shop/my-shop', { timeout: 15000, signal });
      const fetchedShopData = shopRes.data;
      fetchedShopData.processedImage = getProcessedImageUri(fetchedShopData.image, user?.profilePicture);
      setShopData(fetchedShopData);
      setLocationConfirmed(!!fetchedShopData?.location?.coordinates);
      if (fetchedShopData?.isMainOwner) fetchPendingStaff();
    } catch (err) {
      if (err.name === 'CanceledError') return;
      if (!shopData) setNetworkError(true);
      else showToast("Sync failed. Showing cached data.", "error");
    } finally {
      if (!signal.aborted) setIsInitialLoad(false);
    }
  }, [user, showToast, shopData, fetchPendingStaff]);

  useEffect(() => {
    const focusListener = navigation.addListener("focus", fetchShopData);
    return () => {
      focusListener();
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [navigation, fetchShopData]);

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
      const res = await api.post('/api/barber-card/request-delete', { reason: "Barber card deletion requested by shop owner", targetBarberId: barber._id });
      if (res.status === 200) { showToast("Request sent to admin for approval", "success"); fetchShopData(); }
    } catch (err) { showToast(err.response?.data?.msg || "Failed to request deletion", "error"); }
  };

  const handlePinLocation = async () => {
    try {
      if (shopData?.location?.coordinates) {
        setRegion({ latitude: shopData.location.coordinates[1], longitude: shopData.location.coordinates[0], latitudeDelta: 0.005, longitudeDelta: 0.005 });
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { showToast("Location permission denied", "error"); return; }
        let location = await Location.getCurrentPositionAsync({});
        setRegion({ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      }
    } catch (e) { showToast("Error accessing maps", "error"); }
  };

  const handleConfirmLocation = async () => {
    try {
      await api.put('/api/shop', { location: { type: "Point", coordinates: [region.longitude, region.latitude] } });
      showToast("Location pinned successfully!", "success");
      setRegion(null);
      setLocationConfirmed(true);
      fetchShopData();
    } catch (err) { showToast("Failed to update location", "error"); }
  };

  const handleImageUpload = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { showToast('Permission Denied', 'Camera roll permissions are needed.', 'warning'); return; }
    }
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) {
      try {
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop();
        let type = 'image/jpeg';
        if (filename.toLowerCase().endsWith('.png')) type = 'image/png';
        const formData = new FormData();
        formData.append('shopImage', { uri: localUri, name: filename, type });
        const token = await SecureStore.getItemAsync('token');
        const uploadResponse = await fetch(`${API_URL}/api/shop/upload-image`, { method: 'POST', headers: { 'Accept': 'application/json', 'x-auth-token': token }, body: formData });
        const data = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(data.msg || 'Upload failed');
        if (data && data.imageUrl) {
          const imageUrl = getProcessedImageUri(data.imageUrl);
          setShopData(prevShop => prevShop ? { ...prevShop, image: imageUrl, processedImage: imageUrl } : null);
          const shopUpdateRes = await api.put('/api/shop', { image: imageUrl });
          if (shopUpdateRes.status === 200) showToast('Success', 'Shop image updated! Pending approval.', 'success');
        }
      } catch (error) { showToast('Upload Failed', error.message, 'error'); }
    }
  };

  if (isInitialLoad && !shopData) {
    return (<View style={[styles.container, { backgroundColor: theme.colors.background }]}><View style={{ height: STATUSBAR_HEIGHT }} /><DashboardSkeleton /></View>);
  }

  if (networkError && !shopData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: "center", alignItems: "center", padding: 30 }]}>
        <View style={styles.errorIconBubble}><WifiOff size={40} color="#757575" /></View>
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>No Internet Connection</Text>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>We couldn't reach the server. Please check your connection and try again.</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={fetchShopData}><Text style={styles.retryButtonText}>Retry Connection</Text></TouchableOpacity>
      </View>
    );
  }

  if (region) {
    return (
      <View style={styles.container}>
        <LeafletMap style={StyleSheet.absoluteFill} initialRegion={region} onRegionChangeComplete={setRegion} />
        <SafeAreaView style={styles.mapOverlay}><TouchableOpacity onPress={() => setRegion(null)} style={styles.mapBackButton}><ArrowLeft size={24} color="#000" /></TouchableOpacity></SafeAreaView>
        <View style={styles.markerFixed}><View style={styles.markerCircle}><MapPin size={40} color={theme.colors.primary} fill={theme.colors.primary} /></View><View style={styles.markerStem} /></View>
        <View style={styles.locationActionPanel}><Text style={styles.dragText}>Move the map to place the pin</Text><TouchableOpacity style={[styles.confirmLocationButton, { backgroundColor: theme.colors.primary }]} onPress={handleConfirmLocation}><Text style={styles.confirmLocationButtonText}>Confirm Location</Text></TouchableOpacity></View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.bgGlow} />

      <ModernHeader title="Premium Profile" subtitle="Managing your digital presence" onBack={() => navigation.goBack()} theme={theme} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.section}>
            <SectionHeader title="Live Appearance" theme={theme} />
            <ShopCardPreview shopData={shopData} theme={theme} />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Establishment Details" theme={theme} />
            <InfoRow icon={Store} label="Shop Name" value={shopData?.name || "Loading..."} theme={theme} onPress={() => navigation.navigate('EditShopDetails', { field: 'name', value: shopData?.name })} canEdit={shopData?.isMainOwner} />
            <InfoRow icon={MapPin} label="Location" value={shopData?.address || "Address not set"} theme={theme} onPress={() => navigation.navigate('EditShopDetails', { field: 'address', value: shopData?.address })} canEdit={shopData?.isMainOwner} />
            <InfoRow icon={Phone} label="Contact" value={shopData?.phone || "Add phone number"} theme={theme} onPress={() => navigation.navigate('EditShopDetails', { field: 'phone', value: shopData?.phone })} canEdit={shopData?.isMainOwner} />
            <InfoRow icon={Tag} label="Category" value={shopData?.category || "Barber Shop"} theme={theme} onPress={() => navigation.navigate('EditShopDetails', { field: 'category', value: shopData?.category })} canEdit={shopData?.isMainOwner} />
            <InfoRow icon={Camera} label="Portfolio Media" value="Refresh Establishment Photos" theme={theme} onPress={handleImageUpload} canEdit={shopData?.isMainOwner} />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Map Presence" theme={theme} />
            <TouchableOpacity style={[styles.infoRowInner, { backgroundColor: theme.colors.card, borderColor: theme.dark ? '#1E293B' : '#F1F5F9', shadowColor: theme.colors.primary, marginBottom: 12 }]} onPress={handlePinLocation}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '30' }]}><Navigation size={20} color={theme.colors.primary} strokeWidth={2.5} /></View>
              <View style={{ flex: 1, marginLeft: 14 }}><Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{locationConfirmed ? "Visibility Status" : "Action Required"}</Text><Text style={[styles.infoValue, { color: locationConfirmed ? '#10B981' : theme.colors.text }]}>{locationConfirmed ? "Live on GlossCut Map" : "Pin Your Location"}</Text></View>
              <View style={[styles.chevronBox, { backgroundColor: theme.colors.primary + '12' }]}><ChevronRight size={16} color={theme.colors.primary} strokeWidth={2.5} /></View>
            </TouchableOpacity>
          </View>

          {shopData?.isMainOwner && shopData.staff && shopData.staff.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Team Members" theme={theme} />
              {shopData.staff.map((staff) => (
                <View key={staff._id} style={[styles.infoRowInner, { backgroundColor: theme.colors.card, borderColor: theme.dark ? '#1E293B' : '#F1F5F9', shadowColor: theme.dark ? '#000' : '#6366F120', marginBottom: 12, flexDirection: 'row', alignItems: 'center', padding: 12 }]}>
                  <Image source={staff.profilePicture ? { uri: getProcessedImageUri(staff.profilePicture) } : GlossCutLogo} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
                  <View style={{ flex: 1 }}><Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Staff Member</Text><Text style={[styles.infoValue, { color: theme.colors.text }]}>{staff.name}</Text></View>
                  <TouchableOpacity onPress={() => handleDeleteRequest(staff)} style={styles.deleteIconBtn}><Trash2 size={20} color="#EB5757" /></TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {shopData?.isMainOwner && pendingStaff.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Barber Partnerships" theme={theme} />
              {pendingStaff.map((staff) => (
                <View key={staff._id} style={styles.pendingRequestCard}>
                  <View style={styles.pendingRequestHeader}><View style={[styles.iconCircle, { backgroundColor: '#FDE68A' }]}><User size={20} color="#92400E" /></View><View style={{ flex: 1, marginLeft: 14 }}><Text style={styles.pendingTitle}>{staff.name}</Text><Text style={styles.pendingBody}>Requested to join your team</Text></View></View>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity onPress={() => handleRejectStaff(staff._id)} style={styles.rejectBtn}><Text style={styles.rejectText}>Decline</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleApproveStaff(staff._id)} style={styles.approveBtn}><Text style={styles.approveText}>Accept Partner</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
      <TopToast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />
      <CustomConfirmModal visible={confirmModal.visible} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))} theme={theme} />
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  section: { paddingHorizontal: 20, marginTop: 24 },

  // --- PREMIUM HEADER ---
  headerWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
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
  headerTitleText: { fontSize: 20, fontWeight: "900", color: '#FFF', letterSpacing: -0.5 },
  headerSubtitleText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  // Decorative Background Elements
  bgGlow: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: theme.colors.primary + '08',
    top: height * 0.2,
    left: -width * 0.5,
    zIndex: -1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    position: 'relative',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.95 },
  betaBadge: { backgroundColor: theme.colors.primary + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primary + '30' },
  betaText: { fontSize: 10, fontWeight: '900', color: theme.colors.primary },
  infoRowContainer: { width: '100%', marginBottom: 14 },
  infoRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    // Radiant Glow Effect
  },
  iconCircle: { width: 48, height: 48, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  infoRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '800', letterSpacing: -0.4 },
  chevronBox: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  lockedBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  lockedBadgeText: { fontSize: 11, fontWeight: '900', color: '#10B981' },
  shopCard: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 },
  cardImageContainer: { height: 200, width: '100%' },
  cardImage: { width: '100%', height: '100%' },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },
  cardTopBadgeRow: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  ratingText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  cardContent: { padding: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  cardTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.6, flex: 1 },
  verifiedBadge: { transform: [{ scale: 1.2 }] },
  cardSubtitle: { fontSize: 14, marginBottom: 16, opacity: 0.85, fontWeight: '500' },
  separator: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: 16 },
  cardStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statText: { fontSize: 13, fontWeight: '800' },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(0,0,0,0.15)' },
  mapContainer: { height: 260, width: '100%', borderRadius: 28, overflow: 'hidden', marginTop: 10, borderWidth: 1, borderColor: '#eee' },
  confirmLocationBtn: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 16, alignItems: 'center', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  confirmLocationText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  pendingRequestCard: { backgroundColor: '#FEF3C730', borderRadius: 24, borderWidth: 1.5, borderColor: '#FDE68A', padding: 18, marginBottom: 16 },
  pendingRequestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  pendingTitle: { fontSize: 17, fontWeight: '900', color: '#92400E' },
  pendingBody: { fontSize: 13, color: '#B45309', marginTop: 4, fontWeight: '500' },
  pendingActions: { flexDirection: 'row', gap: 12 },
  rejectBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#FECACA', alignItems: 'center' },
  rejectText: { color: '#EF4444', fontSize: 14, fontWeight: '800' },
  approveBtn: { flex: 1.5, paddingVertical: 12, borderRadius: 14, backgroundColor: '#10B981', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2 },
  approveText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  premiumToast: { position: 'absolute', top: 0, left: 24, right: 24, zIndex: 9999, borderRadius: 32, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 15 },
  toastIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  premiumToastText: { color: '#FFF', fontSize: 15, fontWeight: '800', flex: 1 },
  deleteIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EF444410', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EF444415' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', padding: 30, borderRadius: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.25, shadowRadius: 30, elevation: 20 },
  modalIconBubble: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  modalMessage: { fontSize: 15, textAlign: 'center', marginBottom: 30, lineHeight: 22, opacity: 0.8 },
  modalActions: { flexDirection: 'row', width: '100%', gap: 14 },
  modalBtnCancel: { flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
  modalBtnConfirm: { flex: 1.5, paddingVertical: 16, borderRadius: 18, alignItems: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: '800' },
  errorIconBubble: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  errorTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
  errorText: { fontSize: 15, textAlign: 'center', marginBottom: 30, paddingHorizontal: 30, opacity: 0.7, lineHeight: 22 },
  retryButton: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 18 },
  retryButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  mapOverlay: { position: 'absolute', top: 20, left: 24, zIndex: 10 },
  mapBackButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  markerFixed: { position: 'absolute', top: '50%', left: '50%', marginLeft: -24, marginTop: -48, alignItems: 'center' },
  markerCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24 },
  markerStem: { width: 3, height: 12, backgroundColor: theme.colors.primary, borderRadius: 1.5 },
  locationActionPanel: { position: 'absolute', bottom: 40, left: 24, right: 24, backgroundColor: '#FFF', padding: 28, borderRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.25, shadowRadius: 48, elevation: 25 },
  dragText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  confirmLocationButton: { width: '100%', paddingVertical: 18, borderRadius: 18, alignItems: 'center' },
  confirmLocationButtonText: { color: '#FFF', fontWeight: '900', fontSize: 18 },
});

export default ListedCardScreen;