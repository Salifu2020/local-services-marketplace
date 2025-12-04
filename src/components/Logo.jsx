import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Logo Component with Infinity Symbol
 * 
 * @param {boolean} showText - Whether to show text next to logo
 * @param {string} size - Size variant: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} link - Whether to wrap in Link component
 */
function Logo({ showText = true, size = 'md', link = false, className = '' }) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const textColor = className.includes('text-white') 
    ? 'text-white dark:text-slate-100' 
    : 'text-gray-900 dark:text-slate-100';
  
  const logoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`${sizeClasses[size]} bg-purple-600 text-white rounded-lg px-2 py-1 font-light flex items-center justify-center`}>
        ∞
      </span>
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold ${textColor}`}>
          ExpertNextDoor
        </span>
      )}
    </div>
  );

  if (link) {
    return (
      <Link to="/" className="hover:text-blue-600 transition-colors">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

export default Logo;

