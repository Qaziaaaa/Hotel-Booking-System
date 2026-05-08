import prisma from '../config/database.js';
import AppError from '../utils/AppError.js';
import { checkRoomAvailability } from './roomService.js';
import { sendBookingConfirmation, sendBookingCancellation } from '../utils/email.js';
import * as notificationService from './notificationService.js';

const calculateNights = (checkIn, checkOut) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.round(Math.abs((end - start) / oneDay));
};

export const createBooking = async (data, user) => {
  const { hotelId, roomId, checkIn, checkOut, guests, specialRequests } = data;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Validate dates
  if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
    throw new AppError('Check-in date cannot be in the past', 400);
  }

  if (checkOutDate <= checkInDate) {
    throw new AppError('Check-out date must be after check-in date', 400);
  }

  // Check room exists and belongs to hotel
  const room = await prisma.room.findFirst({
    where: {
      id: roomId,
      hotelId,
    },
    include: {
      hotel: true,
    },
  });

  if (!room) {
    throw new AppError('Room not found or does not belong to this hotel', 404);
  }

  // Check capacity
  if (guests > room.capacity) {
    throw new AppError(`This room can only accommodate ${room.capacity} guests`, 400);
  }

  // Check availability
  const isAvailable = await checkRoomAvailability(roomId, checkIn, checkOut);
  if (!isAvailable) {
    throw new AppError('Room is not available for the selected dates', 409);
  }

  // Calculate total price
  const nights = calculateNights(checkIn, checkOut);
  const totalPrice = nights * room.price;

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      hotelId,
      roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalPrice,
      specialRequests,
      status: 'CONFIRMED',
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      hotel: {
        select: {
          name: true,
          location: true,
        },
      },
      room: {
        select: {
          roomType: true,
          price: true,
        },
      },
    },
  });

  // Send confirmation email
  try {
    await sendBookingConfirmation(booking.user.email, {
      userName: `${booking.user.firstName} ${booking.user.lastName}`,
      hotelName: booking.hotel.name,
      roomType: booking.room.roomType,
      checkIn: booking.checkIn.toLocaleDateString(),
      checkOut: booking.checkOut.toLocaleDateString(),
      guests: booking.guests,
      totalPrice: booking.totalPrice,
    });
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
  }

  // Send push notification
  try {
    await notificationService.sendBookingConfirmedNotification(booking);
  } catch (error) {
    console.error('Failed to send booking confirmation push notification:', error);
  }

  return booking;
};

export const getUserBookings = async (userId) => {
  const bookings = await prisma.booking.findMany({
    where: {
      userId,
    },
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
          location: true,
          images: true,
        },
      },
      room: {
        select: {
          id: true,
          roomType: true,
          price: true,
          capacity: true,
        },
      },
      review: {
        select: {
          id: true,
          rating: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return bookings;
};

export const getBookingById = async (id, userId) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      hotel: true,
      room: true,
      review: true,
    },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  return booking;
};

export const cancelBooking = async (id, userId) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      hotel: {
        select: {
          name: true,
        },
      },
      room: {
        select: {
          roomType: true,
        },
      },
    },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.status === 'CANCELLED') {
    throw new AppError('Booking is already cancelled', 400);
  }

  if (booking.status === 'COMPLETED') {
    throw new AppError('Cannot cancel a completed booking', 400);
  }

  // Check if check-in is in the past
  if (new Date(booking.checkIn) < new Date()) {
    throw new AppError('Cannot cancel a booking that has already started', 400);
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: {
      hotel: {
        select: {
          name: true,
          location: true,
        },
      },
      room: {
        select: {
          roomType: true,
        },
      },
    },
  });

  // Send cancellation email
  try {
    await sendBookingCancellation(booking.user.email, {
      userName: `${booking.user.firstName} ${booking.user.lastName}`,
      hotelName: booking.hotel.name,
      roomType: booking.room.roomType,
      checkIn: booking.checkIn.toLocaleDateString(),
      checkOut: booking.checkOut.toLocaleDateString(),
    });
  } catch (error) {
    console.error('Failed to send cancellation email:', error);
  }

  // Send push notification
  try {
    await notificationService.sendBookingCancelledNotification(updatedBooking);
  } catch (error) {
    console.error('Failed to send booking cancellation push notification:', error);
  }

  return updatedBooking;
};

export const canReviewBooking = async (bookingId, userId) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId,
      status: 'COMPLETED',
      checkOut: { lt: new Date() },
    },
    include: {
      review: true,
    },
  });

  if (!booking) {
    return { canReview: false, reason: 'Booking not eligible for review' };
  }

  if (booking.review) {
    return { canReview: false, reason: 'Already reviewed' };
  }

  return { canReview: true, booking };
};

export default {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  canReviewBooking,
};
