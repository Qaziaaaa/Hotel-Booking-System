import * as authService from '../services/authService.js';
import catchAsync from '../utils/catchAsync.js';

const COOKIE_OPTIONS = {
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

export const register = catchAsync(async (req, res) => {
  const { user, token } = await authService.register(req.body);

  res.cookie('jwt', token, COOKIE_OPTIONS);

  res.status(201).json({
    status: 'success',
    data: {
      user,
      token,
    },
  });
});

export const login = catchAsync(async (req, res) => {
  const { user, token } = await authService.login(req.body);

  res.cookie('jwt', token, COOKIE_OPTIONS);

  res.status(200).json({
    status: 'success',
    data: {
      user,
      token,
    },
  });
});

export const logout = catchAsync(async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

export default { register, login, logout, getMe };
