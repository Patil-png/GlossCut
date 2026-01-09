import React, { useState, useEffect, forwardRef } from 'react';

/**
 * Image component for main-website
 * Displays images directly from the website domain
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
    if (!src) {
      setIsLoading(false);
      return;
    }

    // Use the src directly without R2 signed URL logic - FREE fetching
    console.log('🔥 FREE IMAGE FETCH: Loading image directly from website domain:', src);
    setImageSrc(src);
    setIsLoading(false);
  }, [src]);

  const handleLoad = () => {
    console.log('✅ IMAGE LOADED SUCCESSFULLY: Free fetch completed for:', imageSrc);
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
      console.log('🔥 FALLBACK IMAGE: Loading fallback image:', fallbackSrc, 'for failed src:', src);
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
