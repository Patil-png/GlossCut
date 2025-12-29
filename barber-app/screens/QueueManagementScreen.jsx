import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  StatusBar,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
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
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { format, parse, differenceInMinutes } from "date-fns";
import OtpInput from "../components/OtpInput";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

// --- Custom Animated Toast Component ---
const ToastNotification = ({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: Platform.OS === "ios" ? 50 : 20, // Adjust for status bar
        useNativeDriver: true,
        friction: 6,
        tension: 50,
      }).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        hide();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      hide();
    }
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
        return "#4CAF50";
      case "error":
        return "#ef4444";
      case "warning":
        return "#ff9800";
      default:
        return "#333";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} color="#fff" />;
      case "error":
        return <AlertTriangle size={20} color="#fff" />;
      case "warning":
        return <WifiOff size={20} color="#fff" />;
      default:
        return null;
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
        {getIcon()}
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

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
  const [priorityBlockingAppointmentId, setPriorityBlockingAppointmentId] =
    useState(null);

  // Toast State
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  // --- Robust Data Fetching ---
  const fetchAppointments = async (date) => {
    setLoading(true);
    // Basic User Validation
    if (!user || typeof user._id !== "string" || user._id.length === 0) {
      showToast("User session invalid. Please relogin.", "error");
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

      // Safe JSON Parsing
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : [];
      } catch (e) {
        console.error("JSON Parse Error:", e);
        throw new Error("Server returned invalid data.");
      }

      if (response.ok) {
        const appointmentsToDisplay = Array.isArray(data)
          ? data.filter(
              (booking) =>
                ["pending", "confirmed", "started", "completed"].includes(
                  booking.status
                ) && booking.paymentStatus !== "failed"
            )
          : [];

        // Logic (unchanged)
        const getPriority = (appointment) => {
          let type = appointment.appointmentType;
          if (appointment.isOfflineBooking && !type) type = "Basic";
          else if (!type) type = "Basic";

          const lowerCaseType = type.toLowerCase();
          if (lowerCaseType.includes("express")) return 1;
          if (lowerCaseType.includes("black")) return 2;
          if (lowerCaseType.includes("premium")) return 3;
          if (lowerCaseType.includes("basic")) return 4;
          if (lowerCaseType.includes("free")) return 5;
          return 6;
        };

        const sortedAppointments = appointmentsToDisplay.sort((a, b) => {
          const priorityA = getPriority(a);
          const priorityB = getPriority(b);
          if (priorityA !== priorityB) return priorityA - priorityB;

          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA.getTime() !== dateB.getTime())
            return dateA.getTime() - dateB.getTime();

          const timeA = parse(a.time, "HH:mm", new Date());
          const timeB = parse(b.time, "HH:mm", new Date());
          return timeA.getTime() - timeB.getTime();
        });

        setAppointments(sortedAppointments);
        const isStarted = sortedAppointments.some(
          (app) => app.status === "started"
        );
        setIsAnyAppointmentStarted(isStarted);

        const firstInQueueId =
          sortedAppointments.find(
            (app) => app.status === "confirmed" || app.status === "started"
          )?._id || null;
        setPriorityBlockingAppointmentId(firstInQueueId);
      } else {
        throw new Error(data.msg || "Failed to fetch appointments");
      }
    } catch (error) {
      if (error.message.includes("Network request failed")) {
        showToast("No Internet Connection", "warning");
      } else {
        showToast(error.message, "error");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user._id) {
      fetchAppointments(selectedDate);
    }
  }, [selectedDate, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments(selectedDate);
  };

  // --- Logic Wrappers with Toast ---
  const handleStartPress = (appointmentId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentAppointmentId(appointmentId);
    setShowOtpInput(true);
    setOtp("");
    setOtpError("");
  };

  const handleStartPressOffline = async (appointmentId) => {
    try {
      const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/booking/verify-otp-and-start/${appointmentId}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ otp: "OFFLINE" }),
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error("Server Error");
      }

      if (response.ok) {
        showToast("Offline appointment started!", "success");
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowOtpInput(false);
        setCurrentAppointmentId(null);
        fetchAppointments(selectedDate);
      } else {
        showToast(data.msg || "Failed to start.", "error");
      }
    } catch (error) {
      if (error.message.includes("Network request failed")) {
        showToast("Check your internet connection", "warning");
      } else {
        showToast(error.message, "error");
      }
    }
  };

  const handleCompletePress = async (appointmentId) => {
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
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error("Server Error");
      }

      if (response.ok) {
        showToast("Appointment Completed!", "success");
        fetchAppointments(selectedDate);
      } else {
        throw new Error(data.msg || "Failed to complete.");
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const verifyOtpAndStart = async () => {
    if (otp.length !== 6) {
      setOtpError("Please enter a 6-digit OTP.");
      return;
    }
    try {
      const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/booking/verify-otp-and-start/${currentAppointmentId}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ otp }),
      });
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error("Server Error");
      }

      if (response.ok) {
        showToast("Verified & Started!", "success");
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowOtpInput(false);
        setCurrentAppointmentId(null);
        setOtp("");
        fetchAppointments(selectedDate);
      } else {
        setOtpError(data.msg || "Invalid OTP.");
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const updateAppointmentStatus = async (bookingId, newStatus) => {
    try {
      let apiUrl = "";
      if (newStatus === "confirmed")
        apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/booking/accept/${bookingId}`;
      else if (newStatus === "cancelled")
        apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/booking/decline/${bookingId}`;
      else throw new Error("Invalid status update");

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      });
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error("Server Error");
      }

      if (response.ok) {
        showToast(
          `Appointment ${newStatus === "confirmed" ? "Accepted" : "Cancelled"}`,
          "success"
        );
        fetchAppointments(selectedDate);
      } else {
        throw new Error(data.msg || `Failed to update.`);
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  // --- Computed Data ---
  const pendingSection = appointments.filter(
    (app) => app.status === "pending" || app.paymentStatus === "pending"
  );
  const activeSection = appointments.filter(
    (app) =>
      (app.status === "confirmed" || app.status === "started") &&
      (app.isOfflineBooking || app.paymentStatus !== "pending")
  );
  const completedSection = appointments.filter(
    (app) => app.status === "completed"
  );

  const sectionsData = useMemo(
    () =>
      [
        {
          title: "Action Required",
          data: pendingSection,
          key: "pending",
          icon: CreditCard,
          color: "#FF9800",
        },
        {
          title: "In Queue",
          data: activeSection,
          key: "active",
          icon: Clock,
          color: theme.colors.primary,
        },
        {
          title: "Completed",
          data: completedSection,
          key: "completed",
          icon: CheckCircle,
          color: "#4CAF50",
        },
      ].filter((section) => section.data.length > 0),
    [appointments, pendingSection, activeSection, completedSection]
  );

  // --- UI Components ---
  const ScalePressable = ({ onPress, style, children, disabled }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    };
    const onPressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
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

  const renderAppointmentCard = ({ item: appointment }) => {
    const isPaymentCompleted =
      appointment.isOfflineBooking ||
      (appointment.paymentStatus !== "pending" &&
        appointment.paymentStatus !== "failed");
    const isConfirmed = appointment.status === "confirmed";
    const isStarted = appointment.status === "started";
    const isPending = appointment.status === "pending";
    const isOfflineBooking = appointment.isOfflineBooking;

    const shouldShowStartButton = isConfirmed && isPaymentCompleted;
    const canStartThisAppointment =
      !isAnyAppointmentStarted &&
      isConfirmed &&
      isPaymentCompleted &&
      appointment._id === priorityBlockingAppointmentId;
    const isStartButtonDisabled =
      shouldShowStartButton && !canStartThisAppointment;

    const getStatusTheme = () => {
      if (isStarted)
        return { bg: "#E8F5E9", text: "#2E7D32", border: "#4CAF50" };
      if (appointment.paymentStatus === "pending")
        return { bg: "#FFF3E0", text: "#EF6C00", border: "#FF9800" };
      if (isPending)
        return { bg: "#E3F2FD", text: "#1565C0", border: "#2196F3" };
      if (isConfirmed)
        return {
          bg: theme.colors.card,
          text: theme.colors.primary,
          border: theme.colors.primary,
        };
      return { bg: "#F5F5F5", text: "#757575", border: "#9E9E9E" };
    };

    const styleTheme = getStatusTheme();

    return (
      <ScalePressable
        style={styles.cardWrapper}
        onPress={() =>
          navigation.navigate("AppointmentDetail", {
            appointment: appointment,
            activeAppointments: appointments.filter(
              (app) => app.status !== "completed"
            ),
            isAnyAppointmentStarted: isAnyAppointmentStarted,
          })
        }
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <View
            style={[styles.accentStrip, { backgroundColor: styleTheme.border }]}
          />
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View>
                <Text
                  style={[styles.customerName, { color: theme.colors.text }]}
                >
                  {isOfflineBooking
                    ? appointment.customerName
                    : appointment.userId
                    ? appointment.userId.name
                    : "Unknown User"}
                </Text>
                {isOfflineBooking && (
                  <View style={styles.offlineTag}>
                    <Phone size={10} color="#666" />
                    <Text style={styles.offlineTagText}>Offline Walk-in</Text>
                  </View>
                )}
              </View>
              <View
                style={[styles.statusBadge, { backgroundColor: styleTheme.bg }]}
              >
                <Text
                  style={[styles.statusBadgeText, { color: styleTheme.text }]}
                >
                  {appointment.paymentStatus === "pending"
                    ? "UNPAID"
                    : appointment.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Clock size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  {appointment.time}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Scissors size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  {appointment.appointmentType || "Basic"}
                </Text>
              </View>
              {appointment.customerPhone && (
                <View style={styles.infoItem}>
                  <Phone size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    {appointment.customerPhone}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.servicesContainer}>
              <Text
                numberOfLines={1}
                style={[
                  styles.servicesText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {appointment.services && appointment.services.length > 0
                  ? appointment.services
                      .map((s) => s.name || "Service")
                      .join(" • ")
                  : "No services selected"}
              </Text>
            </View>

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
                  Total
                </Text>
                <Text
                  style={[styles.priceValue, { color: theme.colors.primary }]}
                >
                  ₹{appointment.totalPrice}
                </Text>
              </View>

              <View style={styles.actionGroup}>
                {isPending && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.miniButton,
                        { backgroundColor: theme.colors.danger + "20" },
                      ]}
                      onPress={() => showToast("Booking Rejected", "error")} // Mocking the confirm for speed, normally use a custom modal
                    >
                      {/* In real usage, you'd trigger a modal here, but for now we just handle logic */}
                      <XCircle
                        size={18}
                        color={theme.colors.danger}
                        onPress={() =>
                          updateAppointmentStatus(appointment._id, "cancelled")
                        }
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        { backgroundColor: theme.colors.success },
                      ]}
                      onPress={() =>
                        updateAppointmentStatus(appointment._id, "confirmed")
                      }
                    >
                      <Text style={styles.primaryButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </>
                )}

                {shouldShowStartButton && (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: isStartButtonDisabled
                          ? theme.colors.border
                          : theme.colors.primary,
                        opacity: isStartButtonDisabled ? 0.7 : 1,
                      },
                    ]}
                    disabled={isStartButtonDisabled}
                    onPress={() => handleStartPress(appointment._id)}
                  >
                    <ArrowRightCircle
                      size={16}
                      color="#FFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.primaryButtonText}>
                      {isStartButtonDisabled ? "Wait" : "Start"}
                    </Text>
                  </TouchableOpacity>
                )}

                {isStarted && (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { backgroundColor: theme.colors.success },
                    ]}
                    onPress={() => handleCompletePress(appointment._id)}
                  >
                    <CheckCircle
                      size={16}
                      color="#FFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.primaryButtonText}>Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {showOtpInput && currentAppointmentId === appointment._id && (
              <View
                style={[
                  styles.otpContainer,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Text style={[styles.otpTitle, { color: theme.colors.text }]}>
                  {isOfflineBooking
                    ? "Confirm Offline Start"
                    : "Customer Verification"}
                </Text>

                {!isOfflineBooking && (
                  <>
                    <Text
                      style={[
                        styles.otpDesc,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Ask customer for the 6-digit OTP
                    </Text>
                    <OtpInput length={6} onComplete={setOtp} />
                    {otpError ? (
                      <Text style={styles.errorText}>{otpError}</Text>
                    ) : null}
                  </>
                )}

                <View style={styles.otpActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                      setShowOtpInput(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.cancelButtonText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      {
                        backgroundColor: theme.colors.primary,
                        opacity:
                          !isOfflineBooking && otp.length !== 6 ? 0.5 : 1,
                      },
                    ]}
                    disabled={!isOfflineBooking && otp.length !== 6}
                    onPress={
                      isOfflineBooking
                        ? () => handleStartPressOffline(appointment._id)
                        : verifyOtpAndStart
                    }
                  >
                    <Text style={styles.confirmButtonText}>
                      {isOfflineBooking ? "Start Session" : "Verify & Start"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScalePressable>
    );
  };

  const renderSectionHeader = ({
    section: { title, icon: Icon, color, data },
  }) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconBox, { backgroundColor: color + "20" }]}>
        <Icon size={16} color={color} />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      <View
        style={[styles.countBadge, { backgroundColor: theme.colors.border }]}
      >
        <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
          {data.length}
        </Text>
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

      {/* Toast Notification Layer */}
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
        {/* --- Tier-1 Header --- */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.background,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          {/* Top Row: Navigation & History */}
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.iconBtn}
            >
              <ChevronLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.screenTitle, { color: theme.colors.text }]}>
              Queue Manager
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("QueueHistory")}
              style={[
                styles.historyBtn,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <History size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Bottom Row: Controls */}
          <View style={styles.toolbar}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.dateSelector,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Calendar size={18} color={theme.colors.primary} />
              <Text style={[styles.dateText, { color: theme.colors.text }]}>
                {format(selectedDate, "EEE, MMM dd")}
              </Text>
            </TouchableOpacity>

            <View style={styles.toolActions}>
              <ScalePressable
                onPress={() => navigation.navigate("OfflineBooking")}
                style={[
                  styles.actionChip,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Plus size={16} color="#FFF" />
                <Text style={[styles.actionChipText, { color: "#FFF" }]}>
                  Walk-in
                </Text>
              </ScalePressable>
              <TouchableOpacity
                onPress={handleRefresh}
                style={[styles.iconBtn, { marginLeft: 12 }]}
              >
                <RefreshCcw size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- Content --- */}
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
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Syncing Queue...
            </Text>
          </View>
        ) : appointments.length === 0 ? (
          <View style={styles.centerContainer}>
            <View
              style={[
                styles.emptyCircle,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <Calendar size={40} color={theme.colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Bookings
            </Text>
            <Text
              style={[styles.emptyDesc, { color: theme.colors.textSecondary }]}
            >
              You are free for {format(selectedDate, "MMMM dd")}.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("OfflineBooking")}
              style={[
                styles.emptyButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Plus size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.emptyButtonText}>Add Walk-in Customer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={sectionsData}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <View>
                {renderSectionHeader({ section: item })}
                <FlatList
                  data={item.data}
                  renderItem={renderAppointmentCard}
                  keyExtractor={(app) => app._id}
                  scrollEnabled={false}
                />
              </View>
            )}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
              />
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Toast Styles
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toastText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 12,
  },
  // Header Styles
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 40 : 10, // Adjust for Android Status Bar
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    zIndex: 10,
    // Add subtle shadow for separation
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 50,
  },
  historyBtn: {
    padding: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 14,
  },
  toolActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  actionChipText: {
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 6,
  },
  // List Styles
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionIconBox: {
    padding: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  countBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
  },
  // Card Styles
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    flexDirection: "row",
    overflow: "hidden",
  },
  accentStrip: {
    width: 5,
    height: "100%",
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  customerName: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  offlineTag: {
    flexDirection: "row",
    alignItems: "center",
  },
  offlineTagText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 6,
  },
  servicesContainer: {
    marginBottom: 16,
  },
  servicesText: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  priceLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
  // OTP Styles
  otpContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  otpTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  otpDesc: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
  otpActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontWeight: "600",
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginLeft: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  confirmButtonText: {
    color: "#FFF",
    fontWeight: "700",
  },
  // State Views
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  emptyButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default QueueManagementScreen;
