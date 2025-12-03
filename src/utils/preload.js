/**
 * Preload utilities for critical routes and resources
 */

/**
 * Preload a route component
 * @param {string} routePath - The route path to preload
 */
export function preloadRoute(routePath) {
  // Map routes to their lazy-loaded components
  const routeMap = {
    '/pro-details': () => import('../pages/ProfessionalDetails'),
    '/book': () => import('../pages/BookingPage'),
    '/pro-dashboard': () => import('../pages/ProDashboard'),
    '/chat': () => import('../pages/ChatPage'),
    '/my-messages': () => import('../pages/MyMessages'),
    '/my-bookings': () => import('../pages/MyBookings'),
    '/my-favorites': () => import('../pages/MyFavorites'),
    '/pro-onboarding': () => import('../ProOnboarding'),
  };

  const routeKey = Object.keys(routeMap).find((key) => routePath.startsWith(key));
  
  if (routeKey && routeMap[routeKey]) {
    // Preload the route
    routeMap[routeKey]().catch(() => {
      // Silently fail if preload fails
    });
  }
}

/**
 * Preload critical routes on page load
 */
export function preloadCriticalRoutes() {
  // Preload most commonly accessed routes
  const criticalRoutes = [
    '/pro-details',
    '/book',
    '/my-bookings',
    '/pro-dashboard',
  ];

  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload = (callback) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 2000);
    }
  };

  schedulePreload(() => {
    criticalRoutes.forEach((route) => {
      preloadRoute(route);
    });
  });
}

/**
 * Prefetch route on link hover
 * @param {string} href - The href to prefetch
 */
export function prefetchOnHover(href) {
  if (!href || href === '/') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

