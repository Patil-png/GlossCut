import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  ActivityIndicator,
  FlatList} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  ChevronLeft,
  ArrowRight,
  Languages,
  Check,
  ShieldCheck,
  AlertCircle,
  CheckCircle2} from "lucide-react-native";

const { width } = Dimensions.get("window");

// --- OPTIMIZED SUB-COMPONENT: Language Item ---
// Memoized to prevent re-rendering every item when a single one is selected
const LanguageItem = memo(({ item, isSelected, onPress, themeColor }) => (
  <TouchableOpacity
    style={[
      styles.optionItem,
      {
        backgroundColor: isSelected ? themeColor + "10" : "#F7F8F9",
        borderColor: isSelected ? themeColor : "#F7F8F9",
        borderWidth: 2},
    ]}
    onPress={() => onPress(item)}
    activeOpacity={0.7}
  >
    <Text
      style={[
        styles.optionText,
        { color: isSelected ? themeColor : "#111827" },
      ]}
    >
      {item}
    </Text>
    {isSelected && (
      <CheckCircle2 size={20} color={themeColor} strokeWidth={2.5} />
    )}
  </TouchableOpacity>
));

const LanguageSelectionScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();

  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isLoading, setIsLoading] = useState(false);

  // --- MODERN ALERT SYSTEM STATE ---
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    message: "",
    type: "success"});
  const alertY = useRef(new Animated.Value(-100)).current; // Start off-screen

  // UI Entrance Animations
  const slideUp = useRef(new Animated.Value(50)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user?.language) setSelectedLanguage(user.language);
  }, [user]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true}),
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true}),
    ]).start();
  }, []);

  // --- MACRO-INTERACTION: TOP DROP ALERT ---
  const triggerAlert = useCallback(
    (message, type = "success") => {
      setAlertConfig({ visible: true, message, type });

      // Animation: Drop down to marginTop 40
      Animated.spring(alertY, {
        toValue: 50, // Adjustment for top margin
        useNativeDriver: true,
        tension: 50,
        friction: 8}).start();

      // Hide after 3 seconds
      setTimeout(() => {
        Animated.timing(alertY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true}).start(() => setAlertConfig({ ...alertConfig, visible: false }));
      }, 3000);
    },
    [alertY]
  );

  const handleUpdateLanguage = useCallback(async () => {
    setIsLoading(true);
    try {
      // Logic for network/server check (Simulated functionality)
      const success = await updateProfile({ language: selectedLanguage });

      if (success) {
        triggerAlert("Language updated successfully!", "success");
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        triggerAlert("Server busy. Please try again.", "error");
      }
    } catch (err) {
      triggerAlert("Check your internet connection.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [selectedLanguage, updateProfile, navigation, triggerAlert]);

  const languageOptions = useMemo(
    () => [
      "English",
      "Spanish",
      "French",
      "German",
      "Hindi",
      "Marathi",
      "Tamil",
      "Telugu",
    ],
    []
  );

  // PERFORMANCE: renderItem optimized with memoized child
  const renderItem = useCallback(
    ({ item }) => (
      <LanguageItem
        item={item}
        isSelected={selectedLanguage === item}
        onPress={setSelectedLanguage}
        themeColor={theme.colors.primary}
      />
    ),
    [selectedLanguage, theme.colors.primary]
  );

  // UI Components memoized to zero-out unnecessary lags
  const HeaderComponent = useMemo(
    () => (
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
      </View>
    ),
    [navigation]
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* --- MODERN MACRO-INTERACTION ALERT --- */}
      <Animated.View
        style={[
          styles.customAlert,
          {
            transform: [{ translateY: alertY }],
            backgroundColor:
              alertConfig.type === "success" ? "#ECFDF5" : "#FEF2F2"},
        ]}
      >
        {alertConfig.type === "success" ? (
          <CheckCircle2 size={20} color="#10B981" />
        ) : (
          <AlertCircle size={20} color="#EF4444" />
        )}
        <Text
          style={[
            styles.alertText,
            { color: alertConfig.type === "success" ? "#065F46" : "#991B1B" },
          ]}
        >
          {alertConfig.message}
        </Text>
      </Animated.View>

      <SafeAreaView style={styles.flexOne}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flexOne}
        >
          {HeaderComponent}

          <View style={styles.contentContainer}>
            {/* Illustration Section */}
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
                  <Languages size={48} color={theme.colors.primary} />
                </View>
              </View>
            </View>

            <Animated.View
              style={{ opacity: fade, transform: [{ translateY: slideUp }] }}
            >
              <Text style={styles.heading}>Select Language</Text>
              <Text style={styles.subHeading}>
                Choose your preferred language for the best experience.
              </Text>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Language</Text>
                <FlatList
                  data={languageOptions}
                  renderItem={renderItem}
                  keyExtractor={(item) => item}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={8} // Optimization for smooth initial load
                  maxToRenderPerBatch={10}
                  removeClippedSubviews={true} // Performance boost
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleUpdateLanguage}
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
                    <Text style={styles.btnText}>Update Language</Text>
                    <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.helpLink}
                onPress={() =>
                  triggerAlert("Support: contact@gloss.cut", "info")
                }
              >
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
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#ffffff" },
  flexOne: { flex: 1 },
  // --- ALERT STYLES ---
  customAlert: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    // Soft shadow for depth
  },
  alertText: { fontSize: 14, fontWeight: "600" },
  // --- EXISTING STYLES (OPTIMIZED) ---
  navBar: { paddingHorizontal: 20, paddingVertical: 10 },
  backBtn: {
    marginTop: 10,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5"},
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 40},
  illustrationArea: { alignItems: "center", marginBottom: 30 },
  circleBack: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center"},
  circleFront: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center"},
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.5},
  subHeading: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 25,
    fontWeight: "500"},
  inputSection: { marginBottom: 20 },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
    textTransform: "uppercase"},
  list: { maxHeight: 220 },
  optionItem: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 10},
  optionText: { fontSize: 16, fontWeight: "600" },
  submitBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 4},
  btnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  helpLink: { alignItems: "center", marginTop: 20 },
  helpText: { fontSize: 13, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 20,
    opacity: 0.7},
  footerText: { fontSize: 11, color: "#6B7280", fontWeight: "500" }});

export default LanguageSelectionScreen;
