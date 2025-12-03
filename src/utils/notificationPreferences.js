/**
 * Notification Preferences Management
 * Handles user preferences for email and SMS notifications
 */

import { db, appId } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Default notification preferences
 */
export const DEFAULT_PREFERENCES = {
  email: {
    bookingConfirmations: true,
    bookingReminders: true,
    paymentReceipts: true,
    newMessages: true,
    bookingCancellations: true,
    reviewRequests: true,
  },
  sms: {
    bookingConfirmations: false,
    bookingReminders: true, // Critical reminders
    paymentConfirmations: true,
    newMessages: false,
    bookingCancellations: true,
  },
};

/**
 * Get user notification preferences
 * @param {string} userId - User ID
 * @returns {Promise<object>} User preferences
 */
export async function getUserNotificationPreferences(userId) {
  try {
    const prefsRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'users',
      userId
    );

    const prefsDoc = await getDoc(prefsRef);
    
    if (prefsDoc.exists()) {
      const data = prefsDoc.data();
      // Merge with defaults to ensure all preferences exist
      return {
        email: { ...DEFAULT_PREFERENCES.email, ...(data.notificationPreferences?.email || {}) },
        sms: { ...DEFAULT_PREFERENCES.sms, ...(data.notificationPreferences?.sms || {}) },
      };
    }

    // Return defaults if user doesn't exist
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Update user notification preferences
 * @param {string} userId - User ID
 * @param {object} preferences - New preferences
 * @returns {Promise<void>}
 */
export async function updateUserNotificationPreferences(userId, preferences) {
  try {
    const userRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'users',
      userId
    );

    // Get existing user data
    const userDoc = await getDoc(userRef);
    const existingData = userDoc.exists() ? userDoc.data() : {};

    // Update preferences
    await setDoc(
      userRef,
      {
        ...existingData,
        notificationPreferences: preferences,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

/**
 * Check if user wants to receive email for a notification type
 * @param {string} userId - User ID
 * @param {string} type - Notification type (e.g., 'bookingConfirmations')
 * @returns {Promise<boolean>}
 */
export async function shouldSendEmail(userId, type) {
  try {
    const prefs = await getUserNotificationPreferences(userId);
    return prefs.email[type] !== false; // Default to true if not explicitly false
  } catch (error) {
    console.error('Error checking email preference:', error);
    return true; // Default to sending if error
  }
}

/**
 * Check if user wants to receive SMS for a notification type
 * @param {string} userId - User ID
 * @param {string} type - Notification type (e.g., 'bookingConfirmations')
 * @returns {Promise<boolean>}
 */
export async function shouldSendSMS(userId, type) {
  try {
    const prefs = await getUserNotificationPreferences(userId);
    return prefs.sms[type] === true; // Only send if explicitly enabled
  } catch (error) {
    console.error('Error checking SMS preference:', error);
    return false; // Default to not sending if error
  }
}

/**
 * Get user email address
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} User email or null
 */
export async function getUserEmail(userId) {
  try {
    const userRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'users',
      userId
    );

    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.email || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user email:', error);
    return null;
  }
}

/**
 * Get user phone number
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} User phone or null
 */
export async function getUserPhone(userId) {
  try {
    const userRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'users',
      userId
    );

    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.phone || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user phone:', error);
    return null;
  }
}

