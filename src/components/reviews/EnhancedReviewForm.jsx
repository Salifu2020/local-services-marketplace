import React, { useState, useEffect } from 'react';
import { auth, db, appId } from '../../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';

// Review Categories
const REVIEW_CATEGORIES = [
  { id: 'quality', label: 'Quality of Work', icon: '⭐' },
  { id: 'punctuality', label: 'Punctuality', icon: '⏰' },
  { id: 'communication', label: 'Communication', icon: '💬' },
  { id: 'value', label: 'Value for Money', icon: '💰' },
];

function EnhancedReviewForm({ professionalId, onReviewSubmitted }) {
  const { showSuccess, showError } = useToast();
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState({
    quality: 0,
    punctuality: 0,
    communication: 0,
    value: 0,
  });
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [hasVerifiedBooking, setHasVerifiedBooking] = useState(false);
  const [checkingBooking, setCheckingBooking] = useState(true);

  // Check if user has a verified booking with this professional
  useEffect(() => {
    const checkVerifiedBooking = async () => {
      const user = auth.currentUser;
      if (!user) {
        setCheckingBooking(false);
        return;
      }

      try {
        const bookingsRef = collection(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'bookings'
        );

        const bookingsQuery = query(
          bookingsRef,
          where('userId', '==', user.uid),
          where('professionalId', '==', professionalId),
          where('status', '==', 'Completed')
        );

        const snapshot = await getDocs(bookingsQuery);
        setHasVerifiedBooking(!snapshot.empty);
      } catch (err) {
        console.error('Error checking verified booking:', err);
        // Allow review even if check fails
        setHasVerifiedBooking(true);
      } finally {
        setCheckingBooking(false);
      }
    };

    checkVerifiedBooking();
  }, [professionalId]);

  const handleCategoryRating = (categoryId, rating) => {
    setCategoryRatings({
      ...categoryRatings,
      [categoryId]: rating,
    });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      showError('Maximum 5 photos allowed');
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showError(`${file.name} is too large. Maximum 5MB per photo.`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        showError(`${file.name} is not an image file.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos((prev) => [...prev, { file, preview: e.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to submit a review');
      return;
    }

    if (!hasVerifiedBooking) {
      setError('You can only review professionals after completing a booking with them.');
      return;
    }

    if (overallRating === 0) {
      setError('Please select an overall rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a comment');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Upload photos to Firebase Storage (simplified - in production, use Firebase Storage)
      const photoUrls = [];
      // TODO: Upload photos to Firebase Storage and get URLs
      // For now, we'll store as base64 (not recommended for production)
      // In production: upload to Firebase Storage, get download URLs

      const reviewsRef = collection(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals',
        professionalId,
        'reviews'
      );

      // Calculate average category rating
      const categoryValues = Object.values(categoryRatings).filter((r) => r > 0);
      const averageCategoryRating =
        categoryValues.length > 0
          ? categoryValues.reduce((a, b) => a + b, 0) / categoryValues.length
          : overallRating;

      // Add the review
      await addDoc(reviewsRef, {
        userId: user.uid,
        rating: overallRating,
        categoryRatings: categoryRatings,
        averageCategoryRating: averageCategoryRating,
        comment: comment.trim(),
        photos: photoUrls, // Will be empty for now
        photoCount: photos.length,
        verified: true, // Only verified bookings can review
        helpfulCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      showSuccess('Review submitted successfully!');
      setOverallRating(0);
      setCategoryRatings({ quality: 0, punctuality: 0, communication: 0, value: 0 });
      setComment('');
      setPhotos([]);

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
      showError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingBooking) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Checking booking status...</p>
        </div>
      </div>
    );
  }

  if (!hasVerifiedBooking) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center py-4">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verified Booking Required
          </h3>
          <p className="text-gray-600 mb-4">
            You can only leave a review after completing a booking with this professional.
          </p>
          <p className="text-sm text-gray-500">
            Book a service to share your experience!
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Write a Review</h3>

      {/* Overall Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Overall Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setOverallRating(star)}
              className={`text-3xl transition-transform hover:scale-110 ${
                star <= overallRating ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              ★
            </button>
          ))}
          {overallRating > 0 && (
            <span className="ml-2 text-sm text-gray-600">
              {overallRating} {overallRating === 1 ? 'star' : 'stars'}
            </span>
          )}
        </div>
      </div>

      {/* Category Ratings */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Rate Specific Aspects (Optional)
        </label>
        <div className="space-y-4">
          {REVIEW_CATEGORIES.map((category) => (
            <div key={category.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{category.icon}</span>
                <span className="text-sm font-medium text-gray-700">{category.label}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleCategoryRating(category.id, star)}
                    className={`text-lg transition-transform hover:scale-110 ${
                      star <= categoryRatings[category.id]
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Share your experience with this professional..."
          required
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-gray-500">
          {comment.length}/1000 characters
        </p>
      </div>

      {/* Photo Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Photos (Optional)
        </label>
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
            disabled={photos.length >= 5}
          />
          <label
            htmlFor="photo-upload"
            className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
              photos.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Add Photos ({photos.length}/5)
          </label>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo.preview}
                    alt={`Review photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Maximum 5 photos, 5MB each. JPG, PNG, or GIF format.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || overallRating === 0 || !comment.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Submitting...
            </span>
          ) : (
            'Submit Review'
          )}
        </button>
      </div>
    </form>
  );
}

export default EnhancedReviewForm;

