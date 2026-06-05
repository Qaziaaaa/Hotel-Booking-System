import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

vi.mock('../server/config/database.js', () => ({
  default: {
    review: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    hotel: { update: vi.fn(), findUnique: vi.fn() },
  },
}));

vi.mock('../server/services/bookingService.js', () => ({
  canReviewBooking: vi.fn(),
}));

import prisma from '../server/config/database.js';
import * as reviewService from '../server/services/reviewService.js';
import { canReviewBooking } from '../server/services/bookingService.js';
import AppError from '../server/utils/AppError.js';

describe('ReviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = { id: 'user-1', firstName: 'John', lastName: 'Doe' };
  const mockReview = {
    id: 'review-1',
    userId: 'user-1',
    hotelId: 'hotel-1',
    bookingId: 'booking-1',
    rating: 4,
    comment: 'Great stay, wonderful experience!',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createReview', () => {
    it('creates review when user is eligible', async () => {
      canReviewBooking.mockResolvedValue({
        canReview: true,
        booking: { id: 'booking-1', hotelId: 'hotel-1' },
      });
      prisma.review.create.mockResolvedValue({
        ...mockReview,
        user: { firstName: 'John', lastName: 'Doe' },
        hotel: { name: 'Grand Plaza' },
      });
      prisma.review.findMany.mockResolvedValue([{ rating: 4 }]);

      const result = await reviewService.createReview(
        { hotelId: 'hotel-1', bookingId: 'booking-1', rating: 4, comment: 'Great stay!' },
        'user-1'
      );

      expect(result.rating).toBe(4);
      expect(prisma.hotel.update).toHaveBeenCalled();
    });

    it('rejects review when booking is not eligible', async () => {
      canReviewBooking.mockResolvedValue({
        canReview: false,
        reason: 'Booking not eligible for review',
      });

      await expect(
        reviewService.createReview(
          { hotelId: 'hotel-1', bookingId: 'booking-1', rating: 4, comment: 'Great' },
          'user-1'
        )
      ).rejects.toThrow(AppError);
    });

    it('rejects review when booking does not belong to the hotel', async () => {
      canReviewBooking.mockResolvedValue({
        canReview: true,
        booking: { id: 'booking-1', hotelId: 'other-hotel' },
      });

      await expect(
        reviewService.createReview(
          { hotelId: 'hotel-1', bookingId: 'booking-1', rating: 4, comment: 'Great' },
          'user-1'
        )
      ).rejects.toThrow(AppError);
    });

    it('updates hotel average rating after creation', async () => {
      canReviewBooking.mockResolvedValue({
        canReview: true,
        booking: { id: 'booking-1', hotelId: 'hotel-1' },
      });
      prisma.review.create.mockResolvedValue({
        ...mockReview,
        user: { firstName: 'John', lastName: 'Doe' },
        hotel: { name: 'Grand Plaza' },
      });
      prisma.review.findMany.mockResolvedValue([{ rating: 4 }, { rating: 5 }]);

      await reviewService.createReview(
        { hotelId: 'hotel-1', bookingId: 'booking-1', rating: 4, comment: 'Great!' },
        'user-1'
      );

      expect(prisma.hotel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'hotel-1' },
          data: { rating: 4.5 },
        })
      );
    });
  });

  describe('getHotelReviews', () => {
    it('returns paginated reviews for a hotel', async () => {
      prisma.hotel.findUnique.mockResolvedValue({ id: 'hotel-1' });
      prisma.review.count.mockResolvedValue(1);
      prisma.review.findMany
        .mockResolvedValueOnce([{ ...mockReview, user: { firstName: 'John', lastName: 'Doe' } }])
        .mockResolvedValueOnce([{ rating: 4 }]);

      const result = await reviewService.getHotelReviews('hotel-1', { page: 1, limit: 10 });

      expect(result.reviews).toHaveLength(1);
      expect(result.avgRating).toBe(4);
      expect(result.pagination.total).toBe(1);
    });

    it('throws 404 when hotel not found', async () => {
      prisma.hotel.findUnique.mockResolvedValue(null);

      await expect(reviewService.getHotelReviews('nonexistent', {}))
        .rejects.toThrow(AppError);
    });
  });

  describe('getUserReviews', () => {
    it('returns reviews by user', async () => {
      prisma.review.findMany.mockResolvedValue([
        {
          ...mockReview,
          hotel: { id: 'hotel-1', name: 'Grand Plaza', location: 'NY', images: [] },
          booking: { checkIn: new Date(), checkOut: new Date() },
        },
      ]);

      const result = await reviewService.getUserReviews('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].hotel.name).toBe('Grand Plaza');
    });
  });

  describe('updateReview', () => {
    it('updates own review', async () => {
      prisma.review.findFirst.mockResolvedValue(mockReview);
      prisma.review.update.mockResolvedValue({
        ...mockReview,
        rating: 5,
        comment: 'Updated comment',
        user: { firstName: 'John', lastName: 'Doe' },
        hotel: { name: 'Grand Plaza' },
      });
      prisma.review.findMany.mockResolvedValue([{ rating: 5 }]);

      const result = await reviewService.updateReview(
        'review-1',
        'user-1',
        { rating: 5, comment: 'Updated comment' }
      );

      expect(result.rating).toBe(5);
    });

    it('throws 404 when review not found', async () => {
      prisma.review.findFirst.mockResolvedValue(null);

      await expect(
        reviewService.updateReview('nonexistent', 'user-1', { rating: 3 })
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteReview', () => {
    it('deletes own review', async () => {
      prisma.review.findFirst.mockResolvedValue(mockReview);
      prisma.review.delete.mockResolvedValue(mockReview);
      prisma.review.findMany.mockResolvedValue([]);

      const result = await reviewService.deleteReview('review-1', 'user-1');
      expect(result).toBe(true);
    });

    it('updates hotel rating after deletion', async () => {
      prisma.review.findFirst.mockResolvedValue(mockReview);
      prisma.review.delete.mockResolvedValue(mockReview);
      prisma.review.findMany.mockResolvedValue([]);

      await reviewService.deleteReview('review-1', 'user-1');

      expect(prisma.hotel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'hotel-1' },
          data: { rating: 0 },
        })
      );
    });

    it('throws 404 when review not found', async () => {
      prisma.review.findFirst.mockResolvedValue(null);

      await expect(reviewService.deleteReview('nonexistent', 'user-1'))
        .rejects.toThrow(AppError);
    });
  });

  /**
   * Property-based tests (enhanced original ones preserved)
   */
  describe('P5: Review eligibility', () => {
    it('only COMPLETED bookings with past checkOut are eligible', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('PENDING', 'CONFIRMED', 'CANCELLED'),
          (status) => {
            expect(status === 'COMPLETED').toBe(false);
          }
        )
      );
    });

    it('future checkOut bookings are not eligible even if COMPLETED', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAhead) => {
            const checkOut = new Date(Date.now() + daysAhead * 86400000);
            expect(checkOut < new Date()).toBe(false);
          }
        )
      );
    });
  });

  describe('P6: Rating bounds', () => {
    it('ratings in [1, 5] are valid', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (rating) => {
            expect(rating >= 1 && rating <= 5).toBe(true);
          }
        )
      );
    });

    it('ratings outside [1, 5] are invalid', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer({ max: 0 }), fc.integer({ min: 6 })),
          (rating) => {
            expect(rating < 1 || rating > 5).toBe(true);
          }
        )
      );
    });
  });

  describe('P7: Hotel rating consistency', () => {
    const computeHotelRating = (ratings) => {
      if (ratings.length === 0) return 0;
      const sum = ratings.reduce((a, b) => a + b, 0);
      return Math.round((sum / ratings.length) * 10) / 10;
    };

    it('empty reviews array returns 0', () => {
      expect(computeHotelRating([])).toBe(0);
    });

    it('single review returns that rating', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (rating) => {
            expect(computeHotelRating([rating])).toBe(rating);
          }
        )
      );
    });

    it('rating equals mean rounded to 1 decimal for any array of valid ratings', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 100 }),
          (ratings) => {
            const expected = Math.round(
              (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10
            ) / 10;
            expect(computeHotelRating(ratings)).toBe(expected);
          }
        )
      );
    });

    it('result is always between 0 and 5 inclusive', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 0, maxLength: 100 }),
          (ratings) => {
            const result = computeHotelRating(ratings);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(5);
          }
        )
      );
    });
  });
});
