import React from 'react';

/**
 * Simple Booking Trends Chart Component
 * Shows bookings over time using a bar chart visualization
 */
function BookingTrendsChart({ data, period = 'week' }) {
  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(d => d.count), 1);
  
  // Period labels
  const getLabel = (item, index) => {
    if (period === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days[index] || item.label;
    } else if (period === 'month') {
      return item.label || `Week ${index + 1}`;
    }
    return item.label || `Period ${index + 1}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Booking Trends</h3>
        <span className="text-2xl">📈</span>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.count / maxValue) * 100;
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium w-16">
                  {getLabel(item, index)}
                </span>
                <span className="text-gray-900 font-semibold">
                  {item.count} {item.count === 1 ? 'booking' : 'bookings'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No booking data available</p>
        </div>
      )}
    </div>
  );
}

export default BookingTrendsChart;


