import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SalonCard = ({ name, rating, address, isAvailable, image, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      <View style={styles.imageArea}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <LinearGradient 
            colors={[Colors.LIME_PRIMARY, Colors.LIME_DARK]} 
            style={styles.image} 
          />
        )}
        
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.5)']} 
          style={styles.overlay} 
        />
        
        <View style={styles.badgeRow}>
          <View style={styles.ratingPill}>
            <Star size={10} color={Colors.LIME_PRIMARY} fill={Colors.LIME_PRIMARY} />
            <Text style={styles.ratingText}>{rating > 0 ? rating.toFixed(1) : "New"}</Text>
          </View>
          
          {isAvailable && (
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Open</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.infoArea}>
        <Text style={[Typography.CARD_TITLE, { marginBottom: 2 }]} numberOfLines={1}>{name}</Text>
        <Text style={[Typography.META, { marginBottom: 8 }]} numberOfLines={1}>{address}</Text>
        
        <View style={styles.bookButton}>
          <Text style={[Typography.FONT_BOLD, { fontSize: 10, color: Colors.LIME_DEEP }]}>Book</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 148,
    height: 210,
    backgroundColor: Colors.BG_CARD,
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.BORDER_CARD,
  },
  imageArea: {
    height: '55%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  badgeRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  ratingText: {
    ...Typography.FONT_BOLD,
    fontSize: 10,
    color: '#FFFFFF',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.SUCCESS,
  },
  statusText: {
    ...Typography.FONT_BOLD,
    fontSize: 9,
    color: Colors.SUCCESS,
  },
  infoArea: {
    padding: 10,
    height: '45%',
    justifyContent: 'space-between',
  },
  bookButton: {
    backgroundColor: 'rgba(200,240,58,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(200,240,58,0.4)',
    borderRadius: 8,
    paddingVertical: 4,
    alignItems: 'center',
  }
});

export default SalonCard;
