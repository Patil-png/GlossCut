import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import LottieView from "lottie-react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { 
  ChevronLeft, 
  Rocket, 
  Stars, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X 
} from "lucide-react-native";

const { width } = Dimensions.get("window");

// --- MODERN ALERT COMPONENT ---
// Highly optimized, macro-interaction based alert system
const ModernAlert = ({ visible, message, type, onClose, topInset = 40 }) => {
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      // Entrance Animation: Springy and fast
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: topInset,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose && visible) onClose();
    });
  };

  const getIcon = () => {
    switch (type) {
      case "success": return <CheckCircle color="#fff" size={20} fill={theme.colors.success || "#22c55e"} />;
      case "error": return <AlertTriangle color="#fff" size={20} fill={theme.colors.error || "#ef4444"} />;
      default: return <Info color="#fff" size={20} fill={theme.colors.primary || "#3b82f6"} />;
    }
  };

  const getBgColor = () => {
    // Using a sleek dark/glass morphism look or theme-based card color
    return theme.colors.card;
  };

  return (
    <Animated.View
      style={[
        styles.alertContainer,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: getBgColor(),
          shadowColor: theme.colors.shadow || "#000",
          borderColor: theme.colors.border + "40",
        },
      ]}
    >
      <View style={styles.alertContent}>
        <View style={styles.alertIconWrapper}>{getIcon()}</View>
        <View style={styles.alertTextWrapper}>
          <Text style={[styles.alertTitle, { color: theme.colors.text }]}>
            {type === "success" ? "Success" : type === "error" ? "Action Failed" : "Note"}
          </Text>
          <Text style={[styles.alertMessage, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {message}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={18} color={theme.colors.textSecondary} style={{ opacity: 0.6 }} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const FaceSuggestorScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  
  // Alert State
  const [alertConfig, setAlertConfig] = useState({ visible: false, message: "", type: "info" });

  // Memoized Handlers to prevent re-renders
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const showAlert = useCallback((message, type = "info") => {
    setAlertConfig({ visible: true, message, type });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  // Simulate Notify Action with Network Safety Check
  const handleNotifyMe = useCallback(() => {
    // Simulate checking network/server status
    const isNetworkAvailable = true; // In real app, use NetInfo.fetch()
    const isServerUp = true;

    if (!isNetworkAvailable) {
      showAlert("No internet connection. Please check your settings.", "error");
      return;
    }

    if (!isServerUp) {
       showAlert("Server is momentarily down. Please try again later.", "error");
       return;
    }

    // Success Action
    showAlert("You've been added to the waitlist!", "success");
  }, [showAlert]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      
      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={[styles.backButton, { backgroundColor: theme.colors.card }]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Face AI</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // Optimization: Unmounts views off-screen
        overScrollMode="never"
      >
        {/* --- Illustration Area --- */}
        <View style={styles.illustrationContainer}>
          <View
            style={[
              styles.bgCircle,
              { backgroundColor: theme.colors.primary + "10" },
            ]}
          />
          {/* Optimization: Used renderMode="HARDWARE" for smoother animation on Android */}
          <LottieView
            source={require("../assets/Under Maintenance.json")}
            autoPlay
            loop
            speed={1}
            renderMode="HARDWARE" 
            resizeMode="contain"
            style={styles.animation}
          />
        </View>

        {/* --- Text Content --- */}
        <View style={styles.infoContainer}>
          <View style={[styles.badge, { backgroundColor: theme.colors.primary + "15" }]}>
            <Rocket size={14} color={theme.colors.primary} />
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
              Coming Soon
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            Something Amazing is in the Works
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            We are currently building an intelligent Face AI to help you find
            the perfect style. Stay tuned for the launch!
          </Text>

          <View
            style={[
              styles.noteBox,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Stars
              size={18}
              color={theme.colors.textSecondary}
              style={{ marginRight: 10 }}
            />
            <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
              Get ready for a personalized experience.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* --- Footer Buttons --- */}
      <View style={styles.footer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={handleNotifyMe}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, "#4c669f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Notify Me When Ready</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- Modern Floating Alert --- */}
      <ModernAlert 
        visible={alertConfig.visible}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 10,
    paddingBottom: 10,
    zIndex: 10, // Ensure header is below alert but above content if needed
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 140,
  },
  
  // Illustration
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    position: "relative",
    width: width * 0.8,
    height: width * 0.8,
  },
  bgCircle: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  animation: {
    width: "120%",
    height: "120%",
  },

  // Info
  infoContainer: {
    alignItems: "center",
    width: "100%",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    opacity: 0.8,
    paddingHorizontal: 10,
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    width: "100%",
    justifyContent: "center",
  },
  noteText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
  },
  buttonWrapper: {
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 16,
  },
  gradientButton: {
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // --- Alert Styles ---
  alertContainer: {
    position: "absolute",
    alignSelf: "center",
    width: width * 0.9,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100, // Ensure it floats above everything
    flexDirection: "row",
    alignItems: "center",
  },
  alertContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  alertIconWrapper: {
    marginRight: 14,
  },
  alertTextWrapper: {
    flex: 1,
    marginRight: 10,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default FaceSuggestorScreen;