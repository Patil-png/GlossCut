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
import axios from "axios";
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
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// ============================================================================
// 1. PREMIUM DROPDOWN WITH SEARCH (The "Insane" Upgrade)
// ============================================================================

const PremiumDropdown = ({
  label,
  icon: Icon,
  value,
  options,
  onSelect,
  placeholder = "Select an option",
  isLoading = false,
  searchable = false, // New Prop to enable search
}) => {
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Animation State
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Filter Logic
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchText) return options;

    // Separate special items (Create New) so they always stay at bottom
    const specialItems = options.filter((opt) => opt.special);
    const normalItems = options.filter((opt) => !opt.special);

    // Filter normal items
    const filtered = normalItems.filter(
      (item) =>
        item.label.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.subLabel &&
          item.subLabel.toLowerCase().includes(searchText.toLowerCase()))
    );

    // Return filtered items + special items always visible
    return [...filtered, ...specialItems];
  }, [options, searchText, searchable]);

  const openModal = () => {
    setSearchText(""); // Reset search on open
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        bounciness: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
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
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : (
            <Icon size={20} color="#6b7280" />
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
        <ChevronDown size={20} color="#6b7280" />
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
            {/* Header & Search */}
            <View style={styles.modalHeader}>
              <View style={styles.dragIndicator} />

              {!searchable ? (
                <Text style={styles.modalTitle}>{label}</Text>
              ) : (
                <View style={styles.searchContainer}>
                  <Search
                    size={18}
                    color="#9ca3af"
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={`Search ${label}...`}
                    placeholderTextColor="#9ca3af"
                    value={searchText}
                    onChangeText={setSearchText}
                    autoFocus={false} // Prevent keyboard jumping immediately
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText("")}>
                      <X size={18} color="#6b7280" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value.toString()}
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Store size={40} color="#e5e7eb" />
                  <Text style={styles.emptyText}>No shops found</Text>
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
                            backgroundColor: "#4f46e5",
                            borderColor: "#4f46e5",
                          },
                          isSpecial && {
                            backgroundColor: "#ecfdf5",
                            borderColor: "#a7f3d0",
                          },
                        ]}
                      >
                        {item.icon ? (
                          <item.icon
                            size={20}
                            color={
                              isSelected
                                ? "#fff"
                                : isSpecial
                                ? "#059669"
                                : "#6b7280"
                            }
                          />
                        ) : (
                          <Grid
                            size={20}
                            color={isSelected ? "#fff" : "#6b7280"}
                          />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && {
                              color: "#4f46e5",
                              fontWeight: "700",
                            },
                            isSpecial && {
                              color: "#059669",
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
                    {isSelected && <CheckCircle size={20} color="#4f46e5" />}
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
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        damping: 12,
        stiffness: 90,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => handleClose(), 3000);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: -150,
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
          bg: "#FEF2F2",
          border: "#FECACA",
          iconColor: "#DC2626",
          Icon: XCircle,
        };
      case "success":
        return {
          bg: "#F0FDF4",
          border: "#86EFAC",
          iconColor: "#16A34A",
          Icon: CheckCircle,
        };
      case "warning":
        return {
          bg: "#FFFBEB",
          border: "#FDE68A",
          iconColor: "#D97706",
          Icon: AlertTriangle,
        };
      default:
        return {
          bg: "#FFFFFF",
          border: "#E5E7EB",
          iconColor: "#4B5563",
          Icon: Info,
        };
    }
  }, [type]);

  if (!visible && translateY._value === -150) return null;

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
          <config.Icon size={24} color={config.iconColor} />
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
    <View style={styles.blob1} />
    <View style={styles.blob2} />
    <View style={styles.blob3} />
  </View>
));

