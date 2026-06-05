import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

vi.mock('../server/config/database.js', () => ({
  default: {
    booking: {
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    user: { count: vi.fn(), groupBy: vi.fn() },
    room: { count: vi.fn() },
    hotel: { findMany: vi.fn() },
    review: { findMany: vi.fn() },
  },
}));

import prisma from '../server/config/database.js';
import * as analyticsService from '../server/services/analyticsService.js';

// Mock dayjs for consistent tests
vi.mock('dayjs', () => {
  const mockDayjs = {
    subtract: vi.fn().mockReturnThis(),
    toDate: vi.fn(() => new Date('2026-06-01')),
    format: vi.fn(() => '2026-06-01'),
  };
  const dayjsFn = vi.fn(() => mockDayjs);
  dayjsFn.default = dayjsFn;
  return { default: dayjsFn };
});

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardAnalytics', () => {
    it('returns summary statistics', async () => {
      prisma.booking.count.mockResolvedValueOnce(50);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { totalPrice: 25000 } });
      prisma.booking.groupBy
        .mockResolvedValueOnce([
          { status: 'CONFIRMED', _count: { id: 30 } },
          { status: 'CANCELLED', _count: { id: 10 } },
          { status: 'COMPLETED', _count: { id: 10 } },
        ])
        .mockResolvedValueOnce([
          { hotelId: 'hotel-1', _count: { id: 20 }, _sum: { totalPrice: 10000 } },
        ]);
      prisma.user.count.mockResolvedValue(10);
      prisma.room.count.mockResolvedValue(50);
      prisma.booking.count.mockResolvedValueOnce(5);
      prisma.booking.findMany
        .mockResolvedValueOnce([
          { createdAt: new Date('2026-06-01') },
          { createdAt: new Date('2026-06-02') },
        ])
        .mockResolvedValueOnce([
          { createdAt: new Date('2026-06-01'), totalPrice: 500 },
          { createdAt: new Date('2026-06-02'), totalPrice: 300 },
        ]);
      prisma.hotel.findMany.mockResolvedValue([
        { id: 'hotel-1', name: 'Grand Plaza' },
      ]);

      const result = await analyticsService.getDashboardAnalytics('30d');

      expect(result.summary).toBeDefined();
      expect(result.summary.totalBookings).toBe(50);
      expect(result.summary.totalRevenue).toBe(25000);
      expect(result.summary.newUsers).toBe(10);
      expect(result.bookingsByStatus).toBeDefined();
      expect(result.topHotels).toBeDefined();
    });

    it('handles zero bookings gracefully', async () => {
      prisma.booking.count.mockResolvedValueOnce(0);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { totalPrice: null } });
      prisma.booking.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      prisma.user.count.mockResolvedValue(0);
      prisma.room.count.mockResolvedValue(0);
      prisma.booking.count.mockResolvedValueOnce(0);
      prisma.booking.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      prisma.hotel.findMany.mockResolvedValue([]);

      const result = await analyticsService.getDashboardAnalytics('30d');

      expect(result.summary.totalBookings).toBe(0);
      expect(result.summary.totalRevenue).toBe(0);
      expect(result.summary.occupancyRate).toBe(0);
    });

    it('handles different periods: 7d, 30d, 90d, 1y', async () => {
      prisma.booking.count.mockResolvedValue(0);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { totalPrice: null } });
      prisma.booking.groupBy.mockResolvedValue([]).mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);
      prisma.room.count.mockResolvedValue(0);
      prisma.booking.count.mockResolvedValue(0);
      prisma.booking.findMany.mockResolvedValue([]).mockResolvedValue([]);
      prisma.hotel.findMany.mockResolvedValue([]);

      const periods = ['7d', '30d', '90d', '1y'];
      for (const period of periods) {
        const result = await analyticsService.getDashboardAnalytics(period);
        expect(result.summary).toBeDefined();
      }
    });
  });

  describe('getUserAnalytics', () => {
    it('returns user statistics', async () => {
      prisma.user.count.mockResolvedValue(100);
      prisma.booking.groupBy.mockResolvedValue([
        { userId: 'user-1' }, { userId: 'user-2' },
      ]);
      prisma.user.groupBy.mockResolvedValue([
        { role: 'USER', _count: { id: 90 } },
        { role: 'ADMIN', _count: { id: 10 } },
      ]);

      const result = await analyticsService.getUserAnalytics();

      expect(result.totalUsers).toBe(100);
      expect(result.activeUsers).toBe(2);
      expect(result.usersByRole).toHaveLength(2);
    });
  });

  describe('getHotelAnalytics', () => {
    it('returns hotel performance data', async () => {
      prisma.booking.findMany.mockResolvedValue([
        { status: 'CONFIRMED', totalPrice: 500, createdAt: new Date() },
        { status: 'CANCELLED', totalPrice: 300, createdAt: new Date() },
        { status: 'CONFIRMED', totalPrice: 700, createdAt: new Date() },
      ]);
      prisma.review.findMany.mockResolvedValue([
        { rating: 5 }, { rating: 4 },
      ]);

      const result = await analyticsService.getHotelAnalytics('hotel-1');

      expect(result.totalBookings).toBe(3);
      expect(result.confirmedBookings).toBe(2);
      expect(result.cancelledBookings).toBe(1);
      expect(result.totalRevenue).toBe(1200);
      expect(result.averageRating).toBe(4.5);
      expect(result.reviewCount).toBe(2);
    });

    it('handles hotel with no bookings or reviews', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.review.findMany.mockResolvedValue([]);

      const result = await analyticsService.getHotelAnalytics('hotel-1');

      expect(result.totalBookings).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageRating).toBe(0);
    });
  });
});
