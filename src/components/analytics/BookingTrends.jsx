import React, { useMemo } from 'react';

/**
 * Booking Trends Component
 * Shows bookings over time with a simple bar chart
 */
function BookingTrends({ bookings }) {
  const trends = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return {
        last7Days: [],
        last30Days: [],
        byStatus: {},
        byDayOfWeek: {},
      };
    }

    const now = new Date();
    const last7Days = [];
    const last30Days = [];
    const byStatus = {};
    const byDayOfWeek = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: 0,
        dateObj: date,
      });
    }

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last30Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: 0,
        dateObj: date,
      });
    }

    bookings.forEach((booking) => {
      const bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
      bookingDate.setHours(0, 0, 0, 0);

      // Count by status
      const status = booking.status || 'Unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;

      // Count by day of week
      const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });
      byDayOfWeek[dayOfWeek] = (byDayOfWeek[dayOfWeek] || 0) + 1;

      // Count in last 7 days
      const daysDiff = Math.floor((now - bookingDate) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff <= 6) {
        const dayIndex = 6 - daysDiff;
        if (last7Days[dayIndex]) {
          last7Days[dayIndex].count++;
        }
      }

      // Count in last 30 days
      if (daysDiff >= 0 && daysDiff <= 29) {
        const dayIndex = 29 - daysDiff;
        if (last30Days[dayIndex]) {
          last30Days[dayIndex].count++;
        }
      }
    });

    return {
      last7Days,
      last30Days,
      byStatus,
      byDayOfWeek,
    };
  }, [bookings]);

  const maxCount = Math.max(
    ...trends.last7Days.map((d) => d.count),
    1
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Booking Trends</h3>
        <span className="text-2xl">📈</span>
      </div>

      <div className="space-y-6">
        {/* Last 7 Days Chart */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Last 7 Days</p>
          <div className="flex items-end justify-between gap-2 h-32">
            {trends.last7Days.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{
                      height: `${(day.count / maxCount) * 100}%`,
                      minHeight: day.count > 0 ? '4px' : '0',
                    }}
                    title={`${day.date}: ${day.count} bookings`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">{day.date.split(' ')[1]}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Total: {trends.last7Days.reduce((sum, d) => sum + d.count, 0)}</span>
            <span>Avg: {(trends.last7Days.reduce((sum, d) => sum + d.count, 0) / 7).toFixed(1)}/day</span>
          </div>
        </div>

        {/* By Status */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">By Status</p>
          <div className="space-y-2">
            {Object.entries(trends.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(count / bookings.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Day of Week */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Busiest Days</p>
          <div className="space-y-2">
            {Object.entries(trends.byDayOfWeek)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([day, count]) => (
                <div key={day} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{day}</span>
                  <span className="text-sm font-semibold text-gray-900">{count} bookings</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingTrends;

