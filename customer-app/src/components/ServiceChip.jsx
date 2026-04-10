import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
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

  const getGradient = () => {
    // Warm cream background to complement the sketch/doodle aesthetic
    return ['#FFFFFF', '#FAFAF8', '#F5F4F0'];
  };

  const handlePress = () => {
    if (iconRef.current?.animate) {
      iconRef.current.animate();
    }
    if (onPress) onPress();
  };

  const isAI = title === 'AI Style' || title === 'Face AI';

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress} 
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.iconBox,
          active && { borderWidth: 2, borderColor: Colors.LIME_DARK }
        ]}
      >
        {PremiumIcon ? (
          <PremiumIcon ref={iconRef} active={active} />
        ) : (
          Icon && <Icon size={24} color={active ? Colors.TEXT_ON_LIME : '#333'} strokeWidth={2.5} />
        )}
        
        {isAI && (
          <View style={styles.aiBadge}>
            <Text style={styles.aiText}>AI</Text>
          </View>
        )}
      </LinearGradient>
      <Text style={[
        Typography.FONT_SEMI,
        { fontSize: 10, marginTop: 6 },
        { color: active ? Colors.TEXT_PRIMARY : Colors.TEXT_MUTED }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 78,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.035)', // Ultra-subtle border for a 'simple' look
    position: 'relative',
    // Soft floating card shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  aiBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  aiText: {
    color: Colors.LIME_PRIMARY,
    fontSize: 8,
    fontWeight: '900',
  }
});

export default ServiceChip;
