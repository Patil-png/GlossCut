import React, { useState, forwardRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

/**
 * <OptimizedImage />
 * * A wrapper around expo-image that enforces:
 * 1. Cloudflare Caching (via custom domain)
 * 2. Disk Caching (via expo-image policy)
 * 3. Cost Savings (prevents direct R2 access)
 */
const OptimizedImage = forwardRef(function OptimizedImage({
  source,        // The path (e.g., "barber-cards/shop1.jpg")
  style,         // Your styles (width, height, etc.)
  version,       // Optional: Pass a timestamp to force update (e.g., Date.now())
  contentFit = 'cover',
  ...props
}) {
  const [isLoading, setIsLoading] = useState(true);

  // 1. Enforce the "Money Saving" Domain
  // If the user passes a full URL, strip it. If they pass a path, use it.
  const getOptimizedUrl = (path) => {
    if (!path) return null;

    // If someone accidentally passes the R2.dev url, fix it
    if (path.includes('r2.dev')) {
      console.warn("⚠️ Cost Warning: You used a direct R2 link. Swapping to Cached Domain.");
      const cleanPath = path.split('.r2.dev/')[1];
      return `https://images.glosscut.com/${cleanPath}`;
    }

    // If it's already the correct domain, return it
    if (path.includes('images.glosscut.com')) return path;

    // Otherwise, assume it's just a filename (e.g., "barber/1.jpg")
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    let finalUrl = `https://images.glosscut.com/${cleanPath}`;

    // 2. Handle Versioning (Cache Busting)
    if (version) {
      finalUrl += `?v=${version}`;
    }

    return finalUrl;
  };

  const imageUrl = getOptimizedUrl(source);

  return (
    <View style={[styles.container, style]}>
      <Image
        style={[StyleSheet.absoluteFill, style]}
        source={imageUrl}
        contentFit={contentFit}
        // 3. The Magic Setting: "disk" means "Keep on phone forever"
        cachePolicy="disk"
        transition={200} // Smooth fade in
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        {...props}
      />

      {/* 4. Loading Placeholder (Better UX) */}
      {isLoading && (
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
