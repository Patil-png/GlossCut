import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Animated,
  Dimensions,
  Easing,
  Platform,
  ImageBackground
} from "react-native";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { ChevronLeft, Check, XCircle, Globe, Languages } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

// --- CONSTANTS ---
const ITEM_HEIGHT = 88;
const { width, height } = Dimensions.get('window');

// --- 1. OPTIMIZED TOAST COMPONENT ---
const CustomToast = React.memo(({ visible, message, type, onHide, theme }) => {
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: Platform.OS === "ios" ? 60 : 50,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (onHide && visible) onHide();
    });
  };

  if (!visible && translateY._value === -150) return null;

  const isError = type === "error";
  // Premium Gradient Colors
  const gradientColors = isError 
    ? ['#FF416C', '#FF4B2B'] 
    : ['#00b09b', '#96c93d'];

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toastGradient}
      >
        <View style={styles.toastIconBox}>
          {isError ? <XCircle size={20} color="#FFF" /> : <Check size={20} color="#FFF" />}
        </View>
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastTitle}>
            {isError ? "Action Failed" : "Success"}
          </Text>
          <Text style={styles.toastMessage}>{message}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

// --- 2. HEAVILY OPTIMIZED LIST ITEM (Premium Card Style) ---
const LanguageOptionItem = React.memo(
  ({ item, isSelected, theme, onPress, index }) => {
    // Animation Refs
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const pressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 50, 
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }).start();
    }, []);

    const handlePressIn = () => {
      Animated.spring(pressAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(pressAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();
    };

    // Style Memos
    const cardBgColor = theme.isDark ? '#1e293b' : '#ffffff';
    const borderColor = isSelected ? theme.colors.primary : 'transparent';
    
    return (
      <Animated.View
        style={{
          transform: [
            { scale: pressAnim },
            {
              translateY: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
          opacity: scaleAnim,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={[
            styles.optionItem,
            {
              backgroundColor: cardBgColor,
              borderColor: borderColor,
              borderWidth: isSelected ? 1.5 : 0,
              // Dynamic Shadow for premium feel
              shadowColor: isSelected ? theme.colors.primary : "#000",
              shadowOpacity: isSelected ? 0.2 : 0.05,
              shadowRadius: isSelected ? 12 : 6,
              elevation: isSelected ? 8 : 2,
            },
          ]}
        >
          <View style={styles.optionContent}>
            {/* Avatar with Gradient */}
            <LinearGradient
               colors={isSelected ? [theme.colors.primary, '#6dd5ed'] : [theme.isDark ? '#333' : '#f0f2f5', theme.isDark ? '#333' : '#f0f2f5']}
               style={styles.langAvatar}
            >
              <Text style={[
                  styles.langAvatarText,
                  { color: isSelected ? "#FFF" : theme.colors.textSecondary },
                ]}
              >
                {item.charAt(0)}
              </Text>
            </LinearGradient>
            
            <View>
              <Text style={[
                  styles.optionText,
                  { color: theme.colors.text, fontWeight: isSelected ? "700" : "600" },
                ]}
              >
                {item}
              </Text>
              {isSelected && (
                 <Text style={[styles.subText, {color: theme.colors.primary}]}>Active</Text>
              )}
            </View>
          </View>

          {isSelected ? (
            <View style={[styles.checkCircle, { backgroundColor: theme.colors.primary }]}>
              <Check size={14} color="#FFF" strokeWidth={3} />
            </View>
          ) : (
            <View style={[styles.radioCircle, { borderColor: theme.colors.border }]} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.theme.isDark === nextProps.theme.isDark &&
      prevProps.item === nextProps.item
    );
  }
);

// --- 3. MAIN SCREEN ---
const LanguageSelectionScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user, updateProfile } = useAuth();

  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  // Animation Refs
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const globeFloat = useRef(new Animated.Value(0)).current;
  const pulseButton = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (user?.language) {
      setSelectedLanguage(user.language);
    }
    
    // Header Entrance
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic)
    }).start();

    // Floating Globe Animation (Macro Interaction)
    Animated.loop(
      Animated.sequence([
        Animated.timing(globeFloat, { toValue: -10, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(globeFloat, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    // Button Pulse (Breathing effect)
    Animated.loop(
        Animated.sequence([
            Animated.timing(pulseButton, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulseButton, { toValue: 1, duration: 1500, useNativeDriver: true })
        ])
    ).start();

  }, [user]);

  // Handlers (Unchanged Functionality)
  const handleSelectLanguage = useCallback((lang) => {
    setSelectedLanguage(lang);
  }, []);

  const hideToastCallback = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback((message, type = "success") => {
    setToast({ visible: true, message, type });
  }, []);

  const handleUpdateLanguage = async () => {
    if (!selectedLanguage) {
      showToast("Please select a language first.", "error");
      return;
    }
    if (user?.language === selectedLanguage) {
      showToast("You already selected this language.", "success");
      return;
    }

    setIsLoading(true);

    try {
      const success = await updateProfile({ language: selectedLanguage });
      if (success) {
        showToast(`Language changed to ${selectedLanguage}`, "success");
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Language Update Error:", error);
      showToast("Connection failed. Please check internet.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Static Data
  const languageOptions = useMemo(
    () => ["English", "Spanish", "French", "German", "Hindi", "Marathi", "Tamil", "Telugu"],
    []
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <LanguageOptionItem
        item={item}
        index={index}
        isSelected={selectedLanguage === item}
        theme={theme}
        onPress={() => handleSelectLanguage(item)}
      />
    ),
    [selectedLanguage, theme, handleSelectLanguage]
  );

  const keyExtractor = useCallback((item) => item, []);
  const getItemLayout = useCallback(
    (data, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }),
    []
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />

      {/* --- Ambient Background Blobs (Premium Touch) --- */}
      <View style={[styles.blob, { backgroundColor: theme.colors.primary, opacity: 0.08, top: -50, right: -100 }]} />
      <View style={[styles.blob, { backgroundColor: '#6dd5ed', opacity: 0.05, bottom: 100, left: -50 }]} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.iconButton,
            { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f4f4f5" },
          ]}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View style={{ opacity: headerOpacity, marginBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{flex: 1}}>
                <View style={styles.badgeContainer}>
                    <Languages size={12} color={theme.colors.primary} />
                    <Text style={[styles.superTitle, { color: theme.colors.primary }]}>LOCALIZATION</Text>
                </View>
                <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
                    Choose Language
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    Select your preferred language for a personalized booking experience.
                </Text>
            </View>
            
            {/* 3D Floating Visual Anchor */}
            <Animated.View style={{ transform: [{ translateY: globeFloat }] }}>
                <LinearGradient
                    colors={isDark ? ['#2c3e50', '#000000'] : ['#e0f7fa', '#ffffff']}
                    style={styles.globeContainer}
                >
                    <Globe size={40} color={theme.colors.primary} strokeWidth={1.5} />
                </LinearGradient>
            </Animated.View>
        </Animated.View>

        <FlatList
          data={languageOptions}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 4 }} // Padding for shadow
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* --- Premium Floating Footer --- */}
      <View style={styles.footerContainer}>
        {/* Blur effect simulation via transparency */}
        <Animated.View style={{transform: [{scale: pulseButton}], width: '100%' }}>
            <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleUpdateLanguage}
            disabled={isLoading}
            activeOpacity={0.9}
            >
            <LinearGradient
                colors={isDark ? [theme.colors.primary, "#4a69bd"] : [theme.colors.primary, "#6dd5ed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
            >
                {isLoading ? (
                <Text style={styles.buttonText}>Updating Profile...</Text>
                ) : (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={styles.buttonText}>Confirm Selection</Text>
                    <Check size={18} color="#fff" style={{marginLeft: 8, opacity: 0.8}} />
                </View>
                )}
            </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
      </View>

      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToastCallback}
        theme={theme}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Ambient Blobs
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: -1,
    transform: [{ scale: 1.2 }],
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 10,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  superTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginLeft: 6,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: "95%",
    opacity: 0.7,
  },
  globeContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginLeft: 10,
  },
  list: {
    marginTop: 20,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 24, // Smoother corners
    marginBottom: 14,
    height: ITEM_HEIGHT - 12,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  langAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  langAvatarText: {
    fontSize: 20,
    fontWeight: "700",
  },
  optionText: {
    fontSize: 17,
    letterSpacing: 0.3,
  },
  subText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    paddingTop: 20,
    // Glassmorphism footer
    backgroundColor: 'rgba(255,255,255,0.0)', 
  },
  buttonWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  gradientButton: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  // Toast Styles
  toastContainer: {
    position: "absolute",
    top: 0,
    alignSelf: 'center',
    width: '90%',
    zIndex: 9999,
  },
  toastGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  toastIconBox: {
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: '#fff',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
});

export default LanguageSelectionScreen;