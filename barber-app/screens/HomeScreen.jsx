import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Platform,
  Easing,
  RefreshControl,
  Alert,
  Linking,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Calendar,
  Wallet,
  Clock,
  ArrowRight,
  TrendingUp,
  Scissors,
  User,
  CreditCard,
  Star,
  Phone, // Added for Modal
  MessageCircle, // Added for Modal
  X, // Added for Modal
  ShieldCheck,
} from "lucide-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useFocusEffect } from "@react-navigation/native";
import { format, parse } from "date-fns";
import api from "../utils/api";

const { width: screenWidth } = Dimensions.get("window");

// --- 1. Helper: Ink-Like Barcode ---
const Barcode = () => (
  <View style={styles.barcodeContainer}>
    {[4, 2, 6, 2, 1, 3, 5, 2, 4, 1, 3, 5, 2, 4, 2, 6, 2, 4, 1, 2].map(
      (w, i) => (
        <View key={i} style={[styles.barcodeLine, { width: w }]} />
      )
    )}
  </View>
);

// --- 2. Helper: Sepia Dashed Separator ---
const DashedLine = () => (
  <View style={styles.dashedLineContainer}>
    {[...Array(22)].map((_, i) => (
      <View key={i} style={styles.dash} />
    ))}
  </View>
);

// --- 3. Component: Scale Button (Micro-interaction) ---
const ScaleButton = ({ onPress, style, children, activeScale = 0.98 }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, { transform: [{ scale: scaleValue }] }]}
    >
      {children}
    </TouchableOpacity>
  );
};

