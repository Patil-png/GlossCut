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
  const [showReviewForm, setShowReviewForm] = useState(false);

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

    const isCompleted = booking.status === 'completed';
    const isConfirmed = booking.status === 'confirmed';
    const isCancelled = booking.status === 'cancelled';
    const isPending = booking.status === 'pending';

    return (
      <View
        style={[styles.container, { backgroundColor: '#F8FAFC' }]}
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
          style={[styles.header, { backgroundColor: '#FFFFFF', paddingTop: Math.max(insets.top, 16), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.newBackButtonCircle}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#0F172A" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#0F172A', fontWeight: '900', fontSize: 18, letterSpacing: -0.5 }]}>
            Booking Details
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.contentContainer, { backgroundColor: '#F8FAFC' }]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
        >
          <View style={{ height: 16 }} />
          
          {/* === STATUS BANNER === */}
          <View style={styles.statusBannerCard}>
             <LinearGradient 
               colors={
                 isCancelled ? ['#2A1212', '#140808'] : 
                 isCompleted ? ['#0B1F13', '#050F09'] : 
                 isPending ? ['#241A0B', '#120D05'] : ['#18181B', '#09090B']
               } 
               start={{ x: 0, y: 0 }} 
               end={{ x: 1, y: 1 }}
               style={styles.cardGradientBg}
             />
             <View style={styles.statusHeaderRow}>
                <View style={[
                  styles.statusIconCircle, 
                  { 
                    backgroundColor: 
                      isCancelled ? '#EF4444' : 
                      isCompleted ? '#10B981' : 
                      isPending ? '#F59E0B' : '#C8FF00' 
                  }
                ]}>
                   {isCancelled ? (
                     <X size={16} color="#FFF" strokeWidth={3} />
                   ) : isCompleted ? (
                     <Check size={16} color="#FFF" strokeWidth={3} />
                   ) : isPending ? (
                     <Clock size={16} color="#FFF" strokeWidth={3} />
                   ) : (
                     <Check size={16} color="#000" strokeWidth={3} />
                   )}
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                   <Text style={[
                     styles.statusTitle, 
                     { 
                       color: 
                         isCancelled ? '#FCA5A5' : 
                         isCompleted ? '#A7F3D0' : 
                         isPending ? '#FDE68A' : '#C8FF00' 
                     }
                   ]}>
                      {booking.status.toUpperCase()}
                   </Text>
                   <Text style={styles.statusSubtitleDark}>
                      {isConfirmed ? 'Your barber is ready for the session' : 
                       isCompleted ? 'Service finished successfully' : 
                       isPending ? 'Waiting for barber confirmation' : 
                       booking.cancellationReason || 'Booking was not successful'}
                   </Text>
                </View>
                <View style={[styles.miniLogoContainer, { borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }]}>
                   <Text style={styles.miniLogoText}>GC</Text>
                </View>
             </View>

             {isCompleted && !hasReviewed && !showReviewForm && (
               <TouchableOpacity 
                 style={styles.ratingPromptCardDark} 
                 activeOpacity={0.8}
                 onPress={() => setShowReviewForm(true)}
               >
                  <View style={styles.starCircleDark}>
                     <Star size={18} color="#F59E0B" fill="#F59E0B" />
                  </View>
                  <Text style={styles.ratingPromptTextDark}>How was your service experience?</Text>
                  <View style={styles.rateNowBtnDark}>
                     <Text style={styles.rateNowTextDark}>Rate now</Text>
                  </View>
               </TouchableOpacity>
             )}
          </View>

          {/* === ORDER SUMMARY === */}
          <View style={styles.summaryCard}>
             <View style={styles.summaryHeaderRow}>
                <View style={styles.summaryIconCircle}>
                   <Receipt size={20} color="#0F172A" />
                </View>
                <View style={{ marginLeft: 12 }}>
                   <Text style={styles.summaryTitle}>Receipt & Payment</Text>
                   <Text style={styles.summarySubtitle}>ID: SETKAR/2026/{booking._id?.slice(-6).toUpperCase()}</Text>
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
                     <Text style={styles.billLabel}>Barber Tip</Text>
                     <Text style={[styles.billValue, { color: '#10B981' }]}>+ ₹{selectedTip.amount}</Text>
                  </View>
                )}
                <View style={styles.billRow}>
                   <Text style={styles.billLabel}>Convenience Fee</Text>
                   <Text style={[styles.billValue, { color: '#10B981', fontWeight: '800' }]}>FREE</Text>
                </View>
                <View style={styles.billRow}>
                   <Text style={styles.billLabel}>Payment Mode</Text>
                   <Text style={[styles.billValue, { textTransform: 'uppercase' }]}>{booking.paymentMethod || "CASH"}</Text>
                </View>
                
                <View style={styles.dashedDivider} />
                
                <View style={styles.summaryTotalRowContainer}>
                   <LinearGradient 
                     colors={['#F8FAFC', '#F1F5F9']} 
                     style={styles.totalRowGradient}
                   />
                   <View>
                      <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                      <Text style={styles.totalTaxesLabel}>PAY AT SHOP</Text>
                   </View>
                   <Text style={styles.summaryTotalValue}>
                     ₹{(parseFloat(totalPrice) + (selectedTip?.amount || 0)).toFixed(2)}
                   </Text>
                </View>
             </View>
          </View>

          {/* === TRACK APPOINTMENT (Live Queue Status) === */}
          {(isConfirmed || isPending) && (
            <View style={styles.trackingCard}>
               <View style={styles.detailsHeaderRow}>
                  <LinearGradient colors={['rgba(200, 255, 0, 0.2)', 'rgba(200, 255, 0, 0.05)']} style={[styles.detailsIconCircle, { borderColor: 'rgba(200, 255, 0, 0.4)', borderWidth: 1 }]}>
                     <Clock size={20} color="#0F172A" />
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                     <Text style={[styles.detailsTitle, { fontSize: 16, fontWeight: '900' }]}>Live Queue Status</Text>
                     <Text style={[styles.detailsSubtitle, { color: '#64748B' }]}>Track your turn in real time</Text>
                  </View>
                  <View style={[styles.liveBadge, { backgroundColor: '#10B981', borderColor: 'transparent', shadowColor: '#10B981', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }]}>
                     <Animated.View style={[styles.liveDot, { backgroundColor: '#FFF', opacity: pulseAnim }]} />
                     <Text style={[styles.liveBadgeText, { color: '#FFF' }]}>LIVE</Text>
                  </View>
               </View>

               {/* Live Queue Dashboard */}
               <View style={styles.liveQueueDashboard}>
                  <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.queueMetricBox}>
                     <Text style={styles.queueMetricLabel}>Your Rank</Text>
                     <Text style={[styles.queueMetricValue, { color: '#0F172A' }]}>
                        #{queueInfo?.queuePosition || booking.queuePosition || "1"}
                     </Text>
                  </LinearGradient>
                  <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.queueMetricBox}>
                     <Text style={styles.queueMetricLabel}>People Ahead</Text>
                     <Text style={[styles.queueMetricValue, { color: '#0F172A' }]}>
                        {queueInfo?.peopleAhead !== undefined 
                           ? queueInfo.peopleAhead 
                           : "0"}
                     </Text>
                  </LinearGradient>
                  <LinearGradient colors={['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.02)']} style={[styles.queueMetricBox, { borderColor: 'rgba(16,185,129,0.2)' }]}>
                     <Text style={[styles.queueMetricLabel, { color: '#10B981' }]}>Est. Wait</Text>
                     <Text style={[styles.queueMetricValue, { color: '#10B981', fontSize: 20 }]}>
                        {queueInfo?.estimatedWaitMinutes 
                           ? `${queueInfo.estimatedWaitMinutes}m` 
                           : "10m"}
                     </Text>
                  </LinearGradient>
               </View>


               <TouchableOpacity 
                  style={styles.trackLiveButton}
                  onPress={() => navigation.navigate('TrackQueue', { trackingId: booking.queueTrackingId || booking._id })}
                  activeOpacity={0.9}
               >
                  <LinearGradient 
                    colors={['#1E293B', '#0F172A']} 
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 0 }} 
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.trackLiveButtonText}>View Live Pass</Text>
                  <ChevronRight size={16} color="#C8FF00" strokeWidth={3.5} />
               </TouchableOpacity>
            </View>
          )}



          {/* === HELP SECTION === */}
          <TouchableOpacity 
             style={styles.helpCard}
             onPress={() => navigation.navigate("Chat")}
             activeOpacity={0.7}
          >
             <View style={styles.helpIconCircle}>
                <MessageSquare size={18} color="#475569" />
             </View>
             <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.helpTitle}>Support & Help</Text>
                <Text style={styles.helpSubtitle}>Have an issue? Chat with support</Text>
             </View>
             <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* === TOKEN / OTP SECTION === */}
          {booking.otp && isConfirmed && (
            <View style={styles.tokenWrapper}>
              <View style={[styles.tokenTop, { backgroundColor: '#18181B', borderColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={[styles.tokenTitle, { color: '#C8FF00' }]}>Verification Code</Text>
                <Text style={[styles.tokenSub, { color: '#FFF' }]}>Share this with your barber to start session</Text>
              </View>
              
              <View style={[styles.ripContainer, { backgroundColor: '#18181B', borderColor: 'rgba(255,255,255,0.1)' }]}>
                <View style={[styles.ripCircleLeft, { backgroundColor: '#F8FAFC', borderColor: 'rgba(255,255,255,0.1)' }]} />
                <View style={styles.dotsContainer}>
                  {PERF_DOTS.map((_, i) => <View key={i} style={[styles.perfDot, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />)}
                </View>
                <View style={[styles.ripCircleRight, { backgroundColor: '#F8FAFC', borderColor: 'rgba(255,255,255,0.1)' }]} />
              </View>
              
              <View style={[styles.tokenBottom, { backgroundColor: '#09090B', borderColor: 'rgba(255,255,255,0.1)' }]}>
                <View style={[styles.otpVault, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                  <Text style={[styles.otpDigit, { color: '#FFF' }]}>{booking.otp}</Text>
                </View>
                <View style={[styles.trustFooter, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <ShieldCheck size={14} color="#10B981" />
                  <Text style={[styles.trustText, { color: '#10B981', fontWeight: '800' }]}>SECURE ACCESS VERIFIED</Text>
                </View>
              </View>
            </View>
          )}

          {/* === ACTIONS === */}
          {booking.paymentStatus === "pending" && isConfirmed && (
            <TouchableOpacity
              style={styles.proceedPaymentBtn}
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
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#1E293B', '#0F172A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.proceedPaymentBtnText}>Proceed to Payment</Text>
              <ChevronRight size={18} color="#C8FF00" strokeWidth={3} />
            </TouchableOpacity>
          )}

          {/* === REVIEW SECTION === */}
          {isCompleted && (hasReviewed || showReviewForm) && (
            <View style={{ marginTop: 8 }}>
              <View style={styles.reviewSectionHeader}>
                <View style={styles.reviewHeaderPill}>
                  <Text style={styles.reviewHeaderPillText}>
                    {hasReviewed ? "Your Review" : "Share Your Feedback"}
                  </Text>
                </View>
                <View style={styles.reviewHeaderLine} />
              </View>
              <View style={styles.reviewMainCard}>
                {hasReviewed ? (
                  <View style={styles.reviewContainer}>
                    <View style={styles.submittedReviewBox}>
                      <Text style={styles.reviewEmoji}>
                        {RATING_EMOJIS[customerReview?.rating - 1]?.char || "⭐"}
                      </Text>
                      <Text style={styles.reviewTitleText}>
                        {customerReview?.title || "Rating Submitted"}
                      </Text>
                      <Text style={styles.reviewBodyText}>
                        {customerReview?.comment}
                      </Text>
                    </View>
                    {customerReview?.barberResponse && (
                      <View style={styles.barberResponseBox}>
                        <View style={styles.barberResponseHeader}>
                          <MessageSquare size={14} color="#1E293B" />
                          <Text style={styles.responseLabelText}>Response from Barber</Text>
                        </View>
                        <Text style={styles.responseTextText}>
                          {customerReview.barberResponse}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.reviewContainer}>
                    {/* Emoji Rating Row */}
                    <View style={styles.emojiContainerRow}>
                      {RATING_EMOJIS.map((item) => {
                        const isSelected = rating === item.id;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.emojiTouch,
                              isSelected && styles.emojiTouchSelected
                            ]}
                            onPress={() => handleRating(item.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.emojiChar,
                              rating > 0 && !isSelected && { opacity: 0.35, transform: [{ scale: 0.9 }] }
                            ]}>
                              {item.char}
                            </Text>
                             <Text style={[
                               styles.emojiLabelText,
                               { color: isSelected ? '#FFF' : '#94A3B8', fontWeight: isSelected ? '800' : '500' }
                             ]}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>



                    {/* Quick Tags */}
                    <Text style={styles.feedbackSectionTitle}>What went well?</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false} 
                      contentContainerStyle={styles.tagsHorizontalScroll}
                      style={{ marginBottom: 20 }}
                    >
                      {QUICK_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <TouchableOpacity
                            key={tag}
                            style={[
                              styles.tagChipNew,
                              isSelected && styles.tagChipSelected
                            ]}
                            onPress={() => toggleTag(tag)}
                          >
                            <Text style={[
                              styles.tagChipText,
                              isSelected && styles.tagChipTextSelected
                            ]}>
                              {tag}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <TextInput
                      style={styles.reviewTextInput}
                      placeholder="Title for your review (e.g. Great haircut!)"
                      placeholderTextColor="#94A3B8"
                      value={title}
                      onChangeText={setTitle}
                    />


                    <TouchableOpacity
                      style={[
                        styles.submitFeedbackBtn,
                        rating === 0 && { opacity: 0.5 }
                      ]}
                      onPress={handleReviewSubmit}
                      disabled={rating === 0}
                      activeOpacity={0.9}
                    >
                      <LinearGradient 
                        colors={['#1E293B', '#0F172A']} 
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 0 }} 
                        style={StyleSheet.absoluteFillObject}
                      />
                      <Text style={styles.submitFeedbackBtnText}>Submit Review</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  newBackButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
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
  cardGradientBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: normalize(20),
  },
  statusBannerCard: {
    borderRadius: normalize(20),
    padding: normalize(18),
    marginBottom: normalize(16),
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  statusIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  statusSubtitleDark: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '500'
  },
  miniLogoContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center'
  },
  miniLogoText: {
    color: '#C8FF00',
    fontSize: 12,
    fontWeight: '900'
  },
  ratingPromptCardDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 2,
  },
  starCircleDark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  ratingPromptTextDark: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF'
  },
  rateNowBtnDark: {
    backgroundColor: '#C8FF00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  rateNowTextDark: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900'
  },
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
  detailsMainCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  detailsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3
  },
  detailsSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  trackingCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveQueueDashboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  queueMetricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  queueMetricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  progressBarWrapper: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 12,
  },
  progressBarFillGradient: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#C8FF00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2
  },
  progressBarSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    borderColor: '#0F172A',
    backgroundColor: '#C8FF00',
  },
  stepCircleActive: {
    borderColor: '#0F172A',
    backgroundColor: '#fff',
  },
  stepCircleInactive: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F172A',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trackLiveButton: {
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trackLiveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    zIndex: 2,
  },
  detailsList: {
    marginTop: 8,
  },
  detailListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailItemLabelText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailItemValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailItemAddressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  detailActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  detailActionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textDecorationLine: 'underline',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  helpCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  helpIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  helpSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  summaryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  summaryContent: {
    marginTop: 4
  },
  summaryServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  summaryBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginRight: 12
  },
  summaryServiceName: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    fontWeight: '600'
  },
  summaryServicePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  billLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600'
  },
  billValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700'
  },
  summaryTotalRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  totalRowGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    zIndex: 2,
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    zIndex: 2,
  },
  totalTaxesLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
    zIndex: 2,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 16,
    borderRadius: 1
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
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    padding: normalize(20),
    alignItems: 'center',
    borderWidth: 1,
    borderBottomWidth: 0
  },
  tokenTitle: {
    fontSize: normalize(12),
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: normalize(4)
  },
  tokenSub: {
    fontSize: normalize(13),
    fontWeight: '600'
  },
  ripContainer: {
    height: normalize(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    zIndex: 10,
    position: 'relative',
    marginTop: -1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  ripCircleLeft: {
    width: normalize(20),
    height: normalize(20),
    borderRadius: normalize(10),
    marginLeft: normalize(-10),
    borderWidth: 1,
  },
  ripCircleRight: {
    width: normalize(20),
    height: normalize(20),
    borderRadius: normalize(10),
    marginRight: normalize(-10),
    borderWidth: 1,
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
    marginHorizontal: normalize(2)
  },
  tokenBottom: {
    borderBottomLeftRadius: normalize(20),
    borderBottomRightRadius: normalize(20),
    padding: normalize(20),
    alignItems: 'center',
    borderWidth: 1,
    borderTopWidth: 0
  },
  otpVault: {
    width: '100%',
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: normalize(12),
    flexDirection: 'row'
  },
  otpDigit: {
    fontSize: normalize(28),
    fontWeight: '900',
    letterSpacing: normalize(6),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(20)
  },
  trustText: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900"
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  proceedPaymentBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  proceedPaymentBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    zIndex: 2,
  },
  reviewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
  },
  reviewHeaderPill: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewHeaderPillText: {
    color: '#1A1A1A',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  reviewHeaderLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 1,
  },
  reviewMainCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reviewContainer: {
    paddingTop: 4,
  },
  submittedReviewBox: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  reviewEmoji: {
    fontSize: 44,
    textAlign: 'center',
    marginBottom: 10,
  },
  reviewTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  reviewBodyText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  barberResponseBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderLeftWidth: 4,
    borderLeftColor: '#0F172A',
  },
  barberResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  responseLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  responseTextText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  emojiContainerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emojiTouch: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  emojiTouchSelected: {
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  emojiChar: {
    fontSize: 34,
  },
  emojiLabelText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  ratingFeedbackBox: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  ratingFeedbackTextBox: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  feedbackSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  tagsHorizontalScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 10,
  },
  tagChipNew: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  tagChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tagChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  reviewTextInput: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 12,
  },
  reviewTextAreaInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitFeedbackBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  submitFeedbackBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    zIndex: 2,
  }
});

export default BookingDetailScreen;
