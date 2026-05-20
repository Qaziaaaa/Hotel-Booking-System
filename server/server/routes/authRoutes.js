import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  register,
  login,
  logout,
  getMe,
  updateMe,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

export default router;
