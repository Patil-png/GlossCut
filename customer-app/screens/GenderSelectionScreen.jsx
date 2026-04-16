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
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
  Easing
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  ChevronLeft,
  ArrowRight,
  User,
  Check,
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from "lucide-react-native";

const { width } = Dimensions.get("window");

// --- CUSTOM ANIMATED ALERT COMPONENT ---
const CustomAlert = React.memo(({ visible, message, type, onHide, topInset }) => {
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: topInset,
        tension: 50,
        friction: 8,
        useNativeDriver: true
      }).start();

      const timer = setTimeout(() => {
        hideAlert();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideAlert = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true
    }).start(() => onHide());
  };

  if (!visible) return null;

  const isError = type === "error";

  return (
    <Animated.View
      style={[
        styles.alertContainer,
        { transform: [{ translateY }] },
        isError ? styles.errorAlert : styles.successAlert,
      ]}
    >
      {isError ? (
        <AlertCircle size={20} color="#EF4444" />
      ) : (
        <CheckCircle2 size={20} color="#10B981" />
      )}
      <Text
        style={[styles.alertText, { color: isError ? "#991B1B" : "#065F46" }]}
      >
        {message}
      </Text>
    </Animated.View>
  );
});

const GenderSelectionScreen = ({ navigation }) => {
  const { user, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedGender, setSelectedGender] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    message: "",
    type: "success"
  });

  const slideUp = useRef(new Animated.Value(30)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user?.gender) {
      setSelectedGender(user.gender);
    }

    Animated.parallel([
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
    ]).start();
  }, [user]);

  const showAlert = useCallback((message, type = "success") => {
    setAlertConfig({ visible: true, message, type });
  }, []);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleUpdate = useCallback(async () => {
    if (!selectedGender) {
      showAlert("Please select a gender", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Logic for network/server check
      const success = await updateProfile({ gender: selectedGender });

      if (success) {
        showAlert("Profile updated successfully!");
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        showAlert("Server update failed. Try again.", "error");
      }
    } catch (error) {
      showAlert("Internet connection error", "error");
    } finally {
      setIsLoading(false);
    }
  }, [selectedGender, updateProfile, navigation, showAlert]);

  const genderOptions = useMemo(() => ["Male", "Female", "Other"], []);

  // --- MEMOIZED UI COMPONENTS ---

  const Header = useMemo(
    () => (
      <View style={[styles.navBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
      </View>
    ),
    [handleGoBack]
  );

  const Illustration = useMemo(
    () => (
      <View style={styles.illustrationArea}>
        <View
          style={[
            styles.circleBack,
            { backgroundColor: theme.colors.primary + "15" },
          ]}
        >
          <View
            style={[
              styles.circleFront,
              { backgroundColor: theme.colors.primary + "25" },
            ]}
          >
            <User size={48} color={theme.colors.primary} />
          </View>
        </View>
      </View>
    ),
    [theme.colors.primary]
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      {/* GLOBAL NOTIFICATION COMPONENT */}
      <CustomAlert
        visible={alertConfig.visible}
        message={alertConfig.message}
        type={alertConfig.type}
        onHide={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        topInset={insets.top + (Platform.OS === 'android' ? 10 : 0)}
      />

      <View style={styles.flexOne}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flexOne}
        >
          {Header}

          <View style={styles.contentContainer}>
            {Illustration}

            <Animated.View
              style={{ opacity: fade, transform: [{ translateY: slideUp }] }}
            >
              <Text style={styles.heading}>Select Gender</Text>
              <Text style={styles.subHeading}>
                Help us personalize your experience.
              </Text>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Gender Identity</Text>
                {genderOptions.map((gender) => {
                  const isSelected = selectedGender === gender;
                  return (
                    <TouchableOpacity
                      key={gender}
                      onPress={() => setSelectedGender(gender)}
                      activeOpacity={0.8}
                      style={[
                        styles.optionItem,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary + "08"
                            : "#F9FAFB",
                          borderColor: isSelected
                            ? theme.colors.primary
                            : "#F3F4F6",
                          borderWidth: 1.5
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: isSelected
                              ? theme.colors.primary
                              : "#1F2937"
                          },
                        ]}
                      >
                        {gender}
                      </Text>
                      {isSelected && (
                        <Check
                          size={20}
                          color={theme.colors.primary}
                          strokeWidth={3}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleUpdate}
                style={[
                  styles.submitBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Continue</Text>
                    <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.footerText}>
              Secure selection • Data encrypted
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#ffffff" },
  flexOne: { flex: 1 },
  navBar: { paddingHorizontal: 20, paddingBottom: 10 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6"
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 40
  },
  // --- ALERT STYLES ---
  alertContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 9999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  successAlert: {
    backgroundColor: "#ECFDF5",
    borderLeftWidth: 4,
    borderLeftColor: "#10B981"
  },
  errorAlert: {
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444"
  },
  alertText: { fontSize: 14, fontWeight: "600" },

  // --- UI STYLES ---
  illustrationArea: { alignItems: "center", marginBottom: 30 },
  circleBack: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center"
  },
  circleFront: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center"
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.5
  },
  subHeading: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 30,
    fontWeight: "500"
  },
  inputSection: { marginBottom: 30 },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  optionItem: {
    height: 60,
    borderRadius: 16,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 12
  },
  optionText: { fontSize: 16, fontWeight: "700" },
  submitBtn: {
    height: 58,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  btnText: { fontSize: 17, fontWeight: "700", color: "#fff" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 20
  },
  footerText: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" }
});

export default GenderSelectionScreen;
