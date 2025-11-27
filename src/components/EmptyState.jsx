import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Empty State Component
 * 
 * @param {string} icon - Emoji or icon to display
 * @param {string} title - Main title text
 * @param {string} description - Description text
 * @param {ReactNode} action - Optional action button/link
 * @param {string} className - Additional CSS classes
 */
export function EmptyState({ 
  icon = '📭', 
  title, 
  description, 
  action = null,
  className = '' 
}) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-12 text-center border border-gray-200 ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * Empty State with Search Suggestion
 */
export function EmptyStateWithSearch({ 
  icon = '🔍', 
  title = 'No Results Found',
  description = 'Try adjusting your search criteria',
  searchQuery = '',
  suggestions = [],
  onClearSearch = null
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      
      {searchQuery && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            Your search: <span className="font-semibold text-gray-700">"{searchQuery}"</span>
          </p>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-2">Suggestions:</p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Browse All Professionals
        </Link>
      </div>
    </div>
  );
}

export default EmptyState;

