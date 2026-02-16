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
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  UIManager,
  Animated,
  StatusBar,
  Dimensions,
  Pressable,
  LayoutAnimation,
} from "react-native";
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Circle,
  Sparkles,
  AlertCircle,
  XCircle,
  Check,
  Scissors,
  ChevronRight,
  CloudOff,
  Zap,
  ShieldCheck,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { defaultServices } from "../data/services";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");
const STATUSBAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

// --- MICRO-INTERACTION: ELASTIC SCALE BUTTON ---
const ScalePressable = React.memo(({ children, onPress, style, disabled }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 4,
      tension: 100,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 100,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
});

// --- MICRO-INTERACTION: PREMIUM INPUT FIELD ---
const AnimatedInput = React.memo(
  ({ icon: Icon, value, onChangeText, placeholder, keyboardType, theme }) => {
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(focusAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }, [isFocused]);

    const borderColor = focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.border, theme.colors.primary],
    });

    const backgroundColor = focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.card, theme.colors.background],
    });

    return (
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor,
            shadowOpacity: isFocused ? 0.1 : 0,
          },
        ]}
      >
        <View style={styles.inputIconWrapper}>
          <Icon
            size={20}
            color={
              isFocused ? theme.colors.primary : theme.colors.textSecondary
            }
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.inputLabel,
              {
                color: isFocused
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
                opacity: isFocused || value ? 1 : 0,
              },
            ]}
          >
            {placeholder}
          </Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={isFocused ? "" : placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>
      </Animated.View>
    );
  }
);

