import prisma from '../config/database.js';
import AppError from '../utils/AppError.js';
import { canReviewBooking } from './bookingService.js';

export const createReview = async (data, userId) => {
  const { hotelId, bookingId, rating, comment } = data;

  // Verify user can review this booking
  const { canReview, booking, reason } = await canReviewBooking(bookingId, userId);

  if (!canReview) {
    throw new AppError(reason, 403);
  }

  // Verify booking belongs to the hotel
  if (booking.hotelId !== hotelId) {
    throw new AppError('Booking does not belong to this hotel', 400);
  }

  const review = await prisma.review.create({
    data: {
      userId,
      hotelId,
      bookingId,
      rating,
      comment,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      hotel: {
        select: {
          name: true,
        },
      },
    },
  });

  // Update hotel average rating
  await updateHotelRating(hotelId);

  return review;
};

export const getHotelReviews = async (hotelId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
  });

  if (!hotel) {
    throw new AppError('Hotel not found', 404);
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { hotelId },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.review.count({ where: { hotelId } }),
  ]);

  // Calculate average rating
  const allRatings = await prisma.review.findMany({
    where: { hotelId },
    select: { rating: true },
  });

  const avgRating = allRatings.length > 0
    ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
    : 0;

  return {
    reviews,
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews: total,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getUserReviews = async (userId) => {
  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
          location: true,
          images: true,
        },
      },
      booking: {
        select: {
          checkIn: true,
          checkOut: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reviews;
};

export const updateReview = async (id, userId, data) => {
  const review = await prisma.review.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  const updatedReview = await prisma.review.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      hotel: {
        select: {
          name: true,
        },
      },
    },
  });

  // Update hotel average rating
  await updateHotelRating(review.hotelId);

  return updatedReview;
};

export const deleteReview = async (id, userId) => {
  const review = await prisma.review.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  const hotelId = review.hotelId;

  await prisma.review.delete({
    where: { id },
  });

  // Update hotel average rating
  await updateHotelRating(hotelId);

  return true;
};

const updateHotelRating = async (hotelId) => {
  const reviews = await prisma.review.findMany({
    where: { hotelId },
    select: { rating: true },
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  await prisma.hotel.update({
    where: { id: hotelId },
    data: { rating: Math.round(avgRating * 10) / 10 },
  });
};

export default {
  createReview,
  getHotelReviews,
  getUserReviews,
  updateReview,
  deleteReview,
};
