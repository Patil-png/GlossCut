const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = withNativeWind(getDefaultConfig(__dirname), { input: "./global.css" });

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'react-native-reanimated': path.resolve(__dirname, 'mocks/react-native-reanimated.js'),
};

module.exports = config;
