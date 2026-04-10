import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

const PromoCard = ({ title, discount, subtext, onClaim }) => {
  return (
    <View style={styles.container}>
      {/* Decorative blurred circle */}
      <View style={styles.blurCircle} />
      
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✦ LIMITED OFFER</Text>
        </View>
        
        <Text style={[Typography.HERO, { color: Colors.TEXT_ON_DARK, fontSize: 24, lineHeight: 26, marginTop: 8 }]}>
          {discount} OFF
        </Text>
        
        <Text style={[Typography.FONT_BOLD, { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }]}>
          {title}
        </Text>
        
        <Text style={[Typography.META, { color: 'rgba(255,255,255,0.3)', marginTop: 4 }]}>
          {subtext}
        </Text>
        
        <TouchableOpacity style={styles.cta} onPress={onClaim} activeOpacity={0.8}>
          <Text style={[Typography.CTA, { color: Colors.TEXT_ON_LIME }]}>
            Claim Now →
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Right side Monogram */}
      <View style={styles.monogram}>
        <Text style={[Typography.FONT_BLACK, { color: Colors.LIME_PRIMARY, fontSize: 32, opacity: 0.8 }]}>GC</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(200,240,58,0.2)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  blurCircle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.LIME_PRIMARY,
    opacity: 0.12,
  },
  content: {
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.LIME_PRIMARY,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...Typography.FONT_MED,
    fontSize: 9,
    color: Colors.TEXT_ON_LIME,
    fontWeight: '900',
  },
  cta: {
    backgroundColor: Colors.LIME_PRIMARY,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  monogram: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(200,240,58,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(200,240,58,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  }
});

export default PromoCard;
