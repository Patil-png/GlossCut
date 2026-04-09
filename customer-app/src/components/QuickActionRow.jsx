import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { ChevronRight } from 'lucide-react-native';

const QuickActionRow = ({ title, subtitle, Icon, iconBg, iconColor, hasBadge, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        {Icon && <Icon size={20} color={iconColor} strokeWidth={2.5} />}
      </View>
      
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[Typography.FONT_BOLD, { fontSize: 13, color: Colors.TEXT_PRIMARY }]}>
            {title}
          </Text>
          {hasBadge && (
            <View style={styles.newBadge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
        </View>
        <Text style={[Typography.FONT_MED, { fontSize: 10, color: Colors.TEXT_MUTED, marginTop: 1 }]}>
          {subtitle}
        </Text>
      </View>
      
      <ChevronRight size={16} color="#CCCCCC" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    backgroundColor: Colors.BG_CARD,
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.BORDER_CARD,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newBadge: {
    backgroundColor: Colors.LIME_PRIMARY,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  badgeText: {
    ...Typography.FONT_BLACK,
    fontSize: 8,
    color: Colors.TEXT_ON_LIME,
  }
});

export default QuickActionRow;
