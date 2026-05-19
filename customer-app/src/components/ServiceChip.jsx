import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Layout } from '../theme/layout';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const ServiceChip = ({ title, Icon, active, onPress, colorVariant = 'white', PremiumIcon, autoAnimate, entranceDelay = 0 }) => {
  const iconRef = React.useRef(null);

  React.useEffect(() => {
    if (autoAnimate && iconRef.current?.animate) {
      const timeout = setTimeout(() => {
        iconRef.current?.animate?.();
      }, entranceDelay);
      return () => clearTimeout(timeout);
    }
  }, [autoAnimate]);

  const handlePress = () => {
    if (iconRef.current?.animate) {
      iconRef.current.animate();
    }
    if (onPress) onPress();
  };

  const isAI = title === 'AI Style' || title === 'Face AI';

  // Dynamic light effect colors based on variant
  const getGlowColor = () => {
    switch (colorVariant) {
      case 'lime': return '#C8FF00';
      case 'green': return '#2ECC71';
      case 'blue': return '#3498DB';
      case 'orange': return '#E67E22';
      case 'search': return '#FFFFFF';
      default: return '#FFFFFF';
    }
  };

  const glowColor = getGlowColor();

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.85}>
      <View style={[styles.glowLayer, { shadowColor: glowColor }]} />
      <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="light" style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(249, 250, 251, 0.85)']}
          style={styles.cardGradient}
        >
          <View
            style={[
              styles.iconBox,
              active && styles.iconBoxActive,
            ]}
          >
            {PremiumIcon ? (
              <PremiumIcon ref={iconRef} active={active} />
            ) : (
              Icon && (
                <Icon
                  size={24}
                  color={active ? Colors.TEXT_ON_DARK : Colors.TEXT_PRIMARY}
                  strokeWidth={2}
                />
              )
            )}

            {isAI && (
              <View style={styles.aiBadge}>
                <Text style={styles.aiText}>AI</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.label,
              { color: active ? Colors.TEXT_PRIMARY : Colors.TEXT_SECONDARY },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 96,
    height: 96,
    borderRadius: 24,
    marginHorizontal: 4,
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cardGradient: {
    flex: 1,
    paddingTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  iconBoxActive: {
    backgroundColor: 'rgba(200, 255, 0, 0.15)',
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    textAlign: 'center',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    paddingHorizontal: 4
  },
  aiBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.CTA_BUTTON,
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    zIndex: 2
  },
  aiText: {
    color: Colors.TEXT_ON_DARK,
    fontSize: 7,
    fontFamily: 'DMSans_700Bold'
  }
});

export default ServiceChip;
