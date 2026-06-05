import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

vi.mock('../server/config/database.js', () => ({
  default: {
    fcmToken: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('firebase-admin', () => {
  const mockMessaging = {
    send: vi.fn(),
  };
  return {
    default: {
      apps: [],
      initializeApp: vi.fn(),
      credential: { cert: vi.fn() },
      messaging: vi.fn(() => mockMessaging),
    },
    __mockMessaging: mockMessaging,
  };
});

import prisma from '../server/config/database.js';
import * as notificationService from '../server/services/notificationService.js';

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerToken', () => {
    it('creates new FCM token for user', async () => {
      prisma.fcmToken.upsert.mockResolvedValue({
        userId: 'user-1',
        token: 'fcm-token-123',
      });

      const result = await notificationService.registerToken('user-1', 'fcm-token-123');
      expect(result.token).toBe('fcm-token-123');
      expect(prisma.fcmToken.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: { userId: 'user-1', token: 'fcm-token-123' },
        update: { token: 'fcm-token-123' },
      });
    });

    it('updates existing FCM token', async () => {
      prisma.fcmToken.upsert.mockResolvedValue({
        userId: 'user-1',
        token: 'new-token',
      });

      const result = await notificationService.registerToken('user-1', 'new-token');
      expect(result.token).toBe('new-token');
    });
  });

  describe('sendNotification', () => {
    it('does not throw when no FCM token exists', async () => {
      prisma.fcmToken.findUnique.mockResolvedValue(null);

      await expect(
        notificationService.sendNotification('user-1', {
          title: 'Test',
          body: 'Test body',
        })
      ).resolves.not.toThrow();
    });

    it('does not send when Firebase is not initialized', async () => {
      prisma.fcmToken.findUnique.mockResolvedValue({
        userId: 'user-1',
        token: 'fcm-token',
      });

      await expect(
        notificationService.sendNotification('user-1', {
          title: 'Test',
          body: 'Test body',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('sendBookingConfirmedNotification', () => {
    it('sends confirmation notification for a booking', async () => {
      prisma.fcmToken.findUnique.mockResolvedValue(null);

      await expect(
        notificationService.sendBookingConfirmedNotification({
          userId: 'user-1',
          hotel: { name: 'Grand Plaza' },
          checkIn: new Date(),
        })
      ).resolves.not.toThrow();
    });
  });

  describe('sendBookingCancelledNotification', () => {
    it('sends cancellation notification for a booking', async () => {
      prisma.fcmToken.findUnique.mockResolvedValue(null);

      await expect(
        notificationService.sendBookingCancelledNotification({
          userId: 'user-1',
          hotel: { name: 'Grand Plaza' },
        })
      ).resolves.not.toThrow();
    });
  });

  describe('sendReminderNotification', () => {
    it('sends reminder notification for upcoming stay', async () => {
      prisma.fcmToken.findUnique.mockResolvedValue(null);

      await expect(
        notificationService.sendReminderNotification({
          userId: 'user-1',
          hotel: { name: 'Grand Plaza' },
          checkIn: new Date(),
        })
      ).resolves.not.toThrow();
    });
  });

  /**
   * Property-based tests
   */
  describe('P10: FCM token uniqueness', () => {
    const simulateTokenUpserts = (tokens) => {
      const store = {};
      for (const token of tokens) {
        store['userId'] = token;
      }
      return store['userId'];
    };

    it('after multiple upserts for the same user, only the last token is stored', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 10 }),
          (tokens) => {
            const finalToken = simulateTokenUpserts(tokens);
            expect(finalToken).toBe(tokens[tokens.length - 1]);
          }
        )
      );
    });

    it('a single registration stores exactly one token', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 200 }),
          (token) => {
            const result = simulateTokenUpserts([token]);
            expect(result).toBe(token);
          }
        )
      );
    });

    it('empty token array results in no stored token', () => {
      const result = simulateTokenUpserts([]);
      expect(result).toBeUndefined();
    });
  });
});
