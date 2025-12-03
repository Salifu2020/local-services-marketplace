import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, appId } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { useFavorites } from '../hooks/useFavorites';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/Skeleton';

function CustomerDashboard() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const { favorites } = useFavorites();
  const [loading, setLoading] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalSpent: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    // Fetch upcoming bookings
    const upcomingBookingsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'bookings'
    );

    // Query all bookings for user, then filter and sort client-side to avoid composite index
    const upcomingQuery = query(
      upcomingBookingsRef,
      where('userId', '==', user.uid)
    );

    const unsubscribeUpcoming = onSnapshot(
      upcomingQuery,
      (snapshot) => {
        const bookings = [];
        const now = new Date();
        snapshot.forEach((doc) => {
          const data = doc.data();
          const bookingDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
          
          // Filter for upcoming bookings (Pending or Confirmed, and date >= today)
          if (
            (data.status === 'Pending' || data.status === 'Confirmed') &&
            bookingDate >= now
          ) {
            bookings.push({
              id: doc.id,
              ...data,
            });
          }
        });
        // Sort by date and limit to 5
        bookings.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateA - dateB;
        });
        setUpcomingBookings(bookings.slice(0, 5));
      },
      (err) => {
        console.error('Error fetching upcoming bookings:', err);
        showError('Failed to load upcoming bookings');
      }
    );

    // Fetch recent bookings - use client-side sorting to avoid index requirement
    const recentQuery = query(
      upcomingBookingsRef,
      where('userId', '==', user.uid)
    );

    const unsubscribeRecent = onSnapshot(
      recentQuery,
      (snapshot) => {
        const bookings = [];
        snapshot.forEach((doc) => {
          bookings.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        // Sort by createdAt descending and limit to 5
        bookings.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return timeB - timeA;
        });
        setRecentBookings(bookings.slice(0, 5));
      },
      (err) => {
        console.error('Error fetching recent bookings:', err);
      }
    );

    // Calculate stats
    const statsQuery = query(
      upcomingBookingsRef,
      where('userId', '==', user.uid)
    );

    const unsubscribeStats = onSnapshot(
      statsQuery,
      (snapshot) => {
        let total = 0;
        let completed = 0;
        let pending = 0;
        let totalSpent = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          total++;
          if (data.status === 'Completed') {
            completed++;
            if (data.paymentStatus === 'Paid' && data.amount) {
              totalSpent += data.amount;
            }
          } else if (data.status === 'Pending' || data.status === 'Confirmed') {
            pending++;
          }
        });

        setStats({
          totalBookings: total,
          completedBookings: completed,
          pendingBookings: pending,
          totalSpent: totalSpent,
        });
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching stats:', err);
        setLoading(false);
      }
    );

    // Fetch recent activity (notifications)
    const fetchRecentActivity = async () => {
      try {
        const notificationsRef = collection(
          db,
          'artifacts',
          appId,
          'users',
          user.uid,
          'notifications'
        );

        const activityQuery = query(
          notificationsRef,
          orderBy('timestamp', 'desc'),
          limit(5)
        );

        const snapshot = await getDocs(activityQuery);
        const activities = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          activities.push({
            id: doc.id,
            ...data,
          });
        });
        setRecentActivity(activities);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
      }
    };

    fetchRecentActivity();

    return () => {
      if (typeof unsubscribeUpcoming === 'function') unsubscribeUpcoming();
      if (typeof unsubscribeRecent === 'function') unsubscribeRecent();
      if (typeof unsubscribeStats === 'function') unsubscribeStats();
    };
  }, [navigate, showError]);

  const formatDate = (date) => {
    if (!date) return 'TBD';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <>
        <nav className="bg-amber-800 shadow-sm border-b border-amber-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white hover:text-amber-100 transition-colors">
                <span className="text-2xl bg-purple-600 text-white rounded-lg px-2 py-1 font-light flex items-center justify-center">∞</span>
                <span>ExpertNextDoor</span>
              </Link>
            </div>
          </div>
        </nav>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <nav className="bg-amber-800 shadow-sm border-b border-amber-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white hover:text-amber-100 transition-colors">
              <span className="text-2xl bg-purple-600 text-white rounded-lg px-2 py-1 font-light flex items-center justify-center">∞</span>
              <span>ExpertNextDoor</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's an overview of your activity.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Bookings"
              value={stats.totalBookings}
              icon="📅"
              color="bg-blue-500"
            />
            <StatCard
              title="Completed"
              value={stats.completedBookings}
              icon="✅"
              color="bg-green-500"
            />
            <StatCard
              title="Pending"
              value={stats.pendingBookings}
              icon="⏳"
              color="bg-yellow-500"
            />
            <StatCard
              title="Total Spent"
              value={`$${stats.totalSpent.toFixed(2)}`}
              icon="💰"
              color="bg-purple-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickActionCard
                title="Find a Pro"
                icon="🔍"
                onClick={() => navigate('/')}
                color="bg-blue-500 hover:bg-blue-600"
              />
              <QuickActionCard
                title="My Bookings"
                icon="📅"
                onClick={() => navigate('/my-bookings')}
                color="bg-green-500 hover:bg-green-600"
              />
              <QuickActionCard
                title="My Favorites"
                icon="❤️"
                onClick={() => navigate('/my-favorites')}
                color="bg-red-500 hover:bg-red-600"
              />
              <QuickActionCard
                title="My Profile"
                icon="👤"
                onClick={() => navigate('/my-profile')}
                color="bg-purple-500 hover:bg-purple-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Bookings */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Bookings</h2>
                <Link
                  to="/my-bookings"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </Link>
              </div>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-gray-600 mb-2">No upcoming bookings</p>
                  <button
                    onClick={() => navigate('/')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Book a service
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getStatusColor={getStatusColor}
                      onClick={() => navigate(`/my-bookings`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                <Link
                  to="/my-messages"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </Link>
              </div>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🔔</div>
                  <p className="text-gray-600">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Favorites Summary */}
          {favorites.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Favorite Professionals</h2>
                <Link
                  to="/my-favorites"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All ({favorites.length})
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {favorites.slice(0, 6).map((proId) => (
                  <FavoriteCard
                    key={proId}
                    professionalId={proId}
                    onClick={() => navigate(`/pro-details/${proId}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Bookings */}
          {recentBookings.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
                <Link
                  to="/my-bookings"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {recentBookings.slice(0, 3).map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    getStatusColor={getStatusColor}
                    onClick={() => navigate(`/my-bookings`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} rounded-full w-12 h-12 flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, icon, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-lg p-6 text-center transition-all transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-semibold">{title}</div>
    </button>
  );
}

function BookingCard({ booking, formatDate, formatTime, getStatusColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">
              {booking.serviceType || 'Service'}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            {booking.professionalName || 'Professional'}
          </p>
          <p className="text-sm text-gray-500">
            {formatDate(booking.date)} at {formatTime(booking.time)}
          </p>
        </div>
        {booking.amount && (
          <div className="text-right">
            <p className="font-semibold text-gray-900">${booking.amount.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return '✅';
      case 'BOOKING_CANCELLED':
        return '❌';
      case 'BOOKING_COMPLETED':
        return '🎉';
      case 'PAYMENT_RECEIVED':
        return '💰';
      case 'NEW_MESSAGE':
        return '💬';
      default:
        return '🔔';
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="text-2xl">{getActivityIcon(activity.type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{activity.message}</p>
        <p className="text-xs text-gray-500 mt-1">{formatTime(activity.timestamp)}</p>
      </div>
    </div>
  );
}

function FavoriteCard({ professionalId, onClick }) {
  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessional = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const professionalRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'professionals',
          professionalId
        );

        const docSnapshot = await getDoc(professionalRef);
        if (docSnapshot.exists()) {
          setProfessional({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          });
        }
      } catch (err) {
        console.error('Error fetching professional:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessional();
  }, [professionalId]);

  if (loading) {
    return <Skeleton className="h-24" />;
  }

  if (!professional) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
    >
      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mb-2 mx-auto">
        {professional.serviceType?.[0]?.toUpperCase() || 'P'}
      </div>
      <p className="text-sm font-medium text-gray-900 text-center truncate">
        {professional.serviceType || 'Professional'}
      </p>
      <p className="text-xs text-gray-500 text-center truncate">
        {professional.locationText || ''}
      </p>
    </button>
  );
}

export default CustomerDashboard;

