import Joi from 'joi';
import AppError from '../utils/AppError.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};

export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required',
    }),
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    phone: Joi.string().optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createBooking: Joi.object({
    hotelId: Joi.string().uuid().required(),
    roomId: Joi.string().uuid().required(),
    checkIn: Joi.date().iso().required(),
    checkOut: Joi.date().iso().greater(Joi.ref('checkIn')).required().messages({
      'date.greater': 'Check-out date must be after check-in date',
    }),
    guests: Joi.number().integer().min(1).required(),
    specialRequests: Joi.string().optional(),
  }),

  createReview: Joi.object({
    hotelId: Joi.string().uuid().required(),
    bookingId: Joi.string().uuid().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().min(10).max(1000).optional(),
  }),

  searchHotels: Joi.object({
    location: Joi.string().optional(),
    checkIn: Joi.date().iso().optional(),
    checkOut: Joi.date().iso().optional(),
    guests: Joi.number().integer().min(1).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
  }),
};
