import React, { useRef, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Star, MapPin, Zap, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OptimizedImage from '../../components/OptimizedImage';

// --- PULSING DOT COMPONENT ---
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
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
      )}
      <View style={[styles.staticDot, { backgroundColor: isAvailable ? '#10B981' : '#CBD5E1' }]} />
    </View>
  );
};

// --- BOUNCY INTERACTION WRAPPER ---
const BouncyCard = ({ children, onPress, activeOpacity = 0.9 }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 100,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        {children}
      </Animated.View>
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
  onPress 
}) => {
  
  const fullness = Math.min((todaysBookings / maxAppointments) * 100, 100);
  const isHighDemand = fullness > 85;
  const slotsLeft = Math.max(0, maxAppointments - todaysBookings);

  return (
    <BouncyCard onPress={onPress}>
      <View style={styles.container}>
        {/* HERO IMAGE AREA */}
        <View style={styles.imageArea}>
          <OptimizedImage 
            source={image} 
            style={styles.image} 
            contentFit="cover"
          />
          <LinearGradient 
            colors={['transparent', 'rgba(0,0,0,0.4)']} 
            style={styles.overlay} 
          />
          
          {/* TOP RIGHT: STATUS BADGE */}
          <View style={styles.statusBadge}>
            <PulseDot isAvailable={isAvailable} />
            <Text style={styles.statusText}>{isAvailable ? 'Open' : 'Closed'}</Text>
          </View>

          {/* TOP LEFT: PREMIUM BADGES */}
          <View style={styles.badgeColumn}>
            {listingTier === 'premium' && (
              <View style={styles.featuredBadge}>
                <Sparkles size={10} color="#FFF" />
                <Text style={styles.featuredText}>FEATURED</Text>
              </View>
            )}
            {todaysBookings >= 5 && (
              <View style={styles.trendingBadge}>
                <Text style={styles.trendingText}>🔥 Popular</Text>
              </View>
            )}
          </View>

          {/* CATEGORY OVERLAY */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
          </View>

          {/* DISTANCE PILL OVERLAY */}
          {distance && (
            <View style={styles.distanceBadge}>
              <MapPin size={10} color="#FFF" />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          )}
        </View>
        
        {/* INFO AREA */}
        <View style={styles.infoArea}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <View style={styles.ratingBox}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
              <Text style={styles.ratingText}>{rating > 0 ? rating.toFixed(1) : 'New'}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color={Colors.TEXT_MUTED} />
            <Text style={styles.address} numberOfLines={1}>{address}</Text>
          </View>
        </View>
      </View>
    </BouncyCard>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  imageArea: {
    height: 210,
    position: 'relative',
    backgroundColor: '#F8F9FA',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dotContainer: {
    width: 8,
    height: 8,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staticDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pulseCircle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    opacity: 0.4,
  },
  badgeColumn: {
    position: 'absolute',
    top: 10,
    left: 10,
    gap: 6,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featuredText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
    marginLeft: 3,
  },
  trendingBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendingText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  distanceText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  infoArea: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...Typography.FONT_BOLD,
    fontSize: 19,
    color: Colors.CHARCOAL,
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.5,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.CHARCOAL,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  address: {
    ...Typography.FONT_MED,
    fontSize: 11,
    color: Colors.TEXT_MUTED,
    flex: 1,
  },
  queueContainer: {
    marginBottom: 12,
  },
  queueHeader: {
    marginBottom: 4,
  },
  queueText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  bookBtn: {
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  bookBtnText: {
    fontSize: 11,
    fontWeight: '900',
  }
});

// Memoize for 100% Best Practice Performance
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
