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
  Modal,
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
  HelpCircle,
  Info,
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

// --- Custom Animated Alert ---
const CustomAlert = ({ visible, title, message, actions, type = 'info', onClose }) => {
  const [show, setShow] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.poly(4)),
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShow(false));
    }
  }, [visible]);

  if (!show) return null;

  // Icon Logic
  let IconComponent = Info;
  let iconColor = "#2196F3";
  let bgIconColor = "#E3F2FD";

  if (type === 'success') {
    IconComponent = CheckCircle;
    iconColor = "#4CAF50";
    bgIconColor = "#E8F5E9";
  } else if (type === 'destructive' || type === 'error') {
    IconComponent = AlertTriangle;
    iconColor = "#F44336";
    bgIconColor = "#FFEBEE";
  } else if (type === 'warning') {
    IconComponent = AlertTriangle;
    iconColor = "#FF9800";
    bgIconColor = "#FFF3E0";
  }

  return (
    <Modal transparent visible={show} animationType="none" onRequestClose={onClose}>
      <View style={styles.alertOverlay}>
        <Animated.View style={[styles.alertContainer, { opacity, transform: [{ scale }] }]}>

          {/* Icon Header */}
          <View style={[styles.alertIconBubble, { backgroundColor: bgIconColor }]}>
            <IconComponent size={32} color={iconColor} strokeWidth={2.5} />
          </View>

          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>

          <View style={styles.alertActions}>
            {actions && actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={action.onPress}
                style={[
                  styles.alertButton,
                  action.style === 'cancel' ? styles.alertButtonCancel : styles.alertButtonConfirm,
                  action.style === 'destructive' && { backgroundColor: '#FFEBEE' },
                  // Use primary color for verify/confirm actions not marked destructive
                  (!action.style || action.style === 'default') && type === 'success' && { backgroundColor: '#4CAF50' },
                  (!action.style || action.style === 'default') && type === 'warning' && { backgroundColor: '#FF9800' },
                  (!action.style || action.style === 'default') && type !== 'success' && type !== 'warning' && type !== 'destructive' && { backgroundColor: '#2196F3' }
                ]}
              >
                <Text style={[
                  styles.alertButtonText,
                  action.style === 'cancel' ? styles.alertButtonTextCancel : styles.alertButtonTextConfirm,
                  action.style === 'destructive' && { color: '#D32F2F' }
                ]}>
                  {action.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
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
    onPromote,
    offlineExpressCount,
    MAX_OFFLINE_EXPRESS,
    onAlmostDone,
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

    // --- SKIPS COUNT CHECK ---
    const skipCount = appointment.skipCount || 0;
    // Show Cancel button ONLY if skipped 2 or more times
    const showDangerCancel = isConfirmed && !isStarted && skipCount >= 2;

    // --- EXPRESS CHECK ---
    const isExpress =
      (appointment.appointmentType &&
        appointment.appointmentType.toLowerCase().includes("express")) ||
      appointment.isPromoted;

    const canPromote =
      !isExpress &&
      isConfirmed &&
      offlineExpressCount < MAX_OFFLINE_EXPRESS;

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
                <View style={{ flexDirection: "row", alignItems: "center" }}>
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
                  {isExpress && (
                    <View
                      style={{
                        backgroundColor: "#FFD700",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        marginLeft: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "800",
                          color: "#000",
                        }}
                      >
                        EXPRESS
                      </Text>
                    </View>
                  )}
                </View>

                {isOfflineBooking && (
                  <View style={styles.offlineTag}>
                    <Phone size={10} color="#757575" />
                    <Text style={styles.offlineTagText}>Walk-in Customer</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* EXPLANATION ICON */}
                <TouchableOpacity
                  onPress={() => {
                    let title = "Queue Position";
                    let msg = "This customer is in the standard queue based on their arrival time.";

                    const delay = appointment.tempDelayMinutes || 0;
                    const skips = appointment.skipCount || 0;

                    if (delay > 500) {
                      title = "⚠️ Demoted Priority";
                      msg = `This customer was skipped ${skips} time(s). They have been effectively moved to the Basic Queue (+${delay}m penalty) to let others pass.`;
                    } else if (isExpress) {
                      title = "⚡ Express Priority";
                      msg = "This customer booked 'Express' and is prioritized at the front of the line.";
                    } else if (delay > 0) {
                      title = "Delayed";
                      msg = `This customer was skipped and pushed back by ${delay} minutes.`;
                    }

                    Alert.alert(title, msg);
                  }}
                  style={{ marginRight: 8 }}
                >
                  <HelpCircle size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: styleTheme.bg },
                  ]}
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
            </View>

            {/* Info Grid */}
            <View style={styles.infoRow}>
              <View style={styles.infoChip}>
                <Clock size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  {(() => {
                    const timeStr = appointment.time || "00:00";
                    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
                    if (!match) return timeStr;

                    let hours = parseInt(match[1]);
                    let minutes = parseInt(match[2]);

                    let totalMins = 0;
                    if (appointment.services && appointment.services.length > 0) {
                      appointment.services.forEach(s => {
                        if (s.time) {
                          const durationMatch = String(s.time).match(/(\d+)/);
                          if (durationMatch) totalMins += parseInt(durationMatch[1], 10);
                        }
                      });
                    }

                    if (totalMins === 0) {
                      totalMins = 30; // Default
                    }

                    minutes += totalMins;
                    hours += Math.floor(minutes / 60);
                    minutes = minutes % 60;

                    const hStr = hours < 10 ? '0' + hours : '' + hours;
                    const mStr = minutes < 10 ? '0' + minutes : '' + minutes;
                    return `${timeStr} - ${hStr}:${mStr}`;
                  })()}
                  {(appointment.tempDelayMinutes || 0) > 0 && (
                    <Text
                      style={{
                        color: "#D32F2F",
                        fontWeight: "700",
                        fontSize: 11,
                      }}
                    >
                      {" "}
                      (+{appointment.tempDelayMinutes}m)
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
                  {isOfflineBooking && appointment.services?.length > 0
                    ? appointment.services.map((s) => s.name).join(", ")
                    : appointment.appointmentType || "Standard Cut"}
                </Text>
              </View>
            </View>

            {/* VISUAL WARNING FOR HIGH SKIPS */}
            {skipCount > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <AlertTriangle
                  size={12}
                  color={skipCount >= 2 ? "#D32F2F" : "#FFA000"}
                />
                <Text
                  style={{
                    fontSize: 11,
                    color: skipCount >= 2 ? "#D32F2F" : "#FFA000",
                    marginLeft: 4,
                    fontWeight: "600",
                  }}
                >
                  Skipped {skipCount} time{skipCount > 1 ? "s" : ""}
                </Text>
              </View>
            )}

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
                  style={[
                    styles.priceValue,
                    { color: theme.colors.primary },
                  ]}
                >
                  ₹{appointment.totalPrice}
                </Text>
              </View>

              <View style={styles.actionGroup}>
                {/* 1. SKIP BUTTON - Visible only if NOT cancelled yet */}
                {isReady && !isStarted && (
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      { backgroundColor: "#F3E5F5" },
                    ]}
                    onPress={() => onSkip(appointment._id)}
                  >
                    <SkipForward size={20} color="#8E24AA" />
                  </TouchableOpacity>
                )}

                {/* 2. PENDING ACTIONS (Cancel/Accept) */}
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

                {/* 3. DANGER CANCEL: Only Visible if Skipped >= 2 times */}
                {showDangerCancel && (
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      { backgroundColor: "#FFEBEE", marginRight: 8 },
                    ]}
                    onPress={() => {
                      Alert.alert(
                        "Cancel High-Delay Booking?",
                        "This customer has been skipped multiple times. Cancel immediately?",
                        [
                          { text: "No", style: "cancel" },
                          {
                            text: "Yes, Cancel",
                            style: "destructive",
                            onPress: () =>
                              onUpdateStatus(
                                appointment._id,
                                "cancelled",
                                "Cancelled by Barber due to excessive delays"
                              ),
                          },
                        ]
                      );
                    }}
                  >
                    <XCircle size={20} color="#D32F2F" />
                  </TouchableOpacity>
                )}

                {isConfirmed && !isStarted && !isPaymentDone && (
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        { backgroundColor: "#FF6D00", marginRight: 8 }, // Orange for Collect
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

                    {/* NEW: Cancel Option for Stuck Payments */}
                    <TouchableOpacity
                      style={[
                        styles.iconButton,
                        { backgroundColor: "#FFEBEE" }, // Light Red
                      ]}
                      onPress={() => {
                        Alert.alert(
                          "Cancel Unpaid Booking?",
                          "If payment failed or cannot be collected, you can cancel this booking to clear the queue.",
                          [
                            { text: "No", style: "cancel" },
                            {
                              text: "Yes, Cancel",
                              style: "destructive",
                              onPress: () =>
                                onUpdateStatus(
                                  appointment._id,
                                  "cancelled",
                                  "Cancelled by Barber (Payment Failed/Manual)"
                                ),
                            },
                          ]
                        );
                      }}
                    >
                      <XCircle size={20} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* 5. START/WAIT ACTIONS */}
                {isReady && !isStarted && (
                  <>
                    {/* Promote to Express (Offline Only) */}
                    {canPromote && (
                      <TouchableOpacity
                        style={[
                          styles.iconButton,
                          {
                            backgroundColor: "#FFF9C4",
                            marginRight: 8,
                            width: 36,
                            height: 36,
                          },
                        ]}
                        onPress={() => onPromote(appointment._id)}
                      >
                        {/* Using a lightning icon or similar if available, else Star */}
                        <Text style={{ fontSize: 16 }}>⚡</Text>
                      </TouchableOpacity>
                    )}

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

                {/* 6. COMPLETE / ALMOST DONE ACTIONS */}
                {isStarted && (
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                      style={[
                        styles.iconButton,
                        { backgroundColor: "#FFF3E0", marginRight: 8, paddingHorizontal: 12 },
                      ]}
                      onPress={() => onAlmostDone(appointment._id)}
                    >
                      <Text style={{ color: "#E65100", fontWeight: '700', fontSize: 12 }}>🔔 Call Next</Text>
                    </TouchableOpacity>

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
                  </View>
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
                  <Text
                    style={[styles.otpTitle, { color: theme.colors.text }]}
                  >
                    {isOfflineBooking
                      ? "Start Walk-in"
                      : "Verify Customer"}
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
                      opacity:
                        !isOfflineBooking && otp.length !== 6 ? 0.6 : 1,
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
                    {isOfflineBooking
                      ? "Start Session"
                      : "Verify & Start"}
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
  const MAX_OFFLINE_EXPRESS = 2;

  // Helper to ensure "Today" is always based on IST (UTC+05:30)
  // EXTENDED LOGIC: If it's between 00:00 and 04:00 AM, we consider it "Yesterday" (Late Night Shift)
  const getIndianDate = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utc + 3600000 * 5.5);

    // If hour is < 4 (i.e., 1AM, 2AM, 3AM), subtract 1 day
    if (istTime.getHours() < 4) {
      istTime.setDate(istTime.getDate() - 1);
    }
    return istTime;
  };

  // State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  // Initialize with Indian Date
  const [selectedDate, setSelectedDate] = useState(getIndianDate());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAnyAppointmentStarted, setIsAnyAppointmentStarted] = useState(false);

  // Tab filter state
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'done'

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  // --- Alert State ---
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    actions: [],
  });

  const showCustomAlert = useCallback((title, message, actions = [], type = "info") => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      actions: actions.map(a => ({
        ...a,
        onPress: () => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          if (a.onPress) a.onPress();
        }
      })),
    });
  }, []);

  const showToast = useCallback((message, type = "success") => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // --- Sorting & Calculations ---

  // Helpers
  const isExpress = useCallback((app) => {
    // Check local promotion OR string in type
    return (
      (app.appointmentType &&
        app.appointmentType.toLowerCase().includes("express")) ||
      (app.isPromoted === true)
    );
  }, []);

  const offlineExpressCount = useMemo(() => {
    return appointments.filter(
      (a) => a.status !== 'cancelled' && isExpress(a)
    ).length;
  }, [appointments, isExpress]);

  const activeAppointmentsForNav = useMemo(() => {
    return appointments.filter((app) => app.status !== "completed");
  }, [appointments]);

  // Enhanced Sort for Active Queue
  const sortedAppointments = useMemo(() => {
    const pending = appointments.filter((app) => app.status === "pending");
    const activeRaw = appointments.filter(
      (app) => app.status === "confirmed" || app.status === "started"
    );
    const completed = appointments.filter((app) => app.status === "completed");

    // SORT LOGIC: 
    // 1. Started Top
    // 2. Tier (Express > Basic)
    // 3. Time (FIFO)

    activeRaw.sort((a, b) => {
      // 1. Started Priority
      if (a.status === 'started' && b.status !== 'started') return -1;
      if (b.status === 'started' && a.status !== 'started') return 1;

      // 2. Tier Priority (With Demotion Check)
      // If Express has HUGE delay (> 500), treat as Basic priority.
      const aIsExpress = isExpress(a) && (a.tempDelayMinutes || 0) < 500;
      const bIsExpress = isExpress(b) && (b.tempDelayMinutes || 0) < 500;

      if (aIsExpress && !bIsExpress) return -1;
      if (bIsExpress && !aIsExpress) return 1;

      // 3. FIFO (Time + Delay + Tier Weight)
      const getScore = (app) => {
        if (!app.time) return 9999;
        const [h, m] = app.time.split(':').map(Number);
        let val = (h * 60 + m) + (app.tempDelayMinutes || 0);

        // Add Backend-like penalties for sorting
        const isAppExpress = isExpress(app);
        if (!isAppExpress) {
          val += 2000; // Basic User Penalty (Matches Backend)
        }
        return val;
      };

      const aScore = getScore(a);
      const bScore = getScore(b);

      if (aScore !== bScore) return aScore - bScore;

      // FIFO Tie-breaker
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    return { pending, active: activeRaw, completed };
  }, [appointments, isExpress]);

  // Filter appointments based on selected tab
  const filteredSortedAppointments = useMemo(() => {
    if (activeTab === 'active') {
      // Show pending + active (confirmed/started)
      return {
        pending: sortedAppointments.pending,
        active: sortedAppointments.active,
        completed: []
      };
    } else {
      // Show only completed
      return {
        pending: [],
        active: [],
        completed: sortedAppointments.completed
      };
    }
  }, [sortedAppointments, activeTab]);

  // Count calculations for badges
  const activeCount = useMemo(() => {
    return sortedAppointments.pending.length + sortedAppointments.active.length;
  }, [sortedAppointments.pending, sortedAppointments.active]);

  const doneCount = useMemo(() => {
    return sortedAppointments.completed.length;
  }, [sortedAppointments.completed]);

  const totalWaitTime = useMemo(() => {
    return sortedAppointments.active.reduce((total, app) => {
      let appMins = 0;
      if (app.services && app.services.length > 0) {
        app.services.forEach((s) => {
          if (s.time) {
            const m = String(s.time).match(/(\d+)/);
            if (m) appMins += parseInt(m[1], 10);
          }
        });
      }

      if (appMins === 0) {
        appMins = 30; // Default
      }
      return total + appMins;
    }, 0);
  }, [sortedAppointments.active]);


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


          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
  const handlePromoteToExpress = useCallback((appointmentId) => {
    if (offlineExpressCount >= MAX_OFFLINE_EXPRESS) {
      showCustomAlert(
        "Limit Reached",
        `You can only have ${MAX_OFFLINE_EXPRESS} Express bookings per day (including online & manual).`,
        [{ text: "OK", style: "cancel" }],
        "warning"
      );
      return;
    }

    showCustomAlert(
      "Promote to Express",
      "Prioritize this customer in the queue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Promote ⚡",
          style: "default",
          onPress: async () => {
            try {
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/booking/promote/${appointmentId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'x-auth-token': token,
                }
              });
              if (response.ok) {
                showToast("Promoted to Express Queue! ⚡", "success");
                fetchAppointments(selectedDate);
              } else {
                showToast("Failed to promote", "error");
              }
            } catch (error) {
              showToast("Network error", "error");
            }
          }
        }
      ],
      "warning"
    );
  }, [showToast, showCustomAlert, offlineExpressCount, token, selectedDate, fetchAppointments]);

  const handleSkipPress = useCallback(
    (appointmentId) => {
      showCustomAlert(
        "Skip Customer",
        "This will swap them with the next customer. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Skip",
            style: "destructive",
            onPress: async () => {
              // ... existing logic ...
              setAppointments((currentList) => {
                return currentList.map((item) => {
                  if (item._id === appointmentId) {
                    return { ...item, skipCount: (item.skipCount || 0) + 1 };
                  }
                  return item;
                });
              });

              // 2. Then call Server
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

                const data = await response.json();

                if (response.ok) {
                  if (data.status === "cancelled") {
                    showToast(data.msg || "Booking Auto-Cancelled (3 Skips)", "error");
                  } else {
                    showToast("Swapped with next customer", "success");
                  }
                  // Fetch final server state
                  fetchAppointments(selectedDate);
                } else {
                  showToast(data.msg || "Failed to skip", "error");
                  // Revert if failed (optional, but fetching handles it)
                  fetchAppointments(selectedDate);
                }
              } catch (error) {
                showToast("Network error", "error");
                fetchAppointments(selectedDate);
              }
            }
          }
        ]
      );
    },
    [token, selectedDate, fetchAppointments, showToast, showCustomAlert]
  );

  useEffect(() => {
    if (user && user._id) fetchAppointments(selectedDate);
  }, [selectedDate, user, fetchAppointments]);

  // --- REAL-TIME UPDATES: Socket.IO ---
  useEffect(() => {
    if (!user?._id || !token) return;

    const io = require('socket.io-client');
    const socket = io(process.env.EXPO_PUBLIC_API_URL, {
      transports: ['websocket'],
      reconnection: true,
      query: { token } // Add authentication token
    });

    socket.on('connect', () => {
      ('✅ Queue Socket Connected');
      socket.emit('join', `barber_${user._id}`);
    });

    // Listen for new bookings
    socket.on('new_booking', (data) => {
      ('📩 New Booking Received:', data);
      showToast('New booking received!', 'success');
      fetchAppointments(selectedDate);
    });

    // Listen for booking updates
    socket.on('booking_update', (data) => {
      ('🔄 Booking Updated:', data);
      fetchAppointments(selectedDate);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket Connection Error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, token, selectedDate, fetchAppointments, showToast]);

  // --- REAL-TIME UPDATES: Foreground Notifications ---
  useEffect(() => {
    const Notifications = require('expo-notifications');

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;

      // Check if it's a booking-related notification
      if (data?.type === 'new_booking' || data?.bookingId) {
        ('🔔 Notification Received (Foreground):', data);
        showToast('New booking notification', 'success');
        fetchAppointments(selectedDate);
      }
    });

    return () => subscription.remove();
  }, [selectedDate, fetchAppointments, showToast]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments(selectedDate);
  }, [fetchAppointments, selectedDate]);

  // Auto-refresh date at midnight
  useEffect(() => {
    const checkDateChange = () => {
      const currentIndianDate = getIndianDate();
      const currentDateString = format(currentIndianDate, 'yyyy-MM-dd');
      const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

      // If date has changed, update to current date
      if (currentDateString !== selectedDateString) {
        console.log('📅 Date changed! Updating from', selectedDateString, 'to', currentDateString);
        setSelectedDate(currentIndianDate);
        fetchAppointments(currentIndianDate);
        showToast('Date updated to today', 'success');
      }
    };

    // Check every minute
    const interval = setInterval(checkDateChange, 60000);

    // Also check on mount
    checkDateChange();

    return () => clearInterval(interval);
  }, [selectedDate, fetchAppointments, showToast]);

  const handleCollectPayment = useCallback(
    (appointmentId) => {
      showCustomAlert(
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
        ],
        "success" // Type
      );
    },
    [showToast, showCustomAlert]
  );

  const handleStartPress = useCallback((appointmentId) => {
    showCustomAlert(
      "Start Appointment",
      "Are you ready to start this service?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setCurrentAppointmentId(appointmentId);
            setShowOtpInput(true);
            setOtp("");
            setOtpError("");
          }
        }
      ],
      "info" // Type
    );
  }, [showCustomAlert]);

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
            body: JSON.stringify({ otp: "000000" }),
          }
        );
        if (response.ok) {
          showToast("Session Started", "success");
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setShowOtpInput(false);
          setCurrentAppointmentId(null);
          fetchAppointments(selectedDate);
        } else showToast("Failed to start", "error");
      } catch (error) {
        showToast(error.message, "error");
      }
    },
    [token, selectedDate, fetchAppointments, showToast]
  );

  const handleCompletePress = useCallback(
    (appointmentId) => {
      showCustomAlert(
        "Complete Service",
        "Mark this appointment as finished?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes, Finish",
            onPress: async () => {
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
                  fetchAppointments(selectedDate);
                } else showToast("Failed", "error");
              } catch (error) {
                showToast(error.message, "error");
              }
            }
          }
        ],
        "success"
      );
    },
    [token, selectedDate, fetchAppointments, showToast, showCustomAlert]
  );

  const handleAlmostDonePress = useCallback(
    (appointmentId) => {
      showCustomAlert(
        "Call Next Customer?",
        "This will send a push notification to the next person telling them you are almost ready.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes, Call Next",
            onPress: async () => {
              try {
                const response = await fetch(
                  `${process.env.EXPO_PUBLIC_API_URL}/api/booking/${appointmentId}/almost-done`,
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      "x-auth-token": token,
                    },
                  }
                );

                const data = await response.json();

                if (response.ok) {
                  showToast("Notification sent to next customer!", "success");
                } else {
                  showToast(data.msg || "Failed to notify next customer", "error");
                }
              } catch (error) {
                showToast(error.message, "error");
              }
            }
          }
        ],
        "info"
      );
    },
    [token, showToast, showCustomAlert]
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
    (bookingId, newStatus, reason) => {
      const action = newStatus === "confirmed" ? "Accept" : "Cancel";
      const title = `${action} Booking`;
      const message = newStatus === "confirmed"
        ? "Accept this booking request?"
        : "Are you sure you want to cancel this booking?";

      showCustomAlert(
        title,
        message,
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            style: newStatus === 'cancelled' ? 'destructive' : 'default',
            onPress: async () => {
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
            }
          }
        ],
        newStatus === 'cancelled' ? 'destructive' : 'info'
      );
    },
    [token, selectedDate, fetchAppointments, showToast, showCustomAlert]
  );

  const handleCancelOtp = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowOtpInput(false);
  }, []);

  // --- Helpers ---
  const sectionsData = useMemo(() => {
    // Use the filtered data based on active tab
    const { pending, active, completed } = filteredSortedAppointments;

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
  }, [filteredSortedAppointments, theme.colors.primary]);

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
        onPromote={handlePromoteToExpress}
        offlineExpressCount={offlineExpressCount}
        MAX_OFFLINE_EXPRESS={MAX_OFFLINE_EXPRESS}
        onAlmostDone={handleAlmostDonePress}
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
      handlePromoteToExpress,
      offlineExpressCount,
      MAX_OFFLINE_EXPRESS,
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
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.border, // Optional: if you have a border color
              borderBottomWidth: 1, // subtle separation from content
              paddingBottom: 16, // Extra breathing room at bottom
            },
          ]}
        >
          {/* --- TOP ROW: Navigation & Title --- */}
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              {/* Back Button - Made Circular/Softer */}
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.iconButton, { backgroundColor: theme.colors.card }]}
              >
                <ChevronLeft size={24} color={theme.colors.text} />
              </TouchableOpacity>

              {/* Titles */}
              <View style={styles.titleContainer}>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  TODAY'S QUEUE
                </Text>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                  Manager
                </Text>
              </View>
            </View>

            {/* Right Actions: Est Wait Time + History Button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Est Wait Time Pill */}
              <View style={{
                backgroundColor: '#F3E5F5',
                borderColor: '#E1BEE7',
                borderWidth: 1,
                borderRadius: 14,
                paddingHorizontal: 8,
                paddingVertical: 6,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 44,
                height: 44
              }}>
                <Clock size={16} color="#6A1B9A" style={{ marginBottom: 2 }} />
                <Text style={{ fontSize: 10, color: '#1C1C1E', fontWeight: '900', leading: 10 }}>{totalWaitTime}m</Text>
              </View>

              {/* History Button */}
              <TouchableOpacity
                onPress={() => navigation.navigate("QueueHistory")}
                style={[styles.iconButton, { backgroundColor: theme.colors.card }]}
              >
                <History size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* --- BOTTOM ROW: Actions --- */}
          <View style={styles.actionBar}>
            {/* Date Picker - Pill Shape */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.datePill, { backgroundColor: theme.colors.card }]}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                {/* '20' adds transparency to hex if format allows, otherwise just remove */}
                <Calendar size={18} color={theme.colors.primary} />
              </View>
              <Text style={[styles.dateText, { color: theme.colors.text }]}>
                {format(selectedDate, "MMM dd, yyyy")}
              </Text>
            </TouchableOpacity>

            {/* Right Side Actions */}
            <View style={styles.actionButtonsRight}>
              {/* Refresh Button */}
              <TouchableOpacity
                onPress={handleRefresh}
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                ]}
              >
                <RefreshCcw size={20} color={theme.colors.text} />
              </TouchableOpacity>

              {/* Walk-in (Primary) Button */}
              <TouchableOpacity
                onPress={() => navigation.navigate("OfflineBooking")}
                style={[
                  styles.primaryBtn,
                  { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
                ]}
              >
                <Plus size={20} color="#FFF" />
                <Text style={styles.primaryBtnText}>Walk-in</Text>
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

        {/* Tab Toggle Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'active' && styles.tabButtonActive
            ]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab('active');
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'active' && styles.tabTextActive
            ]}>
              Active
            </Text>
            <View style={[
              styles.tabBadge,
              activeTab === 'active' && styles.tabBadgeActive
            ]}>
              <Text style={[
                styles.tabBadgeText,
                activeTab === 'active' && styles.tabBadgeTextActive
              ]}>
                {activeCount}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'done' && styles.tabButtonActive
            ]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab('done');
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'done' && styles.tabTextActive
            ]}>
              Done
            </Text>
            <View style={[
              styles.tabBadge,
              activeTab === 'done' && styles.tabBadgeActive
            ]}>
              <Text style={[
                styles.tabBadgeText,
                activeTab === 'done' && styles.tabBadgeTextActive
              ]}>
                {doneCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>


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
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        actions={alertConfig.actions}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
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
    paddingTop: Platform.OS === "android" ? 40 : 16, // Increased padding for Android to account for status bar
    paddingBottom: 16,
    // Shadow for the whole header (elevation for Android, shadow props for iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20, // More space between title and action bar
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14, // Squircle shape (soft square)
    justifyContent: "center",
    alignItems: "center",
    // Subtle shadow for buttons
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    marginLeft: 16,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase', // Makes it look cleaner
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    paddingRight: 16,
    borderRadius: 100, // Fully rounded pill
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // Requires React Native 0.71+, otherwise use marginLeft on the second item
  },
  secondaryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22, // Circle
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1, // Subtle outline
    borderColor: 'rgba(0,0,0,0.05)',
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22, // Circle pill
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
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
  // Tab Bar Styles - Compact & Modern
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
    marginRight: 6,
  },
  tabTextActive: {
    color: '#1976D2',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: {
    backgroundColor: '#BBDEFB',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#757575',
  },
  tabBadgeTextActive: {
    color: '#1565C0',
  },
  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', // Slightly darker
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#fff',
    width: '85%',
    maxWidth: 340,
    borderRadius: 28, // Rounder
    padding: 30, // More padding
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  alertIconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 22, // Larger
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  alertMessage: {
    fontSize: 16, // Larger
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  alertActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  alertButton: {
    flex: 1,
    paddingVertical: 16, // Taller buttons
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 0,
  },
  alertButtonConfirm: {
    // Background color handled in component based on type
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertButtonCancel: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  alertButtonText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  alertButtonTextConfirm: {
    color: '#FFF',
  },
  alertButtonTextCancel: {
    color: '#555',
  },
});

export default QueueManagementScreen;