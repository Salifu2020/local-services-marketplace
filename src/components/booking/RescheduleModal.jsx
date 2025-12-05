import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, appId } from '../../firebase';

function RescheduleModal({ booking, professional, onConfirm, onCancel }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get day name from date
  const getDayName = (date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  // Generate time slots
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

  // Fetch available dates and bookings
  useEffect(() => {
    if (!professional?.availability) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Get existing bookings
        const bookingsRef = collection(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'bookings'
        );

        const bookingsQuery = query(
          bookingsRef,
          where('professionalId', '==', booking.professionalId),
          where('status', 'in', ['Pending', 'Confirmed'])
        );

        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookingsList = [];
        bookingsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id !== booking.id) { // Exclude current booking
            bookingsList.push({
              id: doc.id,
              ...data,
            });
          }
        });
        setExistingBookings(bookingsList);

        // Get available dates (next 30 days)
        const dates = [];
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          
          const dayName = getDayName(date);
          const daySchedule = professional.availability[dayName];

          if (daySchedule?.enabled && daySchedule?.startTime && daySchedule?.endTime) {
            dates.push(date);
          }
        }

        setAvailableDates(dates);
      } catch (err) {
        console.error('Error fetching availability:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [professional, booking]);

  // Get available time slots for selected date
  useEffect(() => {
    if (!selectedDate || !professional?.availability) {
      setAvailableTimeSlots([]);
      return;
    }

    const dayName = getDayName(selectedDate);
    const daySchedule = professional.availability[dayName];

    if (!daySchedule?.enabled || !daySchedule?.startTime || !daySchedule?.endTime) {
      setAvailableTimeSlots([]);
      return;
    }

    const allSlots = generateTimeSlots(daySchedule.startTime, daySchedule.endTime);
    const dateString = selectedDate.toISOString().split('T')[0];
    
    const bookedSlots = existingBookings
      .filter(b => {
        if (!b.date) return false;
        const bookingDate = b.date.toDate 
          ? b.date.toDate().toISOString().split('T')[0]
          : new Date(b.date).toISOString().split('T')[0];
        return bookingDate === dateString;
      })
      .map(b => b.time || b.startTime);

    const available = allSlots.filter(slot => !bookedSlots.includes(slot.value));
    setAvailableTimeSlots(available);
  }, [selectedDate, professional, existingBookings]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onConfirm(selectedDate, selectedTime);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Reschedule Booking</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading availability...</p>
            </div>
          ) : (
            <>
              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select New Date <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-h-48 overflow-y-auto">
                  {availableDates.map((date) => {
                    const isSelected = selectedDate && 
                      date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
                    
                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime('');
                        }}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:border-blue-300 bg-white'
                        }`}
                      >
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                          <p className="text-lg font-semibold">{date.getDate()}</p>
                          <p className="text-xs text-gray-500">
                            {date.toLocaleDateString('en-US', { month: 'short' })}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select New Time <span className="text-red-500">*</span>
                  </label>
                  {availableTimeSlots.length === 0 ? (
                    <p className="text-sm text-yellow-600">No available time slots for this date.</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                      {availableTimeSlots.map((slot) => {
                        const isSelected = selectedTime === slot.value;
                        return (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => setSelectedTime(slot.value)}
                            className={`p-2 rounded-lg border-2 text-sm ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-gray-200 hover:border-blue-300 bg-white'
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

              {/* Summary */}
              {selectedDate && selectedTime && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>New Date:</strong> {formatDate(selectedDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>New Time:</strong> {availableTimeSlots.find(s => s.value === selectedTime)?.label || selectedTime}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Reschedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RescheduleModal;


