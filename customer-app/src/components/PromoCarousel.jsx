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
  { id: '1', title: '+ FREE Service', discount: '50%', subtext: 'Only for new bookings today' },
  { id: '2', title: 'Luxury Spa Mask', discount: '30%', subtext: 'Weekend special voucher' },
  { id: '3', title: 'Beard Grooming', discount: '40%', subtext: 'Valid for first-time users' },
  { id: '4', title: 'Hair Coloring', discount: '₹200', subtext: 'Cashback on your next visit' },
  { id: '5', title: 'Full Salon Package', discount: '20%', subtext: 'Family discount available' },
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
        animated: true,
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
    itemVisiblePercentThreshold: 50,
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
        renderItem={({ item }) => (
          <View style={styles.slideFrame}>
            <PromoCard
              title={item.title}
              discount={item.discount}
              subtext={item.subtext}
              onClaim={() => {}}
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
            extrapolate: 'clamp',
          });
          
          const scale = scrollValue.interpolate({
            inputRange: [
              SCREEN_WIDTH * (i - 1),
              SCREEN_WIDTH * i,
              SCREEN_WIDTH * (i + 1),
            ],
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { 
                  opacity,
                  transform: [{ scale }],
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
  },
  slideFrame: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
    backgroundColor: '#C8F03A', // Direct LIME color for reliability
  },
});

export default PromoCarousel;
