/**
 * Sentry Error Monitoring Integration
 * 
 * This file initializes Sentry for error tracking and performance monitoring.
 * Follows official Sentry React SDK setup: https://docs.sentry.io/platforms/javascript/guides/react/
 * 
 * To enable Sentry:
 * 1. Install: npm install --save @sentry/react
 * 2. Sign up at https://sentry.io and create a React project
 * 3. Copy your DSN from Sentry dashboard
 * 4. Add VITE_SENTRY_DSN to your .env file
 */

import * as Sentry from "@sentry/react";

let sentryInitialized = false;

export function initSentry() {
  // Only initialize if DSN is provided
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    // Sentry not configured - log helpful message
    console.warn('⚠️ Sentry not initialized: VITE_SENTRY_DSN not found in environment variables.');
    console.warn('   Create a .env file with: VITE_SENTRY_DSN=your-dsn-here');
    return;
  }

  try {
    Sentry.init({
      dsn: dsn,
      environment: import.meta.env.MODE, // 'development' or 'production'
      
      // Setting this option to true will send default PII data to Sentry.
      // For example, automatic IP address collection on events
      sendDefaultPii: true,
      
      // Set tracesSampleRate to 1.0 to capture 100% of transactions
      // Reduce in production if needed (e.g., 0.1 for 10% sampling)
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
      
      // Capture unhandled promise rejections
      captureUnhandledRejections: true,
      
      // Set release version (from package.json or CI/CD)
      release: import.meta.env.VITE_APP_VERSION || 'unknown',
      
      // Filter out known non-critical errors
      beforeSend(event, hint) {
        // Don't send errors in development (optional)
        if (import.meta.env.MODE === 'development') {
          console.error('Sentry Error (dev mode):', event);
          // Uncomment to disable Sentry in development:
          // return null;
        }
        
        // Filter out specific errors
        if (event.exception) {
          const error = hint.originalException;
          
          // Ignore network errors (user offline, etc.)
          if (error?.message?.includes('NetworkError') || 
              error?.message?.includes('Failed to fetch') ||
              error?.message?.includes('Network request failed')) {
            return null;
          }
          
          // Ignore Firebase permission errors (expected in some cases)
          if (error?.code === 'permission-denied') {
            return null;
          }
          
          // Ignore cancelled requests
          if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
            return null;
          }
        }
        
        return event;
      },
      
      // Add initial tags
      initialScope: {
        tags: {
          component: 'frontend',
        },
      },
    });

    sentryInitialized = true;
    console.log('✅ Sentry initialized successfully');
    console.log('   DSN:', dsn.substring(0, 30) + '...');
    console.log('   Environment:', import.meta.env.MODE);
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized() {
  return sentryInitialized;
}

/**
 * Set user context in Sentry
 * Call this when user logs in
 */
export function setSentryUser(user) {
  if (!sentryInitialized) return;
  
  if (user) {
    Sentry.setUser({
      id: user.uid,
      email: user.email || undefined,
      // Don't include sensitive data
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Manually capture an exception
 */
export function captureException(error, context = {}) {
  if (!sentryInitialized) {
    console.error('Error (Sentry not initialized):', error);
    return;
  }
  
  Sentry.captureException(error, context);
}

/**
 * Manually capture a message
 */
export function captureMessage(message, level = 'info') {
  if (!sentryInitialized) {
    console.log(`[${level}] ${message}`);
    return;
  }
  
  Sentry.captureMessage(message, level);
}

// Make Sentry available globally for ErrorBoundary
if (typeof window !== 'undefined') {
  window.Sentry = {
    captureException: (error, context) => {
      captureException(error, context);
    },
    captureMessage: (message, level) => {
      captureMessage(message, level);
    },
    setUser: (user) => {
      setSentryUser(user);
    },
  };
}

export default {
  initSentry,
  setSentryUser,
  captureException,
  captureMessage,
};

