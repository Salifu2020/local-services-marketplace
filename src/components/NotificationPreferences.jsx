import React, { useState, useEffect } from 'react';
import { auth, db, appId } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getUserNotificationPreferences, updateUserNotificationPreferences, DEFAULT_PREFERENCES } from '../utils/notificationPreferences';
import { useToast } from '../context/ToastContext';

function NotificationPreferences() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    const fetchPreferences = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const prefs = await getUserNotificationPreferences(user.uid);
        setPreferences(prefs);
      } catch (error) {
        console.error('Error fetching preferences:', error);
        showError('Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [showError]);

  const handleToggle = async (channel, type) => {
    const user = auth.currentUser;
    if (!user) return;

    const newPreferences = {
      ...preferences,
      [channel]: {
        ...preferences[channel],
        [type]: !preferences[channel][type],
      },
    };

    setPreferences(newPreferences);

    try {
      setSaving(true);
      await updateUserNotificationPreferences(user.uid, newPreferences);
      showSuccess('Notification preferences updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      showError('Failed to update preferences');
      // Revert on error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
      <p className="text-sm text-gray-600 mb-6">
        Choose how you want to receive notifications from ExpertNextDoor
      </p>

      {/* Email Notifications */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📧</span>
          Email Notifications
        </h3>
        <div className="space-y-3">
          <NotificationToggle
            label="Booking Confirmations"
            description="Get notified when your booking is confirmed"
            checked={preferences.email.bookingConfirmations}
            onChange={() => handleToggle('email', 'bookingConfirmations')}
            disabled={saving}
          />
          <NotificationToggle
            label="Booking Reminders"
            description="Receive reminders 24 hours before your appointment"
            checked={preferences.email.bookingReminders}
            onChange={() => handleToggle('email', 'bookingReminders')}
            disabled={saving}
          />
          <NotificationToggle
            label="Payment Receipts"
            description="Receive email receipts for payments"
            checked={preferences.email.paymentReceipts}
            onChange={() => handleToggle('email', 'paymentReceipts')}
            disabled={saving}
          />
          <NotificationToggle
            label="New Messages"
            description="Get notified when you receive a new message"
            checked={preferences.email.newMessages}
            onChange={() => handleToggle('email', 'newMessages')}
            disabled={saving}
          />
          <NotificationToggle
            label="Booking Cancellations"
            description="Get notified when a booking is cancelled"
            checked={preferences.email.bookingCancellations}
            onChange={() => handleToggle('email', 'bookingCancellations')}
            disabled={saving}
          />
          <NotificationToggle
            label="Review Requests"
            description="Get reminders to leave a review after service"
            checked={preferences.email.reviewRequests}
            onChange={() => handleToggle('email', 'reviewRequests')}
            disabled={saving}
          />
        </div>
      </div>

      {/* SMS Notifications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📱</span>
          SMS Notifications
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          SMS notifications are only sent for critical updates. Standard messaging rates may apply.
        </p>
        <div className="space-y-3">
          <NotificationToggle
            label="Booking Confirmations"
            description="Receive SMS when your booking is confirmed"
            checked={preferences.sms.bookingConfirmations}
            onChange={() => handleToggle('sms', 'bookingConfirmations')}
            disabled={saving}
          />
          <NotificationToggle
            label="Booking Reminders"
            description="Critical reminders 24 hours before appointment"
            checked={preferences.sms.bookingReminders}
            onChange={() => handleToggle('sms', 'bookingReminders')}
            disabled={saving}
          />
          <NotificationToggle
            label="Payment Confirmations"
            description="Get SMS confirmation when payment is received"
            checked={preferences.sms.paymentConfirmations}
            onChange={() => handleToggle('sms', 'paymentConfirmations')}
            disabled={saving}
          />
          <NotificationToggle
            label="New Messages"
            description="Receive SMS for new messages (not recommended)"
            checked={preferences.sms.newMessages}
            onChange={() => handleToggle('sms', 'newMessages')}
            disabled={saving}
          />
          <NotificationToggle
            label="Booking Cancellations"
            description="Get SMS when a booking is cancelled"
            checked={preferences.sms.bookingCancellations}
            onChange={() => handleToggle('sms', 'bookingCancellations')}
            disabled={saving}
          />
        </div>
      </div>

      {saving && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">Saving preferences...</p>
        </div>
      )}
    </div>
  );
}

function NotificationToggle({ label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1 mr-4">
        <label className="block font-medium text-gray-900 mb-1">{label}</label>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default NotificationPreferences;

