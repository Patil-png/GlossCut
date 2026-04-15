import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Layout } from '../theme/layout';

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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 78},
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.BG_TAG,
    borderWidth: 0.5,
    borderColor: Colors.BORDER_CARD,
    position: 'relative',
    ...Layout.noShadow},
  iconBoxActive: {
    backgroundColor: Colors.CTA_BUTTON,
    borderColor: Colors.CTA_BUTTON},
  label: {
    marginTop: 6,
    fontSize: 10,
    textAlign: 'center'},
  aiBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.CTA_BUTTON,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1},
  aiText: {
    color: Colors.TEXT_ON_DARK,
    fontSize: 8,
    fontFamily: 'DMSans_700Bold'}});

export default ServiceChip;
