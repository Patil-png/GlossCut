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
  ImageBackground} from "react-native";
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
  Zap} from "lucide-react-native";
import api from "../utils/api";
import { Colors } from "../src/theme/colors";
import { Typography } from "../src/theme/typography";
import { Layout } from "../src/theme/layout";

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
          useNativeDriver: true}),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true}),
        Animated.spring(scaleIcon, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true}),
      ]),
    ]).start();

    const markAsRead = async () => {
      if (!notification?._id) return;
      try {
        await api.put(`/api/notifications/${notification._id}/read`, {}, { timeout: 5000 });
      } catch (error) {
        console.log("Resilient: Background status update handled.");
      }
    };
    markAsRead();
  }, [notification]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: Colors.BG_PAGE },

        // PREMIUM HEADER
        headerArea: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: Layout.screenPadding,
          paddingTop: Platform.OS === "ios" ? 10 : 40,
          height: 110,
          zIndex: 100},
        blurCircle: {
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: Colors.BG_TAG},
        backBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: Colors.BG_HOVER,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 0.5,
          borderColor: Colors.BORDER_CARD,
          ...Layout.noShadow},

        // HERO SECTION
        heroCard: {
          marginHorizontal: Layout.screenPadding,
          padding: Layout.cardPadding,
          borderRadius: Layout.radiusCard,
          backgroundColor: Colors.BG_CARD,
          alignItems: "center",
          borderWidth: 0.5,
          borderColor: Colors.BORDER_CARD,
          ...Layout.noShadow},
        iconBadge: {
          width: 80,
          height: 80,
          borderRadius: 28,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
          backgroundColor: Colors.CTA_BUTTON},
        notificationTag: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: Layout.radiusTag,
          backgroundColor: Colors.BG_TAG,
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12},
        tagText: {
          ...Typography.TAG_BADGE,
          letterSpacing: 0.5,
          textTransform: "uppercase"},

        // TYPOGRAPHY
        title: {
          ...Typography.SCREEN_TITLE,
          textAlign: "center"},
        timestamp: {
          fontSize: 13,
          color: Colors.TEXT_MUTED,
          marginTop: 10,
          fontWeight: "500"},

        // TRUST ELEMENTS (Zomato/Blinkit Style)
        trustBar: {
          flexDirection: "row",
          justifyContent: "space-around",
          marginTop: 25,
          paddingTop: 20,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border + "50",
          width: "100%"},
        trustItem: { alignItems: "center", gap: 4 },
        trustLabel: {
          ...Typography.MICRO_LABEL,
          fontFamily: 'DMSans_700Bold',
          color: Colors.TEXT_SECONDARY,
          letterSpacing: 0.5,
          textTransform: 'uppercase'},

        // MESSAGE BODY
        contentSection: { padding: Layout.screenPadding, marginTop: 10 },
        messageCard: {
          padding: Layout.cardPadding,
          borderRadius: Layout.radiusCard,
          backgroundColor: Colors.BG_CARD,
          borderWidth: 0.5,
          borderColor: Colors.BORDER_CARD},
        messageText: {
          ...Typography.BODY,
          fontSize: 13,
          color: Colors.TEXT_SECONDARY},

        // FLOATING ACTION FOOTER
        footer: {
          padding: Layout.screenPadding,
          backgroundColor: Colors.BG_PAGE,
          borderTopWidth: 0.5,
          borderTopColor: Colors.DIVIDER},
        mainBtn: {
          height: 52,
          borderRadius: Layout.radiusButton,
          backgroundColor: Colors.CTA_BUTTON,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          ...Layout.noShadow},
        btnText: { ...Typography.BUTTON }}),
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
            <View style={StyleSheet.absoluteFill} />
            <Bell size={34} color={Colors.TEXT_ON_DARK} />
          </Animated.View>

          <View style={styles.notificationTag}>
            <Zap
              size={12}
              color={Colors.TEXT_PRIMARY}
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
              minute: "2-digit"})}
          </Text>

          <View style={styles.trustBar}>
            <View style={styles.trustItem}>
              <ShieldCheck size={18} color={Colors.TEXT_PRIMARY} />
              <Text style={styles.trustLabel}>VERIFIED</Text>
            </View>
            <View style={styles.trustItem}>
              <Calendar size={18} color={Colors.TEXT_PRIMARY} />
              <Text style={styles.trustLabel}>SCHEDULED</Text>
            </View>
            <View style={styles.trustItem}>
              <Info size={18} color={Colors.TEXT_PRIMARY} />
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
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: Colors.BG_CARD,
            borderWidth: 0.5,
            borderColor: Colors.BORDER_CARD,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ ...Typography.CARD_TITLE }}>GlossCut Premium Care</Text>
            <Text style={{ ...Typography.BODY, marginTop: 4 }}>
              Your hygiene and comfort is our priority.
            </Text>
          </View>
          <CheckCircle2 size={26} color={Colors.TEXT_MUTED} opacity={0.35} />
        </View>
      </ScrollView>

      {/* FOOTER CALL TO ACTION */}
      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Home')}>
          <View style={styles.mainBtn}>
            <Text style={styles.btnText}>Book Next Appointment</Text>
            <Zap size={18} color={Colors.TEXT_ON_DARK} fill={Colors.TEXT_ON_DARK} />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default NotificationDetailScreen;
