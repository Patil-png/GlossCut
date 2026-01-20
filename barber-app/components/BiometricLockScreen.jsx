import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

// Make sure to import useTheme from the file location you created
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const BiometricLockScreen = ({ onUnlock }) => {
    // 1. Hook into your Theme Context
    const { theme, isDark } = useTheme();
    const { colors } = theme;

    // 2. Animation Values
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scanLineAnim = useRef(new Animated.Value(0)).current;

    const handleUnlock = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock();
    };

    useEffect(() => {
        // Entrance
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]).start();

        // Pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // Scan Line
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
                Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const translateY = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-60, 60]
    });

    // Dynamic styles based on theme
    const dynamicStyles = {
        glowColor: isDark ? 'rgba(106, 27, 154, 0.3)' : 'rgba(106, 27, 154, 0.15)', // Primary with opacity
        glassBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        glassBg: isDark ? 'rgba(30, 30, 30, 0.6)' : 'rgba(255, 255, 255, 0.6)',
        buttonText: '#FFFFFF', // White text usually looks best on the Purple primary button
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            {/* 1. Dynamic Background Gradient */}
            <LinearGradient
                colors={isDark
                    ? [colors.background, '#000000']
                    : ['#FFFFFF', colors.iconBackground]
                }
                style={StyleSheet.absoluteFill}
            />

            {/* Background Decor Circles (Using Primary Color) */}
            <View style={[styles.bgCircle, {
                backgroundColor: colors.primary,
                top: -100, left: -50,
                opacity: isDark ? 0.08 : 0.05
            }]} />
            <View style={[styles.bgCircle, {
                backgroundColor: colors.secondary, // Use secondary for contrast 
                bottom: -100, right: -50, width: 400, height: 400,
                opacity: isDark ? 0.05 : 0.03
            }]} />

            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

                {/* Icon Container */}
                <View style={styles.iconContainer}>
                    {/* Pulsing Glow */}
                    <Animated.View style={[
                        styles.glow,
                        {
                            backgroundColor: dynamicStyles.glowColor,
                            transform: [{ scale: pulseAnim }]
                        }
                    ]} />

                    {/* Glassmorphism Icon Circle */}
                    <BlurView
                        intensity={40}
                        tint={isDark ? "dark" : "light"}
                        style={[
                            styles.glassCircle,
                            {
                                borderColor: dynamicStyles.glassBorder,
                                backgroundColor: dynamicStyles.glassBg
                            }
                        ]}
                    >
                        {/* Fingerprint Icon - Uses Theme Primary */}
                        <Ionicons name="finger-print" size={64} color={colors.primary} />

                        {/* Scanning Line - Uses Theme Success or Primary */}
                        <Animated.View style={[
                            styles.scanLine,
                            {
                                backgroundColor: colors.primary, // Using primary to match branding
                                transform: [{ translateY }],
                                shadowColor: colors.primary
                            }
                        ]} />
                    </BlurView>

                    {/* Security Badge */}
                    <View style={[styles.shieldBadge, { backgroundColor: colors.success, borderColor: colors.card }]}>
                        <Ionicons name="shield-checkmark" size={18} color="#FFF" />
                    </View>
                </View>

                {/* Text Content */}
                <Text style={[styles.title, { color: colors.text }]}>
                    SetKarr<Text style={{ fontWeight: '800', color: colors.primary }}>Secured</Text>
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Identity Verification Required
                </Text>

                {/* Action Button */}
                <TouchableOpacity
                    onPress={handleUnlock}
                    activeOpacity={0.8}
                    style={[styles.buttonWrapper, { shadowColor: colors.primary }]}
                >
                    <LinearGradient
                        // Gradient from Primary to a slightly lighter/darker shade or Secondary
                        colors={[colors.primary, '#8E24AA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={[styles.buttonText, { color: dynamicStyles.buttonText }]}>
                            AUTHENTICATE
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color={dynamicStyles.buttonText} />
                    </LinearGradient>
                </TouchableOpacity>

            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} style={{ marginBottom: 4 }} />
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    Encrypted by SetKarr Business
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
    },
    bgCircle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        blurRadius: 50,
    },
    content: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 40,
        zIndex: 10,
    },
    iconContainer: {
        marginBottom: 50,
        justifyContent: 'center',
        alignItems: 'center',
        width: 140,
        height: 140,
    },
    glow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 10,
    },
    glassCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
    },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 3,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
        opacity: 0.9,
    },
    shieldBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        elevation: 5,
    },
    title: {
        fontSize: 32,
        fontWeight: '300',
        marginBottom: 8,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 60,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    buttonWrapper: {
        width: '100%',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
        borderRadius: 16,
    },
    gradientButton: {
        flexDirection: 'row',
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginRight: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
        opacity: 0.7,
    },
    footerText: {
        fontSize: 10,
        letterSpacing: 2,
        textTransform: 'uppercase',
    }
});

export default BiometricLockScreen;