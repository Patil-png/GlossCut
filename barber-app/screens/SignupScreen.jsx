import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Keyboard,
  Modal,
  Pressable,
  Animated,
  FlatList,
} from "react-native";
import api from "../utils/api";
// UI Icons
import {
  Store,
  MapPin,
  Phone,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Grid,
  Info,
  CheckCircle,
  Briefcase,
  AlertTriangle,
  XCircle,
  ChevronDown,
  PlusCircle,
  Scissors,
  Sparkles,
  Users,
  Search,
  X,
  Crown, // Added for "Premium" feel
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// ============================================================================
// 1. PREMIUM DROPDOWN WITH SEARCH (Refined Vintage)
// ============================================================================

const PremiumDropdown = ({
  label,
  icon: Icon,
  value,
  options,
  onSelect,
  placeholder = "Select an option",
  isLoading = false,
  searchable = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchText) return options;
    const specialItems = options.filter((opt) => opt.special);
    const normalItems = options.filter((opt) => !opt.special);

    const filtered = normalItems.filter(
      (item) =>
        item.label.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.subLabel &&
          item.subLabel.toLowerCase().includes(searchText.toLowerCase())),
    );
    return [...filtered, ...specialItems];
  }, [options, searchText, searchable]);

  const openModal = () => {
    setSearchText("");
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  const handleSelect = (val) => {
    onSelect(val);
    closeModal();
  };

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={openModal}
        style={styles.dropdownTrigger}
      >
        <View style={styles.iconWrapper}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#8B4513" />
          ) : (
            <Icon size={18} color="#8B5A2B" />
          )}
        </View>
        <Text
          style={[
            styles.dropdownText,
            !selectedLabel && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={18} color="#A1887F" />
      </TouchableOpacity>

      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal}>
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
          </Pressable>

          <Animated.View
            style={[
              styles.modalSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.dragIndicator} />
              {!searchable ? (
                <Text style={styles.modalTitle}>{label}</Text>
              ) : (
                <View style={styles.searchContainer}>
                  <Search
                    size={18}
                    color="#8B5A2B"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={`Search ${label}...`}
                    placeholderTextColor="#BCAAA4"
                    value={searchText}
                    onChangeText={setSearchText}
                    autoFocus={false}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText("")}>
                      <X size={18} color="#5D4037" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value.toString()}
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Store size={40} color="#D7CCC8" />
                  <Text style={styles.emptyText}>No matches found</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                const isSpecial = item.special;

                return (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionSelected,
                      isSpecial && styles.optionSpecial,
                    ]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.optionIconBox,
                          isSelected && {
                            backgroundColor: "#3E2723",
                            borderColor: "#3E2723",
                          },
                          isSpecial && {
                            backgroundColor: "#F1F8E9",
                            borderColor: "#AED581",
                          },
                        ]}
                      >
                        {item.icon ? (
                          <item.icon
                            size={18}
                            color={
                              isSelected
                                ? "#FFF"
                                : isSpecial
                                  ? "#33691E"
                                  : "#8D6E63"
                            }
                          />
                        ) : (
                          <Grid
                            size={18}
                            color={isSelected ? "#FFF" : "#8D6E63"}
                          />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && {
                              color: "#3E2723",
                              fontWeight: "700",
                            },
                            isSpecial && {
                              color: "#33691E",
                              fontWeight: "700",
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                        {item.subLabel && (
                          <Text style={styles.optionSubLabel} numberOfLines={1}>
                            {item.subLabel}
                          </Text>
                        )}
                      </View>
                    </View>
                    {isSelected && <CheckCircle size={20} color="#3E2723" />}
                  </TouchableOpacity>
                );
              }}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// 2. MODERN ALERT
// ============================================================================

