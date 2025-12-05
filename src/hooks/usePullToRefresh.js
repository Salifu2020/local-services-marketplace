import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for pull-to-refresh functionality on mobile
 * @param {Function} onRefresh - Callback function to execute on refresh
 * @param {Object} options - Configuration options
 * @returns {Object} - State and handlers for pull-to-refresh
 */
export function usePullToRefresh(onRefresh, options = {}) {
  const {
    threshold = 80, // Distance in pixels to trigger refresh
    resistance = 2.5, // Resistance factor for pull
    disabled = false,
  } = options;

  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const elementRef = useRef(null);
  const isAtTop = useRef(false);

  useEffect(() => {
    if (disabled || !elementRef.current) return;

    const element = elementRef.current;
    let touchStartY = 0;
    let touchCurrentY = 0;
    let isTouching = false;

    const handleTouchStart = (e) => {
      // Check if user is at the top of the scrollable area
      isAtTop.current = element.scrollTop === 0;
      
      if (isAtTop.current) {
        touchStartY = e.touches[0].clientY;
        touchCurrentY = touchStartY;
        isTouching = true;
        startY.current = touchStartY;
        currentY.current = touchStartY;
      }
    };

    const handleTouchMove = (e) => {
      if (!isTouching || !isAtTop.current) return;

      touchCurrentY = e.touches[0].clientY;
      currentY.current = touchCurrentY;
      
      const deltaY = touchCurrentY - touchStartY;
      
      if (deltaY > 0 && isAtTop.current) {
        e.preventDefault(); // Prevent default scroll
        setIsPulling(true);
        
        // Apply resistance for smoother feel
        const distance = deltaY / resistance;
        setPullDistance(Math.min(distance, threshold * 1.5));
      } else {
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isTouching) return;
      
      isTouching = false;
      const finalDistance = pullDistance;
      
      if (finalDistance >= threshold && isAtTop.current) {
        // Trigger refresh
        setIsRefreshing(true);
        setPullDistance(threshold);
        
        // Execute refresh callback
        Promise.resolve(onRefresh()).finally(() => {
          setIsRefreshing(false);
          setIsPulling(false);
          setPullDistance(0);
        });
      } else {
        // Reset if not enough pull
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onRefresh, threshold, resistance, disabled, pullDistance]);

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    elementRef,
    pullProgress: Math.min(pullDistance / threshold, 1),
  };
}


