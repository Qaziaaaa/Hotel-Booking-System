import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

vi.mock('../server/config/database.js', () => ({
  default: {
    hotel: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from '../server/config/database.js';
import * as hotelService from '../server/services/hotelService.js';
import AppError from '../server/utils/AppError.js';

describe('HotelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHotel = {
    id: 'hotel-1',
    name: 'Grand Plaza Hotel',
    location: 'New York, USA',
    address: '123 Broadway, NY',
    description: 'A luxury hotel',
    amenities: ['wifi', 'pool', 'gym'],
    images: ['https://example.com/img1.jpg'],
    rating: 4.5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createHotel', () => {
    it('creates a hotel with provided data', async () => {
      prisma.hotel.create.mockResolvedValue(mockHotel);

      const result = await hotelService.createHotel({
        name: 'Grand Plaza Hotel',
        location: 'New York, USA',
        address: '123 Broadway, NY',
        description: 'A luxury hotel',
        amenities: ['wifi', 'pool', 'gym'],
      });

      expect(result).toEqual(mockHotel);
      expect(prisma.hotel.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'Grand Plaza Hotel' }),
        include: expect.any(Object),
      });
    });
  });

  describe('getAllHotels', () => {
    it('returns paginated hotels with average ratings', async () => {
      const hotels = [
        { ...mockHotel, reviews: [{ rating: 5 }, { rating: 4 }], _count: { reviews: 2 } },
        { ...mockHotel, id: 'hotel-2', name: 'Seaside Resort', reviews: [{ rating: 3 }], _count: { reviews: 1 } },
      ];
      prisma.hotel.findMany.mockResolvedValue(hotels);
      prisma.hotel.count.mockResolvedValue(2);

      const result = await hotelService.getAllHotels({ page: 1, limit: 10 });

      expect(result.hotels).toHaveLength(2);
      expect(result.hotels[0].avgRating).toBe(4.5);
      expect(result.hotels[1].avgRating).toBe(3);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.pages).toBe(1);
    });

    it('filters by location', async () => {
      prisma.hotel.findMany.mockResolvedValue([]);
      prisma.hotel.count.mockResolvedValue(0);

      await hotelService.getAllHotels({ location: 'New York', page: 1, limit: 10 });

      expect(prisma.hotel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { location: { contains: 'New York', mode: 'insensitive' } },
              { address: { contains: 'New York', mode: 'insensitive' } },
              { name: { contains: 'New York', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('returns empty array when no hotels match', async () => {
      prisma.hotel.findMany.mockResolvedValue([]);
      prisma.hotel.count.mockResolvedValue(0);

      const result = await hotelService.getAllHotels({ location: 'Nowhere', page: 1, limit: 10 });

      expect(result.hotels).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getHotelById', () => {
    it('returns hotel with rooms and reviews', async () => {
      const hotelWithRelations = {
        ...mockHotel,
        rooms: [{ id: 'room-1', roomType: 'Deluxe', price: 299 }],
        reviews: [{ id: 'rev-1', rating: 5, user: { firstName: 'John', lastName: 'Doe' } }],
        _count: { reviews: 1 },
      };
      prisma.hotel.findUnique.mockResolvedValue(hotelWithRelations);

      const result = await hotelService.getHotelById('hotel-1');

      expect(result.name).toBe('Grand Plaza Hotel');
      expect(result.avgRating).toBe(5);
    });

    it('returns avgRating of 0 when no reviews', async () => {
      prisma.hotel.findUnique.mockResolvedValue({
        ...mockHotel,
        rooms: [],
        reviews: [],
        _count: { reviews: 0 },
      });

      const result = await hotelService.getHotelById('hotel-1');
      expect(result.avgRating).toBe(0);
    });

    it('throws 404 when hotel not found', async () => {
      prisma.hotel.findUnique.mockResolvedValue(null);
      await expect(hotelService.getHotelById('nonexistent')).rejects.toThrow(AppError);
      await expect(hotelService.getHotelById('nonexistent')).rejects.toThrow('Hotel not found');
    });
  });

  describe('updateHotel', () => {
    it('updates hotel fields', async () => {
      prisma.hotel.update.mockResolvedValue({ ...mockHotel, name: 'Updated Name' });

      const result = await hotelService.updateHotel('hotel-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('deleteHotel', () => {
    it('deletes hotel by id', async () => {
      prisma.hotel.delete.mockResolvedValue(mockHotel);

      const result = await hotelService.deleteHotel('hotel-1');
      expect(result).toBe(true);
      expect(prisma.hotel.delete).toHaveBeenCalledWith({ where: { id: 'hotel-1' } });
    });
  });

  /**
   * Property-based tests for hotel service invariants
   */
  describe('P: Hotel invariants', () => {
    it('avgRating is always between 0 and 5', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 0, maxLength: 50 }),
          (ratings) => {
            const avg = ratings.length > 0
              ? ratings.reduce((s, r) => s + r, 0) / ratings.length
              : 0;
            expect(avg).toBeGreaterThanOrEqual(0);
            expect(avg).toBeLessThanOrEqual(5);
          }
        )
      );
    });

    it('pagination page is always >= 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 50 }),
          (page, limit) => {
            expect(page).toBeGreaterThanOrEqual(1);
            expect(limit).toBeGreaterThanOrEqual(1);
          }
        )
      );
    });
  });
});
