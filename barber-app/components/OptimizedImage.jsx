import React, { useState, forwardRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

/**
 * <OptimizedImage />
 * * A wrapper around expo-image that loads images directly from the website domain
 * * FREE fetching - no R2 processing or signed URLs
 */
const OptimizedImage = forwardRef(function OptimizedImage({
  source,        // The path (e.g., "barber-cards/shop1.jpg")
  style,         // Your styles (width, height, etc.)
  version,       // Optional: Pass a timestamp to force update (e.g., Date.now())
  contentFit = 'cover',
  children,      // Support children like ImageBackground
  ...props
}, ref) {
  const [isLoading, setIsLoading] = useState(true);

  // FREE fetching - use source directly without any processing
  const getDirectUrl = (path) => {
    if (!path) return null;

    console.log('🔥 FREE IMAGE FETCH (Barber App): Loading image directly:', path);

    // Handle versioning if provided
    if (version && typeof path === 'string') {
      return path.includes('?') ? `${path}&v=${version}` : `${path}?v=${version}`;
    }

    return path;
  };

  const imageUrl = getDirectUrl(source);

  return (
    <View style={[styles.container, style]}>
      <Image
        style={[StyleSheet.absoluteFill, style]}
        source={imageUrl}
        contentFit={contentFit}
        // Allow Cloudflare CDN caching (no local device caching)
        transition={200} // Smooth fade in
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        {...props}
      />

      {/* Render children on top of the image (like ImageBackground) */}
      {children}

      {/* 4. Loading Placeholder (Better UX) */}
      {isLoading && !children && (
        <View style={[styles.loadingContainer, style]}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}
    </View>
  );
});

export default OptimizedImage;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden', // Keeps border radius clean
    backgroundColor: '#f0f0f0', // Grey background while loading
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
