import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  Image,
  Platform,
  Easing,
  ImageBackground,
  Alert,
  TextInput
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../utils/api";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Cap the scale factor to prevent elements from becoming massive on tablets
const scale = Math.min(SCREEN_WIDTH / 375, 1.25);

const normalize = (size) => {
  const newSize = size * scale;
  return Platform.OS === 'ios' ? Math.round(newSize) : Math.round(newSize) - 1;
};

// --- OPTIMIZED SUB-COMPONENTS ---
const CustomToast = memo(({ visible, message, type, animatedValue }) => {
  if (!visible) return null;
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });
  const isSuccess = type === "success";
  const iconColor = isSuccess ? "#10B981" : "#EF4444";
  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]} accessibilityLiveRegion="polite">
      <View style={[styles.toastContent, { borderLeftColor: iconColor }]}>
        {isSuccess ? <CheckCircle2 size={20} color={iconColor} /> : <AlertCircle size={20} color={iconColor} />}
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastMessage}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

const PersonalInfoScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, logout, fetchUser } = useAuth();
  const insets = useSafeAreaInsets();
  const primaryColor = theme?.colors?.primary || "#000000";

  const [image, setImage] = useState(user?.profilePicture || null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Animation Refs
  const toastAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef([...Array(8)].map(() => new Animated.Value(30))).current;
  const itemFades = useRef([...Array(8)].map(() => new Animated.Value(0))).current;
  const timerRef = useRef(null);

  useEffect(() => {
    const animations = itemAnims.map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(itemFades[i], { toValue: 1, duration: 500, useNativeDriver: true })
      ])
    );
    Animated.stagger(100, animations).start();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const showToast = useCallback((message, type = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, message, type });
    if (type === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToast(p => ({ ...p, visible: false })));
    }, 3000);
  }, [toastAnim]);

  const pickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast("Gallery permission is required.", "error");
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setIsSyncing(true);
        const selectedImage = result.assets[0];
        const formData = new FormData();
        formData.append('profilePicture', {
          uri: selectedImage.uri,
          type: 'image/jpeg',
          name: 'profile-picture.jpg'
        });

        const uploadResponse = await api.post('/api/auth/upload-picture', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const { imageUrl } = uploadResponse.data;
        await api.put('/api/auth/user', { profilePicture: imageUrl });

        setImage(imageUrl);
        await fetchUser(); // Refresh user data from server
        showToast("Profile picture updated!", "success");
      }
    } catch (error) {
      showToast("Upload failed. Try again.", "error");
    } finally {
      setIsSyncing(false);
    }
  }, [fetchUser, showToast]);

  const handleTerminateAccount = useCallback(() => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      showToast("Please type DELETE to confirm.", "error");
      return;
    }

    Alert.alert(
      "Are you absolutely sure?",
      "This will remove your personal data and you won't be able to log in until you create a new account.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Terminate", style: "destructive", onPress: processTermination }
      ]
    );
  }, [isConfirmingDelete, confirmText, processTermination, showToast]);

  const processTermination = useCallback(async () => {
    try {
      setIsSyncing(true);
      await api.post('/api/auth/terminate-account');
      await logout(); // Use the proper logout function to clear everything
      showToast("Account terminated successfully.", "success");
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || "Failed to terminate account.";
      showToast(errorMsg, "error");
    } finally {
      setIsSyncing(false);
    }
  }, [navigation, showToast]);

  const animatedStyle = (index) => ({
    opacity: itemFades[index],
    transform: [{ translateY: itemAnims[index] }]
  });

  const renderIdentityTile = (Icon, label, value, onPress, isLast) => (
    <>
      <TouchableOpacity style={styles.usageItem} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.iconCircle}>
          <Icon size={normalize(16)} color={primaryColor} />
        </View>
        <View style={styles.usageTextContent}>
          <Text style={styles.usageTitle}>{label}</Text>
          <Text style={styles.usageDesc} numberOfLines={1}>{value || "Not Set"}</Text>
        </View>
        <ChevronRight size={normalize(20)} color="#CBD5E1" strokeWidth={2.5} />
      </TouchableOpacity>
      {!isLast && <View style={styles.divider} />}
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <View style={[styles.toastWrapper, { top: insets.top + 10 }]}>
        <CustomToast visible={toast.visible} message={toast.message} type={toast.type} animatedValue={toastAnim} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} bounces={false}>
        <View style={styles.centeredContentWrapper}>
          {/* 1. Cover Image Section */}
          <ImageBackground source={require("../assets/profile_cover_cartoon.png")} style={styles.coverImage} resizeMode="cover">
            <View style={[styles.headerActions, { paddingTop: Math.max(insets.top, 16) }]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ChevronLeft size={normalize(22)} color="#1E293B" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </ImageBackground>

          {/* 2. Main Profile Section */}
          <View style={styles.mainProfileCard}>
            <Animated.View style={[styles.avatarCenterWrapper, animatedStyle(0)]}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                <Image source={image ? { uri: image } : require("../assets/GlossCut.png")} style={styles.avatar} />
                <View style={styles.avatarOverlay}>
                  <Camera size={20} color="#FFF" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.profileTextInfo, animatedStyle(1)]}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user?.name || "Glosscut User"}</Text>
                <CheckCircle2 size={normalize(20)} color="#3b82f6" fill="#3b82f630" />
              </View>
              <Text style={styles.userBio}>Premium verified identity within the GLOSSCUT ecosystem.</Text>
            </Animated.View>

            {/* 3. Stats Row */}
            <Animated.View style={[styles.statsContainer, animatedStyle(2)]}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{user?.createdAt ? new Date(user.createdAt).getFullYear() : "2024"}</Text>
                <Text style={styles.statLabel}>Member Since</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{user?.setkarCoins || 0}</Text>
                <Text style={styles.statLabel}>GlossCut Coins</Text>
              </View>
            </Animated.View>

            {/* 4. Settings Items (Unified Container) */}
            <Animated.View style={[styles.usageContainer, animatedStyle(3)]}>
              {renderIdentityTile(User, "Display Name", user?.name, () => navigation.navigate("EditName"), false)}
              {renderIdentityTile(Mail, "Email Address", user?.email, () => navigation.navigate("EditEmail"), false)}
              {renderIdentityTile(Phone, "Phone Number", user?.phone, () => navigation.navigate("EditPhoneNumber"), true)}
            </Animated.View>

            {/* 6. Terminate Account Button */}
            <Animated.View style={[styles.terminateSection, animatedStyle(5)]}>
              {isConfirmingDelete ? (
                <View style={styles.confirmDeleteWrapper}>
                  <Text style={styles.confirmDeleteLabel}>Type 'DELETE' to confirm:</Text>
                  <TextInput
                    style={styles.confirmDeleteInput}
                    value={confirmText}
                    onChangeText={setConfirmText}
                    placeholder="DELETE"
                    placeholderTextColor="#A0AEC0"
                    autoCapitalize="characters"
                  />
                  <View style={styles.confirmDeleteActions}>
                    <TouchableOpacity 
                      style={[
                        confirmText.trim().toUpperCase() === "DELETE" ? styles.confirmBtnActive : styles.confirmBtnInactive
                      ]}
                      onPress={handleTerminateAccount}
                      disabled={confirmText.trim().toUpperCase() !== "DELETE"}
                    >
                      <Text style={confirmText.trim().toUpperCase() === "DELETE" ? styles.confirmBtnTextActive : styles.confirmBtnTextInactive}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.cancelDeleteBtn}
                      onPress={() => { setIsConfirmingDelete(false); setConfirmText(""); }}
                    >
                      <Text style={styles.cancelDeleteBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.terminateBtn}
                  onPress={handleTerminateAccount}
                  activeOpacity={0.7}
                >
                  <Text style={styles.terminateBtnText}>Delete Account & Data</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.terminateNote}>
                This will remove your personal data from the active database but keep your booking history and reviews intact.
              </Text>
            </Animated.View>

          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { backgroundColor: "#FFFFFF" },
  centeredContentWrapper: {
    maxWidth: 500,
    width: "100%",
    alignSelf: "center"
  },
  coverImage: {
    width: "100%",
    height: normalize(240),
    justifyContent: "flex-start"
  },
  headerActions: {
    flexDirection: "row",
    paddingHorizontal: normalize(16)
  },
  backBtn: {
    padding: normalize(8),
    borderRadius: normalize(12),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    alignSelf: "flex-start"
  },
  mainProfileCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: normalize(-30),
    borderTopLeftRadius: normalize(32),
    borderTopRightRadius: normalize(32),
    paddingHorizontal: normalize(24),
    paddingTop: 0,
    zIndex: 1,
    elevation: 1,
    overflow: "visible"
  },
  avatarCenterWrapper: {
    alignItems: "center",
    marginTop: normalize(-50),
    marginBottom: normalize(16),
    zIndex: 10,
    elevation: 10,
    overflow: "visible"
  },
  avatarContainer: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(50),
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8
  },
  avatar: { width: "100%", height: "100%" },
  avatarOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center"
  },
  profileTextInfo: {
    alignItems: "center",
    marginBottom: normalize(24)
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
    marginBottom: normalize(4)
  },
  userName: {
    fontSize: normalize(22),
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5
  },
  userHandle: {
    fontSize: normalize(14),
    color: "#64748B",
    fontWeight: "600",
    marginBottom: normalize(8)
  },
  userBio: {
    fontSize: normalize(13),
    color: "#64748B",
    textAlign: "center",
    lineHeight: normalize(20),
    fontWeight: "500",
    paddingHorizontal: normalize(20)
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: normalize(16),
    paddingVertical: normalize(16),
    marginBottom: normalize(30),
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  statBox: {
    flex: 1,
    alignItems: "center"
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E2E8F0"
  },
  statValue: {
    fontSize: normalize(18),
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: normalize(4)
  },
  statLabel: {
    fontSize: normalize(11),
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  usageContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: normalize(20),
    padding: normalize(20),
    marginBottom: normalize(30),
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  usageItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(14)
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: normalize(16)
  },
  iconCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  usageTextContent: { flex: 1 },
  usageTitle: {
    fontSize: normalize(14),
    color: "#0F172A",
    fontWeight: "800",
    marginBottom: normalize(4)
  },
  usageDesc: {
    fontSize: normalize(12),
    color: "#64748B",
    fontWeight: "600"
  },
  noteContainer: {
    width: "100%",
    padding: normalize(18),
    backgroundColor: "#F0FDF4",
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: "#DCFCE7",
    marginBottom: normalize(20)
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    marginBottom: normalize(8)
  },
  noteTitle: {
    fontSize: normalize(11),
    fontWeight: "900",
    color: "#166534",
    letterSpacing: 1
  },
  noteText: {
    fontSize: normalize(11),
    color: "#166534",
    lineHeight: normalize(18),
    fontWeight: "500"
  },
  terminateSection: {
    width: "100%",
    alignItems: "center",
    marginTop: normalize(10),
    marginBottom: normalize(20)
  },
  terminateBtn: {
    width: "100%",
    height: normalize(52),
    borderRadius: normalize(12),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1
  },
  terminateBtnText: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#EF4444",
    letterSpacing: -0.2
  },
  terminateNote: {
    fontSize: normalize(11),
    color: "#64748B",
    textAlign: "center",
    marginTop: normalize(12),
    paddingHorizontal: normalize(20),
    fontWeight: "500",
    lineHeight: normalize(16)
  },
  confirmDeleteWrapper: {
    width: "100%",
    backgroundColor: "#FEF2F2",
    borderRadius: normalize(16),
    padding: normalize(20),
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginBottom: normalize(10)
  },
  confirmDeleteLabel: {
    fontSize: normalize(13),
    fontWeight: "800",
    color: "#991B1B",
    marginBottom: normalize(10)
  },
  confirmDeleteInput: {
    height: normalize(46),
    backgroundColor: "#FFFFFF",
    borderRadius: normalize(10),
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    paddingHorizontal: normalize(14),
    fontSize: normalize(15),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: normalize(14)
  },
  confirmDeleteActions: {
    flexDirection: "row",
    gap: normalize(10)
  },
  confirmBtnActive: {
    flex: 1,
    height: normalize(48),
    borderRadius: normalize(10),
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#EF4444",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  confirmBtnInactive: {
    flex: 1,
    height: normalize(48),
    borderRadius: normalize(10),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  confirmBtnTextActive: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#FFFFFF"
  },
  confirmBtnTextInactive: {
    fontSize: normalize(14),
    fontWeight: "700",
    color: "#9CA3AF"
  },
  cancelDeleteBtn: {
    flex: 1,
    height: normalize(48),
    borderRadius: normalize(10),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D1D5DB"
  },
  cancelDeleteBtnText: {
    fontSize: normalize(14),
    fontWeight: "700",
    color: "#4B5563"
  },
  toastWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2000,
    alignItems: "center"
  },
  toastContainer: {
    width: '90%',
    maxWidth: 450,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  toastContent: {
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  toastTextContainer: { flex: 1 },
  toastMessage: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600"
  }
});

export default memo(PersonalInfoScreen);
