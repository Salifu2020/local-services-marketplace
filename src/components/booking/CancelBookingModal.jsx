import React, { useState } from 'react';

const CANCELLATION_REASONS = [
  { value: 'schedule-conflict', label: 'Schedule Conflict' },
  { value: 'found-other-provider', label: 'Found Another Provider' },
  { value: 'no-longer-needed', label: 'Service No Longer Needed' },
  { value: 'price-concern', label: 'Price Concern' },
  { value: 'professional-unavailable', label: 'Professional Unavailable' },
  { value: 'other', label: 'Other' },
];

function CancelBookingModal({ booking, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason) {
      alert('Please select a cancellation reason');
      return;
    }

    setSubmitting(true);
    const cancellationReason = reason === 'other' ? customReason : CANCELLATION_REASONS.find(r => r.value === reason)?.label;
    await onConfirm(cancellationReason);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cancel Booking</h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to cancel this booking? This action cannot be undone.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a reason...</option>
              {CANCELLATION_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {reason === 'other' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                placeholder="Enter cancellation reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={200}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Keep Booking
            </button>
            <button
              onClick={handleConfirm}
              disabled={!reason || submitting || (reason === 'other' && !customReason.trim())}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CancelBookingModal;


