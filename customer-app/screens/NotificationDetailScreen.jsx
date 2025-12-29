import React, { useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  StatusBar,
  Dimensions,
  ImageBackground,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ArrowLeft,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  Share2,
  Info,
  Calendar,
  ShieldCheck,
  Zap,
} from "lucide-react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const NotificationDetailScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { notification } = route.params || {};

  // --- ANIMATION CHOREOGRAPHY ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const alertY = useRef(new Animated.Value(-120)).current;
  const scaleIcon = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: Alert slides down -> Content Fades In -> Icon Scales Up
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleIcon, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const markAsRead = async () => {
      if (!notification?._id) return;
      try {
        const token = await AsyncStorage.getItem("token");
        await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/api/notifications/${notification._id}/read`,
          {},
          {
            headers: { "x-auth-token": token },
            timeout: 5000,
          }
        );
      } catch (error) {
        console.log("Resilient: Background status update handled.");
      }
    };
    markAsRead();
  }, [notification]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },

        // PREMIUM HEADER
        headerArea: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: Platform.OS === "ios" ? 10 : 40,
          height: 110,
          zIndex: 100,
        },
        blurCircle: {
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: theme.colors.primary + "15",
        },
        backBtn: {
          width: 48,
          height: 48,
          borderRadius: 18,
          backgroundColor: theme.colors.card,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 4,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },

        // HERO SECTION
        heroCard: {
          marginHorizontal: 20,
          padding: 24,
          borderRadius: 32,
          backgroundColor: theme.colors.card,
          alignItems: "center",
          borderWidth: 1,
          borderColor: theme.colors.border,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 15,
          elevation: 2,
        },
        iconBadge: {
          width: 80,
          height: 80,
          borderRadius: 28,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
        },
        notificationTag: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          backgroundColor: theme.colors.primary + "10",
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        },
        tagText: {
          fontSize: 11,
          fontWeight: "800",
          color: theme.colors.primary,
          letterSpacing: 1,
          textTransform: "uppercase",
        },

        // TYPOGRAPHY
        title: {
          fontSize: 24,
          fontWeight: "900",
          textAlign: "center",
          color: theme.colors.text,
          lineHeight: 30,
        },
        timestamp: {
          fontSize: 13,
          color: theme.colors.textSecondary,
          marginTop: 10,
          fontWeight: "500",
        },

        // TRUST ELEMENTS (Zomato/Blinkit Style)
        trustBar: {
          flexDirection: "row",
          justifyContent: "space-around",
          marginTop: 25,
          paddingTop: 20,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border + "50",
          width: "100%",
        },
        trustItem: { alignItems: "center", gap: 4 },
        trustLabel: {
          fontSize: 10,
          fontWeight: "700",
          color: theme.colors.textSecondary,
        },

        // MESSAGE BODY
        contentSection: { padding: 20, marginTop: 10 },
        messageCard: {
          padding: 24,
          borderRadius: 28,
          backgroundColor: theme.colors.primary + "05",
          borderStyle: "dashed",
          borderWidth: 1.5,
          borderColor: theme.colors.primary + "30",
        },
        messageText: {
          fontSize: 16,
          lineHeight: 26,
          color: theme.colors.textSecondary,
        },

        // FLOATING ACTION FOOTER
        footer: {
          padding: 24,
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        mainBtn: {
          height: 60,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        },
        btnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
      }),
    [theme]
  );

  if (!notification) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      <View style={styles.blurCircle} />

      <View style={styles.headerArea}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn}>
          <Share2 size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HERO SECTION WITH MACRO-INTERACTION */}
        <Animated.View
          style={[
            styles.heroCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Animated.View
            style={[styles.iconBadge, { transform: [{ scale: scaleIcon }] }]}
          >
            <LinearGradient
              colors={[theme.colors.primary, "#9b59b6"]}
              style={StyleSheet.absoluteFill}
              borderRadius={28}
            />
            <Bell size={34} color="#FFF" />
          </Animated.View>

          <View style={styles.notificationTag}>
            <Zap
              size={12}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.tagText}>Official Update</Text>
          </View>

          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.timestamp}>
            {new Date(notification.date).toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

          <View style={styles.trustBar}>
            <View style={styles.trustItem}>
              <ShieldCheck size={18} color="#10b981" />
              <Text style={styles.trustLabel}>VERIFIED</Text>
            </View>
            <View style={styles.trustItem}>
              <Calendar size={18} color={theme.colors.primary} />
              <Text style={styles.trustLabel}>SCHEDULED</Text>
            </View>
            <View style={styles.trustItem}>
              <Info size={18} color="#f59e0b" />
              <Text style={styles.trustLabel}>SUPPORT</Text>
            </View>
          </View>
        </Animated.View>

        {/* CONTENT SECTION */}
        <Animated.View style={[styles.contentSection, { opacity: fadeAnim }]}>
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{notification.message}</Text>
          </View>
        </Animated.View>

        {/* PREMIUM PROMO CARD (Increases confidence for booking) */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 10,
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["#FFEDD5", "#FFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 20, flexDirection: "row", alignItems: "center" }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "900", color: "#92400E" }}
              >
                GlossCut Premium Care
              </Text>
              <Text style={{ fontSize: 12, color: "#B45309", marginTop: 4 }}>
                Your hygiene and comfort is our priority.
              </Text>
            </View>
            <CheckCircle2 size={30} color="#92400E" opacity={0.3} />
          </LinearGradient>
        </View>
      </ScrollView>

      {/* FOOTER CALL TO ACTION */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Home')}
        >
          <LinearGradient
            colors={[theme.colors.primary, "#8e44ad"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.mainBtn}
          >
            <Text style={styles.btnText}>Book Next Appointment</Text>
            <Zap size={18} color="#FFF" fill="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default NotificationDetailScreen;
