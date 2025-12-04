import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db, appId } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Skeleton } from '../components/Skeleton';
import VerificationManager from '../components/admin/VerificationManager';
import ProfessionalManager from '../components/admin/ProfessionalManager';

// Hardcoded admin user ID
const ADMIN_USER_ID = 'admin-123';

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Analytics data
  const [usersCount, setUsersCount] = useState(0);
  const [professionalsCount, setProfessionalsCount] = useState(0);
  const [bookingsByStatus, setBookingsByStatus] = useState({
    Pending: 0,
    Confirmed: 0,
    Completed: 0,
    Cancelled: 0,
  });
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    
    // Access control: Check if user is admin
    if (!user || user.uid !== ADMIN_USER_ID) {
      setLoading(false);
      return;
    }

    // Fetch analytics data
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch users count
        const usersRef = collection(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'users'
        );
        const usersSnapshot = await getDocs(usersRef);
        setUsersCount(usersSnapshot.size);

        // Fetch professionals count
        const professionalsRef = collection(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'professionals'
        );
        const professionalsSnapshot = await getDocs(professionalsRef);
        setProfessionalsCount(professionalsSnapshot.size);

        // Fetch bookings and count by status
        const bookingsRef = collection(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'bookings'
        );
        const bookingsSnapshot = await getDocs(bookingsRef);
        
        const statusCounts = {
          Pending: 0,
          Confirmed: 0,
          Completed: 0,
          Cancelled: 0,
        };
        
        let completedCount = 0;
        
        bookingsSnapshot.forEach((doc) => {
          const data = doc.data();
          const status = data.status || 'Pending';
          
          if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
          } else {
            statusCounts.Pending++; // Default to Pending if status is unknown
          }
          
          if (status === 'Completed') {
            completedCount++;
          }
        });
        
        setBookingsByStatus(statusCounts);
        
        // Calculate mock revenue: Completed Bookings * $100
        const mockRevenue = completedCount * 100;
        setTotalRevenue(mockRevenue);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Failed to load analytics data');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const user = auth.currentUser;
  const isAdmin = user && user.uid === ADMIN_USER_ID;

  // Access Denied Screen
  if (!isAdmin) {
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
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You do not have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Current User ID: <span className="font-mono">{user?.uid || 'Not authenticated'}</span>
            </p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Loading State
  if (loading) {
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
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="space-y-4 w-full max-w-4xl">
              <Skeleton variant="text" lines={2} className="h-8" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton variant="card" key={i} />
                ))}
              </div>
              <Skeleton variant="card" />
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error State
  if (error) {
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
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Main Dashboard Content
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
                to="/admin-disputes"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                ⚖️ Dispute Resolution
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-full">
                ADMIN
              </span>
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Analytics and overview of the platform</p>
        </div>

        {/* User Summary Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Users Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{usersCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            {/* Total Professionals Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Professionals</p>
                  <p className="text-3xl font-bold text-gray-900">{professionalsCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔧</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Analytics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Booking Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pending Bookings */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <span className="text-2xl">⏳</span>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{bookingsByStatus.Pending}</p>
            </div>

            {/* Confirmed Bookings */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">Confirmed</p>
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{bookingsByStatus.Confirmed}</p>
            </div>

            {/* Completed Bookings */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{bookingsByStatus.Completed}</p>
            </div>

            {/* Cancelled Bookings */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <span className="text-2xl">❌</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{bookingsByStatus.Cancelled}</p>
            </div>
          </div>
        </div>

        {/* Revenue Tracking Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Revenue Tracking</h2>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue (Mock)</p>
                <p className="text-4xl font-bold text-green-600">
                  ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Calculated as: {bookingsByStatus.Completed} completed bookings × $100
                </p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Management */}
        <div className="mb-8">
          <ProfessionalManager />
        </div>

        {/* Professional Verification Management */}
        <div className="mb-8">
          <VerificationManager />
        </div>

        {/* Debug & Admin Info Panel */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Debug & Admin Panel</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Authentication Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Authentication</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current User ID</p>
                    <p className="text-sm font-mono bg-white p-2 rounded border border-gray-300 break-all">
                      {user?.uid || 'Not authenticated'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm bg-white p-2 rounded border border-gray-300">
                      {user?.email || 'Anonymous user'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Auth Provider</p>
                    <p className="text-sm bg-white p-2 rounded border border-gray-300">
                      {user?.providerData?.[0]?.providerId || 'anonymous'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Is Admin</p>
                    <p className="text-sm bg-white p-2 rounded border border-gray-300">
                      {isAdmin ? '✅ Yes' : '❌ No'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Firebase & Environment Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">System Info</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Firebase Project ID</p>
                    <p className="text-sm font-mono bg-white p-2 rounded border border-gray-300 break-all">
                      {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">App ID</p>
                    <p className="text-sm font-mono bg-white p-2 rounded border border-gray-300">
                      {appId || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Environment</p>
                    <p className="text-sm bg-white p-2 rounded border border-gray-300">
                      {import.meta.env.MODE || 'development'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Sentry Status</p>
                    <p className="text-sm bg-white p-2 rounded border border-gray-300">
                      {import.meta.env.VITE_SENTRY_DSN ? '✅ Configured' : '❌ Not configured'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user?.uid || '');
                    alert('User ID copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Copy User ID
                </button>
                <button
                  onClick={() => {
                    console.log('Current User:', user);
                    console.log('Firebase Config:', {
                      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
                      appId: appId,
                    });
                    alert('Debug info logged to console!');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Log Debug Info
                </button>
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Reload Page
                </button>
              </div>
            </div>

            {/* Admin Note */}
            <div className="mt-6 pt-6 border-t border-gray-300">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> This debug panel is only visible to admin users. 
                Admin User ID: <span className="font-mono">{ADMIN_USER_ID}</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default AdminDashboard;

