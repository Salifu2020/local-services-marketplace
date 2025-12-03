import React from 'react';

/**
 * Earnings Card Component
 * Displays total earnings, monthly earnings, and growth
 */
function EarningsCard({ earnings, monthlyEarnings, growth }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Earnings</h3>
        <span className="text-2xl">💰</span>
      </div>
      
      <div className="space-y-4">
        {/* Total Earnings */}
        <div>
          <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(earnings)}
          </p>
        </div>

        {/* Monthly Earnings */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-1">This Month</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(monthlyEarnings)}
          </p>
        </div>

        {/* Growth Indicator */}
        {growth !== null && (
          <div className="pt-2">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}%
              </span>
              <span className="text-sm text-gray-500">vs last month</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EarningsCard;
