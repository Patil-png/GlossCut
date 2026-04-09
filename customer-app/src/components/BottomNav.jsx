import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Home, Search, Calendar, User } from 'lucide-react-native';

const BottomNav = ({ activeTab, onTabPress }) => {
  const tabs = [
    { id: 'Home', icon: Home, label: 'Home' },
    { id: 'Search', icon: Search, label: 'Search' },
    { id: 'Bookings', icon: Calendar, label: 'Bookings' },
    { id: 'Profile', icon: User, label: 'Profile' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <TouchableOpacity 
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Icon 
                  size={24} 
                  color={isActive ? Colors.LIME_PRIMARY : '#FFFFFF'} 
                  style={{ opacity: isActive ? 1 : 0.3, transform: [{ scale: isActive ? 1.1 : 1 }] }}
                  strokeWidth={2.5}
                />
                {isActive && <View style={styles.activeDot} />}
              </View>
              {isActive && (
                <Text style={styles.tabLabel}>{tab.label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.CHARCOAL,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 20, // Adjustment for safe area
    height: 85,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 10,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.LIME_PRIMARY,
  },
  tabLabel: {
    ...Typography.FONT_BOLD,
    fontSize: 10,
    color: Colors.LIME_ON_DARK,
    marginTop: 4,
  }
});

export default BottomNav;
