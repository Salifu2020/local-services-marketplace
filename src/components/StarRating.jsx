import React from 'react';

/**
 * Reusable Star Rating Component
 * 
 * @param {number} rating - Current rating (0-5)
 * @param {Function} onRatingChange - Callback when rating changes (for interactive mode)
 * @param {boolean} interactive - Whether the rating can be changed by clicking
 * @param {string} size - Size variant: 'sm', 'md', 'lg', 'xl'
 */
function StarRating({ 
  rating = 0, 
  onRatingChange, 
  interactive = false, 
  size = 'md' 
}) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const starSize = sizeClasses[size] || sizeClasses.md;
  const roundedRating = Math.round(rating);

  const handleStarClick = (starValue) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  return (
    <div className={`flex items-center gap-0.5 ${starSize}`} role="img" aria-label={`Rating: ${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= roundedRating;
        
        return interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            className={`transition-transform hover:scale-110 ${
              isFilled
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
            aria-label={`Rate ${star} out of 5 stars`}
          >
            ★
          </button>
        ) : (
          <span
            key={star}
            className={`${
              isFilled
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

export default StarRating;