const ModernAlert = React.memo(({ visible, title, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        damping: 14,
        stiffness: 120,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => handleClose(), 4000);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -200,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onHide) onHide();
    });
  };

  const config = useMemo(() => {
    switch (type) {
      case "error":
        return {
          bg: "#3E1010",
          border: "#8B2E2E",
          iconColor: "#EF9A9A",
          Icon: XCircle,
        };
      case "success":
        return {
          bg: "#0D2115",
          border: "#1B4D2E",
          iconColor: "#81C784",
          Icon: CheckCircle,
        };
      case "warning":
        return {
          bg: "#2E2100",
          border: "#6D5410",
          iconColor: "#FFD54F",
          Icon: AlertTriangle,
        };
      default:
        return {
          bg: "#232323",
          border: "#444",
          iconColor: "#E0E0E0",
          Icon: Info,
        };
    }
  }, [type]);

  return (
    <Animated.View
      style={[styles.alertWrapper, { transform: [{ translateY }] }]}
    >
      <View
        style={[
          styles.alertContainer,
          { backgroundColor: config.bg, borderColor: config.border },
        ]}
      >
        <View style={styles.alertIconWrapper}>
          <config.Icon size={22} color={config.iconColor} strokeWidth={2} />
        </View>
        <View style={styles.alertTextContainer}>
          <Text style={[styles.alertTitle, { color: config.iconColor }]}>
            {title}
          </Text>
          <Text style={styles.alertMessage} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
});

// ============================================================================
// 3. SUB-COMPONENTS
// ============================================================================

const BackgroundDecorations = React.memo(() => (
  <View style={styles.backgroundDecoration}>
    {/* Deeper, warmer glows */}
    <View style={styles.glowTopRight} />
    <View style={styles.glowBottomLeft} />
  </View>
));

const HeaderSection = React.memo(() => (
  <View style={styles.header}>
    <View style={styles.logoWrapper}>
      <View style={styles.logoBorderRing}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/SetKarr.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
    <View style={styles.headerTextStack}>
      <Text style={styles.preTitle}>EXCLUSIVE ACCESS</Text>
      <Text style={styles.title}>JOIN THE CLUB</Text>
      <View style={styles.titleUnderline} />
    </View>
    <Text style={styles.subtitle}>
      Excellence in grooming. Register your chair.
    </Text>
  </View>
));

const SectionHeader = React.memo(({ icon: Icon, title }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconBg}>
      <Icon size={14} color="#8B4513" />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
));

