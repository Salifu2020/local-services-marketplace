import React, { useState, useEffect } from 'react';
import { auth, db, appId } from '../firebase';
import { doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

function AdvancedAvailabilityManager() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Vacation mode
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationStartDate, setVacationStartDate] = useState('');
  const [vacationEndDate, setVacationEndDate] = useState('');
  
  // Blocked dates
  const [blockedDates, setBlockedDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  
  // Buffer time (in minutes)
  const [bufferTimeMinutes, setBufferTimeMinutes] = useState(0);
  
  // Auto-decline
  const [autoDeclineEnabled, setAutoDeclineEnabled] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    const userId = user.uid;
    const professionalRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'professionals',
      userId
    );

    const unsubscribe = onSnapshot(
      professionalRef,
      (docSnapshot) => {
        setLoading(false);
        
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          
          // Load vacation mode
          if (data.vacationMode !== undefined) {
            setVacationMode(data.vacationMode);
          }
          if (data.vacationStartDate) {
            const startDate = data.vacationStartDate.toDate ? 
              data.vacationStartDate.toDate() : new Date(data.vacationStartDate);
            setVacationStartDate(startDate.toISOString().split('T')[0]);
          }
          if (data.vacationEndDate) {
            const endDate = data.vacationEndDate.toDate ? 
              data.vacationEndDate.toDate() : new Date(data.vacationEndDate);
            setVacationEndDate(endDate.toISOString().split('T')[0]);
          }
          
          // Load blocked dates
          if (data.blockedDates && Array.isArray(data.blockedDates)) {
            setBlockedDates(data.blockedDates.map(date => {
              if (date.toDate) return date.toDate().toISOString().split('T')[0];
              if (date instanceof Date) return date.toISOString().split('T')[0];
              return date;
            }));
          }
          
          // Load buffer time
          if (data.bufferTimeMinutes !== undefined) {
            setBufferTimeMinutes(data.bufferTimeMinutes);
          }
          
          // Load auto-decline
          if (data.autoDeclineEnabled !== undefined) {
            setAutoDeclineEnabled(data.autoDeclineEnabled);
          }
        }
      },
      (error) => {
        console.error('Error loading availability settings:', error);
        setError(`Error loading settings: ${error.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const saveSettings = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const userId = user.uid;
      const professionalRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals',
        userId
      );

      const updateData = {
        vacationMode,
        bufferTimeMinutes,
        autoDeclineEnabled,
        updatedAt: new Date().toISOString(),
      };

      // Convert blocked dates to Firestore Timestamps
      if (blockedDates.length > 0) {
        updateData.blockedDates = blockedDates.map(dateStr => {
          const date = new Date(dateStr);
          date.setHours(0, 0, 0, 0);
          return Timestamp.fromDate(date);
        });
      } else {
        updateData.blockedDates = [];
      }

      // Handle vacation dates
      if (vacationMode) {
        if (vacationStartDate) {
          const startDate = new Date(vacationStartDate);
          startDate.setHours(0, 0, 0, 0);
          updateData.vacationStartDate = Timestamp.fromDate(startDate);
        }
        if (vacationEndDate) {
          const endDate = new Date(vacationEndDate);
          endDate.setHours(23, 59, 59, 999);
          updateData.vacationEndDate = Timestamp.fromDate(endDate);
        }
      } else {
        updateData.vacationStartDate = null;
        updateData.vacationEndDate = null;
      }

      await setDoc(professionalRef, updateData, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving availability settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlockedDate = () => {
    if (!selectedDate) {
      setError('Please select a date to block');
      return;
    }

    if (blockedDates.includes(selectedDate)) {
      setError('This date is already blocked');
      return;
    }

    const dateToAdd = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateToAdd < today) {
      setError('Cannot block past dates');
      return;
    }

    setBlockedDates([...blockedDates, selectedDate].sort());
    setSelectedDate('');
    setError(null);
  };

  const handleRemoveBlockedDate = (dateToRemove) => {
    setBlockedDates(blockedDates.filter(date => date !== dateToRemove));
  };

  const handleVacationModeToggle = (enabled) => {
    setVacationMode(enabled);
    if (!enabled) {
      setVacationStartDate('');
      setVacationEndDate('');
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading availability settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('availability.advancedSettings', 'Advanced Availability Settings')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('availability.advancedDescription', 'Manage blocked dates, vacation mode, buffer times, and auto-decline settings.')}
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">✓ Settings saved successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Vacation Mode Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-1">
              {t('availability.vacationMode', 'Vacation Mode')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('availability.vacationDescription', 'Temporarily disable all bookings during your vacation period.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleVacationModeToggle(!vacationMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              vacationMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                vacationMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {vacationMode && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('availability.vacationStart', 'Vacation Start Date')}
              </label>
              <input
                type="date"
                value={vacationStartDate}
                onChange={(e) => setVacationStartDate(e.target.value)}
                min={getMinDate()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('availability.vacationEnd', 'Vacation End Date')}
              </label>
              <input
                type="date"
                value={vacationEndDate}
                onChange={(e) => setVacationEndDate(e.target.value)}
                min={vacationStartDate || getMinDate()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Blocked Dates Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          {t('availability.blockedDates', 'Blocked Dates')}
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          {t('availability.blockedDescription', 'Block specific dates when you are unavailable. Customers cannot book on these dates.')}
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setError(null);
            }}
            min={getMinDate()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddBlockedDate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm font-medium"
          >
            {t('availability.addBlocked', 'Add Blocked Date')}
          </button>
        </div>

        {blockedDates.length > 0 && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              {t('availability.blockedList', 'Blocked Dates:')}
            </h5>
            <div className="flex flex-wrap gap-2">
              {blockedDates.map((date) => (
                <span
                  key={date}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm"
                >
                  {formatDate(date)}
                  <button
                    type="button"
                    onClick={() => handleRemoveBlockedDate(date)}
                    className="text-red-600 hover:text-red-800 focus:outline-none"
                    aria-label="Remove blocked date"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Buffer Time Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          {t('availability.bufferTime', 'Buffer Time Between Bookings')}
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          {t('availability.bufferDescription', 'Add a buffer period between bookings to allow for travel time and preparation.')}
        </p>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            {t('availability.bufferMinutes', 'Buffer Time (minutes):')}
          </label>
          <input
            type="number"
            value={bufferTimeMinutes}
            onChange={(e) => setBufferTimeMinutes(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            max="120"
            step="15"
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            ({Math.floor(bufferTimeMinutes / 60)}h {bufferTimeMinutes % 60}m)
          </span>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            {t('availability.bufferExample', 'Example: With a 30-minute buffer, if a booking ends at 2:00 PM, the next booking cannot start until 2:30 PM.')}
          </p>
        </div>
      </div>

      {/* Auto-Decline Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-1">
              {t('availability.autoDecline', 'Auto-Decline Unavailable Times')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('availability.autoDeclineDescription', 'Automatically decline booking requests that fall outside your availability or conflict with blocked dates.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoDeclineEnabled(!autoDeclineEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              autoDeclineEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoDeclineEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {autoDeclineEnabled && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              {t('availability.autoDeclineWarning', '⚠️ When enabled, booking requests that conflict with your schedule, blocked dates, or vacation mode will be automatically declined.')}
            </p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              {t('common.saving', 'Saving...')}
            </span>
          ) : (
            t('common.save', 'Save Settings')
          )}
        </button>
      </div>
    </div>
  );
}

export default AdvancedAvailabilityManager;


