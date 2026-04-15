import React, { useRef, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Layout } from '../theme/layout';
import { Star, MapPin } from 'lucide-react-native';
import OptimizedImage from '../../components/OptimizedImage';

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

const BouncyCard = ({ children, onPress, activeOpacity = 0.9 }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
      tension: 100}).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 100}).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const SalonCard = ({
  name,
  rating,
  address,
  isAvailable,
  image,
  category = 'Salon',
  todaysBookings = 0,
  maxAppointments = 20,
  listingTier = 'standard',
  distance,
  onPress}) => {
  const fullness = Math.min((todaysBookings / maxAppointments) * 100, 100);

  return (
    <BouncyCard onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.imageArea}>
          <OptimizedImage source={image} style={styles.image} contentFit="cover" />

          <View style={styles.statusBadge}>
            <PulseDot isAvailable={isAvailable} />
            <Text style={styles.statusText}>{isAvailable ? 'Open' : 'Closed'}</Text>
          </View>

          <View style={styles.badgeColumn}>
            {listingTier === 'premium' && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>FEATURED</Text>
              </View>
            )}
            {todaysBookings >= 5 && (
              <View style={styles.trendingBadge}>
                <Text style={styles.trendingText}>Popular</Text>
              </View>
            )}
          </View>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
          </View>

          {distance && (
            <View style={styles.distanceBadge}>
              <MapPin size={10} color={Colors.TEXT_ON_DARK} />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoArea}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.ratingBox}>
              <Star size={12} color={Colors.TEXT_PRIMARY} fill={Colors.TEXT_PRIMARY} />
              <Text style={styles.ratingText}>{rating > 0 ? rating.toFixed(1) : 'New'}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color={Colors.TEXT_MUTED} />
            <Text style={styles.address} numberOfLines={1}>
              {address}
            </Text>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressLabels}>
              <Text style={styles.queueLabel}>Today's load</Text>
              <Text style={styles.queuePct}>{Math.round(fullness)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${fullness}%` }]} />
            </View>
          </View>
        </View>
      </View>
    </BouncyCard>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.BG_CARD,
    borderRadius: Layout.radiusCard,
    marginBottom: Layout.cardGap,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.BORDER_CARD,
    ...Layout.noShadow},
  imageArea: {
    height: 210,
    position: 'relative',
    backgroundColor: Colors.BG_IMAGE_PLACEHOLDER,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.BORDER_CARD},
  image: {
    width: '100%',
    height: '100%'},
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.BG_CARD,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.BORDER_CARD},
  statusText: {
    ...Typography.MICRO_LABEL,
    fontSize: 9,
    color: Colors.TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5},
  dotContainer: {
    width: 8,
    height: 8,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center'},
  staticDot: {
    width: 6,
    height: 6,
    borderRadius: 3},
  pulseCircle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.35},
  badgeColumn: {
    position: 'absolute',
    top: 10,
    left: 10,
    gap: 6},
  featuredBadge: {
    backgroundColor: Colors.CTA_BUTTON,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Layout.radiusTag},
  featuredText: {
    color: Colors.TEXT_ON_DARK,
    fontSize: 8,
    fontFamily: 'DMSans_700Bold'},
  trendingBadge: {
    backgroundColor: 'rgba(26,26,26,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Layout.radiusTag},
  trendingText: {
    color: Colors.TEXT_ON_DARK,
    fontSize: 8,
    fontFamily: 'DMSans_700Bold'},
  categoryBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(26,26,26,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6},
  categoryText: {
    color: Colors.TEXT_ON_DARK,
    fontSize: 8,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.8},
  distanceBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(26,26,26,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4},
  distanceText: {
    color: Colors.TEXT_ON_DARK,
    fontSize: 10,
    fontFamily: 'DMSans_700Bold'},
  infoArea: {
    padding: 16},
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4},
  name: {
    ...Typography.CARD_TITLE,
    fontSize: 15,
    flex: 1,
    marginRight: 8},
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.BG_TAG,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6},
  ratingText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.TEXT_PRIMARY},
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12},
  address: {
    ...Typography.BODY,
    flex: 1},
  progressBlock: {
    marginTop: 4},
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6},
  queueLabel: {
    ...Typography.SMALL_LABEL,
    fontSize: 11},
  queuePct: {
    ...Typography.SMALL_LABEL,
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.TEXT_SECONDARY},
  progressTrack: {
    height: 4,
    backgroundColor: Colors.PROGRESS_BG,
    borderRadius: 2,
    overflow: 'hidden'},
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.ACCENT_PROGRESS}});

export default memo(SalonCard, (prev, next) => {
  return (
    prev.name === next.name &&
    prev.rating === next.rating &&
    prev.address === next.address &&
    prev.image === next.image &&
    prev.isAvailable === next.isAvailable &&
    prev.todaysBookings === next.todaysBookings &&
    prev.listingTier === next.listingTier
  );
});
