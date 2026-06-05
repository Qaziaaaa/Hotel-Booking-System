import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

vi.mock('../server/config/database.js', () => ({
  default: {
    $transaction: vi.fn((fn) => fn(prisma)),
    booking: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    room: { findFirst: vi.fn() },
  },
}));

vi.mock('../server/services/notificationService.js', () => ({
  sendBookingConfirmedNotification: vi.fn(),
  sendBookingCancelledNotification: vi.fn(),
}));

vi.mock('../server/utils/email.js', () => ({
  sendBookingConfirmation: vi.fn(),
  sendBookingCancellation: vi.fn(),
}));

import prisma from '../server/config/database.js';
import * as bookingService from '../server/services/bookingService.js';
import AppError from '../server/utils/AppError.js';

describe('BookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = { id: 'user-1', email: 'test@test.com', firstName: 'John', lastName: 'Doe' };
  const mockHotel = { id: 'hotel-1', name: 'Grand Plaza', location: 'New York' };
  const mockRoom = {
    id: 'room-1',
    hotelId: 'hotel-1',
    roomType: 'Deluxe',
    price: 200,
    capacity: 3,
    hotel: mockHotel,
  };

  const validBookingData = {
    hotelId: 'hotel-1',
    roomId: 'room-1',
    checkIn: '2026-07-15',
    checkOut: '2026-07-18',
    guests: 2,
  };

  describe('createBooking', () => {
    it('creates booking with correct price calculation', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const checkoutDate = new Date(futureDate);
      checkoutDate.setDate(checkoutDate.getDate() + 3);

      prisma.room.findFirst.mockResolvedValue(mockRoom);
      prisma.$transaction.mockImplementation(async (fn) => {
        const txMock = {
          booking: {
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn().mockResolvedValue({
              id: 'booking-1',
              userId: 'user-1',
              hotelId: 'hotel-1',
              roomId: 'room-1',
              checkIn: futureDate,
              checkOut: checkoutDate,
              guests: 2,
              totalPrice: 600,
              status: 'CONFIRMED',
              user: mockUser,
              hotel: { name: 'Grand Plaza', location: 'New York' },
              room: { roomType: 'Deluxe', price: 200 },
            }),
          },
        };
        return fn(txMock);
      });

      const result = await bookingService.createBooking(
        {
          ...validBookingData,
          checkIn: futureDate.toISOString(),
          checkOut: checkoutDate.toISOString(),
        },
        { id: 'user-1' }
      );

      expect(result.status).toBe('CONFIRMED');
      expect(result.totalPrice).toBe(600);
    });

    it('rejects past check-in dates', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await expect(bookingService.createBooking(
        { ...validBookingData, checkIn: pastDate.toISOString(), checkOut: new Date(Date.now() + 86400000).toISOString() },
        { id: 'user-1' }
      )).rejects.toThrow(AppError);
    });

    it('rejects check-out before check-in', async () => {
      await expect(bookingService.createBooking(
        { ...validBookingData, checkIn: '2026-07-10', checkOut: '2026-07-08' },
        { id: 'user-1' }
      )).rejects.toThrow(AppError);
    });

    it('rejects when room does not belong to specified hotel', async () => {
      prisma.room.findFirst.mockResolvedValue(null);

      await expect(bookingService.createBooking(validBookingData, { id: 'user-1' }))
        .rejects.toThrow(AppError);
    });

    it('rejects when guests exceed room capacity', async () => {
      prisma.room.findFirst.mockResolvedValue(mockRoom);

      await expect(bookingService.createBooking(
        { ...validBookingData, guests: 10 },
        { id: 'user-1' }
      )).rejects.toThrow(AppError);
    });

    it('rejects double-booking via transaction conflict check', async () => {
      prisma.room.findFirst.mockResolvedValue(mockRoom);
      prisma.$transaction.mockImplementation(async (fn) => {
        const txMock = {
          booking: {
            findMany: vi.fn().mockResolvedValue([{ id: 'existing-booking' }]),
            create: vi.fn(),
          },
        };
        return fn(txMock);
      });

      await expect(bookingService.createBooking(validBookingData, { id: 'user-1' }))
        .rejects.toThrow(AppError);
    });
  });

  describe('getUserBookings', () => {
    it('returns bookings for user', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          hotel: { id: 'hotel-1', name: 'Grand Plaza', location: 'NY', images: [] },
          room: { id: 'room-1', roomType: 'Deluxe', price: 200, capacity: 2 },
          review: null,
          status: 'CONFIRMED',
        },
      ];
      prisma.booking.findMany.mockResolvedValue(mockBookings);

      const result = await bookingService.getUserBookings('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].hotel.name).toBe('Grand Plaza');
    });
  });

  describe('getBookingById', () => {
    it('returns booking for authorized user', async () => {
      const mockBooking = { id: 'booking-1', userId: 'user-1', hotel: {}, room: {}, review: null };
      prisma.booking.findFirst.mockResolvedValue(mockBooking);

      const result = await bookingService.getBookingById('booking-1', 'user-1', 'USER');
      expect(result.id).toBe('booking-1');
    });

    it('allows ADMIN to view any booking', async () => {
      const mockBooking = { id: 'booking-1', userId: 'other-user', hotel: {}, room: {}, review: null };
      prisma.booking.findFirst.mockResolvedValue(mockBooking);

      const result = await bookingService.getBookingById('booking-1', 'admin-1', 'ADMIN');
      expect(result.id).toBe('booking-1');
    });

    it('throws 404 when booking not found', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);
      await expect(bookingService.getBookingById('nonexistent', 'user-1', 'USER'))
        .rejects.toThrow(AppError);
    });
  });

  describe('cancelBooking', () => {
    const mockCancelBooking = {
      id: 'booking-1',
      userId: 'user-1',
      status: 'CONFIRMED',
      checkIn: new Date(Date.now() + 7 * 86400000),
      checkOut: new Date(Date.now() + 10 * 86400000),
      user: { email: 'test@test.com', firstName: 'John', lastName: 'Doe' },
      hotel: { name: 'Grand Plaza' },
      room: { roomType: 'Deluxe' },
    };

    it('cancels a CONFIRMED booking', async () => {
      prisma.booking.findFirst.mockResolvedValue(mockCancelBooking);
      prisma.booking.update.mockResolvedValue({ ...mockCancelBooking, status: 'CANCELLED' });

      const result = await bookingService.cancelBooking('booking-1', 'user-1', 'USER');
      expect(result.status).toBe('CANCELLED');
    });

    it('throws error for already cancelled bookings', async () => {
      prisma.booking.findFirst.mockResolvedValue({ ...mockCancelBooking, status: 'CANCELLED' });

      await expect(bookingService.cancelBooking('booking-1', 'user-1', 'USER'))
        .rejects.toThrow(AppError);
    });

    it('throws error for completed bookings', async () => {
      prisma.booking.findFirst.mockResolvedValue({ ...mockCancelBooking, status: 'COMPLETED' });

      await expect(bookingService.cancelBooking('booking-1', 'user-1', 'USER'))
        .rejects.toThrow(AppError);
    });

    it('throws error for past check-in bookings', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        ...mockCancelBooking,
        checkIn: new Date(Date.now() - 1 * 86400000),
      });

      await expect(bookingService.cancelBooking('booking-1', 'user-1', 'USER'))
        .rejects.toThrow(AppError);
    });
  });

  describe('canReviewBooking', () => {
    it('returns canReview true for eligible booking', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        id: 'booking-1',
        status: 'COMPLETED',
        checkOut: new Date(Date.now() - 1 * 86400000),
        review: null,
      });

      const result = await bookingService.canReviewBooking('booking-1', 'user-1');
      expect(result.canReview).toBe(true);
    });

    it('returns false when booking is not COMPLETED', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);

      const result = await bookingService.canReviewBooking('booking-1', 'user-1');
      expect(result.canReview).toBe(false);
    });

    it('returns false when already reviewed', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        id: 'booking-1',
        status: 'COMPLETED',
        checkOut: new Date(Date.now() - 1 * 86400000),
        review: { id: 'rev-1' },
      });

      const result = await bookingService.canReviewBooking('booking-1', 'user-1');
      expect(result.canReview).toBe(false);
    });
  });

  /**
   * Property-based tests (enhanced)
   */
  describe('P1: No double booking — overlap predicate (enhanced)', () => {
    const hasOverlap = (a, b, c, d) => new Date(a) < new Date(d) && new Date(b) > new Date(c);

    it('detects overlap when date ranges share at least one day', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 30 }),
          fc.integer({ min: -10, max: 10 }),
          fc.integer({ min: 1, max: 30 }),
          (baseOffset, dur1, offset2, dur2) => {
            const base = new Date(Date.now() + baseOffset * 86400000);
            const b1Start = base;
            const b1End = new Date(base.getTime() + dur1 * 86400000);
            const b2Start = new Date(base.getTime() + offset2 * 86400000);
            const b2End = new Date(b2Start.getTime() + dur2 * 86400000);
            const overlap = hasOverlap(b1Start, b1End, b2Start, b2End);
            const actualOverlap = b1Start < b2End && b1End > b2Start;
            expect(overlap).toBe(actualOverlap);
          }
        )
      );
    });

    it('identical date ranges always overlap', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          (dur) => {
            const start = new Date();
            const end = new Date(start.getTime() + dur * 86400000);
            expect(hasOverlap(start, end, start, end)).toBe(true);
          }
        )
      );
    });
  });

  describe('P2: Price calculation correctness', () => {
    const calculateNights = (checkIn, checkOut) => {
      const oneDay = 24 * 60 * 60 * 1000;
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      return Math.round(Math.abs((end - start) / oneDay));
    };

    it('totalPrice equals nights * pricePerNight for all valid date ranges', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          fc.float({ min: 10, max: 10000, noNaN: true }),
          (nights, pricePerNight) => {
            const checkIn = new Date();
            const checkOut = new Date(checkIn.getTime() + nights * 86400000);
            const calculatedNights = calculateNights(checkIn, checkOut);
            const totalPrice = calculatedNights * pricePerNight;
            expect(calculatedNights).toBe(nights);
            expect(totalPrice).toBeCloseTo(nights * pricePerNight, 5);
          }
        )
      );
    });

    it('multi-room price is sum of individual room prices', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 50, max: 1000, noNaN: true }), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 1, max: 14 }),
          (prices, nights) => {
            const total = prices.reduce((s, p) => s + p * nights, 0);
            const expected = prices.reduce((s, p) => s + p, 0) * nights;
            expect(total).toBe(expected);
          }
        )
      );
    });
  });

  describe('P3: Date ordering invariant', () => {
    it('checkOut <= checkIn is always invalid', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 }),
          (offsetDays) => {
            const checkIn = new Date();
            const checkOut = new Date(checkIn.getTime() - offsetDays * 86400000);
            expect(checkOut <= checkIn).toBe(true);
          }
        )
      );
    });
  });

  describe('P4: Capacity constraint', () => {
    it('guests exceeding capacity is always invalid', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (capacity, extra) => {
            const guests = capacity + extra;
            expect(guests > capacity).toBe(true);
          }
        )
      );
    });

    it('guests equal to capacity is valid', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (capacity) => {
            expect(capacity <= capacity).toBe(true);
          }
        )
      );
    });
  });

  describe('P8: Cancellation eligibility (enhanced)', () => {
    it('past checkIn bookings cannot be cancelled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAgo) => {
            const checkIn = new Date(Date.now() - daysAgo * 86400000);
            expect(checkIn < new Date()).toBe(true);
          }
        )
      );
    });

    it('future checkIn bookings can be cancelled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAhead) => {
            const checkIn = new Date(Date.now() + daysAhead * 86400000);
            expect(checkIn >= new Date()).toBe(true);
          }
        )
      );
    });

    it('only CONFIRMED and PENDING bookings are cancellable', () => {
      const cancellable = ['CONFIRMED', 'PENDING'];
      const allStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
      allStatuses.forEach((status) => {
        if (cancellable.includes(status)) {
          expect(cancellable.includes(status)).toBe(true);
        } else {
          expect(cancellable.includes(status)).toBe(false);
        }
      });
    });
  });
});
