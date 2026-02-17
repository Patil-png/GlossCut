export default {
    createAnimatedComponent: (component) => component,
    View: 'View',
    Text: 'Text',
    Image: 'Image',
    ScrollView: 'ScrollView',
    FlatList: 'FlatList',
    addWhitelistedNativeProps: () => { },
    addWhitelistedUIProps: () => { },
};

export const runOnUI = (fn) => fn;
export const useSharedValue = (v) => ({ value: v });
export const useAnimatedStyle = () => ({});
export const useAnimatedProps = () => ({});
export const useDerivedValue = (v) => ({ value: v });
export const useAnimatedGestureHandler = () => ({});
export const useAnimatedScrollHandler = () => ({});
export const useAnimatedRef = () => ({ current: null });
export const useWorkletCallback = (fn) => fn;
export const createAnimatedComponent = (c) => c;
export const withTiming = (toValue) => toValue;
export const withSpring = (toValue) => toValue;
export const withDecay = () => 0;
export const withDelay = (_, animation) => animation;
export const withSequence = (...animations) => animations[animations.length - 1];
export const withRepeat = (animation) => animation;
export const Easing = {
    linear: (t) => t,
    ease: (t) => t,
    quad: (t) => t,
    cubic: (t) => t,
    poly: (t) => t,
    sin: (t) => t,
    circle: (t) => t,
    exp: (t) => t,
    elastic: (t) => t,
    back: (t) => t,
    bounce: (t) => t,
    bezier: (t) => t,
    in: (t) => t,
    out: (t) => t,
    inOut: (t) => t,
};
