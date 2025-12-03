import React from 'react';

/**
 * Reusable Skeleton Loading Component
 * 
 * @param {string} variant - 'text', 'card', 'avatar', 'button', 'circle'
 * @param {number} lines - Number of lines for text variant
 * @param {string} className - Additional CSS classes
 */
export function Skeleton({ variant = 'text', lines = 1, className = '' }) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
        <div className="flex items-start gap-4 mb-4">
          <div className={`${baseClasses} w-16 h-16 rounded-full`} />
          <div className="flex-1 space-y-2">
            <div className={`${baseClasses} h-5 w-3/4`} />
            <div className={`${baseClasses} h-4 w-1/2`} />
          </div>
        </div>
        <div className="space-y-2">
          <div className={`${baseClasses} h-4 w-full`} />
          <div className={`${baseClasses} h-4 w-5/6`} />
          <div className={`${baseClasses} h-4 w-4/6`} />
        </div>
        <div className="mt-4 flex gap-2">
          <div className={`${baseClasses} h-10 w-24`} />
          <div className={`${baseClasses} h-10 w-24`} />
        </div>
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={`${baseClasses} w-12 h-12 rounded-full ${className}`} />
    );
  }

  if (variant === 'button') {
    return (
      <div className={`${baseClasses} h-10 w-24 ${className}`} />
    );
  }

  if (variant === 'circle') {
    return (
      <div className={`${baseClasses} w-16 h-16 rounded-full ${className}`} />
    );
  }

  return <div className={`${baseClasses} h-4 w-full ${className}`} />;
}

/**
 * Professional Card Skeleton
 */
export function ProfessionalCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton variant="circle" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" lines={1} className="h-6" />
          <Skeleton variant="text" lines={1} className="h-4 w-2/3" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton variant="text" lines={2} />
      </div>
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" lines={1} className="h-5 w-20" />
        <Skeleton variant="text" lines={1} className="h-5 w-24" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="button" className="h-10 flex-1" />
        <Skeleton variant="button" className="h-10 w-10" />
      </div>
    </div>
  );
}

/**
 * Booking Card Skeleton
 */
export function BookingCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="button" className="h-6 w-20" />
        <Skeleton variant="button" className="h-6 w-24" />
      </div>
      <Skeleton variant="text" lines={1} className="h-6 mb-4" />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Skeleton variant="text" lines={2} />
        <Skeleton variant="text" lines={2} />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="button" className="h-10 flex-1" />
        <Skeleton variant="button" className="h-10 flex-1" />
      </div>
    </div>
  );
}

/**
 * Chat Message Skeleton
 */
export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 mb-4">
      <Skeleton variant="avatar" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" lines={2} className="w-3/4" />
        <Skeleton variant="text" lines={1} className="h-3 w-16" />
      </div>
    </div>
  );
}

export default Skeleton;

