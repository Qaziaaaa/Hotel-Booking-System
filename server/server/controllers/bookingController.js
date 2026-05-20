import * as bookingService from '../services/bookingService.js';
import catchAsync from '../utils/catchAsync.js';

export const createBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.createBooking(req.body, req.user);

  res.status(201).json({
    status: 'success',
    data: {
      booking,
    },
  });
});

export const getMyBookings = catchAsync(async (req, res) => {
  const bookings = await bookingService.getUserBookings(req.user.id);

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

export const getBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user.id, req.user.role);

  res.status(200).json({
    status: 'success',
    data: {
      booking,
    },
  });
});

export const cancelBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user.id, req.user.role);

  res.status(200).json({
    status: 'success',
    data: {
      booking,
    },
  });
});

export const checkCanReview = catchAsync(async (req, res) => {
  const result = await bookingService.canReviewBooking(req.params.id, req.user.id);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export default {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  checkCanReview,
};
