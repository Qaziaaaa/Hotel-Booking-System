import prisma from '../config/database.js';
import dayjs from 'dayjs';

/**
 * Get dashboard analytics for admin
 */
export const getDashboardAnalytics = async (period = '30d') => {
  const now = dayjs();
  let startDate;

  switch (period) {
    case '7d':
      startDate = now.subtract(7, 'day');
      break;
    case '30d':
      startDate = now.subtract(30, 'day');
      break;
    case '90d':
      startDate = now.subtract(90, 'day');
      break;
    case '1y':
      startDate = now.subtract(1, 'year');
      break;
    default:
      startDate = now.subtract(30, 'day');
  }

  try {
    // Total bookings in period
    const totalBookings = await prisma.booking.count({
      where: {
        createdAt: { gte: startDate.toDate() },
      },
    });

    // Total revenue
    const revenueData = await prisma.booking.aggregate({
      where: {
        createdAt: { gte: startDate.toDate() },
        status: { not: 'CANCELLED' },
      },
      _sum: { totalPrice: true },
    });

    // Bookings by status
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate.toDate() },
      },
      _count: { id: true },
    });

    // New users
    const newUsers = await prisma.user.count({
      where: {
        createdAt: { gte: startDate.toDate() },
      },
    });

    // Bookings over time (for chart)
    const bookingsOverTime = await getBookingsOverTime(startDate.toDate(), now.toDate());

    // Revenue over time (for chart)
    const revenueOverTime = await getRevenueOverTime(startDate.toDate(), now.toDate());

    // Top hotels
    const topHotels = await prisma.booking.groupBy({
      by: ['hotelId'],
      where: {
        createdAt: { gte: startDate.toDate() },
        status: { not: 'CANCELLED' },
      },
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    // Get hotel names
    const hotelIds = topHotels.map(h => h.hotelId);
    const hotels = await prisma.hotel.findMany({
      where: { id: { in: hotelIds } },
      select: { id: true, name: true },
    });

    const topHotelsWithNames = topHotels.map(th => ({
      ...th,
      hotelName: hotels.find(h => h.id === th.hotelId)?.name || 'Unknown',
    }));

    // Occupancy rate (simplified)
    const totalRooms = await prisma.room.count();
    const activeBookings = await prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        checkIn: { lte: now.toDate() },
        checkOut: { gte: now.toDate() },
      },
    });
    
    const occupancyRate = totalRooms > 0 ? (activeBookings / totalRooms) * 100 : 0;

    return {
      summary: {
        totalBookings,
        totalRevenue: revenueData._sum.totalPrice || 0,
        newUsers,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
      },
      bookingsByStatus,
      bookingsOverTime,
      revenueOverTime,
      topHotels: topHotelsWithNames,
    };
  } catch (error) {
    console.error('Analytics Error:', error);
    throw error;
  }
};

/**
 * Get bookings grouped by date for chart
 */
const getBookingsOverTime = async (startDate, endDate) => {
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const grouped = {};
  bookings.forEach(booking => {
    const date = dayjs(booking.createdAt).format('YYYY-MM-DD');
    grouped[date] = (grouped[date] || 0) + 1;
  });

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    bookings: count,
  }));
};

/**
 * Get revenue grouped by date for chart
 */
const getRevenueOverTime = async (startDate, endDate) => {
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' },
    },
    select: { createdAt: true, totalPrice: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const grouped = {};
  bookings.forEach(booking => {
    const date = dayjs(booking.createdAt).format('YYYY-MM-DD');
    grouped[date] = (grouped[date] || 0) + booking.totalPrice;
  });

  return Object.entries(grouped).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));
};

/**
 * Get user activity analytics
 */
export const getUserAnalytics = async () => {
  const now = dayjs();
  const thirtyDaysAgo = now.subtract(30, 'day');

  const totalUsers = await prisma.user.count();
  
  const activeUsers = await prisma.booking.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: thirtyDaysAgo.toDate() },
    },
  });

  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true },
  });

  return {
    totalUsers,
    activeUsers: activeUsers.length,
    usersByRole,
  };
};

/**
 * Get hotel performance analytics
 */
export const getHotelAnalytics = async (hotelId) => {
  const now = dayjs();
  const thirtyDaysAgo = now.subtract(30, 'day');

  const bookings = await prisma.booking.findMany({
    where: {
      hotelId,
      createdAt: { gte: thirtyDaysAgo.toDate() },
    },
  });

  const reviews = await prisma.review.findMany({
    where: { hotelId },
    select: { rating: true },
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const totalRevenue = bookings
    .filter(b => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return {
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
    cancelledBookings: bookings.filter(b => b.status === 'CANCELLED').length,
    totalRevenue,
    averageRating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length,
  };
};

export default {
  getDashboardAnalytics,
  getUserAnalytics,
  getHotelAnalytics,
};
