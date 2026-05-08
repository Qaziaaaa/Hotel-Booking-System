import prisma from '../config/database.js';
import AppError from '../utils/AppError.js';

export const createRoom = async (data) => {
  const room = await prisma.room.create({
    data,
    include: {
      hotel: {
        select: {
          name: true,
          location: true,
        },
      },
    },
  });
  return room;
};

export const getRoomsByHotel = async (hotelId, { checkIn, checkOut, guests }) => {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
  });

  if (!hotel) {
    throw new AppError('Hotel not found', 404);
  }

  let where = { hotelId };

  if (guests) {
    where.capacity = { gte: parseInt(guests) };
  }

  const rooms = await prisma.room.findMany({
    where,
    include: {
      hotel: {
        select: {
          name: true,
          location: true,
        },
      },
      bookings: {
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          ...(checkIn && checkOut && {
            AND: [
              { checkIn: { lt: new Date(checkOut) } },
              { checkOut: { gt: new Date(checkIn) } },
            ],
          }),
        },
        select: {
          checkIn: true,
          checkOut: true,
        },
      },
    },
  });

  // If dates provided, mark rooms as available or not
  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    return rooms.map((room) => {
      const hasOverlap = room.bookings.some((booking) => {
        const bookingStart = new Date(booking.checkIn);
        const bookingEnd = new Date(booking.checkOut);

        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        return checkInDate < bookingEnd && checkOutDate > bookingStart;
      });

      return {
        ...room,
        isAvailable: !hasOverlap,
      };
    });
  }

  return rooms.map((room) => ({
    ...room,
    isAvailable: true,
  }));
};

export const getRoomById = async (id) => {
  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      hotel: true,
      bookings: {
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          checkOut: { gte: new Date() },
        },
        select: {
          checkIn: true,
          checkOut: true,
        },
      },
    },
  });

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  return room;
};

export const updateRoom = async (id, data) => {
  const room = await prisma.room.update({
    where: { id },
    data,
    include: {
      hotel: {
        select: {
          name: true,
          location: true,
        },
      },
    },
  });
  return room;
};

export const deleteRoom = async (id) => {
  await prisma.room.delete({
    where: { id },
  });
  return true;
};

export const checkRoomAvailability = async (roomId, checkIn, checkOut, excludeBookingId = null) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const where = {
    roomId,
    status: { in: ['PENDING', 'CONFIRMED'] },
    AND: [
      { checkIn: { lt: checkOutDate } },
      { checkOut: { gt: checkInDate } },
    ],
  };

  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }

  const conflictingBookings = await prisma.booking.findMany({
    where,
  });

  return conflictingBookings.length === 0;
};

export default {
  createRoom,
  getRoomsByHotel,
  getRoomById,
  updateRoom,
  deleteRoom,
  checkRoomAvailability,
};
