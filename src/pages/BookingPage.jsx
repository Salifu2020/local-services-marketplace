import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth, db, appId } from '../firebase';
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';

// Helper function to get day name from date
const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

// Helper function to format date for display
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper function to generate time slots between start and end time
const generateTimeSlots = (startTime, endTime, intervalMinutes = 30) => {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let currentH = startH;
  let currentM = startM;
  
  while (currentH < endH || (currentH === endH && currentM < endM)) {
    const time24 = `${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`;
    const hour12 = currentH > 12 ? currentH - 12 : currentH === 0 ? 12 : currentH;
    const ampm = currentH >= 12 ? 'PM' : 'AM';
    const time12 = `${hour12}:${currentM.toString().padStart(2, '0')} ${ampm}`;
    
    slots.push({ value: time24, label: time12 });
    
    currentM += intervalMinutes;
    if (currentM >= 60) {
      currentM = 0;
      currentH += 1;
    }
  }
  
  return slots;
};

// Helper function to check if a date is in the past
const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

function BookingPage() {
  const { id: proId } = useParams();
  const navigate = useNavigate();
  const [professional, setProfessional] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch professional data
  useEffect(() => {
    const fetchProfessional = async () => {
      if (!proId) {
        setError('Professional ID is required');
        setLoading(false);
        return;
      }

      try {
        const professionalRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'professionals',
          proId
        );

        const docSnapshot = await getDoc(professionalRef);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setProfessional({
            id: docSnapshot.id,
            ...data,
          });
        } else {
          setError('Professional not found');
        }
      } catch (err) {
        console.error('Error fetching professional:', err);
        setError(err.message || 'Failed to load professional');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessional();
  }, [proId]);

  // Fetch existing bookings for this professional
  useEffect(() => {
    if (!proId) return;

    const bookingsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'bookings'
    );

    // Query bookings for this professional with pending or confirmed status
    const bookingsQuery = query(
      bookingsRef,
      where('professionalId', '==', proId),
      where('status', 'in', ['Pending', 'Confirmed'])
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
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
      }
    );

    return () => {
      unsubscribe();
    };
  }, [proId]);

  // Get available dates (next 30 days)
  const getAvailableDates = () => {
    if (!professional?.availability) return [];

    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (isPastDate(date)) continue;

      const dayName = getDayName(date);
      const daySchedule = professional.availability[dayName];

      if (daySchedule?.enabled && daySchedule?.startTime && daySchedule?.endTime) {
        dates.push(date);
      }
    }

    return dates;
  };

  // Get available time slots for selected date
  const getAvailableTimeSlots = () => {
    if (!selectedDate || !professional?.availability) return [];

    const dayName = getDayName(selectedDate);
    const daySchedule = professional.availability[dayName];

    if (!daySchedule?.enabled || !daySchedule?.startTime || !daySchedule?.endTime) {
      return [];
    }

    // Generate all time slots for this day
    const allSlots = generateTimeSlots(daySchedule.startTime, daySchedule.endTime);

    // Filter out booked time slots
    const dateString = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const bookedSlots = bookings
      .filter(booking => {
        if (!booking.date) return false;
        const bookingDate = booking.date.toDate 
          ? booking.date.toDate().toISOString().split('T')[0]
          : new Date(booking.date).toISOString().split('T')[0];
        return bookingDate === dateString;
      })
      .map(booking => booking.time || booking.startTime);

    return allSlots.filter(slot => !bookedSlots.includes(slot.value));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to book a service');
      return;
    }

    if (!selectedDate || !selectedTime) {
      setError('Please select both a date and time');
      return;
    }

    // Double-check that the time slot is still available
    const availableSlots = getAvailableTimeSlots();
    const isSlotAvailable = availableSlots.some(slot => slot.value === selectedTime);

    if (!isSlotAvailable) {
      setError('This time slot is no longer available. Please select another time.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const bookingsRef = collection(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'bookings'
      );

      // Format date for storage (store as timestamp)
      // Create a new date object to avoid mutating the selected date
      const bookingDate = new Date(selectedDate);
      bookingDate.setHours(0, 0, 0, 0);

      const bookingData = {
        professionalId: proId,
        userId: user.uid,
        date: bookingDate, // Firestore will convert Date to Timestamp
        time: selectedTime,
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(bookingsRef, bookingData);

      setSuccess(true);
      
      // Reset form
      setSelectedDate(null);
      setSelectedTime('');

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
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
            <p className="text-gray-600 text-lg">Loading booking information...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !professional) {
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
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  const availableDates = getAvailableDates();
  const availableTimeSlots = getAvailableTimeSlots();

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
                to={`/pro-details/${proId}`}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                ← Back to Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Info Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Book a Service</h1>
          {professional && (
            <div className="flex items-center gap-4">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {professional.serviceType || 'Professional'}
                </p>
                {professional.hourlyRate && (
                  <p className="text-gray-600">
                    ${professional.hourlyRate.toFixed(2)}/hr
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✓ Booking request submitted successfully! Redirecting...
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmitBooking} className="bg-white rounded-lg shadow-md p-8">
          {/* Date Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select a Date <span className="text-red-500">*</span>
            </label>
            
            {availableDates.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  No available dates found. This professional may not have set their availability schedule.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {availableDates.map((date) => {
                  const isSelected = selectedDate && 
                    date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
                  
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => handleDateSelect(date)}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-blue-300 bg-white text-gray-900'
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-lg font-semibold">
                          {date.getDate()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select a Time <span className="text-red-500">*</span>
              </label>
              
              {availableTimeSlots.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    No available time slots for {formatDate(selectedDate)}. All slots may be booked.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {availableTimeSlots.map((slot) => {
                    const isSelected = selectedTime === slot.value;
                    
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => handleTimeSelect(slot.value)}
                        className={`p-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-200 hover:border-blue-300 bg-white text-gray-900'
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Booking Summary */}
          {selectedDate && selectedTime && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Date:</strong> {formatDate(selectedDate)}</p>
                <p><strong>Time:</strong> {availableTimeSlots.find(s => s.value === selectedTime)?.label || selectedTime}</p>
                {professional?.hourlyRate && (
                  <p><strong>Rate:</strong> ${professional.hourlyRate.toFixed(2)}/hr</p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!selectedDate || !selectedTime || submitting}
              className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Submitting...
                </span>
              ) : (
                'Request Booking'
              )}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

export default BookingPage;

