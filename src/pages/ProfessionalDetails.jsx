import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth, db, appId } from '../firebase';
import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useFavorites } from '../hooks/useFavorites';
import { useSwipeBack } from '../hooks/useTouchGestures';
import VerificationBadges, { CompactVerificationBadges } from '../components/VerificationBadges';
import EnhancedReviewForm from '../components/reviews/EnhancedReviewForm';
import EnhancedReviewsList from '../components/reviews/EnhancedReviewsList';
import PortfolioGallery from '../components/portfolio/PortfolioGallery';
import ServicePackages from '../components/packages/ServicePackages';
import ServiceAreaMap from '../components/maps/ServiceAreaMap';
import LanguageTags from '../components/LanguageTags';
import { useTranslation } from 'react-i18next';

// Star Rating Component (kept for backward compatibility)
function StarRating({ rating, onRatingChange, interactive = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRatingChange(star)}
          disabled={!interactive}
          className={`text-2xl ${
            interactive
              ? 'cursor-pointer hover:scale-110 transition-transform'
              : 'cursor-default'
          } ${
            star <= rating
              ? 'text-yellow-400'
              : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ProfessionalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { t } = useTranslation();
  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const isFav = isFavorite(id);
  
  // Swipe-to-go-back gesture for mobile
  const { elementRef: swipeRef } = useSwipeBack();

  const handleFavoriteClick = () => {
    toggleFavorite(id);
  };

  useEffect(() => {
    const fetchProfessional = async () => {
      if (!id) {
        setError('Professional ID is required');
        setLoading(false);
        return;
      }

      try {
        // Construct the Firestore document path
        const professionalRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'professionals',
          id
        );

        // Fetch the document using getDoc
        const docSnapshot = await getDoc(professionalRef);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          
          setProfessional({
            id: docSnapshot.id,
            userId: docSnapshot.id,
            ...data,
          });
        } else {
          setError('Professional not found');
        }
      } catch (err) {
        console.error('Error fetching professional:', err);
        setError(err.message || 'Failed to load professional profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessional();
  }, [id]);

  // Fetch reviews from subcollection
  useEffect(() => {
    if (!id) return;

    // Construct the reviews subcollection path
    const reviewsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'professionals',
      id,
      'reviews'
    );

    // Set up real-time listener with onSnapshot, ordered by creation date (newest first)
    const reviewsQuery = query(reviewsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        setReviewsLoading(false);

        const reviewsList = [];
        let totalRating = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          reviewsList.push({
            id: doc.id,
            ...data,
          });
          // Use averageCategoryRating if available, otherwise use rating
          const ratingToUse = data.averageCategoryRating || data.rating || 0;
          totalRating += ratingToUse;
        });

        // Calculate average rating
        const avg = reviewsList.length > 0 ? totalRating / reviewsList.length : 0;
        setAverageRating(avg);
        setReviews(reviewsList);
      },
      (err) => {
        console.error('onSnapshot error for reviews:', err);
        setReviewsLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [id]);

  const handleReviewSubmitted = () => {
    // Reviews will update automatically via onSnapshot
  };

  const handleBookNow = () => {
    // Navigate to booking flow (Phase 5)
    // For now, we'll create a placeholder route
    navigate(`/book/${id}`);
  };

  if (loading) {
    return (
      <>
        <nav className="bg-amber-800 shadow-sm border-b border-amber-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white hover:text-amber-100 transition-colors">
                <span className="text-2xl bg-purple-600 text-white rounded-lg px-2 py-1 font-light flex items-center justify-center">∞</span>
                <span>ExpertNextDoor</span>
              </Link>
            </div>
          </div>
        </nav>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading professional profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !professional) {
    return (
      <>
        <nav className="bg-amber-800 shadow-sm border-b border-amber-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white hover:text-amber-100 transition-colors">
                <span className="text-2xl bg-purple-600 text-white rounded-lg px-2 py-1 font-light flex items-center justify-center">∞</span>
                <span>ExpertNextDoor</span>
              </Link>
            </div>
          </div>
        </nav>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The professional you are looking for does not exist.'}</p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Back to Search
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-gray-900">
              ExpertNextDoor
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                ← Back to Search
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main ref={swipeRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 touch-pan-y">
          {/* Professional Header */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6 relative">
            {/* Heart Icon */}
            <button
              onClick={handleFavoriteClick}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95"
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className={`w-8 h-8 transition-colors ${
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

            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 pr-12">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {professional.serviceType || 'Professional Service Provider'}
                  </h1>
                  <CompactVerificationBadges professional={professional} />
                </div>
                <p className="text-lg text-gray-600 mb-3">
                  {professional.serviceType ? `${professional.serviceType} Professional` : 'Service Provider'}
                </p>
                
                {/* Verification Badges */}
                <div className="mb-4">
                  <VerificationBadges professional={professional} size="md" />
                </div>
                
                {professional.location && (
                  <div className="flex items-center text-gray-600 mb-2">
                    <span className="mr-2">📍</span>
                    <span>{professional.location}</span>
                  </div>
                )}
              </div>

            <div className="mt-4 md:mt-0 md:text-right space-y-2">
              {/* Average Rating Display */}
              {reviews.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Average Rating</p>
                  <div className="flex items-center gap-2 justify-end">
                    <StarRating rating={Math.round(averageRating)} interactive={false} />
                    <span className="text-2xl font-bold text-gray-900">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                </div>
              )}
              
              {professional.hourlyRate && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Hourly Rate</p>
                  <p className="text-4xl font-bold text-blue-600">
                    ${professional.hourlyRate.toFixed(2)}
                    <span className="text-xl font-normal text-gray-600">/hr</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Book Now Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleBookNow}
              className="w-full md:w-auto px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              Book Now
            </button>
          </div>
        </div>

        {/* Professional Details */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">About</h2>
          
          {professional.bio ? (
            <div className="prose max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                {professional.bio}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 italic">No bio available for this professional.</p>
          )}

          {/* Additional Details Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {professional.serviceType && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Service Type</p>
                  <p className="text-lg font-medium text-gray-900">{professional.serviceType}</p>
                </div>
              )}
              
              {professional.hourlyRate && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Hourly Rate</p>
                  <p className="text-lg font-medium text-gray-900">
                    ${professional.hourlyRate.toFixed(2)}/hr
                  </p>
                </div>
              )}
              
              {professional.location && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Service Area</p>
                  <p className="text-lg font-medium text-gray-900">{professional.location}</p>
                </div>
              )}
              
              {professional.createdAt && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Member Since</p>
                  <p className="text-lg font-medium text-gray-900">
                    {new Date(professional.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Service Area Map */}
          {professional.lat && professional.lon && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Area</h3>
              <ServiceAreaMap
                initialLocation={{
                  lat: professional.lat,
                  lon: professional.lon,
                  locationText: professional.locationText || professional.location || 'Service Area'
                }}
                serviceRadius={professional.serviceRadius || 25}
                readOnly={true}
                showRadius={true}
                height="350px"
              />
            </div>
          )}

          {/* Availability Section (if available) */}
          {professional.availability && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Availability</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  This professional has set their availability schedule. 
                  Available times will be shown during booking.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Service Packages Section */}
        <div className="mt-8">
          <ServicePackages 
            professionalId={id} 
            isOwner={auth.currentUser?.uid === id}
          />
        </div>

        {/* Portfolio Gallery Section */}
        <div className="mt-8">
          <PortfolioGallery 
            professionalId={id} 
            isOwner={auth.currentUser?.uid === id}
          />
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
          
          {/* Review Form */}
          {auth.currentUser && (
            <div className="mb-8">
              <EnhancedReviewForm 
                professionalId={id} 
                onReviewSubmitted={handleReviewSubmitted}
              />
            </div>
          )}

          {!auth.currentUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                Please sign in to leave a review.
              </p>
            </div>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600">Loading reviews...</p>
            </div>
          ) : (
            <EnhancedReviewsList reviews={reviews} professionalId={id} />
          )}
        </div>
      </main>
    </>
  );
}

export default ProfessionalDetails;