// --- COMPONENT: SERVICE ITEM CARD (PREMIUM UI) ---
const ServiceItem = React.memo(
  ({ service, isSelected, onToggle, theme }) => {
    return (
      <ScalePressable
        style={[
          styles.serviceCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : "transparent",
            borderWidth: isSelected ? 2 : 0,
            shadowColor: isSelected ? theme.colors.primary : "#000",
            shadowOpacity: isSelected ? 0.15 : 0.05,
            shadowRadius: isSelected ? 12 : 8,
            elevation: isSelected ? 4 : 2,
          },
        ]}
        onPress={() => onToggle(service)}
      >
        <View style={styles.serviceContent}>
          <View
            style={[
              styles.serviceIconBox,
              {
                backgroundColor: isSelected
                  ? theme.colors.primary + "15"
                  : theme.colors.background,
              },
            ]}
          >
            <Scissors
              size={20}
              color={
                isSelected ? theme.colors.primary : theme.colors.textSecondary
              }
            />
          </View>

          <View style={styles.serviceTextContainer}>
            <Text style={[styles.serviceName, { color: theme.colors.text }]}>
              {service.name}
            </Text>
            <Text
              style={[
                styles.serviceDuration,
                { color: theme.colors.textSecondary },
              ]}
            >
              • {service.duration} mins
            </Text>
          </View>

          <View style={styles.servicePriceBox}>
            <Text style={[styles.servicePrice, { color: theme.colors.text }]}>
              ₹{service.price}
            </Text>
            <View
              style={[
                styles.checkboxCircle,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : "transparent",
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            >
              {isSelected && <Check size={12} color="#FFF" strokeWidth={3} />}
            </View>
          </View>
        </View>
      </ScalePressable>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.theme === nextProps.theme
    );
  }
);

// --- COMPONENT: PRIORITY TIER CARD (FIXED LAYOUT) ---
// We wrap this in a View with flex: 1 to ensure it splits space evenly
const PriorityTier = React.memo(({ type, isActive, onSelect, theme, disabled }) => {
  const isExpress = type === "Express";

  return (
    <View style={{ flex: 1, paddingHorizontal: 6, opacity: disabled ? 0.5 : 1 }}>
      <ScalePressable
        style={[
          styles.tierCard,
          {
            backgroundColor: isActive
              ? isExpress
                ? "#8E24AA"
                : theme.colors.primary
              : theme.colors.card,
            borderColor: "transparent",
            shadowColor: isActive
              ? isExpress
                ? "#8E24AA"
                : theme.colors.primary
              : "#000",
            shadowOpacity: isActive ? 0.3 : 0.05,
            shadowRadius: isActive ? 12 : 6,
            elevation: isActive ? 8 : 2,
          },
        ]}
        onPress={() => onSelect(type)}
        disabled={disabled}
      >
        <View style={styles.tierHeader}>
          {isExpress ? (
            <Zap
              size={20}
              color={isActive ? "#FFD700" : theme.colors.textSecondary}
              fill={isActive ? "#FFD700" : "transparent"}
            />
          ) : (
            <ShieldCheck
              size={20}
              color={isActive ? "#FFF" : theme.colors.textSecondary}
            />
          )}
          {isActive && (
            <View style={styles.activeBadge}>
              <Check
                size={10}
                color={
                  isActive
                    ? isExpress
                      ? "#8E24AA"
                      : theme.colors.primary
                    : "#FFF"
                }
                strokeWidth={4}
              />
            </View>
          )}
        </View>

        <View style={{ marginTop: 12 }}>
          <Text
            style={[
              styles.tierTitle,
              { color: isActive ? "#FFF" : theme.colors.text },
            ]}
          >
            {type}
          </Text>
          <Text
            style={[
              styles.tierSub,
              {
                color: isActive
                  ? "rgba(255,255,255,0.85)"
                  : theme.colors.textSecondary,
              },
            ]}
          >
            {type === "Basic" ? "Standard" : "Priority"}
          </Text>
        </View>
      </ScalePressable>
    </View>
  );
});

// --- COMPONENT: TOAST NOTIFICATION ---
const CustomAlert = React.memo(
  ({ visible, type, title, message, onHide, theme }) => {
    const translateY = useRef(new Animated.Value(-150)).current;

    useEffect(() => {
      if (visible) {
        Animated.spring(translateY, {
          toValue: STATUSBAR_HEIGHT + 10,
          useNativeDriver: true,
          friction: 8,
          tension: 60,
        }).start();

        const timer = setTimeout(() => {
          hideAlert();
        }, 3500);
        return () => clearTimeout(timer);
      }
    }, [visible]);

    const hideAlert = () => {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (onHide) onHide();
      });
    };

    if (!visible) return null;

    const getColors = () => {
      switch (type) {
        case "success":
          return { bg: "#272727", accent: "#4CAF50", icon: CheckCircle2 };
        case "error":
          return { bg: "#272727", accent: "#F44336", icon: XCircle };
        case "warning":
          return { bg: "#272727", accent: "#FFC107", icon: AlertCircle };
        default:
          return { bg: "#272727", accent: "#FFF", icon: Sparkles };
      }
    };

    const colors = getColors();
    const IconComponent = colors.icon;

    return (
      <Animated.View
        style={[styles.alertWrapper, { transform: [{ translateY }] }]}
      >
        <View style={[styles.alertContainer, { backgroundColor: colors.bg }]}>
          <View
            style={[styles.alertIconBox, { backgroundColor: colors.accent }]}
          >
            <IconComponent size={20} color="#FFF" />
          </View>
          <View style={styles.alertTextBox}>
            <Text style={styles.alertTitle}>{title}</Text>
            <Text style={styles.alertMsg}>{message}</Text>
          </View>
        </View>
      </Animated.View>
    );
  }
);

