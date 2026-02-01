module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // This line below is REQUIRED for the animations to work
      'react-native-reanimated/plugin',
    ],
    env: {
      production: {
        // plugins: ['transform-remove-console'], // Temporarily disabled for debugging
      },
    },
  };
};