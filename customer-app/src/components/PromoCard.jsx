import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Layout } from '../theme/layout';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GlossCutLogo = require('../../assets/image-removebg-preview.png');

const PromoCard = ({ title, discount, subtext, onClaim, style, isFullWidth, buttonText = "Claim Now", badgeText = "ADVANTAGE" }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onClaim}
      style={[
        styles.container,
        isFullWidth && { width: SCREEN_WIDTH - 32, marginHorizontal: 16 },
        style,
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#FDFEFE']}
        style={styles.cardGradient}
      >
        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          {discount && <Text style={styles.discount}>{discount} OFF</Text>}
          <Text style={styles.subtext}>{subtext}</Text>

          {onClaim && (
            <View style={styles.claimBtn}>
              <Text style={styles.claimText}>{buttonText}</Text>
            </View>
          )}
        </View>

        <View style={styles.logoContainer}>
          <Image source={GlossCutLogo} style={styles.logo} resizeMode="contain" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 180,
    // Top/Side Glow Shadow (Removed Bottom Shadow)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  content: {
    flex: 1,
    zIndex: 1
  },
  badge: {
    backgroundColor: Colors.BG_TAG,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Layout.radiusTag,
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  badgeText: {
    ...Typography.TAG_BADGE,
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.CTA_BUTTON, // Use accent color for badge
    letterSpacing: 0.8
  },
  title: {
    ...Typography.CARD_TITLE,
    fontSize: 20,
    color: '#1A1A1A', // Deeper black for luxury feel
    marginBottom: 4
  },
  discount: {
    ...Typography.STAT_LARGE,
    fontSize: 26,
    marginVertical: 2
  },
  subtext: {
    ...Typography.BODY,
    fontSize: 13,
    lineHeight: 18,
    color: '#666666', // Softer grey for subtext
    marginBottom: 16
  },
  claimBtn: {
    backgroundColor: Colors.CTA_BUTTON,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Layout.radiusButton,
    alignSelf: 'flex-start'
  },
  claimText: {
    ...Typography.BUTTON
  },
  logoContainer: {
    width: 88,
    height: 88,
    backgroundColor: '#FFFFFF',
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    // Premium Inner Glow Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    width: '80%',
    height: '80%'
  },
  cardGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
  }
});

export default PromoCard;
