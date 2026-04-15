import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Easing, TouchableOpacity, Linking, Alert } from 'react-native';
import { ArrowRight, Check, MessageSquare } from 'lucide-react-native';
import { Layout } from '../src/theme/layout';

const SwipeButton = ({ onSwipeSuccess, customerPhoneNumber, title, containerStyles, titleStyles }) => {
  const [swiped, setSwiped] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const onLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const handleSwipeSuccess = () => {
    if (onSwipeSuccess) {
      onSwipeSuccess();
    }
    setSwiped(true);
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: containerWidth / 2 - 30, // Center the checkmark
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true}),
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true}),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true}),
      ]),
    ]).start();
  };

  const handleContact = () => {
    Alert.alert(
      "Contact Customer",
      "How would you like to contact the customer?",
      [
        {
          text: "Call",
          onPress: () => Linking.openURL(`tel:${customerPhoneNumber}`)},
        {
          text: "WhatsApp",
          onPress: () => Linking.openURL(`whatsapp://send?phone=${customerPhoneNumber}`)},
        {
          text: "Cancel",
          style: "cancel"},
      ]
    );
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !swiped,
      onPanResponderGrant: () => {
        Animated.spring(scale, { toValue: 1.1, friction: 4, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(Math.min(containerWidth - 60, Math.max(0, gestureState.dx)));
      },
      onPanResponderRelease: (_, gestureState) => {
        Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
        if (gestureState.dx > containerWidth * 0.7) {
          handleSwipeSuccess();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true}).start();
        }
      }})
  ).current;

  const animatedTextStyle = {
    opacity: translateX.interpolate({
      inputRange: [0, containerWidth * 0.5],
      outputRange: [1, 0],
      extrapolate: 'clamp'}),
    transform: [{
      translateX: translateX.interpolate({
        inputRange: [0, containerWidth * 0.7],
        outputRange: [0, 50],
        extrapolate: 'clamp'
      })
    }]
  };

  const successContainerStyle = {
    opacity: successOpacity,
    transform: [{ scale: successScale }]};

  return (
    <View style={[styles.container, containerStyles]}>
      <View style={styles.swipeContainer} onLayout={onLayout}>
        <View
          style={[
            styles.gradient,
            { backgroundColor: swiped ? '#1A1A1A' : '#FF4444' },
          ]}
        >
          <Animated.View
            style={[
              styles.arrowContainer,
              { transform: [{ translateX }, { scale }] },
              swiped && { opacity: 0 },
            ]}
            {...pan.panHandlers}
          >
            <ArrowRight size={24} color="#fff" />
          </Animated.View>

          {!swiped && (
            <Animated.Text style={[styles.swipeText, animatedTextStyle, titleStyles]}>
              {title}
            </Animated.Text>
          )}

          {swiped && (
            <Animated.View style={[styles.successContainer, successContainerStyle]}>
              <Check size={30} color="#fff" />
            </Animated.View>
          )}
        </View>
      </View>
      {!swiped && customerPhoneNumber && (
        <TouchableOpacity style={styles.chatButton} onPress={handleContact}>
          <MessageSquare size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20},
  swipeContainer: {
    height: 60,
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E8E7E2',
    ...Layout.noShadow,
  },
  gradient: {
    height: '100%',
    width: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center'},
  arrowContainer: {
    position: 'absolute',
    left: 5,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2},
  swipeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'},
  successContainer: {
    justifyContent: 'center',
    alignItems: 'center'},
  chatButton: {
    marginLeft: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    ...Layout.noShadow,
  },
});

export default SwipeButton;
