import catchAsync from '../utils/catchAsync.js';
import chatbotService from '../services/chatbotService.js';

export const chat = catchAsync(async (req, res) => {
  const { message, sessionId } = req.body;
  const userId = req.user?.id || null;

  const response = await chatbotService.processMessage(userId, message, sessionId);

  res.status(200).json({
    status: 'success',
    data: response,
  });
});

export const getHistory = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  const history = chatbotService.getHistory(sessionId);

  res.status(200).json({
    status: 'success',
    data: { history },
  });
});

export const clearHistory = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  chatbotService.clearContext(sessionId);

  res.status(200).json({
    status: 'success',
    message: 'Conversation history cleared',
  });
});

export default {
  chat,
  getHistory,
  clearHistory,
};
