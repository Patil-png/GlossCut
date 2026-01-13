import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  SectionList,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  StatusBar,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ChevronLeft,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCcw,
  CreditCard,
  Calendar,
  ArrowRightCircle,
  Plus,
  Phone,
  Scissors,
  History,
  AlertTriangle,
  WifiOff,
  SkipForward,
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import OtpInput from "../components/OtpInput";

// Enable LayoutAnimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- 1. Premium Skeleton Loader Component ---
const SkeletonItem = () => {
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
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Animated.View
            style={[
              styles.skeletonLine,
              { width: "60%", height: 14, marginBottom: 6, opacity },
            ]}
          />
          <Animated.View
            style={[styles.skeletonLine, { width: "40%", height: 10, opacity }]}
          />
        </View>
        <Animated.View style={[styles.skeletonBadge, { opacity }]} />
      </View>
      <View
        style={{
          marginTop: 16,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Animated.View
          style={[styles.skeletonLine, { width: "30%", height: 12, opacity }]}
        />
        <Animated.View
          style={[styles.skeletonLine, { width: "20%", height: 12, opacity }]}
        />
      </View>
      <View
        style={{
          marginTop: 16,
          borderTopWidth: 1,
          borderColor: "#f0f0f0",
          paddingTop: 12,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Animated.View style={[styles.skeletonBtn, { opacity }]} />
        <Animated.View style={[styles.skeletonBtn, { width: 100, opacity }]} />
      </View>
    </View>
  );
};

// --- 2. Extracted ScalePressable ---
const ScalePressable = ({ onPress, style, children, disabled }) => {
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
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- Custom Animated Toast ---
const ToastNotification = ({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: Platform.OS === "ios" ? 50 : 20,
        useNativeDriver: true,
        friction: 6,
        tension: 50,
      }).start();
      const timer = setTimeout(() => hide(), 3000);
      return () => clearTimeout(timer);
    } else hide();
  }, [visible]);

  const hide = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      if (onHide) onHide();
    });
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#00C853";
      case "error":
        return "#FF3D00";
      case "warning":
        return "#FFAB00";
      default:
        return "#212121";
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY }], backgroundColor: getBackgroundColor() },
      ]}
    >
      <View style={styles.toastContent}>
        {type === "success" ? (
          <CheckCircle size={20} color="#fff" strokeWidth={2.5} />
        ) : type === "error" ? (
          <AlertTriangle size={20} color="#fff" strokeWidth={2.5} />
        ) : (
          <WifiOff size={20} color="#fff" strokeWidth={2.5} />
        )}
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// --- 3. AppointmentCard ---
const AppointmentCard = React.memo(
  ({
    appointment,
    isAnyAppointmentStarted,
    blockingId,
    currentAppointmentId,
    showOtpInput,
    otp,
    otpError,
    onPressCard,
    onSkip,
    onUpdateStatus,
    onCollectPayment,
    onStart,
    onStartOffline,
    onVerifyOtp,
    onComplete,
    onCancelOtp,
    setOtp,
    showToast,
  }) => {
    const { theme } = useTheme();

    const isConfirmed = appointment.status === "confirmed";
    const isStarted = appointment.status === "started";
    const isPending = appointment.status === "pending";
    const isOfflineBooking = appointment.isOfflineBooking;
    const isPaymentDone =
      isOfflineBooking || appointment.paymentStatus !== "pending";

    const isReady = isConfirmed && isPaymentDone;
    const isChairBusy = isAnyAppointmentStarted;
    const isMyTurn = appointment._id === blockingId;

    const getStatusTheme = () => {
      if (isStarted)
        return { bg: "#E0F2F1", text: "#00695C", border: "#00BFA5" };
      if (!isPaymentDone && isConfirmed)
        return { bg: "#FFF3E0", text: "#E65100", border: "#FF9800" };
      if (isPending)
        return { bg: "#E3F2FD", text: "#1565C0", border: "#2979FF" };
      if (isConfirmed)
        return {
          bg: theme.colors.card,
          text: theme.colors.primary,
          border: theme.colors.primary,
        };
      return { bg: "#F5F5F5", text: "#616161", border: "#BDBDBD" };
    };

    const styleTheme = getStatusTheme();

    return (
      <ScalePressable
        style={styles.cardWrapper}
        onPress={() => onPressCard(appointment)}
      >
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View
            style={[styles.accentStrip, { backgroundColor: styleTheme.border }]}
          />
          <View style={styles.cardContent}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.customerName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {isOfflineBooking
                    ? appointment.customerName
                    : appointment.userId
                    ? appointment.userId.name
                    : "Unknown User"}
                </Text>
                {isOfflineBooking && (
                  <View style={styles.offlineTag}>
                    <Phone size={10} color="#757575" />
                    <Text style={styles.offlineTagText}>Walk-in Customer</Text>
                  </View>
                )}
              </View>
              <View
                style={[styles.statusBadge, { backgroundColor: styleTheme.bg }]}
              >
                <Text
                  style={[styles.statusBadgeText, { color: styleTheme.text }]}
                >
                  {!isPaymentDone && isConfirmed
                    ? "UNPAID"
                    : appointment.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Info Grid */}
            <View style={styles.infoRow}>
              <View style={styles.infoChip}>
                <Clock size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  {appointment.time}
                  {/* Show visual indicator if delay is present */}
                  {(appointment.tempDelayMinutes || 0) > 0 && (
                    <Text
                      style={{
                        color: "#D32F2F",
                        fontWeight: "700",
                        fontSize: 11,
                      }}
                    >
                      {" "}
                      (+Delay)
                    </Text>
                  )}
                </Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.infoChip}>
                <Scissors size={14} color={theme.colors.textSecondary} />
                <Text
                  style={[styles.infoText, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {appointment.appointmentType || "Standard Cut"}
                </Text>
              </View>
            </View>

            {/* Actions Footer */}
            <View
              style={[
                styles.cardFooter,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <View>
                <Text
                  style={[
                    styles.priceLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  TOTAL
                </Text>
                <Text
                  style={[styles.priceValue, { color: theme.colors.primary }]}
                >
                  ₹{appointment.totalPrice}
                </Text>
              </View>

              <View style={styles.actionGroup}>
                {isReady && !isStarted && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.iconButton,
                        { backgroundColor: "#F3E5F5" },
                      ]}
                      onPress={() => onSkip(appointment._id)}
                    >
                      <SkipForward size={20} color="#8E24AA" />
                    </TouchableOpacity>
                  </>
                )}

                {isPending && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.iconButton,
                        { backgroundColor: "#FFEBEE", marginRight: 8 },
                      ]}
                      onPress={() =>
                        onUpdateStatus(appointment._id, "cancelled")
                      }
                    >
                      <XCircle size={20} color="#D32F2F" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        { backgroundColor: "#00C853" },
                      ]}
                      onPress={() =>
                        onUpdateStatus(appointment._id, "confirmed")
                      }
                    >
                      <Text style={styles.primaryButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </>
                )}

                {isConfirmed && !isStarted && !isPaymentDone && (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { backgroundColor: "#FF6D00" },
                    ]}
                    onPress={() => onCollectPayment(appointment._id)}
                  >
                    <CreditCard
                      size={16}
                      color="#FFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.primaryButtonText}>Collect</Text>
                  </TouchableOpacity>
                )}

                {isReady && !isStarted && (
                  <>
                    {!isMyTurn && (
                      <View
                        style={[
                          styles.ghostButton,
                          { borderColor: theme.colors.border },
                        ]}
                      >
                        <Clock
                          size={16}
                          color={theme.colors.textSecondary}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.ghostButtonText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Wait
                        </Text>
                      </View>
                    )}
                    {isMyTurn && isChairBusy && (
                      <View
                        style={[
                          styles.ghostButton,
                          {
                            borderColor: theme.colors.border,
                            backgroundColor: "#f9f9f9",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.ghostButtonText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Busy
                        </Text>
                      </View>
                    )}
                    {isMyTurn && !isChairBusy && (
                      <TouchableOpacity
                        style={[
                          styles.primaryButton,
                          {
                            backgroundColor: theme.colors.primary,
                            shadowColor: theme.colors.primary,
                            shadowOpacity: 0.4,
                          },
                        ]}
                        onPress={() => onStart(appointment._id)}
                      >
                        <Text style={styles.primaryButtonText}>START</Text>
                        <ArrowRightCircle
                          size={16}
                          color="#FFF"
                          style={{ marginLeft: 6 }}
                        />
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {isStarted && (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { backgroundColor: "#00C853" },
                    ]}
                    onPress={() => onComplete(appointment._id)}
                  >
                    <CheckCircle
                      size={16}
                      color="#FFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.primaryButtonText}>Finish</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* OTP Input Section */}
            {showOtpInput && currentAppointmentId === appointment._id && (
              <View
                style={[
                  styles.otpContainer,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <View style={styles.otpHeader}>
                  <Text style={[styles.otpTitle, { color: theme.colors.text }]}>
                    {isOfflineBooking ? "Start Walk-in" : "Verify Customer"}
                  </Text>
                  <TouchableOpacity onPress={onCancelOtp}>
                    <XCircle size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {!isOfflineBooking && (
                  <View style={{ marginVertical: 10 }}>
                    <Text
                      style={[
                        styles.otpDesc,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Enter the 6-digit PIN from customer's app
                    </Text>
                    <OtpInput length={6} onComplete={setOtp} />
                    {otpError ? (
                      <Text style={styles.errorText}>{otpError}</Text>
                    ) : null}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.fullWidthButton,
                    {
                      backgroundColor: theme.colors.primary,
                      opacity: !isOfflineBooking && otp.length !== 6 ? 0.6 : 1,
                    },
                  ]}
                  disabled={!isOfflineBooking && otp.length !== 6}
                  onPress={
                    isOfflineBooking
                      ? () => onStartOffline(appointment._id)
                      : onVerifyOtp
                  }
                >
                  <Text style={styles.fullWidthButtonText}>
                    {isOfflineBooking ? "Start Session" : "Verify & Start"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScalePressable>
    );
  }
);

// --- Main Screen ---
const QueueManagementScreen = () => {
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const navigation = useNavigation();

  // State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAnyAppointmentStarted, setIsAnyAppointmentStarted] = useState(false);

  // NOTE: Local skip state logic removed. We now rely fully on backend state.

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = useCallback((message, type = "success") => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const activeAppointmentsForNav = useMemo(() => {
    return appointments.filter((app) => app.status !== "completed");
  }, [appointments]);

  const handlePressCard = useCallback(
    (appointment) => {
      navigation.navigate("AppointmentDetail", {
        appointment: appointment,
        activeAppointments: activeAppointmentsForNav,
        isAnyAppointmentStarted: isAnyAppointmentStarted,
      });
    },
    [navigation, activeAppointmentsForNav, isAnyAppointmentStarted]
  );

  const fetchAppointments = useCallback(
    async (date) => {
      setLoading(true);
      if (!user || typeof user._id !== "string") {
        setLoading(false);
        return;
      }
      const barberId = user._id;

      try {
        const formattedDate = format(date, "yyyy-MM-dd");
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/booking/barber-appointments/${barberId}?date=${formattedDate}`,
          {
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
          }
        );

        const text = await response.text();
        let data = text ? JSON.parse(text) : [];

        if (response.ok) {
          let appointmentsToDisplay = Array.isArray(data)
            ? data.filter(
                (booking) =>
                  ["pending", "confirmed", "started", "completed"].includes(
                    booking.status
                  ) && booking.paymentStatus !== "failed"
              )
            : [];

          // Animate the list change for smooth "Swap" effects
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          
          // The backend now returns appointments sorted by effective time. 
          // We trust the backend order completely.
          setAppointments(appointmentsToDisplay);
          
          setIsAnyAppointmentStarted(
            appointmentsToDisplay.some((app) => app.status === "started")
          );
        }
      } catch (error) {
        if (!error.message.includes("JSON")) showToast(error.message, "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, token, showToast]
  );

  // --- Handlers ---
  // Updated to use the new "Swap-Down" backend logic
  const handleSkipPress = useCallback(
    async (appointmentId) => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/booking/swap-down/${appointmentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
          }
        );

        if (response.ok) {
          showToast("Swapped with next customer", "success");
          // Refresh list to show new order from server
          fetchAppointments(selectedDate); 
        } else {
          const errorData = await response.json();
          showToast(errorData.msg || "Failed to skip", "error");
        }
      } catch (error) {
        showToast("Network error", "error");
      }
    },
    [token, selectedDate, fetchAppointments, showToast]
  );

  useEffect(() => {
    if (user && user._id) fetchAppointments(selectedDate);
  }, [selectedDate, user, fetchAppointments]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments(selectedDate);
  }, [fetchAppointments, selectedDate]);

  const handleCollectPayment = useCallback(
    (appointmentId) => {
      Alert.alert(
        "Confirm Payment",
        "Has the customer paid the total amount?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes, Mark Paid",
            onPress: () => {
              showToast("Payment Recorded", "success");
              setAppointments((prev) =>
                prev.map((a) =>
                  a._id === appointmentId
                    ? { ...a, paymentStatus: "completed" }
                    : a
                )
              );
            },
          },
        ]
      );
    },
    [showToast]
  );

  const handleStartPress = useCallback((appointmentId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentAppointmentId(appointmentId);
    setShowOtpInput(true);
    setOtp("");
    setOtpError("");
  }, []);

  const handleStartPressOffline = useCallback(
    async (appointmentId) => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/booking/verify-otp-and-start/${appointmentId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
            body: JSON.stringify({ otp: "OFFLINE" }),
          }
        );
        if (response.ok) {
          showToast("Session Started", "success");
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setShowOtpInput(false);
          setCurrentAppointmentId(null);
          // Fetch will re-sort the list naturally (Started goes to top)
          fetchAppointments(selectedDate);
        } else showToast("Failed to start", "error");
      } catch (error) {
        showToast(error.message, "error");
      }
    },
    [token, selectedDate, fetchAppointments, showToast]
  );

  const handleCompletePress = useCallback(
    async (appointmentId) => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/booking/complete/${appointmentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
          }
        );
        if (response.ok) {
          showToast("Completed!", "success");
          // Fetch will clear delays and re-sort naturally (Self-Healing)
          fetchAppointments(selectedDate);
        } else showToast("Failed", "error");
      } catch (error) {
        showToast(error.message, "error");
      }
    },
    [token, selectedDate, fetchAppointments, showToast]
  );

  const verifyOtpAndStart = useCallback(async () => {
    if (otp.length !== 6) {
      setOtpError("Enter 6 digits");
      return;
    }
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/booking/verify-otp-and-start/${currentAppointmentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({ otp }),
        }
      );
      if (response.ok) {
        showToast("Verified", "success");
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowOtpInput(false);
        setCurrentAppointmentId(null);
        setOtp("");
        // Fetch will re-sort list (Started goes to top)
        fetchAppointments(selectedDate);
      } else setOtpError("Invalid PIN");
    } catch (error) {
      showToast(error.message, "error");
    }
  }, [
    otp,
    currentAppointmentId,
    token,
    selectedDate,
    fetchAppointments,
    showToast,
  ]);

  const updateAppointmentStatus = useCallback(
    async (bookingId, newStatus, reason) => {
      try {
        let apiUrl =
          newStatus === "confirmed"
            ? `${process.env.EXPO_PUBLIC_API_URL}/api/booking/accept/${bookingId}`
            : `${process.env.EXPO_PUBLIC_API_URL}/api/booking/decline/${bookingId}`;
        const body =
          newStatus === "cancelled"
            ? { cancellationReason: reason || "Declined" }
            : {};
        const response = await fetch(apiUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
        });
        if (response.ok) {
          showToast(
            newStatus === "confirmed" ? "Accepted" : "Cancelled",
            "success"
          );
          fetchAppointments(selectedDate);
        } else showToast("Failed", "error");
      } catch (error) {
        showToast(error.message, "error");
      }
    },
    [token, selectedDate, fetchAppointments, showToast]
  );

  const handleCancelOtp = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowOtpInput(false);
  }, []);

  // --- Helpers ---
  const sectionsData = useMemo(() => {
    const pending = appointments.filter((app) => app.status === "pending");
    const active = appointments.filter(
      (app) => app.status === "confirmed" || app.status === "started"
    );
    const completed = appointments.filter((app) => app.status === "completed");

    return [
      {
        title: "Needs Action",
        data: pending,
        key: "pending",
        icon: AlertTriangle,
        color: "#FF9800",
      },
      {
        title: "In Queue",
        data: active,
        key: "active",
        icon: Clock,
        color: theme.colors.primary,
      },
      {
        title: "Done",
        data: completed,
        key: "completed",
        icon: CheckCircle,
        color: "#4CAF50",
      },
    ].filter((section) => section.data.length > 0);
  }, [appointments, theme.colors.primary]);

  const blockingId = useMemo(() => {
    const startedApp = appointments.find((a) => a.status === "started");
    if (startedApp) return startedApp._id;
    const activeSection = sectionsData.find((s) => s.key === "active");
    if (!activeSection || activeSection.data.length === 0) return null;
    const firstPaidApp = activeSection.data.find(
      (app) => app.isOfflineBooking || app.paymentStatus !== "pending"
    );
    return firstPaidApp ? firstPaidApp._id : null;
  }, [appointments, sectionsData]);

  const renderItem = useCallback(
    ({ item }) => (
      <AppointmentCard
        appointment={item}
        isAnyAppointmentStarted={isAnyAppointmentStarted}
        blockingId={blockingId}
        currentAppointmentId={currentAppointmentId}
        showOtpInput={showOtpInput}
        otp={otp}
        otpError={otpError}
        onPressCard={handlePressCard}
        onSkip={handleSkipPress}
        onUpdateStatus={updateAppointmentStatus}
        onCollectPayment={handleCollectPayment}
        onStart={handleStartPress}
        onStartOffline={handleStartPressOffline}
        onVerifyOtp={verifyOtpAndStart}
        onComplete={handleCompletePress}
        onCancelOtp={handleCancelOtp}
        setOtp={setOtp}
        showToast={showToast}
      />
    ),
    [
      isAnyAppointmentStarted,
      blockingId,
      currentAppointmentId,
      showOtpInput,
      otp,
      otpError,
      handlePressCard,
      handleSkipPress,
      updateAppointmentStatus,
      handleCollectPayment,
      handleStartPress,
      handleStartPressOffline,
      verifyOtpAndStart,
      handleCompletePress,
      handleCancelOtp,
      showToast,
    ]
  );

  const renderSectionHeader = ({
    section: { title, icon: Icon, color, data },
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      <View
        style={[styles.sectionLine, { backgroundColor: theme.colors.border }]}
      />
      <View style={[styles.countPill, { backgroundColor: color + "15" }]}>
        <Text style={[styles.countText, { color: color }]}>{data.length}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={theme.dark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={[styles.header, { backgroundColor: theme.colors.background }]}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backBtn, { backgroundColor: theme.colors.card }]}
              >
                <ChevronLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <View style={{ marginLeft: 12 }}>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Today's Queue
                </Text>
                <Text
                  style={[styles.headerTitle, { color: theme.colors.text }]}
                >
                  Manager
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() => navigation.navigate("QueueHistory")}
                style={[styles.iconBox, { backgroundColor: theme.colors.card }]}
              >
                <History size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionBar}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.datePill, { backgroundColor: theme.colors.card }]}
            >
              <Calendar size={16} color={theme.colors.primary} />
              <Text style={[styles.dateText, { color: theme.colors.text }]}>
                {format(selectedDate, "MMM dd, yyyy")}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() => navigation.navigate("OfflineBooking")}
                style={[
                  styles.addBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Plus size={18} color="#FFF" />
                <Text style={styles.addBtnText}>Walk-in</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRefresh}
                style={[
                  styles.refreshBtn,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <RefreshCcw size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}

        {loading ? (
          <View style={{ padding: 16 }}>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </View>
        ) : appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <Calendar
                size={48}
                color={theme.colors.primary}
                strokeWidth={1.5}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Bookings Yet
            </Text>
            <Text
              style={[styles.emptySub, { color: theme.colors.textSecondary }]}
            >
              Your queue is empty for {format(selectedDate, "MMMM do")}.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("OfflineBooking")}
              style={[
                styles.emptyBtn,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Plus size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.emptyBtnText}>Add Walk-in Customer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sectionsData}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
              />
            }
            stickySectionHeadersEnabled={false}
            initialNumToRender={8}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={Platform.OS === "android"}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  toastContent: { flexDirection: "row", alignItems: "center" },
  toastText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: { fontSize: 13, fontWeight: "700", marginLeft: 8 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginLeft: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13, marginLeft: 4 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  sectionLine: { flex: 1, height: 1, marginHorizontal: 12, opacity: 0.5 },
  countPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  countText: { fontSize: 12, fontWeight: "800" },
  cardWrapper: { marginBottom: 16 },
  card: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    overflow: "hidden",
  },
  accentStrip: {
    width: 6,
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  cardContent: { padding: 18, paddingLeft: 24 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  offlineTag: { flexDirection: "row", alignItems: "center" },
  offlineTagText: {
    fontSize: 11,
    color: "#757575",
    marginLeft: 4,
    fontWeight: "500",
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  infoChip: { flexDirection: "row", alignItems: "center" },
  infoText: { fontSize: 13, fontWeight: "600", marginLeft: 6 },
  verticalDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: "700",
    opacity: 0.6,
    letterSpacing: 0.5,
  },
  priceValue: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  actionGroup: { flexDirection: "row", alignItems: "center" },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
  },
  ghostButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  ghostButtonText: { fontSize: 12, fontWeight: "600" },
  otpContainer: { marginTop: 16, padding: 16, borderRadius: 12 },
  otpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  otpTitle: { fontSize: 15, fontWeight: "700" },
  otpDesc: { fontSize: 13, marginBottom: 12 },
  errorText: {
    color: "#FF3D00",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },
  fullWidthButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidthButtonText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptySub: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    opacity: 0.7,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  emptyBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  skeletonCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    height: 180,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  skeletonLine: { backgroundColor: "#f0f0f0", borderRadius: 4 },
  skeletonBadge: {
    width: 60,
    height: 20,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  skeletonBtn: {
    width: 80,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
  },
});

export default QueueManagementScreen;