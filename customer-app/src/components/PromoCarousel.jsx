import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated
} from 'react-native';
import PromoCard from './PromoCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// PRESET DATA - Consolidating into one section to avoid confusion
const PROMO_DATA = [
  {
    id: '1',
    title: 'Live Slot Visibility',
    subtext: 'No more calling! See our digital "Live Board" of available times instantly.',
    badgeText: 'LIVE BOARD',
    buttonText: 'View Board'
  },
  {
    id: '2',
    title: 'Frictionless Booking',
    subtext: 'Booking a haircut is now as easy as ordering food on Zomato.',
    badgeText: 'ZOMATO-EASY',
    buttonText: 'Book Now'
  },
  {
    id: '3',
    title: 'Book From Anywhere',
    subtext: 'Access and book top professionals from anywhere across India.',
    badgeText: 'INDIA-WIDE',
    buttonText: 'Explore Pro'
  },
  {
    id: '4',
    title: 'Complete Shop Info',
    subtext: 'Live status: Is the shop open? Is your favorite professional available?',
    badgeText: 'REAL-TIME INFO',
    buttonText: 'Check Info'
  },
  {
    id: '5',
    title: 'Track Appointment',
    subtext: 'Get a Tracking ID to see exactly how much time is left for your slot.',
    badgeText: 'LIVE TRACKER',
    buttonText: 'Track Now'
  },
  {
    id: '6',
    title: 'Automated Reminders',
    subtext: 'Receive a call 10 mins before your slot. Relax, we\'ve got you.',
    badgeText: 'REMINDERS',
    buttonText: 'Be Ready'
  },
];

const AUTO_SCROLL_INTERVAL = 4000;

const PromoCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const startAutoScroll = () => {
    stopAutoScroll();
    timerRef.current = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= PROMO_DATA.length) {
        nextIndex = 0;
      }

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true
      });
      setCurrentIndex(nextIndex);
    }, AUTO_SCROLL_INTERVAL);
  };

  const stopAutoScroll = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [currentIndex]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollValue } } }],
    { useNativeDriver: false }
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  return (
    <View style={styles.sectionContainer}>
      <Animated.FlatList
        ref={flatListRef}
        data={PROMO_DATA}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        onScrollBeginDrag={stopAutoScroll}
        onScrollEndDrag={startAutoScroll}
        style={{ overflow: 'visible' }} // Allow shadows to bleed out
        contentContainerStyle={{ paddingVertical: 14 }} // Fine-tuned from 16 to 14
        renderItem={({ item }) => (
          <View style={styles.slideFrame}>
            <PromoCard
              title={item.title}
              discount={item.discount}
              subtext={item.subtext}
              badgeText={item.badgeText}
              buttonText={item.buttonText}
              onClaim={() => { }}
              isFullWidth={true}
            />
          </View>
        )}
      />

      {/* Integrated Pagination Dots */}
      <View style={styles.pagination}>
        {PROMO_DATA.map((_, i) => {
          const opacity = scrollValue.interpolate({
            inputRange: [
              SCREEN_WIDTH * (i - 1),
              SCREEN_WIDTH * i,
              SCREEN_WIDTH * (i + 1),
            ],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp'
          });

          const scale = scrollValue.interpolate({
            inputRange: [
              SCREEN_WIDTH * (i - 1),
              SCREEN_WIDTH * i,
              SCREEN_WIDTH * (i + 1),
            ],
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp'
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity,
                  transform: [{ scale }]
                }
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: 'transparent',
    marginBottom: 20,
    overflow: 'visible'
  },
  slideFrame: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0 // Compensation for FlatList padding
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
    backgroundColor: '#D8D7D2'
  }
});

export default PromoCarousel;
