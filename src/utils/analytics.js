/**
 * Analytics calculation utilities
 * Processes booking data to generate insights
 */

/**
 * Calculate earnings from bookings
 */
export function calculateEarnings(bookings, hourlyRate) {
  if (!hourlyRate || bookings.length === 0) {
    return { total: 0, monthly: 0, growth: null };
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  let totalEarnings = 0;
  let monthlyEarnings = 0;
  let lastMonthEarnings = 0;

  bookings.forEach((booking) => {
    if (booking.status === 'Completed' && booking.paymentStatus === 'Paid') {
      // Calculate earnings (assuming 1 hour default, or use booking.hours if available)
      const hours = booking.hours || 1;
      const earnings = hourlyRate * hours;
      totalEarnings += earnings;

      // Check if booking is in current month
      if (booking.date) {
        const bookingDate = booking.date.toDate ? booking.date.toDate() : new Date(booking.date);
        if (
          bookingDate.getMonth() === currentMonth &&
          bookingDate.getFullYear() === currentYear
        ) {
          monthlyEarnings += earnings;
        }

        // Check if booking is in last month
        if (
          bookingDate.getMonth() === lastMonth &&
          bookingDate.getFullYear() === lastMonthYear
        ) {
          lastMonthEarnings += earnings;
        }
      }
    }
  });

  // Calculate growth percentage
  let growth = null;
  if (lastMonthEarnings > 0) {
    growth = ((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings) * 100;
  } else if (monthlyEarnings > 0) {
    growth = 100; // 100% growth if no earnings last month
  }

  return {
    total: totalEarnings,
    monthly: monthlyEarnings,
    growth: growth !== null ? Math.round(growth) : null,
  };
}

/**
 * Calculate booking trends (by day of week or week of month)
 */
export function calculateBookingTrends(bookings, period = 'week') {
  if (bookings.length === 0) {
    return [];
  }

  if (period === 'week') {
    // Group by day of week
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayCounts = days.reduce((acc, day) => {
      acc[day] = 0;
      return acc;
    }, {});

    bookings.forEach((booking) => {
      if (booking.date) {
        const bookingDate = booking.date.toDate ? booking.date.toDate() : new Date(booking.date);
        const dayIndex = bookingDate.getDay();
        const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Convert Sunday=0 to Monday=0
        dayCounts[dayName]++;
      }
    });

    return days.map((day) => ({
      label: day,
      count: dayCounts[day],
    }));
  } else {
    // Group by week of month
    const weekCounts = [0, 0, 0, 0]; // 4 weeks

    bookings.forEach((booking) => {
      if (booking.date) {
        const bookingDate = booking.date.toDate ? booking.date.toDate() : new Date(booking.date);
        const weekOfMonth = Math.floor((bookingDate.getDate() - 1) / 7);
        if (weekOfMonth < 4) {
          weekCounts[weekOfMonth]++;
        }
      }
    });

    return weekCounts.map((count, index) => ({
      label: `Week ${index + 1}`,
      count,
    }));
  }
}

/**
 * Calculate customer insights
 */
export function calculateCustomerInsights(bookings, reviews = []) {
  // Get unique customers
  const customerMap = new Map();
  
  bookings.forEach((booking) => {
    if (booking.userId) {
      if (!customerMap.has(booking.userId)) {
        customerMap.set(booking.userId, {
          userId: booking.userId,
          bookingCount: 0,
        });
      }
      customerMap.get(booking.userId).bookingCount++;
    }
  });

  const customers = Array.from(customerMap.values());
  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter((c) => c.bookingCount > 1).length;

  // Calculate average rating from reviews
  let averageRating = 0;
  let totalReviews = reviews.length;
  
  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    averageRating = sum / reviews.length;
  }

  // Get top customers (by booking count)
  const topCustomers = customers
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5);

  return {
    totalCustomers,
    repeatCustomers,
    averageRating,
    totalReviews,
    topCustomers,
  };
}

/**
 * Calculate availability analytics (peak days and hours)
 */
export function calculateAvailabilityAnalytics(bookings) {
  if (bookings.length === 0) {
    return {
      peakDays: [],
      peakHours: [],
      totalBookings: 0,
      averageBookingsPerDay: 0,
    };
  }

  // Group by day of week
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayCounts = days.reduce((acc, day) => {
    acc[day] = 0;
    return acc;
  }, {});

  // Group by hour
  const hourCounts = Array.from({ length: 24 }, () => 0);

  bookings.forEach((booking) => {
    if (booking.date) {
      const bookingDate = booking.date.toDate ? booking.date.toDate() : new Date(booking.date);
      
      // Count by day
      const dayIndex = bookingDate.getDay();
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];
      dayCounts[dayName]++;

      // Count by hour
      if (booking.time) {
        const timeStr = typeof booking.time === 'string' ? booking.time : booking.time.toString();
        const hour = parseInt(timeStr.split(':')[0], 10);
        if (hour >= 0 && hour < 24) {
          hourCounts[hour]++;
        }
      }
    }
  });

  const peakDays = days.map((day) => ({
    day,
    count: dayCounts[day],
  }));

  const peakHours = hourCounts.map((count, hour) => ({
    hour,
    count,
  }));

  // Calculate average bookings per day
  const totalBookings = bookings.length;
  const daysWithBookings = peakDays.filter((d) => d.count > 0).length;
  const averageBookingsPerDay = daysWithBookings > 0 ? totalBookings / 7 : 0; // Average across all 7 days

  return {
    peakDays,
    peakHours,
    totalBookings,
    averageBookingsPerDay,
  };
}

/**
 * Fetch reviews for a professional
 */
export async function fetchProfessionalReviews(professionalId) {
  try {
    const { db, appId } = await import('../firebase');
    const { collection, getDocs, query, where } = await import('firebase/firestore');

    const reviewsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'professionals',
      professionalId,
      'reviews'
    );

    const reviewsQuery = query(reviewsRef);
    const snapshot = await getDocs(reviewsQuery);

    const reviews = [];
    snapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return reviews;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

