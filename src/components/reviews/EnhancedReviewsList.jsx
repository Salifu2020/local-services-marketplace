import React, { useState } from 'react';
import { auth, db, appId } from '../../firebase';
import { doc, updateDoc, increment, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';

// Star Rating Component
function StarRating({ rating, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex items-center gap-0.5 ${sizeClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// Sort Options
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
  { value: 'mostHelpful', label: 'Most Helpful' },
];

function EnhancedReviewsList({ reviews, professionalId }) {
  const { showSuccess, showError } = useToast();
  const [sortBy, setSortBy] = useState('newest');
  const [helpfulReviews, setHelpfulReviews] = useState(new Set());

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'newest') {
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    } else if (sortBy === 'highest') {
      return (b.rating || 0) - (a.rating || 0);
    } else if (sortBy === 'lowest') {
      return (a.rating || 0) - (b.rating || 0);
    } else if (sortBy === 'mostHelpful') {
      return (b.helpfulCount || 0) - (a.helpfulCount || 0);
    }
    return 0;
  });

  const handleHelpful = async (reviewId, isHelpful) => {
    const user = auth.currentUser;
    if (!user) {
      showError('Please log in to mark reviews as helpful');
      return;
    }

    try {
      const reviewRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals',
        professionalId,
        'reviews',
        reviewId
      );

      if (isHelpful) {
        await updateDoc(reviewRef, {
          helpfulCount: increment(1),
          helpfulUsers: arrayUnion(user.uid),
          updatedAt: serverTimestamp(),
        });
        setHelpfulReviews((prev) => new Set([...prev, reviewId]));
        showSuccess('Marked as helpful');
      } else {
        await updateDoc(reviewRef, {
          helpfulCount: increment(-1),
          helpfulUsers: arrayRemove(user.uid),
          updatedAt: serverTimestamp(),
        });
        setHelpfulReviews((prev) => {
          const newSet = new Set(prev);
          newSet.delete(reviewId);
          return newSet;
        });
        showSuccess('Removed helpful mark');
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      showError('Failed to update review');
    }
  };

  const handleFlagReview = async (reviewId) => {
    const user = auth.currentUser;
    if (!user) {
      showError('Please log in to flag reviews');
      return;
    }

    if (!confirm('Are you sure you want to flag this review as inappropriate?')) {
      return;
    }

    try {
      const reviewRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals',
        professionalId,
        'reviews',
        reviewId
      );

      await updateDoc(reviewRef, {
        flaggedBy: arrayUnion(user.uid),
        flaggedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      showSuccess('Review flagged. Our team will review it.');
    } catch (error) {
      console.error('Error flagging review:', error);
      showError('Failed to flag review');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCategoryRatings = (categoryRatings) => {
    if (!categoryRatings || typeof categoryRatings !== 'object') return null;

    const categories = {
      quality: { label: 'Quality', icon: '⭐' },
      punctuality: { label: 'Punctuality', icon: '⏰' },
      communication: { label: 'Communication', icon: '💬' },
      value: { label: 'Value', icon: '💰' },
    };

    return Object.entries(categoryRatings)
      .filter(([_, rating]) => rating > 0)
      .map(([key, rating]) => (
        <div key={key} className="flex items-center gap-2 text-sm">
          <span>{categories[key]?.icon}</span>
          <span className="text-gray-600">{categories[key]?.label}:</span>
          <StarRating rating={rating} size="sm" />
        </div>
      ));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Reviews ({reviews.length})
        </h3>
        {reviews.length > 0 && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {sortedReviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⭐</div>
          <p className="text-gray-600">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedReviews.map((review) => {
            const isHelpful = helpfulReviews.has(review.id) || 
              (review.helpfulUsers && review.helpfulUsers.includes(auth.currentUser?.uid));

            return (
              <ReviewCard
                key={review.id}
                review={review}
                isHelpful={isHelpful}
                onHelpful={(helpful) => handleHelpful(review.id, helpful)}
                onFlag={() => handleFlagReview(review.id)}
                formatDate={formatDate}
                formatCategoryRatings={formatCategoryRatings}
                StarRating={StarRating}
                professionalId={professionalId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, isHelpful, onHelpful, onFlag, formatDate, formatCategoryRatings, StarRating, professionalId }) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const user = auth.currentUser;
  const isProfessional = user && user.uid === professionalId;

  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StarRating rating={review.rating || 0} size="md" />
            <span className="text-lg font-semibold text-gray-900">
              {review.rating || 0}.0
            </span>
            {review.verified && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                ✓ Verified
              </span>
            )}
          </div>
          {review.categoryRatings && (
            <div className="flex flex-wrap gap-3 mt-2">
              {formatCategoryRatings(review.categoryRatings)}
            </div>
          )}
        </div>
        <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
      </div>

      {/* Review Comment */}
      <p className="text-gray-700 mb-3 whitespace-pre-wrap">{review.comment}</p>

      {/* Review Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {review.photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Review photo ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => {
                // TODO: Open photo in lightbox/modal
                window.open(photo, '_blank');
              }}
            />
          ))}
        </div>
      )}

      {/* Professional Response */}
      {review.professionalResponse ? (
        <div className="ml-6 mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-blue-900">Professional Response:</span>
            <span className="text-xs text-blue-700">
              {formatDate(review.professionalResponse.createdAt)}
            </span>
          </div>
          <p className="text-blue-800">{review.professionalResponse.text}</p>
        </div>
      ) : isProfessional && !showResponseForm && (
        <button
          onClick={() => setShowResponseForm(true)}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Respond to this review
        </button>
      )}

      {/* Response Form */}
      {showResponseForm && isProfessional && (
        <ProfessionalResponseForm
          reviewId={review.id}
          professionalId={professionalId}
          onResponseSubmitted={() => setShowResponseForm(false)}
        />
      )}

      {/* Review Actions */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={() => onHelpful(!isHelpful)}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
            isHelpful
              ? 'text-blue-600 hover:text-blue-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill={isHelpful ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
          Helpful ({review.helpfulCount || 0})
        </button>
        <button
          onClick={onFlag}
          className="text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          Flag
        </button>
      </div>
    </div>
  );
}

export default EnhancedReviewsList;