const InputItem = React.memo(
  ({
    icon: Icon,
    placeholder,
    value,
    onChangeText,
    keyboardType = "default",
    isSecure = false,
    toggleSecure = null,
    onFocus,
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{placeholder}</Text>
      <View style={styles.inputContainer}>
        <View style={styles.iconWrapper}>
          <Icon size={18} color="#8B5A2B" />
        </View>
        <TextInput
          style={styles.input}
          placeholder={`Enter ${placeholder}`}
          placeholderTextColor="#BCAAA4"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="none"
          secureTextEntry={isSecure}
          onFocus={onFocus}
        />
        {toggleSecure && (
          <TouchableOpacity onPress={toggleSecure} style={styles.eyeButton}>
            {isSecure ? (
              <EyeOff size={20} color="#8B5A2B" />
            ) : (
              <Eye size={20} color="#8B5A2B" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  ),
);

const FooterSection = React.memo(({ onLoginPress }) => (
  <View style={styles.footer}>
    <TouchableOpacity onPress={onLoginPress} style={styles.loginLinkContainer}>
      <Text style={styles.footerText}>
        Already a member? <Text style={styles.loginLink}>SIGN IN</Text>
      </Text>
    </TouchableOpacity>
  </View>
));

// ============================================================================
// 4. MAIN SCREEN
// ============================================================================

const SignupScreen = ({ navigation }) => {
  // STATE
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [category, setCategory] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // SHOP SELECTION
  const [existingShops, setExistingShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [isNewShop, setIsNewShop] = useState(false);
  const [loadingShops, setLoadingShops] = useState(true);

  // ALERT STATE
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  // PAGE ANIMATION
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 14,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleInputFocus = useCallback(() => {
    if (alertConfig.visible)
      setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, [alertConfig.visible]);

  const showAlert = useCallback((title, message, type = "info") => {
    setAlertConfig({ visible: true, title, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  // Fetch Shops
  useEffect(() => {
    const fetchExistingShops = async () => {
      try {
        const response = await api.get('/api/shop/all');
        setExistingShops(response.data || []);
      } catch (error) {
        // console.log("Error fetching shops:", error);
        showAlert("Connection Issue", "Could not load shops.", "warning");
      } finally {
        setLoadingShops(false);
      }
    };
    fetchExistingShops();
  }, [showAlert]);

  // Logic
  const handleShopSelection = useCallback(
    (shopId) => {
      if (shopId === "new") {
        setIsNewShop(true);
        setSelectedShopId("new");
        setShopName("");
        setShopAddress("");
        setShopPhone("");
        setCategory("");
      } else {
        setIsNewShop(false);
        setSelectedShopId(shopId);
        const selectedShop = existingShops.find((shop) => shop._id === shopId);
        if (selectedShop) {
          setShopName(selectedShop.name || "");
          setShopAddress(selectedShop.address || "");
          setShopPhone(selectedShop.phone || "");
          setCategory(selectedShop.category || "Barber");
        }
      }
    },
    [existingShops],
  );

  // Dropdown Data
  const shopOptions = useMemo(() => {
    const list = existingShops.map((shop) => ({
      label: shop.name,
      subLabel: shop.address,
      value: shop._id,
      icon: Store,
    }));
    list.push({
      label: "Establish New Shop",
      subLabel: "Register your own business",
      value: "new",
      icon: PlusCircle,
      special: true,
    });
    return list;
  }, [existingShops]);

  const handleCategorySelect = (val) => {
    setCategory(val);
    showAlert("Important", "This category cannot be changed later. Please choose carefully.", "warning");
  };

  const categoryOptions = [
    { label: "Barber", value: "Barber", icon: Scissors },
    { label: "Women's Salon", value: "Women's Salon", icon: Sparkles },
    { label: "Pet Care", value: "Pet Care", icon: CheckCircle },
    { label: "Unisex", value: "Unisex", icon: Users },
  ];

  const handleSignup = async () => {
    if (!name || !email || !password || !phone) {
      showAlert(
        "Missing Fields",
        "Please fill in all personal details.",
        "warning",
      );
      return;
    }
    if (isNewShop) {
      if (!shopName || !shopAddress || !shopPhone) {
        showAlert(
          "Shop Details Missing",
          "Please fill in all shop details.",
          "warning",
        );
        return;
      }
      if (!category) {
        showAlert(
          "Category Required",
          "Please select a shop specialization.",
          "warning"
        );
        return;
      }
    }
    if (!selectedShopId) {
      showAlert("Selection Required", "Please select a workplace.", "warning");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      await api.post('/api/auth/register', {
        name,
        phone,
        email,
        password,
        role: "barber",
        shopName,
        shopAddress,
        shopPhone,
        category,
        isShopOwner: isNewShop,
        selectedShopId: isNewShop ? null : selectedShopId,
      });

      showAlert("Success", "Account created successfully.", "success");
      setTimeout(() => navigation.navigate("Login"), 1500);
    } catch (err) {
      const msg =
        err.response?.data?.msg || err.message || "Something went wrong.";
      showAlert("Signup Failed", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#FAF7F2", "#F0EAD6", "#E6DCCA"]}
      style={styles.container}
      locations={[0, 0.4, 1]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <BackgroundDecorations />

      <ModernAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onHide={hideAlert}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.mainContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <HeaderSection />

            {/* --- THE MEMBERSHIP APPLICATION CARD --- */}
            <View style={styles.formCard}>
              <View style={styles.cardGoldStrip} />

              <View style={styles.cardPadding}>
                {/* SHOP SECTION */}
                <SectionHeader icon={Briefcase} title="Workplace" />
                <View style={styles.formSection}>
                  <PremiumDropdown
                    label="SELECT WORKPLACE"
                    icon={Briefcase}
                    value={selectedShopId}
                    options={shopOptions}
                    onSelect={handleShopSelection}
                    isLoading={loadingShops}
                    placeholder="Choose Shop..."
                    searchable={true}
                  />

                  {selectedShopId && !isNewShop && (
                    <View style={[styles.infoBox, styles.infoBoxJoin]}>
                      <Info size={16} color="#166534" />
                      <Text style={styles.infoTextJoin}>
                        Application: Staff Member (Existing Shop)
                      </Text>
                    </View>
                  )}
                  {isNewShop && (
                    <View style={[styles.infoBox, styles.infoBoxCreate]}>
                      <Crown size={16} color="#B7791F" />
                      <Text style={styles.infoTextCreate}>
                        Application: Owner (New Establishment)
                      </Text>
                    </View>
                  )}

                  <InputItem
                    icon={Store}
                    placeholder="Establishment Name"
                    value={shopName}
                    onChangeText={setShopName}
                    onFocus={handleInputFocus}
                  />
                  <InputItem
                    icon={MapPin}
                    placeholder="Full Address"
                    value={shopAddress}
                    onChangeText={setShopAddress}
                    onFocus={handleInputFocus}
                  />
                  <InputItem
                    icon={Phone}
                    placeholder="Business Phone"
                    value={shopPhone}
                    onChangeText={setShopPhone}
                    keyboardType="phone-pad"
                    onFocus={handleInputFocus}
                  />

                  <PremiumDropdown
                    label="SPECIALIZATION"
                    icon={Grid}
                    value={category}
                    options={categoryOptions}
                    onSelect={handleCategorySelect}
                    placeholder="Select category..."
                  />
                </View>

                {/* ORNAMENTAL DIVIDER */}
                <View style={styles.ornamentalDivider}>
                  <View style={styles.line} />
                  <View style={styles.diamond} />
                  <View style={styles.line} />
                </View>

                {/* PERSONAL SECTION */}
                <SectionHeader icon={User} title="Candidate Info" />
                <View style={styles.formSection}>
                  <InputItem
                    icon={User}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    onFocus={handleInputFocus}
                  />
                  <InputItem
                    icon={Phone}
                    placeholder="Mobile Number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    onFocus={handleInputFocus}
                  />
                  <InputItem
                    icon={Mail}
                    placeholder="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    onFocus={handleInputFocus}
                  />
                  <InputItem
                    icon={Lock}
                    placeholder="Secure Password"
                    value={password}
                    onChangeText={setPassword}
                    isSecure={!isPasswordVisible}
                    toggleSecure={() =>
                      setIsPasswordVisible(!isPasswordVisible)
                    }
                    onFocus={handleInputFocus}
                  />
                </View>

                {/* STITCHED LEATHER BUTTON */}
                <TouchableOpacity
                  style={styles.leatherButtonContainer}
                  onPress={handleSignup}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#8B4513", "#5D4037"]}
                    style={styles.leatherGradient}
                  >
                    <View style={styles.stitchLine}>
                      {loading ? (
                        <ActivityIndicator color="#F5F5F5" />
                      ) : (
                        <View style={styles.buttonContent}>
                          <Text style={styles.submitButtonText}>
                            SUBMIT APPLICATION
                          </Text>
                          <ArrowRight
                            size={20}
                            color="#F5F5F5"
                            strokeWidth={2.5}
                          />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            <FooterSection onLoginPress={() => navigation.navigate("Login")} />
            <Text style={styles.copyright}>GlossCut Inc. • Est. 2026</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// ============================================================================
// 5. STYLES (The "Executive Platinum" Look)
// ============================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 60 },
  mainContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    maxWidth: 440,
    alignSelf: "center",
    width: "100%",
  },

  // Background
  backgroundDecoration: { position: "absolute", inset: 0, overflow: "hidden" },
  glowTopRight: {
    position: "absolute",
    top: -150,
    right: -120,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(212, 175, 55, 0.06)",
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(93, 64, 55, 0.05)",
  },

  // Header
  header: { alignItems: "center", marginBottom: 36 },
  logoWrapper: {
    shadowColor: "#5D4037",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  logoBorderRing: { borderRadius: 32, padding: 3, backgroundColor: "#D4AF37" },
  logoContainer: {
    width: 84,
    height: 84,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF7F2",
    borderWidth: 1,
    borderColor: "#E6DCCA",
  },
  logo: { width: 60, height: 60 },
  headerTextStack: { alignItems: "center" },
  preTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8B5A2B",
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#3E2723",
    letterSpacing: 2,
  },
  titleUnderline: {
    width: 50,
    height: 3,
    backgroundColor: "#D4AF37",
    marginTop: 12,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#6D4C41",
    textAlign: "center",
    fontWeight: "500",
    fontStyle: "italic",
    marginTop: 12,
  },

  // --- THE MEMBERSHIP CARD ---
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#3E2723",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0D6D1",
    overflow: "hidden",
  },
  cardGoldStrip: { height: 4, width: "100%", backgroundColor: "#D4AF37" },
  cardPadding: { padding: 24 },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5D4037",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginRight: 12,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: "#E0E0E0" },
  formSection: { gap: 14 },

  // Ornamental Divider
  ornamentalDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: "#E0D6D1" },
  diamond: {
    width: 6,
    height: 6,
    backgroundColor: "#D4AF37",
    transform: [{ rotate: "45deg" }],
    marginHorizontal: 12,
  },

  // Inputs
  inputGroup: { gap: 5 },
  label: {
    fontSize: 9,
    fontWeight: "900",
    color: "#8D6E63",
    marginLeft: 4,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F6F0", // Inset feel
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0D6D1",
    paddingHorizontal: 12,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F6F0",
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0D6D1",
    paddingHorizontal: 12,
  },
  dropdownText: { flex: 1, fontSize: 14, color: "#3E2723", fontWeight: "600" },
  placeholderText: { color: "#A1887F" },
  iconWrapper: { marginRight: 12, opacity: 0.8 },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#3E2723",
    fontWeight: "600",
  },
  eyeButton: { padding: 8 },

  // Info Box
  infoBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
    gap: 10,
  },
  infoBoxJoin: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#C6F6D5",
  },
  infoTextJoin: { flex: 1, fontSize: 11, color: "#166534", fontWeight: "700" },
  infoBoxCreate: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FEEBC8",
  },
  infoTextCreate: {
    flex: 1,
    fontSize: 11,
    color: "#975A16",
    fontWeight: "700",
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(44, 24, 16, 0.7)",
  },
  backdrop: { flex: 1 },
  modalSheet: {
    backgroundColor: "#FAF7F2",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: height * 0.85,
    minHeight: height * 0.5,
  },
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E6DCCA",
    alignItems: "center",
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#D7CCC8",
    borderRadius: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#3E2723",
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    width: "100%",
    borderWidth: 1,
    borderColor: "#D7CCC8",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#3E2723",
    height: "100%",
    fontWeight: "600",
  },
  modalScroll: { padding: 24, paddingTop: 12 },

  // Options
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E6DCCA",
    shadowColor: "#8D6E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  optionSelected: { backgroundColor: "#FFF8E1", borderColor: "#D4AF37" },
  optionSpecial: { backgroundColor: "#F1F8E9", borderColor: "#AED581" },
  optionContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FAF7F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#E6DCCA",
  },
  optionLabel: { fontSize: 14, fontWeight: "700", color: "#5D4037" },
  optionSubLabel: {
    fontSize: 11,
    color: "#8D6E63",
    marginTop: 2,
    fontStyle: "italic",
  },
  emptyState: { alignItems: "center", paddingVertical: 30 },
  emptyText: {
    color: "#BCAAA4",
    fontSize: 14,
    marginTop: 10,
    fontStyle: "italic",
  },

  // Stitched Button
  leatherButtonContainer: {
    marginTop: 32,
    height: 56,
    borderRadius: 10,
    shadowColor: "#3E2723",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  leatherGradient: { flex: 1, borderRadius: 10, padding: 3 },
  stitchLine: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  submitButtonText: {
    color: "#F5F5F5",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 2,
  },

  // Footer
  footer: { marginTop: 24, alignItems: "center" },
  loginLinkContainer: { paddingVertical: 10 },
  footerText: { fontSize: 13, color: "#8D6E63", fontWeight: "500" },
  loginLink: {
    color: "#8B4513",
    fontWeight: "900",
    textDecorationLine: "underline",
    letterSpacing: 0.5,
  },
  copyright: {
    marginTop: 20,
    alignSelf: "center",
    fontSize: 10,
    color: "#A1887F",
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
  },

  // Alert
  alertWrapper: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 45,
    alignSelf: "center",
    zIndex: 9999,
  },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: width * 0.92,
  },
  alertIconWrapper: { marginRight: 14 },
  alertTextContainer: { flexShrink: 1 },
  alertTitle: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  alertMessage: { fontSize: 14, color: "#DDD", fontWeight: "500" },
});

export default SignupScreen;
