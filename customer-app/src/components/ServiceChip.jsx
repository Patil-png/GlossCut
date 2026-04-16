import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Layout } from '../theme/layout';
import { LinearGradient } from 'expo-linear-gradient';

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

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.85}>
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
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
                size={22}
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
            Typography.TAG_BADGE,
            styles.label,
            { color: active ? Colors.TEXT_PRIMARY : Colors.TEXT_SECONDARY },
          ]}
        >
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 14,
    width: 88,
    height: 88,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    // Multi-layered professional shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
    paddingTop: 8, // Reduced from 12 for better centering in square
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  iconBoxActive: {
    backgroundColor: Colors.CTA_BUTTON + '15', // Subtle tint for active
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    textAlign: 'center',
    letterSpacing: -0.2,
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
