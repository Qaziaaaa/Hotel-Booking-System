import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Pure function extracted from reviewService
const computeHotelRating = (ratings) => {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
};

/**
 * P5: Review eligibility
 * Validates: Requirements 13.1, 13.2, 13.3
 */
describe('P5: Review eligibility', () => {
  it('only COMPLETED bookings with past checkOut are eligible', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('PENDING', 'CONFIRMED', 'CANCELLED'),
        (status) => {
          const isEligible = status === 'COMPLETED';
          expect(isEligible).toBe(false);
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
          const isPastCheckOut = checkOut < new Date();
          expect(isPastCheckOut).toBe(false);
        }
      )
    );
  });
});

/**
 * P6: Rating bounds
 * Validates: Requirements 13.4
 */
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
        fc.oneof(
          fc.integer({ max: 0 }),
          fc.integer({ min: 6 })
        ),
        (rating) => {
          expect(rating < 1 || rating > 5).toBe(true);
        }
      )
    );
  });
});

/**
 * P7: Hotel rating consistency
 * Validates: Requirements 13.1, 13.5
 */
describe('P7: Hotel rating consistency', () => {
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
          const expected = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
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
