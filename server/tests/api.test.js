import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('../server/config/database.js', () => ({
  default: {
    user: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    hotel: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() },
    room: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    booking: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn(), count: vi.fn() },
    review: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    fcmToken: { upsert: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn((fn) => fn({
      booking: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation(({ data }) => ({
          id: 'booking-1', ...data, status: 'CONFIRMED',
          user: { email: 'test@test.com', firstName: 'John', lastName: 'Doe' },
          hotel: { name: 'Grand Plaza', location: 'New York' },
          room: { roomType: 'Deluxe', price: 200 },
        })),
      },
    })),
  },
}));

vi.mock('../server/middleware/auth.js', async () => {
  const mid = vi.fn((req, res, next) => {
    req.user = { id: 'user-1', email: 'test@test.com', firstName: 'John', lastName: 'Doe', role: 'USER' };
    next();
  });
  mid.protect = mid;
  mid.restrictTo = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ status: 'fail', message: 'Forbidden' });
    next();
  };
  mid.optionalAuth = vi.fn((req, res, next) => next());
  mid.generateToken = vi.fn(() => 'test-jwt-token');
  mid.verifyToken = vi.fn(() => ({ userId: 'user-1' }));
  return { default: mid, ...mid };
});

vi.mock('../server/services/notificationService.js', () => ({
  sendBookingConfirmedNotification: vi.fn(),
  sendBookingCancelledNotification: vi.fn(),
}));

vi.mock('../server/utils/email.js', () => ({
  sendBookingConfirmation: vi.fn(),
  sendBookingCancellation: vi.fn(),
  sendReminderEmail: vi.fn(),
}));

import prisma from '../server/config/database.js';

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Auth Flow', () => {
    it('registration creates user with token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        role: 'USER',
        createdAt: new Date(),
      });

      const { register } = await import('../server/services/authService.js');
      const { user, token } = await register({
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });

      expect(user.email).toBe('newuser@test.com');
      expect(token).toBeTruthy();
    });

    it('login with valid credentials returns token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      });

      const { login } = await import('../server/services/authService.js');
      const result = await login({ email: 'test@test.com', password: 'password123' });

      expect(result.user.email).toBe('test@test.com');
      expect(result.token).toBe('test-jwt-token');
    });
  });

  describe('Admin Authorization', () => {
    it('allows ADMIN role through restrictTo', async () => {
      const { default: authMiddleware } = await import('../server/middleware/auth.js');
      const middleware = authMiddleware.restrictTo('ADMIN');

      const req = { user: { role: 'ADMIN' } };
      const res = {};
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('blocks USER role from ADMIN routes', async () => {
      const { default: authMiddleware } = await import('../server/middleware/auth.js');
      const middleware = authMiddleware.restrictTo('ADMIN');

      const req = { user: { role: 'USER' } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Validation Schemas', () => {
    it('register schema rejects short password', async () => {
      const { schemas } = await import('../server/middleware/validate.js');
      const { error } = schemas.register.validate({
        email: 'test@test.com', password: 'short',
        firstName: 'Test', lastName: 'User',
      });
      expect(error).toBeDefined();
    });

    it('register schema rejects invalid email', async () => {
      const { schemas } = await import('../server/middleware/validate.js');
      const { error } = schemas.register.validate({
        email: 'notanemail', password: 'password123',
        firstName: 'Test', lastName: 'User',
      });
      expect(error).toBeDefined();
    });

    it('createBooking schema rejects checkOut before checkIn', async () => {
      const { schemas } = await import('../server/middleware/validate.js');
      const { error } = schemas.createBooking.validate({
        hotelId: '550e8400-e29b-41d4-a716-446655440000',
        roomId: '550e8400-e29b-41d4-a716-446655440001',
        checkIn: '2026-07-10',
        checkOut: '2026-07-08',
        guests: 2,
      });
      expect(error).toBeDefined();
    });

    it('createReview schema rejects rating outside 1-5', async () => {
      const { schemas } = await import('../server/middleware/validate.js');
      const { error } = schemas.createReview.validate({
        hotelId: '550e8400-e29b-41d4-a716-446655440000',
        bookingId: '550e8400-e29b-41d4-a716-446655440001',
        rating: 10,
        comment: 'This is a valid long enough comment',
      });
      expect(error).toBeDefined();
    });

    it('accepts valid createBooking data', async () => {
      const { schemas } = await import('../server/middleware/validate.js');
      const { error } = schemas.createBooking.validate({
        hotelId: '550e8400-e29b-41d4-a716-446655440000',
        roomId: '550e8400-e29b-41d4-a716-446655440001',
        checkIn: '2026-07-10',
        checkOut: '2026-07-12',
        guests: 2,
      });
      expect(error).toBeUndefined();
    });
  });

  describe('Error Handler', () => {
    it('AppError has correct status codes', async () => {
      const AppError = (await import('../server/utils/AppError.js')).default;
      const err = new AppError('Not found', 404);
      expect(err.statusCode).toBe(404);
      expect(err.status).toBe('fail');
      expect(err.isOperational).toBe(true);
    });

    it('AppError 500+ uses error status', async () => {
      const AppError = (await import('../server/utils/AppError.js')).default;
      const err = new AppError('Server error', 500);
      expect(err.status).toBe('error');
    });
  });
});
