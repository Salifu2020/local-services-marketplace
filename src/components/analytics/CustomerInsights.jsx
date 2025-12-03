import React from 'react';

/**
 * Customer Insights Component
 * Shows repeat customers, average rating, and customer stats
 */
function CustomerInsights({ 
  totalCustomers,
  repeatCustomers,
  averageRating,
  totalReviews,
  topCustomers = []
}) {
  const repeatRate = totalCustomers > 0 
    ? ((repeatCustomers / totalCustomers) * 100).toFixed(1)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Customer Insights</h3>
        <span className="text-2xl">👥</span>
      </div>

      <div className="space-y-6">
        {/* Total Customers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-blue-600">{totalCustomers}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Repeat Customers</p>
            <p className="text-2xl font-bold text-green-600">{repeatCustomers}</p>
          </div>
        </div>

        {/* Repeat Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Repeat Rate</p>
            <p className="text-sm font-semibold text-gray-900">{repeatRate}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${repeatRate}%` }}
            />
          </div>
        </div>

        {/* Average Rating */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Average Rating</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-lg ${
                      star <= Math.round(averageRating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-lg font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </p>
            </div>
          </div>
          {totalReviews > 0 && (
            <p className="text-sm text-gray-500">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          )}
        </div>

        {/* Top Customers */}
        {topCustomers.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Top Customers</p>
            <div className="space-y-2">
              {topCustomers.slice(0, 3).map((customer, index) => (
                <div
                  key={customer.userId || index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-500">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-700">
                      {customer.bookingCount} {customer.bookingCount === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerInsights;

