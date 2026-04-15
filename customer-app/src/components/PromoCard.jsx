import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Layout } from '../theme/layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GlossCutLogo = require('../../assets/image-removebg-preview.png');

const PromoCard = ({ title, discount, subtext, onClaim, style, isFullWidth }) => {
  return (
    <View
      style={[
        styles.container,
        isFullWidth && { width: SCREEN_WIDTH - 32, marginHorizontal: 16 },
        style,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>LIMITED OFFER</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.discount}>{discount} OFF</Text>
        <Text style={styles.subtext}>{subtext}</Text>

        <TouchableOpacity style={styles.claimBtn} onPress={onClaim} activeOpacity={0.85}>
          <Text style={styles.claimText}>Claim Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logoContainer}>
        <Image source={GlossCutLogo} style={styles.logo} resizeMode="contain" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.BG_CARD,
    borderRadius: Layout.radiusCard,
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.BORDER_CARD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 170,
    ...Layout.noShadow},
  content: {
    flex: 1,
    zIndex: 1},
  badge: {
    backgroundColor: Colors.BG_TAG,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Layout.radiusTag,
    alignSelf: 'flex-start',
    marginBottom: 8},
  badgeText: {
    ...Typography.TAG_BADGE,
    fontSize: 9,
    letterSpacing: 0.5},
  title: {
    ...Typography.CARD_TITLE,
    marginBottom: 4},
  discount: {
    ...Typography.STAT_LARGE,
    fontSize: 26,
    marginVertical: 2},
  subtext: {
    ...Typography.BODY,
    marginBottom: 12},
  claimBtn: {
    backgroundColor: Colors.CTA_BUTTON,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Layout.radiusButton,
    alignSelf: 'flex-start'},
  claimText: {
    ...Typography.BUTTON},
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.BG_IMAGE_PLACEHOLDER,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.BORDER_CARD},
  logo: {
    width: '120%',
    height: '120%'}});

export default PromoCard;
