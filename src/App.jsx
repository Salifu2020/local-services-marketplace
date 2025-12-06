import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { auth, db, appId } from './firebase';
import './i18n/config'; // Initialize i18n
import { signInAnonymously, signInWithCustomToken, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { ToastProvider } from './context/ToastContext';
import { LoadingProvider } from './context/LoadingContext';
import { ThemeProvider } from './context/ThemeContext';
import NotificationBell from './components/NotificationBell';
import Logo from './components/Logo';
import { useFavorites } from './hooks/useFavorites';
import { mockGeocode as mockGeocodeUtil } from './utils/geocoding';
import { setSentryUser } from './sentry';
import { ProfessionalCardSkeleton } from './components/Skeleton';
import RouteLoading from './components/RouteLoading';
import { preloadCriticalRoutes } from './utils/preload';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import PullToRefresh from './components/PullToRefresh';
import { useMobileKeyboard } from './hooks/useMobileKeyboard';
import SearchFilters from './components/SearchFilters';
import VerificationBadges, { CompactVerificationBadges } from './components/VerificationBadges';
import { getReferralCodeFromURL, processReferralCode } from './utils/referral';
import LanguageSelector from './components/LanguageSelector';
import ThemeToggle from './components/ThemeToggle';
import { useTranslation } from 'react-i18next';
import RouteGuard from './components/RouteGuard';
import { getUserRole, canAccessProfessionalFeatures } from './utils/roles';
import { isCurrentUserAdmin } from './utils/admin';

// Lazy load route components for code splitting
const ProOnboarding = lazy(() => import('./ProOnboarding'));
const ProfessionalDetails = lazy(() => import('./pages/ProfessionalDetails'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const ProDashboard = lazy(() => import('./pages/ProDashboard'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const MyMessages = lazy(() => import('./pages/MyMessages'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const MyFavorites = lazy(() => import('./pages/MyFavorites'));
const MyProfile = lazy(() => import('./pages/MyProfile'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const AdminDisputeDashboard = lazy(() => import('./pages/AdminDisputeDashboard'));
const MyDisputes = lazy(() => import('./pages/MyDisputes'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate the distance between two geographical points using the Haversine formula.
 * Returns the distance in kilometers (km).
 * 
 * @param {number} lat1 - Latitude of the first point
 * @param {number} lon1 - Longitude of the first point
 * @param {number} lat2 - Latitude of the second point
 * @param {number} lon2 - Longitude of the second point
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  // Radius of Earth in kilometers
  const R = 6371;

  // Convert latitude and longitude from degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in kilometers
  const distance = R * c;

  return distance;
}

/**
 * Helper function to convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Export utilities for use in other components if needed
export { haversineDistance };
export { mockGeocodeUtil as mockGeocode };

// Navigation component
function Navigation() {
  const location = useLocation();
  const isOnboarding = location.pathname === '/pro-onboarding';
  const { favorites } = useFavorites();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfessional, setIsProfessional] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const checkRole = async () => {
      const user = auth.currentUser;
      if (!user) {
        setUserRole(null);
        setIsAdmin(false);
        setIsProfessional(false);
        return;
      }

      // Check admin status
      const adminStatus = await isCurrentUserAdmin();
      setIsAdmin(adminStatus);

      // Get user role
      const role = await getUserRole();
      setUserRole(role);
      setIsProfessional(role === 'professional' || role === 'admin');
    };

    checkRole();
    
    // Re-check when auth state changes
    const unsubscribe = onAuthStateChanged(auth, checkRole);
    return () => unsubscribe();
  }, []);

  if (isOnboarding) {
    return null; // Don't show nav on onboarding page
  }

  return (
    <nav className="bg-amber-800 dark:bg-slate-800 shadow-sm border-b border-amber-900 dark:border-slate-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo link={true} size="md" className="text-white" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <ThemeToggle />
            <LanguageSelector />
            <Link
              to="/"
              className="px-3 py-2 rounded-md text-sm font-medium text-white dark:text-slate-200 hover:text-amber-100 dark:hover:text-white hover:bg-amber-900 dark:hover:bg-slate-700 transition-colors"
            >
              Find a Pro
            </Link>
            <Link
              to="/dashboard"
              className="px-3 py-2 rounded-md text-sm font-medium text-white dark:text-slate-200 hover:text-amber-100 dark:hover:text-white hover:bg-amber-900 dark:hover:bg-slate-700 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/my-bookings"
              className="px-3 py-2 rounded-md text-sm font-medium text-white dark:text-slate-200 hover:text-amber-100 dark:hover:text-white hover:bg-amber-900 dark:hover:bg-slate-700 transition-colors"
            >
              My Bookings
            </Link>
            <Link
              to="/my-messages"
              className="px-3 py-2 rounded-md text-sm font-medium text-white dark:text-slate-200 hover:text-amber-100 dark:hover:text-white hover:bg-amber-900 dark:hover:bg-slate-700 transition-colors"
            >
              My Messages
            </Link>
            <Link
              to="/my-favorites"
              className="px-3 py-2 rounded-md text-sm font-medium text-white hover:text-amber-100 hover:bg-amber-900 transition-colors relative"
            >
              My Favorites
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {favorites.length > 99 ? '99+' : favorites.length}
                </span>
              )}
            </Link>
            <Link
              to="/my-profile"
              className="px-3 py-2 rounded-md text-sm font-medium text-white dark:text-slate-200 hover:text-amber-100 dark:hover:text-white hover:bg-amber-900 dark:hover:bg-slate-700 transition-colors"
            >
              {t('nav.myProfile')}
            </Link>
            <Link
              to="/about"
              className="px-3 py-2 rounded-md text-sm font-medium text-white dark:text-slate-200 hover:text-amber-100 dark:hover:text-white hover:bg-amber-900 dark:hover:bg-slate-700 transition-colors"
            >
              About
            </Link>
            {/* Only show Pro Dashboard link to professionals and admins */}
            {isProfessional && (
              <Link
                to="/pro-dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-white dark:text-slate-200 hover:text-amber-100 dark:hover:text-white hover:bg-amber-900 dark:hover:bg-slate-700 transition-colors"
              >
                {t('nav.proDashboard')}
              </Link>
            )}
            {/* Only show Admin Dashboard link to admins */}
            {isAdmin && (
              <Link
                to="/admin-dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-white dark:text-slate-200 hover:text-amber-100 dark:hover:text-white hover:bg-amber-900 dark:hover:bg-slate-700 transition-colors"
              >
                {t('nav.adminDashboard')}
              </Link>
            )}
            <NotificationBell />
            {auth.currentUser && !auth.currentUser.isAnonymous ? (
              <button
                onClick={async () => {
                  try {
                    await signOut(auth);
                    // After sign out, sign in anonymously as guest
                    await signInAnonymously(auth);
                  } catch (error) {
                    console.error('Sign out error:', error);
                  }
                }}
                className="px-3 py-2 rounded-md text-sm font-medium text-white dark:text-slate-200 hover:text-amber-100 dark:hover:text-white hover:bg-amber-900 dark:hover:bg-slate-700 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white dark:text-slate-200 hover:text-amber-100 dark:hover:text-white hover:bg-amber-900 dark:hover:bg-slate-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
            {/* Only show "Become a Pro" to customers */}
            {userRole === 'customer' && (
              <Link
                to="/pro-onboarding"
                className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Become a Pro
              </Link>
            )}
          </div>

          {/* Mobile: Theme Toggle + Notification Bell + Hamburger */}
          <div className="flex lg:hidden items-center space-x-2">
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:bg-amber-900 rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-amber-900">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-amber-100 hover:bg-amber-900 transition-colors"
              >
                Find a Pro
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-amber-100 hover:bg-amber-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/my-bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-amber-100 hover:bg-amber-900 transition-colors"
              >
                My Bookings
              </Link>
              <Link
                to="/my-messages"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-amber-100 hover:bg-amber-900 transition-colors"
              >
                My Messages
              </Link>
              <Link
                to="/my-favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-amber-100 hover:bg-amber-900 transition-colors"
              >
                <span className="flex items-center justify-between">
                  My Favorites
                  {favorites.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                      {favorites.length > 99 ? '99+' : favorites.length}
                    </span>
                  )}
                </span>
              </Link>
              <Link
                to="/my-profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-amber-100 hover:bg-amber-900 transition-colors"
              >
                {t('nav.myProfile')}
              </Link>
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-amber-100 hover:bg-amber-900 transition-colors"
              >
                About
              </Link>
              {/* Only show Pro Dashboard link to professionals and admins */}
              {isProfessional && (
                <Link
                  to="/pro-dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-amber-100 hover:bg-amber-900 transition-colors"
                >
                  {t('nav.proDashboard')}
                </Link>
              )}
              {/* Only show Admin Dashboard link to admins */}
              {isAdmin && (
                <Link
                  to="/admin-dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-amber-100 hover:bg-amber-900 transition-colors"
                >
                  {t('nav.adminDashboard')}
                </Link>
              )}
              {/* Only show "Become a Pro" to customers */}
              {userRole === 'customer' && (
                <Link
                  to="/pro-onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors mt-2"
                >
                  {t('onboarding.title')}
                </Link>
              )}
              <div className="mt-4 pt-4 border-t border-amber-700 dark:border-amber-600 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white dark:text-slate-200 text-sm font-medium">{t('theme.title')}</span>
                  <ThemeToggle />
                </div>
                <LanguageSelector />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Star Rating Component (Reusable)
function StarRating({ rating, interactive = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <div className={`flex items-center gap-0.5 ${sizeClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${
            star <= rating
              ? 'text-yellow-400'
              : 'text-gray-300'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// Professional Card Component
function ProfessionalCard({ professional, userId, distance, averageRating = null, reviewCount = 0 }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { t } = useTranslation();
  const isFav = isFavorite(userId);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(userId);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 hover:shadow-lg dark:hover:shadow-slate-900 active:shadow-md transition-all p-4 sm:p-6 border border-gray-200 dark:border-slate-700 relative touch-manipulation">
      {/* Heart Icon */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-90"
        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg
          className={`w-6 h-6 transition-colors ${
            isFav ? 'text-red-500 fill-current' : 'text-gray-400'
          }`}
          fill={isFav ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-12">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
              {professional.serviceType || 'Professional'}
            </h3>
            <CompactVerificationBadges professional={professional} />
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
            Service Provider
          </p>
          <div className="mt-2">
            <VerificationBadges professional={professional} size="sm" />
          </div>
        </div>
      </div>
      
      {/* Average Rating - Prominently Displayed */}
      {averageRating !== null && averageRating > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <StarRating rating={Math.round(averageRating)} size="md" />
          <span className="text-lg font-bold text-gray-900 dark:text-slate-100">
            {averageRating.toFixed(1)}
          </span>
          {reviewCount > 0 && (
            <span className="text-sm text-gray-500 dark:text-slate-400">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          )}
        </div>
      )}
      
      {professional.hourlyRate && (
        <div className="mb-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${professional.hourlyRate.toFixed(2)}
              <span className="text-sm font-normal text-gray-600 dark:text-slate-400">/hr</span>
            </p>
          </div>
        </div>
      )}

      {/* Distance Away - Clearly Displayed */}
      {distance !== null && distance !== undefined && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center">
            <span className="mr-1">📍</span>
            <span className="font-semibold">{distance.toFixed(1)} km {t('home.distanceAway')}</span>
          </p>
        </div>
      )}
      
      {professional.location && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center">
            <span className="mr-1">📍</span>
            {professional.location}
          </p>
        </div>
      )}
      
      {professional.bio && (
        <p className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2 mb-4">
          {professional.bio}
        </p>
      )}
      
      <Link
        to={`/pro-details/${userId}`}
        className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
      >
        View Profile
      </Link>
    </div>
  );
}

// Home page component
function HomePage({ user, searchQuery, setSearchQuery }) {
  const { t } = useTranslation();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationInput, setLocationInput] = useState('');
  const [customerLocation, setCustomerLocation] = useState({ lat: 30.2672, lon: -97.7431 }); // Default: Austin
  const [geocoding, setGeocoding] = useState(false);
  const [maxDistance, setMaxDistance] = useState('all'); // 'all', '5', '10', '25'
  
  // Advanced search filters
  const [filters, setFilters] = useState({
    category: 'all',
    minRating: 'all',
    priceMin: 0,
    priceMax: 500,
    sortBy: 'distance',
    availability: 'all',
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Mobile UX improvements
  const { focusInput, isKeyboardVisible } = useMobileKeyboard();
  
  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    // Force reload of professionals data
    setLoading(true);
    // The onSnapshot will automatically update, but we can trigger a visual refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
  };
  
  const {
    isPulling,
    pullDistance,
    isRefreshing,
    elementRef: pullToRefreshRef,
    pullProgress,
  } = usePullToRefresh(handleRefresh, {
    threshold: 80,
    resistance: 2.5,
    disabled: loading, // Disable during loading
  });

  useEffect(() => {
    if (!user) return;

    // Construct the Firestore collection path
    const professionalsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'professionals'
    );

    // Set up real-time listener with onSnapshot
    const unsubscribe = onSnapshot(
      professionalsRef,
      (snapshot) => {
        setLoading(false);
        setError(null);

        const professionalsList = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          professionalsList.push({
            id: doc.id,
            userId: doc.id, // The document ID is the userId
            ...data,
          });
        });

        setProfessionals(professionalsList);
      },
      (err) => {
        console.error('onSnapshot error:', err);
        setError(`Error loading professionals: ${err.message}`);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [user]);

  // Client-side filtering logic
  const filteredProfessionals = professionals.filter((pro) => {
    if (!searchQuery.trim()) {
      return true; // Show all if no search query
    }

    const query = searchQuery.toLowerCase().trim();
    const serviceType = (pro.serviceType || '').toLowerCase();
    const bio = (pro.bio || '').toLowerCase();
    const location = (pro.location || '').toLowerCase();

    // Match against service type, bio, or location
    return (
      serviceType.includes(query) ||
      bio.includes(query) ||
      location.includes(query)
    );
  });

  // State for professional ratings
  const [professionalRatings, setProfessionalRatings] = useState({});

  // Fetch average ratings for all professionals
  useEffect(() => {
    if (filteredProfessionals.length === 0) {
      setProfessionalRatings({});
      return;
    }

    const fetchRatings = async () => {
      const ratingsMap = {};

      // Fetch ratings for each professional in parallel
      const ratingPromises = filteredProfessionals.map(async (pro) => {
        try {
          const reviewsRef = collection(
            db,
            'artifacts',
            appId,
            'public',
            'data',
            'professionals',
            pro.id,
            'reviews'
          );

          const reviewsSnapshot = await getDocs(reviewsRef);
          
          if (reviewsSnapshot.empty) {
            ratingsMap[pro.id] = { averageRating: null, reviewCount: 0 };
            return;
          }

          let totalRating = 0;
          let count = 0;

          reviewsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.rating) {
              totalRating += data.rating;
              count++;
            }
          });

          const averageRating = count > 0 ? totalRating / count : null;
          ratingsMap[pro.id] = { averageRating, reviewCount: count };
        } catch (err) {
          console.error(`Error fetching ratings for ${pro.id}:`, err);
          ratingsMap[pro.id] = { averageRating: null, reviewCount: 0 };
        }
      });

      await Promise.all(ratingPromises);
      setProfessionalRatings(ratingsMap);
    };

    fetchRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProfessionals.length]); // Refetch when filtered list changes

  // Calculate distance for each professional and add to the object
  // Supports both single area and multi-area professionals
  const professionalsWithDistance = filteredProfessionals.map((pro) => {
    let distance = null;
    
    // Only calculate distance if customer has coordinates
    if (customerLocation && customerLocation.lat && customerLocation.lon) {
      // Check for multi-area support
      if (pro.serviceAreas && Array.isArray(pro.serviceAreas) && pro.serviceAreas.length > 0) {
        // Find the closest service area
        let minDistance = Infinity;
        pro.serviceAreas.forEach(area => {
          if (area.lat && area.lon) {
            const areaDistance = haversineDistance(
              customerLocation.lat,
              customerLocation.lon,
              area.lat,
              area.lon
            );
            if (areaDistance < minDistance) {
              minDistance = areaDistance;
            }
          }
        });
        if (minDistance !== Infinity) {
          distance = minDistance;
        }
      } else if (pro.lat && pro.lon) {
        // Single area calculation
        distance = haversineDistance(
          customerLocation.lat,
          customerLocation.lon,
          pro.lat,
          pro.lon
        );
      }
    }
    
    const ratings = professionalRatings[pro.id] || { averageRating: null, reviewCount: 0 };
    
    return {
      ...pro,
      distance,
      averageRating: ratings.averageRating,
      reviewCount: ratings.reviewCount,
    };
  });

  // Advanced filtering logic
  const applyAdvancedFilters = (pros) => {
    return pros.filter((pro) => {
      // Filter by max distance (legacy support)
      if (maxDistance !== 'all') {
        if (pro.distance === null || pro.distance === undefined) {
          return false;
        }
        const maxDistanceValue = parseFloat(maxDistance);
        if (pro.distance > maxDistanceValue) {
          return false;
        }
      }

      // Filter by service category
      if (filters.category !== 'all') {
        const serviceType = (pro.serviceType || '').toLowerCase();
        const categoryMap = {
          plumbing: ['plumber', 'plumbing'],
          electrical: ['electrician', 'electrical'],
          hvac: ['hvac', 'heating', 'cooling', 'air conditioning'],
          carpentry: ['carpenter', 'carpentry', 'woodwork'],
          painting: ['painter', 'painting'],
          landscaping: ['landscaper', 'landscaping', 'gardening'],
          cleaning: ['cleaner', 'cleaning', 'housekeeping'],
          handyman: ['handyman', 'handy man'],
          roofing: ['roofer', 'roofing'],
          flooring: ['flooring', 'floor'],
        };
        const categoryKeywords = categoryMap[filters.category] || [];
        if (!categoryKeywords.some(keyword => serviceType.includes(keyword))) {
          return false;
        }
      }

      // Filter by minimum rating
      if (filters.minRating !== 'all') {
        const minRatingValue = parseFloat(filters.minRating);
        if (!pro.averageRating || pro.averageRating < minRatingValue) {
          return false;
        }
      }

      // Filter by price range
      const hourlyRate = pro.hourlyRate || 0;
      if (hourlyRate < filters.priceMin || hourlyRate > filters.priceMax) {
        return false;
      }

      // Filter by availability (simplified - checks if schedule exists)
      if (filters.availability !== 'all') {
        // For now, we'll just check if they have a schedule
        // In a real implementation, you'd check actual availability
        if (!pro.schedule || Object.keys(pro.schedule).length === 0) {
          return false;
        }
      }

      return true;
    });
  };

  // Apply advanced filters
  const advancedFilteredProfessionals = applyAdvancedFilters(professionalsWithDistance);

  // Sort professionals based on selected sort option
  const sortedProfessionals = [...advancedFilteredProfessionals].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-low':
        return (a.hourlyRate || 0) - (b.hourlyRate || 0);
      
      case 'price-high':
        return (b.hourlyRate || 0) - (a.hourlyRate || 0);
      
      case 'rating':
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        if (ratingA !== ratingB) {
          return ratingB - ratingA;
        }
        // If ratings are equal, sort by review count
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      
      case 'reviews':
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      
      case 'newest':
        // Sort by createdAt if available, otherwise maintain order
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA;
      
      case 'distance':
      default:
        // Sort by distance (closest first)
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        if (a.distance !== null && b.distance === null) {
          return -1;
        }
        if (a.distance === null && b.distance !== null) {
          return 1;
        }
        return 0;
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by the filter, no need for separate action
  };

  const handleLocationSearch = async (e) => {
    e.preventDefault();
    
    if (!locationInput.trim()) {
      return;
    }

    setGeocoding(true);
    try {
        const coordinates = await mockGeocodeUtil(locationInput);
        setCustomerLocation(coordinates);
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Failed to geocode location. Please try again.');
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <>
      <Navigation />
      {/* Pull-to-refresh indicator */}
      <PullToRefresh
        isPulling={isPulling}
        pullProgress={pullProgress}
        isRefreshing={isRefreshing}
      />
      <main
        ref={pullToRefreshRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 touch-pan-y"
        style={{
          paddingTop: isPulling || isRefreshing ? `${Math.min(pullDistance, 80)}px` : '2rem',
          transition: isPulling ? 'none' : 'padding-top 0.3s ease-out',
        }}
      >


        {/* Landing Page with Centered Search Bar */}
        <div className="mb-8">
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-white dark:text-slate-100">
                {t('home.title')}
              </h2>
            </div>
            <p className="text-blue-100 dark:text-slate-300 text-center mb-8">
              {t('home.subtitle')}
            </p>
            
            {/* Search Form with Service Type and Location */}
            <div className="space-y-4">
              {/* Service Type Search Bar */}
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for services (e.g., 'Plumber', 'Electrician') or keywords in bio..."
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent shadow-sm transition-all touch-manipulation bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    onFocus={(e) => {
                      // Better mobile keyboard handling
                      if (window.innerWidth < 768) {
                        setTimeout(() => {
                          focusInput(e.target);
                        }, 100);
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-3 sm:px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-sm sm:text-base"
                  >
                    {t('common.search')}
                  </button>
                </div>
              </form>

              {/* Location Input */}
              <form onSubmit={handleLocationSearch} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder={t('home.yourLocation')}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent shadow-sm transition-all touch-manipulation bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck="false"
                    onFocus={(e) => {
                      // Better mobile keyboard handling
                      if (window.innerWidth < 768) {
                        setTimeout(() => {
                          focusInput(e.target);
                        }, 100);
                      }
                    }}
                  />
                  {geocoding && (
                    <div className="absolute right-20 top-1/2 transform -translate-y-1/2">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                    </div>
                  )}
                  {locationInput && !geocoding && (
                    <button
                      type="button"
                      onClick={() => setLocationInput('')}
                      className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Clear location"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={geocoding || !locationInput.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 text-white px-3 sm:px-6 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:hover:scale-100 touch-manipulation min-w-[60px] min-h-[44px]"
                  >
                    {geocoding ? t('common.loading') : t('common.search')}
                  </button>
                </div>
              </form>

              {/* Max Distance Filter (Legacy - kept for backward compatibility) */}
              <div className="w-full">
                <label htmlFor="maxDistance" className="block text-sm font-medium text-white mb-2">
                  {t('home.maxDistance')}
                </label>
                <select
                  id="maxDistance"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent shadow-sm transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                >
                  <option value="all">{t('home.all')}</option>
                  <option value="5">5 {t('home.km')}</option>
                  <option value="10">10 {t('home.km')}</option>
                  <option value="25">25 {t('home.km')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Search Filters */}
        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
          resultCount={sortedProfessionals.length}
        />

        {/* Loading State - Skeleton Screens */}
        {loading && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProfessionalCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-medium text-red-800 mb-1">Error Loading Professionals</p>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!loading && !error && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                {searchQuery || locationInput || maxDistance !== 'all' ? (
                  <>
                    {sortedProfessionals.length} {sortedProfessionals.length === 1 ? 'Professional' : 'Professionals'} Found
                    {searchQuery && (
                      <span className="text-blue-200 font-normal ml-2">
                        for "{searchQuery}"
                      </span>
                    )}
                    {maxDistance !== 'all' && (
                      <span className="text-blue-200 font-normal ml-2">
                        within {maxDistance} km
                      </span>
                    )}
                    {customerLocation && locationInput && (
                      <span className="text-blue-200 font-normal ml-2 text-sm">
                        (sorted by distance)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    All Professionals ({professionals.length})
                    {customerLocation && locationInput && (
                      <span className="text-blue-200 font-normal ml-2 text-sm">
                        (sorted by distance)
                      </span>
                    )}
                  </>
                )}
              </h3>
            </div>

            {/* Results Grid - Mobile Optimized */}
            {sortedProfessionals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-4">
                {sortedProfessionals.map((professional) => (
                  <ProfessionalCard
                    key={professional.id}
                    professional={professional}
                    userId={professional.userId}
                    distance={professional.distance}
                    averageRating={professional.averageRating}
                    reviewCount={professional.reviewCount}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 p-12 text-center border border-gray-200 dark:border-slate-700">
                <div className="text-6xl mb-4">
                  {searchQuery || locationInput ? '🔍' : '👷'}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  {searchQuery || locationInput ? t('home.noResults') : t('home.noResults')}
                </h3>
                <p className="text-gray-600 dark:text-slate-400 mb-4 max-w-md mx-auto">
                  {searchQuery || locationInput ? (
                    <>
                      {t('home.tryDifferentSearch')}
                      {searchQuery && (
                        <span className="block mt-2">
                          Search: <span className="font-semibold">"{searchQuery}"</span>
                        </span>
                      )}
                      {maxDistance !== 'all' && (
                        <span className="block mt-1">
                          Within: <span className="font-semibold">{maxDistance} km</span>
                        </span>
                      )}
                    </>
                  ) : (
                    'Be the first professional to join our platform!'
                  )}
                </p>
                <div className="mt-6 space-y-3">
                  {searchQuery || locationInput ? (
                    <>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">Suggestions:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-slate-400 space-y-1 mb-4">
                        <li>Try different search terms (e.g., "Plumber", "Electrician")</li>
                        <li>Clear your location filter or try a different area</li>
                        <li>Increase your max distance radius</li>
                        <li>Check back later as new professionals join</li>
                      </ul>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setLocationInput('');
                            setMaxDistance('all');
                          }}
                          className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
                        >
                          Clear Filters
                        </button>
                        <Link
                          to="/"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          View All Professionals
                        </Link>
                      </div>
                    </>
                  ) : (
                    <Link
                      to="/pro-onboarding"
                      className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Become a Pro
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Set user context in Sentry for error tracking
        setSentryUser(currentUser);

        // Process referral code if present in URL
        const referralCode = getReferralCodeFromURL();
        if (referralCode) {
          try {
            await processReferralCode(currentUser.uid, referralCode);
            // Clean up URL parameter
            const url = new URL(window.location.href);
            url.searchParams.delete('ref');
            window.history.replaceState({}, '', url);
          } catch (error) {
            console.error('Error processing referral code:', error);
          }
        }
      } else {
        // Clear user context when logged out
        setSentryUser(null);
        
        // If no user is signed in and no custom token, sign in anonymously (guest mode)
        // This allows guests to use the app without creating an account
        const initialAuthToken = window.__initial_auth_token;
        
        if (initialAuthToken) {
          // Sign in with custom token if provided
          signInWithCustomToken(auth, initialAuthToken).catch((error) => {
            console.error('Custom token sign-in failed:', error);
            // Fall back to anonymous sign-in
            signInAnonymously(auth).catch((err) => {
              console.error('Anonymous sign-in failed:', err);
            });
          });
        } else {
          // Sign in anonymously if no token provided (guest mode)
          signInAnonymously(auth).catch((err) => {
            console.error('Anonymous sign-in failed:', err);
          });
        }
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Search is now handled in HomePage component

  // Preload critical routes after authentication
  useEffect(() => {
    if (user && !loading) {
      preloadCriticalRoutes();
    }
  }, [user, loading]);

  // Show loading screen until authentication is ready
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-900 dark:bg-slate-900 transition-colors duration-200">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <LoadingProvider>
          <Router>
            <div className="min-h-screen bg-blue-900 dark:bg-slate-900 transition-colors duration-200">
            <Suspense fallback={<RouteLoading message="Loading page..." />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <HomePage
                      user={user}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                    />
                  }
                />
                <Route 
                  path="/pro-onboarding" 
                  element={
                    <Suspense fallback={<RouteLoading message="Loading onboarding..." />}>
                      <ProOnboarding />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/pro-details/:id" 
                  element={
                    <Suspense fallback={<RouteLoading message="Loading professional details..." />}>
                      <ProfessionalDetails />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/book/:id" 
                  element={
                    <Suspense fallback={<RouteLoading message="Loading booking page..." />}>
                      <BookingPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/pro-dashboard" 
                  element={
                    <RouteGuard allowedRoles={['professional', 'admin']} redirectTo="/">
                      <Suspense fallback={<RouteLoading message="Loading dashboard..." />}>
                        <ProDashboard />
                      </Suspense>
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/chat/:bookingId" 
                  element={
                    <Suspense fallback={<RouteLoading message="Loading chat..." />}>
                      <ChatPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/my-messages" 
                  element={
                    <Suspense fallback={<RouteLoading message="Loading messages..." />}>
                      <MyMessages />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/my-bookings" 
                  element={
                    <Suspense fallback={<RouteLoading message="Loading bookings..." />}>
                      <MyBookings />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/my-favorites" 
                  element={
                    <Suspense fallback={<RouteLoading message="Loading favorites..." />}>
                      <MyFavorites />
                    </Suspense>
                  } 
                />
                <Route
                  path="/my-profile"
                  element={
                    <Suspense fallback={<RouteLoading message="Loading profile..." />}>
                      <MyProfile />
                    </Suspense>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <Suspense fallback={<RouteLoading message="Loading dashboard..." />}>
                      <CustomerDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin-dashboard" 
                  element={
                    <RouteGuard allowedRoles={['admin']} redirectTo="/">
                      <Suspense fallback={<RouteLoading message="Loading admin dashboard..." />}>
                        <AdminDashboard />
                      </Suspense>
                    </RouteGuard>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <Suspense fallback={<RouteLoading message="Loading login..." />}>
                      <LoginPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <Suspense fallback={<RouteLoading message="Loading sign up..." />}>
                      <SignUpPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin-disputes" 
                  element={
                    <Suspense fallback={<RouteLoading message="Loading dispute dashboard..." />}>
                      <AdminDisputeDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="/my-disputes" 
                  element={
                    <Suspense fallback={<RouteLoading message="Loading disputes..." />}>
                      <MyDisputes />
                    </Suspense>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <Suspense fallback={<RouteLoading message="Loading about page..." />}>
                      <AboutPage />
                    </Suspense>
                  }
                />
              </Routes>
            </Suspense>
          </div>
        </Router>
        </LoadingProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
