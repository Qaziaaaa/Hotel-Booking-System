import express from 'express';
import { protect, optionalAuth } from '../middleware/auth.js';
import {
  chat,
  getHistory,
  clearHistory,
} from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/chat', optionalAuth, chat);
router.get('/history/:sessionId', optionalAuth, getHistory);
router.delete('/history/:sessionId', optionalAuth, clearHistory);

export default router;
