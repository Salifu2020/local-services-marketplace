/**
 * Utility functions for checking professional availability
 * considering vacation mode, blocked dates, buffer time, and schedule
 */

/**
 * Check if a date is blocked
 */
export const isDateBlocked = (date, blockedDates = []) => {
  if (!blockedDates || blockedDates.length === 0) return false;
  
  const dateStr = date instanceof Date 
    ? date.toISOString().split('T')[0] 
    : new Date(date).toISOString().split('T')[0];
  
  return blockedDates.some(blockedDate => {
    const blockedStr = blockedDate instanceof Date
      ? blockedDate.toISOString().split('T')[0]
      : blockedDate.toDate
      ? blockedDate.toDate().toISOString().split('T')[0]
      : blockedDate;
    return blockedStr === dateStr;
  });
};

/**
 * Check if a date falls within vacation period
 */
export const isVacationDate = (date, vacationMode, vacationStartDate, vacationEndDate) => {
  if (!vacationMode || !vacationStartDate || !vacationEndDate) return false;
  
  const checkDate = date instanceof Date ? date : new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const startDate = vacationStartDate.toDate 
    ? vacationStartDate.toDate() 
    : new Date(vacationStartDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = vacationEndDate.toDate 
    ? vacationEndDate.toDate() 
    : new Date(vacationEndDate);
  endDate.setHours(23, 59, 59, 999);
  
  return checkDate >= startDate && checkDate <= endDate;
};

/**
 * Get day name from date (lowercase, e.g., 'monday')
 */
export const getDayName = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dateObj = date instanceof Date ? date : new Date(date);
  return days[dateObj.getDay()];
};

/**
 * Check if a time slot is within the professional's schedule for that day
 */
export const isTimeInSchedule = (date, time, availability = {}) => {
  const dayName = getDayName(date);
  const daySchedule = availability[dayName];
  
  if (!daySchedule || !daySchedule.enabled) return false;
  
  const [slotH, slotM] = time.split(':').map(Number);
  const [startH, startM] = daySchedule.startTime.split(':').map(Number);
  const [endH, endM] = daySchedule.endTime.split(':').map(Number);
  
  const slotMinutes = slotH * 60 + slotM;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  return slotMinutes >= startMinutes && slotMinutes < endMinutes;
};

/**
 * Check if a time slot conflicts with existing bookings (considering buffer time)
 */
export const hasBookingConflict = (date, time, durationMinutes, existingBookings = [], bufferTimeMinutes = 0) => {
  if (!existingBookings || existingBookings.length === 0) return false;
  
  const [slotH, slotM] = time.split(':').map(Number);
  const slotDate = date instanceof Date ? date : new Date(date);
  slotDate.setHours(slotH, slotM, 0, 0);
  const slotStart = slotDate.getTime();
  const slotEnd = slotStart + (durationMinutes * 60 * 1000);
  
  // Add buffer time
  const slotStartWithBuffer = slotStart - (bufferTimeMinutes * 60 * 1000);
  const slotEndWithBuffer = slotEnd + (bufferTimeMinutes * 60 * 1000);
  
  return existingBookings.some(booking => {
    if (!booking.selectedDate || !booking.selectedTime || !booking.duration) return false;
    
    const bookingDate = booking.selectedDate.toDate 
      ? booking.selectedDate.toDate() 
      : new Date(booking.selectedDate);
    
    const [bookingH, bookingM] = booking.selectedTime.split(':').map(Number);
    bookingDate.setHours(bookingH, bookingM, 0, 0);
    
    const bookingStart = bookingDate.getTime();
    const bookingEnd = bookingStart + (booking.duration * 60 * 1000);
    
    // Check if dates match
    const slotDateStr = slotDate.toISOString().split('T')[0];
    const bookingDateStr = bookingDate.toISOString().split('T')[0];
    if (slotDateStr !== bookingDateStr) return false;
    
    // Check for time overlap (with buffer)
    return (slotStartWithBuffer < bookingEnd && slotEndWithBuffer > bookingStart);
  });
};

/**
 * Check if a booking is available considering all availability rules
 */
export const isBookingAvailable = ({
  date,
  time,
  durationMinutes = 60,
  professional,
  existingBookings = [],
}) => {
  // Check vacation mode
  if (professional.vacationMode) {
    if (isVacationDate(date, professional.vacationMode, professional.vacationStartDate, professional.vacationEndDate)) {
      return { available: false, reason: 'Professional is on vacation during this time' };
    }
  }
  
  // Check blocked dates
  if (isDateBlocked(date, professional.blockedDates)) {
    return { available: false, reason: 'This date is blocked by the professional' };
  }
  
  // Check schedule
  if (!isTimeInSchedule(date, time, professional.availability)) {
    return { available: false, reason: 'Time slot is outside professional\'s working hours' };
  }
  
  // Check booking conflicts (with buffer time)
  const bufferTime = professional.bufferTimeMinutes || 0;
  if (hasBookingConflict(date, time, durationMinutes, existingBookings, bufferTime)) {
    return { available: false, reason: 'Time slot conflicts with existing booking or buffer time' };
  }
  
  return { available: true };
};

/**
 * Filter available time slots based on availability rules
 */
export const filterAvailableTimeSlots = ({
  date,
  timeSlots,
  durationMinutes = 60,
  professional,
  existingBookings = [],
}) => {
  return timeSlots.filter(slot => {
    const result = isBookingAvailable({
      date,
      time: slot.value,
      durationMinutes,
      professional,
      existingBookings,
    });
    return result.available;
  });
};

/**
 * Generate available time slots for a date considering all rules
 */
export const generateAvailableTimeSlots = ({
  date,
  availability = {},
  durationMinutes = 60,
  professional = {},
  existingBookings = [],
  intervalMinutes = 30,
}) => {
  const dayName = getDayName(date);
  const daySchedule = availability[dayName];
  
  if (!daySchedule || !daySchedule.enabled) {
    return [];
  }
  
  // Generate all time slots for the day
  const allSlots = [];
  const [startH, startM] = daySchedule.startTime.split(':').map(Number);
  const [endH, endM] = daySchedule.endTime.split(':').map(Number);
  
  let currentH = startH;
  let currentM = startM;
  
  while (currentH < endH || (currentH === endH && currentM < endM)) {
    const time24 = `${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`;
    const hour12 = currentH > 12 ? currentH - 12 : currentH === 0 ? 12 : currentH;
    const ampm = currentH >= 12 ? 'PM' : 'AM';
    const time12 = `${hour12}:${currentM.toString().padStart(2, '0')} ${ampm}`;
    
    allSlots.push({ value: time24, label: time12 });
    
    currentM += intervalMinutes;
    if (currentM >= 60) {
      currentM = 0;
      currentH += 1;
    }
  }
  
  // Filter based on availability rules
  return filterAvailableTimeSlots({
    date,
    timeSlots: allSlots,
    durationMinutes,
    professional,
    existingBookings,
  });
};

