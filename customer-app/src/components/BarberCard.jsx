import React, { useRef, useEffect, memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Layout } from '../theme/layout';
import { Star, MapPin, Scissors, Clock, Navigation as NavigationIcon, Heart } from 'lucide-react-native';
import OptimizedImage from '../../components/OptimizedImage';

const GlossCutImage = require("../../assets/GlossCut.png");

const { width } = Dimensions.get('window');

const PulseDot = ({ isAvailable }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!isAvailable) return;
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.8, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, [isAvailable]);

    return (
        <View style={styles.dotContainer}>
            {isAvailable && (
                <Animated.View
                    style={[
                        styles.pulseCircle,
                        { transform: [{ scale: pulseAnim }], backgroundColor: Colors.STATUS_OPEN },
                    ]}
                />
            )}
            <View
                style={[
                    styles.staticDot,
                    { backgroundColor: isAvailable ? Colors.STATUS_OPEN : Colors.TEXT_MUTED },
                ]}
            />
        </View>
    );
};

const BouncyCard = ({ children, onPress, activeOpacity = 0.9, disabled }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        if (disabled) return;
        Animated.spring(scaleValue, {
            toValue: 0.97,
            useNativeDriver: true,
            friction: 8,
            tension: 100
        }).start();
    };

    const onPressOut = () => {
        if (disabled) return;
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            friction: 4,
            tension: 100
        }).start();
    };

    return (
        <TouchableOpacity
            activeOpacity={activeOpacity}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={onPress}
            disabled={disabled}
        >
            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>{children}</Animated.View>
        </TouchableOpacity>
    );
};

