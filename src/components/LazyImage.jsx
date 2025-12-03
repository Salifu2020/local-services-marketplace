import React, { useState, useRef, useEffect } from 'react';

/**
 * Lazy-loaded image component with intersection observer
 * Only loads images when they're about to enter the viewport
 */
function LazyImage({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3C/svg%3E',
  fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EImage not found%3C/text%3E%3C/svg%3E',
  ...props
}) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    let observer;
    let didCancel = false;

    if (imgRef.current && imageSrc === placeholder) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // When image is about to enter viewport, start loading
            if (!didCancel && (entry.isIntersecting || entry.intersectionRatio > 0)) {
              const img = new Image();
              img.src = src;
              
              img.onload = () => {
                if (!didCancel) {
                  setImageSrc(src);
                  setIsLoaded(true);
                }
              };
              
              img.onerror = () => {
                if (!didCancel) {
                  setImageSrc(fallback);
                  setHasError(true);
                }
              };

              // Stop observing once we start loading
              if (imgRef.current) {
                observer.unobserve(imgRef.current);
              }
            }
          });
        },
        {
          // Start loading when image is 50px away from viewport
          rootMargin: '50px',
        }
      );

      observer.observe(imgRef.current);
    }

    return () => {
      didCancel = true;
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, placeholder, fallback, imageSrc]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-50'} transition-opacity duration-300`}
      loading="lazy"
      {...props}
    />
  );
}

export default LazyImage;

