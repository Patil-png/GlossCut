import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View, Platform } from 'react-native';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react-native';

const CustomToast = ({ visible, message, type = 'success', onHide, duration = 3000 }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            // Slide in and fade in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (onHide) onHide();
        });
    };

    const getConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <CheckCircle size={24} color="#059669" fill="#059669" />,
                    bg: '#ECFDF5',
                    border: '#059669',
                };
            case 'error':
                return {
                    icon: <XCircle size={24} color="#DC2626" fill="#DC2626" />,
                    bg: '#FEF2F2',
                    border: '#DC2626',
                };
            case 'warning':
                return {
                    icon: <AlertCircle size={24} color="#D97706" fill="#D97706" />,
                    bg: '#FFFBEB',
                    border: '#D97706',
                };
            case 'info':
                return {
                    icon: <Info size={24} color="#2563EB" fill="#2563EB" />,
                    bg: '#EFF6FF',
                    border: '#2563EB',
                };
            default:
                return {
                    icon: <CheckCircle size={24} color="#059669" fill="#059669" />,
                    bg: '#ECFDF5',
                    border: '#059669',
                };
        }
    };

    if (!visible) return null;

    const config = getConfig();

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                    backgroundColor: config.bg,
                    borderColor: config.border,
                },
            ]}
        >
            <View style={styles.iconContainer}>{config.icon}</View>
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 2,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        marginRight: 12,
    },
    message: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
});

export default CustomToast;
