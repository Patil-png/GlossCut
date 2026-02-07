import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Easing, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const { width, height } = Dimensions.get('window');

// --- COLORS ---
const BUTTON_COLORS = ['#6366F1', '#A855F7'];
const BUTTON_SHADOW = '#6366F1';

const BiometricLockScreen = ({ onUnlock }) => {
    const { theme, isDark } = useTheme();
    const { colors } = theme;
    const { biometricType } = useAuth();
    const [shopId, setShopId] = useState(null);
    const [shopName, setShopName] = useState('');
    const [loadingShop, setLoadingShop] = useState(true);

    const isFaceID = biometricType === 'FACE';
    const lockIcon = isFaceID ? 'scan-outline' : 'finger-print';
    const lockText = isFaceID ? 'Face Verification' : 'Touch Verification';

    // --- ANIMATIONS ---
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Background Movement Animations
    const blob1Anim = useRef(new Animated.Value(0)).current;
    const blob2Anim = useRef(new Animated.Value(0)).current;

    const handleUnlock = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock();
    };

    useEffect(() => {
        fetchShopDetails();

        // 1. Content Entrance
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 20, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]).start();

        // 2. Scanner Pulse (Outer Glow)
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // 4. Background "Breathing" Blobs
        Animated.loop(
            Animated.sequence([
                Animated.timing(blob1Anim, { toValue: -50, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(blob1Anim, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(blob2Anim, { toValue: 40, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(blob2Anim, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

    }, []);

    const fetchShopDetails = async () => {
        try {
            const res = await api.get(`${process.env.EXPO_PUBLIC_API_URL}/api/shop/my-shop`);
            if (res.status === 200 && res.data) {
                setShopId(res.data._id);
                setShopName(res.data.name);
            }
        } catch (e) {
            console.log('Failed to fetch shop details', e);
        } finally {
            setLoadingShop(false);
        }
    };

    const qrData = shopId ? `https://glosscut.com/?source=qr&salon_id=${shopId}` : '';

    // Theme Styles
    const dynamicStyles = {
        // Base background color
        bgBase: isDark ? '#0F172A' : '#F8FAFC',
        // Blob colors (Primary and Secondary/Purple)
        blob1Color: isDark ? '#4338ca' : '#C7D2FE', // Indigo
        blob2Color: isDark ? '#7e22ce' : '#E9D5FF', // Purple

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
                    <Text style={[styles.headerText, { color: dynamicStyles.subTextColor }]}>SECURED • SCAN TO BOOK</Text>
                </View>

                {/* --- QR STANDEE CARD (Main Focus) --- */}
                {loadingShop ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 40 }} />
                ) : (
                    <View style={styles.cardContainer}>
                        {/* The Card Body */}
                        <View style={[styles.pinterestCard, { backgroundColor: '#4f46e5' }]}>
                            {/* QR Box (White) */}
                            <View style={[styles.whiteQrBox, { width: 280, height: 280 }]}>
                                {shopId && (
                                    <QRCode
                                        value={qrData}
                                        size={240}
                                        color="#000"
                                        backgroundColor="white"
                                        quietZone={5}
                                        logo={require('../assets/GlossCutQr.png')}
                                        logoSize={65}
                                        logoBackgroundColor='white'
                                        logoBorderRadius={32}
                                    />
                                )}
                            </View>

                            {/* Bottom Label inside the card */}
                            <View style={styles.scanMeContainer}>
                                <Text style={styles.scanMeText}>SCAN ME</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Tagline */}
                {!loadingShop && (
                    <Text style={[styles.taglineText, { color: dynamicStyles.textColor }]}>
                        "Sab sochenge teri koi 'Setting' hai bhaari,{"\n"}
                        Tu bas Scan kar, yehi hai asli Samajhdari!" 🧠⚡
                    </Text>
                )}

                {/* Shop Name */}
                {!loadingShop && (
                    <Text style={[styles.title, { color: dynamicStyles.textColor, marginTop: 20 }]}>
                        {shopName}
                    </Text>
                )}

                {/* Floating Gradient Button (Unlock) */}
                <TouchableOpacity
                    onPress={handleUnlock}
                    activeOpacity={0.8}
                    style={[styles.buttonShadow, { shadowColor: BUTTON_SHADOW, marginTop: 30, width: '90%' }]}
                >
                    <LinearGradient
                        colors={BUTTON_COLORS}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Ionicons name={lockIcon} size={20} color={dynamicStyles.buttonText} style={{ marginRight: 10 }} />
                        <Text style={[styles.buttonText, { color: dynamicStyles.buttonText }]}>
                            UNLOCK DEVICE
                        </Text>
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
        paddingBottom: 40
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
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

    // --- STANDEE CARD STYLES ---
    cardContainer: {
        alignItems: 'center',
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    pinterestCard: {
        width: 320,
        borderRadius: 30,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 25,
    },
    whiteQrBox: {
        // Size handled inline for adjustments
        backgroundColor: 'white',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15
    },
    scanMeContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 6,
        paddingHorizontal: 25,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    scanMeText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 1.5,
    },

    // Text
    taglineText: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 20,
        marginBottom: 10,
        maxWidth: '85%',
        lineHeight: 20,
        opacity: 0.9
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 5,
        letterSpacing: -0.5,
        textAlign: 'center'
    },
    // Button
    buttonShadow: {
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
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
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
