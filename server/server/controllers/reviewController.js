import * as reviewService from '../services/reviewService.js';
import catchAsync from '../utils/catchAsync.js';

export const createReview = catchAsync(async (req, res) => {
  const hotelId = req.params.hotelId || req.body.hotelId;
  const data = { ...req.body, hotelId };
  const review = await reviewService.createReview(data, req.user.id);

  res.status(201).json({
    status: 'success',
    data: {
      review,
    },
  });
});

export const getHotelReviews = catchAsync(async (req, res) => {
  const { page: pageStr, limit: limitStr } = req.query;
  const page = pageStr ? Math.max(1, parseInt(pageStr) || 1) : 1;
  const limit = limitStr ? Math.min(50, Math.max(1, parseInt(limitStr) || 10)) : 10;
  const result = await reviewService.getHotelReviews(req.params.hotelId, { page, limit });

  res.status(200).json({
    status: 'success',
    results: result.reviews.length,
    pagination: result.pagination,
    data: {
      reviews: result.reviews,
      avgRating: result.avgRating,
      totalReviews: result.totalReviews,
    },
  });
});

export const getMyReviews = catchAsync(async (req, res) => {
  const reviews = await reviewService.getUserReviews(req.user.id);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

export const updateReview = catchAsync(async (req, res) => {
  const review = await reviewService.updateReview(req.params.id, req.user.id, req.body);

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

export const deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReview(req.params.id, req.user.id);

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

export default {
  createReview,
  getHotelReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
