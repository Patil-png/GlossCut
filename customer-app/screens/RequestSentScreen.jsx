import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Linking,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const RequestSentScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { bookingId } = route.params;
  const [status, setStatus] = useState("pending");
  const [barberPhoneNumber, setBarberPhoneNumber] = useState(null);

  // --- Alert State ---
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [],
    icon: "notifications",
    type: "info", // info, warning, error
  });

  // --- Animation Refs ---
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Alert Animation: Starts off-screen (-150), slides to 0
  const alertTranslateY = useRef(new Animated.Value(-200)).current;

  // --- Logic Refs (for closures) ---
  const statusRef = useRef(status);
  const barberPhoneNumberRef = useRef(barberPhoneNumber);
  const timeoutIdRef = useRef(null);
  const isMounted = useRef(true); // To prevent memory leaks

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    barberPhoneNumberRef.current = barberPhoneNumber;
  }, [barberPhoneNumber]);

  // --- Modern Top Alert Logic ---
  const showCustomAlert = (
    title,
    message,
    buttons,
    icon = "notifications",
    type = "info"
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
      icon,
      type,
    });

    // Animate In
    Animated.spring(alertTranslateY, {
      toValue: 0, // Slides to natural position (handled by layout styles)
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  const closeAlert = () => {
    // Animate Out
    Animated.timing(alertTranslateY, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }).start(() => {
      if (isMounted.current) {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
      }
    });
  };

  // --- Background Animations ---
  useEffect(() => {
    isMounted.current = true;

    // Pulse Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade In Content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // --- Logic / Polling ---
  const startConfirmationTimeout = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    const id = setTimeout(() => {
      if (statusRef.current === "pending" && isMounted.current) {
        showCustomAlert(
          "Taking a while?",
          "Barber is taking longer than usual.",
          [
            {
              text: "Wait",
              type: "secondary",
              onPress: () => {
                if (statusRef.current === "pending") startConfirmationTimeout();
              },
            },
            {
              text: "Call",
              type: "primary",
              onPress: () => {
                if (barberPhoneNumberRef.current) {
                  Linking.openURL(`tel:${barberPhoneNumberRef.current}`);
                } else {
                  // Fallback if no phone
                }
                if (statusRef.current === "pending") startConfirmationTimeout();
              },
            },
          ],
          "time",
          "warning"
        );
      }
    }, 30000);
    timeoutIdRef.current = id;
  };

  useEffect(() => {
    startConfirmationTimeout();

    const interval = setInterval(async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        // Safety check for network calls
        if (!token) return;

        const res = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/api/booking/${bookingId}`,
          {
            headers: { "x-auth-token": token },
            timeout: 5000, // Prevent hanging requests
          }
        );

        if (!isMounted.current) return;

        setStatus(res.data.status);

        if (res.data.barberId && res.data.barberId.phone) {
          setBarberPhoneNumber(res.data.barberId.phone);
        }

        if (res.data.status === "confirmed") {
          clearInterval(interval);
          clearTimeout(timeoutIdRef.current);
          navigation.navigate("PaymentConfirmation", {
            providerName: res.data.barberId.name,
            providerId: res.data.barberId._id,
            selectedServices: res.data.services,
            totalPrice: res.data.totalPrice,
            bookingId: bookingId,
          });
        } else if (res.data.status === "cancelled") {
          clearInterval(interval);
          clearTimeout(timeoutIdRef.current);

          showCustomAlert(
            "Request Rejected",
            "Barber is unavailable right now.",
            [
              {
                text: "Back",
                type: "secondary",
                onPress: () => navigation.goBack(),
              },
              {
                text: "Call",
                type: "primary",
                onPress: () => {
                  if (barberPhoneNumberRef.current) {
                    Linking.openURL(`tel:${barberPhoneNumberRef.current}`);
                  }
                },
              },
            ],
            "close-circle",
            "error"
          );
        }
      } catch (err) {
        // Silent catch to prevent crash loop on network failure
        console.log("Polling error (harmless):", err.message);
      }
    }, 3000);

    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (statusRef.current !== "pending") return;

      e.preventDefault();

      showCustomAlert(
        "Request Pending",
        "Leaving now might cancel the request.",
        [
          {
            text: "Stay",
            type: "secondary",
            onPress: () => startConfirmationTimeout(),
          },
          {
            text: "Call",
            type: "primary",
            onPress: () => {
              if (barberPhoneNumberRef.current) {
                Linking.openURL(`tel:${barberPhoneNumberRef.current}`);
              }
              if (statusRef.current === "pending") startConfirmationTimeout();
            },
          },
        ],
        "alert-circle",
        "warning"
      );
    });

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutIdRef.current);
      unsubscribe();
    };
  }, [bookingId, navigation]);

  // --- Animation Interpolations ---
  const scale1 = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });
  const opacity1 = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });
  const scale2 = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />

      {/* --- MODERN ALERT (Zomato/Blinkit Style) --- */}
      {/* Positioned absolutely at top, outside the flow to prevent layout shifts */}
      <Animated.View
        style={[
          styles.alertContainer,
          {
            transform: [{ translateY: alertTranslateY }],
            // Ensures touch events work
            zIndex: 9999,
          },
        ]}
      >
        <View
          style={[styles.alertCard, { backgroundColor: theme.colors.card }]}
        >
          {/* Left: Icon */}
          <View
            style={[
              styles.alertIconBox,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Ionicons
              name={alertConfig.icon}
              size={24}
              color={
                alertConfig.type === "error" ? "#FF4444" : theme.colors.primary
              }
            />
          </View>

          {/* Middle: Text */}
          <View style={styles.alertContent}>
            <Text
              style={[styles.alertTitle, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {alertConfig.title}
            </Text>
            <Text
              style={[styles.alertMessage, { color: theme.colors.placeholder }]}
              numberOfLines={2}
            >
              {alertConfig.message}
            </Text>
          </View>

          {/* Right/Bottom: Actions */}
          <View style={styles.alertActions}>
            {alertConfig.buttons.map((btn, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => {
                  closeAlert();
                  if (btn.onPress) btn.onPress();
                }}
                style={[
                  styles.alertBtn,
                  btn.type === "primary"
                    ? { backgroundColor: theme.colors.primary }
                    : { backgroundColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.alertBtnText,
                    btn.type === "primary"
                      ? { color: "#FFF" }
                      : { color: theme.colors.text },
                  ]}
                >
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* --- MAIN UI CONTENT --- */}
      <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Request Sent
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text }]}>
          Hang tight! We are contacting the barber.
        </Text>
      </Animated.View>

      <View style={styles.animationContainer}>
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              backgroundColor: theme.colors.primary,
              transform: [{ scale: scale1 }],
              opacity: opacity1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              backgroundColor: theme.colors.primary,
              transform: [{ scale: scale2 }],
              opacity: 0.3,
            },
          ]}
        />
        <View
          style={[
            styles.coreCircle,
            {
              backgroundColor: theme.colors.card,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <Ionicons name="time" size={40} color={theme.colors.primary} />
        </View>
      </View>

      <Animated.View style={[styles.statusContainer, { opacity: fadeAnim }]}>
        <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
          <Text
            style={[styles.statusLabel, { color: theme.colors.placeholder }]}
          >
            Current Status
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <Text style={[styles.statusText, { color: theme.colors.text }]}>
              Waiting for confirmation...
            </Text>
          </View>
        </View>
        <Text style={[styles.hintText, { color: theme.colors.placeholder }]}>
          Please keep this screen open.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  // --- Modern Alert Styles (Toast / Dynamic Island) ---
  alertContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    marginTop: 40, // As requested
    paddingHorizontal: 16,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: width - 32,
    padding: 12,
    borderRadius: 16,
    // High-quality Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.05)",
  },
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
    justifyContent: "center",
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  alertActions: {
    flexDirection: "row",
    gap: 8,
  },
  alertBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20, // Pill shape
    justifyContent: "center",
    alignItems: "center",
  },
  alertBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // --- Main UI Styles ---
  headerContainer: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 22,
  },
  animationContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  pulseCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  coreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    zIndex: 10,
  },
  statusContainer: {
    width: "100%",
    paddingHorizontal: 24,
    marginBottom: 20,
    zIndex: 1,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 1,
  },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  statusText: { fontSize: 18, fontWeight: "600" },
  hintText: { fontSize: 13, textAlign: "center", lineHeight: 18, opacity: 0.6 },
});

export default RequestSentScreen;
