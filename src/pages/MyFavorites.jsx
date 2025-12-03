import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, appId } from '../firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { useFavorites } from '../hooks/useFavorites';
import { ProfessionalCardSkeleton, Skeleton } from '../components/Skeleton';

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

// Professional Card Component (similar to HomePage)
function FavoriteProfessionalCard({ professional, userId, onRemove }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const isFav = isFavorite(userId);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(userId);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 relative">
      {/* Heart Icon */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
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
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {professional.serviceType || 'Professional'}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            Service Provider
          </p>
        </div>
      </div>
      
      {/* Average Rating */}
      {professional.averageRating !== null && professional.averageRating > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <StarRating rating={Math.round(professional.averageRating)} size="md" />
          <span className="text-lg font-bold text-gray-900">
            {professional.averageRating.toFixed(1)}
          </span>
          {professional.reviewCount > 0 && (
            <span className="text-sm text-gray-500">
              ({professional.reviewCount} {professional.reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          )}
        </div>
      )}
      
      {professional.hourlyRate && (
        <div className="mb-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-2xl font-bold text-blue-600">
              ${professional.hourlyRate.toFixed(2)}
              <span className="text-sm font-normal text-gray-600">/hr</span>
            </p>
          </div>
        </div>
      )}
      
      {professional.location && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 flex items-center">
            <span className="mr-1">📍</span>
            {professional.location}
          </p>
        </div>
      )}
      
      {professional.bio && (
        <p className="text-sm text-gray-700 line-clamp-2 mb-4">
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

function MyFavorites() {
  const navigate = useNavigate();
  const { favorites, loading: favoritesLoading } = useFavorites();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [professionalRatings, setProfessionalRatings] = useState({});

  // Fetch professional details for all favorites
  useEffect(() => {
    if (favoritesLoading) return;

    const fetchFavorites = async () => {
      if (favorites.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const professionalsList = [];
        const ratingsMap = {};

        // Fetch each professional
        const fetchPromises = favorites.map(async (proId) => {
          try {
            const professionalRef = doc(
              db,
              'artifacts',
              appId,
              'public',
              'data',
              'professionals',
              proId
            );

            const professionalDoc = await getDoc(professionalRef);

            if (professionalDoc.exists()) {
              const data = professionalDoc.data();
              
              // Fetch reviews for rating
              const reviewsRef = collection(
                db,
                'artifacts',
                appId,
                'public',
                'data',
                'professionals',
                proId,
                'reviews'
              );

              const reviewsSnapshot = await getDocs(reviewsRef);
              
              let averageRating = null;
              let reviewCount = 0;

              if (!reviewsSnapshot.empty) {
                let totalRating = 0;
                let count = 0;

                reviewsSnapshot.forEach((doc) => {
                  const reviewData = doc.data();
                  if (reviewData.rating) {
                    totalRating += reviewData.rating;
                    count++;
                  }
                });

                if (count > 0) {
                  averageRating = totalRating / count;
                  reviewCount = count;
                }
              }

              ratingsMap[proId] = { averageRating, reviewCount };

              professionalsList.push({
                id: proId,
                userId: proId,
                ...data,
                averageRating,
                reviewCount,
              });
            }
          } catch (err) {
            console.error(`Error fetching professional ${proId}:`, err);
          }
        });

        await Promise.all(fetchPromises);
        setProfessionals(professionalsList);
        setProfessionalRatings(ratingsMap);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError('Failed to load favorite professionals');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [favorites, favoritesLoading]);

  if (favoritesLoading || loading) {
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
                  Home
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton variant="text" lines={2} className="h-8 mb-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProfessionalCardSkeleton key={i} />
            ))}
          </div>
        </main>
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
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
          <p className="text-gray-600">
            {professionals.length > 0
              ? `You have ${professionals.length} favorite ${professionals.length === 1 ? 'professional' : 'professionals'}`
              : 'Your favorite professionals will appear here'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Favorites List */}
        {professionals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map((professional) => (
              <FavoriteProfessionalCard
                key={professional.id}
                professional={professional}
                userId={professional.userId}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <div className="text-gray-400 text-6xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Favorites Yet</h3>
            <p className="text-gray-600 mb-6">
              Start adding professionals to your favorites by clicking the heart icon on their profile!
            </p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Find a Pro
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

export default MyFavorites;

