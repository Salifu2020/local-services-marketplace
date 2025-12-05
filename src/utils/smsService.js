/**
 * SMS Service
 * Handles sending SMS via backend API
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://local-services-marketplace-production.up.railway.app';

/**
 * Send SMS via backend API
 * @param {string} to - Recipient phone number (E.164 format: +1234567890)
 * @param {string} message - SMS message text
 * @returns {Promise<boolean>} Success status
 */
export async function sendSMS(to, message) {
  try {
    // Validate phone number format (basic check)
    if (!to.startsWith('+')) {
      console.warn('Phone number should be in E.164 format (e.g., +1234567890)');
    }

    const response = await fetch(`${API_URL}/api/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        message,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to send SMS' }));
      throw new Error(error.message || 'Failed to send SMS');
    }

    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    // Don't throw - fail silently in production
    return false;
  }
}

/**
 * SMS Message Templates
 */

/**
 * Booking Confirmation SMS
 */
export function getBookingConfirmationSMS(bookingData) {
  const { professionalName, serviceType, date, time } = bookingData;
  
  const dateStr = date ? (date.toDate ? date.toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) : new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })) : 'TBD';
  
  const timeStr = time ? (() => {
    const [hours, minutes] = time.split(':').map(Number);
    const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  })() : 'TBD';

  return `✅ Booking confirmed! ${professionalName || serviceType || 'Service'} on ${dateStr} at ${timeStr}. ExpertNextDoor`;
}

/**
 * Booking Reminder SMS (24hr before)
 */
export function getBookingReminderSMS(bookingData) {
  const { professionalName, serviceType, date, time } = bookingData;
  
  const dateStr = date ? (date.toDate ? date.toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) : new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })) : 'TBD';
  
  const timeStr = time ? (() => {
    const [hours, minutes] = time.split(':').map(Number);
    const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  })() : 'TBD';

  return `⏰ Reminder: Your booking with ${professionalName || serviceType || 'Service Provider'} is tomorrow (${dateStr}) at ${timeStr}. ExpertNextDoor`;
}

/**
 * Booking Reminder SMS (2hr before)
 */
export function getBookingReminder2HrSMS(bookingData) {
  const { professionalName, serviceType, time } = bookingData;
  
  const timeStr = time ? (() => {
    const [hours, minutes] = time.split(':').map(Number);
    const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  })() : 'TBD';

  return `⏰ Reminder: Your booking with ${professionalName || serviceType || 'Service Provider'} is in 2 hours (${timeStr}). ExpertNextDoor`;
}

/**
 * Payment Confirmation SMS
 */
export function getPaymentConfirmationSMS(paymentData) {
  const { professionalName, amount } = paymentData;
  return `💰 Payment of $${amount.toFixed(2)} confirmed for ${professionalName || 'service'}. Thank you! ExpertNextDoor`;
}

/**
 * New Message SMS
 */
export function getNewMessageSMS(messageData) {
  const { senderName, messagePreview } = messageData;
  const preview = messagePreview && messagePreview.length > 50 
    ? messagePreview.substring(0, 50) + '...' 
    : messagePreview || 'New message';
  return `💬 New message from ${senderName || 'someone'}: "${preview}" ExpertNextDoor`;
}

/**
 * Booking Cancellation SMS
 */
export function getBookingCancellationSMS(bookingData) {
  const { professionalName, serviceType, date } = bookingData;
  
  const dateStr = date ? (date.toDate ? date.toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) : new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })) : 'TBD';

  return `❌ Booking cancelled: ${professionalName || serviceType || 'Service'} on ${dateStr}. ExpertNextDoor`;
}

/**
 * Format phone number to E.164 format
 * @param {string} phone - Phone number in any format
 * @returns {string} Phone number in E.164 format
 */
export function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 1 (US country code), keep it
  // Otherwise, assume it's a US number and add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('+')) {
    return phone; // Already in E.164 format
  }
  
  // Default: assume US number
  return `+1${cleaned}`;
}


