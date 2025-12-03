import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth, db, appId } from '../firebase';
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import ServicePackages from '../components/packages/ServicePackages';
import { calculateBookingTravelFee, isWithinServiceArea } from '../utils/travelFee';
import { mockGeocode } from '../utils/geocoding';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { 
  isDateBlocked, 
  isVacationDate, 
  generateAvailableTimeSlots,
  isBookingAvailable 
} from '../utils/availability';

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
  const { showError: showToastError, showSuccess } = useToast();
  const { t } = useTranslation();
  const [professional, setProfessional] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(2); // Default 2 hours
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState('weekly'); // weekly, bi-weekly, monthly
  const [recurringEndDate, setRecurringEndDate] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [packages, setPackages] = useState([]);
  const [pricingMode, setPricingMode] = useState('hourly'); // 'hourly' or 'package'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [customerLocation, setCustomerLocation] = useState('');
  const [customerLocationCoords, setCustomerLocationCoords] = useState(null);
  const [travelFee, setTravelFee] = useState(0);
  const [geocodingLocation, setGeocodingLocation] = useState(false);

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

  // Calculate travel fee when customer location or professional changes
  useEffect(() => {
    if (professional && customerLocationCoords) {
      const fee = calculateBookingTravelFee(professional, customerLocationCoords);
      setTravelFee(fee);
      
      // Check if within service area
      const withinArea = isWithinServiceArea(professional, customerLocationCoords);
      if (!withinArea && professional.serviceRadius) {
        showToastError(`Your location is outside the professional's service area (${professional.serviceRadius} km radius). Travel fee may apply.`);
      }
    } else {
      setTravelFee(0);
    }
  }, [professional, customerLocationCoords, showToastError]);

  const handleLocationSearch = async () => {
    if (!customerLocation.trim()) {
      showToastError('Please enter a location');
      return;
    }

    setGeocodingLocation(true);
    try {
      const coords = await mockGeocode(customerLocation);
      if (coords) {
        setCustomerLocationCoords({
          lat: coords.lat,
          lon: coords.lon,
          locationText: customerLocation
        });
        showSuccess('Location found!');
      } else {
        showToastError('Location not found. Please try a different address.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      showToastError('Failed to find location. Please try again.');
    } finally {
      setGeocodingLocation(false);
    }
  };

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

  // Fetch service packages
  useEffect(() => {
    if (!proId) return;

    const packagesRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'professionals',
      proId,
      'packages'
    );

    const packagesQuery = query(packagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      packagesQuery,
      (snapshot) => {
        const packagesList = [];
        snapshot.forEach((doc) => {
          packagesList.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setPackages(packagesList);
      },
      (err) => {
        console.error('Error fetching packages:', err);
      }
    );

    return () => unsubscribe();
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

      // Check if date is blocked
      if (isDateBlocked(date, professional.blockedDates)) {
        continue;
      }

      // Check if date is in vacation period
      if (isVacationDate(date, professional.vacationMode, professional.vacationStartDate, professional.vacationEndDate)) {
        continue;
      }

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

    // Use the advanced availability utility to generate available time slots
    // This considers blocked dates, vacation mode, buffer time, and existing bookings
    const durationMinutes = duration * 60;
    
    return generateAvailableTimeSlots({
      date: selectedDate,
      availability: professional.availability,
      durationMinutes,
      professional: professional,
      existingBookings: bookings,
      intervalMinutes: 30,
    });
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

    // Double-check that the time slot is still available using advanced availability checks
    const durationMinutes = duration * 60;
    const availabilityCheck = isBookingAvailable({
      date: selectedDate,
      time: selectedTime,
      durationMinutes,
      professional: professional,
      existingBookings: bookings,
    });

    if (!availabilityCheck.available) {
      setError(availabilityCheck.reason || 'This time slot is no longer available. Please select another time.');
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

      // Create booking(s) - handle recurring bookings
      const bookingsToCreate = [];
      
      if (recurring && recurringEndDate) {
        // Generate recurring bookings
        let currentDate = new Date(bookingDate);
        const endDate = new Date(recurringEndDate);
        endDate.setHours(23, 59, 59, 999);
        
        const dayIncrement = recurringType === 'weekly' ? 7 : 
                            recurringType === 'bi-weekly' ? 14 : 
                            30; // monthly

        // Calculate amount for recurring bookings
        let amount = 0;
        if (pricingMode === 'package' && selectedPackage) {
          amount = selectedPackage.price;
          selectedAddOns.forEach((addOnId) => {
            const addOnIndex = parseInt(addOnId.split('-')[1]);
            const addOn = selectedPackage.addOns[addOnIndex];
            if (addOn) amount += addOn.price;
          });
        } else if (professional?.hourlyRate) {
          amount = professional.hourlyRate * duration;
        }
        
        // Add travel fee if customer location is set (applies to all recurring bookings)
        if (travelFee > 0) {
          amount += travelFee;
        }

        const recurringGroupId = Date.now().toString();
        
        while (currentDate <= endDate) {
          const recurringBookingDate = new Date(currentDate);
          recurringBookingDate.setHours(0, 0, 0, 0);
          
          bookingsToCreate.push({
            professionalId: proId,
            userId: user.uid,
            date: recurringBookingDate,
            time: selectedTime,
            duration: duration,
            notes: notes.trim() || null,
            status: 'Pending',
            isRecurring: true,
            recurringType: recurringType,
            recurringGroupId: recurringGroupId,
            pricingMode: pricingMode,
            packageId: pricingMode === 'package' && selectedPackage ? selectedPackage.id : null,
            packageName: pricingMode === 'package' && selectedPackage ? selectedPackage.name : null,
            selectedAddOns: selectedAddOns,
            amount: amount > 0 ? amount : null,
            paymentStatus: 'Pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          
          currentDate.setDate(currentDate.getDate() + dayIncrement);
        }
      } else {
        // Single booking
        // Calculate amount based on pricing mode
        let amount = 0;
        if (pricingMode === 'package' && selectedPackage) {
          amount = selectedPackage.price;
          // Add selected add-ons
          selectedAddOns.forEach((addOnId) => {
            const addOnIndex = parseInt(addOnId.split('-')[1]);
            const addOn = selectedPackage.addOns[addOnIndex];
            if (addOn) {
              amount += addOn.price;
            }
          });
        } else if (professional?.hourlyRate) {
          amount = professional.hourlyRate * duration;
        }

        bookingsToCreate.push({
          professionalId: proId,
          userId: user.uid,
          date: bookingDate,
          time: selectedTime,
          duration: duration,
          notes: notes.trim() || null,
          status: 'Pending',
          isRecurring: false,
          pricingMode: pricingMode,
          packageId: pricingMode === 'package' && selectedPackage ? selectedPackage.id : null,
          packageName: pricingMode === 'package' && selectedPackage ? selectedPackage.name : null,
          selectedAddOns: selectedAddOns,
          amount: amount > 0 ? amount : null,
          paymentStatus: 'Pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Create all bookings
      for (const bookingData of bookingsToCreate) {
        await addDoc(bookingsRef, bookingData);
      }

      setSuccess(true);
      
      // Reset form
      setSelectedDate(null);
      setSelectedTime('');
      setSelectedPackage(null);
      setSelectedAddOns([]);
      setPricingMode('hourly');

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
                ExpertNextDoor
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
                ExpertNextDoor
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
              ExpertNextDoor
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
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md scale-105'
                          : 'border-gray-200 hover:border-blue-300 bg-white text-gray-900 hover:shadow-md transform hover:scale-105 active:scale-95'
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

          {/* Service Duration */}
          {selectedDate && selectedTime && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Duration <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 1, label: '1 Hour' },
                  { value: 2, label: '2 Hours' },
                  { value: 4, label: '4 Hours' },
                  { value: 8, label: 'Full Day (8hrs)' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDuration(option.value)}
                    className={`p-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                      duration === option.value
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 hover:border-blue-300 bg-white text-gray-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Location (for travel fee calculation) */}
          {selectedDate && selectedTime && (
            <div className="mb-6">
              <label htmlFor="customerLocation" className="block text-sm font-medium text-gray-700 mb-2">
                Service Location (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="customerLocation"
                  value={customerLocation}
                  onChange={(e) => setCustomerLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                  placeholder="Enter your address or city (e.g., Miami, FL)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleLocationSearch}
                  disabled={geocodingLocation || !customerLocation.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {geocodingLocation ? 'Finding...' : 'Find'}
                </button>
              </div>
              {customerLocationCoords && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Location set: {customerLocationCoords.locationText}
                  {travelFee > 0 && (
                    <span className="ml-2">• Travel fee: ${travelFee.toFixed(2)}</span>
                  )}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {t('booking.serviceLocationHelp')}
              </p>
            </div>
          )}

          {/* Booking Notes */}
          {selectedDate && selectedTime && (
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                {t('booking.specialInstructions')}
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any special instructions, requirements, or notes for the professional..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {notes.length}/500 characters
              </p>
            </div>
          )}

          {/* Recurring Booking Option */}
          {selectedDate && selectedTime && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={recurring}
                  onChange={(e) => {
                    setRecurring(e.target.checked);
                    if (!e.target.checked) {
                      setRecurringEndDate(null);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                  Make this a recurring booking
                </label>
              </div>

              {recurring && (
                <div className="ml-7 space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repeat Frequency
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'bi-weekly', label: 'Bi-Weekly' },
                        { value: 'monthly', label: 'Monthly' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRecurringType(option.value)}
                          className={`p-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                            recurringType === option.value
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-gray-200 hover:border-blue-300 bg-white text-gray-900'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="recurringEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="recurringEndDate"
                      value={recurringEndDate ? recurringEndDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null;
                        if (date && date >= selectedDate) {
                          setRecurringEndDate(date);
                        }
                      }}
                      min={selectedDate.toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={recurring}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Bookings will be created from {formatDate(selectedDate)} until this date
                    </p>
                  </div>
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
                <p><strong>Duration:</strong> {duration} {duration === 1 ? 'hour' : 'hours'}</p>
                {pricingMode === 'hourly' && professional?.hourlyRate && (
                  <p><strong>{t('booking.rate')}:</strong> ${professional.hourlyRate.toFixed(2)}/hr</p>
                )}
                {pricingMode === 'hourly' && professional?.hourlyRate && (
                  <>
                    {travelFee > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>{t('booking.travelFee')}:</strong> ${travelFee.toFixed(2)}
                      </p>
                    )}
                    <p className="text-base font-semibold text-gray-900 mt-2">
                      <strong>{t('booking.estimatedTotal')}:</strong> ${((professional.hourlyRate * duration) + travelFee).toFixed(2)}
                    </p>
                  </>
                )}
                {pricingMode === 'package' && selectedPackage && (
                  <div className="mt-2">
                    <p><strong>{t('booking.package')}:</strong> {selectedPackage.name}</p>
                    {travelFee > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>{t('booking.travelFee')}:</strong> ${travelFee.toFixed(2)}
                      </p>
                    )}
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      <strong>{t('booking.total')}:</strong> $
                      {(
                        selectedPackage.price +
                        selectedAddOns.reduce((sum, addOnId) => {
                          const addOnIndex = parseInt(addOnId.split('-')[1]);
                          const addOn = selectedPackage.addOns[addOnIndex];
                          return sum + (addOn?.price || 0);
                        }, 0) +
                        travelFee
                      ).toFixed(2)}
                    </p>
                  </div>
                )}
                {recurring && recurringEndDate && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-blue-600 font-medium">
                      🔄 Recurring: {recurringType === 'weekly' ? 'Every week' : 
                                    recurringType === 'bi-weekly' ? 'Every 2 weeks' : 
                                    'Every month'} until {formatDate(recurringEndDate)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Multiple bookings will be created automatically
                    </p>
                  </div>
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

