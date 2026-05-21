import React, { useRef, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Star, MapPin, Sparkles, ShieldCheck, Navigation as NavigationIcon } from 'lucide-react-native';
import OptimizedImage from '../../components/OptimizedImage';
import { useTheme } from '../../contexts/ThemeContext.jsx';

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
            { transform: [{ scale: pulseAnim }], backgroundColor: '#10B981' },
          ]}
        />
      )}
      <View
        style={[
          styles.staticDot,
          { backgroundColor: isAvailable ? '#10B981' : '#64748B' },
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
      tension: 100
    }).start();
  };

  const onPressOut = () => {
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
  listingTier = 'standard',
  distance,
  isVerified,
  isPriority,
  onPress
}) => {
  const { theme } = useTheme();

  // If distance is numeric or string, format it nicely
  const formattedDistance = distance 
    ? (typeof distance === 'string' && distance.includes('km') 
        ? distance 
        : `~${parseFloat(distance).toFixed(1)} km`)
    : null;

  return (
    <BouncyCard onPress={onPress}>
      <View style={[styles.hsPremiumCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.hsCardImageArea}>
          <OptimizedImage
            source={image}
            style={styles.hsPremiumCardImage}
            contentFit="cover"
          />
          <View style={styles.hsImageOverlay} />

          {/* Top-right: Status badge */}
          <View style={styles.hsBadgeTopRight}>
            <View style={[styles.hsStatusBadge, { backgroundColor: isAvailable ? '#FFF' : '#000', borderColor: isAvailable ? '#F1F5F9' : 'transparent' }]}>
              <PulseDot isAvailable={isAvailable} />
              <Text style={[styles.hsStatusBadgeText, { color: isAvailable ? '#000' : '#FFF' }]}>
                {isAvailable ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* Top-left: Category + Featured + Priority */}
          <View style={styles.hsBadgeTopLeft}>
            {(isPriority || listingTier === 'premium') && (
              <View style={styles.hsFeaturedBadge}>
                <Sparkles size={10} color="#FFF" />
                <Text style={styles.hsFeaturedBadgeText}>FEATURED</Text>
              </View>
            )}
            <View style={styles.hsCategoryBadge}>
              <Text style={styles.hsCategoryBadgeText}>{category?.toUpperCase() || 'SALON'}</Text>
            </View>
          </View>

          {/* Bottom-right: Distance pill */}
          {formattedDistance && (
            <View style={styles.distancePillOnImage}>
              <NavigationIcon size={10} color="#FFF" />
              <Text style={styles.distancePillText}>{formattedDistance}</Text>
            </View>
          )}

          {isVerified && (
            <View style={styles.hsVerifiedBadge}>
              <ShieldCheck size={12} color="#FFF" />
              <Text style={styles.hsVerifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.hsPremiumCardContent}>
          <View style={styles.hsTitleRow}>
            <Text style={[styles.hsPremiumTitle, { color: theme.colors.text }]} numberOfLines={1}>{name}</Text>
            <View style={[styles.hsRatingBadge, { backgroundColor: theme.colors.border }]}>
              <Star size={12} color="yellow" fill="#F59E0B" />
              <Text style={[styles.hsRatingText, { color: theme.colors.text }]}>
                {rating > 0 ? rating.toFixed(1) : 'New'}
              </Text>
            </View>
          </View>

          <View style={[styles.hsMetaRow, { alignItems: 'flex-start' }]}>
            <MapPin size={14} color={theme.colors.textSecondary} style={{ marginTop: 2 }} />
            <Text style={[styles.hsMetaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {address}
            </Text>
          </View>
        </View>
      </View>
    </BouncyCard>
  );
};

const styles = StyleSheet.create({
  hsPremiumCard: {
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    // Strong Luxury Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8
  },
  hsCardImageArea: { height: 225, position: 'relative', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  hsPremiumCardImage: { width: '100%', height: '100%' },
  hsImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },

  hsBadgeTopRight: { position: 'absolute', top: 12, right: 12 },
  hsStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  
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

  hsStatusBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  hsBadgeTopLeft: { position: 'absolute', top: 12, left: 12, gap: 6 },
  hsFeaturedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  hsFeaturedBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', marginLeft: 4, letterSpacing: 1 },
  hsCategoryBadge: { backgroundColor: '#0F172A', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  hsCategoryBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.2 },

  hsVerifiedBadge: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  hsVerifiedText: { color: '#FFF', fontSize: 10, fontWeight: '800', marginLeft: 4 },

  hsPremiumCardContent: { padding: 16 },
  hsTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  hsPremiumTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5, flex: 1, marginRight: 10 },
  hsRatingBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  hsRatingText: { fontSize: 12, fontWeight: '800', marginLeft: 4 },

  hsMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  hsMetaText: { fontSize: 13, marginLeft: 6, flex: 1, lineHeight: 18 },

  distancePillOnImage: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  distancePillText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
});

export default memo(SalonCard, (prev, next) => {
  return (
    prev.name === next.name &&
    prev.rating === next.rating &&
    prev.address === next.address &&
    prev.image === next.image &&
    prev.isAvailable === next.isAvailable &&
    prev.todaysBookings === next.todaysBookings &&
    prev.listingTier === next.listingTier &&
    prev.distance === next.distance &&
    prev.isVerified === next.isVerified &&
    prev.isPriority === next.isPriority
  );
});
