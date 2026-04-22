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
  Linking
} from "react-native";
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
  HelpCircle
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
const ToastNotification = ({ visible, message, type, onHide, topInset }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: topInset, // Dynamic top inset
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
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
        easing: Easing.in(Easing.cubic)
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
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
          borderColor: borderColor
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
  const { booking } = route.params;
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();

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
      Animated.spring(emojiAnimations[rate - 1], {
        toValue: 1.5,
        friction: 3,
        useNativeDriver: true
      }).start(() => {
        Animated.spring(emojiAnimations[rate - 1], {
          toValue: 1.2,
          friction: 3,
          useNativeDriver: true
        }).start();
      });

      emojiAnimations.forEach((anim, index) => {
        if (index !== rate - 1) {
          Animated.spring(anim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true
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
        style={[styles.header, { backgroundColor: '#F6F7FB', paddingTop: Math.max(insets.top, 10) }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButtonCircle}
        >
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#111' }]}>
          Booking Details
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.contentContainer, { backgroundColor: '#F6F7FB' }]}
        showsVerticalScrollIndicator={false}
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

        {/* === BARBER PARTNER CARD === */}
        {booking.barberId && (
          <TouchableOpacity 
            style={styles.partnerCard}
            onPress={() => navigation.navigate("BarberProfile", { barberId: booking.barberId?._id })}
          >
             <View style={styles.partnerAvatarContainer}>
               <OptimizedImage
                  source={booking.barberId?.profilePicture || "https://via.placeholder.com/100"}
                  style={styles.partnerAvatar}
               />
             </View>
             <View style={styles.partnerInfo}>
                <Text style={styles.partnerGreeting}>Meet your Barber</Text>
                <Text style={styles.partnerName}>{barberName}</Text>
             </View>
             <TouchableOpacity 
                style={styles.partnerCallBtn}
                onPress={() => callNumber(booking.barberId?.phone)}
              >
                <PhoneCall size={18} color="#16A34A" />
             </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* === TIPPING SECTION === */}
        <View style={styles.tipSectionCard}>
           <Text style={styles.tipHeader}>Appreciate your barber!</Text>
           <Text style={styles.tipSubheader}>Thank them by leaving a small tip</Text>
           <View style={styles.tipRow}>
              {[
                { id: 1, amount: 20, emoji: "✌️" },
                { id: 2, amount: 30, emoji: "💌" },
                { id: 3, amount: 50, emoji: "❤️" },
                { id: 4, label: "Other", emoji: "👏" }
              ].map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    styles.tipPill, 
                    selectedTip?.id === item.id && { backgroundColor: '#16A34A', borderColor: '#16A34A' }
                  ]}
                  onPress={() => {
                    setSelectedTip(item);
                    setTipConfirmed(true);
                  }}
                >
                   <Text style={styles.tipEmoji}>{item.emoji}</Text>
                   <Text style={[
                     styles.tipAmountText, 
                     selectedTip?.id === item.id && { color: '#fff' }
                   ]}>
                     {item.amount ? `₹${item.amount}` : item.label}
                   </Text>
                </TouchableOpacity>
              ))}
           </View>

           {tipConfirmed && selectedTip && (
             <View style={styles.tipThanksCard}>
                <View style={styles.tipThanksIcon}>
                   <Heart size={16} color="#fff" fill="#fff" />
                </View>
                <Text style={styles.tipThanksText}>
                  {barberName} will be so happy! ❤️
                </Text>
                <TouchableOpacity onPress={() => {
                  setSelectedTip(null);
                  setTipConfirmed(false);
                }}>
                   <Text style={styles.tipRemoveText}>Remove</Text>
                </TouchableOpacity>
             </View>
           )}
        </View>

        {/* === BOOKING DETAILS SECTION === */}
        <View style={styles.detailsMainCard}>
           <View style={styles.detailsHeaderRow}>
              <View style={styles.detailsIconCircle}>
                 <Clock size={20} color="#666" />
              </View>
              <View style={{ marginLeft: 12 }}>
                 <Text style={styles.detailsTitle}>Booking details</Text>
                 <Text style={styles.detailsSubtitle}>Details of your appointment</Text>
              </View>
           </View>

           <View style={styles.detailItemRow}>
              <View style={styles.detailIconSmall}>
                 <MapPin size={18} color="#666" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                 <Text style={styles.detailItemLabel}>Service Location</Text>
                 <Text style={styles.detailItemValue}>{shopName || "At Customer Location"}</Text>
                 <Text style={styles.detailItemSubValue}>{shopAddress || "Address provided during booking"}</Text>
              </View>
           </View>

           <View style={styles.detailItemRow}>
              <View style={styles.detailIconSmall}>
                 <Phone size={18} color="#666" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                 <Text style={styles.detailItemValue}>{user?.name}, {user?.phone}</Text>
              </View>
           </View>
        </View>

        {/* === HELP SECTION === */}
        <TouchableOpacity style={styles.helpCard}>
           <View style={styles.helpIconCircle}>
              <MessageSquare size={20} color="#666" />
           </View>
           <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.helpTitle}>Need help?</Text>
              <Text style={styles.helpSubtitle}>Chat with us about any issue related to your booking</Text>
           </View>
           <ChevronRight size={20} color="#CCC" />
        </TouchableOpacity>

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
                   <Text style={styles.billLabel}>Barber Tip</Text>
                   <Text style={styles.billValue}>₹{selectedTip.amount}</Text>
                </View>
              )}
              <View style={styles.billRow}>
                 <Text style={styles.billLabel}>Convenience Fee</Text>
                 <Text style={[styles.billValue, { color: '#16A34A' }]}>FREE</Text>
              </View>
              
              <View style={[styles.summaryDivider, { marginVertical: 14 }]} />
              
              <View style={styles.summaryTotalRow}>
                 <Text style={styles.summaryTotalLabel}>Grand Total</Text>
                 <Text style={[styles.summaryTotalValue, { color: '#000' }]}>
                   ₹{(parseFloat(totalPrice) + (selectedTip?.amount || 0)).toFixed(2)}
                 </Text>
              </View>
           </View>
        </View>

        {/* === OTP SECTION (If needed) === */}
        {booking.otp && booking.status === "confirmed" && (
          <View style={[styles.otpCardNew, { borderColor: theme.colors.primary + '40' }]}>
            <Text style={styles.otpLabelNew}>Verification Code</Text>
            <Text style={[styles.otpValueNew, { color: theme.colors.primary }]}>{booking.otp}</Text>
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
                        <Animated.Text
                          style={[
                            styles.emojiChar,
                            {
                              transform: [
                                { scale: emojiAnimations[item.id - 1] },
                              ]
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
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
    marginBottom: 12
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
    elevation: 3
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
    borderColor: '#F1F5F9'
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  detailsSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2
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
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6
  },
  detailItemValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '700',
    lineHeight: 22
  },
  detailItemSubValue: {
    fontSize: 14,
    color: '#64748B',
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
    paddingHorizontal: 20,
    paddingBottom: 16
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
