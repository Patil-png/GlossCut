import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Easing, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// --- COLORS ---
const BUTTON_COLORS = ['#6366F1', '#A855F7'];
const BUTTON_SHADOW = '#6366F1';

const BiometricLockScreen = ({ onUnlock }) => {
    const { theme, isDark } = useTheme();
    const { colors } = theme;
    const { biometricType } = useAuth();

    const isFaceID = biometricType === 'FACE';
    const lockIcon = isFaceID ? 'scan-outline' : 'finger-print';
    const lockText = isFaceID ? 'Face Verification' : 'Touch Verification';
    const buttonText = 'UNLOCK DEVICE';

    // --- ANIMATIONS ---
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scanLineAnim = useRef(new Animated.Value(0)).current;

    // Background Movement Animations
    const blob1Anim = useRef(new Animated.Value(0)).current;
    const blob2Anim = useRef(new Animated.Value(0)).current;

    const handleUnlock = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock();
    };

    useEffect(() => {
        // 1. Content Entrance
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 20, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]).start();

        // 2. Scanner Pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // 3. Laser Scan Line
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: true })
            ])
        ).start();

        // 4. Background "Breathing" Blobs
        // Blob 1 moves up/down
        Animated.loop(
            Animated.sequence([
                Animated.timing(blob1Anim, { toValue: -50, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(blob1Anim, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // Blob 2 moves left/right
        Animated.loop(
            Animated.sequence([
                Animated.timing(blob2Anim, { toValue: 40, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(blob2Anim, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

    }, []);

    const translateY = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-45, 45]
    });

    // Theme Styles
    const dynamicStyles = {
        // Base background color
        bgBase: isDark ? '#0F172A' : '#F8FAFC',
        // Blob colors (Primary and Secondary/Purple)
        blob1Color: isDark ? '#4338ca' : '#C7D2FE', // Indigo
        blob2Color: isDark ? '#7e22ce' : '#E9D5FF', // Purple

        scannerBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
        scannerBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',

        textColor: isDark ? '#FFFFFF' : '#1e293b',
        subTextColor: isDark ? '#94a3b8' : '#64748b',
        buttonText: '#FFFFFF',
    };

    return (
        <View style={[styles.container, { backgroundColor: dynamicStyles.bgBase }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* --- 1. ANIMATED BACKGROUND LAYER --- */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {/* Blob 1 (Top Left) */}
                <Animated.View style={[
                    styles.blob,
                    {
                        backgroundColor: dynamicStyles.blob1Color,
                        top: -width * 0.2,
                        left: -width * 0.2,
                        transform: [{ translateY: blob1Anim }]
                    }
                ]} />

                {/* Blob 2 (Bottom Right) */}
                <Animated.View style={[
                    styles.blob,
                    {
                        backgroundColor: dynamicStyles.blob2Color,
                        bottom: -width * 0.2,
                        right: -width * 0.2,
                        transform: [{ translateX: blob2Anim }]
                    }
                ]} />

                {/* Glass Blur Overlay - Smooths the blobs into a mesh gradient */}
                <BlurView intensity={Platform.OS === 'ios' ? 100 : 50} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
            </View>

            {/* --- 2. MAIN CONTENT --- */}
            <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

                {/* Minimalist Header */}
                <View style={styles.header}>
                    <Ionicons name="shield-checkmark" size={14} color={dynamicStyles.subTextColor} />
                    <Text style={[styles.headerText, { color: dynamicStyles.subTextColor }]}>SECURED WORKSPACE</Text>
                </View>

                {/* The Scanner (Glassmorphism) */}
                <View style={styles.scannerSection}>
                    {/* Glass Circle */}
                    <View style={[
                        styles.scannerCircle,
                        {
                            backgroundColor: dynamicStyles.scannerBg,
                            borderColor: dynamicStyles.scannerBorder
                        }
                    ]}>
                        <Ionicons name={lockIcon} size={48} color={isDark ? '#FFF' : '#334155'} />

                        {/* Laser Line */}
                        <Animated.View style={[styles.scanLine, {
                            backgroundColor: BUTTON_COLORS[0],
                            transform: [{ translateY }],
                        }]} />
                    </View>

                    {/* Outer Glow Ring */}
                    <Animated.View style={[styles.pulseCircle, {
                        transform: [{ scale: pulseAnim }],
                        borderColor: BUTTON_COLORS[0],
                        opacity: isDark ? 0.3 : 0.2
                    }]} />
                </View>

                {/* Typography */}
                <View style={styles.textBlock}>
                    <Text style={[styles.title, { color: dynamicStyles.textColor }]}>GlossCut Pro</Text>
                    <Text style={[styles.subtitle, { color: dynamicStyles.subTextColor }]}>
                        Biometric verification required to access your shop dashboard.
                    </Text>
                </View>

                {/* Floating Gradient Button */}
                <TouchableOpacity
                    onPress={handleUnlock}
                    activeOpacity={0.8}
                    style={[styles.buttonShadow, { shadowColor: BUTTON_SHADOW }]}
                >
                    <LinearGradient
                        colors={BUTTON_COLORS}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={[styles.buttonText, { color: dynamicStyles.buttonText }]}>
                            VERIFY IDENTITY
                        </Text>
                        <Ionicons name="finger-print" size={18} color={dynamicStyles.buttonText} />
                    </LinearGradient>
                </TouchableOpacity>

            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
                <Ionicons name="lock-closed-outline" size={12} color={dynamicStyles.subTextColor} style={{ marginBottom: 4 }} />
                <Text style={[styles.footerText, { color: dynamicStyles.subTextColor }]}>
                    End-to-End Encrypted Session
                </Text>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Ensures blobs don't overflow screen bounds
    },
    // Background Blobs
    blob: {
        position: 'absolute',
        width: width * 0.9,
        height: width * 0.9,
        borderRadius: width,
        opacity: 0.6,
    },
    contentContainer: {
        width: '100%',
        paddingHorizontal: 40,
        alignItems: 'center',
        zIndex: 10,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 50,
        opacity: 0.9,
        backgroundColor: 'rgba(125,125,125,0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    headerText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginLeft: 8,
    },
    // Scanner
    scannerSection: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 45,
        height: 140,
        width: 140,
    },
    pulseCircle: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 1,
    },
    scannerCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
    },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 3,
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 5,
    },
    // Text
    textBlock: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 24,
        letterSpacing: 0.1,
        maxWidth: '80%',
    },
    // Button
    buttonShadow: {
        width: '100%',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
        borderRadius: 30,
    },
    gradientButton: {
        flexDirection: 'row',
        height: 58,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        marginRight: 10,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
        opacity: 0.6,
    },
    footerText: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
    }
});

export default BiometricLockScreen;