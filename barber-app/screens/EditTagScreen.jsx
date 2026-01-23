import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext"; // Ensure this path is correct in your project
import {
  ArrowLeft,
  Tag,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react-native";
import api from "../utils/api";

// --- Production Config ---
const API_TIMEOUT = 10000; // 10 seconds timeout (Prevents app hanging if server is down)

// --- Custom Toast Component ---
const ToastNotification = ({
  visible,
  message,
  type,
  translateY,
  insets,
  theme,
}) => {
  if (!visible) return null;

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "#E3F9E5",
          border: "#28A745",
          text: "#155724",
          icon: <CheckCircle size={20} color="#28A745" />,
        };
      case "error":
        return {
          bg: "#FFE3E3",
          border: "#DC3545",
          text: "#721C24",
          icon: <XCircle size={20} color="#DC3545" />,
        };
      default:
        return {
          bg: "#FFF3CD",
          border: "#FFC107",
          text: "#856404",
          icon: <AlertTriangle size={20} color="#FFC107" />,
        };
    }
  };
  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          top: insets.top + 10,
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.toastContent}>
        {colors.icon}
        <Text style={[styles.toastText, { color: colors.text }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const EditTagScreen = ({ navigation, route }) => {
  const { theme } = useTheme(); // Make sure your ThemeContext provides colors: background, card, text, primary, border
  const insets = useSafeAreaInsets();

  // Safe param handling (prevents crash if route.params is undefined)
  const currentTag = route.params?.currentTag || "";
  const onSave = route.params?.onSave || (() => { });

  const [tag, setTag] = useState(currentTag);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const inputShake = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(-100)).current;
  const [toast, setToast] = useState({ visible: false, message: "", type: "" });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
    ]).start();
  }, []);

  const showToast = (message, type = "error") => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, {
      toValue: 0,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss
    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToast({ ...toast, visible: false }));
    }, 3500);
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(inputShake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(inputShake, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(inputShake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(inputShake, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    setValidationError("");

    if (!tag.trim()) {
      setValidationError("Tag name cannot be empty");
      triggerShake();
      return;
    }
    if (tag.length < 3) {
      setValidationError("Tag is too short (min 3 chars)");
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      // Added Timeout to config to handle "Server Down" gracefully
      await api.put(
        '/api/shop/tag',
        { tag },
        { timeout: API_TIMEOUT }
      );

      showToast("Shop tag updated successfully!", "success");
      onSave(tag);
      setTimeout(() => navigation.goBack(), 1200);
    } catch (err) {
      console.log("Update Error:", err);

      // Robust Error Handling for Production
      if (err.code === "ECONNABORTED") {
        showToast("Request timed out. Server might be busy.", "warning");
      } else if (!err.response) {
        showToast("Network error. Check your internet.", "error");
      } else if (err.response.status === 401) {
        showToast("Session expired. Please login again.", "error");
      } else {
        showToast("Failed to save changes. Try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic Styles based on Theme
  const dynamicStyles = {
    header: { borderBottomColor: theme.colors.border },
    infoCard: {
      backgroundColor: theme.colors.card,
      shadowColor: theme.colors.text,
    },
    inputContainer: {
      backgroundColor: theme.colors.card,
      borderColor: validationError
        ? "#DC3545"
        : isFocused
          ? theme.colors.primary
          : theme.colors.border,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
    },
    text: { color: theme.colors.text },
    textSecondary: { color: theme.colors.textSecondary || "#888" },
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <StatusBar
          barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        />

        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
          <ToastNotification
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            translateY={toastAnim}
            insets={insets}
            theme={theme}
          />

          {/* Header */}
          <Animated.View
            style={[styles.header, dynamicStyles.header, { opacity: fadeAnim }]}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[
                styles.backButton,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <ArrowLeft size={22} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, dynamicStyles.text]}>
              Edit Tag
            </Text>
          </Animated.View>

          <View style={styles.content}>
            {/* Info Card */}
            <Animated.View
              style={[
                styles.infoCard,
                dynamicStyles.infoCard,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Info
                size={24}
                color={theme.colors.primary}
                style={{ marginRight: 12 }}
              />
              <Text style={[styles.infoDesc, dynamicStyles.textSecondary]}>
                Tags help customers find you. E.g., "Bakery", "Electronics".
              </Text>
            </Animated.View>

            {/* Input */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [
                  { translateY: Animated.multiply(slideAnim, 1.2) },
                  { translateX: inputShake },
                ],
              }}
            >
              <Text style={[styles.inputLabel, dynamicStyles.text]}>
                Shop Tag Name
              </Text>

              <View
                style={[styles.inputContainer, dynamicStyles.inputContainer]}
              >
                <Tag
                  size={20}
                  color={
                    validationError
                      ? "#DC3545"
                      : isFocused
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, dynamicStyles.text]}
                  placeholder="Enter tag..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={tag}
                  onChangeText={(t) => {
                    setTag(t);
                    if (validationError) setValidationError("");
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>

              <View style={styles.validationContainer}>
                {validationError ? (
                  <Text style={styles.errorText}>{validationError}</Text>
                ) : (
                  <Text style={[styles.charCount, dynamicStyles.textSecondary]}>
                    {tag.length}/30
                  </Text>
                )}
              </View>
            </Animated.View>
          </View>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Platform.OS === "ios" ? 0 : 20 },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.saveButton,
                dynamicStyles.saveButton,
                isLoading && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 999,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  toastContent: { flexDirection: "row", alignItems: "center" },
  toastText: { marginLeft: 10, fontSize: 14, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 10,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", marginLeft: 15 },
  content: { flex: 1, padding: 24 },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    marginBottom: 30,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  infoDesc: { fontSize: 13, flex: 1, lineHeight: 18 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 17, fontWeight: "500", height: "100%" },
  validationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: { color: "#DC3545", fontSize: 12, fontWeight: "600" },
  charCount: { fontSize: 12, marginLeft: "auto" },
  footer: { padding: 24 },
  saveButton: {
    borderRadius: 16,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
});

export default EditTagScreen;
