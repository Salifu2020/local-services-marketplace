/**
 * Payment utility functions
 * Handles payment processing and status updates
 */

/**
 * Create a Payment Intent
 * Supports both Firebase Cloud Functions and Express API
 */
export async function createPaymentIntent(amount, currency = 'usd', bookingId) {
  try {
    const { auth } = await import('../firebase');
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Option 1: Firebase Cloud Functions (Recommended)
    const useFirebaseFunctions = import.meta.env.VITE_USE_FIREBASE_FUNCTIONS === 'true';
    
    if (useFirebaseFunctions) {
      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const { getApp } = await import('firebase/app');
        
        const app = getApp();
        const functions = getFunctions(app);
        const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
        
        const result = await createPaymentIntentFn({
          amount,
          currency,
          bookingId,
        });
        
        return result.data.clientSecret;
      } catch (firebaseError) {
        console.error('Firebase Functions error:', firebaseError);
        // Fall through to Express API or mock
      }
    }

    // Option 2: Express API
    const apiUrl = import.meta.env.VITE_API_URL;
    
    if (apiUrl) {
      const response = await fetch(`${apiUrl}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          bookingId,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = await response.json();
      return clientSecret;
    }

    // Fallback: Mock for development (remove in production)
    if (import.meta.env.MODE === 'development') {
      console.warn('⚠️ No backend configured. Using mock payment intent.');
      console.warn('⚠️ Set up Firebase Functions or Express API for production.');
      return Promise.resolve('mock_client_secret_for_testing');
    }
    
    throw new Error('Payment backend not configured. Please set VITE_USE_FIREBASE_FUNCTIONS=true or VITE_API_URL');
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Calculate payment amount from booking
 */
export function calculatePaymentAmount(booking, hours = 1) {
  if (booking.hourlyRate) {
    return booking.hourlyRate * hours;
  }
  if (booking.amount) {
    return booking.amount;
  }
  return 0;
}

/**
 * Format amount for display
 */
export function formatAmount(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount) {
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  if (amount > 100000) {
    return { valid: false, error: 'Amount exceeds maximum limit' };
  }
  return { valid: true };
}

