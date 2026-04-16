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
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react-native";

const { width } = Dimensions.get("window");

const EditNameScreen = ({ navigation }) => {
  const { user, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({ first: false, last: false });

  // --- ANIMATION REFS ---
  const slideUp = useRef(new Animated.Value(50)).current;
  const fade = useRef(new Animated.Value(0)).current;

  // --- CUSTOM ALERT STATE & REFS ---
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    message: "",
    type: "success"
  });
  const alertTranslateY = useRef(new Animated.Value(-150)).current; // Start off-screen top

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    if (user?.name) {
      const nameParts = user.name.split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
    }
  }, [user]);

  // --- PAGE ENTRY ANIMATION ---
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
    ]).start();
  }, []);

  // --- ALERT HANDLER (Macro-Interaction) ---
  const showAlert = useCallback((type, message) => {
    setAlertConfig({ visible: true, message, type });

    // Spring animation for modern "bounce" feel
    Animated.spring(alertTranslateY, {
      toValue: insets.top + 10,
      friction: 6,
      tension: 50,
      useNativeDriver: true
    }).start();

    // Auto-hide after 3 seconds
    setTimeout(() => {
      hideAlert();
    }, 3000);
  }, []);

  const hideAlert = useCallback(() => {
    Animated.timing(alertTranslateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setAlertConfig((prev) => ({ ...prev, visible: false }));
    });
  }, []);

  // --- HANDLERS ---
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSupport = useCallback(() => {
    showAlert("info", "Contact support@gloss.cut");
  }, [showAlert]);

  const handleFocus = useCallback((field) => {
    setIsFocused((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleBlur = useCallback((field) => {
    setIsFocused((prev) => ({ ...prev, [field]: false }));
  }, []);

  const handleUpdateName = useCallback(async () => {
    // Validation
    const fName = firstName.trim();
    const lName = lastName.trim();
    const newName = `${fName} ${lName}`.trim();

    if (!fName) {
      showAlert("error", "First name is required.");
      return;
    }

    setIsLoading(true);

    try {
      const success = await updateProfile({ name: newName });

      if (success) {
        showAlert("success", "Name updated successfully!");
        // Small delay to let user see the success animation before popping
        setTimeout(() => {
          navigation.goBack();
        }, 1200);
      } else {
        showAlert("error", "Failed to update name. Please try again.");
      }
    } catch (error) {
      // Prevents crash if server is down or internet is off
      showAlert("error", "Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, [firstName, lastName, updateProfile, navigation, showAlert]);

  // --- MEMOIZED UI COMPONENTS ---

  const HeaderComponent = useMemo(
    () => (
      <View style={[styles.navBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
      </View>
    ),
    [handleGoBack]
  );

  const IllustrationComponent = useMemo(
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

  // --- DYNAMIC STYLES ---
  const firstNameContainerStyle = useMemo(
    () => [
      styles.inputWrapper,
      {
        backgroundColor: isFocused.first ? "#fff" : "#F7F8F9",
        borderColor: isFocused.first ? theme.colors.primary : "#F7F8F9",
        borderWidth: 2
      },
    ],
    [isFocused.first, theme.colors.primary]
  );

  const lastNameContainerStyle = useMemo(
    () => [
      styles.inputWrapper,
      {
        backgroundColor: isFocused.last ? "#fff" : "#F7F8F9",
        borderColor: isFocused.last ? theme.colors.primary : "#F7F8F9",
        borderWidth: 2
      },
    ],
    [isFocused.last, theme.colors.primary]
  );

  const buttonStyle = useMemo(
    () => [styles.submitBtn, { backgroundColor: theme.colors.primary }],
    [theme.colors.primary]
  );

  // --- CUSTOM ALERT RENDERER ---
  const renderAlert = useMemo(() => {
    // Determine color and icon based on type
    let bgColor = "#10B981"; // Success Green
    let IconComponent = CheckCircle;

    if (alertConfig.type === "error") {
      bgColor = "#EF4444"; // Error Red
      IconComponent = XCircle;
    } else if (alertConfig.type === "info") {
      bgColor = "#3B82F6"; // Info Blue
      IconComponent = AlertCircle;
    }

    return (
      <Animated.View
        style={[
          styles.alertContainer,
          { transform: [{ translateY: alertTranslateY }] },
        ]}
      >
        <View style={[styles.alertContent, { borderLeftColor: bgColor }]}>
          <View
            style={[styles.alertIconFrame, { backgroundColor: bgColor + "15" }]}
          >
            <IconComponent size={20} color={bgColor} />
          </View>
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertTitle}>
              {alertConfig.type === "error"
                ? "Something went wrong"
                : alertConfig.type === "info"
                  ? "Note"
                  : "Success"}
            </Text>
            <Text style={styles.alertMessage} numberOfLines={2}>
              {alertConfig.message}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }, [alertConfig, alertTranslateY]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Alert is absolute positioned, so it sits on top of everything */}
      {renderAlert}

      <View style={styles.flexOne}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flexOne}
        >
          {HeaderComponent}

          <View style={styles.contentContainer}>
            {IllustrationComponent}

            <Animated.View
              style={{ opacity: fade, transform: [{ translateY: slideUp }] }}
            >
              <View>
                <Text style={styles.heading}>Update Your Name</Text>
                <Text style={styles.subHeading}>
                  This is how you'll appear to others in the app.
                </Text>
              </View>

              {/* --- NAME INPUTS --- */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={firstNameContainerStyle}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your first name"
                    placeholderTextColor="#9CA3AF"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    onFocus={() => handleFocus("first")}
                    onBlur={() => handleBlur("first")}
                    cursorColor={theme.colors.primary}
                  />
                </View>

                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={lastNameContainerStyle}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your last name"
                    placeholderTextColor="#9CA3AF"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    onFocus={() => handleFocus("last")}
                    onBlur={() => handleBlur("last")}
                    cursorColor={theme.colors.primary}
                  />
                </View>
              </View>

              {/* --- MAIN BUTTON --- */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleUpdateName}
                style={buttonStyle}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Update Name</Text>
                    <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpLink} onPress={handleSupport}>
                <Text
                  style={[
                    styles.helpText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Having trouble?
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <ShieldCheck size={16} color="#10B981" />
            <Text style={styles.footerText}>Secure 256-bit Encryption</Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#ffffff"
  },
  flexOne: {
    flex: 1
  },
  navBar: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: "flex-start",
    zIndex: 1
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5"
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 80,
    zIndex: 0
  },
  // Custom Alert Styles
  alertContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 9999, // Ensure it is above everything
    alignItems: "center"
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    width: "100%",
    borderLeftWidth: 4
  },
  alertIconFrame: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  alertTextContainer: {
    flex: 1
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2
  },
  alertMessage: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500"
  },

  // Illustration Styles
  illustrationArea: {
    alignItems: "center",
    marginBottom: 40
  },
  circleBack: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center"
  },
  circleFront: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative"
  },

  // Text Styles
  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    letterSpacing: -0.5
  },
  subHeading: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: "500"
  },

  // Input Styles
  inputSection: {
    marginBottom: 24
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  inputWrapper: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
    marginBottom: 16
  },
  textInput: {
    fontSize: 17,
    color: "#111827",
    fontWeight: "600",
    height: "100%"
  },

  // Button Styles
  submitBtn: {
    height: 58,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  btnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff"
  },

  helpLink: {
    alignItems: "center",
    marginTop: 24
  },
  helpText: {
    fontSize: 14,
    fontWeight: "600"
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 20,
    opacity: 0.8
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500"
  }
});

export default EditNameScreen;
