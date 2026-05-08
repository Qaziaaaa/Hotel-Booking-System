import * as hotelService from '../services/hotelService.js';
import catchAsync from '../utils/catchAsync.js';

export const createHotel = catchAsync(async (req, res) => {
  const hotel = await hotelService.createHotel(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      hotel,
    },
  });
});

export const getAllHotels = catchAsync(async (req, res) => {
  const { location, page, limit } = req.query;
  const result = await hotelService.getAllHotels({
    location,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
  });

  res.status(200).json({
    status: 'success',
    results: result.hotels.length,
    pagination: result.pagination,
    data: {
      hotels: result.hotels,
    },
  });
});

export const getHotel = catchAsync(async (req, res) => {
  const hotel = await hotelService.getHotelById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      hotel,
    },
  });
});

export const updateHotel = catchAsync(async (req, res) => {
  const hotel = await hotelService.updateHotel(req.params.id, req.body);

  res.status(200).json({
    status: 'success',
    data: {
      hotel,
    },
  });
});

export const deleteHotel = catchAsync(async (req, res) => {
  await hotelService.deleteHotel(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export default {
  createHotel,
  getAllHotels,
  getHotel,
  updateHotel,
  deleteHotel,
};
