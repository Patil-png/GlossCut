import React, { useState, useEffect, forwardRef } from 'react';
import axios from 'axios';

/**
 * Image component for main-website
 * Handles Cloudflare R2 images with signed URLs for secure access
 */
const Image = forwardRef(({
  src,
  alt = '',
  className = '',
  style = {},
  fallbackSrc,
  onLoad,
  onError,
  ...props
}, ref) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!src) {
        setIsLoading(false);
        return;
      }

      // Check if this is a Cloudflare R2 URL that needs signing
      const isR2Url = src.includes('r2.dev') || src.includes('images.glosscut.com') || src.includes('/Uploads/');

      if (!isR2Url) {
        // For non-R2 URLs, use them directly
        setImageSrc(src);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch signed URL from backend
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/images/signed-url`, {
          params: { imageUrl: src }
        });

        if (response.data.success) {
          setImageSrc(response.data.signedUrl);
        } else {
          console.error('Failed to get signed URL:', response.data.message);
          setHasError(true);
        }
      } catch (error) {
        console.error('Error fetching signed URL:', error);
        // Fallback to original URL if signed URL fails
        setImageSrc(src);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignedUrl();
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (onError) onError();
  };

  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-300 ${className}`}
        style={style}
        {...props}
      >
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (hasError || !imageSrc) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          style={style}
          onError={() => {
            // If fallback also fails, show text
            setHasError(true);
          }}
          {...props}
        />
      );
    }
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={style}
        {...props}
      >
        <div className="text-gray-500 text-sm">
          {alt || 'Image not available'}
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
});

export default Image;
