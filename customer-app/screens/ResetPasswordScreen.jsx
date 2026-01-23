import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import api from "../utils/api";
import { useTheme } from "../contexts/ThemeContext.jsx";

// --- OPTIMIZATION 1: MEMOIZED TOAST COMPONENT ---
const TopToast = memo(
  ({ visible, message, type, onHide, theme }) => {
    // Start slightly higher (-150) to ensure it's hidden even with the new top margin
    const translateY = useRef(new Animated.Value(-150)).current;

    useEffect(() => {
      let timer;
      if (visible) {
        Animated.spring(translateY, {
          // It will settle at 30px (from container) + these values
          toValue: Platform.OS === "ios" ? 50 : 20,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }).start();

        timer = setTimeout(() => {
          hideToast();
        }, 3000);
      } else {
        hideToast();
      }
      return () => clearTimeout(timer);
    }, [visible]);

    const hideToast = () => {
      Animated.timing(translateY, {
        toValue: -150, // Move back up fully off-screen
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (onHide && visible) onHide();
      });
    };

    if (!visible && translateY._value === -150) return null;

    const isSuccess = type === "success";
    const bgColor = isSuccess ? "#4CAF50" : "#FF5252";
    const iconName = isSuccess ? "check" : "alert-circle";

    return (
      <Animated.View
        style={[styles.toastContainer, { transform: [{ translateY }] }]}
      >
        <View style={[styles.toastContent, { backgroundColor: bgColor }]}>
          <Icon name={iconName} size={20} color="#fff" />
          <Text style={styles.toastText}>{message}</Text>
        </View>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.visible === nextProps.visible &&
      prevProps.message === nextProps.message
    );
  }
);

// --- MAIN SCREEN ---
const ResetPasswordScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { email, otp } = route.params || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "" });

  const hideToastHandler = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback((type, message) => {
    setToast({ visible: true, message, type });
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const validateInputs = () => {
    if (!password || !confirmPassword) {
      showToast("error", "Please fill in all fields.");
      return false;
    }
    if (password.length < 6) {
      showToast("error", "Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      showToast("error", "Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    Keyboard.dismiss();

    if (!validateInputs()) return;

    setLoading(true);

    try {
      await api.post(
        `/api/password/reset`,
        {
          email,
          otp,
          password,
        },
        { timeout: 10000 }
      );

      showToast("success", "Password reset successfully!");

      setTimeout(() => {
        navigation.navigate("Login");
      }, 1500);
    } catch (err) {
      let errorMessage = "Something went wrong. Please try again.";
      if (err.response) {
        errorMessage = err.response.data?.message || "Invalid Request.";
      } else if (err.request) {
        errorMessage = "Network error. Check your internet or server.";
      } else {
        errorMessage = err.message;
      }
      showToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {/* Toast Layer */}
      <View style={styles.toastLayer}>
        <TopToast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToastHandler}
          theme={theme}
        />
      </View>

      {/* --- KEYBOARD HANDLING WRAPPER START --- */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={handleGoBack}
                  style={[
                    styles.backButton,
                    { backgroundColor: theme.colors.card },
                  ]}
                  activeOpacity={0.7}
                >
                  <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.title, { color: theme.colors.text }]}>
                Reset Password
              </Text>

              <View style={styles.formContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.card,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="New Password"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.card,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Confirm New Password"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: theme.colors.primary,
                      opacity: loading ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.background} />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        { color: theme.colors.background },
                      ]}
                    >
                      Reset Password
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      {/* --- KEYBOARD HANDLING WRAPPER END --- */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  toastLayer: {
    position: "absolute",
    top: 30, // <--- CHANGED: Added 30px margin from top of screen
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    elevation: 9999,
  },
  toastContainer: {
    position: "absolute",
    top: 0,
    width: "90%",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  toastText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  header: {
    width: "100%",
    height: 60,
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },
  formContainer: {
    width: "100%",
    marginBottom: 40,
  },
  input: {
    height: 56,
    fontSize: 16,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ResetPasswordScreen;
