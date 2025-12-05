import React, { useState, useEffect } from 'react';
import { auth, db, appId } from '../../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../Skeleton';

/**
 * Dispute List Component
 * Displays disputes for the current user (customer or professional)
 */
function DisputeList({ userRole = 'customer' }) {
  const { showError } = useToast();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const disputesRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'disputes'
    );

    // Query disputes based on user role
    const disputesQuery = query(
      disputesRef,
      where(userRole === 'customer' ? 'userId' : 'professionalId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      disputesQuery,
      (snapshot) => {
        const disputesList = [];
        snapshot.forEach((doc) => {
          disputesList.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setDisputes(disputesList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching disputes:', err);
        showError('Failed to load disputes');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userRole, showError]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisputeTypeLabel = (type) => {
    const types = {
      service_not_provided: 'Service Not Provided',
      poor_quality: 'Poor Quality Work',
      payment_issue: 'Payment Issue',
      scheduling_issue: 'Scheduling Issue',
      damage: 'Property Damage',
      behavior: 'Unprofessional Behavior',
      other: 'Other',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No disputes found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {disputes.map((dispute) => (
        <div
          key={dispute.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setSelectedDispute(dispute)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getDisputeTypeLabel(dispute.disputeType)}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                  {dispute.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Booking ID: {dispute.bookingId}
              </p>
              <p className="text-sm text-gray-700 line-clamp-2">
                {dispute.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Filed: {dispute.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
            </span>
            {dispute.evidence && dispute.evidence.length > 0 && (
              <span className="flex items-center gap-1">
                📎 {dispute.evidence.length} file(s)
              </span>
            )}
          </div>

          {/* Dispute Detail Modal */}
          {selectedDispute && selectedDispute.id === dispute.id && (
            <DisputeDetailModal
              dispute={selectedDispute}
              onClose={() => setSelectedDispute(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Dispute Detail Modal
 */
function DisputeDetailModal({ dispute, onClose }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisputeTypeLabel = (type) => {
    const types = {
      service_not_provided: 'Service Not Provided',
      poor_quality: 'Poor Quality Work',
      payment_issue: 'Payment Issue',
      scheduling_issue: 'Scheduling Issue',
      damage: 'Property Damage',
      behavior: 'Unprofessional Behavior',
      other: 'Other',
    };
    return types[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Dispute Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Type */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dispute.status)}`}>
              {dispute.status}
            </span>
            <span className="text-sm text-gray-600">
              Type: {getDisputeTypeLabel(dispute.disputeType)}
            </span>
          </div>

          {/* Booking Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Booking Information</h3>
            <p className="text-sm text-gray-600">Booking ID: {dispute.bookingId}</p>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
          </div>

          {/* Evidence */}
          {dispute.evidence && dispute.evidence.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Evidence</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {dispute.evidence.map((file, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-32 object-cover cursor-pointer"
                        onClick={() => window.open(file.url, '_blank')}
                      />
                    ) : (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="text-center">
                          <span className="text-2xl mb-2 block">📄</span>
                          <p className="text-xs text-gray-600 truncate">{file.name}</p>
                        </div>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Resolution (if resolved) */}
          {dispute.status === 'Resolved' && dispute.resolution && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">Resolution</h3>
              <p className="text-sm text-green-700 whitespace-pre-wrap">{dispute.resolution}</p>
              {dispute.resolvedAt && (
                <p className="text-xs text-green-600 mt-2">
                  Resolved: {dispute.resolvedAt.toDate?.()?.toLocaleDateString() || 'N/A'}
                </p>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-200">
            <p>Filed: {dispute.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}</p>
            {dispute.updatedAt && (
              <p>Last Updated: {dispute.updatedAt.toDate?.()?.toLocaleString() || 'N/A'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DisputeList;


