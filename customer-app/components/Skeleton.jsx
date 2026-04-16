import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const Skeleton = ({ width: w, height: h, borderRadius: r = 8, style }) => {
    const shimmerValue = useSharedValue(0);

    useEffect(() => {
        shimmerValue.value = withRepeat(
            withTiming(1, { duration: 1200 }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            shimmerValue.value,
            [0, 1],
            [-w, w]
        );
        return {
            transform: [{ translateX }],
        };
    });

    return (
        <View
            style={[
                styles.skeletonContainer,
                { width: w, height: h, borderRadius: r },
                style,
            ]}
        >
            <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    skeletonContainer: {
        backgroundColor: '#E5E7EB', // Soft gray background
        overflow: 'hidden',
    },
});

export default Skeleton;
