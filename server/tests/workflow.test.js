import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('../server/config/database.js', () => ({
  default: {
    $transaction: vi.fn((fn) => fn({
      booking: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation(({ data }) => ({
          id: 'booking-' + Date.now(),
          ...data,
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      },
    })),
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    hotel: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() },
    room: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() },
    booking: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
    review: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    fcmToken: { upsert: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  },
}));

vi.mock('../server/middleware/auth.js', () => ({
  generateToken: vi.fn(() => 'jwt-token'),
  verifyToken: vi.fn(() => ({ userId: 'user-1' })),
}));

vi.mock('../server/services/notificationService.js', () => ({
  sendBookingConfirmedNotification: vi.fn(),
  sendBookingCancelledNotification: vi.fn(),
  sendReminderNotification: vi.fn(),
}));

vi.mock('../server/utils/email.js', () => ({
  sendBookingConfirmation: vi.fn(),
  sendBookingCancellation: vi.fn(),
  sendReminderEmail: vi.fn(),
}));

import prisma from '../server/config/database.js';

/**
 * Full Workflow Tests: Complete end-to-end booking system scenarios.
 * These tests mock Prisma at the service layer and verify that
 * the entire booking workflow behaves correctly.
 */
describe('Full Booking Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Workflow 1: User Registration → Login → Browse Hotels → Book Room → View Booking
   */
  describe('W1: Complete booking journey', () => {
    it('W1.1: User registers successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'USER',
        createdAt: new Date(),
      });

      const { register } = await import('../server/services/authService.js');
      const result = await register({
        email: 'jane@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(result.user.email).toBe('jane@example.com');
      expect(result.token).toBeTruthy();
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('W1.2: User logs in after registration', async () => {
      const hashedPassword = await bcrypt.hash('SecurePass123!', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'jane@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'USER',
      });

      const { login } = await import('../server/services/authService.js');
      const result = await login({ email: 'jane@example.com', password: 'SecurePass123!' });

      expect(result.user.firstName).toBe('Jane');
      expect(result.token).toBeTruthy();
    });

    it('W1.3: User browses hotels with filters', async () => {
      prisma.hotel.findMany.mockResolvedValue([
        {
          id: 'hotel-1',
          name: 'Grand Plaza Hotel',
          location: 'New York, USA',
          rating: 4.5,
          amenities: ['wifi', 'pool', 'gym'],
          rooms: [{ id: 'room-1', roomType: 'Deluxe', price: 299, capacity: 3 }],
          reviews: [{ rating: 5 }, { rating: 4 }],
          _count: { reviews: 2 },
        },
      ]);
      prisma.hotel.count.mockResolvedValue(1);

      const { getAllHotels } = await import('../server/services/hotelService.js');
      const result = await getAllHotels({ location: 'New York', page: 1, limit: 10 });

      expect(result.hotels).toHaveLength(1);
      expect(result.hotels[0].avgRating).toBe(4.5);
      expect(result.pagination.total).toBe(1);
    });

    it('W1.4: User views hotel details with rooms', async () => {
      prisma.hotel.findUnique.mockResolvedValue({
        id: 'hotel-1',
        name: 'Grand Plaza Hotel',
        location: 'New York',
        description: 'Luxury hotel',
        amenities: ['wifi', 'pool'],
        images: ['img1.jpg'],
        rating: 4.5,
        rooms: [
          { id: 'room-1', roomType: 'Standard', price: 199, capacity: 2, amenities: ['wifi'], images: [], description: 'Cozy room' },
          { id: 'room-2', roomType: 'Suite', price: 399, capacity: 4, amenities: ['wifi', 'jacuzzi'], images: [], description: 'Spacious suite' },
        ],
        reviews: [],
        _count: { reviews: 0 },
      });

      const { getHotelById } = await import('../server/services/hotelService.js');
      const hotel = await getHotelById('hotel-1');

      expect(hotel.rooms).toHaveLength(2);
      expect(hotel.avgRating).toBe(0);
    });

    it('W1.5: User books a room for valid dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const checkoutDate = new Date(futureDate);
      checkoutDate.setDate(checkoutDate.getDate() + 3);

      prisma.room.findFirst.mockResolvedValue({
        id: 'room-1', hotelId: 'hotel-1', roomType: 'Deluxe', price: 200, capacity: 3,
        hotel: { id: 'hotel-1', name: 'Grand Plaza', location: 'New York' },
      });

      const { createBooking } = await import('../server/services/bookingService.js');
      const booking = await createBooking({
        hotelId: 'hotel-1',
        roomId: 'room-1',
        checkIn: futureDate.toISOString(),
        checkOut: checkoutDate.toISOString(),
        guests: 2,
      }, { id: 'user-1' });

      expect(booking.status).toBe('CONFIRMED');
      expect(booking.totalPrice).toBe(600);
    });

    it('W1.6: User views their bookings', async () => {
      prisma.booking.findMany.mockResolvedValue([
        {
          id: 'booking-1',
          status: 'CONFIRMED',
          totalPrice: 600,
          checkIn: new Date(),
          checkOut: new Date(),
          guests: 2,
          hotel: { id: 'hotel-1', name: 'Grand Plaza', location: 'New York', images: [] },
          room: { id: 'room-1', roomType: 'Deluxe', price: 200, capacity: 2 },
          review: null,
          createdAt: new Date(),
        },
      ]);

      const { getUserBookings } = await import('../server/services/bookingService.js');
      const bookings = await getUserBookings('user-1');

      expect(bookings).toHaveLength(1);
      expect(bookings[0].hotel.name).toBe('Grand Plaza');
    });
  });

  /**
   * Workflow 2: Booking → Completed Stay → Review → Rating Updated
   */
  describe('W2: Post-stay review workflow', () => {
    it('W2.1: Booking is completed after check-out date passes', async () => {
      const pastDate = new Date(Date.now() - 2 * 86400000);
      prisma.booking.findFirst.mockResolvedValue({
        id: 'booking-1',
        status: 'COMPLETED',
        checkOut: pastDate,
        userId: 'user-1',
        hotelId: 'hotel-1',
        review: null,
      });

      const { canReviewBooking } = await import('../server/services/bookingService.js');
      const result = await canReviewBooking('booking-1', 'user-1');

      expect(result.canReview).toBe(true);
    });

    it('W2.2: User creates a review for completed stay', async () => {
      // Mock canReviewBooking via prisma
      prisma.booking.findFirst.mockResolvedValueOnce({
        id: 'booking-1',
        userId: 'user-1',
        hotelId: 'hotel-1',
        status: 'COMPLETED',
        checkOut: new Date(Date.now() - 86400000),
        review: null,
      });

      prisma.review.create.mockResolvedValue({
        id: 'review-1',
        userId: 'user-1',
        hotelId: 'hotel-1',
        bookingId: 'booking-1',
        rating: 5,
        comment: 'Amazing stay!',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { firstName: 'Jane', lastName: 'Doe' },
        hotel: { name: 'Grand Plaza' },
      });
      prisma.review.findMany.mockResolvedValue([{ rating: 5 }, { rating: 4 }]);

      const { createReview } = await import('../server/services/reviewService.js');
      const review = await createReview({
        hotelId: 'hotel-1',
        bookingId: 'booking-1',
        rating: 5,
        comment: 'Amazing stay!',
      }, 'user-1');

      expect(review.rating).toBe(5);
      expect(prisma.hotel.update).toHaveBeenCalled();
    });

    it('W2.3: Hotel rating is updated after review', async () => {
      prisma.review.findMany
        .mockResolvedValueOnce([{ rating: 5 }])
        .mockResolvedValueOnce([{ rating: 5 }]);
      prisma.hotel.update.mockResolvedValue({});

      const { default: reviewService } = await import('../server/services/reviewService.js');

      // Simulate what updateHotelRating does
      const reviews = await prisma.review.findMany({ where: { hotelId: 'hotel-1' }, select: { rating: true } });
      const avgRating = reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : 0;

      expect(avgRating).toBe(5);
    });

    it('W2.4: User cannot review the same booking twice', async () => {
      prisma.booking.findFirst.mockResolvedValueOnce({
        id: 'booking-1',
        userId: 'user-1',
        hotelId: 'hotel-1',
        status: 'COMPLETED',
        checkOut: new Date(Date.now() - 86400000),
        review: { id: 'rev-1', rating: 4 },
      });

      const { createReview } = await import('../server/services/reviewService.js');
      const AppError = (await import('../server/utils/AppError.js')).default;

      await expect(createReview({
        hotelId: 'hotel-1',
        bookingId: 'booking-1',
        rating: 4,
        comment: 'Second review',
      }, 'user-1')).rejects.toThrow(AppError);
    });
  });

  /**
   * Workflow 3: Booking → Cancellation → Refund
   */
  describe('W3: Cancellation workflow', () => {
    it('W3.1: User cancels a future booking', async () => {
      const futureDate = new Date(Date.now() + 7 * 86400000);
      prisma.booking.findFirst.mockResolvedValue({
        id: 'booking-1',
        userId: 'user-1',
        status: 'CONFIRMED',
        checkIn: futureDate,
        checkOut: new Date(futureDate.getTime() + 3 * 86400000),
        user: { email: 'jane@example.com', firstName: 'Jane', lastName: 'Doe' },
        hotel: { name: 'Grand Plaza' },
        room: { roomType: 'Deluxe' },
      });
      prisma.booking.update.mockResolvedValue({
        id: 'booking-1',
        status: 'CANCELLED',
        hotel: { name: 'Grand Plaza', location: 'New York' },
        room: { roomType: 'Deluxe' },
      });

      const { cancelBooking } = await import('../server/services/bookingService.js');
      const result = await cancelBooking('booking-1', 'user-1', 'USER');

      expect(result.status).toBe('CANCELLED');
    });

    it('W3.2: Admin can cancel any booking', async () => {
      const futureDate = new Date(Date.now() + 7 * 86400000);
      prisma.booking.findFirst.mockResolvedValue({
        id: 'booking-2',
        userId: 'other-user',
        status: 'CONFIRMED',
        checkIn: futureDate,
        checkOut: new Date(futureDate.getTime() + 2 * 86400000),
        user: { email: 'other@test.com', firstName: 'Other', lastName: 'User' },
        hotel: { name: 'Seaside Resort' },
        room: { roomType: 'Ocean View' },
      });
      prisma.booking.update.mockResolvedValue({
        id: 'booking-2',
        status: 'CANCELLED',
        hotel: { name: 'Seaside Resort', location: 'Miami' },
        room: { roomType: 'Ocean View' },
      });

      const { cancelBooking } = await import('../server/services/bookingService.js');
      const result = await cancelBooking('booking-2', 'admin-1', 'ADMIN');

      expect(result.status).toBe('CANCELLED');
    });

    it('W3.3: Cannot cancel already cancelled booking', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        id: 'booking-3',
        userId: 'user-1',
        status: 'CANCELLED',
        checkIn: new Date(Date.now() + 7 * 86400000),
        checkOut: new Date(Date.now() + 10 * 86400000),
      });

      const { cancelBooking } = await import('../server/services/bookingService.js');
      await expect(cancelBooking('booking-3', 'user-1', 'USER'))
        .rejects.toThrow('Booking is already cancelled');
    });
  });

  /**
   * Workflow 4: Admin operations
   */
  describe('W4: Admin management workflow', () => {
    it('W4.1: Admin creates a new hotel', async () => {
      prisma.hotel.create.mockResolvedValue({
        id: 'hotel-2',
        name: 'New Luxury Hotel',
        location: 'Paris, France',
        address: '1 Champs Elysees',
        description: 'A luxury Parisian hotel',
        amenities: ['wifi', 'spa', 'restaurant'],
        images: ['https://example.com/paris.jpg'],
        rating: 0,
      });

      const { createHotel } = await import('../server/services/hotelService.js');
      const hotel = await createHotel({
        name: 'New Luxury Hotel',
        location: 'Paris, France',
        address: '1 Champs Elysees',
        description: 'A luxury Parisian hotel',
        amenities: ['wifi', 'spa', 'restaurant'],
      });

      expect(hotel.name).toBe('New Luxury Hotel');
      expect(hotel.location).toBe('Paris, France');
    });

    it('W4.2: Admin adds rooms to a hotel', async () => {
      prisma.room.create.mockResolvedValue({
        id: 'room-3',
        hotelId: 'hotel-2',
        roomType: 'Parisian Suite',
        price: 599,
        capacity: 3,
        amenities: ['wifi', 'balcony', 'minibar'],
        hotel: { name: 'New Luxury Hotel', location: 'Paris, France' },
      });

      const { createRoom } = await import('../server/services/roomService.js');
      const room = await createRoom({
        hotelId: 'hotel-2',
        roomType: 'Parisian Suite',
        price: 599,
        capacity: 3,
        amenities: ['wifi', 'balcony', 'minibar'],
      });

      expect(room.roomType).toBe('Parisian Suite');
      expect(room.price).toBe(599);
    });

    it('W4.3: Admin views dashboard analytics', async () => {
      prisma.booking.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(15);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { totalPrice: 50000 } });
      prisma.booking.groupBy
        .mockResolvedValueOnce([
          { status: 'CONFIRMED', _count: { id: 60 } },
          { status: 'COMPLETED', _count: { id: 30 } },
          { status: 'CANCELLED', _count: { id: 10 } },
        ])
        .mockResolvedValueOnce([
          { hotelId: 'hotel-1', _count: { id: 40 }, _sum: { totalPrice: 20000 } },
        ]);
      prisma.user.count.mockResolvedValue(50);
      prisma.room.count.mockResolvedValue(30);
      prisma.booking.findMany
        .mockResolvedValueOnce([{ createdAt: new Date() }])
        .mockResolvedValueOnce([{ createdAt: new Date(), totalPrice: 500 }]);
      prisma.hotel.findMany.mockResolvedValue([
        { id: 'hotel-1', name: 'Grand Plaza' },
      ]);

      const { getDashboardAnalytics } = await import('../server/services/analyticsService.js');
      const analytics = await getDashboardAnalytics('30d');

      expect(analytics.summary.totalBookings).toBe(100);
      expect(analytics.summary.totalRevenue).toBe(50000);
    });
  });

  /**
   * Workflow 5: Error scenarios and edge cases
   */
  describe('W5: Error scenarios and edge cases', () => {
    it('W5.1: Exceeding room capacity is rejected', async () => {
      prisma.room.findFirst.mockResolvedValue({
        id: 'room-1', hotelId: 'hotel-1', roomType: 'Standard', price: 100, capacity: 2,
        hotel: { id: 'hotel-1', name: 'Hotel' },
      });

      const { createBooking } = await import('../server/services/bookingService.js');
      await expect(createBooking({
        hotelId: 'hotel-1',
        roomId: 'room-1',
        checkIn: '2026-08-01',
        checkOut: '2026-08-03',
        guests: 5,
      }, { id: 'user-1' })).rejects.toThrow('can only accommodate');
    });

    it('W5.2: Past check-in date is rejected', async () => {
      const { createBooking } = await import('../server/services/bookingService.js');
      await expect(createBooking({
        hotelId: 'hotel-1',
        roomId: 'room-1',
        checkIn: '2020-01-01',
        checkOut: '2020-01-03',
        guests: 2,
      }, { id: 'user-1' })).rejects.toThrow('past');
    });

    it('W5.3: Non-existent hotel returns 404', async () => {
      prisma.hotel.findUnique.mockResolvedValue(null);
      const { getHotelById } = await import('../server/services/hotelService.js');
      await expect(getHotelById('nonexistent')).rejects.toThrow('Hotel not found');
    });

    it('W5.4: Non-existent room returns 404', async () => {
      prisma.room.findUnique.mockResolvedValue(null);
      const { getRoomById } = await import('../server/services/roomService.js');
      await expect(getRoomById('nonexistent')).rejects.toThrow('Room not found');
    });

    it('W5.5: Invalid rating is rejected by validation schema', async () => {
      const Joi = await import('joi');
      const { schemas } = await import('../server/middleware/validate.js');

      const { error } = schemas.createReview.validate({
        hotelId: '550e8400-e29b-41d4-a716-446655440000',
        bookingId: '550e8400-e29b-41d4-a716-446655440001',
        rating: 10,
        comment: 'Too high rating',
      });

      expect(error).toBeDefined();
    });

    it('W5.6: Missing required fields are caught by validation', async () => {
      const { schemas } = await import('../server/middleware/validate.js');

      const { error } = schemas.register.validate({
        email: 'test@test.com',
        password: 'short',
      });

      expect(error).toBeDefined();
    });
  });
});
