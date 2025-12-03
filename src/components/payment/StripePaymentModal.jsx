import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../context/LoadingContext';

// Initialize Stripe
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

/**
 * Payment Form Component (used inside Elements provider)
 */
function PaymentForm({ booking, professionalName, amount, hours, onSuccess, onCancel, formatDate, formatTime }) {
  const stripe = useStripe();
  const elements = useElements();
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);

  // Create Payment Intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const { createPaymentIntent } = await import('../../utils/payment');
        const clientSecret = await createPaymentIntent(amount, 'usd', booking.id);
        setClientSecret(clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment. Please try again.');
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, booking.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await withLoading(
        async () => {
          // Use real Stripe confirmation if clientSecret is valid
          if (clientSecret && clientSecret !== 'mock_client_secret_for_testing') {
            return await stripe.confirmCardPayment(clientSecret, {
              payment_method: {
                card: cardElement,
                billing_details: {
                  name: 'Customer',
                },
              },
            });
          }

          // Mock success for development/testing (when backend not set up)
          // This will be used if backend is not configured
          // Remove this when backend is ready and tested
          if (import.meta.env.MODE === 'development') {
            console.warn('Using mock payment (backend not configured)');
            return {
              error: null,
              paymentIntent: {
                status: 'succeeded',
                id: `pi_mock_${Date.now()}`,
              },
            };
          }

          throw new Error('Payment backend not configured. Please set up backend.');
        },
        'Processing payment...'
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Please try again.');
        showError(stripeError.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        showSuccess('Payment successful!');
        onSuccess(paymentIntent);
      } else {
        setError('Payment was not completed. Please try again.');
        showError('Payment was not completed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred. Please try again.');
      showError('Payment error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Booking Details */}
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Service Provider</p>
          <p className="font-semibold text-gray-900">{professionalName}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Service Date</p>
          <p className="font-semibold text-gray-900">{formatDate(booking.date)}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Service Time</p>
          <p className="font-semibold text-gray-900">{formatTime(booking.time)}</p>
        </div>

        {hours > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Duration</p>
            <p className="font-semibold text-gray-900">
              {hours} {hours === 1 ? 'hour' : 'hours'}
            </p>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="flex justify-between items-center">
            <p className="text-lg font-semibold text-gray-900">Total Amount</p>
            <p className="text-2xl font-bold text-blue-600">${amount.toFixed(2)}</p>
          </div>
          {booking.hourlyRate && (
            <p className="text-sm text-gray-500 mt-1">
              ${booking.hourlyRate.toFixed(2)}/hr × {hours} {hours === 1 ? 'hour' : 'hours'}
            </p>
          )}
        </div>
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Test Card Info */}
      {import.meta.env.MODE === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-yellow-800 mb-2">Test Mode</p>
          <p className="text-xs text-yellow-700">
            Use test card: <strong>4242 4242 4242 4242</strong>
          </p>
          <p className="text-xs text-yellow-700">
            Any future expiry date, any CVC
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

/**
 * Main Stripe Payment Modal Component
 */
function StripePaymentModal({ booking, onConfirm, onCancel, formatDate, formatTime }) {
  const [professionalName, setProfessionalName] = useState('Professional');
  const [amount, setAmount] = useState(0);
  const [hours, setHours] = useState(1);

  useEffect(() => {
    const fetchProfessionalName = async () => {
      if (!booking.professionalId) return;

      try {
        const { db, appId } = await import('../../firebase');
        const { doc, getDoc } = await import('firebase/firestore');

        const professionalRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'professionals',
          booking.professionalId
        );

        const professionalDoc = await getDoc(professionalRef);
        if (professionalDoc.exists()) {
          const proData = professionalDoc.data();
          setProfessionalName(proData.name || proData.serviceType || 'Professional');
          if (proData.hourlyRate) {
            setAmount(proData.hourlyRate * hours);
          }
        }
      } catch (err) {
        console.error('Error fetching professional name:', err);
      }
    };

    fetchProfessionalName();
  }, [booking.professionalId, hours]);

  // Calculate amount if hourly rate exists
  useEffect(() => {
    if (booking.hourlyRate) {
      setAmount(booking.hourlyRate * hours);
    }
  }, [booking.hourlyRate, hours]);

  const handlePaymentSuccess = async (paymentIntent) => {
    // Call parent's onConfirm with payment details
    if (onConfirm) {
      await onConfirm(paymentIntent);
    }
  };

  // Check if Stripe is configured
  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Stripe Not Configured</h2>
            <p className="text-gray-600 mb-4">
              Please add your Stripe publishable key to environment variables.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
              <p className="text-sm font-semibold text-yellow-800 mb-2">Quick Fix:</p>
              <ol className="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Get your key from: <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a></li>
                <li>Add to <code className="bg-yellow-100 px-1 rounded">.env</code>: <code className="bg-yellow-100 px-1 rounded">VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...</code></li>
                <li>Restart dev server</li>
              </ol>
            </div>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <PaymentForm
              booking={booking}
              professionalName={professionalName}
              amount={amount}
              hours={hours}
              onSuccess={handlePaymentSuccess}
              onCancel={onCancel}
              formatDate={formatDate}
              formatTime={formatTime}
            />
          </Elements>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-600">Stripe is not properly configured. Please check your environment variables.</p>
            <button
              onClick={onCancel}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StripePaymentModal;

