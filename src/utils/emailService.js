/**
 * Email Service
 * Handles sending emails via backend API
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://local-services-marketplace-production.up.railway.app';

/**
 * Send email via backend API
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 * @param {string} textBody - Plain text email body (optional)
 * @returns {Promise<boolean>} Success status
 */
export async function sendEmail(to, subject, htmlBody, textBody = null) {
  try {
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html: htmlBody,
        text: textBody || htmlBody.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to send email' }));
      throw new Error(error.message || 'Failed to send email');
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - fail silently in production
    return false;
  }
}

/**
 * Email Templates
 */

/**
 * Booking Confirmation Email Template
 */
export function getBookingConfirmationEmail(bookingData) {
  const { customerName, professionalName, serviceType, date, time, duration, location, notes } = bookingData;
  
  const dateStr = date ? (date.toDate ? date.toDate().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })) : 'TBD';
  
  const timeStr = time ? (() => {
    const [hours, minutes] = time.split(':').map(Number);
    const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  })() : 'TBD';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed - ExpertNextDoor</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">ExpertNextDoor</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <h2 style="color: #1f2937; margin-top: 0;">✅ Booking Confirmed!</h2>
        
        <p>Hi ${customerName || 'there'},</p>
        
        <p>Your booking has been confirmed! Here are the details:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 10px 0;"><strong>Professional:</strong> ${professionalName || serviceType || 'Service Provider'}</p>
          <p style="margin: 10px 0;"><strong>Service Type:</strong> ${serviceType || 'General Service'}</p>
          <p style="margin: 10px 0;"><strong>Date:</strong> ${dateStr}</p>
          <p style="margin: 10px 0;"><strong>Time:</strong> ${timeStr}</p>
          ${duration ? `<p style="margin: 10px 0;"><strong>Duration:</strong> ${duration} ${duration === 1 ? 'hour' : 'hours'}</p>` : ''}
          ${location ? `<p style="margin: 10px 0;"><strong>Location:</strong> ${location}</p>` : ''}
        </div>
        
        ${notes ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Special Instructions:</strong></p>
            <p style="margin: 10px 0 0 0;">${notes}</p>
          </div>
        ` : ''}
        
        <p style="margin-top: 30px;">We'll send you a reminder 24 hours before your appointment.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${window.location.origin}/my-bookings" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Booking</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          Need to reschedule or cancel? Visit your <a href="${window.location.origin}/my-bookings" style="color: #667eea;">bookings page</a>.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Booking Reminder Email Template
 */
export function getBookingReminderEmail(bookingData) {
  const { customerName, professionalName, serviceType, date, time, location } = bookingData;
  
  const dateStr = date ? (date.toDate ? date.toDate().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })) : 'TBD';
  
  const timeStr = time ? (() => {
    const [hours, minutes] = time.split(':').map(Number);
    const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  })() : 'TBD';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Reminder - ExpertNextDoor</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">ExpertNextDoor</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <h2 style="color: #1f2937; margin-top: 0;">⏰ Reminder: Your Booking is Tomorrow</h2>
        
        <p>Hi ${customerName || 'there'},</p>
        
        <p>This is a friendly reminder that you have a booking scheduled:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 10px 0;"><strong>Professional:</strong> ${professionalName || serviceType || 'Service Provider'}</p>
          <p style="margin: 10px 0;"><strong>Date:</strong> ${dateStr}</p>
          <p style="margin: 10px 0;"><strong>Time:</strong> ${timeStr}</p>
          ${location ? `<p style="margin: 10px 0;"><strong>Location:</strong> ${location}</p>` : ''}
        </div>
        
        <p>Please make sure you're available at the scheduled time.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://expertnextdoor.com'}/my-bookings" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Booking</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Payment Receipt Email Template
 */
export function getPaymentReceiptEmail(paymentData) {
  const { customerName, professionalName, serviceType, amount, date, bookingId } = paymentData;
  
  const dateStr = date ? (date.toDate ? date.toDate().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })) : new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt - ExpertNextDoor</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">ExpertNextDoor</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <h2 style="color: #1f2937; margin-top: 0;">💰 Payment Receipt</h2>
        
        <p>Hi ${customerName || 'there'},</p>
        
        <p>Thank you for your payment! Here's your receipt:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 10px 0;"><strong>Amount Paid:</strong> $${amount.toFixed(2)}</p>
          <p style="margin: 10px 0;"><strong>Professional:</strong> ${professionalName || serviceType || 'Service Provider'}</p>
          <p style="margin: 10px 0;"><strong>Service:</strong> ${serviceType || 'General Service'}</p>
          <p style="margin: 10px 0;"><strong>Payment Date:</strong> ${dateStr}</p>
          ${bookingId ? `<p style="margin: 10px 0;"><strong>Booking ID:</strong> ${bookingId.substring(0, 8)}...</p>` : ''}
        </div>
        
        <p style="margin-top: 30px;">This receipt has been saved to your account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://expertnextdoor.com'}/my-bookings" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Bookings</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * New Message Email Template
 */
export function getNewMessageEmail(messageData) {
  const { recipientName, senderName, messagePreview, bookingId } = messageData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Message - ExpertNextDoor</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">ExpertNextDoor</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <h2 style="color: #1f2937; margin-top: 0;">💬 New Message</h2>
        
        <p>Hi ${recipientName || 'there'},</p>
        
        <p>You have a new message from <strong>${senderName || 'a user'}</strong>:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; font-style: italic;">"${messagePreview || 'New message received'}"</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://expertnextdoor.com'}/chat/${bookingId || ''}" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Message</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Booking Cancellation Email Template
 */
export function getBookingCancellationEmail(bookingData) {
  const { customerName, professionalName, serviceType, date, time, reason } = bookingData;
  
  const dateStr = date ? (date.toDate ? date.toDate().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })) : 'TBD';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Cancelled - ExpertNextDoor</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">ExpertNextDoor</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <h2 style="color: #1f2937; margin-top: 0;">❌ Booking Cancelled</h2>
        
        <p>Hi ${customerName || 'there'},</p>
        
        <p>Your booking has been cancelled:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 10px 0;"><strong>Professional:</strong> ${professionalName || serviceType || 'Service Provider'}</p>
          <p style="margin: 10px 0;"><strong>Date:</strong> ${dateStr}</p>
          ${time ? `<p style="margin: 10px 0;"><strong>Time:</strong> ${time}</p>` : ''}
          ${reason ? `<p style="margin: 10px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        
        <p>If you'd like to book again, you can search for professionals on ExpertNextDoor.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://expertnextdoor.com'}/" style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Find a Pro</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

