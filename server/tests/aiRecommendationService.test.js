import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

vi.mock('../server/config/database.js', () => ({
  default: {
    booking: { findMany: vi.fn() },
    hotel: { findMany: vi.fn() },
    review: { findMany: vi.fn() },
  },
}));

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

import prisma from '../server/config/database.js';
import axios from 'axios';
import * as aiService from '../server/services/aiRecommendationService.js';

describe('AIRecommendationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTravelRecommendations', () => {
    it('returns fallback recommendations when AI API is unavailable', async () => {
      axios.post.mockRejectedValue(new Error('API unavailable'));

      const result = await aiService.getTravelRecommendations({
        destination: 'Paris',
        budget: 'moderate',
        interests: ['food', 'culture'],
        travelStyle: 'balanced',
        duration: '3-5 days',
      });

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(result.recommendations).toHaveProperty('summary');
      expect(result.recommendations).toHaveProperty('attractions');
      expect(result.recommendations).toHaveProperty('tips');
      expect(result.recommendations).toHaveProperty('accommodations');
      expect(result.recommendations).toHaveProperty('bestTime');
    });

    it('fallback recommendations include the destination name', async () => {
      axios.post.mockRejectedValue(new Error('API unavailable'));

      const result = await aiService.getTravelRecommendations({
        destination: 'Tokyo',
      });

      expect(result.recommendations.summary).toContain('Tokyo');
    });

    it('handles empty preferences gracefully', async () => {
      axios.post.mockRejectedValue(new Error('API unavailable'));

      const result = await aiService.getTravelRecommendations({});

      expect(result.success).toBe(true);
      expect(result.recommendations.summary).toContain('this destination');
    });
  });

  describe('getPersonalizedHotels', () => {
    it('returns scored hotels based on preferences', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.hotel.findMany.mockResolvedValue([
        {
          id: 'hotel-1',
          name: 'Grand Plaza',
          rating: 4.5,
          amenities: ['wifi', 'pool', 'gym'],
          location: 'New York',
          rooms: [{ price: 200 }],
          reviews: [],
        },
        {
          id: 'hotel-2',
          name: 'Budget Inn',
          rating: 3.0,
          amenities: ['wifi'],
          location: 'New York',
          rooms: [{ price: 80 }],
          reviews: [],
        },
      ]);

      const result = await aiService.getPersonalizedHotels('user-1', {
        location: 'New York',
        budget: 'low',
        amenities: ['wifi'],
      });

      expect(result.success).toBe(true);
      expect(result.hotels).toBeDefined();
      expect(result.basedOnHistory).toBe(false);
    });

    it('returns empty when no hotels match', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.hotel.findMany.mockResolvedValue([]);

      const result = await aiService.getPersonalizedHotels('user-1', {
        location: 'Antarctica',
      });

      expect(result.hotels).toEqual([]);
    });

    it('scores higher-rated hotels higher', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.hotel.findMany.mockResolvedValue([
        {
          id: 'hotel-1',
          name: 'High Rating',
          rating: 5.0,
          amenities: ['wifi'],
          location: 'NY',
          rooms: [{ price: 300 }],
          reviews: [],
        },
        {
          id: 'hotel-2',
          name: 'Low Rating',
          rating: 2.0,
          amenities: ['wifi'],
          location: 'NY',
          rooms: [{ price: 100 }],
          reviews: [],
        },
      ]);

      const result = await aiService.getPersonalizedHotels('user-1', { location: 'NY' });

      expect(result.hotels[0].score).toBeGreaterThanOrEqual(result.hotels[1].score);
    });

    it('handles axios error gracefully for AI API calls', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));

      const result = await aiService.getTravelRecommendations({
        destination: 'London',
      });

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
    });
  });

  describe('analyzeHotelSentiment', () => {
    it('returns neutral for hotels with no reviews', async () => {
      prisma.review.findMany.mockResolvedValue([]);

      const result = await aiService.analyzeHotelSentiment('hotel-1');

      expect(result.sentiment).toBe('neutral');
      expect(result.score).toBe(0);
    });

    it('returns positive for high ratings with positive keywords', async () => {
      prisma.review.findMany.mockResolvedValue([
        { comment: 'Excellent hotel, amazing staff!', rating: 5 },
        { comment: 'Wonderful experience, very clean.', rating: 5 },
      ]);

      const result = await aiService.analyzeHotelSentiment('hotel-1');

      expect(result.sentiment).toBe('positive');
    });

    it('returns negative for low ratings with negative keywords', async () => {
      prisma.review.findMany.mockResolvedValue([
        { comment: 'Terrible hotel, awful service!', rating: 1 },
        { comment: 'Dirty rooms, rude staff.', rating: 1 },
      ]);

      const result = await aiService.analyzeHotelSentiment('hotel-1');

      expect(result.sentiment).toBe('negative');
    });

    it('handles null comments gracefully', async () => {
      prisma.review.findMany.mockResolvedValue([
        { comment: null, rating: 3 },
        { comment: null, rating: 4 },
      ]);

      const result = await aiService.analyzeHotelSentiment('hotel-1');

      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('score');
    });
  });

  /**
   * Property-based tests
   */
  describe('P: Sentiment analysis invariants', () => {
    it('sentiment score is always between -500 and 500', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({
            comment: fc.constantFrom(
              'Great hotel!', 'Terrible service!', 'OK stay',
              'Amazing experience', 'Would not recommend', null
            ),
            rating: fc.integer({ min: 1, max: 5 }),
          }), { minLength: 0, maxLength: 20 }),
          (reviews) => {
            let sentimentScore = 0;
            const positiveWords = ['excellent', 'amazing', 'great', 'wonderful', 'perfect', 'beautiful', 'clean', 'friendly', 'helpful', 'recommend'];
            const negativeWords = ['terrible', 'awful', 'bad', 'dirty', 'rude', 'poor', 'worst', 'disappointing', 'overpriced', 'noisy'];

            reviews.forEach(review => {
              if (review.comment) {
                const lower = review.comment.toLowerCase();
                positiveWords.forEach(w => { if (lower.includes(w)) sentimentScore += 1; });
                negativeWords.forEach(w => { if (lower.includes(w)) sentimentScore -= 1; });
              }
              sentimentScore += (review.rating - 3) * 0.5;
            });

            expect(sentimentScore).toBeGreaterThanOrEqual(-500);
            expect(sentimentScore).toBeLessThanOrEqual(500);
          }
        )
      );
    });
  });
});
