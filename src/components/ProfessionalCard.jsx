import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';

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
  const isFav = isFavorite(userId);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(userId);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 relative transform hover:-translate-y-1 animate-fade-in">
      {/* Heart Icon */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-all duration-200 z-10 transform hover:scale-110 active:scale-95"
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
      
      {/* Average Rating - Prominently Displayed */}
      {averageRating !== null && averageRating > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <StarRating rating={Math.round(averageRating)} size="md" />
          <span className="text-lg font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
          {reviewCount > 0 && (
            <span className="text-sm text-gray-500">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
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

      {/* Distance Away - Clearly Displayed */}
      {distance !== null && distance !== undefined && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 flex items-center">
            <span className="mr-1">📍</span>
            <span className="font-semibold">{distance.toFixed(1)} km away</span>
          </p>
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
        className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-center transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
      >
        View Profile
      </Link>
    </div>
  );
}

export default ProfessionalCard;

