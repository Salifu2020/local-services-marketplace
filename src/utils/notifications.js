import { db, appId } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendEmail, getBookingConfirmationEmail, getBookingReminderEmail, getPaymentReceiptEmail, getNewMessageEmail, getBookingCancellationEmail } from './emailService';
import { sendSMS, getBookingConfirmationSMS, getBookingReminderSMS, getPaymentConfirmationSMS, getNewMessageSMS, getBookingCancellationSMS, formatPhoneNumber } from './smsService';
import { shouldSendEmail, shouldSendSMS, getUserEmail, getUserPhone } from './notificationPreferences';

/**
 * Send a notification to a user
 * @param {string} userId - The user ID to send notification to
 * @param {string} message - Notification message text
 * @param {string} type - Notification type (e.g., 'BOOKING_CONFIRMED')
 * @param {string} relatedId - Optional related entity ID (e.g., bookingId)
 * @param {object} metadata - Optional additional data
 * @returns {Promise<string>} Notification document ID
 */
export async function sendNotification(userId, message, type, relatedId = null, metadata = {}) {
  try {
    // Path: /artifacts/{appId}/users/{userId}/notifications/{notificationId}
    const notificationsRef = collection(
      db,
      'artifacts',
      appId,
      'users',
      userId,
      'notifications'
    );

    const notificationData = {
      userId: userId,
      message: message,
      type: type,
      read: false,
      timestamp: serverTimestamp(),
    };

    if (relatedId) {
      notificationData.relatedId = relatedId;
    }

    if (Object.keys(metadata).length > 0) {
      notificationData.metadata = metadata;
    }

    const docRef = await addDoc(notificationsRef, notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Send booking confirmation notification to customer
 * @param {string} userId - Customer user ID
 * @param {string} bookingId - Booking ID
 * @param {object} bookingData - Booking data (date, time, professional info)
 * @returns {Promise<string>} Notification document ID
 */
export async function sendConfirmationNotification(userId, bookingId, bookingData = {}) {
  const { date, time, professionalName, serviceType, customerName, location, notes, duration } = bookingData;
  
  let message = 'Your booking has been confirmed!';
  
  if (date && time) {
    const dateStr = date.toDate ? date.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) : new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    
    const [hours, minutes] = time.split(':').map(Number);
    const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const timeStr = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    message = `Your booking${professionalName ? ` with ${professionalName}` : ''} has been confirmed for ${dateStr} at ${timeStr}`;
  }

  // Send in-app notification
  const notificationId = await sendNotification(
    userId,
    message,
    'BOOKING_CONFIRMED',
    bookingId,
    {
      bookingDate: date,
      bookingTime: time,
      professionalName: professionalName || null,
      serviceType: serviceType || null,
    }
  );

  // Send email if user has email notifications enabled
  try {
    if (await shouldSendEmail(userId, 'bookingConfirmations')) {
      const email = await getUserEmail(userId);
      if (email) {
        const emailBody = getBookingConfirmationEmail({
          customerName,
          professionalName,
          serviceType,
          date,
          time,
          duration,
          location,
          notes,
        });
        await sendEmail(email, 'Booking Confirmed - ExpertNextDoor', emailBody);
      }
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }

  // Send SMS if user has SMS notifications enabled
  try {
    if (await shouldSendSMS(userId, 'bookingConfirmations')) {
      const phone = await getUserPhone(userId);
      if (phone) {
        const smsMessage = getBookingConfirmationSMS({
          professionalName,
          serviceType,
          date,
          time,
        });
        const formattedPhone = formatPhoneNumber(phone);
        if (formattedPhone) {
          await sendSMS(formattedPhone, smsMessage);
        }
      }
    }
  } catch (error) {
    console.error('Error sending confirmation SMS:', error);
  }

  return notificationId;
}

/**
 * Send booking cancellation notification to customer
 * @param {string} userId - Customer user ID
 * @param {string} bookingId - Booking ID
 * @param {object} bookingData - Booking data
 * @returns {Promise<string>} Notification document ID
 */
export async function sendCancellationNotification(userId, bookingId, bookingData = {}) {
  const { date, time, professionalName, serviceType, customerName, reason } = bookingData;
  
  let message = 'Your booking has been cancelled.';
  
  if (professionalName) {
    message = `Your booking with ${professionalName} has been cancelled.`;
  }

  // Send in-app notification
  const notificationId = await sendNotification(
    userId,
    message,
    'BOOKING_CANCELLED',
    bookingId,
    {
      bookingDate: date,
      bookingTime: time,
      professionalName: professionalName || null,
    }
  );

  // Send email if user has email notifications enabled
  try {
    if (await shouldSendEmail(userId, 'bookingCancellations')) {
      const email = await getUserEmail(userId);
      if (email) {
        const emailBody = getBookingCancellationEmail({
          customerName,
          professionalName,
          serviceType,
          date,
          time,
          reason,
        });
        await sendEmail(email, 'Booking Cancelled - ExpertNextDoor', emailBody);
      }
    }
  } catch (error) {
    console.error('Error sending cancellation email:', error);
  }

  // Send SMS if user has SMS notifications enabled
  try {
    if (await shouldSendSMS(userId, 'bookingCancellations')) {
      const phone = await getUserPhone(userId);
      if (phone) {
        const smsMessage = getBookingCancellationSMS({
          professionalName,
          serviceType,
          date,
        });
        const formattedPhone = formatPhoneNumber(phone);
        if (formattedPhone) {
          await sendSMS(formattedPhone, smsMessage);
        }
      }
    }
  } catch (error) {
    console.error('Error sending cancellation SMS:', error);
  }

  return notificationId;
}

/**
 * Send booking completion notification to customer
 * @param {string} userId - Customer user ID
 * @param {string} bookingId - Booking ID
 * @param {object} bookingData - Booking data
 * @returns {Promise<string>} Notification document ID
 */
export async function sendCompletionNotification(userId, bookingId, bookingData = {}) {
  const { professionalName, serviceType } = bookingData;
  
  let message = 'Your service has been completed! Payment is now due.';
  
  if (professionalName) {
    message = `Your service with ${professionalName} has been completed. Please complete payment.`;
  }

  return sendNotification(
    userId,
    message,
    'BOOKING_COMPLETED',
    bookingId,
    {
      professionalName: professionalName || null,
      serviceType: serviceType || null,
    }
  );
}

/**
 * Send payment received notification to professional
 * @param {string} proId - Professional user ID
 * @param {string} bookingId - Booking ID
 * @param {object} bookingData - Booking data
 * @returns {Promise<string>} Notification document ID
 */
export async function sendPaymentReceivedNotification(proId, bookingId, bookingData = {}) {
  const { date, time, customerName, amount } = bookingData;
  
  let message = 'You have received a payment!';
  
  if (amount) {
    message = `You have received a payment of $${amount.toFixed(2)}`;
  }
  
  if (date) {
    const dateStr = date.toDate ? date.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }) : new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    message += ` for service on ${dateStr}`;
  }

  return sendNotification(
    proId,
    message,
    'PAYMENT_RECEIVED',
    bookingId,
    {
      bookingDate: date,
      bookingTime: time,
      customerName: customerName || null,
      amount: amount || null,
    }
  );
}

/**
 * Send new message notification
 * @param {string} userId - User ID to notify
 * @param {string} bookingId - Booking/chat ID
 * @param {string} senderName - Name of message sender
 * @returns {Promise<string>} Notification document ID
 */
export async function sendNewMessageNotification(userId, bookingId, senderName = 'Someone', messagePreview = null) {
  const message = `You have a new message from ${senderName}`;
  
  // Send in-app notification
  const notificationId = await sendNotification(
    userId,
    message,
    'NEW_MESSAGE',
    bookingId,
    {
      senderName: senderName,
    }
  );

  // Send email if user has email notifications enabled
  try {
    if (await shouldSendEmail(userId, 'newMessages')) {
      const email = await getUserEmail(userId);
      if (email) {
        const emailBody = getNewMessageEmail({
          recipientName: null, // Could fetch from user data
          senderName,
          messagePreview: messagePreview || 'New message received',
          bookingId,
        });
        await sendEmail(email, `New Message from ${senderName} - ExpertNextDoor`, emailBody);
      }
    }
  } catch (error) {
    console.error('Error sending message email:', error);
  }

  // Send SMS if user has SMS notifications enabled
  try {
    if (await shouldSendSMS(userId, 'newMessages')) {
      const phone = await getUserPhone(userId);
      if (phone) {
        const smsMessage = getNewMessageSMS({
          senderName,
          messagePreview: messagePreview || 'New message received',
        });
        const formattedPhone = formatPhoneNumber(phone);
        if (formattedPhone) {
          await sendSMS(formattedPhone, smsMessage);
        }
      }
    }
  } catch (error) {
    console.error('Error sending message SMS:', error);
  }

  return notificationId;
}

/**
 * Send payment reminder notification to customer
 * @param {string} userId - Customer user ID
 * @param {string} bookingId - Booking ID
 * @param {object} bookingData - Booking data
 * @returns {Promise<string>} Notification document ID
 */
export async function sendPaymentReminderNotification(userId, bookingId, bookingData = {}) {
  const { professionalName, amount } = bookingData;
  
  let message = 'Payment pending for your completed service.';
  
  if (amount) {
    message = `Payment of $${amount.toFixed(2)} is pending for your completed service.`;
  }
  
  if (professionalName) {
    message += ` Please complete payment to ${professionalName}.`;
  }

  return sendNotification(
    userId,
    message,
    'PAYMENT_REMINDER',
    bookingId,
    {
      professionalName: professionalName || null,
      amount: amount || null,
    }
  );
}

