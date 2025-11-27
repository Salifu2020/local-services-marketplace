import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, appId } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { sendPaymentReceivedNotification } from '../utils/notifications';

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    const userId = user.uid;

    const bookingsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'bookings'
    );

    // Query bookings for this customer, ordered by date (newest first)
    const bookingsQuery = query(
      bookingsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        setLoading(false);
        setError(null);

        const bookingsList = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          bookingsList.push({
            id: doc.id,
            ...data,
          });
        });

        setBookings(bookingsList);
      },
      (err) => {
        console.error('onSnapshot error for bookings:', err);
        setError(`Error loading bookings: ${err.message}`);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [navigate]);

  const handlePayNow = async (bookingId, booking = null) => {
    const user = auth.currentUser;
    if (!user) return;

    // If booking is provided, show payment modal
    if (booking) {
      setSelectedBooking(booking);
      setShowPaymentModal(true);
      return;
    }

    setProcessingPayment(bookingId);
    setPaymentSuccess(null);

    try {
      // Get booking data for notification
      const bookingRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'bookings',
        bookingId
      );

      const bookingDoc = await getDoc(bookingRef);
      const bookingData = bookingDoc.data();

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update booking payment status
      await updateDoc(bookingRef, {
        paymentStatus: 'Paid',
        updatedAt: serverTimestamp(),
      });

      // Send notification to professional
      if (bookingData?.professionalId) {
        try {
          // Get customer name for notification (if available)
          const userRef = doc(
            db,
            'artifacts',
            appId,
            'public',
            'data',
            'users',
            user.uid
          );
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();
          
          await sendPaymentReceivedNotification(
            bookingData.professionalId,
            bookingId,
            {
              date: bookingData.date,
              time: bookingData.time,
              customerName: userData?.name || null,
              amount: bookingData.hourlyRate || null,
            }
          );
        } catch (notifError) {
          console.error('Error sending payment notification:', notifError);
          // Don't fail the payment if notification fails
        }
      }

      setPaymentSuccess(bookingId);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setPaymentSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedBooking) return;
    setShowPaymentModal(false);
    await handlePayNow(selectedBooking.id);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    
    // If time is in 24-hour format (e.g., "09:00"), convert to 12-hour
    if (typeof time === 'string' && time.includes(':')) {
      const [hours, minutes] = time.split(':').map(Number);
      const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    return time;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Awaiting Payment':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group bookings into Upcoming and Past Jobs
  const upcomingBookings = bookings.filter(b => 
    b.status === 'Pending' || b.status === 'Confirmed'
  );
  
  const pastJobs = bookings.filter(b => 
    b.status === 'Completed' || b.status === 'Cancelled'
  );

  // Helper function to handle rebooking
  const handleRebook = (professionalId) => {
    if (professionalId) {
      navigate(`/book/${professionalId}`);
    } else {
      setError('Professional ID not found. Cannot rebook.');
    }
  };

  if (loading) {
    return (
      <>
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-xl font-bold text-gray-900">
                Customer Portal
              </Link>
            </div>
          </div>
        </nav>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your bookings...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Customer Portal
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your service appointments</p>
        </div>

        {/* Success Message */}
        {paymentSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✓ Payment processed successfully! Thank you for your payment.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-medium text-red-800 mb-1">Error Loading Bookings</p>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Upcoming</p>
            <p className="text-3xl font-bold text-blue-600">{upcomingBookings.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Past Jobs</p>
            <p className="text-3xl font-bold text-gray-600">{pastJobs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
          </div>
        </div>

        {/* Upcoming Bookings (Pending/Confirmed) */}
        {upcomingBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Upcoming</h2>
            <p className="text-sm text-gray-600 mb-4">Pending and confirmed appointments</p>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  getStatusColor={getStatusColor}
                  getPaymentStatusColor={getPaymentStatusColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Jobs (Completed/Cancelled) */}
        {pastJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Past Jobs</h2>
            <p className="text-sm text-gray-600 mb-4">Completed and cancelled bookings</p>
            <div className="space-y-4">
              {pastJobs.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onPayNow={booking.status === 'Completed' ? () => handlePayNow(booking.id, booking) : null}
                  onRebook={booking.status === 'Completed' ? () => handleRebook(booking.professionalId) : null}
                  processingPayment={processingPayment === booking.id}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  getStatusColor={getStatusColor}
                  getPaymentStatusColor={getPaymentStatusColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && bookings.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You don't have any bookings yet. Start by searching for a professional and booking your first service!
            </p>
            <div className="space-y-3">
              <Link
                to="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Find a Pro
              </Link>
              <p className="text-sm text-gray-500 mt-4">
                💡 Tip: Search by service type (e.g., "Plumber", "Electrician") or location to find professionals near you
              </p>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedBooking && (
          <PaymentModal
            booking={selectedBooking}
            onConfirm={handleConfirmPayment}
            onCancel={() => {
              setShowPaymentModal(false);
              setSelectedBooking(null);
            }}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}
      </main>
    </>
  );
}

// Booking Card Component
function BookingCard({ booking, onPayNow, onRebook, processingPayment = false, formatDate, formatTime, getStatusColor, getPaymentStatusColor }) {
  const isCompleted = booking.status === 'Completed';
  const awaitingPayment = booking.paymentStatus === 'Awaiting Payment';
  const isPaid = booking.paymentStatus === 'Paid';

  // Fetch professional name
  const [professionalName, setProfessionalName] = useState('Professional');
  
  useEffect(() => {
    const fetchProfessionalName = async () => {
      if (!booking.professionalId) return;

      try {
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
          setProfessionalName(proData.serviceType || proData.name || 'Professional');
        }
      } catch (err) {
        console.error('Error fetching professional name:', err);
      }
    };

    fetchProfessionalName();
  }, [booking.professionalId]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
        <div className="flex-1 mb-4 md:mb-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
            {booking.paymentStatus && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColor(booking.paymentStatus)}`}>
                {booking.paymentStatus}
              </span>
            )}
            {booking.createdAt && (
              <span className="text-sm text-gray-500">
                Created: {formatDate(booking.createdAt)}
              </span>
            )}
          </div>

          <div className="mb-3">
            <p className="text-lg font-semibold text-gray-900">{professionalName}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Date</p>
              <p className="font-semibold text-gray-900">{formatDate(booking.date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Time</p>
              <p className="font-semibold text-gray-900">{formatTime(booking.time)}</p>
            </div>
            {booking.serviceType && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Service Type</p>
                <p className="font-semibold text-gray-900">{booking.serviceType}</p>
              </div>
            )}
            {booking.hourlyRate && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Rate</p>
                <p className="font-semibold text-gray-900">
                  ${booking.hourlyRate.toFixed(2)}/hr
                </p>
              </div>
            )}
          </div>

          {booking.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 md:ml-4">
          {/* Rebook Button for Completed Bookings */}
          {isCompleted && onRebook && (
            <button
              onClick={onRebook}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium whitespace-nowrap shadow-md hover:shadow-lg"
            >
              Rebook
            </button>
          )}

          {/* Pay Now Button for Completed Bookings with Awaiting Payment */}
          {isCompleted && awaitingPayment && onPayNow && (
            <button
              onClick={onPayNow}
              disabled={processingPayment}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {processingPayment ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Processing...
                </span>
              ) : (
                'Pay Now'
              )}
            </button>
          )}

          {/* Payment Status for Paid Bookings */}
          {isCompleted && isPaid && (
            <div className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-center font-medium whitespace-nowrap">
              ✓ Paid
            </div>
          )}

          {/* Message Button */}
          {(booking.status === 'Pending' || booking.status === 'Confirmed' || booking.status === 'Completed') && (
            <Link
              to={`/chat/${booking.id}`}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-center whitespace-nowrap"
            >
              Message
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Payment Modal Component
function PaymentModal({ booking, onConfirm, onCancel, formatDate, formatTime }) {
  const [professionalName, setProfessionalName] = useState('Professional');
  const [amount, setAmount] = useState(0);
  const [hours, setHours] = useState(1);

  useEffect(() => {
    const fetchProfessionalName = async () => {
      if (!booking.professionalId) return;

      try {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
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

        <div className="space-y-4 mb-6">
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

          {booking.hourlyRate && (
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm text-gray-500 mb-2">Hours</label>
              <input
                type="number"
                min="1"
                value={hours}
                onChange={(e) => setHours(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Note:</span> This is a mock payment. In production, this would integrate with Stripe, PayPal, or another payment processor.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            Pay ${amount.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyBookings;

