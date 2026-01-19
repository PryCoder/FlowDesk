// src/routes/chatbot.route.js
import express from 'express';
import chatbotController from '../services/chatbot.controller.js';
import AuthService from '../services/authService.js';

const router = express.Router();

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    const user = await AuthService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

// --- Chatbot Routes ---

// Health check (no auth required for monitoring)
router.get('/health', chatbotController.health);

// System stats (requires auth)
router.get('/stats', authenticate, chatbotController.systemStats);
router.get('/system/stats', authenticate, chatbotController.systemStats);

// Main chat endpoint
router.post('/chat', authenticate, chatbotController.chat);

// Document upload (single and multiple)
router.post('/upload', authenticate, chatbotController.uploadDocument);
router.post('/uploads', authenticate, chatbotController.uploadDocuments);
router.post('/upload-multiple', authenticate, chatbotController.uploadDocuments);

// Document analysis
router.post('/summarize', authenticate, chatbotController.summarize);
router.post('/document-qa', authenticate, chatbotController.documentQA);

// Task extraction
router.post('/extract-tasks', authenticate, chatbotController.extractTasks);

// History and conversations
router.get('/history/:userId', authenticate, chatbotController.getChatHistory);
router.get('/conversation/:conversationId', authenticate, chatbotController.getConversation);
router.get('/conversations/:conversationId', authenticate, chatbotController.getConversation);
router.get('/conversations/:conversationId/analysis', authenticate, chatbotController.getConversationAnalysis);
router.delete('/conversation/:conversationId', authenticate, chatbotController.deleteConversation);

// Suggestions
router.get('/suggestions/:conversationId', authenticate, chatbotController.getSuggestions);

// User documents
router.get('/documents/:userId', authenticate, chatbotController.getUserDocuments);

export default router;
