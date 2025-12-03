import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import DisputeList from '../components/disputes/DisputeList';
import DisputeForm from '../components/disputes/DisputeForm';
import { useToast } from '../context/ToastContext';

function MyDisputes() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Redirect if not authenticated
  React.useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-gray-900">
              ExpertNextDoor
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/my-bookings"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                My Bookings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Disputes</h1>
          <p className="text-gray-600">View and manage your dispute cases</p>
        </div>

        <DisputeList userRole="customer" />
      </main>

      {/* Dispute Form Modal */}
      {showDisputeForm && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <DisputeForm
            booking={selectedBooking}
            onClose={() => {
              setShowDisputeForm(false);
              setSelectedBooking(null);
            }}
            onSubmitted={() => {
              setShowDisputeForm(false);
              setSelectedBooking(null);
            }}
          />
        </div>
      )}
    </>
  );
}

export default MyDisputes;

