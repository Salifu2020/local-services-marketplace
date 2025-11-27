import React, { useState, useEffect } from 'react';
import { auth, db, appId } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const DAYS_OF_WEEK = [
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' },
];

// Generate time options (30-minute intervals from 6 AM to 10 PM)
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
      times.push({ value: time24, label: time12 });
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

// Default schedule structure
const getDefaultSchedule = () => {
  return DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.value] = {
      enabled: day.value !== 'saturday' && day.value !== 'sunday', // Default: weekdays enabled
      startTime: '09:00',
      endTime: '17:00',
    };
    return acc;
  }, {});
};

function AvailabilitySchedule() {
  const [schedule, setSchedule] = useState(getDefaultSchedule());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [calendarLink, setCalendarLink] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    const userId = user.uid;
    
    // Construct the Firestore path
    const professionalRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'professionals',
      userId
    );

    // Set up real-time listener with onSnapshot
    const unsubscribe = onSnapshot(
      professionalRef,
      (docSnapshot) => {
        setLoading(false);
        
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          
          // If availability exists, use it; otherwise use default
          if (data.availability && typeof data.availability === 'object') {
            // Merge with default to ensure all days are present
            const mergedSchedule = { ...getDefaultSchedule(), ...data.availability };
            setSchedule(mergedSchedule);
          } else {
            setSchedule(getDefaultSchedule());
          }
          
          // Load calendar link if it exists
          if (data.calendarLink) {
            setCalendarLink(data.calendarLink);
          }
        } else {
          setSchedule(getDefaultSchedule());
        }
      },
      (error) => {
        console.error('onSnapshot error:', error);
        setError(`Error loading schedule: ${error.message}`);
        setLoading(false);
        // Still use default schedule even if there's an error
        setSchedule(getDefaultSchedule());
      }
    );

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const updateSchedule = async (updatedSchedule) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userId = user.uid;
      setSaving(true);
      setError(null);
      setSuccess(false);

      try {
        // Construct the Firestore path
      const professionalRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals',
        userId
      );

      // Save the schedule as a JSON object in the availability field
      await setDoc(
        professionalRef,
        {
          availability: updatedSchedule,
          updatedAt: new Date().toISOString(),
        },
          { merge: true }
        );

        setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating schedule:', err);
      setError(err.message || 'Failed to save schedule');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDayToggle = async (dayValue) => {
    const updatedSchedule = {
      ...schedule,
      [dayValue]: {
        ...schedule[dayValue],
        enabled: !schedule[dayValue].enabled,
      },
    };
    setSchedule(updatedSchedule);
    await updateSchedule(updatedSchedule);
  };

  const handleTimeChange = async (dayValue, field, value) => {
    const updatedSchedule = {
      ...schedule,
      [dayValue]: {
        ...schedule[dayValue],
        [field]: value,
      },
    };

    // If start time changed and is now >= end time, adjust end time
    if (field === 'startTime') {
      const currentEndTime = updatedSchedule[dayValue].endTime;
      if (value >= currentEndTime) {
        // Find the next available time slot (30 minutes after start)
        const [startH, startM] = value.split(':').map(Number);
        let nextH = startH;
        let nextM = startM + 30;
        if (nextM >= 60) {
          nextM = 0;
          nextH += 1;
        }
        if (nextH > 22) {
          nextH = 22;
          nextM = 0;
        }
        updatedSchedule[dayValue].endTime = `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
      }
    }

    setSchedule(updatedSchedule);
    await updateSchedule(updatedSchedule);
  };

  const handleSaveAll = async () => {
    await updateSchedule(schedule);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Set Your Weekly Availability</h3>
        <p className="text-sm text-gray-600">
          Select your working hours for each day. Customers will only be able to book during these times.
        </p>
      </div>

      {/* Calendar Link Display */}
      {calendarLink && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-yellow-600 text-xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                External Calendar Link Detected
              </h3>
              <p className="text-sm text-yellow-800 mb-2 break-all">
                <strong>Calendar URL:</strong> {calendarLink}
              </p>
              <p className="text-xs text-yellow-700 italic">
                In a production app, we would fetch and merge this external calendar data with your internal availability.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">✓ Schedule saved successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Schedule Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-gray-700">
            <div className="col-span-3">Day</div>
            <div className="col-span-2 text-center">Available</div>
            <div className="col-span-3">Start Time</div>
            <div className="col-span-3">End Time</div>
            <div className="col-span-1"></div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedule = schedule[day.value];
            const isEnabled = daySchedule?.enabled || false;

            return (
              <div
                key={day.value}
                className={`grid grid-cols-12 gap-4 p-4 items-center ${
                  isEnabled ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {/* Day Name */}
                <div className="col-span-3">
                  <label className="font-medium text-gray-900">{day.label}</label>
                </div>

                {/* Toggle Switch */}
                <div className="col-span-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Start Time */}
                <div className="col-span-3">
                  <select
                    value={daySchedule?.startTime || '09:00'}
                    onChange={(e) => handleTimeChange(day.value, 'startTime', e.target.value)}
                    disabled={!isEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !isEnabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
                    }`}
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time.value} value={time.value}>
                        {time.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* End Time */}
                <div className="col-span-3">
                  <select
                    value={daySchedule?.endTime || '17:00'}
                    onChange={(e) => handleTimeChange(day.value, 'endTime', e.target.value)}
                    disabled={!isEnabled}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !isEnabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
                    }`}
                  >
                    {TIME_OPTIONS.map((time) => {
                      // Only show times after the selected start time
                      const startTime = daySchedule?.startTime || '09:00';
                      const currentEndTime = daySchedule?.endTime || '17:00';
                      // Always show current end time (even if invalid) to prevent losing selection
                      // Otherwise, only show times after start time
                      if (time.value === currentEndTime || time.value > startTime) {
                        return (
                          <option key={time.value} value={time.value}>
                            {time.label}
                          </option>
                        );
                      }
                      return null;
                    })}
                  </select>
                </div>

                {/* Duration Display */}
                <div className="col-span-1 text-xs text-gray-500">
                  {isEnabled && daySchedule?.startTime && daySchedule?.endTime ? (
                    <span>
                      {(() => {
                        const [startH, startM] = daySchedule.startTime.split(':').map(Number);
                        const [endH, endM] = daySchedule.endTime.split(':').map(Number);
                        const startMinutes = startH * 60 + startM;
                        const endMinutes = endH * 60 + endM;
                        const duration = endMinutes - startMinutes;
                        const hours = Math.floor(duration / 60);
                        const minutes = duration % 60;
                        return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
                      })()}
                    </span>
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Save Button (optional, since we auto-save) */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Saving...
            </span>
          ) : (
            'Save Schedule'
          )}
        </button>
      </div>

      {/* Info Note */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Your schedule is automatically saved when you make changes. Changes are synced in real-time across all your devices.
        </p>
      </div>
    </div>
  );
}

export default AvailabilitySchedule;

