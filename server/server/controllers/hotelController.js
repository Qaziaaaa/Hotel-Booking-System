import * as hotelService from '../services/hotelService.js';
import catchAsync from '../utils/catchAsync.js';

export const createHotel = catchAsync(async (req, res) => {
  const { name, location, address, description, amenities } = req.body;
  const data = { name, location, address, description, amenities };
  if (req.cloudinaryUrls && req.cloudinaryUrls.length > 0) {
    data.images = req.cloudinaryUrls;
  }
  const hotel = await hotelService.createHotel(data);

  res.status(201).json({
    status: 'success',
    data: {
      hotel,
    },
  });
});

export const getAllHotels = catchAsync(async (req, res) => {
  const { location, page: pageStr, limit: limitStr } = req.query;
  const page = pageStr ? Math.max(1, parseInt(pageStr) || 1) : 1;
  const limit = limitStr ? Math.min(50, Math.max(1, parseInt(limitStr) || 10)) : 10;
  const result = await hotelService.getAllHotels({
    location,
    page,
    limit,
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
  const { name, location, address, description, amenities } = req.body;
  const data = { name, location, address, description, amenities };
  if (req.cloudinaryUrls && req.cloudinaryUrls.length > 0) {
    data.images = req.cloudinaryUrls;
  }
  const hotel = await hotelService.updateHotel(req.params.id, data);

  res.status(200).json({
    status: 'success',
    data: {
      hotel,
    },
  });
});

export const deleteHotel = catchAsync(async (req, res) => {
  await hotelService.deleteHotel(req.params.id);

  res.status(200).json({
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
