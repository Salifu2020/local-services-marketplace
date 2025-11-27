/**
 * Helper utility functions used throughout the application
 */

/**
 * Format a date for display
 * @param {Date|Timestamp} date - Date to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return 'N/A';
  
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  
  const defaultOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  };
  
  return dateObj.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Format time from 24-hour to 12-hour format
 * @param {string} time24 - Time in 24-hour format (HH:MM)
 * @returns {string} Time in 12-hour format
 */
export function formatTime(time24) {
  if (!time24) return 'N/A';
  
  const [hours, minutes] = time24.split(':').map(Number);
  const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Get day name from date
 * @param {Date} date - Date object
 * @returns {string} Day name (lowercase: monday, tuesday, etc.)
 */
export function getDayName(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Check if a date is in the past
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export function isPastDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

/**
 * Generate time slots between start and end time
 * @param {string} startTime - Start time in 24-hour format (HH:MM)
 * @param {string} endTime - End time in 24-hour format (HH:MM)
 * @param {number} intervalMinutes - Interval in minutes (default: 30)
 * @returns {Array<{value: string, label: string}>} Array of time slot objects
 */
export function generateTimeSlots(startTime, endTime, intervalMinutes = 30) {
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
}

/**
 * Calculate duration in hours between two times
 * @param {string} startTime - Start time in 24-hour format (HH:MM)
 * @param {string} endTime - End time in 24-hour format (HH:MM)
 * @returns {number} Duration in hours
 */
export function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const diffMins = endMins > startMins ? endMins - startMins : 0;
  
  return diffMins / 60;
}

/**
 * Calculate distance between two geographical points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in kilometers
  
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text with ellipsis
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date|Timestamp} date - Date to format
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  if (!date) return 'N/A';
  
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diffSeconds = Math.floor((now - dateObj) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return 'just now';
  if (diffHours < 1) return `${diffMinutes}m ago`;
  if (diffDays < 1) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(dateObj);
}

