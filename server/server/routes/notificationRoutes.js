import express from 'express';
import { protect } from '../middleware/auth.js';
import { registerToken } from '../controllers/notificationController.js';

const router = express.Router();

router.post('/register-token', protect, registerToken);

export default router;
