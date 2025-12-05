/**
 * Application Constants
 * Centralized constants used throughout the application
 */

// Service Types
export const SERVICE_TYPES = [
  'Plumber',
  'Electrician',
  'HVAC',
  'Carpenter',
  'Painter',
  'Landscaper',
  'Roofer',
  'Handyman',
  'Locksmith',
  'Appliance Repair',
  'Flooring',
];

// Booking Statuses
export const BOOKING_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// Payment Statuses
export const PAYMENT_STATUS = {
  AWAITING_PAYMENT: 'Awaiting Payment',
  PAID: 'Paid',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_COMPLETED: 'BOOKING_COMPLETED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_REMINDER: 'PAYMENT_REMINDER',
  NEW_MESSAGE: 'NEW_MESSAGE',
  REMINDER_24HR: 'REMINDER_24HR',
};

// Days of Week
export const DAYS_OF_WEEK = [
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' },
];

// Time Options (30-minute intervals from 6 AM to 10 PM)
export const generateTimeOptions = () => {
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

// Default Availability Schedule
export const getDefaultSchedule = () => {
  return DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.value] = {
      enabled: day.value !== 'saturday' && day.value !== 'sunday', // Default: weekdays enabled
      startTime: '09:00',
      endTime: '17:00',
    };
    return acc;
  }, {});
};

// Distance Filter Options
export const DISTANCE_FILTERS = [
  { value: 'all', label: 'All Distances' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
];

// Admin User ID (hardcoded for access control)
export const ADMIN_USER_ID = 'admin-123'; // Change this to your actual admin user ID

// Default Location (Austin, TX)
export const DEFAULT_LOCATION = {
  lat: 30.2672,
  lon: -97.7431,
};

// Haversine Formula Constants
export const EARTH_RADIUS_KM = 6371;


