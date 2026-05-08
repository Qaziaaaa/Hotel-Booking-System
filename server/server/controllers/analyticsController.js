import catchAsync from '../utils/catchAsync.js';
import analyticsService from '../services/analyticsService.js';

export const getDashboardStats = catchAsync(async (req, res) => {
  const { period } = req.query;

  const data = await analyticsService.getDashboardAnalytics(period);

  res.status(200).json({
    status: 'success',
    data,
  });
});

export const getUserStats = catchAsync(async (req, res) => {
  const data = await analyticsService.getUserAnalytics();

  res.status(200).json({
    status: 'success',
    data,
  });
});

export const getHotelStats = catchAsync(async (req, res) => {
  const { hotelId } = req.params;

  const data = await analyticsService.getHotelAnalytics(hotelId);

  res.status(200).json({
    status: 'success',
    data,
  });
});

export default {
  getDashboardStats,
  getUserStats,
  getHotelStats,
};
