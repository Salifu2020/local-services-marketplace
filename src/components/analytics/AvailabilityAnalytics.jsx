import React from 'react';

/**
 * Availability Analytics Component
 * Shows peak times, busy days, and availability insights
 */
function AvailabilityAnalytics({ 
  peakDays = [],
  peakHours = [],
  totalBookings,
  averageBookingsPerDay
}) {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Availability Analytics</h3>
        <span className="text-2xl">📅</span>
      </div>

      <div className="space-y-6">
        {/* Peak Days */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Peak Days</h4>
          <div className="space-y-2">
            {DAYS.map((day, index) => {
              const dayData = peakDays.find(d => d.day === day.toLowerCase());
              const count = dayData?.count || 0;
              const maxCount = Math.max(...peakDays.map(d => d.count), 1);
              const percentage = (count / maxCount) * 100;

              return (
                <div key={day} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium w-24">{day}</span>
                    <span className="text-gray-900 font-semibold">
                      {count} {count === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Peak Hours</h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {HOURS.map((hour) => {
              const hourData = peakHours.find(h => h.hour === hour);
              const count = hourData?.count || 0;
              const maxCount = Math.max(...peakHours.map(h => h.count), 1);
              const intensity = (count / maxCount) * 100;
              
              const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
              const ampm = hour >= 12 ? 'PM' : 'AM';

              return (
                <div
                  key={hour}
                  className="text-center p-2 rounded"
                  style={{
                    backgroundColor: `rgba(147, 51, 234, ${intensity / 100 * 0.2})`,
                    border: intensity > 0 ? '1px solid rgba(147, 51, 234, 0.3)' : '1px solid #e5e7eb',
                  }}
                >
                  <p className="text-xs font-semibold text-gray-700">
                    {hour12}{ampm}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{count}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Total Bookings</p>
              <p className="text-xl font-bold text-gray-900">{totalBookings}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Avg per Day</p>
              <p className="text-xl font-bold text-gray-900">
                {averageBookingsPerDay.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvailabilityAnalytics;

