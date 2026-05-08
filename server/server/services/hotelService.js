import prisma from '../config/database.js';
import AppError from '../utils/AppError.js';

export const createHotel = async (data) => {
  const hotel = await prisma.hotel.create({
    data,
    include: {
      rooms: true,
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });
  return hotel;
};

export const getAllHotels = async ({ location, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (location) {
    where.OR = [
      { location: { contains: location, mode: 'insensitive' } },
      { address: { contains: location, mode: 'insensitive' } },
      { name: { contains: location, mode: 'insensitive' } },
    ];
  }

  const [hotels, total] = await Promise.all([
    prisma.hotel.findMany({
      where,
      skip,
      take: limit,
      include: {
        rooms: {
          select: {
            id: true,
            roomType: true,
            price: true,
            capacity: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.hotel.count({ where }),
  ]);

  const hotelsWithAvgRating = hotels.map((hotel) => ({
    ...hotel,
    avgRating: hotel.reviews.length > 0
      ? hotel.reviews.reduce((sum, r) => sum + r.rating, 0) / hotel.reviews.length
      : 0,
  }));

  return {
    hotels: hotelsWithAvgRating,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getHotelById = async (id) => {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: {
      rooms: true,
      reviews: {
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
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });

  if (!hotel) {
    throw new AppError('Hotel not found', 404);
  }

  const avgRating = hotel.reviews.length > 0
    ? hotel.reviews.reduce((sum, r) => sum + r.rating, 0) / hotel.reviews.length
    : 0;

  return {
    ...hotel,
    avgRating,
  };
};

export const updateHotel = async (id, data) => {
  const hotel = await prisma.hotel.update({
    where: { id },
    data,
    include: {
      rooms: true,
    },
  });
  return hotel;
};

export const deleteHotel = async (id) => {
  await prisma.hotel.delete({
    where: { id },
  });
  return true;
};

export default {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
};
