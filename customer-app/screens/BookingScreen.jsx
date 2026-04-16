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
  Image,
  ScrollView,
  Linking,
  Dimensions,
  Animated,
  Easing,
  Platform,
  StatusBar
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
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
  CheckCircle2
} from "lucide-react-native";
import api from "../utils/api";

// --- PERFORMANCE OPTIMIZATION: REMOVED CACHING TO FIX CONSTRUCTOR ERROR ---

// --- OPTIMIZATION: Memoized Child Components to prevent unnecessary re-renders ---
const ServiceItem = React.memo(
  ({ service, isSelected, onSelect, theme, styles }) => {
    // Memoize expensive calculations
    const serviceData = React.useMemo(() => ({
      name: service.name,
      price: service.price,
      time: service.time,
      id: service.id
    }), [service.name, service.price, service.time, service.id]);

    // Memoize event handler
    const handlePress = React.useCallback(() => onSelect(serviceData.id), [onSelect, serviceData.id]);

    return (
      <View style={styles.serviceCard}>
        <View style={styles.serviceLeft}>
          <Text style={styles.serviceName}>{serviceData.name}</Text>
          <View style={styles.serviceDetails}>
            <Text style={styles.servicePrice}>₹{serviceData.price}</Text>
            <Text style={styles.serviceTime}>{serviceData.time} min</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addButton, isSelected && styles.addButtonSelected]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          {isSelected ? (
            <>
              <Check size={14} color="#FFF" />
              <Text
                style={[styles.addButtonText, styles.addButtonTextSelected]}
              >
                ADDED
              </Text>
            </>
          ) : (
            <Text style={styles.addButtonText}>ADD</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.service.id === nextProps.service.id &&
      prevProps.service.name === nextProps.service.name &&
      prevProps.service.price === nextProps.service.price
    );
  }
);

// --- MODERN TOAST COMPONENT (Zomato/Blinkit Style) ---
const ToastNotification = ({ visible, message, type, onHide, topInset }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: topInset,
          useNativeDriver: true,
          tension: 40,
          friction: 8
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
      ]).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        handleHide();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      handleHide();
    }
  }, [visible]);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#1B5E20"; // Dark Green
      case "error":
        return "#B71C1C"; // Dark Red
      default:
        return "#212121"; // Dark Grey
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={20} color="#fff" />;
      case "error":
        return <XCircle size={20} color="#fff" />;
      default:
        return <AlertCircle size={20} color="#fff" />;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0, // Now handled by topInset transformation
        left: 20,
        right: 20,
        zIndex: 9999,
        backgroundColor: getBackgroundColor(),
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        transform: [{ translateY }],
        opacity: opacity
      }}
    >
      {getIcon()}
      <Text
        style={{
          color: "#fff",
          fontWeight: "600",
          marginLeft: 12,
          flex: 1,
          fontSize: 14
        }}
      >
        {message}
      </Text>
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
          height: 160,
          backgroundColor: "rgba(0,0,0,0.3)", // Performance: Simple RGBA instead of complex gradient if not needed
        },
        headerNav: {
          position: "absolute",
          top: Math.max(insets.top, 10),
          left: 20,
          right: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          zIndex: 10
        },
        glassButton: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "rgba(255,255,255,0.85)",
          justifyContent: "center",
          alignItems: "center"
        },
        contentSheet: {
          marginTop: -50,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          backgroundColor: theme.colors.background,
          minHeight: 500,
          paddingHorizontal: 20,
          paddingTop: 30,
          paddingBottom: 120
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
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 18,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border + "60"
        },
        serviceLeft: {
          flex: 1,
          paddingRight: 16
        },
        serviceName: {
          fontSize: 16,
          fontWeight: "600",
          color: theme.colors.text,
          marginBottom: 6
        },
        serviceDetails: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        },
        servicePrice: {
          fontSize: 16,
          fontWeight: "700",
          color: theme.colors.text
        },
        serviceTime: {
          fontSize: 14,
          color: theme.colors.textSecondary
        },
        addButton: {
          width: 85,
          height: 36,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: theme.colors.border,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background
        },
        addButtonSelected: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          flexDirection: "row"
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
        mapPreview: {
          height: 80,
          borderRadius: 16,
          backgroundColor: theme.colors.card,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          marginTop: 10,
          borderWidth: 1,
          borderColor: theme.colors.border
        },
        bottomContainer: {
          position: "absolute",
          bottom: Math.max(insets.bottom, 16),
          left: 20,
          right: 20,
          backgroundColor: theme.colors.text,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 16,
          paddingHorizontal: 24
        },
        itemsCount: {
          color: theme.colors.background,
          fontSize: 12,
          opacity: 0.8,
          marginBottom: 2
        },
        totalPrice: {
          color: theme.colors.background,
          fontSize: 18,
          fontWeight: "700"
        },
        continueButton: {
          backgroundColor: theme.colors.primary,
          paddingVertical: 10,
          paddingHorizontal: 24,
          borderRadius: 12
        },
        continueText: {
          color: "#FFF",
          fontWeight: "700",
          fontSize: 15
        }
      }),
    [theme]
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
          let services = barberData.services || [];
          if (barberData.barberId) {
            try {
              const barberRes = await api.get(
                `/api/barber-card/all`
              );
              const barberCard = barberRes.data.find(b => b.barberId === barberData.barberId);
              if (barberCard) {
                services = barberCard.services || [];
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
            image: barberData.image?.uri,
            location: null, // No location for independent barbers
          };
          if (isMounted) setProvider(formattedProvider);
        } else {
          const id = barberId || salonId || providerId;
          if (!id) throw new Error("No Provider ID found");

          const res = await api.get(
            `/api/shop/${id}`
          );
          if (isMounted) setProvider(res.data);
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

  const handleContinue = async () => {
    if (!provider) return;

    // Optimistic UI check (Internet/Server Safety)
    const now = new Date();
    const date = now.toISOString();

    try {
      const response = await api.get(
        `/api/booking/check-premium-availability/${provider.owner._id}`,
        {
          params: { date },
          timeout: 8000, // Add timeout to prevent infinite hanging
        }
      );

      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;

      const servicesToBook = provider.services.filter((s) =>
        selectedServices.includes(s.id)
      );

      if (response.data.type === "premium") {
        navigation.navigate("AppointmentFull", {
          barberId: provider.owner._id,
          date: date,
          time: currentTime,
          services: servicesToBook,
          totalPrice: totalPrice,
          availablePremiumSlots: response.data.count
        });
      } else {
        navigation.navigate("AppointmentType", {
          barberId: provider.owner._id,
          services: servicesToBook,
          totalPrice: totalPrice,
          date: date,
          time: currentTime
        });
      }
    } catch (error) {
      console.error("Booking Check Failed:", error);
      // Modern Toast Error
      const errorMsg =
        error.response?.data?.msg || "Server is unreachable. Please try again.";
      showToast(errorMsg, "error");
    }
  };

  const openMaps = useCallback(() => {
    if (!provider?.location) {
      showToast("Location data not available", "error");
      return;
    }
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q="
    });
    const latLng = `${provider.location.coordinates[1]},${provider.location.coordinates[0]}`;
    const label = encodeURIComponent(provider.name);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    Linking.openURL(url).catch(() =>
      showToast("Could not open maps application", "error")
    );
  }, [provider]);

  const totalPrice = useMemo(() => {
    if (!provider) return 0;
    return provider.services
      .filter((service) => selectedServices.includes(service.id))
      .reduce((total, service) => {
        const price = parseFloat(service.price.replace("₹", ""));
        return total + (isNaN(price) ? 0 : price);
      }, 0);
  }, [selectedServices, provider]);

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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20, padding: 10 }}
        >
          <Text style={{ color: theme.colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* --- CUSTOM ALERT OVERLAY --- */}
      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
        topInset={insets.top + (Platform.OS === 'android' ? 10 : 0)}
      />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* HERO IMAGE SECTION */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: provider.owner?.profilePicture || provider.image }}
            style={styles.heroImage}
          />
          <View style={styles.gradientOverlay} />

          <View style={styles.headerNav}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.glassButton}
            >
              <ArrowLeft size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.glassButton}
              onPress={() => showToast("Link copied to clipboard!", "success")}
            >
              <Share2 size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTENT SHEET */}
        <View style={styles.contentSheet}>
          <View style={styles.headerRow}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color="#1976D2" />
              <Text style={styles.verifiedText}>VERIFIED</Text>
            </View>
          </View>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <Star size={16} color="#FBC02D" fill="#FBC02D" />
            <Text
              style={[
                styles.metaText,
                { color: theme.colors.text, fontWeight: "700" },
              ]}
            >
              {provider.rating ? Number(provider.rating).toFixed(1) : "New"}
            </Text>
            <Text style={[styles.metaText, { marginLeft: 4 }]}>
              ({provider.reviews || 0})
            </Text>

            <View style={[styles.dotSeparator, { marginLeft: 16 }]} />
            <MapPin size={16} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>
              {provider.address ? provider.address.split(",")[0] : "Location"}
            </Text>

            <View style={[styles.dotSeparator, { marginLeft: 16 }]} />
            <Clock size={16} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>
              {provider.avgAppointmentTime || "30m"}
            </Text>
          </View>

          {/* Safety Banner */}
          <View style={styles.safetyBanner}>
            <View
              style={{
                backgroundColor: theme.colors.primary + "15",
                padding: 8,
                borderRadius: 20
              }}
            >
              <ShieldCheck size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.safetyTextContainer}>
              <Text style={styles.safetyTitle}>Safe & Hygienic</Text>
              <Text style={styles.safetySubtitle}>
                Partner follows strict safety protocols.
              </Text>
            </View>
          </View>

          {/* Services Section */}
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={{ marginBottom: 20 }}>
            {provider.services &&
              provider.services.map((service) => (
                <ServiceItem
                  key={service.id}
                  service={service}
                  isSelected={selectedServices.includes(service.id)}
                  onSelect={handleSelectService}
                  theme={theme}
                  styles={styles}
                />
              ))}
          </View>

          {/* Location */}
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity style={styles.mapPreview} onPress={openMaps}>
            <View
              style={{
                backgroundColor: theme.colors.background,
                padding: 8,
                borderRadius: 50,
                marginRight: 12
              }}
            >
              <Map size={24} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.serviceName, { marginBottom: 0 }]}>
                Get Directions
              </Text>
              <Text
                style={{ fontSize: 12, color: theme.colors.textSecondary }}
                numberOfLines={1}
              >
                {provider.address}
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FLOATING BOTTOM BAR */}
      {selectedServices.length > 0 && (
        <View style={styles.bottomContainer}>
          <View>
            <Text style={styles.itemsCount}>
              {selectedServices.length} item
              {selectedServices.length > 1 ? "s" : ""} selected
            </Text>
            <Text style={styles.totalPrice}>₹{totalPrice.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default BookingScreen;
