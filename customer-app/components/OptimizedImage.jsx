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
  const [hasError, setHasError] = useState(false);

  // 1. Enforce the "Money Saving" Domain
  // If the user passes a full URL, strip it. If they pass a path, use it.
  const getOptimizedUrl = (path) => {
    if (!path) return null;

    // If someone accidentally passes the R2.dev url, fix it
    if (path.includes('r2.dev')) {
      // TEMPORARY WORKAROUND: Use direct R2.dev URL until DNS is fixed
      console.warn("⚠️ TEMPORARY: Using direct R2.dev URL (high cost) until images.glosscut.com DNS is fixed");
      let finalUrl = path;

      // 2. Handle Versioning (Cache Busting)
      if (version) {
        finalUrl += `?v=${version}`;
      }

      console.log("🔄 Using direct R2 URL (temporary):", finalUrl);
      return finalUrl;

      // FUTURE: Uncomment when DNS is fixed
      // console.warn("⚠️ Cost Warning: You used a direct R2 link. Swapping to Cached Domain.");
      // const cleanPath = path.split('.r2.dev/')[1];
      // let finalUrl = `https://images.glosscut.com/${cleanPath}`;
      // if (version) {
      //   finalUrl += `?v=${version}`;
      // }
      // console.log("🔄 Converted R2 URL:", path, "→", finalUrl);
      // return finalUrl;
    }

    // If it's already the correct domain, return it
    if (path.includes('images.glosscut.com')) {
      // TEMPORARY: Convert back to R2.dev URL since DNS isn't working
      console.warn("⚠️ TEMPORARY: Converting images.glosscut.com back to R2.dev URL");
      const pathPart = path.replace('https://images.glosscut.com/', '');
      let finalUrl = `https://pub-260d10bc28ca4ff894255965492ab1dd.r2.dev/${pathPart}`;

      if (version && !finalUrl.includes('?v=')) {
        finalUrl += `?v=${version}`;
      }

      console.log("🔄 Converted back to R2.dev:", path, "→", finalUrl);
      return finalUrl;

      // FUTURE: Uncomment when DNS is fixed
      // let finalUrl = path;
      // if (version && !path.includes('?v=')) {
      //   finalUrl += `?v=${version}`;
      // }
      // return finalUrl;
    }

    // If it's another full URL (like from API), try to extract the path
    if (path.startsWith('http')) {
      console.log("🌐 Processing full URL:", path);
      // This might be a local API URL, try to convert it
      // Check for both /uploads/ and /Uploads/ (case insensitive)
      const urlParts = path.split(/\/[Uu]ploads\//);
      if (urlParts.length > 1) {
        let finalUrl = `https://images.glosscut.com/uploads/${urlParts[1]}`;
        if (version) {
          finalUrl += `?v=${version}`;
        }
        console.log("🔄 Converted API URL:", path, "→", finalUrl);
        return finalUrl;
      }
      // Return as-is if we can't process it
      return path;
    }

    // Otherwise, assume it's just a filename (e.g., "barber/1.jpg")
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    let finalUrl = `https://images.glosscut.com/${cleanPath}`;

    // 2. Handle Versioning (Cache Busting)
    if (version) {
      finalUrl += `?v=${version}`;
    }

    console.log("📁 Processing path:", path, "→", finalUrl);
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
        onLoadStart={() => {
          setIsLoading(true);
          setHasError(false);
        }}
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onError={(error) => {
          console.error("❌ Image failed to load:", imageUrl, error);
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />

      {/* 4. Loading Placeholder (Better UX) */}
      {isLoading && !hasError && (
        <View style={[styles.loadingContainer, style]}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}

      {/* Error State */}
      {hasError && (
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
