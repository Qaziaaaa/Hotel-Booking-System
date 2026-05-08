import * as notificationService from '../services/notificationService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const registerToken = catchAsync(async (req, res, next) => {
  if (!req.body.token) {
    return next(new AppError('Token is required', 400));
  }

  await notificationService.registerToken(req.user.id, req.body.token);

  res.status(200).json({
    status: 'success',
    message: 'Token registered',
  });
});

export default {
  registerToken,
};
