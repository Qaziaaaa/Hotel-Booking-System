import * as roomService from '../services/roomService.js';
import catchAsync from '../utils/catchAsync.js';

export const createRoom = catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (req.cloudinaryUrls && req.cloudinaryUrls.length > 0) {
    data.images = [...(data.images || []), ...req.cloudinaryUrls];
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
  const data = { ...req.body };
  if (req.cloudinaryUrls && req.cloudinaryUrls.length > 0) {
    data.images = [...(data.images || []), ...req.cloudinaryUrls];
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

  res.status(204).json({
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
