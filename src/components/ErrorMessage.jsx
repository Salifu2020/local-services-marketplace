import React from 'react';

/**
 * Reusable Error Message Component
 * 
 * @param {string} message - Error message to display
 * @param {string} type - Error type: 'error', 'warning', 'info'
 * @param {ReactNode} action - Optional action button
 * @param {function} onDismiss - Optional dismiss handler
 */
export function ErrorMessage({ 
  message, 
  type = 'error',
  action = null,
  onDismiss = null,
  className = ''
}) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    error: '⚠️',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`mb-6 p-4 border rounded-lg ${styles[type]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-xl">{icons[type]}</span>
          <div className="flex-1">
            <p className="font-medium mb-1">
              {type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information'}
            </p>
            <p className="text-sm">{message}</p>
            {action && (
              <div className="mt-3">
                {action}
              </div>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Network Error Message with retry action
 */
export function NetworkErrorMessage({ onRetry = null, className = '' }) {
  return (
    <ErrorMessage
      message="Unable to connect to the server. Please check your internet connection and try again."
      type="error"
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Retry
          </button>
        )
      }
      className={className}
    />
  );
}

/**
 * Permission Error Message
 */
export function PermissionErrorMessage({ message = null, className = '' }) {
  return (
    <ErrorMessage
      message={message || "You don't have permission to perform this action. Please make sure you're logged in and try again."}
      type="error"
      className={className}
    />
  );
}

export default ErrorMessage;

