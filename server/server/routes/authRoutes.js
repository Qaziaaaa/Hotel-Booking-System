import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  register,
  login,
  logout,
  getMe,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.get('/logout', logout);
router.get('/me', protect, getMe);

export default router;
