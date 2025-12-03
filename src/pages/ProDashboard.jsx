import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, appId } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { sendConfirmationNotification, sendCancellationNotification, sendCompletionNotification } from '../utils/notifications';
import { updateReferralOnBookingCompletion } from '../utils/referral';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import EarningsCard from '../components/analytics/EarningsCard';
import BookingTrendsChart from '../components/analytics/BookingTrendsChart';
import CustomerInsights from '../components/analytics/CustomerInsights';
import AvailabilityAnalytics from '../components/analytics/AvailabilityAnalytics';
import PortfolioGallery from '../components/portfolio/PortfolioGallery';
import ServicePackages from '../components/packages/ServicePackages';
import DocumentSharing from '../components/documents/DocumentSharing';
import AdvancedAvailabilityManager from '../components/AdvancedAvailabilityManager';
import {
  calculateEarnings,
  calculateBookingTrends,
  calculateCustomerInsights,
  calculateAvailabilityAnalytics,
  fetchProfessionalReviews,
} from '../utils/analytics';

function ProDashboard() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [selectedBookingForDocuments, setSelectedBookingForDocuments] = useState(null);
  
  // Analytics state
  const [professionalData, setProfessionalData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState({
    earnings: { total: 0, monthly: 0, growth: null },
    trends: [],
    customerInsights: {
      totalCustomers: 0,
      repeatCustomers: 0,
      averageRating: 0,
      totalReviews: 0,
      topCustomers: [],
    },
    availability: {
      peakDays: [],
      peakHours: [],
      totalBookings: 0,
      averageBookingsPerDay: 0,
    },
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    const proId = user.uid;

    const bookingsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'bookings'
    );

    // Query bookings for this professional, ordered by date (newest first)
    const bookingsQuery = query(
      bookingsRef,
      where('professionalId', '==', proId),
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
        const errorMessage = err.message?.includes('index') 
          ? 'Database index required. Please contact support or try again later.'
          : err.message?.includes('permission')
          ? 'Permission denied. Please make sure you are logged in correctly.'
          : `Error loading bookings: ${err.message || 'Unknown error'}`;
        setError(errorMessage);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [navigate]);

  const handleConfirmBooking = async (bookingId) => {
    const user = auth.currentUser;
    if (!user) return;

    setUpdatingBookingId(bookingId);

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

      // Optimistic update: update local state immediately
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: 'Confirmed', updatedAt: new Date() }
            : booking
        )
      );

      // Update in Firestore with loading overlay
      await withLoading(async () => {
        await updateDoc(bookingRef, {
          status: 'Confirmed',
          updatedAt: serverTimestamp(),
        });

        // Send notification to customer
        if (bookingData?.userId) {
          try {
            // Get professional name for notification
            const professionalRef = doc(
              db,
              'artifacts',
              appId,
              'public',
              'data',
              'professionals',
              user.uid
            );
            const professionalDoc = await getDoc(professionalRef);
            const professionalData = professionalDoc.data();
            
            await sendConfirmationNotification(
              bookingData.userId,
              bookingId,
              {
                date: bookingData.date,
                time: bookingData.time,
                professionalName: professionalData?.serviceType || professionalData?.name || 'Professional',
                serviceType: professionalData?.serviceType,
              }
            );
          } catch (notifError) {
            console.error('Error sending confirmation notification:', notifError);
            // Don't fail the booking confirmation if notification fails
          }
        }
      }, 'Confirming booking...');

      showSuccess('Booking confirmed!');
    } catch (err) {
      console.error('Error confirming booking:', err);
      
      // Revert optimistic update on error
      // The onSnapshot will restore the correct state
      const errorMsg = 'Failed to confirm booking. Please try again.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleDeclineBooking = async (bookingId) => {
    const user = auth.currentUser;
    if (!user) return;

    setUpdatingBookingId(bookingId);

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

      // Optimistic update: update local state immediately
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: 'Cancelled', updatedAt: new Date() }
            : booking
        )
      );

      // Update in Firestore with loading overlay
      await withLoading(async () => {
        await updateDoc(bookingRef, {
          status: 'Cancelled',
          updatedAt: serverTimestamp(),
        });

        // Send notification to customer
        if (bookingData?.userId) {
          try {
            // Get professional name for notification
            const professionalRef = doc(
              db,
              'artifacts',
              appId,
              'public',
              'data',
              'professionals',
              user.uid
            );
            const professionalDoc = await getDoc(professionalRef);
            const professionalData = professionalDoc.data();
            
            await sendCancellationNotification(
              bookingData.userId,
              bookingId,
              {
                date: bookingData.date,
                time: bookingData.time,
                professionalName: professionalData?.serviceType || professionalData?.name || 'Professional',
              }
            );
          } catch (notifError) {
            console.error('Error sending cancellation notification:', notifError);
            // Don't fail the booking cancellation if notification fails
          }
        }
      }, 'Declining booking...');

      showSuccess('Booking declined');
    } catch (err) {
      console.error('Error declining booking:', err);
      
      // Revert optimistic update on error
      // The onSnapshot will restore the correct state
      const errorMsg = 'Failed to decline booking. Please try again.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    const user = auth.currentUser;
    if (!user) return;

    setUpdatingBookingId(bookingId);

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

      // Optimistic update: update local state immediately
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { 
                ...booking, 
                status: 'Completed', 
                paymentStatus: 'Awaiting Payment',
                updatedAt: new Date() 
              }
            : booking
        )
      );

      // Update in Firestore with loading overlay
      await withLoading(async () => {
        await updateDoc(bookingRef, {
          status: 'Completed',
          paymentStatus: 'Awaiting Payment',
          updatedAt: serverTimestamp(),
        });

        // Send notification to customer
        if (bookingData?.userId) {
          try {
            // Get professional name for notification
            const professionalRef = doc(
              db,
              'artifacts',
              appId,
              'public',
              'data',
              'professionals',
              user.uid
            );
            const professionalDoc = await getDoc(professionalRef);
            const professionalData = professionalDoc.data();
            
            await sendCompletionNotification(
              bookingData.userId,
              bookingId,
              {
                professionalName: professionalData?.serviceType || professionalData?.name || 'Professional',
                serviceType: professionalData?.serviceType,
              }
            );

            // Update referral status if this is the user's first completed booking
            try {
              await updateReferralOnBookingCompletion({
                id: bookingId,
                userId: bookingData.userId,
                status: 'Completed',
              });
            } catch (referralError) {
              console.error('Error updating referral:', referralError);
              // Don't fail the booking completion if referral update fails
            }
          } catch (notifError) {
            console.error('Error sending completion notification:', notifError);
            // Don't fail the booking completion if notification fails
          }
        }
      }, 'Completing booking...');

      showSuccess('Booking marked as completed!');
    } catch (err) {
      console.error('Error completing booking:', err);
      
      // Revert optimistic update on error
      // The onSnapshot will restore the correct state
      const errorMsg = 'Failed to complete booking. Please try again.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setUpdatingBookingId(null);
    }
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

  // Group bookings by status
  const pendingBookings = bookings.filter(b => b.status === 'Pending');
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');
  const otherBookings = bookings.filter(b => !['Pending', 'Confirmed'].includes(b.status));

  if (loading) {
    return (
      <>
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-xl font-bold text-gray-900">
                ExpertNextDoor
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
              ExpertNextDoor
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Dashboard</h1>
          <p className="text-gray-600">Manage your bookings and appointments</p>
        </div>

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

        {/* Analytics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics & Insights</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Earnings Card */}
            <EarningsCard
              earnings={analytics.earnings.total}
              monthlyEarnings={analytics.earnings.monthly}
              growth={analytics.earnings.growth}
            />

            {/* Customer Insights */}
            <CustomerInsights
              totalCustomers={analytics.customerInsights.totalCustomers}
              repeatCustomers={analytics.customerInsights.repeatCustomers}
              averageRating={analytics.customerInsights.averageRating}
              totalReviews={analytics.customerInsights.totalReviews}
              topCustomers={analytics.customerInsights.topCustomers}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Booking Trends */}
            <BookingTrendsChart
              data={analytics.trends}
              period="week"
            />

            {/* Availability Analytics */}
            <AvailabilityAnalytics
              peakDays={analytics.availability.peakDays}
              peakHours={analytics.availability.peakHours}
              totalBookings={analytics.availability.totalBookings}
              averageBookingsPerDay={analytics.availability.averageBookingsPerDay}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingBookings.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Confirmed</p>
            <p className="text-3xl font-bold text-green-600">{confirmedBookings.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-blue-600">{bookings.length}</p>
          </div>
        </div>

        {/* Pending Bookings */}
        {pendingBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pending Bookings</h2>
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onConfirm={() => handleConfirmBooking(booking.id)}
                  onDecline={() => handleDeclineBooking(booking.id)}
                  updating={updatingBookingId === booking.id}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confirmed Bookings */}
        {confirmedBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Confirmed Bookings</h2>
            <div className="space-y-4">
              {confirmedBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onComplete={() => handleCompleteBooking(booking.id)}
                  updating={updatingBookingId === booking.id}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Bookings (Cancelled, Completed) */}
        {otherBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">History</h2>
            <div className="space-y-4">
              {otherBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  getStatusColor={getStatusColor}
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
              You don't have any bookings yet. When customers book your services, they'll appear here.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                💡 Tips to get more bookings:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-6 text-left max-w-md mx-auto">
                <li>Make sure your profile is complete and up-to-date</li>
                <li>Add a compelling bio that highlights your expertise</li>
                <li>Set competitive hourly rates</li>
                <li>Keep your availability schedule updated</li>
              </ul>
              <Link
                to="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Home
              </Link>
            </div>
          </div>
        )}

        {/* Service Packages Management */}
        {auth.currentUser && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Packages</h2>
            <p className="text-gray-600 mb-6">
              Create fixed-price service packages to offer customers. Packages can include add-on services and discounts.
            </p>
            <ServicePackages 
              professionalId={auth.currentUser.uid} 
              isOwner={true}
            />
          </div>
        )}

        {/* Document Sharing */}
        {auth.currentUser && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Document Sharing</h2>
            <p className="text-gray-600 mb-6">
              Upload and share documents with customers. Share quotes, estimates, contracts, and other important files.
            </p>
            <DocumentSharing 
              professionalId={auth.currentUser.uid} 
              isOwner={true}
            />
          </div>
        )}

        {/* Portfolio Management */}
        {auth.currentUser && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Portfolio Gallery</h2>
            <p className="text-gray-600 mb-6">
              Showcase your work with photos. Upload before/after photos, completed projects, and work samples to attract more customers.
            </p>
            <PortfolioGallery 
              professionalId={auth.currentUser.uid} 
              isOwner={true}
            />
          </div>
        )}

        {/* Advanced Availability Management */}
        {auth.currentUser && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Advanced Availability Settings</h2>
            <p className="text-gray-600 mb-6">
              Manage blocked dates, vacation mode, buffer times, and auto-decline settings to control when customers can book your services.
            </p>
            <AdvancedAvailabilityManager />
          </div>
        )}

        {/* Booking Documents Modal */}
        {selectedBookingForDocuments && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBookingForDocuments(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">Booking Documents</h2>
                <button
                  onClick={() => setSelectedBookingForDocuments(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <DocumentSharing
                  professionalId={auth.currentUser.uid}
                  bookingId={selectedBookingForDocuments.id}
                  isOwner={true}
                  customerId={selectedBookingForDocuments.userId}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// Booking Card Component
function BookingCard({ booking, onConfirm, onDecline, onComplete, onViewDocuments, updating = false, formatDate, formatTime, getStatusColor }) {
  const isPending = booking.status === 'Pending';
  const isConfirmed = booking.status === 'Confirmed';
  const isPendingOrConfirmed = booking.status === 'Pending' || booking.status === 'Confirmed';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
        <div className="flex-1 mb-4 md:mb-0">
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
            {booking.createdAt && (
              <span className="text-sm text-gray-500">
                Created: {formatDate(booking.createdAt)}
              </span>
            )}
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
            {booking.userId && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Customer ID</p>
                <p className="font-mono text-sm text-gray-700">{booking.userId.substring(0, 12)}...</p>
              </div>
            )}
            {booking.serviceType && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Service Type</p>
                <p className="font-semibold text-gray-900">{booking.serviceType}</p>
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
          {/* Message Button for Pending or Confirmed Bookings */}
          {isPendingOrConfirmed && (
            <Link
              to={`/chat/${booking.id}`}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium text-center whitespace-nowrap shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              Message
            </Link>
          )}

          {/* Documents Button - Show for all bookings */}
          {onViewDocuments && (
            <button
              onClick={onViewDocuments}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 font-medium whitespace-nowrap shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              📄 Documents
            </button>
          )}

          {/* Complete Button for Confirmed Bookings */}
          {isConfirmed && onComplete && (
            <button
              onClick={onComplete}
              disabled={updating}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
            >
              {updating ? 'Updating...' : 'Complete'}
            </button>
          )}

          {/* Confirm/Decline Buttons for Pending Bookings */}
          {isPending && (onConfirm || onDecline) && (
            <>
              <button
                onClick={onConfirm}
                disabled={updating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {updating ? 'Updating...' : 'Confirm'}
              </button>
              <button
                onClick={onDecline}
                disabled={updating}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
              >
                {updating ? 'Updating...' : 'Decline'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProDashboard;

