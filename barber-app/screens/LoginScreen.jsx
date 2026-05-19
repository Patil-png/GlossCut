import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ScrollView,
    Image,
    StatusBar,
    Platform,
    Keyboard,
    Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    runOnJS,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import {
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    AlertCircle,
    CheckCircle,
    Info,
    AlertTriangle,
    XCircle,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

// --- OPTIMIZED SUB-COMPONENTS (Memoized) ---

// 1. Background Decoration (Matching SignupScreen Warmer Tone)
const BackgroundDecorations = React.memo(() => (
    <View style={styles.backgroundDecoration}>
        {/* Deeper, warmer glows */}
        <View style={styles.glowTopRight} />
        <View style={styles.glowBottomLeft} />
    </View>
));

// 2. Header Component
const LoginHeader = React.memo(({ animatedIconStyle }) => (
    <View style={styles.header}>
        <Animated.View style={animatedIconStyle}>
            <View style={styles.logoContainer}>
                <Image
                    source={require("../assets/LoginLogo.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
            </View>
        </Animated.View>
        <View style={styles.headerTextStack}>
            <Text style={styles.preTitle}>WELCOME BACK</Text>
            <Text style={styles.title}>GLOSSCUT PARTNER</Text>
            <View style={styles.titleUnderline} />
        </View>
        <Text style={styles.subtitle}>
            Manage your shop, bookings, and earnings with ease.
        </Text>
    </View>
));

// 3. Footer Component
const LoginFooter = React.memo(({ onSignupPress }) => (
    <View style={styles.footer}>
        <TouchableOpacity onPress={onSignupPress} style={styles.loginLinkContainer}>
            <Text style={styles.footerText}>
                Don't have an account? <Text style={styles.signUpText}>APPLY NOW</Text>
            </Text>
        </TouchableOpacity>
    </View>
));

// 4. Modern Alert (Memoized - Matching SignupScreen Style)
const ModernAlert = React.memo(({ visible, title, message, type, onHide }) => {
    const translateY = useSharedValue(-150);

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0, { damping: 12, stiffness: 90 });
            const timer = setTimeout(() => {
                handleClose();
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            handleClose();
        }
    }, [visible]);

    const handleClose = () => {
        translateY.value = withTiming(-150, { duration: 300 }, (finished) => {
            if (finished && onHide) {
                runOnJS(onHide)();
            }
        });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const getAlertStyle = () => {
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
    };

    const { bg, border, iconColor, Icon } = getAlertStyle();

    if (!visible && translateY.value === -150) return null;

    return (
        <Animated.View style={[styles.alertWrapper, animatedStyle]}>
            <View
                style={[
                    styles.alertContainer,
                    { backgroundColor: bg, borderColor: border },
                ]}
            >
                <View style={styles.alertIconWrapper}>
                    <Icon size={22} color={iconColor} strokeWidth={2} />
                </View>
                <View style={styles.alertTextContainer}>
                    <Text style={[styles.alertTitle, { color: iconColor }]}>{title}</Text>
                    <Text style={styles.alertMessage} numberOfLines={2}>{message}</Text>
                </View>
            </View>
        </Animated.View>
    );
});

// --- MAIN LOGIN SCREEN ---
const LoginScreen = () => {
    const { theme } = useTheme();
    // Changed: 'login' to 'barberLogin'
    const { barberLogin, googleLogin, oauthError, setOauthError, oauthLoginOnly, setOauthLoginOnly } = useAuth();
    const navigation = useNavigation();
    // Modal visibility derived from oauthError
    const oauthModalVisible = oauthError === 'signup_not_allowed' || oauthError === 'role_not_allowed';

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [alert, setAlert] = useState({
        visible: false,
        title: "",
        message: "",
        type: "info",
    });

    // Animation values
    const cardOpacity = useSharedValue(0);
    const cardTranslateY = useSharedValue(50);
    const iconScale = useSharedValue(0.8);

    useEffect(() => {
        cardOpacity.value = withTiming(1, { duration: 600 });
        cardTranslateY.value = withTiming(0, { duration: 600 });
        iconScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }, []);

    // Debug: log oauthError presence removed for production
    // useEffect(() => {
    //     try { console.log('LoginScreen (barber) oauthError changed:', oauthError); } catch (e) { }
    // }, [oauthError]);

    const animatedCardStyle = useAnimatedStyle(() => ({
        opacity: cardOpacity.value,
        transform: [{ translateY: cardTranslateY.value }],
    }));

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    // Stable Handlers
    const showAlert = useCallback((title, message, type) => {
        setAlert({ visible: true, title, message, type });
    }, []);

    const hideAlert = useCallback(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
    }, []);

    const togglePasswordVisibility = useCallback(() => {
        setIsPasswordVisible((prev) => !prev);
    }, []);

    const handleSignupNavigation = useCallback(() => {
        navigation.navigate("Signup");
    }, [navigation]);

    const handleForgotPassword = useCallback(() => {
        navigation.navigate("ForgotPassword");
    }, [navigation]);

    const handleEmailChange = useCallback((text) => {
        setEmail(text);
        // Clear alert if user starts typing again
        setAlert((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }, []);

    const handlePasswordChange = useCallback((text) => {
        setPassword(text);
        setAlert((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }, []);

    // Validation
    const validateInputs = () => {
        if (!email.trim() || !password.trim()) {
            showAlert(
                "Missing Fields",
                "Please fill in both email and password.",
                "warning"
            );
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert(
                "Invalid Email",
                "Please enter a valid email address.",
                "warning"
            );
            return false;
        }
        return true;
    };

    // Google OAuth Handler
    const handleGoogleLogin = useCallback(async () => {
        try {
            // REQUIRE 'barber' role
            const result = await googleLogin({ loginOnly: true, requiredRole: 'barber' });
            if (result.success) {
                showAlert("Success", "Opening Google authentication in browser. Complete the login and return to the app.", "success");
            } else {
                showAlert("Error", result.message || "Failed to initiate Google login", "error");
            }
        } catch (error) {
            showAlert("Error", "Failed to initiate Google login", "error");
        }
    }, [googleLogin, showAlert]);

    // --- SAFE LOGIN HANDLER ---
    const handleLogin = async () => {
        // Basic validation
        if (!validateInputs()) return;

        Keyboard.dismiss(); // Close keyboard for better UI
        setIsLoading(true);

        try {
            // Changed: Use barberLogin
            const success = await barberLogin(email, password);

            if (success) {
                // Clear any OAuth error state when user signs in normally
                try { setOauthError && setOauthError(null); } catch (e) { }
                showAlert("Success", "Welcome back to GlossCut!", "success");
                setTimeout(() => {
                    // Changed: Replace with Home instead of Onboarding
                    navigation.replace("Home");
                }, 800);
            } else {
                // Fallback for non-throwing failures
                showAlert("Login Failed", "Incorrect email or password.", "error");
            }
        } catch (error) {
            // This block handles Axios errors specifically
            if (error.response && error.response.status === 400) {
                showAlert(
                    "Access Denied",
                    "Invalid email or password. Please try again.",
                    "error"
                );
            } else if (error.code === "ERR_NETWORK") {
                showAlert(
                    "Network Error",
                    "Please check your internet connection.",
                    "warning"
                );
            } else {
                // Generic error
                showAlert("Error", "Something went wrong. Please try again.", "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={["#FAF7F2", "#F0EAD6", "#E6DCCA"]}
            locations={[0, 0.4, 1]}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" />

            {/* OAuth Denied Modal */}
            <Modal visible={oauthModalVisible} transparent animationType="fade" onRequestClose={() => { setOauthError(null); setOauthLoginOnly(false); }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: '86%', backgroundColor: '#fff', padding: 20, borderRadius: 12 }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8 }}>
                            {oauthError === 'role_not_allowed' ? 'Access Denied' : 'Account not found'}
                        </Text>
                        <Text style={{ color: '#374151', marginBottom: 16 }}>
                            {oauthError === 'role_not_allowed'
                                ? 'This Google account does not have a barber profile. Please sign in with a barber account or apply to become a partner.'
                                : 'The email returned by Google does not match any existing barber account. Please Apply Now to create a new partner account.'}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                            {!oauthLoginOnly && oauthError !== 'role_not_allowed' && (
                                <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 12 }} onPress={() => { setOauthError(null); setOauthLoginOnly(false); navigation.navigate('Signup'); }}>
                                    <Text style={{ color: '#8B5A2B', fontWeight: '700' }}>Apply Now</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 12 }} onPress={() => { setOauthError(null); setOauthLoginOnly(false); }}>
                                <Text style={{ color: '#6b7280' }}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Alert Overlay */}
            <View style={styles.alertOverlay}>
                <ModernAlert
                    visible={alert.visible}
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                    onHide={hideAlert}
                />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
            >
                <BackgroundDecorations />

                <Animated.View style={[styles.contentContainer, animatedCardStyle]}>
                    <LoginHeader animatedIconStyle={animatedIconStyle} />

                    {/* Inline OAuth Error (if persistent) */}
                    {oauthError && (
                        <View style={styles.oauthErrorCard}>
                            <Text style={styles.oauthErrorTitle}>
                                {oauthError === 'role_not_allowed' ? 'ACCESS DENIED' : 'Account not found'}
                            </Text>
                            <Text style={styles.oauthErrorMessage}>
                                {oauthError === 'role_not_allowed'
                                    ? 'This Google account is not authorized as a barber.'
                                    : 'The email returned by Google does not match any existing account.'}
                            </Text>
                            <TouchableOpacity style={styles.oauthErrorButton} onPress={() => setOauthError(null)}>
                                <Text style={styles.oauthErrorButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.formCard}>
                        {/* Google OAuth Button */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleGoogleLogin}
                        >
                            <View style={styles.googleButtonContent}>
                                <Image
                                    source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                                    style={styles.googleIcon}
                                />
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or sign in with email</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="partner@example.com"
                                placeholderTextColor="#A1887F"
                                value={email}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#A1887F"
                                    value={password}
                                    onChangeText={handlePasswordChange}
                                    secureTextEntry={!isPasswordVisible}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={togglePasswordVisibility}
                                >
                                    {isPasswordVisible ? (
                                        <EyeOff size={20} color="#8B4513" />
                                    ) : (
                                        <Eye size={20} color="#8B4513" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.forgotButton}
                            onPress={handleForgotPassword}
                        >
                            <Text style={styles.forgotText}>Forgot password?</Text>
                        </TouchableOpacity>

                        {/* Premium Gold Button */}
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 size={24} color="#3E2723" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={styles.loginButtonText}>ACCESS DASHBOARD</Text>
                                    <ArrowRight size={20} color="#3E2723" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <LoginFooter onSignupPress={handleSignupNavigation} />
                </Animated.View>
            </ScrollView>

            <View style={styles.bottomBrandingContainer}>
                <Text style={styles.branding}>© 2024 GLOSSCUT Inc.</Text>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },

    // --- MODERN ALERT STYLES ---
    alertOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 9999,
    },
    alertWrapper: {
        paddingTop: Platform.OS === "ios" ? 60 : 45,
        paddingHorizontal: 20,
        alignItems: "center",
        width: "100%",
    },
    alertContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        maxWidth: 400,
        padding: 16,
        borderRadius: 20, // Increased radius
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2, // Stronger shadow
        shadowRadius: 16,
        elevation: 12,
    },
    alertIconWrapper: {
        marginRight: 14,
    },
    alertTextContainer: { flex: 1 },
    alertTitle: {
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 3,
        letterSpacing: 0.3,
    },
    alertMessage: {
        fontSize: 13,
        color: "#D1D5DB",
        fontWeight: "500",
        lineHeight: 18,
    },

    // --- APP STYLES ---
    scrollView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 24, // Slight increase for breathing room
    },
    backgroundDecoration: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    glowTopRight: {
        position: 'absolute',
        top: -120,
        right: -80,
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: 'rgba(212, 175, 55, 0.18)', // Richer Gold
        transform: [{ scale: 1.1 }],
    },
    glowBottomLeft: {
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: 'rgba(139, 69, 19, 0.12)', // Richer Brown
    },

    contentContainer: {
        width: "90%",
        maxWidth: 400,
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    header: { alignItems: "center", marginBottom: 20, marginTop: 12 },
    logoContainer: {
        width: 110, // Slightly smaller
        height: 110, // Square for rounded circle effect
        borderRadius: 55, // Perfectly circular
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Added generic background
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        shadowColor: "#8B4513",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
        overflow: 'hidden', // Ensure image clips to bounds
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.5)',
    },
    logoImage: { width: "70%", height: "70%" }, // Adjusted to fit nicely in rounded container

    headerTextStack: { alignItems: 'center', marginBottom: 6 },
    preTitle: {
        fontSize: 11,
        fontWeight: "800",
        color: "#8B4513",
        letterSpacing: 2.5,
        marginBottom: 4,
        opacity: 0.9,
    },
    title: {
        fontSize: 28, // Visually impactful
        fontWeight: "900",
        color: "#3E2723",
        textAlign: "center",
        letterSpacing: 0.5,
    },
    titleUnderline: {
        width: 48,
        height: 4,
        backgroundColor: "#D4AF37",
        marginTop: 8,
        borderRadius: 2,
    },
    subtitle: {
        fontSize: 14,
        color: "#5D4037",
        textAlign: "center",
        lineHeight: 20,
        maxWidth: 290,
        marginTop: 10,
        opacity: 0.85,
    },

    formCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)', // More opaque
        borderRadius: 24, // Softer corners
        padding: 22,
        shadowColor: '#5D4037', // Warmer shadow color
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
        gap: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.6)", // Glassy border
    },

    inputGroup: { gap: 5 },
    label: {
        fontSize: 11,
        fontWeight: "800",
        color: "#6D4C41",
        marginLeft: 4,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    input: {
        height: 52,
        backgroundColor: "#FAFAFA", // Slight off-white
        borderWidth: 1.5, // Thicker border
        borderColor: "#E0E0E0",
        borderRadius: 14,
        paddingHorizontal: 18,
        fontSize: 15,
        color: "#3E2723",
        fontWeight: "600",
    },
    passwordContainer: { position: "relative" },
    eyeButton: { position: "absolute", right: 14, top: 14 },
    forgotButton: { alignSelf: "flex-end", marginTop: 4 },
    forgotText: { fontSize: 13, color: "#8D6E63", fontWeight: "700" },

    loginButton: {
        height: 54,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        backgroundColor: '#D4AF37',
        shadowColor: "#D4AF37",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
        borderTopWidth: 1,
        borderColor: "rgba(255,255,255,0.4)", // Highlight
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    loginButtonText: {
        color: "#3E2723",
        fontSize: 16,
        fontWeight: "900",
        marginRight: 8,
        letterSpacing: 0.8,
    },

    footer: { alignItems: "center", marginTop: 20 },
    footerText: { fontSize: 13, color: "#795548", fontWeight: "600" },
    loginLinkContainer: { marginTop: 4 },
    signUpText: {
        color: "#8B4513",
        fontWeight: "900",
        textDecorationLine: "underline",
    },

    bottomBrandingContainer: {
        width: '100%',
        paddingBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    branding: {
        fontSize: 10,
        color: "#A1887F",
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 2.5,
        textAlign: 'center',
    },

    // --- GOOGLE OAUTH STYLES ---
    googleButton: {
        height: 52,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#EFEBE9",
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    googleButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 12,
    },
    googleButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#4E342E",
    },

    oauthErrorCard: { backgroundColor: '#FFEBEE', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FFCDD2', marginBottom: 12 },
    oauthErrorTitle: { fontWeight: '900', fontSize: 14, color: '#B71C1C', marginBottom: 4 },
    oauthErrorMessage: { color: '#C62828', fontSize: 12, marginBottom: 8, lineHeight: 16 },
    oauthErrorButton: { backgroundColor: '#B71C1C', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
    oauthErrorButtonText: { color: '#fff', fontWeight: '700', fontSize: 11 },

    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E6DCCA",
        opacity: 0.8,
    },
    dividerText: {
        paddingHorizontal: 12,
        fontSize: 11,
        color: "#A1887F",
        fontWeight: "700",
        textTransform: "uppercase",
    },
});

export default LoginScreen;
