import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, appId } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import { Skeleton } from '../components/Skeleton';

const ADMIN_USER_ID = process.env.VITE_ADMIN_USER_ID || 'SdPQVpbeqGUq7F78FBcZ72MZV2I2';

function AdminDisputeDashboard() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolution, setResolution] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || user.uid !== ADMIN_USER_ID) {
      navigate('/');
      return;
    }

    const disputesRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'disputes'
    );

    const disputesQuery = query(disputesRef, orderBy('createdAt', 'desc'));

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
  }, [navigate, showError]);

  const handleStatusUpdate = async (disputeId, newStatus) => {
    await withLoading(async () => {
      try {
        const disputeRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'disputes',
          disputeId
        );

        const updateData = {
          status: newStatus,
          updatedAt: serverTimestamp(),
        };

        if (newStatus === 'Under Review') {
          updateData.reviewedAt = serverTimestamp();
        }

        await updateDoc(disputeRef, updateData);

        // Update booking dispute status
        const dispute = disputes.find(d => d.id === disputeId);
        if (dispute) {
          const bookingRef = doc(
            db,
            'artifacts',
            appId,
            'public',
            'data',
            'bookings',
            dispute.bookingId
          );
          await updateDoc(bookingRef, {
            disputeStatus: newStatus,
            updatedAt: serverTimestamp(),
          });
        }

        showSuccess(`Dispute status updated to ${newStatus}`);
        setSelectedDispute(null);
      } catch (error) {
        console.error('Error updating dispute:', error);
        showError('Failed to update dispute status');
      }
    }, 'Updating dispute...');
  };

  const handleResolve = async () => {
    if (!resolution.trim() || resolution.trim().length < 10) {
      showError('Please provide a resolution (at least 10 characters)');
      return;
    }

    await withLoading(async () => {
      try {
        const disputeRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'disputes',
          selectedDispute.id
        );

        await updateDoc(disputeRef, {
          status: 'Resolved',
          resolution: resolution.trim(),
          resolvedAt: serverTimestamp(),
          resolvedBy: auth.currentUser.uid,
          updatedAt: serverTimestamp(),
        });

        // Update booking
        const bookingRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'bookings',
          selectedDispute.bookingId
        );
        await updateDoc(bookingRef, {
          disputeStatus: 'Resolved',
          updatedAt: serverTimestamp(),
        });

        showSuccess('Dispute resolved successfully');
        setSelectedDispute(null);
        setResolution('');
      } catch (error) {
        console.error('Error resolving dispute:', error);
        showError('Failed to resolve dispute');
      }
    }, 'Resolving dispute...');
  };

  const handleReject = async () => {
    if (!resolution.trim() || resolution.trim().length < 10) {
      showError('Please provide a reason for rejection (at least 10 characters)');
      return;
    }

    await withLoading(async () => {
      try {
        const disputeRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'disputes',
          selectedDispute.id
        );

        await updateDoc(disputeRef, {
          status: 'Rejected',
          resolution: resolution.trim(),
          resolvedAt: serverTimestamp(),
          resolvedBy: auth.currentUser.uid,
          updatedAt: serverTimestamp(),
        });

        // Update booking
        const bookingRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'bookings',
          selectedDispute.bookingId
        );
        await updateDoc(bookingRef, {
          disputeStatus: 'Rejected',
          updatedAt: serverTimestamp(),
        });

        showSuccess('Dispute rejected');
        setSelectedDispute(null);
        setResolution('');
      } catch (error) {
        console.error('Error rejecting dispute:', error);
        showError('Failed to reject dispute');
      }
    }, 'Rejecting dispute...');
  };

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

  const filteredDisputes = filterStatus === 'all'
    ? disputes
    : disputes.filter(d => d.status === filterStatus);

  const stats = {
    total: disputes.length,
    pending: disputes.filter(d => d.status === 'Pending').length,
    underReview: disputes.filter(d => d.status === 'Under Review').length,
    resolved: disputes.filter(d => d.status === 'Resolved').length,
    rejected: disputes.filter(d => d.status === 'Rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispute Resolution Dashboard</h1>
          <p className="text-gray-600">Manage and resolve customer disputes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <p className="text-sm text-yellow-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <p className="text-sm text-blue-600 mb-1">Under Review</p>
            <p className="text-2xl font-bold text-blue-800">{stats.underReview}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <p className="text-sm text-green-600 mb-1">Resolved</p>
            <p className="text-2xl font-bold text-green-800">{stats.resolved}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <p className="text-sm text-red-600 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Disputes</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Disputes List */}
        <div className="bg-white rounded-lg shadow">
          {filteredDisputes.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No disputes found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredDisputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedDispute(dispute)}
                >
                  <div className="flex items-start justify-between">
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
                      <p className="text-xs text-gray-500 mt-2">
                        Filed: {dispute.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispute Detail Modal */}
        {selectedDispute && (
          <DisputeDetailModal
            dispute={selectedDispute}
            resolution={resolution}
            onResolutionChange={setResolution}
            onClose={() => {
              setSelectedDispute(null);
              setResolution('');
            }}
            onStatusUpdate={handleStatusUpdate}
            onResolve={handleResolve}
            onReject={handleReject}
            getStatusColor={getStatusColor}
            getDisputeTypeLabel={getDisputeTypeLabel}
          />
        )}
      </div>
    </div>
  );
}

function DisputeDetailModal({
  dispute,
  resolution,
  onResolutionChange,
  onClose,
  onStatusUpdate,
  onResolve,
  onReject,
  getStatusColor,
  getDisputeTypeLabel,
}) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dispute.status)}`}>
              {dispute.status}
            </span>
            {dispute.status === 'Pending' && (
              <button
                onClick={() => onStatusUpdate(dispute.id, 'Under Review')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Mark as Under Review
              </button>
            )}
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

          {/* Resolution Form */}
          {(dispute.status === 'Under Review' || dispute.status === 'Pending') && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Resolution</h3>
              <textarea
                value={resolution}
                onChange={(e) => onResolutionChange(e.target.value)}
                rows={4}
                placeholder="Enter resolution details or reason for rejection..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                minLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                {resolution.length}/500 characters (minimum 10)
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={onResolve}
                  disabled={!resolution.trim() || resolution.trim().length < 10}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Resolve Dispute
                </button>
                <button
                  onClick={onReject}
                  disabled={!resolution.trim() || resolution.trim().length < 10}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Reject Dispute
                </button>
              </div>
            </div>
          )}

          {/* Existing Resolution */}
          {dispute.status === 'Resolved' && dispute.resolution && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">Resolution</h3>
              <p className="text-sm text-green-700 whitespace-pre-wrap">{dispute.resolution}</p>
            </div>
          )}

          {dispute.status === 'Rejected' && dispute.resolution && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">Rejection Reason</h3>
              <p className="text-sm text-red-700 whitespace-pre-wrap">{dispute.resolution}</p>
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

export default AdminDisputeDashboard;

