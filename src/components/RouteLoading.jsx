import React from 'react';
import { Skeleton } from './Skeleton';

/**
 * Loading component for Suspense fallback during route lazy loading
 */
function RouteLoading({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center w-full max-w-md px-4">
        <div className="mb-6">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">{message}</p>
        </div>
        {/* Show skeleton preview for better perceived performance */}
        <div className="mt-8 space-y-4">
          <Skeleton variant="card" />
        </div>
      </div>
    </div>
  );
}

/**
 * Compact loading component for smaller route transitions
 */
function CompactRouteLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default RouteLoading;
export { CompactRouteLoading };