// --- 4. Component: Activity Item ---
const ActivityItem = ({ icon: Icon, title, subtitle, isLast, theme }) => (
  <View style={[styles.activityItem, isLast && styles.activityItemLast]}>
    <View style={[styles.activityIconBox, { backgroundColor: theme.colors.iconBackground }]}>
      <Icon size={18} color={theme.colors.primary} strokeWidth={2} />
    </View>
    <View style={styles.activityContent}>
      <Text style={[styles.activityTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.activitySubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
    </View>
    <ArrowRight size={16} color={theme.colors.border} />
  </View>
);

// --- 5. Component: Contact Action Modal (NEW) ---
const ContactModal = ({ visible, onClose, customer, theme }) => {
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible && slideAnim._value === 0) return null;

  const phoneNumber = customer?.phone?.replace(/\D/g, "");

  const handleCall = () => {
    Linking.openURL(`tel:${phoneNumber}`);
    onClose();
  };

  const handleWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=${phoneNumber}`);
    onClose();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.modalContent, { transform: [{ translateY }], backgroundColor: theme.colors.card }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Contact Customer</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.colors.background }]}>
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
            How would you like to reach{" "}
            <Text style={{ fontWeight: "700", color: theme.colors.text }}>
              {customer?.name}
            </Text>
            ?
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.callBtn]}
              onPress={handleCall}
            >
              <Phone size={24} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.callBtnText}>Phone Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.whatsappBtn]}
              onPress={handleWhatsApp}
            >
              <MessageCircle
                size={24}
                color="#FFF"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.whatsappBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.colors.background }]} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const HomeScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user, updateAvailability, isMainOwner } = useAuth();
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [pendingMediaAds, setPendingMediaAds] = useState([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [barberCardImage, setBarberCardImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCustomer, setNextCustomer] = useState(null);
  const [queueLength, setQueueLength] = useState(0);
  const [currentToken, setCurrentToken] = useState(1);

  // New State for Modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [dailyStats, setDailyStats] = useState({ served: 0, left: 0 });

  const insets = useSafeAreaInsets();

  // Animation for "Live" status pulsing
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // --- Animation for Floating Ticket (Levitation) ---
  const floatAnim = useRef(new Animated.Value(0)).current;

  // --- Logic Layer ---
  useEffect(() => {
    if (isAvailable) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAvailable]);

  useEffect(() => {
    // Floating Animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000, // Slow, smooth float
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    // Data Fetching Logic (Shop ownership now handled by AuthContext)
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/notifications');
        const unreadNotifications = res.data.filter(
          (notification) => !notification.read
        );
        setNotificationCount(unreadNotifications.length);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();
    const notificationsInterval = setInterval(fetchNotifications, 10000);
    const earningsInterval = setInterval(fetchDailyEarnings, 10000);
    return () => {
      clearInterval(notificationsInterval);
      clearInterval(earningsInterval);
    };
  }, []);

  useEffect(() => {
    if (user) {
      setIsAvailable(user.isAvailable);
    }
  }, [user?.isAvailable]);

  const checkPendingMediaAds = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/api/ads/barber/${user.id}`);
      // Check for ads that are paid but have no media uploaded yet
      const incompleteAds = res.data.filter(ad =>
        ad.status === 'paid' && !ad.mediaUrl && !ad.videoUrl
      );
      setPendingMediaAds(incompleteAds);
    } catch (err) {
      console.error("Error checking pending media ads:", err);
    }
  };

  // Refetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user && user._id) {
        console.log("HomeScreen focused - refetching all data");
        fetchQueueData();
        fetchDailyEarnings();
        fetchDailyStats();
        fetchBarberCardImage();
        checkPendingMediaAds();
      }
    }, [user])
  );

  const fetchBarberCardImage = async () => {
    try {
      const response = await api.get('/api/barber-card/my-card');
      if (response.data && response.data.image) {
        const barberCardImageUri = response.data.image.startsWith("http")
          ? response.data.image
          : `${process.env.EXPO_PUBLIC_API_URL}${response.data.image}`;
        setBarberCardImage(barberCardImageUri);
      }
    } catch (err) {
      console.log("Could not fetch barber card image:", err.message);
    }
  };

  const handleAvailabilityChange = async () => {
    await updateAvailability(!isAvailable);
  };

  // Queue data fetching function (moved outside useEffect for accessibility)
  const fetchQueueData = async () => {
    try {
      // Use the same date logic as QueueManagementScreen
      const today = new Date();
      const formattedDate = format(today, "yyyy-MM-dd");

      const res = await api.get(`/api/booking/barber-appointments/${user._id}?date=${formattedDate}`);

      // Use real appointments data from QueueManagementScreen API
      let appointments = Array.isArray(res.data)
        ? res.data.filter(
          (booking) =>
            ["pending", "confirmed", "started", "completed"].includes(
              booking.status
            ) && booking.paymentStatus !== "failed"
        )
        : [];

      // Helper for Express check
      const isExpress = (app) => {
        return (
          (app.appointmentType &&
            app.appointmentType.toLowerCase().includes("express")) ||
          (app.isPromoted === true)
        );
      };

      // Auto-remove unpaid appointments after 5 minutes
      const now = new Date();
      appointments = appointments.filter((appointment) => {
        if (
          appointment.paymentStatus === "pending" ||
          appointment.status === "pending"
        ) {
          const appointmentTime = new Date(
            appointment.createdAt || appointment.date
          );
          const minutesElapsed = (now - appointmentTime) / (1000 * 60);

          if (minutesElapsed > 5) {
            return false;
          }
        }
        return true;
      });

      // --- ENHANCED SORT LOGIC (Matches QueueManagementScreen) ---
      // 1. Started Top
      // 2. Tier (Express > Basic) [With Hard Demotion Logic]
      // 3. Time (FIFO)

      // Filter lists first
      const completedSection = appointments.filter((app) => app.status === "completed");
      const activeRaw = appointments.filter(
        (app) => app.status === "confirmed" || app.status === "started"
      );

      // Sort Active Queue
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

        return aScore - bScore;
      });

      setQueueLength(appointments.length);

      // Find active appointments (excluding any potentially stuck pending ones if needed, but logic above handles them)
      // activeRaw is strictly confirmed/started.

      const activeAppointments = activeRaw;

      // Set currentToken to the number of completed appointments + 1
      setCurrentToken(Math.min(completedSection.length + 1, appointments.length));

      if (activeAppointments.length > 0) {
        // Show the first active appointment (either currently started or next to start)
        const nextAppointment = activeAppointments[0];

        setNextCustomer({
          name: nextAppointment.isOfflineBooking ? nextAppointment.customerName : nextAppointment.userId.name,
          service: nextAppointment.services.map((s) => s.name).join(", "),
          time: nextAppointment.time,
          image: nextAppointment.isOfflineBooking ? null : nextAppointment.userId.profilePicture,
          status: nextAppointment.status,
          id: nextAppointment._id,
          phone: nextAppointment.isOfflineBooking ? nextAppointment.customerPhone : nextAppointment.userId.phone,
        });
      } else {
        setNextCustomer(null);
      }

      // Calculate Daily stats
      const served = completedSection.length;
      const left = activeAppointments.length;
      setDailyStats({ served, left });

    } catch (err) {
      console.log("Error fetching queue data:", err);
      if (err.response?.status === 401) {
        // Token expired or invalid, handle logout if needed
      }
    }
  };

  // Fetch Daily Earnings Logic
  const fetchDailyEarnings = async () => {
    try {
      const res = await api.get('/api/earnings?filter=day');
      if (res && res.data && res.data.totalEarnings) {
        setTodayEarnings(res.data.totalEarnings);
      } else {
        setTodayEarnings(0);
      }
    } catch (err) {
      // Silence 403 logs on HomeScreen (handled by gating)
      if (err.response?.status !== 403) {
        console.log("Error fetching daily earnings:", err.message);
      }
      setTodayEarnings(0);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const res = await api.get('/api/booking/my-daily-stats');
      setDailyStats(res.data);
    } catch (err) {
      // Silence 403 logs on HomeScreen
      if (err.response?.status !== 403) {
        console.log("Error fetching daily stats:", err.message);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh all data simultaneously including queue data
      await Promise.all([
        new Promise((resolve) => {
          fetchBarberCardImage();
          resolve();
        }),
        new Promise((resolve) => {
          const fetchNotifications = async () => {
            try {
              const res = await api.get('/api/notifications');
              const unreadNotifications = res.data.filter(
                (notification) => !notification.read
              );
              setNotificationCount(unreadNotifications.length);
            } catch (err) {
              console.error(err);
            }
            resolve();
          };
          fetchNotifications();
        }),
        new Promise((resolve) => {
          fetchDailyEarnings().then(resolve);
        }),
        new Promise((resolve) => {
          // Refresh queue data on pull-to-refresh
          fetchQueueData();
          resolve();
        }),
        new Promise((resolve) => {
          fetchDailyStats();
          resolve();
        }),
      ]);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCallNext = () => {
    if (!nextCustomer?.phone || nextCustomer.phone === "No phone") {
      Alert.alert(
        "No Phone Number",
        "No phone number available for this customer."
      );
      return;
    }
    // Instead of Alert.alert, we show the custom modal
    setShowContactModal(true);
  };

  // --- Dynamic Shadow & Float Values ---
  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14], // Floats up
  });

  const shadowOpacity = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.45], // Intense shadow at peak
  });

  const shadowRadius = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 24],
  });

  const shadowHeight = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 20],
  });

  const bgMain = isDark ? theme.colors.background : "#F4F5F7";

  return (
    <View style={[styles.container, { backgroundColor: bgMain }]}>

      {/* --- ROUNDED BOTTOM HEADER --- */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10, backgroundColor: theme.colors.card }]}>
        <View style={styles.headerContent}>
          {/* Left: Profile & Welcome */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
            style={styles.profileSection}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={
                  barberCardImage
                    ? { uri: barberCardImage }
                    : require("../assets/SetKarr.png")
                }
                style={styles.avatarImage}
              />
              {/* Notification Dot on Avatar */}
              {notificationCount > 0 && <View style={styles.notificationDot} />}
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.welcomeLabel, { color: theme.colors.textSecondary }]}>Welcome Back</Text>
              <Text style={[styles.shopTitle, { color: theme.colors.text }]}>{user?.name || "Barber"}</Text>
            </View>
          </TouchableOpacity>

          {/* Right: Notification Icon */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Notifications")}
            activeOpacity={0.9}
          >
            <View style={styles.notificationContainer}>
              <View style={[styles.notificationIconBox, { backgroundColor: theme.colors.card }]}>
                <Text style={styles.notificationIcon}>🔔</Text>
                {notificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 100,
          paddingHorizontal: 20,
          paddingTop: 16,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
            colors={["#007AFF"]}
          />
        }
      >
        {/* --- 3D FLOATING TICKET SECTION --- */}
        {pendingMediaAds.length > 0 && (
          <TouchableOpacity
            style={[styles.warningCard, { backgroundColor: isDark ? '#442b00' : '#FFF9E6', borderColor: '#FFB800' }]}
            onPress={() => navigation.navigate('BoostVisibility')}
          >
            <View style={styles.warningIconContainer}>
              <MaterialCommunityIcons name="alert-decagram" size={24} color="#FFB800" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.warningTitle, { color: isDark ? '#FFB800' : '#856404' }]}>Action Required</Text>
              <Text style={[styles.warningText, { color: isDark ? '#E0E0E0' : '#856404' }]}>
                Finish setting up your Ad campaign. Media upload is missing.
              </Text>
            </View>
            <ArrowRight size={20} color="#FFB800" />
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#999' : theme.colors.textSecondary }]}>LIVE QUEUE TOKEN</Text>
        </View>

        {/* Levitation Wrapper */}
        <Animated.View
          style={{
            transform: [{ translateY }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: shadowHeight },
            shadowOpacity: shadowOpacity,
            shadowRadius: shadowRadius,
            elevation: 10,
            zIndex: 10,
            marginBottom: 20,
          }}
        >
          <ScaleButton
            activeScale={0.97}
            onPress={() => navigation.navigate('QueueManagement')}
            style={styles.ticketWrapper}
          >
            {/* --- MAIN TICKET CONTAINER --- */}
            <View style={[styles.ticketContainer, {
              backgroundColor: isDark ? '#1A1A1A' : '#FFFDE7',
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? '#333' : 'transparent'
            }]}>
              {/* 1. Yellow Header Strip */}
              <View style={[styles.ticketHeaderStrip, {
                backgroundColor: isDark ? theme.colors.primary : '#FFC107'
              }]}>
                <View style={styles.ticketHeaderContent}>
                  <Text style={[styles.ticketHeaderLabel, {
                    color: isDark ? '#FFF' : '#1C1C1E'
                  }]}>CURRENT TOKEN</Text>
                  <View style={[styles.liveTag, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#111'
                  }]}>
                    <View style={[styles.liveTagDot, {
                      backgroundColor: isDark ? '#00E676' : '#FFF'
                    }]} />
                    <Text style={[styles.liveTagText, {
                      color: isDark ? '#FFF' : '#FFF'
                    }]}>
                      {isAvailable ? "LIVE" : "OFFLINE"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 2. Main Ticket Body */}
              <View style={[styles.ticketBodyTop, {
                backgroundColor: isDark ? '#1A1A1A' : 'transparent'
              }]}>
                <View style={styles.tokenNumberRow}>
                  <Text style={[styles.tokenNumber, {
                    color: isDark ? '#FFF' : '#2C2C2C'
                  }]}>{currentToken}</Text>
                </View>
                <View style={[styles.queueCountRow, {
                  borderTopColor: isDark ? '#333' : 'rgba(0,0,0,0.06)'
                }]}>
                  <Text style={[styles.queueCountText, {
                    color: isDark ? '#E0E0E0' : '#2C2C2C'
                  }]}>
                    Total Queue:{" "}
                    <Text style={{ fontWeight: "700", color: isDark ? '#FFF' : '#2C2C2C' }}>
                      {queueLength} People
                    </Text>
                  </Text>
                </View>
              </View>

              {/* 3. Perforation */}
              <View style={styles.perforationContainer}>
                <View style={[styles.cutoutCircle, { left: -12, backgroundColor: bgMain }]} />
                <DashedLine />
                <View style={[styles.cutoutCircle, { right: -12, backgroundColor: bgMain }]} />
              </View>

              {/* 4. Ticket Bottom Section */}
              <View style={[styles.ticketBodyBottom, {
                backgroundColor: isDark ? '#1A1A1A' : 'transparent'
              }]}>
                {/* Next Customer Info */}
                <View style={[styles.nextCustomerBox, {
                  backgroundColor: isDark ? '#252525' : '#FFF',
                  borderColor: isDark ? '#333' : '#E3E3E3'
                }]}>
                  <View style={[styles.nextIconBox, {
                    backgroundColor: isDark ? theme.colors.primary : '#2C2C2C'
                  }]}>
                    <User size={18} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.nextLabel, {
                      color: isDark ? '#999' : '#2C2C2C'
                    }]}>UP NEXT</Text>
                    <Text style={[styles.nextName, {
                      color: isDark ? '#FFF' : '#2C2C2C'
                    }]}>
                      {nextCustomer?.name || "No customers in queue"}
                    </Text>
                  </View>
                  <View style={[styles.serviceTag, {
                    backgroundColor: isDark ? '#333' : '#F4F4F4'
                  }]}>
                    <Text style={[styles.serviceTagText, {
                      color: isDark ? '#E0E0E0' : '#2C2C2C'
                    }]}>
                      {nextCustomer?.service || "No service"}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.walkInBtn, {
                      backgroundColor: isDark ? '#252525' : '#FFF',
                      borderColor: isDark ? '#444' : '#DDD'
                    }]}
                    onPress={() => navigation.navigate("OfflineBooking")}
                  >
                    <Text style={[styles.walkInBtnText, {
                      color: isDark ? '#FFF' : '#333'
                    }]}>+ Walk-in</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.callNextBtn, {
                      backgroundColor: isDark ? theme.colors.primary : '#FFC107',
                      shadowColor: isDark ? theme.colors.primary : '#E0A800'
                    }]}
                    onPress={handleCallNext}
                    disabled={!nextCustomer}
                  >
                    <Text style={[styles.callNextBtnText, {
                      color: isDark ? '#000' : '#000'
                    }]}>
                      {nextCustomer ? `Call Next #${currentToken + 1}` : "Empty Line"}
                    </Text>
                    {nextCustomer && (
                      <ArrowRight
                        size={18}
                        color={isDark ? '#000' : '#000'}
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Footer Barcode */}
                <View style={[styles.ticketFooter, {
                  opacity: isDark ? 0.3 : 0.5
                }]}>
                  <Barcode />
                  <Text style={[styles.ticketId, {
                    color: isDark ? '#999' : '#2C2C2C'
                  }]}>TICKET #882-99</Text>
                </View>
              </View>
            </View>
          </ScaleButton>
        </Animated.View>

        {/* --- STATS CARDS --- */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate("Earnings")}
          >
            <View style={[styles.statIcon, { backgroundColor: isDark ? "#1E3A5F" : "#E3F2FD" }]}>
              <Wallet size={20} color="#007AFF" />
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Earnings</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              ₹{todayEarnings ? Number(todayEarnings).toFixed(1) : "0.0"}
            </Text>
          </TouchableOpacity>

          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: isDark ? "#3D2A1F" : "#FFF3E0" }]}>
              <Scissors size={20} color="#FF9800" />
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Served</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{dailyStats.served}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: isDark ? "#3D1F1F" : "#FFEBEE" }]}>
              <User size={20} color="#F44336" />
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Left</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{dailyStats.left}</Text>
          </View>
        </View>

        {/* --- AVAILABILITY SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#999' : theme.colors.textSecondary }]}>SHOP STATUS</Text>
        </View>

        <TouchableOpacity
          onPress={handleAvailabilityChange}
          activeOpacity={0.9}
        >
          <View style={[styles.availabilityCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.availabilityContent}>
              <View style={styles.availabilityLeft}>
                <Animated.View
                  style={[
                    styles.availabilityIndicator,
                    {
                      backgroundColor: isAvailable ? "#34C759" : "#C7C7CC",
                      shadowColor: isAvailable ? "#34C759" : "transparent",
                      transform: isAvailable ? [{ scale: pulseAnim }] : [],
                    },
                  ]}
                />
                <View style={styles.availabilityTextContainer}>
                  <Text style={[styles.availabilityTitle, { color: theme.colors.text }]}>
                    {isAvailable ? "I am Online" : "I am Offline"}
                  </Text>
                  <Text style={[styles.availabilitySubtitle, { color: theme.colors.textSecondary }]}>
                    {isAvailable
                      ? "Ready to serve customers"
                      : "Tap to go online"}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.availabilityRight,
                  { backgroundColor: isAvailable ? "#FFE8E8" : "#E8F5E9" },
                ]}
              >
                <Text
                  style={[
                    styles.availabilityAction,
                    { color: isAvailable ? "#D63031" : "#00B894" },
                  ]}
                >
                  {isAvailable ? "Go Offline" : "Go Online"}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* --- ACTIVITY LIST --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#999' : theme.colors.textSecondary }]}>RECENT ACTIVITY</Text>
        </View>

        <View style={[styles.activityList, { backgroundColor: theme.colors.card }]}>
          {isMainOwner && (
            <>
              <TouchableOpacity
                onPress={() => navigation.navigate("BoostVisibility")}
              >
                <ActivityItem
                  icon={ShieldCheck}
                  title="Boost Visibility"
                  subtitle={user?.isSubscribed || user?.subscriptionStatus === 'active'
                    ? "Status: Active • Manage Visibility"
                    : "Status: Inactive • Tap to Boost"}
                  theme={theme}
                />
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <TouchableOpacity
                onPress={() => navigation.navigate("ListedCard")}
              >
                <ActivityItem
                  icon={Star}
                  title="Listed Card"
                  subtitle="Manage shop card & team"
                  theme={theme}
                />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            </>
          )}


          <TouchableOpacity
            onPress={() => navigation.navigate("CreateBarberCard")}
          >
            <ActivityItem
              icon={CreditCard}
              title="Create Barber-card"
              subtitle="Set up your professional profile"
              theme={theme}
            />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />



          <TouchableOpacity onPress={() => navigation.navigate("Earnings")}>
            <ActivityItem
              icon={TrendingUp}
              title="Payment Received"
              subtitle={`₹${todayEarnings.toLocaleString()} • UPI`}
              theme={theme}
            />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <TouchableOpacity
            onPress={() => navigation.navigate("AllAppointments")}
          >
            <ActivityItem
              icon={Calendar}
              title="Booking Confirmed"
              subtitle="Manage your appointments"
              isLast
              theme={theme}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- CONTACT MODAL IMPLEMENTATION --- */}
      <ContactModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
        customer={nextCustomer}
        theme={theme}
      />
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // --- HEADER WITH ROUNDED CORNERS ---
  headerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    // BACKGROUND & SEPARATION
    backgroundColor: "#FFFFFF",

    // ROUNDING ADDED HERE:
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,

    // Separator line
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",

    // Shadow for "Floating Sheet" effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 16, // Squircle shape
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  textContainer: {
    justifyContent: "center",
  },
  welcomeLabel: {
    fontSize: 10,
    color: "#8E8E93",
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  shopTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1C1C1E",
    letterSpacing: -0.5,
  },
  // Status Capsule (Switch)
  statusCapsule: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingVertical: 8,
    paddingHorizontal: 8,
    paddingRight: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F2F2F7",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    marginLeft: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  statusTextWrapper: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1C1C1E",
    lineHeight: 14,
  },
  statusSubLabel: {
    fontSize: 9,
    fontWeight: "500",
    color: "#8E8E93",
  },

  // --- SECTIONS ---
  sectionHeader: {
    marginBottom: 12,
    marginTop: 10,
    paddingHorizontal: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#999",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // --- REALISTIC TICKET STYLING ---
  ticketWrapper: {
    // Wrapper mostly used for touch scaling
  },
  ticketContainer: {
    borderRadius: 16,
    overflow: "hidden",
    // REALISTIC PAPER LOOK
    backgroundColor: "#FFFDE7", // Lighter warm ivory cardstock
    borderWidth: 0, // No border
  },

  // 1. Ticket Header
  ticketHeaderStrip: {
    backgroundColor: "#FFD60A", // Vibrant Yellow
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  ticketHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketHeaderLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1C1C1E",
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFF",
    marginRight: 5,
  },
  liveTagText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },

  // 2. Ticket Body Top
  ticketBodyTop: {
    backgroundColor: "transparent", // Inherit Cardstock color
    padding: 24,
    paddingBottom: 20,
    alignItems: "center",
  },
  tokenNumberRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  tokenNumber: {
    fontSize: 80,
    fontWeight: "bold",
    fontFamily:
      Platform.OS === "ios"
        ? "HelveticaNeue-CondensedBold"
        : "sans-serif-condensed",
    color: "#2C2C2C", // Ink color, not pure black
    letterSpacing: -4,
    lineHeight: 80,
    includeFontPadding: false,
  },

  queueCountRow: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 12,
    marginTop: 4,
  },
  queueCountText: {
    fontSize: 13,
    color: "#2C2C2C",
    textAlign: "center",
  },

  // 3. Perforation
  perforationContainer: {
    height: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    position: "relative",
    overflow: "visible",
  },
  dashedLineContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    opacity: 0.4,
  },
  dash: {
    width: 8,
    height: 1.5,
    backgroundColor: "#C0B088", // Matches paper border
  },
  cutoutCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F4F5F7", // Matches Screen BG
    position: "absolute",
    top: -12,
    borderWidth: 1.5, // Add border to cutout for realism
    borderColor: "rgba(0,0,0,0.06)", // Subtle shadow inside hole
  },

  // 4. Ticket Bottom
  ticketBodyBottom: {
    backgroundColor: "transparent", // Inherit Cardstock
    padding: 24,
    paddingTop: 20,
  },
  nextCustomerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF", // Sticker/Box look on top of cardstock
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nextIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2C2C2C",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  nextLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  nextName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C2C2C",
  },
  serviceTag: {
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serviceTagText: {
    fontSize: 11,
    color: "#2C2C2C",
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  walkInBtn: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#DDD",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  walkInBtnText: {
    fontWeight: "700",
    color: "#333",
    fontSize: 14,
  },
  callNextBtn: {
    flex: 1.2,
    backgroundColor: "#FFD60A", // Matches Header
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F4B400",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callNextBtnText: {
    fontWeight: "700",
    color: "#000",
    fontSize: 14,
  },
  ticketFooter: {
    alignItems: "center",
    opacity: 0.5,
  },
  barcodeContainer: {
    flexDirection: "row",
    height: 18,
    alignItems: "center",
    marginBottom: 4,
  },
  barcodeLine: {
    height: "100%",
    backgroundColor: "#2C2C2C",
    marginHorizontal: 1,
  },
  ticketId: {
    fontSize: 9,
    fontWeight: "700",
    color: "#2C2C2C",
    letterSpacing: 1,
  },

  // --- STATS GRID ---
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  warningIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
  },

  // --- ACTIVITY ---
  activityList: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  activityItemLast: {
    // nothing specific
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 60,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 11,
    color: "#888",
  },

  // --- NOTIFICATION CONTAINER ---
  notificationContainer: {
    position: "relative",
  },
  notificationIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  notificationBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },



  // --- AVAILABILITY CARD ---
  availabilityCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  availabilityContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  availabilityLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  availabilityIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  availabilityTextContainer: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  availabilitySubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },
  availabilityRight: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  availabilityAction: {
    fontSize: 12,
    fontWeight: "700",
  },

  // --- MODAL STYLES (NEW) ---
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1C1C1E",
  },
  closeButton: {
    padding: 4,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  modalSubtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
  },
  modalActions: {
    gap: 12,
    marginBottom: 16,
  },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  callBtn: {
    backgroundColor: "#007AFF",
  },
  callBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  whatsappBtn: {
    backgroundColor: "#25D366",
  },
  whatsappBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF3B30",
  },
});

export default HomeScreen;
