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
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  TextInput,
  Animated,
  Easing,
} from "react-native";
import OptimizedImage from "../components/OptimizedImage";
import { useTheme } from "../contexts/ThemeContext.jsx";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Receipt,
  Store,
  ChevronRight,
  X,
  AlertCircle,
  Check,
} from "lucide-react-native";
import { format, differenceInSeconds } from "date-fns";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext.jsx";
import SwipeButton from "../components/SwipeButton.jsx";
import { LinearGradient } from "expo-linear-gradient";

// Constants moved outside to prevent recreation
const RATING_EMOJIS = [
  { id: 1, char: "😠", label: "Terrible" },
  { id: 2, char: "😞", label: "Bad" },
  { id: 3, char: "😐", label: "Okay" },
  { id: 4, char: "🙂", label: "Good" },
  { id: 5, char: "🤩", label: "Amazing" },
];

const QUICK_TAGS = [
  "Professional 👔",
  "Punctual ⏰",
  "Clean Shop 🧹",
  "Great Cut ✂️",
  "Friendly 🤝",
  "Good Value 💰",
];

// --- CUSTOM TOAST COMPONENT ---
const ToastNotification = ({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 40, // Margin Top 40 as requested
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (visible && onHide) onHide();
    });
  };

  if (!visible) return null;

  const isError = type === "error";
  const bgColor = isError ? "#FEF2F2" : "#F0FDF4";
  const borderColor = isError ? "#EF4444" : "#22C55E";
  const textColor = isError ? "#991B1B" : "#166534";
  const Icon = isError ? AlertCircle : Check;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: bgColor,
          borderColor: borderColor,
        },
      ]}
    >
      <View
        style={[
          styles.toastIcon,
          { backgroundColor: isError ? "#FECACA" : "#DCFCE7" },
        ]}
      >
        <Icon size={20} color={borderColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.toastTitle, { color: textColor }]}>
          {isError ? "Action Failed" : "Success"}
        </Text>
        <Text style={[styles.toastMessage, { color: textColor }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

// --- ISOLATED HERO TIMER COMPONENT (Prevents Full Page Re-renders) ---
const HeroSection = React.memo(({ booking, theme }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!booking?.date || !booking?.time) return;

    // Calculate initial time immediately
    const appointmentDateTime = new Date(
      `${format(new Date(booking.date), "yyyy-MM-dd")}T${booking.time}`
    );

    const calculateTime = () => {
      const now = new Date();
      const seconds = differenceInSeconds(appointmentDateTime, now);
      return seconds > 0 ? seconds : 0;
    };

    setTimeLeft(calculateTime());

    const interval = setInterval(() => {
      const newTime = calculateTime();
      setTimeLeft(newTime);

      if (newTime === 0 && !booking.status.match(/completed|cancelled/i)) {
        startPulseAnimation();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking.date, booking.time, booking.status]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const formatTimeLeft = (seconds) => {
    if (seconds === 0) return "Started";
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (hours === 0 && days === 0) parts.push(`${remainingSeconds}s`);
    return parts.join(" ");
  };

  const isStarted =
    timeLeft === 0 && !booking.status.match(/completed|cancelled/i);

  if (booking.status === "completed" || booking.status === "cancelled")
    return null;

  return (
    <Animated.View
      style={isStarted ? { transform: [{ scale: pulseAnim }] } : {}}
    >
      <LinearGradient
        colors={
          isStarted ? ["#ef4444", "#dc2626"] : [theme.colors.primary, "#2563EB"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroContent}>
          <Clock
            size={32}
            color="rgba(255,255,255,0.8)"
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.heroLabel}>
            {isStarted ? "Appointment In Progress" : "Starts In"}
          </Text>
          {!isStarted && (
            <Text style={styles.heroTime}>{formatTimeLeft(timeLeft)}</Text>
          )}
          <View style={styles.heroStatusBadge}>
            <Text style={styles.heroStatusText}>{booking.status}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

const BookingDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { booking } = route.params;
  const { token } = useAuth();

  // Toast State
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  // Review State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [customerReview, setCustomerReview] = useState(null);

  // Animations for Rating
  const emojiAnimations = useRef(
    RATING_EMOJIS.map(() => new Animated.Value(1))
  ).current;

  // Show Toast Helper
  const showToast = useCallback((type, message) => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const fetchReviewDetails = async () => {
      try {
        if (!booking?._id) return;
        const res = await api.get(
          `/api/review/${booking._id}`
        );
        if (res.data) {
          setCustomerReview(res.data);
          setHasReviewed(true);
          setRating(res.data.rating || 0);
          setComment(res.data.comment || "");
          setTitle(res.data.title || "");
        }
      } catch (err) {
        // Silent fail on fetch review is acceptable or log to analytics
        console.log("No review found or error fetching");
      }
    };

    if (booking?.status === "completed") {
      fetchReviewDetails();
    }
  }, [booking, token]);

  const openMap = useCallback(
    (address) => {
      const scheme = Platform.select({
        ios: "maps:0,0?q=",
        android: "geo:0,0?q=",
      });
      const label = encodeURIComponent(address);
      const url = Platform.select({
        ios: `${scheme}${label}@`,
        android: `${scheme}0,0?q=${label}`,
      });
      Linking.openURL(url).catch(() =>
        showToast("error", "Could not open maps")
      );
    },
    [showToast]
  );

  const callNumber = useCallback(
    (phoneNumber) => {
      if (!phoneNumber) return;
      Linking.openURL(`tel:${phoneNumber}`).catch(() =>
        showToast("error", "Could not open dialer")
      );
    },
    [showToast]
  );

  const sendEmail = useCallback(
    (emailAddress) => {
      if (!emailAddress) return;
      Linking.openURL(`mailto:${emailAddress}`).catch(() =>
        showToast("error", "Could not open email app")
      );
    },
    [showToast]
  );

  const toggleTag = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleReviewSubmit = async () => {
    if (rating === 0) {
      showToast("error", "Please select a rating emoji");
      return;
    }

    let finalTitle = title.trim();
    if (!finalTitle && selectedTags.length > 0) {
      finalTitle = `Great experience!`;
    } else if (!finalTitle) {
      showToast("error", "Please add a title");
      return;
    }

    let finalComment = comment.trim();
    if (selectedTags.length > 0) {
      const tagsString = selectedTags.join(", ");
      finalComment = finalComment
        ? `${finalComment}\n\nHighlights: ${tagsString}`
        : `Highlights: ${tagsString}`;
    }

    try {
      await api.post(
        `/api/review`,
        {
          bookingId: booking._id,
          rating,
          comment: finalComment,
          title: finalTitle,
        }
      );

      setCustomerReview({
        rating,
        comment: finalComment,
        title: finalTitle,
      });
      setHasReviewed(true);

      showToast("success", "Review submitted successfully!");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to submit review. Try again.");
    }
  };

  const handleRating = useCallback(
    (rate) => {
      setRating(rate);
      Animated.spring(emojiAnimations[rate - 1], {
        toValue: 1.5,
        friction: 3,
        useNativeDriver: true,
      }).start(() => {
        Animated.spring(emojiAnimations[rate - 1], {
          toValue: 1.2,
          friction: 3,
          useNativeDriver: true,
        }).start();
      });

      emojiAnimations.forEach((anim, index) => {
        if (index !== rate - 1) {
          Animated.spring(anim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      });
    },
    [emojiAnimations]
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return { bg: "#E6F4EA", text: "#1E7E34" };
      case "confirmed":
        return { bg: "#E3F2FD", text: "#1976D2" };
      case "pending":
        return { bg: "#FFF8E1", text: "#F57C00" };
      case "cancelled":
      default:
        return { bg: "#FDECEA", text: "#D93025" };
    }
  };

  const statusColors = getStatusColor(booking.status);

  // Memoize static data to avoid unnecessary renders
  const barberName = booking.barberId?.name || "Unknown";
  const shopName = booking.barberId?.shopName;
  const shopAddress = booking.barberId?.shopAddress;
  const totalPrice = booking.totalPrice
    ? booking.totalPrice.toFixed(2)
    : "0.00";

  // Debug booking data structure
  console.log('📋 BookingDetailScreen - Booking data:', {
    barberId: booking.barberId,
    barberProfilePicture: booking.barberId?.profilePicture,
    barberImage: booking.barberId?.image,
    barberImageUri: booking.barberId?.image?.uri
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Custom Toast Overlay */}
      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <View
        style={[styles.header, { backgroundColor: theme.colors.background }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginLeft: -8 }}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Booking Details
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* === HERO SECTION (Optimized Component) === */}
        <HeroSection booking={booking} theme={theme} />

        {/* === INFO SECTION === */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Details
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.infoRow}>
            <View style={styles.barberImageContainer}>
              <OptimizedImage
                source={
                  booking.barberId?.profilePicture ||
                  booking.barberId?.image?.uri ||
                  booking.barberId?.image ||
                  "https://via.placeholder.com/100x100/cccccc/666666?text=No+Image"
                }
                style={styles.barberImage}
                contentFit="cover"
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Service Provider
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {barberName}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIconBox,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Calendar size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Date & Time
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {booking.date
                  ? format(new Date(booking.date), "MMM dd, yyyy")
                  : "N/A"}{" "}
                • {booking.time}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <View
              style={[
                styles.infoIconBox,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <CheckCircle size={20} color={statusColors.text} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Status
              </Text>
              <Text style={[styles.infoValue, { color: statusColors.text }]}>
                {booking.status}
              </Text>
              {booking.status === "cancelled" && booking.cancellationReason && (
                <Text
                  style={[
                    styles.cancellationReason,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Reason: {booking.cancellationReason}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* === RECEIPT SECTION === */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Payment Summary
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.receiptHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Receipt size={20} color={theme.colors.text} />
            <Text style={[styles.receiptTitle, { color: theme.colors.text }]}>
              Service Receipt
            </Text>
          </View>

          {booking.services?.map((s, i) => (
            <View key={i} style={styles.serviceRow}>
              <Text style={[styles.serviceName, { color: theme.colors.text }]}>
                {s.name}
              </Text>
              <Text style={[styles.servicePrice, { color: theme.colors.text }]}>
                ₹{s.price ? s.price.toFixed(2) : "0.00"}
              </Text>
            </View>
          ))}

          <View
            style={[styles.dividerDashed, { borderColor: theme.colors.border }]}
          />

          <View style={styles.totalRow}>
            <Text
              style={[styles.totalLabel, { color: theme.colors.textSecondary }]}
            >
              Total Amount
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
              ₹{totalPrice}
            </Text>
          </View>
        </View>

        {/* === ACTIONS SECTION === */}
        {booking.paymentStatus === "pending" &&
          booking.status === "confirmed" ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
              },
            ]}
            onPress={() => {
              if (booking.barberId) {
                navigation.navigate("PaymentConfirmation", {
                  providerName: booking.barberId.name,
                  providerId: booking.barberId._id,
                  selectedServices: booking.services,
                  totalPrice: booking.totalPrice,
                  bookingId: booking._id,
                  fromHistory: false,
                });
              } else {
                showToast("error", "Provider details missing");
              }
            }}
          >
            <Text style={styles.actionButtonText}>Proceed to Payment</Text>
            <ChevronRight size={20} color="#fff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : (
          booking.otp &&
          booking.status === "confirmed" && (
            <View
              style={[
                styles.otpContainer,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <Text
                style={[styles.otpLabel, { color: theme.colors.textSecondary }]}
              >
                Verification Code
              </Text>
              <Text style={[styles.otpValue, { color: theme.colors.primary }]}>
                {booking.otp}
              </Text>
            </View>
          )
        )}

        {booking.status === "pending" &&
          booking.paymentStatus === "pending" && (
            <SwipeButton
              onSwipeSuccess={async () => {
                try {
                  await api.put(
                    `/api/booking/cancel-pending/${booking._id}`,
                    {}
                  );
                  showToast("success", "Booking cancelled");
                  setTimeout(() => navigation.goBack(), 1500);
                } catch (err) {
                  console.error(err);
                  showToast(
                    "error",
                    "Failed to cancel booking. Server may be down."
                  );
                }
              }}
              title="Slide to Cancel"
              containerStyles={{
                marginBottom: 24,
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                borderWidth: 1,
              }}
              titleStyles={{ color: theme.colors.error, fontWeight: "700" }}
              railStyles={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
              thumbIconBackgroundColor="#EF4444"
              thumbIconBorderColor="#DC2626"
            />
          )}

        {/* === CONTACT SECTION === */}
        {booking.barberId && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Contacts & Location
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.contactItem,
                  { borderBottomColor: theme.colors.border },
                ]}
                onPress={() => callNumber(booking.barberId?.phone)}
              >
                <Phone size={20} color={theme.colors.primary} />
                <View style={styles.contactContent}>
                  <Text
                    style={[styles.contactType, { color: theme.colors.text }]}
                  >
                    Call Barber
                  </Text>
                  <Text
                    style={[
                      styles.contactDetail,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {booking.barberId.phone || "N/A"}
                  </Text>
                </View>
                <ChevronRight size={16} color={theme.colors.border} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.contactItem,
                  { borderBottomColor: theme.colors.border },
                ]}
                onPress={() => sendEmail(booking.barberId?.email)}
              >
                <Mail size={20} color={theme.colors.primary} />
                <View style={styles.contactContent}>
                  <Text
                    style={[styles.contactType, { color: theme.colors.text }]}
                  >
                    Email Barber
                  </Text>
                  <Text
                    style={[
                      styles.contactDetail,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {booking.barberId.email || "N/A"}
                  </Text>
                </View>
                <ChevronRight size={16} color={theme.colors.border} />
              </TouchableOpacity>

              {shopName && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.contactItem,
                      { borderBottomColor: theme.colors.border },
                    ]}
                    onPress={() => openMap(shopAddress)}
                  >
                    <MapPin size={20} color={theme.colors.primary} />
                    <View style={styles.contactContent}>
                      <Text
                        style={[
                          styles.contactType,
                          { color: theme.colors.text },
                        ]}
                      >
                        {shopName}
                      </Text>
                      <Text
                        style={[
                          styles.contactDetail,
                          { color: theme.colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {shopAddress || "Address not available"}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={theme.colors.border} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.contactItem, { borderBottomWidth: 0 }]}
                    onPress={() => callNumber(booking.barberId?.shopPhone)}
                  >
                    <Store size={20} color={theme.colors.primary} />
                    <View style={styles.contactContent}>
                      <Text
                        style={[
                          styles.contactType,
                          { color: theme.colors.text },
                        ]}
                      >
                        Call Shop
                      </Text>
                      <Text
                        style={[
                          styles.contactDetail,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {booking.barberId.shopPhone || "N/A"}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={theme.colors.border} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}

        {/* === REVIEW SECTION === */}
        {booking.status === "completed" && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {hasReviewed ? "Your Experience" : "Rate Experience"}
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {hasReviewed ? (
                <View style={styles.reviewContainer}>
                  <View
                    style={[
                      styles.submittedReviewBox,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.reviewEmoji}>
                      {RATING_EMOJIS[customerReview?.rating - 1]?.char || "⭐"}
                    </Text>
                    <Text
                      style={[styles.reviewTitle, { color: theme.colors.text }]}
                    >
                      {customerReview?.title}
                    </Text>
                    <Text
                      style={[
                        styles.reviewBody,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {customerReview?.comment}
                    </Text>
                  </View>
                  {customerReview?.barberResponse && (
                    <View
                      style={[
                        styles.barberResponse,
                        {
                          backgroundColor: theme.colors.card,
                          borderLeftColor: theme.colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.responseLabel,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Response from Barber
                      </Text>
                      <Text
                        style={[
                          styles.responseText,
                          { color: theme.colors.text },
                        ]}
                      >
                        {customerReview.barberResponse}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.reviewContainer}>
                  {/* Emoji Rating Row */}
                  <View style={styles.emojiRow}>
                    {RATING_EMOJIS.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.emojiContainer}
                        onPress={() => handleRating(item.id)}
                        activeOpacity={0.7}
                      >
                        <Animated.Text
                          style={[
                            styles.emojiChar,
                            {
                              transform: [
                                { scale: emojiAnimations[item.id - 1] },
                              ],
                            },
                            rating > 0 &&
                            rating !== item.id && { opacity: 0.4 },
                          ]}
                        >
                          {item.char}
                        </Animated.Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Dynamic Feedback Text */}
                  {rating > 0 && (
                    <View style={styles.ratingFeedbackContainer}>
                      <Text
                        style={[
                          styles.ratingFeedbackText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {RATING_EMOJIS[rating - 1].label}!
                      </Text>
                    </View>
                  )}

                  {/* Quick Tags */}
                  <Text
                    style={[styles.tagsLabel, { color: theme.colors.text }]}
                  >
                    What went well?
                  </Text>
                  <View style={styles.tagsContainer}>
                    {QUICK_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <TouchableOpacity
                          key={tag}
                          style={[
                            styles.tagChip,
                            {
                              backgroundColor: theme.colors.background,
                              borderColor: theme.colors.border,
                            },
                            isSelected && {
                              backgroundColor: theme.colors.primary + "15",
                              borderColor: theme.colors.primary,
                            },
                          ]}
                          onPress={() => toggleTag(tag)}
                        >
                          <Text
                            style={[
                              styles.tagText,
                              { color: theme.colors.textSecondary },
                              isSelected && {
                                color: theme.colors.primary,
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    placeholder="Title (Optional)"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    placeholder="Share more details (Optional)..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={comment}
                    onChangeText={setComment}
                    multiline
                  />

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      {
                        backgroundColor: theme.colors.primary,
                        shadowColor: theme.colors.primary,
                      },
                      rating === 0 && { opacity: 0.5 },
                    ]}
                    onPress={handleReviewSubmit}
                    disabled={rating === 0}
                  >
                    <Text style={styles.submitBtnText}>Submit Feedback</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // --- Toast Styles ---
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 13,
    opacity: 0.9,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerPlaceholder: {
    width: 40,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },

  // --- Cards & Sections ---
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 8,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
  },

  // --- Hero Card ---
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  heroContent: { alignItems: "center" },
  heroLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heroTime: { fontSize: 32, fontWeight: "800", color: "#fff" },
  heroStatusBadge: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  heroStatusText: {
    color: "#fff",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 12,
  },

  // --- Info Rows ---
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  barberImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  barberImage: {
    width: '100%',
    height: '100%',
  },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: "600" },
  cancellationReason: { fontSize: 12, fontStyle: "italic", marginTop: 4 },

  // --- Receipt ---
  receiptHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  receiptTitle: { fontSize: 16, fontWeight: "700", marginLeft: 10 },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  serviceName: { fontSize: 15, flex: 1, marginRight: 10 },
  servicePrice: { fontSize: 15, fontWeight: "600" },
  dividerDashed: {
    height: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalValue: { fontSize: 24, fontWeight: "800" },

  // --- Actions ---
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 24,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  otpContainer: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 24,
  },
  otpLabel: { fontSize: 14, marginBottom: 8 },
  otpValue: { fontSize: 32, fontWeight: "800", letterSpacing: 8 },

  // --- Contact ---
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  contactContent: { flex: 1, marginLeft: 14 },
  contactType: { fontSize: 14, fontWeight: "600" },
  contactDetail: { fontSize: 13, marginTop: 2 },

  // --- Review Section Styling ---
  reviewContainer: { paddingTop: 5 },

  // Emoji Row
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  emojiContainer: { alignItems: "center", width: 50 },
  emojiChar: { fontSize: 32 },
  emojiLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },

  // Rating Feedback Label
  ratingFeedbackContainer: { alignItems: "center", marginBottom: 20 },
  ratingFeedbackText: { fontSize: 16, fontWeight: "700" },

  // Tags
  tagsLabel: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 12, fontWeight: "500" },

  // Inputs
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 12,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },

  // Submit
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Read-only Review View
  submittedReviewBox: { padding: 20, borderRadius: 16, borderWidth: 1 },
  reviewEmoji: { fontSize: 40, textAlign: "center", marginBottom: 10 },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  reviewBody: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  barberResponse: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  responseLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  responseText: { fontSize: 14, lineHeight: 20 },
});

export default BookingDetailScreen;
