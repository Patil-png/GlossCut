import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GlossCutLogo = require('../../assets/image-removebg-preview.png');

const PromoCard = ({ title, discount, subtext, onClaim, style, isFullWidth }) => {
  return (
    <View style={[
      styles.container, 
      isFullWidth && { width: SCREEN_WIDTH - 32, marginHorizontal: 16 },
      style
    ]}>
      {/* Decorative blurred circle */}
      <View style={styles.blurCircle} />
      
      {/* Left content side */}
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>LIMITED OFFER</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.discount}>{discount} OFF</Text>
        <Text style={styles.subtext}>{subtext}</Text>
        
        <TouchableOpacity style={styles.claimBtn} onPress={onClaim}>
          <Text style={styles.claimText}>Claim Now</Text>
        </TouchableOpacity>
      </View>

      {/* Right side Logo */}
      <View style={styles.logoContainer}>
        <Image source={GlossCutLogo} style={styles.logo} resizeMode="contain" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(200,240,58,0.2)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    height: 170, // Consistent height for the section
  },
  blurCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.LIME_PRIMARY,
    opacity: 0.05,
    top: -50,
    right: -50,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  badge: {
    backgroundColor: 'rgba(200,240,58,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: Colors.LIME_PRIMARY,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: Colors.WHITE,
    fontSize: Typography.FONT_SIZE_SUBTITLE,
    fontWeight: '800',
  },
  discount: {
    color: Colors.LIME_PRIMARY,
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 2,
  },
  subtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 12,
  },
  claimBtn: {
    backgroundColor: Colors.LIME_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  claimText: {
    color: Colors.CHARCOAL,
    fontWeight: '700',
    fontSize: 12,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'white',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.LIME_PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: '120%',
    height: '120%',
  },
});

export default PromoCard;