const BarberCard = ({
    item,
    premiumInfo,
    onPress,
    onLikePress,
    onBookPress,
    isLiked = false,
    distance,
    isSmall = false
}) => {
    const navigation = useNavigation();
    const name = item.name || item.fullName || "Expert Barber";

    const isAvailable = item.isAvailable ?? true;
    const isPendingApproval = item.approvalStatus === 'pending';
    const reviewCount = item.numberOfReviews || item.reviews?.length || 0;

    const imageUri = useMemo(() => {
        let img = item.image?.uri || item.image || item.profilePicture;

        if (!img) return null;

        if (typeof img === 'string') {
            if (!img.startsWith('http') && !img.startsWith('data:')) {
                const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://192.168.29.243:5000';
                img = `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
            }
            return { uri: img };
        }

        if (typeof img === 'number') return img;
        return img;
    }, [item]);

    const hasNoImage = useMemo(() => {
        if (!imageUri) return true;
        const uri = typeof imageUri === 'object' ? imageUri.uri : imageUri;
        if (!uri || (typeof uri === 'string' && uri.includes('via.placeholder.com'))) return true;
        return false;
    }, [imageUri]);


    const firstLetter = name.charAt(0).toUpperCase();

    const avatarBg = useMemo(() => {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        const index = name.length % colors.length;
        return colors[index];
    }, [name]);


    const handlePress = () => {
        if (isPendingApproval) return;
        onPress?.(item);
    };

    const handleBook = () => {
        if (!isAvailable || isPendingApproval) return;
        onBookPress?.(item);
    };

    return (
        <BouncyCard onPress={handlePress} disabled={isPendingApproval}>
            <View style={styles.shadowWrapper}>
                <View style={[styles.container, isSmall && { borderRadius: 20 }]}>
                    {/* Header Image Area */}
                    <View style={[styles.imageArea, isSmall && { height: 200 }]}>
                        {hasNoImage ? (
                            <OptimizedImage source={GlossCutImage} style={styles.image} contentFit="cover" />
                        ) : (
                            <OptimizedImage source={imageUri} style={styles.image} contentFit="cover" />
                        )}

                        {/* Top-Left: Availability Badge */}
                        <View style={styles.statusBadge}>
                            <PulseDot isAvailable={isAvailable} />
                            <Text style={styles.statusText}>{isAvailable ? 'Available' : 'Unavailable'}</Text>
                        </View>

                        {/* Top-Right: Like Button */}
                        <TouchableOpacity 
                            style={styles.likeButton}
                            onPress={() => onLikePress?.(item)}
                            activeOpacity={0.7}
                        >
                            <Heart 
                                size={18} 
                                color={isLiked ? "#FF4444" : "#1A1A1A"} 
                                fill={isLiked ? "#FF4444" : "transparent"} 
                            />
                        </TouchableOpacity>

                    </View>


                    {/* Content Detail Area */}
                    <View style={[styles.infoArea, isSmall && { paddingVertical: 14, paddingHorizontal: 16 }]}>
                        {/* Name Header */}
                        <View style={styles.headerRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.name, isSmall && { fontSize: 20 }]} numberOfLines={1}>
                                    {name}
                                </Text>
                            </View>
                            
                            {/* Restored Rating next to name */}
                            <View style={styles.ratingBadge}>
                                <Star size={11} color="#FFD700" fill="#FFD700" />
                                <Text style={styles.ratingBadgeText}>{item.rating > 0 ? Number(item.rating).toFixed(1) : 'NEW'}</Text>
                            </View>
                        </View>

                        {/* Detail Stats Grid */}
                        <View style={styles.statsGrid}>
                            {/* Reviews Slot (Only Count) */}
                            <TouchableOpacity 
                                style={styles.statBox}
                                onPress={() => navigation.navigate('BarberReviews', { barber: item })}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.statLabel}>REVIEWS</Text>
                                <Text style={styles.statValue}>{reviewCount}</Text>
                                <Text style={styles.subStatLabel}>Total</Text>
                            </TouchableOpacity>

                            <View style={styles.statDivider} />
                            
                            {/* Booked Metric */}
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>BOOKED</Text>
                                <Text style={styles.statValue}>{item.todaysBookings || 0}</Text>
                                <Text style={styles.subStatLabel}>Today</Text>
                            </View>

                            <View style={styles.statDivider} />
                            
                            {/* Action Button (Enlarged) */}
                            <View style={[styles.statBox, { flex: 1.5 }]}>
                                <TouchableOpacity
                                    style={[
                                        styles.gridBookBtn,
                                        { backgroundColor: isAvailable ? Colors.CTA_BUTTON : Colors.BG_HOVER }
                                    ]}
                                    onPress={handleBook}
                                    disabled={!isAvailable || isPendingApproval}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Clock size={12} color={isAvailable ? Colors.TEXT_ON_DARK : Colors.TEXT_MUTED} />
                                        <Text style={[
                                            styles.gridBookBtnText,
                                            { color: isAvailable ? Colors.TEXT_ON_DARK : Colors.TEXT_MUTED }
                                        ]}>
                                            {isAvailable ? 'Queue' : 'Off'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Pending Status Overlay */}
                    {isPendingApproval && (
                        <View style={styles.pendingOverlay}>
                            <View style={styles.pendingBadge}>
                                <Clock size={16} color="#FFF" />
                                <Text style={styles.pendingText}>Pending Review</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </BouncyCard>
    );
};

const styles = StyleSheet.create({
    shadowWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 6,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.04)',
    },
    container: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFF'
    },
    imageArea: {
        height: 230,
        position: 'relative',
        backgroundColor: '#F1F5F9',
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    image: {
        width: '100%',
        height: '100%'
    },
    letterAvatarLarge: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    letterTextLarge: {
        fontSize: 56,
        fontFamily: 'Syne_800ExtraBold',
        color: '#FFFFFF'
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.1)',
        zIndex: 10
    },
    likeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#FFF',
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.08)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        zIndex: 10
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    dotContainer: {
        width: 8,
        height: 8,
        marginRight: 6,
        justifyContent: 'center',
        alignItems: 'center'
    },
    staticDot: {
        width: 6,
        height: 6,
        borderRadius: 3
    },
    pulseCircle: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        opacity: 0.35
    },
    categoryBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8
    },
    categoryText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1
    },
    distanceBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4
    },
    distanceText: {
        color: '#000',
        fontSize: 11,
        fontWeight: '800'
    },
    infoArea: {
        paddingHorizontal: 14,
        paddingVertical: 10
    },
    name: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 19,
        color: '#000',
        letterSpacing: -0.5,
        flex: 1,
        marginRight: 8
    },

    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },

    tagPill: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 6
    },
    tagText: {
        fontSize: 10,
        fontFamily: 'DMSans_700Bold',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#000',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3
    },
    ratingBadgeText: {
        fontSize: 12,
        fontFamily: 'DMSans_700Bold',
        color: '#FFF'
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        marginBottom: 0
    },
    statBox: {
        flex: 1,
        alignItems: 'center'
    },
    reviewText: {
        fontSize: 13,
        fontFamily: 'DMSans_500Medium',
        color: '#475569',
        lineHeight: 18
    },
    reviewItemExpanded: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 12,
        marginHorizontal: -12
    },
    reviewTextExpanded: {
        color: '#0F172A',
        lineHeight: 20
    },
    readMoreText: {
        fontSize: 11,
        fontFamily: 'DMSans_700Bold',
        color: '#000',
        marginTop: 6
    },
    subStatLabel: {
        fontSize: 9,
        fontFamily: 'DMSans_500Medium',
        color: '#94A3B8',
        marginTop: 1,
        letterSpacing: 0.2
    },
    emptyReviews: {
        letterSpacing: 0.5
    },
    statLabel: {
        fontSize: 9,
        fontFamily: 'DMSans_700Bold',
        color: '#94A3B8',
        marginBottom: 1,
        letterSpacing: 0.5
    },
    statValue: {
        fontSize: 14,
        fontFamily: 'DMSans_700Bold',
        color: '#000'
    },
    statDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(0,0,0,0.06)'
    },
    gridBookBtn: {
        paddingHorizontal: 10,
        paddingVertical: 11,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },
    gridBookBtnText: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 15,
        letterSpacing: 0.2
    },
    pendingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    },

    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F59E0B',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30
    },
    pendingText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        marginLeft: 8
    }
});

export default memo(BarberCard);
