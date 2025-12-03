/**
 * Generate iCal file content for a booking
 * @param {Object} booking - Booking object
 * @param {Object} professional - Professional object
 * @returns {string} iCal file content
 */
export function generateICal(booking, professional) {
  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
  const [hours, minutes] = (booking.time || booking.startTime || '09:00').split(':').map(Number);
  startDate.setHours(hours, minutes, 0, 0);
  
  const duration = booking.duration || 2; // Default 2 hours
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + duration);

  const summary = `Service Booking - ${professional?.serviceType || 'Service'}`;
  const description = booking.notes 
    ? `Service: ${professional?.serviceType || 'Service'}\n\nNotes: ${booking.notes}`
    : `Service: ${professional?.serviceType || 'Service'}`;
  
  const location = professional?.location || '';

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ExpertNextDoor//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@localservices`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    location ? `LOCATION:${location}` : '',
    `STATUS:${booking.status === 'Confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return ical;
}

/**
 * Download iCal file
 * @param {string} icalContent - iCal file content
 * @param {string} filename - Filename for download
 */
export function downloadICal(icalContent, filename = 'booking.ics') {
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

