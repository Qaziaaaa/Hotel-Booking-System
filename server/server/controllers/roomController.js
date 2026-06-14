import * as roomService from '../services/roomService.js';
import catchAsync from '../utils/catchAsync.js';

const normalizeAmenities = (amenities) => {
  if (Array.isArray(amenities)) return amenities;
  if (typeof amenities === 'string') return amenities.split(',').map((a) => a.trim()).filter(Boolean);
  return [];
};

export const createRoom = catchAsync(async (req, res) => {
  const { roomType, price, capacity, amenities, description, hotelId } = req.body;
  const data = {
    roomType,
    price: parseFloat(price),
    capacity: parseInt(capacity),
    amenities: normalizeAmenities(amenities),
    description,
    hotelId,
  };
  if (req.cloudinaryUrls && req.cloudinaryUrls.length > 0) {
    data.images = req.cloudinaryUrls;
  }
  const room = await roomService.createRoom(data);

  res.status(201).json({
    status: 'success',
    data: {
      room,
    },
  });
});

export const getRoomsByHotel = catchAsync(async (req, res) => {
  const { checkIn, checkOut, guests } = req.query;
  const rooms = await roomService.getRoomsByHotel(req.params.hotelId, {
    checkIn,
    checkOut,
    guests,
  });

  res.status(200).json({
    status: 'success',
    results: rooms.length,
    data: {
      rooms,
    },
  });
});

export const getRoom = catchAsync(async (req, res) => {
  const room = await roomService.getRoomById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      room,
    },
  });
});

export const updateRoom = catchAsync(async (req, res) => {
  const { roomType, price, capacity, amenities, description } = req.body;
  const data = {
    roomType,
    price: price ? parseFloat(price) : undefined,
    capacity: capacity ? parseInt(capacity) : undefined,
    amenities: normalizeAmenities(amenities),
    description,
  };
  if (req.cloudinaryUrls && req.cloudinaryUrls.length > 0) {
    const existing = await roomService.getRoomById(req.params.id);
    const existingImages = existing.images || [];
    data.images = [...existingImages, ...req.cloudinaryUrls];
  }
  const room = await roomService.updateRoom(req.params.id, data);

  res.status(200).json({
    status: 'success',
    data: {
      room,
    },
  });
});

export const deleteRoom = catchAsync(async (req, res) => {
  await roomService.deleteRoom(req.params.id);

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

export const checkAvailability = catchAsync(async (req, res) => {
  const { roomId, checkIn, checkOut } = req.query;

  const isAvailable = await roomService.checkRoomAvailability(roomId, checkIn, checkOut);

  res.status(200).json({
    status: 'success',
    data: {
      isAvailable,
    },
  });
});

export default {
  createRoom,
  getRoomsByHotel,
  getRoom,
  updateRoom,
  deleteRoom,
  checkAvailability,
};
