import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

const ServiceChip = ({ title, Icon, active, onPress, colorVariant = 'white' }) => {
  const getInactiveBg = () => {
    switch (colorVariant) {
      case 'lime': return '#F0F8E0';
      case 'pink': return '#FFF0F8';
      case 'green': return '#F0FFF0';
      case 'blue': return '#F0F8FF';
      case 'purple': return '#F5F0FF';
      case 'orange': return '#FFF5F0';
      default: return Colors.BG_CARD;
    }
  };

  const isAI = title === 'AI Style';

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconBox,
        { backgroundColor: active ? Colors.LIME_PRIMARY : getInactiveBg() },
        active && { borderWidth: 2, borderColor: Colors.LIME_DARK }
      ]}>
        {Icon && <Icon size={24} color={active ? Colors.TEXT_ON_LIME : Colors.CHARCOAL} strokeWidth={2.5} />}
        
        {isAI && (
          <View style={styles.aiBadge}>
            <Text style={styles.aiText}>AI</Text>
          </View>
        )}
      </View>
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
    width: 65,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.BORDER_LIGHT,
    position: 'relative',
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
