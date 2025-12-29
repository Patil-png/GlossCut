import React, { useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

const CancelSwipeButton = ({ onSwipeSuccess, title, theme, backgroundColor, color }) => {
  const [swipeAnim] = useState(new Animated.Value(0));
  const [isSwiped, setIsSwiped] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx > 0 && gestureState.dx < 250) {
        swipeAnim.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 150) {
        setIsSwiped(true);
        onSwipeSuccess();
      }
      Animated.spring(swipeAnim, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    },
  });

  const animatedStyles = {
    transform: [{ translateX: swipeAnim }],
  };

  return (
    <View style={[styles.buttonContainer, { backgroundColor }]}>
      <Animated.View
        style={[styles.swipeable, animatedStyles]}
        {...panResponder.panHandlers}
      >
        <ArrowRight size={24} color={color} />
      </Animated.View>
      <Text style={[styles.buttonText, { color }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  swipeable: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CancelSwipeButton;
