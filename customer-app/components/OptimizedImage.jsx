import React, { useState, forwardRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const GlossCutImage = require("../assets/GlossCut.png");

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
  fallbackSrc,   // Fallback image source when main image fails
  ...props
}, ref) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // FREE fetching - use source directly without R2 processing
  const getDirectUrl = (path) => {
    if (!path) return null;

    // Use the source directly - no R2 conversion or signed URLs
    console.log('🔥 FREE IMAGE FETCH (Mobile): Loading image directly:', path);

    // Handle versioning if provided
    if (version && typeof path === 'string') {
      return path.includes('?') ? `${path}&v=${version}` : `${path}?v=${version}`;
    }

    return path;
  };

  const imageUrl = getDirectUrl(source);

  return (
    <View style={[styles.container, style]}>
      {/* Main Image or Fallback Image*/}
      <Image
        style={[StyleSheet.absoluteFill, style]}
        source={hasError ? (fallbackSrc || GlossCutImage) : imageUrl}
        contentFit={contentFit}
        // 3. The Magic Setting: "disk" means "Keep on phone forever"
        cachePolicy="disk"
        transition={200} // Smooth fade in
        onLoadStart={() => {
          if (!hasError) {
            setIsLoading(true);
            setHasError(false);
          }
        }}
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onError={(error) => {
          console.error("❌ Image failed to load:", hasError ? (fallbackSrc || GlossCutImage) : imageUrl, error);
          if (!hasError) {
            console.log('🔥 FALLBACK IMAGE (Mobile): Loading GlossCut image for failed src:', imageUrl);
            setHasError(true);
            setIsLoading(false);
          }
        }}
        {...props}
      />

      {/* 4. Loading Placeholder (Better UX) */}
      {isLoading && !hasError && (
        <View style={[styles.loadingContainer, style]}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}

      {/* Error State - Only show if no fallback available */}
      {hasError && !fallbackSrc && (
        <View style={[styles.errorContainer, style]}>
          <ActivityIndicator size="small" color="#ccc" />
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
