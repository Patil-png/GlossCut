import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Platform,
  ScrollView,
  Linking,
  Dimensions,
  PixelRatio
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 375;

function normalize(size) {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.getFontScale() * newSize);
  } else {
    const res = Math.round(PixelRatio.getFontScale() * newSize) - 2;
    return res > 0 ? res : size; // Fallback to original size if negative
  }
}
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OptimizedImage from "../components/OptimizedImage";
import { useTheme } from "../contexts/ThemeContext.jsx";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  PhoneCall,
  Mail,
  CheckCircle,
  Receipt,
  Store,
  ChevronRight,
  X,
  AlertCircle,
  Check,
  Star,
  MessageSquare,
  HelpCircle,
  Heart,
  ShieldCheck
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

const PERF_DOTS = [...Array(15)];

// --- CUSTOM TOAST COMPONENT ---
const ToastNotification = ({ visible, message, type, onHide, topInset }) => {
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        if (onHide) onHide();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const isError = type === "error";
  const bgColor = isError ? "#FEF2F2" : "#F0FDF4";
  const borderColor = isError ? "#EF4444" : "#22C55E";
  const textColor = isError ? "#991B1B" : "#166534";
  const Icon = isError ? AlertCircle : Check;

  return (
    <View
      style={[
        styles.toastContainer,
        {
          top: topInset,
          backgroundColor: bgColor,
          borderColor: borderColor,
          opacity: 1
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
    </View>
  );
};

// --- ISOLATED HERO TIMER COMPONENT (Prevents Full Page Re-renders) ---
const StatusBanner = React.memo(({ booking, theme }) => {
  const isCompleted = booking.status?.toLowerCase() === "completed";
  const isCancelled = booking.status?.toLowerCase() === "cancelled";
  
  let bgColor = "#F0FDF4"; 
  let accentColor = "#16A34A";
  let title = "Booking Confirmed";
  let subtitle = "Your barber will be ready at the scheduled time.";

  if (isCompleted) {
    title = "Booking Completed";
    subtitle = "Hope you enjoyed your service!";
  } else if (isCancelled) {
    bgColor = "#FEF2F2";
    accentColor = "#DC2626";
    title = "Booking Cancelled";
    subtitle = booking.cancellationReason || "This booking was cancelled.";
  }

  return (
    <View style={[styles.statusBannerCard, { backgroundColor: bgColor, borderColor: accentColor + '20' }]}>
      <View style={styles.statusHeaderRow}>
         <View style={[styles.statusIconCircle, { backgroundColor: accentColor }]}>
            <CheckCircle size={16} color="#fff" />
         </View>
         <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.statusTitle, { color: accentColor }]}>{title}</Text>
            <Text style={styles.statusSubtitle} numberOfLines={2}>{subtitle}</Text>
         </View>
         <View style={styles.miniLogoContainer}>
           <Text style={styles.miniLogoText}>GC</Text>
         </View>
      </View>
      
      {isCompleted && (
        <View style={styles.ratingPromptCard}>
           <View style={styles.starCircle}>
             <Star size={18} color="#FFD700" fill="#FFD700" />
           </View>
           <Text style={styles.ratingPromptText}>How was your service experience?</Text>
           <TouchableOpacity style={styles.rateNowBtn}>
              <Text style={styles.rateNowText}>Rate now</Text>
           </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const BookingDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { booking: initialBooking } = route.params;
  const [booking, setBooking] = useState(initialBooking);
  const [queueInfo, setQueueInfo] = useState(null);
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchLatestBooking = async () => {
      try {
        if (!initialBooking?._id) return;
        const res = await api.get(`/api/booking/${initialBooking._id}`);
        if (res.data) {
          setBooking(res.data);
        }
      } catch (err) {
        console.log("Error fetching latest booking details:", err);
      }
    };

    const fetchQueueInfo = async () => {
      try {
        if (!initialBooking?._id) return;
        const res = await api.get(`/api/booking/track/${initialBooking.queueTrackingId || initialBooking._id}`);
        if (res.data && res.data.success) {
          setQueueInfo(res.data.data);
        }
      } catch (err) {
        console.log("Error fetching queue info:", err);
      }
    };

    fetchLatestBooking();
    fetchQueueInfo();

    const interval = setInterval(fetchQueueInfo, 15000);
    return () => clearInterval(interval);
  }, [initialBooking?._id, initialBooking?.queueTrackingId]);

  const formattedDate = useMemo(() => {
    if (!booking?.date) return "";
    try {
      return format(new Date(booking.date), "MMMM dd, yyyy");
    } catch (e) {
      return booking.date.split("T")[0] || booking.date;
    }
  }, [booking?.date]);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [selectedTip, setSelectedTip] = useState(null);
  const [tipConfirmed, setTipConfirmed] = useState(false);

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

  // Pulse animation for live tracking status indicator
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true
        })
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

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
        android: "geo:0,0?q="
      });
      const label = encodeURIComponent(address);
      const url = Platform.select({
        ios: `${scheme}${label}@`,
        android: `${scheme}0,0?q=${label}`
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
          title: finalTitle
        }
      );

      setCustomerReview({
        rating,
        comment: finalComment,
        title: finalTitle
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
    },
    []
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

  const getStatusGradient = (status) => {
    switch (status) {
      case "confirmed": return ["#F0FDF4", "#DCFCE7"];
      case "completed": return ["#F0FDF4", "#DCFCE7"];
      case "cancelled": return ["#FEF2F2", "#FEE2E2"];
      default: return ["#F9FAFB", "#F3F4F6"];
    }
  };

  const statusGradient = getStatusGradient(booking.status);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Custom Toast Overlay */}
      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        topInset={insets.top + (Platform.OS === 'android' ? 10 : 0)}
      />

      <View
        style={[styles.header, { backgroundColor: '#FFFFFF', paddingTop: Math.max(insets.top, 16), borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
        >
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#0F172A', fontWeight: '800', fontSize: 18 }]}>
          Booking Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.contentContainer, { backgroundColor: '#F6F7FB' }]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        <View style={{ height: 10 }} />
        
        {/* === STATUS BANNER === */}
        <View style={[styles.statusBannerCard, { backgroundColor: statusGradient[0], borderColor: statusGradient[1] }]}>
           <View style={styles.statusHeaderRow}>
              <View style={[styles.statusIconCircle, { backgroundColor: booking.status === 'cancelled' ? '#EF4444' : '#16A34A' }]}>
                 {booking.status === 'cancelled' ? <X size={18} color="#fff" /> : <Check size={18} color="#fff" />}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                 <Text style={[styles.statusTitle, { color: booking.status === 'cancelled' ? '#991B1B' : '#166534' }]}>
                    {booking.status.toUpperCase()}
                 </Text>
                 <Text style={styles.statusSubtitle}>
                    {booking.status === 'confirmed' ? 'Your barber is ready for the session' : 
                     booking.status === 'completed' ? 'Service finished successfully' : 'Booking was not successful'}
                 </Text>
              </View>
              <View style={styles.miniLogoContainer}>
                 <Text style={styles.miniLogoText}>GC</Text>
              </View>
           </View>

           {booking.status === 'completed' && (
             <TouchableOpacity style={styles.ratingPromptCard}>
                <View style={styles.starCircle}>
                   <Star size={20} color="#F59E0B" fill="#F59E0B" />
                </View>
                <Text style={styles.ratingPromptText}>How was your service experience?</Text>
                <View style={styles.rateNowBtn}>
                   <Text style={styles.rateNowText}>Rate now</Text>
                </View>
             </TouchableOpacity>
           )}
        </View>

        {/* === ORDER SUMMARY === */}
        <View style={styles.summaryCard}>
           <View style={styles.summaryHeaderRow}>
              <View style={styles.summaryIconCircle}>
                 <Receipt size={22} color="#111" />
              </View>
              <View style={{ marginLeft: 14 }}>
                 <Text style={styles.summaryTitle}>Bill Details</Text>
                 <Text style={styles.summarySubtitle}>Receipt ID: SETKAR/2026/{booking._id?.slice(-6).toUpperCase()}</Text>
              </View>
           </View>
           
           <View style={styles.summaryContent}>
              {booking.services?.map((s, i) => (
                <View key={i} style={styles.summaryServiceRow}>
                   <View style={styles.summaryBullet} />
                   <Text style={styles.summaryServiceName}>{s.name}</Text>
                   <Text style={styles.summaryServicePrice}>₹{s.price}</Text>
                </View>
              ))}
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.billRow}>
                 <Text style={styles.billLabel}>Item Total</Text>
                 <Text style={styles.billValue}>₹{totalPrice}</Text>
              </View>
              {selectedTip?.amount && (
                <View style={styles.billRow}>
                   <Text style={styles.billLabel}>Barber Tip (Appreciation)</Text>
                   <Text style={styles.billValue}>₹{selectedTip.amount}</Text>
                </View>
              )}
              <View style={styles.billRow}>
                 <Text style={styles.billLabel}>Convenience Fee</Text>
                 <Text style={[styles.billValue, { color: '#16A34A' }]}>FREE</Text>
              </View>
              <View style={styles.billRow}>
                 <Text style={styles.billLabel}>Payment Mode</Text>
                 <Text style={styles.billValue}>{booking.paymentMethod?.toUpperCase() || "CASH"}</Text>
              </View>
              
              <View style={styles.dashedDivider} />
              
              <View style={styles.summaryTotalRow}>
                 <View>
                    <Text style={styles.summaryTotalLabel}>Grand Total</Text>
                    <Text style={styles.totalTaxesLabel}>Inclusive of all taxes</Text>
                 </View>
                 <Text style={[styles.summaryTotalValue, { color: '#000' }]}>
                   ₹{(parseFloat(totalPrice) + (selectedTip?.amount || 0)).toFixed(2)}
                 </Text>
              </View>
           </View>
        </View>

        {/* === TRACK APPOINTMENT (Live Queue Status) === */}
        {(booking.status === "confirmed" || booking.status === "pending") && (
          <View style={styles.trackingCard}>
             <View style={styles.detailsHeaderRow}>
                <View style={styles.detailsIconCircle}>
                   <Clock size={20} color="#1A1A1A" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                   <Text style={styles.detailsTitle}>Track Appointment</Text>
                   <Text style={styles.detailsSubtitle}>Live status of your booking</Text>
                </View>
                <View style={styles.liveBadge}>
                   <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                   <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
             </View>

             {/* Live Queue Dashboard */}
             <View style={styles.liveQueueDashboard}>
                <View style={styles.queueMetricBox}>
                   <Text style={styles.queueMetricLabel}>Queue No.</Text>
                   <Text style={styles.queueMetricValue}>
                      #{queueInfo?.queuePosition || booking.queuePosition || "1"}
                   </Text>
                </View>
                <View style={styles.queueMetricBox}>
                   <Text style={styles.queueMetricLabel}>Ahead of You</Text>
                   <Text style={styles.queueMetricValue}>
                      {queueInfo?.peopleAhead !== undefined 
                         ? `${queueInfo.peopleAhead} ${queueInfo.peopleAhead === 1 ? 'person' : 'people'}` 
                         : "0 people"}
                   </Text>
                </View>
                <View style={styles.queueMetricBox}>
                   <Text style={styles.queueMetricLabel}>Est. Wait</Text>
                   <Text style={styles.queueMetricValue}>
                      {queueInfo?.estimatedWaitMinutes 
                         ? `${queueInfo.estimatedWaitMinutes} mins` 
                         : "10 mins"}
                   </Text>
                </View>
             </View>

             {/* Elegant Horizontal Progress Bar */}
             <View style={styles.progressBarWrapper}>
                <View style={styles.progressBarTrack}>
                   <View 
                      style={[
                         styles.progressBarFill, 
                         { 
                            width: queueInfo?.peopleAhead === 0 
                               ? '100%' 
                               : queueInfo?.peopleAhead === 1 
                                  ? '66%' 
                                  : '33%' 
                         }
                      ]} 
                   />
                </View>
                <View style={styles.progressBarSteps}>
                   <View style={styles.progressStepItem}>
                      <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                         <Check size={10} color="#1A1A1A" strokeWidth={3} />
                      </View>
                      <Text style={styles.stepLabel}>Booked</Text>
                   </View>
                   <View style={styles.progressStepItem}>
                      <View 
                         style={[
                            styles.stepCircle, 
                            queueInfo?.peopleAhead === undefined || queueInfo?.peopleAhead > 0 
                               ? styles.stepCircleActive 
                               : styles.stepCircleCompleted
                         ]}
                      >
                         {queueInfo?.peopleAhead === 0 ? (
                            <Check size={10} color="#1A1A1A" strokeWidth={3} />
                         ) : (
                            <View style={styles.stepDotInner} />
                         )}
                      </View>
                      <Text style={styles.stepLabel}>In Queue</Text>
                   </View>
                   <View style={styles.progressStepItem}>
                      <View 
                         style={[
                            styles.stepCircle, 
                            queueInfo?.peopleAhead === 0 
                               ? styles.stepCircleActive 
                               : styles.stepCircleInactive
                         ]}
                      >
                         {queueInfo?.peopleAhead === 0 && <View style={styles.stepDotInner} />}
                      </View>
                      <Text style={styles.stepLabel}>Ready</Text>
                   </View>
                </View>
             </View>

             <TouchableOpacity 
                style={styles.trackLiveButton}
                onPress={() => navigation.navigate('TrackQueue', { trackingId: booking.queueTrackingId || booking._id })}
             >
                <Text style={styles.trackLiveButtonText}>Track Live Status</Text>
                <ChevronRight size={18} color="#C8FF00" strokeWidth={3} />
             </TouchableOpacity>
          </View>
        )}

        {/* === SALON & APPOINTMENT DETAILS === */}
        <View style={styles.detailsMainCard}>
           <View style={styles.detailsHeaderRow}>
              <View style={styles.detailsIconCircle}>
                 <Store size={20} color="#1A1A1A" />
              </View>
              <View style={{ marginLeft: 12 }}>
                 <Text style={styles.detailsTitle}>Salon & Service Details</Text>
                 <Text style={styles.detailsSubtitle}>Location and booking details</Text>
              </View>
           </View>

           {/* Detailed Information Grid */}
           <View style={styles.detailsGrid}>
             {/* Shop Details */}
             <View style={styles.detailsGridItem}>
               <View style={styles.detailIconSmall}>
                  <Store size={18} color="#606058" />
               </View>
               <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.detailItemLabel}>Salon</Text>
                  <Text style={styles.detailItemValue}>{shopName || "GlossCut Studio"}</Text>
                  {booking.barberId?.shopAddress ? (
                    <Text style={styles.detailItemSubText}>{booking.barberId.shopAddress}</Text>
                  ) : null}
                  {booking.barberId?.shopId ? (
                    <TouchableOpacity 
                      style={styles.inlineActionBtn}
                      onPress={() => navigation.navigate('ShopMapScreen', { shopId: booking.barberId.shopId })}
                    >
                      <MapPin size={14} color="#1A1A1A" />
                      <Text style={styles.inlineActionText}>View on Salon Map</Text>
                    </TouchableOpacity>
                  ) : null}
               </View>
             </View>

             {/* Barber Details */}
             {booking.barberId && (
               <View style={styles.detailsGridItem}>
                 <View style={styles.detailIconSmall}>
                    <User size={18} color="#606058" />
                 </View>
                 <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.detailItemLabel}>Barber</Text>
                    <Text style={styles.detailItemValue}>{barberName}</Text>
                    {booking.barberId.phone ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 12 }}>
                        <Text style={styles.detailItemSubText}>{booking.barberId.phone}</Text>
                        <TouchableOpacity 
                          style={styles.inlineCallIcon}
                          onPress={() => callNumber(booking.barberId.phone)}
                        >
                           <PhoneCall size={12} color="#16A34A" />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                 </View>
               </View>
             )}

             {/* Booking Time */}
             <View style={styles.detailsGridItem}>
               <View style={styles.detailIconSmall}>
                  <Calendar size={18} color="#606058" />
               </View>
               <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.detailItemLabel}>Appointment Time</Text>
                  <Text style={styles.detailItemValue}>
                    {booking.time} on {formattedDate}
                  </Text>
               </View>
             </View>
           </View>
        </View>

        {/* === HELP SECTION === */}
        <TouchableOpacity 
           style={styles.helpCard}
           onPress={() => navigation.navigate("Chat")}
        >
           <View style={styles.helpIconCircle}>
              <MessageSquare size={20} color="#666" />
           </View>
           <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.helpTitle}>Need help?</Text>
              <Text style={styles.helpSubtitle}>Chat with us about any issue related to your booking</Text>
           </View>
           <ChevronRight size={20} color="#CCC" />
        </TouchableOpacity>



        {/* === TOKEN / OTP SECTION === */}
        {booking.otp && booking.status === "confirmed" && (
          <View style={styles.tokenWrapper}>
            <View style={styles.tokenTop}>
              <Text style={styles.tokenTitle}>Verification Code</Text>
              <Text style={styles.tokenSub}>Share this with your barber to start session</Text>
            </View>
            
            <View style={styles.ripContainer}>
              <View style={styles.ripCircleLeft} />
              <View style={styles.dotsContainer}>
                {PERF_DOTS.map((_, i) => <View key={i} style={styles.perfDot} />)}
              </View>
              <View style={styles.ripCircleRight} />
            </View>
            
            <View style={styles.tokenBottom}>
              <View style={styles.otpVault}>
                <Text style={styles.otpDigit}>{booking.otp}</Text>
              </View>
              <View style={styles.trustFooter}>
                <ShieldCheck size={14} color="#166534" />
                <Text style={styles.trustText}>Secure Verification</Text>
              </View>
            </View>
          </View>
        )}

        {/* === ACTIONS === */}
        {booking.paymentStatus === "pending" && booking.status === "confirmed" && (
          <TouchableOpacity
            style={[styles.payBtnNew, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              navigation.navigate("PaymentConfirmation", {
                providerName: barberName,
                providerId: booking.barberId?._id,
                selectedServices: booking.services,
                totalPrice: booking.totalPrice,
                bookingId: booking._id,
                fromHistory: false
              });
            }}
          >
            <Text style={styles.payBtnTextNew}>Proceed to Payment</Text>
          </TouchableOpacity>
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
                  borderColor: theme.colors.border
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
                        borderColor: theme.colors.border
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
                          borderLeftColor: theme.colors.primary
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
                        <Text
                          style={[
                            styles.emojiChar,
                            rating > 0 &&
                            rating !== item.id && { opacity: 0.4 },
                          ]}
                        >
                          {item.char}
                        </Text>
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
                              borderColor: theme.colors.border
                            },
                            isSelected && {
                              backgroundColor: theme.colors.primary + "15",
                              borderColor: theme.colors.primary
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
                                fontWeight: "700"
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
                        borderColor: theme.colors.border
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
                        borderColor: theme.colors.border
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
                        shadowColor: theme.colors.primary
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB'
  },
  backButtonCircle: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statusBannerCard: {
    borderRadius: normalize(20),
    padding: normalize(18),
    marginBottom: normalize(16),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(12)
  },
  statusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    lineHeight: 20
  },
  miniLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center'
  },
  miniLogoText: {
    color: '#C8FF00',
    fontSize: 14,
    fontWeight: '900'
  },
  ratingPromptCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  starCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  ratingPromptText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#222'
  },
  rateNowBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10
  },
  rateNowText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800'
  },

  // Partner Card
  partnerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  partnerAvatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#fff'
  },
  partnerAvatar: {
    width: '100%',
    height: '100%'
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 16
  },
  partnerGreeting: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  partnerName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111',
    marginTop: 1
  },
  partnerCallBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4'
  },

  // Tip Section
  tipSectionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },
  tipHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
    letterSpacing: -0.5
  },
  tipSubheader: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 20
  },
  tipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  tipPill: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#fff',
    alignItems: 'center',
    minWidth: 74,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1
  },
  tipEmoji: {
    fontSize: 22,
    marginBottom: 6
  },
  tipAmountText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111'
  },
  tipThanksCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7'
  },
  tipThanksIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  tipThanksText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#166534'
  },
  tipRemoveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
    textTransform: 'uppercase'
  },

  // Details Card
  detailsMainCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E7E2'
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26
  },
  detailsIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E7E2'
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  detailsSubtitle: {
    fontSize: 13,
    color: '#606058',
    marginTop: 2
  },
  trackingCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E7E2'
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EFE9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E7E2',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  liveQueueDashboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  queueMetricBox: {
    flex: 1,
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#E8E7E2',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#606058',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  queueMetricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  progressBarWrapper: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F0EFE9',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
  },
  progressBarSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStepItem: {
    alignItems: 'center',
    width: 60,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    borderColor: '#1A1A1A',
    backgroundColor: '#C8FF00',
  },
  stepCircleActive: {
    borderColor: '#1A1A1A',
    backgroundColor: '#fff',
  },
  stepCircleInactive: {
    borderColor: '#E8E7E2',
    backgroundColor: '#FDFDFD',
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A1A1A',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#606058',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trackLiveButton: {
    height: normalize(50),
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  trackLiveButtonText: {
    color: '#fff',
    fontSize: normalize(13),
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  detailsGrid: {
    marginTop: 8,
    gap: 20,
  },
  detailsGridItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailItemSubText: {
    fontSize: 14,
    color: '#606058',
    marginTop: 2,
    lineHeight: 18,
  },
  inlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F0EFE9',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  inlineActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  inlineCallIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailItemRow: {
    flexDirection: 'row',
    marginBottom: 26
  },
  detailIconSmall: {
    marginTop: 4,
    width: 24,
    alignItems: 'center'
  },
  detailItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#606058',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6
  },
  detailItemValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '700',
    lineHeight: 22
  },
  detailItemSubValue: {
    fontSize: 14,
    color: '#606058',
    marginTop: 4,
    lineHeight: 20
  },

  // Help Card
  helpCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },
  helpIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  helpSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26
  },
  summaryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  summarySubtitle: {
    fontSize: 13,
    color: '#666'
  },
  summaryContent: {
    marginTop: 4
  },
  summaryServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  summaryBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginRight: 14
  },
  summaryServiceName: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    fontWeight: '600'
  },
  summaryServicePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 18
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  billLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600'
  },
  billValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700'
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryTotalLabel: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A'
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: '900'
  },
  totalTaxesLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 20,
    borderRadius: 1
  },

  // OTP & Pay
  otpCardNew: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed'
  },
  otpLabelNew: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  otpValueNew: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 12,
    color: '#0F172A'
  },
  payBtnNew: {
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6
  },
  payBtnTextNew: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  legacyReviewTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
    paddingHorizontal: 4,
    color: '#0F172A'
  },
  // Toast Styles
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
    borderWidth: 1
  },
  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2
  },
  toastMessage: {
    fontSize: 13,
    opacity: 0.9
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  tokenWrapper: {
    backgroundColor: 'transparent',
    marginTop: normalize(10),
    marginBottom: normalize(20)
  },
  tokenTop: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    padding: normalize(20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomWidth: 0
  },
  tokenTitle: {
    fontSize: normalize(12),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: normalize(4)
  },
  tokenSub: {
    fontSize: normalize(13),
    color: '#0F172A',
    fontWeight: '600'
  },
  ripContainer: {
    height: normalize(20),
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    zIndex: 10,
    position: 'relative',
    marginTop: -1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0'
  },
  ripCircleLeft: {
    width: normalize(20),
    height: normalize(20),
    borderRadius: normalize(10),
    backgroundColor: '#F6F7FB',
    marginLeft: normalize(-10),
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  ripCircleRight: {
    width: normalize(20),
    height: normalize(20),
    borderRadius: normalize(10),
    backgroundColor: '#F6F7FB',
    marginRight: normalize(-10),
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  dotsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(10),
    overflow: 'hidden'
  },
  perfDot: {
    width: normalize(4),
    height: normalize(4),
    borderRadius: normalize(2),
    backgroundColor: '#E2E8F0',
    marginHorizontal: normalize(2)
  },
  tokenBottom: {
    backgroundColor: '#F8FAFC',
    borderBottomLeftRadius: normalize(20),
    borderBottomRightRadius: normalize(20),
    padding: normalize(20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 0
  },
  otpVault: {
    backgroundColor: '#FFF',
    width: '100%',
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: normalize(12),
    flexDirection: 'row'
  },
  otpDigit: {
    fontSize: normalize(28),
    fontWeight: '900',
    letterSpacing: normalize(6),
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(20)
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900"
  },
  headerPlaceholder: {
    width: 40
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  reviewContainer: { paddingTop: 5 },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10
  },
  emojiContainer: { alignItems: "center", width: 50 },
  emojiChar: { fontSize: 32 },
  emojiLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center"
  },
  ratingFeedbackContainer: { alignItems: "center", marginBottom: 20 },
  ratingFeedbackText: { fontSize: 16, fontWeight: "700" },
  tagsLabel: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1
  },
  tagText: { fontSize: 12, fontWeight: "500" },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 12
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  submittedReviewBox: { padding: 20, borderRadius: 16, borderWidth: 1 },
  reviewEmoji: { fontSize: 40, textAlign: "center", marginBottom: 10 },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6
  },
  reviewBody: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  barberResponse: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3
  },
  responseLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  responseText: { fontSize: 14, lineHeight: 20 }
});

export default BookingDetailScreen;