// --- MAIN SCREEN ---
const OfflineBookingScreen = () => {
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const navigation = useNavigation();

  // --- LOGIC ---
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(format(new Date(), "HH:mm"));

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appointmentType, setAppointmentType] = useState("Basic");
  const [isExpressFull, setIsExpressFull] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "",
    title: "",
    message: "",
  });

  const totalPrice = useMemo(() => {
    return services.reduce(
      (sum, service) => sum + parseFloat(service.price || 0),
      0
    );
  }, [services]);

  const showAlert = useCallback((type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  // Check Express Limit
  useEffect(() => {
    const checkExpressAvailability = async () => {
      if (!user || !user._id) return;
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/booking/barber-appointments/${user._id}?date=${formattedDate}`,
          {
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
          }
        );
        if (response.ok) {
          const text = await response.text();
          const data = text ? JSON.parse(text) : [];
          // Count ALL express bookings (online, offline, and promoted)
          const expressCount = data.filter(
            (app) =>
              app.status !== 'cancelled' &&
              ((app.appointmentType && app.appointmentType.toLowerCase().includes('express')) || app.isPromoted)
          ).length;

          const isFull = expressCount >= 10;
          setIsExpressFull(isFull);
          if (isFull && appointmentType === "Express") {
            setAppointmentType("Basic");
          }
        }
      } catch (error) {
        // Silent fail
      }
    };

    checkExpressAvailability();
  }, [selectedDate, user, token]);

  useEffect(() => {
    fetchAvailableServices();
  }, []);

  useEffect(() => {
    if (user) {
      setCustomerName(user.name || "");
      setCustomerPhone(user.phone || "");
    }
  }, [user]);

  const fetchAvailableServices = async () => {
    setLoading(true);
    try {
      if (!process.env.EXPO_PUBLIC_API_URL)
        throw new Error("API Config Missing");

      const barberCardResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/barber-card/my-card`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
        }
      ).catch(() => null);

      if (barberCardResponse && barberCardResponse.ok) {
        const barberCard = await barberCardResponse.json();
        if (barberCard.services && barberCard.services.length > 0) {
          const transformedServices = barberCard.services.map((service) => ({
            _id: service._id || service.id,
            name: service.name,
            price: service.price,
            duration: service.time || service.duration || 30,
            category: service.category || "General",
          }));
          setAvailableServices(transformedServices);
          setLoading(false);
          return;
        }
      }

      const shopResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/shop/services/${user._id}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
        }
      ).catch(() => null);

      if (shopResponse && shopResponse.ok) {
        const data = await shopResponse.json();
        setAvailableServices(data);
      } else {
        throw new Error("Network Unavailable");
      }
    } catch (error) {
      if (__DEV__) console.log("Offline Mode Activated:", error.message);
      setAvailableServices(defaultServices);
      showAlert(
        "warning",
        "Offline Mode",
        "Internet unreachable. Using offline service list."
      );
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setSelectedDate(selectedDate);
  }, []);

  const onTimeChange = useCallback((event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setSelectedTime(format(selectedTime, "HH:mm"));
  }, []);

  const toggleServiceSelection = useCallback((service) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setServices((prevServices) => {
      const isSelected = prevServices.some((s) => s.id === service._id);
      if (isSelected) {
        return prevServices.filter((s) => s.id !== service._id);
      } else {
        return [
          ...prevServices,
          { id: service._id, name: service.name, price: service.price },
        ];
      }
    });
  }, []);

  const handleBookOfflineAppointment = useCallback(async () => {
    if (!customerName.trim())
      return showAlert(
        "warning",
        "Missing Name",
        "Please enter the customer name."
      );
    if (!customerPhone.trim() || customerPhone.length < 10)
      return showAlert(
        "warning",
        "Invalid Phone",
        "Please enter a valid phone number."
      );
    if (!selectedTime)
      return showAlert(
        "warning",
        "Time Required",
        "Please select an appointment time."
      );
    if (services.length === 0)
      return showAlert(
        "warning",
        "No Service",
        "Please add at least one service."
      );

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/booking`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            barberId: user._id,
            date: format(selectedDate, "yyyy-MM-dd"), // Fixed: Send local date string to avoid UTC shift
            time: selectedTime,
            services,
            totalPrice,
            appointmentType,
            isOfflineBooking: true,
            customerName,
            customerPhone,
          }),
        }
      ).catch(() => {
        throw new Error("Network Error");
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(
          "success",
          "Booking Confirmed",
          "Appointment scheduled successfully!"
        );
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        throw new Error(data.msg || "Failed to book.");
      }
    } catch (error) {
      showAlert(
        "error",
        "Connection Failed",
        "Could not reach server. Please check internet."
      );
      if (__DEV__) console.log("Booking Error:", error);
    } finally {
      setLoading(false);
    }
  }, [
    customerName,
    customerPhone,
    selectedTime,
    services,
    selectedDate,
    totalPrice,
    appointmentType,
    user._id,
    token,
    navigation,
    showAlert,
  ]);

  // --- RENDER UI ---
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop: STATUSBAR_HEIGHT + 10,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            {
              backgroundColor: theme.colors.card,
              shadowColor: theme.colors.shadow || "#000",
            },
          ]}
        >
          <ChevronLeft size={22} color={theme.colors.text} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            New Booking
          </Text>
          <View style={[styles.onlineBadge, { backgroundColor: "#E6F4EA" }]}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Walk-in Mode</Text>
          </View>
        </View>

        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* SECTION 1: CUSTOMER DETAILS */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
              Customer Details
            </Text>
            <AnimatedInput
              icon={User}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer Name"
              theme={theme}
            />
            <View style={{ height: 12 }} />
            <AnimatedInput
              icon={Phone}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              theme={theme}
            />
          </View>

          {/* SECTION 2: SCHEDULE */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
              Schedule
            </Text>
            <View style={styles.dateRow}>
              <ScalePressable
                style={[
                  styles.dateCard,
                  { backgroundColor: theme.colors.card },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: theme.colors.primary + "15" },
                  ]}
                >
                  <Calendar size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.cardLabel}>Date</Text>
                  <Text
                    style={[styles.cardValue, { color: theme.colors.text }]}
                  >
                    {format(selectedDate, "d MMM")}
                  </Text>
                </View>
              </ScalePressable>

              <ScalePressable
                style={[
                  styles.dateCard,
                  { backgroundColor: theme.colors.card },
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: theme.colors.primary + "15" },
                  ]}
                >
                  <Clock size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.cardLabel}>Time</Text>
                  <Text
                    style={[styles.cardValue, { color: theme.colors.text }]}
                  >
                    {selectedTime || "--:--"}
                  </Text>
                </View>
              </ScalePressable>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={
                selectedTime
                  ? new Date(selectedDate.toDateString() + " " + selectedTime)
                  : new Date()
              }
              mode="time"
              is24Hour={true}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onTimeChange}
            />
          )}

          {/* SECTION 3: SERVICES */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text
                style={[
                  styles.sectionHeader,
                  { color: theme.colors.text, marginBottom: 0 },
                ]}
              >
                Select Services
              </Text>
              {services.length > 0 && (
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text style={styles.pillText}>
                    {services.length} selected
                  </Text>
                </View>
              )}
            </View>

            {loading && availableServices.length === 0 ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text
                  style={{ marginTop: 10, color: theme.colors.textSecondary }}
                >
                  Loading catalog...
                </Text>
              </View>
            ) : availableServices.length === 0 ? (
              <View style={styles.emptyState}>
                <CloudOff size={40} color={theme.colors.border} />
                <Text style={styles.emptyText}>
                  No services available offline.
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {availableServices.map((service) => (
                  <ServiceItem
                    key={service._id}
                    service={service}
                    isSelected={services.some((s) => s.id === service._id)}
                    onToggle={toggleServiceSelection}
                    theme={theme}
                  />
                ))}
              </View>
            )}
          </View>

          {/* SECTION 4: PRIORITY - FIXED LAYOUT */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
              Priority Level
            </Text>

            {/* FIXED: Using negative margin on container and padding on items
                   to strictly enforce side-by-side layout
                */}

            <View style={styles.priorityRow}>
              {["Basic", "Express"].map((type) => (
                <PriorityTier
                  key={type}
                  type={type}
                  isActive={appointmentType === type}
                  onSelect={setAppointmentType}
                  theme={theme}
                  disabled={type === "Express" && isExpressFull}
                />
              ))}
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER */}
      <View style={styles.footerContainer}>
        <View
          style={[
            styles.footerDock,
            {
              backgroundColor: theme.colors.card,
              shadowColor: theme.colors.text,
            },
          ]}
        >
          <View style={styles.totalContainer}>
            <Text
              style={[styles.totalLabel, { color: theme.colors.textSecondary }]}
            >
              Total Payable
            </Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Text style={[styles.currency, { color: theme.colors.primary }]}>
                ₹
              </Text>
              <Text style={[styles.amount, { color: theme.colors.text }]}>
                {totalPrice}
              </Text>
            </View>
          </View>

          <ScalePressable
            style={[
              styles.checkoutBtn,
              {
                backgroundColor: theme.colors.primary,
                opacity: loading ? 0.8 : 1,
              },
            ]}
            onPress={handleBookOfflineAppointment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.checkoutText}>Confirm Booking</Text>
                <ChevronRight size={18} color="#FFF" strokeWidth={3} />
              </>
            )}
          </ScalePressable>
        </View>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onHide={hideAlert}
        theme={theme}
      />
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 50,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitleBox: { alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34A853",
    marginRight: 4,
  },
  onlineText: { fontSize: 10, fontWeight: "700", color: "#34A853" },

  // Scroll Area
  scrollContainer: { paddingHorizontal: 20, paddingTop: 10 },
  section: { marginBottom: 32 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillText: { color: "#FFF", fontSize: 11, fontWeight: "700" },

  // Inputs
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 64,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  inputIconWrapper: { marginRight: 16 },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: -2,
    marginTop: 4,
  },
  input: { flex: 1, fontSize: 16, fontWeight: "600", height: 40, padding: 0 },

  // Layout Helpers
  dateRow: { flexDirection: "row", gap: 12 }, // Used for Dates (gap works in newer RN)

  // FIX FOR PRIORITY ROW (Uses traditional negative margin logic for max compatibility)
  priorityRow: {
    flexDirection: "row",
    marginHorizontal: -6,
  },

  dateCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  cardValue: { fontSize: 15, fontWeight: "800" },

  // Services
  centerBox: { alignItems: "center", padding: 20 },
  emptyState: {
    alignItems: "center",
    padding: 40,
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 20,
    borderStyle: "dashed",
  },
  emptyText: { marginTop: 10, color: "#999", fontSize: 14 },
  grid: { gap: 12 },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
  },
  serviceContent: { flex: 1, flexDirection: "row", alignItems: "center" },
  serviceIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  serviceTextContainer: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  serviceDuration: { fontSize: 12, fontWeight: "500" },
  servicePriceBox: { alignItems: "flex-end", minWidth: 60 },
  servicePrice: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  // Priority Tiers
  tierCard: {
    flex: 1,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  activeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  tierTitle: { fontSize: 17, fontWeight: "800", marginBottom: 4 },
  tierSub: { fontSize: 11, fontWeight: "600" },

  // Footer
  footerContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  footerDock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingLeft: 24,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  totalContainer: { justifyContent: "center" },
  totalLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  currency: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  amount: { fontSize: 24, fontWeight: "900", lineHeight: 30 },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
    marginRight: 6,
  },

  // Toast
  alertWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  alertTextBox: { marginLeft: 12, marginRight: 20 },
  alertTitle: { color: "#FFF", fontSize: 13, fontWeight: "800" },
  alertMsg: { color: "#CCC", fontSize: 11, fontWeight: "500" },
});

export default OfflineBookingScreen;
