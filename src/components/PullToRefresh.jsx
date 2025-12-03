import React from 'react';

/**
 * Pull-to-refresh indicator component
 * Shows visual feedback during pull-to-refresh gesture
 */
function PullToRefresh({ isPulling, pullProgress, isRefreshing }) {
  if (!isPulling && !isRefreshing) return null;

  const rotation = pullProgress * 360;
  const opacity = Math.min(pullProgress * 1.5, 1);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-blue-900 bg-opacity-90 transition-all duration-200"
      style={{
        height: `${Math.min(pullProgress * 80, 80)}px`,
        opacity,
        transform: `translateY(${isRefreshing ? 0 : -80 + Math.min(pullProgress * 80, 80)}px)`,
      }}
    >
      <div className="flex flex-col items-center justify-center">
        {isRefreshing ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
            <p className="text-white text-sm font-medium">Refreshing...</p>
          </>
        ) : (
          <>
            <svg
              className="w-8 h-8 text-white mb-2 transition-transform duration-200"
              style={{ transform: `rotate(${rotation}deg)` }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <p className="text-white text-xs">
              {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default PullToRefresh;

