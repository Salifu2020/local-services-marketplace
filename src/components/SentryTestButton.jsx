/**
 * Sentry Test Button Component
 * 
 * This component is for testing Sentry error tracking.
 * Add this to your app temporarily to verify Sentry is working.
 * 
 * Usage: Import and add <SentryTestButton /> to any page
 */

import React from 'react';
import * as Sentry from '@sentry/react';
import { isSentryInitialized } from '../sentry';

function SentryTestButton() {
  const handleClick = () => {
    const error = new Error('This is your first error!');
    
    // Log to console for debugging
    console.log('🚨 Testing Sentry error tracking...');
    console.log('Error:', error);
    
    // Check if Sentry is initialized
    if (!isSentryInitialized()) {
      console.error('❌ Sentry is not initialized!');
      console.error('   Make sure:');
      console.error('   1. You have a .env file in the project root');
      console.error('   2. It contains: VITE_SENTRY_DSN=your-dsn-here');
      console.error('   3. You restarted the dev server after adding the DSN');
      alert('Sentry not initialized! Check browser console for details.');
      return;
    }
    
    // Send to Sentry directly
    try {
      Sentry.captureException(error);
      console.log('✅ Error sent to Sentry! Check your Sentry dashboard.');
      console.log('   Go to: https://sentry.io → Your Project → Issues');
      alert('✅ Error sent to Sentry! Check your dashboard at sentry.io');
    } catch (sentryError) {
      console.error('❌ Failed to send error to Sentry:', sentryError);
      alert('Failed to send error to Sentry. Check console for details.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
      >
        Break the world
      </button>
      <p className="text-xs text-blue-200 text-center">
        Click to send a test error to Sentry
      </p>
    </div>
  );
}

export default SentryTestButton;