const HeaderSection = React.memo(() => (
  <View style={styles.header}>
    <View style={styles.logoContainer}>
      <Image
        source={require("../assets/SetKarr.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.title}>Create Account</Text>
    <Text style={styles.subtitle}>
      Join the network of professional stylists.
    </Text>
  </View>
));

const SectionHeader = React.memo(({ icon: Icon, title, color }) => (
  <View style={styles.sectionHeader}>
    <Icon size={18} color={color} />
    <Text style={styles.sectionTitle}>{title}</Text>
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
          <Icon size={20} color="#6b7280" />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
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
              <EyeOff size={20} color="#6b7280" />
            ) : (
              <Eye size={20} color="#6b7280" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
);

const FooterSection = React.memo(({ onLoginPress }) => (
  <View style={styles.footer}>
    <TouchableOpacity onPress={onLoginPress} style={styles.loginLinkContainer}>
      <Text style={styles.footerText}>
        Already have an account? <Text style={styles.loginLink}>Login</Text>
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
  const [category, setCategory] = useState("Barber");
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
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 90,
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
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/api/shop/all`
        );
        setExistingShops(response.data || []);
      } catch (error) {
        console.log("Error fetching shops:", error);
        showAlert(
          "Network Issue",
          "Could not load shops. Check internet.",
          "warning"
        );
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
        setCategory("Barber");
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
    [existingShops]
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
      label: "Create New Shop",
      subLabel: "Register your own business",
      value: "new",
      icon: PlusCircle,
      special: true,
    });
    return list;
  }, [existingShops]);

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
        "warning"
      );
      return;
    }
    if (isNewShop && (!shopName || !shopAddress || !shopPhone)) {
      showAlert(
        "Shop Details Missing",
        "Please fill in all shop details.",
        "warning"
      );
      return;
    }
    if (!selectedShopId) {
      showAlert(
        "Selection Required",
        "Please select a shop or create a new one.",
        "warning"
      );
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`, {
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

      showAlert("Success!", "Account created successfully.", "success");
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
      colors={["#fff", "#f0f4f8", "#dbeafe"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="dark-content" />
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

            <View style={styles.formContainer}>
              {/* SHOP SECTION */}
              <View style={styles.sectionContainer}>
                <SectionHeader
                  icon={Briefcase}
                  title="Workplace Details"
                  color="#4f46e5"
                />

                {/* --- PREMIUM SEARCHABLE DROPDOWN --- */}
                <PremiumDropdown
                  label="Select or Create Shop"
                  icon={Briefcase}
                  value={selectedShopId}
                  options={shopOptions}
                  onSelect={handleShopSelection}
                  isLoading={loadingShops}
                  placeholder="Choose workplace..."
                  searchable={true} // Enable Search
                />

                {selectedShopId && !isNewShop && (
                  <View style={[styles.infoBox, styles.infoBoxJoin]}>
                    <Info size={16} color="#059669" />
                    <Text style={styles.infoTextJoin}>
                      Joining an existing shop. Details are read-only.
                    </Text>
                  </View>
                )}
                {isNewShop && (
                  <View style={[styles.infoBox, styles.infoBoxCreate]}>
                    <CheckCircle size={16} color="#4f46e5" />
                    <Text style={styles.infoTextCreate}>
                      Creating a new shop. You will be the Owner.
                    </Text>
                  </View>
                )}

                <InputItem
                  icon={Store}
                  placeholder="Shop Name"
                  value={shopName}
                  onChangeText={setShopName}
                  onFocus={handleInputFocus}
                />
                <InputItem
                  icon={MapPin}
                  placeholder="Shop Address"
                  value={shopAddress}
                  onChangeText={setShopAddress}
                  onFocus={handleInputFocus}
                />
                <InputItem
                  icon={Phone}
                  placeholder="Shop Phone"
                  value={shopPhone}
                  onChangeText={setShopPhone}
                  keyboardType="phone-pad"
                  onFocus={handleInputFocus}
                />

                {/* --- PREMIUM DROPDOWN: CATEGORY (No Search needed here) --- */}
                <PremiumDropdown
                  label="Category"
                  icon={Grid}
                  value={category}
                  options={categoryOptions}
                  onSelect={setCategory}
                  placeholder="Select category..."
                />
              </View>

              {/* PERSONAL SECTION */}
              <View style={styles.sectionContainer}>
                <SectionHeader
                  icon={User}
                  title="Personal Details"
                  color="#4f46e5"
                />
                <InputItem
                  icon={User}
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  onFocus={handleInputFocus}
                />
                <InputItem
                  icon={Phone}
                  placeholder="Personal Phone"
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
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  isSecure={!isPasswordVisible}
                  toggleSecure={() => setIsPasswordVisible(!isPasswordVisible)}
                  onFocus={handleInputFocus}
                />
              </View>

              <LinearGradient
                colors={["#4f46e5", "#7c3aed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButton}
              >
                <TouchableOpacity
                  style={styles.touchableButton}
                  onPress={handleSignup}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        Create Account
                      </Text>
                      <ArrowRight size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>

            <FooterSection onLoginPress={() => navigation.navigate("Login")} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// ============================================================================
// 5. STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 50 },
  mainContent: { paddingHorizontal: 20, paddingTop: 60 },

  // Background
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blob1: {
    position: "absolute",
    top: -height * 0.2,
    right: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
  },
  blob2: {
    position: "absolute",
    bottom: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  blob3: {
    position: "absolute",
    top: height * 0.4,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },

  // Header
  header: { alignItems: "center", marginBottom: 30 },
  logoContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 10,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 20,
  },
  logo: { width: 80, height: 60 },
  title: { fontSize: 28, fontWeight: "800", color: "#1f2937", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#6b7280", textAlign: "center" },

  // Sections
  formContainer: { gap: 24 },
  sectionContainer: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Inputs
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 6,
    marginLeft: 4,
  },

  // Shared Input Container
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },

  dropdownText: { flex: 1, fontSize: 16, color: "#111827" },
  placeholderText: { color: "#9ca3af" },
  iconWrapper: { marginRight: 12 },
  input: { flex: 1, height: "100%", fontSize: 16, color: "#111827" },
  eyeButton: { padding: 8 },

  // --- MODAL STYLES (UPDATED FOR SEARCH) ---
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
    maxHeight: height * 0.85,
    minHeight: height * 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 25,
  },

  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "center",
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937" },

  // Search Styling inside Modal
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    width: "100%",
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1f2937", height: "100%" },

  modalScroll: { padding: 24, paddingTop: 12 },

  // Option Items
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    marginBottom: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionSelected: { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" },
  optionSpecial: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  optionContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  optionLabel: { fontSize: 16, fontWeight: "600", color: "#374151" },
  optionSubLabel: { fontSize: 13, color: "#6b7280", marginTop: 2 },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyText: { color: "#9ca3af", fontSize: 14, marginTop: 10 },

  // Info Box
  infoBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "flex-start",
    gap: 10,
  },
  infoBoxJoin: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  infoTextJoin: { flex: 1, fontSize: 13, color: "#065f46", lineHeight: 18 },
  infoBoxCreate: {
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  infoTextCreate: { flex: 1, fontSize: 13, color: "#4338ca", lineHeight: 18 },

  // Button
  submitButton: {
    height: 60,
    borderRadius: 18,
    marginTop: 10,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  touchableButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Footer
  footer: { marginTop: 40, alignItems: "center" },
  loginLinkContainer: { paddingVertical: 10 },
  footerText: { fontSize: 15, color: "#6b7280" },
  loginLink: { color: "#4f46e5", fontWeight: "700" },

  // Alert
  alertWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 45,
    paddingHorizontal: 20,
  },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  alertIconWrapper: { marginRight: 12 },
  alertTextContainer: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  alertMessage: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    lineHeight: 18,
  },
});

export default SignupScreen;
