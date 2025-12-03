import React, { useState } from 'react';

/**
 * Service categories for filtering
 */
export const SERVICE_CATEGORIES = [
  { value: 'all', label: 'All Services' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'other', label: 'Other' },
];

/**
 * Sort options
 */
export const SORT_OPTIONS = [
  { value: 'distance', label: 'Distance (Nearest First)' },
  { value: 'price-low', label: 'Price (Low to High)' },
  { value: 'price-high', label: 'Price (High to Low)' },
  { value: 'rating', label: 'Rating (Highest First)' },
  { value: 'newest', label: 'Newest First' },
  { value: 'reviews', label: 'Most Reviews' },
];

/**
 * Rating filter options
 */
export const RATING_OPTIONS = [
  { value: 'all', label: 'All Ratings' },
  { value: '4.5', label: '4.5+ Stars' },
  { value: '4', label: '4+ Stars' },
  { value: '3.5', label: '3.5+ Stars' },
  { value: '3', label: '3+ Stars' },
];

/**
 * Availability filter options
 */
export const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All Availability' },
  { value: 'today', label: 'Available Today' },
  { value: 'this-week', label: 'Available This Week' },
  { value: 'immediate', label: 'Immediate Availability' },
];

/**
 * Advanced Search Filters Component
 */
function SearchFilters({
  filters,
  onFiltersChange,
  isOpen,
  onToggle,
  resultCount,
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceRangeChange = (min, max) => {
    const newFilters = {
      ...localFilters,
      priceMin: min,
      priceMax: max,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const defaultFilters = {
      category: 'all',
      minRating: 'all',
      priceMin: 0,
      priceMax: 500,
      sortBy: 'distance',
      availability: 'all',
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      localFilters.category !== 'all' ||
      localFilters.minRating !== 'all' ||
      localFilters.priceMin > 0 ||
      localFilters.priceMax < 500 ||
      localFilters.sortBy !== 'distance' ||
      localFilters.availability !== 'all'
    );
  };

  return (
    <div className="mb-6">
      {/* Filter Toggle Button (Mobile) */}
      <div className="lg:hidden mb-4">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="font-medium text-gray-900">Filters</span>
            {hasActiveFilters() && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                Active
              </span>
            )}
            {resultCount !== null && (
              <span className="ml-2 text-sm text-gray-500">
                ({resultCount} results)
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Filter Panel - Always visible on desktop, toggleable on mobile */}
      <div className={`${isOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024) ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Filter & Sort</h3>
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Category
              </label>
              <select
                value={localFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <select
                value={localFilters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {RATING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                value={localFilters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate: ${localFilters.priceMin} - ${localFilters.priceMax}
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    step="10"
                    value={localFilters.priceMin}
                    onChange={(e) => {
                      const min = Math.min(parseInt(e.target.value) || 0, localFilters.priceMax);
                      handlePriceRangeChange(min, localFilters.priceMax);
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    step="10"
                    value={localFilters.priceMax}
                    onChange={(e) => {
                      const max = Math.max(parseInt(e.target.value) || 500, localFilters.priceMin);
                      handlePriceRangeChange(localFilters.priceMin, max);
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={localFilters.priceMin}
                    onChange={(e) => {
                      const min = parseInt(e.target.value);
                      if (min <= localFilters.priceMax) {
                        handlePriceRangeChange(min, localFilters.priceMax);
                      }
                    }}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={localFilters.priceMax}
                    onChange={(e) => {
                      const max = parseInt(e.target.value);
                      if (max >= localFilters.priceMin) {
                        handlePriceRangeChange(localFilters.priceMin, max);
                      }
                    }}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>$0</span>
                  <span>$500+</span>
                </div>
              </div>
            </div>

            {/* Sort By */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('sortBy', option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      localFilters.sortBy === option.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchFilters;

