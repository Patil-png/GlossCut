import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
// 1. IMPORT SAFE AREA HOOK
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import {
  ShoppingBag,
  History,
  Scissors,
  User,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- TabItem Component (unchanged from previous version) ---
const TabItem = ({ item, isActive, onPress, theme, dynamicStyles, user }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacityValue, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const IconComponent = item.icon;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={styles.tabContainer}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }], alignItems: 'center' }}>
        <Animated.View style={[
          styles.activePill,
          { 
            backgroundColor: isActive ? dynamicStyles.accentColor + '15' : 'transparent',
            opacity: opacityValue
          }
        ]} />

        <View style={styles.iconContainer}>
          {item.key === 'Profile' ? (
             <View style={[
               styles.profileWrapper, 
               isActive && { borderColor: dynamicStyles.accentColor, borderWidth: 2 }
             ]}>
              <Image
                source={
                    typeof user?.profilePicture === 'string' 
                    ? { uri: user.profilePicture } 
                    : (user?.profilePicture || require("../assets/GlossCut.png"))
                }
                style={styles.profileImage}
              />
            </View>
          ) : (
            <IconComponent
              size={24}
              color={isActive ? dynamicStyles.accentColor : theme.colors.textSecondary}
              fill={isActive ? dynamicStyles.accentColor : 'transparent'} 
            />
          )}
        </View>

        <Text style={[
          styles.navText,
          {
            color: isActive ? dynamicStyles.accentColor : theme.colors.textSecondary,
            fontWeight: isActive ? '700' : '500',
            marginTop: 4
          }
        ]}>
          {item.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- Main Component ---
const BottomNavBar = ({ navigation, activeScreen }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  
  // 2. GET DEVICE INSETS (This gives exact height of Home Indicator/Nav Bar)
  const insets = useSafeAreaInsets(); 

  const dynamicStyles = {
    containerBackground: {
      backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
      borderTopColor: isDark ? '#333' : 'rgba(0,0,0,0.05)',
    },
    accentColor: theme.colors.primary || '#E23744', 
    shadow: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.1,
      shadowRadius: 15,
      elevation: 10,
    }
  };

  const navItems = [
    { key: 'Home', icon: ShoppingBag, label: 'Home', screen: 'Home', onPress: () => navigation.navigate('Home') },
    { key: 'History', icon: History, label: 'History', screen: 'History', onPress: () => navigation.navigate('History') },
    { key: 'Book', icon: Scissors, label: 'Book', screen: 'BarberSearch', onPress: () => navigation.navigate('BarberSearch') },
    { key: 'Profile', icon: null, label: 'Profile', screen: 'Profile', onPress: () => navigation.navigate('Profile') },
  ];

  return (
    <View style={[
        styles.positionWrapper, 
        { 
            // 3. DYNAMIC BOTTOM POSITIONING
            // If insets.bottom > 0 (iPhone X or Android Gesture), use that + 10px spacing.
            // If insets.bottom is 0 (Old Android/iPhone SE), use 20px default spacing.
            bottom: insets.bottom > 0 ? insets.bottom + 10 : 20 
        }
    ]}>
        <View style={[
            styles.floatingNavBar, 
            dynamicStyles.containerBackground, 
            dynamicStyles.shadow
        ]}>
        {navItems.map((item) => (
            <TabItem
                key={item.key}
                item={item}
                isActive={activeScreen === item.screen}
                onPress={item.onPress}
                theme={theme}
                dynamicStyles={dynamicStyles}
                user={user}
            />
        ))}
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  positionWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    // Removed paddingBottom here because we handle it via 'bottom' prop above
  },
  floatingNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: width * 0.92,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30, // Increased slightly for softer look
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 50,
  },
  activePill: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    top: -5,
  },
  iconContainer: {
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  profileWrapper: {
    borderRadius: 14,
    padding: 2,
  },
  profileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  }
});

export default BottomNavBar;