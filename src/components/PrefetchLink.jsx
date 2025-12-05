import React from 'react';
import { Link } from 'react-router-dom';
import { prefetchOnHover, preloadRoute } from '../utils/preload';

/**
 * Enhanced Link component that prefetches routes on hover
 * Improves perceived performance by loading routes before user clicks
 */
function PrefetchLink({ to, children, onMouseEnter, ...props }) {
  const handleMouseEnter = (e) => {
    // Prefetch the route when user hovers
    if (to) {
      preloadRoute(to);
    }
    
    // Call original onMouseEnter if provided
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  return (
    <Link to={to} onMouseEnter={handleMouseEnter} {...props}>
      {children}
    </Link>
  );
}

export default PrefetchLink;


