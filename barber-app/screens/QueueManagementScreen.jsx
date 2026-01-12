import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
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
import { format, parse } from "date-fns";
import OtpInput from "../components/OtpInput";

// Enable LayoutAnimation
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
        toValue: Platform.OS === "ios" ? 50 : 20,
        useNativeDriver: true,
        friction: 6,
        tension: 50,
      }).start();

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

  // Memory for skips (Used only during initial fetch to restore state)
  const [localSkips, setLocalSkips] = useState({}); 

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

  // --- LOGIC: DIRECT SWAP (Ignores Appointment Type) ---
  const handleSkipPress = (appointmentId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // 1. Update Memory (for future refreshes)
    setLocalSkips(prev => ({
        ...prev,
        [appointmentId]: (prev[appointmentId] || 0) + 1
    }));

    // 2. Perform Physical Swap in Array
    setAppointments((prevAppointments) => {
      const currentIndex = prevAppointments.findIndex((a) => a._id === appointmentId);
      if (currentIndex === -1) return prevAppointments;

      // Find the NEXT appointment that is actually in the "Active" queue (Confirmed/Started)
      // We need to skip over "Pending" or "Completed" items if they are mixed in between.
      let swapIndex = -1;
      
      for (let i = currentIndex + 1; i < prevAppointments.length; i++) {
          const item = prevAppointments[i];
          if (item.status === 'confirmed' || item.status === 'started') {
              swapIndex = i;
              break;
          }
      }

      const newQueue = [...prevAppointments];
      const currentApp = { ...newQueue[currentIndex] };
      
      // Increment Skip Count
      currentApp.skipCount = (currentApp.skipCount || 0) + 1;

      if (swapIndex !== -1) {
          // SWAP FOUND: Exchange positions
          const swapApp = newQueue[swapIndex];
          
          newQueue[currentIndex] = swapApp;
          newQueue[swapIndex] = currentApp;

          showToast("Customer swapped with next.", "default");
      } else {
          // NO ONE BELOW: Just update the object in place
          newQueue[currentIndex] = currentApp;
          showToast("Customer delayed (Last in queue).", "warning");
      }

      return newQueue;
    });
  };

  // --- Data Fetching ---
  const fetchAppointments = async (date) => {
    setLoading(true);
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

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : [];
      } catch (e) {
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

        // --- INITIAL SORTING (Standard Logic) ---
        // We only use this on load/refresh. Skip button manually overrides this order.
        const getPriority = (appointment) => {
            let type = appointment.appointmentType || "Basic";
            if (appointment.isOfflineBooking) type = "Basic"; 
            const lowerCaseType = type.toLowerCase();
            if (lowerCaseType.includes("express")) return 1; 
            if (lowerCaseType.includes("black")) return 2;
            if (lowerCaseType.includes("premium")) return 3;
            if (lowerCaseType.includes("basic")) return 4;
            return 5; 
        };

        const dataWithSkips = appointmentsToDisplay.map(app => ({
            ...app,
            skipCount: localSkips[app._id] || app.skipCount || 0 
        }));

        const sortedAppointments = dataWithSkips.sort((a, b) => {
          if(a.status === 'started') return -1;
          if(b.status === 'started') return 1;

          const priorityA = getPriority(a);
          const priorityB = getPriority(b);
          
          if (priorityA !== priorityB) return priorityA - priorityB;

          // Time Sort
          const getTime = (app) => {
             const base = parse(app.time, "HH:mm", new Date()).getTime();
             // We add a penalty here only for initial load sorting
             return base + ((app.skipCount || 0) * 1800000);
          };
          return getTime(a) - getTime(b);
        });
        
        setAppointments(sortedAppointments);

        const isStarted = sortedAppointments.some(
          (app) => app.status === "started"
        );
        setIsAnyAppointmentStarted(isStarted);
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

  // --- Handlers ---
  const handleCollectPayment = (appointmentId) => {
    Alert.alert(
      "Confirm Payment",
      "Has the customer paid the total amount in cash?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Mark Paid",
          onPress: () => {
            showToast("Payment Recorded", "success");
            setAppointments(prev => prev.map(a => 
                a._id === appointmentId ? {...a, paymentStatus: 'completed'} : a
            ));
          },
        },
      ]
    );
  };

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

      if (response.ok) {
        showToast("Offline appointment started!", "success");
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowOtpInput(false);
        setCurrentAppointmentId(null);
        fetchAppointments(selectedDate);
      } else {
        showToast("Failed to start.", "error");
      }
    } catch (error) {
      showToast(error.message, "error");
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

      if (response.ok) {
        showToast("Appointment Completed!", "success");
        fetchAppointments(selectedDate);
      } else {
        showToast("Failed to complete.", "error");
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
      let data = text ? JSON.parse(text) : {};

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

  const updateAppointmentStatus = async (bookingId, newStatus, cancellationReason = null) => {
    try {
      let apiUrl = "";
      let body = {};

      if (newStatus === "confirmed")
        apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/booking/accept/${bookingId}`;
      else if (newStatus === "cancelled") {
        apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/booking/decline/${bookingId}`;
        body = { cancellationReason: cancellationReason || "Booking declined by barber" };
      }

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
          `Appointment ${newStatus === "confirmed" ? "Accepted" : "Cancelled"}`,
          "success"
        );
        fetchAppointments(selectedDate);
      } else {
        showToast(`Failed to update.`, "error");
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  // --- Computed Data ---
  const sectionsData = useMemo(() => {
    const pending = appointments.filter((app) => app.status === "pending");
    // Active section respects the manual swap order in the 'appointments' state
    const active = appointments.filter(
      (app) => app.status === "confirmed" || app.status === "started"
    );
    const completed = appointments.filter((app) => app.status === "completed");

    return [
      {
        title: "Approvals Required",
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
        title: "Completed",
        data: completed,
        key: "completed",
        icon: CheckCircle,
        color: "#4CAF50",
      },
    ].filter((section) => section.data.length > 0);
  }, [appointments, theme.colors.primary]);

  // --- STRICT QUEUE LOGIC HELPER ---
  const blockingId = useMemo(() => {
    // 1. If someone is started, they are the blocking ID.
    const startedApp = appointments.find((a) => a.status === "started");
    if (startedApp) return startedApp._id;

    const activeSection = sectionsData.find(s => s.key === 'active');
    if (!activeSection || activeSection.data.length === 0) return null;

    // 2. Find the FIRST appointment that is actually PAID (or Offline).
    // The list is already sorted by the user's manual swaps or priority.
    const firstPaidApp = activeSection.data.find(app => 
      app.isOfflineBooking || app.paymentStatus !== 'pending'
    );

    return firstPaidApp ? firstPaidApp._id : null;
  }, [appointments, sectionsData]);


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
    const isConfirmed = appointment.status === "confirmed";
    const isStarted = appointment.status === "started";
    const isPending = appointment.status === "pending";
    const isOfflineBooking = appointment.isOfflineBooking;

    const isPaymentDone = isOfflineBooking || appointment.paymentStatus !== "pending";
    
    // "Ready" means Confirmed AND Paid (or offline)
    const isReady = isConfirmed && isPaymentDone;
    const isChairBusy = isAnyAppointmentStarted;

    // Strict Turn Check
    const isMyTurn = appointment._id === blockingId;

    const getStatusTheme = () => {
      if (isStarted)
        return { bg: "#E8F5E9", text: "#2E7D32", border: "#4CAF50" };
      if (!isPaymentDone && isConfirmed)
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
                  {!isPaymentDone && isConfirmed
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
                  {(appointment.skipCount || 0) > 0 && 
                     <Text style={{color: '#D32F2F', fontSize: 10}}> (Delayed)</Text>
                  }
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Scissors size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  {appointment.appointmentType || "Basic"}
                </Text>
              </View>
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
                
                {/* SKIP / CANCEL BUTTON */}
                {isReady && !isStarted && (
                  <>
                    {(appointment.skipCount || 0) < 2 ? (
                      <TouchableOpacity
                        style={[
                          styles.miniButton,
                          { backgroundColor: "#F3E5F5", marginRight: 8 },
                        ]}
                        onPress={() => handleSkipPress(appointment._id)}
                      >
                        <SkipForward size={18} color="#9C27B0" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.miniButton,
                          { backgroundColor: "#FFEBEE", marginRight: 8 },
                        ]}
                        onPress={() => {
                          Alert.alert(
                            "Remove from Queue?",
                            "Customer has been skipped twice. Mark as No-Show?",
                            [
                              { text: "No", style: "cancel" },
                              {
                                text: "Yes, Remove",
                                style: "destructive",
                                onPress: () => updateAppointmentStatus(appointment._id, "cancelled", "Cancelled due to skipping")
                              }
                            ]
                          );
                        }}
                      >
                        <XCircle size={18} color="#D32F2F" />
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {isPending && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.miniButton,
                        { backgroundColor: theme.colors.danger + "20" },
                      ]}
                      onPress={() => showToast("Booking Rejected", "error")}
                    >
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

                {/* COLLECT CASH BUTTON (Only if Unpaid) */}
                {isConfirmed && !isStarted && !isPaymentDone && (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { backgroundColor: "#FF9800" },
                    ]}
                    onPress={() => handleCollectPayment(appointment._id)}
                  >
                    <CreditCard
                      size={16}
                      color="#FFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.primaryButtonText}>Collect Cash</Text>
                  </TouchableOpacity>
                )}

                {/* --- STRICT START BUTTON LOGIC --- */}
                {/* Only renders if user is Ready (Paid/Offline) */}
                
                {isReady && !isStarted && (
                   <>
                      {/* Case: Paid but NOT First in line */}
                      {!isMyTurn && (
                        <View
                          style={[
                            styles.primaryButton,
                            { backgroundColor: theme.colors.border },
                          ]}
                        >
                          <Clock size={16} color="#666" style={{ marginRight: 6 }} />
                          <Text style={[styles.primaryButtonText, { color: "#666" }]}>
                            Wait
                          </Text>
                        </View>
                      )}

                      {/* Case: Paid, First, but Chair Busy */}
                      {isMyTurn && isChairBusy && (
                        <View
                          style={[
                            styles.primaryButton,
                            { backgroundColor: theme.colors.border },
                          ]}
                        >
                          <Text style={[styles.primaryButtonText, { color: "#666" }]}>
                            Wait (Busy)
                          </Text>
                        </View>
                      )}

                      {/* Case: Paid, First, Chair Free */}
                      {isMyTurn && !isChairBusy && (
                        <TouchableOpacity
                          style={[
                            styles.primaryButton,
                            { backgroundColor: theme.colors.primary },
                          ]}
                          onPress={() => handleStartPress(appointment._id)}
                        >
                          <ArrowRightCircle
                            size={16}
                            color="#FFF"
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.primaryButtonText}>Start</Text>
                        </TouchableOpacity>
                      )}
                   </>
                )}

                {/* Case: Started */}
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

            {/* OTP Input Section */}
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
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.background,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
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
          <SectionList
            sections={sectionsData}
            keyExtractor={(item) => item._id}
            renderItem={renderAppointmentCard}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    zIndex: 10,
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
