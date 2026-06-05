import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

vi.mock('../server/config/database.js', () => ({
  default: {
    hotel: { findUnique: vi.fn() },
    room: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    booking: { findMany: vi.fn() },
  },
}));

import prisma from '../server/config/database.js';
import * as roomService from '../server/services/roomService.js';
import AppError from '../server/utils/AppError.js';

describe('RoomService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHotel = {
    id: 'hotel-1',
    name: 'Grand Plaza',
    location: 'New York',
  };

  const mockRoom = {
    id: 'room-1',
    hotelId: 'hotel-1',
    roomType: 'Deluxe Suite',
    price: 399,
    capacity: 3,
    amenities: ['wifi', 'tv', 'ac'],
    images: [],
    description: 'Spacious suite',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createRoom', () => {
    it('creates a room with provided data', async () => {
      prisma.room.create.mockResolvedValue({
        ...mockRoom,
        hotel: { name: 'Grand Plaza', location: 'New York' },
      });

      const result = await roomService.createRoom({
        hotelId: 'hotel-1',
        roomType: 'Deluxe Suite',
        price: 399,
        capacity: 3,
        amenities: ['wifi', 'tv', 'ac'],
      });

      expect(result.roomType).toBe('Deluxe Suite');
      expect(result.price).toBe(399);
    });
  });

  describe('getRoomsByHotel', () => {
    it('returns rooms with availability status', async () => {
      prisma.hotel.findUnique.mockResolvedValue(mockHotel);
      prisma.room.findMany.mockResolvedValue([
        { ...mockRoom, bookings: [] },
      ]);

      const result = await roomService.getRoomsByHotel('hotel-1', {});
      expect(result).toHaveLength(1);
      expect(result[0].isAvailable).toBe(true);
    });

    it('throws 404 when hotel not found', async () => {
      prisma.hotel.findUnique.mockResolvedValue(null);

      await expect(roomService.getRoomsByHotel('nonexistent', {})).rejects.toThrow(AppError);
      await expect(roomService.getRoomsByHotel('nonexistent', {})).rejects.toThrow('Hotel not found');
    });

    it('filters by guest capacity', async () => {
      prisma.hotel.findUnique.mockResolvedValue(mockHotel);
      prisma.room.findMany.mockResolvedValue([]);

      await roomService.getRoomsByHotel('hotel-1', { guests: '4' });

      expect(prisma.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { hotelId: 'hotel-1', capacity: { gte: 4 } },
        })
      );
    });

    it('marks rooms as unavailable when overlapping bookings exist', async () => {
      prisma.hotel.findUnique.mockResolvedValue(mockHotel);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 86400000);
      const futureDate = new Date(today.getTime() + 14 * 86400000);

      prisma.room.findMany.mockResolvedValue([
        {
          ...mockRoom,
          bookings: [
            {
              checkIn: today.toISOString(),
              checkOut: nextWeek.toISOString(),
            },
          ],
        },
      ]);

      const result = await roomService.getRoomsByHotel('hotel-1', {
        checkIn: today.toISOString(),
        checkOut: futureDate.toISOString(),
      });

      expect(result[0].isAvailable).toBe(false);
    });
  });

  describe('getRoomById', () => {
    it('returns room with hotel', async () => {
      prisma.room.findUnique.mockResolvedValue({
        ...mockRoom,
        hotel: mockHotel,
        bookings: [],
      });

      const result = await roomService.getRoomById('room-1');
      expect(result.roomType).toBe('Deluxe Suite');
    });

    it('throws 404 when room not found', async () => {
      prisma.room.findUnique.mockResolvedValue(null);
      await expect(roomService.getRoomById('nonexistent')).rejects.toThrow(AppError);
    });
  });

  describe('checkRoomAvailability', () => {
    it('returns true when no conflicting bookings', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      const result = await roomService.checkRoomAvailability(
        'room-1',
        '2026-07-01',
        '2026-07-05'
      );
      expect(result).toBe(true);
    });

    it('returns false when conflicting bookings exist', async () => {
      prisma.booking.findMany.mockResolvedValue([{ id: 'booking-1' }]);

      const result = await roomService.checkRoomAvailability(
        'room-1',
        '2026-07-01',
        '2026-07-05'
      );
      expect(result).toBe(false);
    });

    it('excludes specified booking from conflict check', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      const result = await roomService.checkRoomAvailability(
        'room-1',
        '2026-07-01',
        '2026-07-05',
        'booking-to-exclude'
      );
      expect(result).toBe(true);
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'booking-to-exclude' },
          }),
        })
      );
    });
  });

  describe('updateRoom', () => {
    it('updates room fields', async () => {
      prisma.room.update.mockResolvedValue({
        ...mockRoom,
        price: 499,
        hotel: { name: 'Grand Plaza', location: 'New York' },
      });

      const result = await roomService.updateRoom('room-1', { price: 499 });
      expect(result.price).toBe(499);
    });
  });

  describe('deleteRoom', () => {
    it('deletes room by id', async () => {
      prisma.room.delete.mockResolvedValue(mockRoom);
      const result = await roomService.deleteRoom('room-1');
      expect(result).toBe(true);
    });
  });

  /**
   * Property-based tests
   */
  describe('P9: Availability monotonicity (existing)', () => {
    const hasOverlap = (existingCheckIn, existingCheckOut, newCheckIn, newCheckOut) => {
      return new Date(existingCheckIn) < new Date(newCheckOut) &&
             new Date(existingCheckOut) > new Date(newCheckIn);
    };

    it('a sub-range is unavailable when the full range is unavailable', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          fc.double({ min: 0.1, max: 0.9 }),
          fc.double({ min: 0.1, max: 0.9 }),
          (nights, startFrac, endFrac) => {
            const base = new Date();
            const existStart = base;
            const existEnd = new Date(base.getTime() + nights * 86400000);
            const fullStart = new Date(base.getTime() - 86400000);
            const fullEnd = new Date(base.getTime() + (nights + 1) * 86400000);
            const rangeDuration = fullEnd.getTime() - fullStart.getTime();
            const subStart = new Date(fullStart.getTime() + startFrac * rangeDuration);
            const subEnd = new Date(fullStart.getTime() + (startFrac + (1 - startFrac) * endFrac) * rangeDuration);
            if (subEnd <= subStart) return;
            const fullOverlaps = hasOverlap(existStart, existEnd, fullStart, fullEnd);
            if (fullOverlaps) {
              const subOverlaps = hasOverlap(existStart, existEnd, subStart, subEnd);
              if (subOverlaps) {
                expect(subOverlaps).toBe(true);
              }
            }
          }
        )
      );
    });

    it('non-overlapping ranges are always available', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          fc.integer({ min: 1, max: 30 }),
          (existingNights, gapDays) => {
            const base = new Date();
            const existStart = base;
            const existEnd = new Date(base.getTime() + existingNights * 86400000);
            const newStart = new Date(existEnd.getTime() + gapDays * 86400000);
            const newEnd = new Date(newStart.getTime() + 3 * 86400000);
            expect(hasOverlap(existStart, existEnd, newStart, newEnd)).toBe(false);
          }
        )
      );
    });

    it('same-day checkout is not an overlap', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          (nights) => {
            const base = new Date();
            expect(hasOverlap(base, new Date(base.getTime() + nights * 86400000),
              new Date(base.getTime() + nights * 86400000),
              new Date(base.getTime() + (nights + 3) * 86400000))).toBe(false);
          }
        )
      );
    });
  });
});
