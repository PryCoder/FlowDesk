import express from 'express';
import emailService from '../services/emailService.js';
import authService from '../services/authService.js';
import Gemini, { generateText, getGeminiModel } from '../utils/geminiClient.js'; // your Gemini helper
import geminiClient from '../utils/geminiClient.js';

const router = express.Router();

// -------------------- AUTH MIDDLEWARE --------------------
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = await authService.verifyToken(token);
    if (!decoded?.userId) return res.status(401).json({ error: 'Invalid or expired token' });

    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// -------------------- EMAIL ROUTES --------------------

// Sync emails
router.post('/sync', authenticate, async (req, res) => {
  try {
    const { accessToken, refreshToken, maxResults = 50 } = req.body;
    if (!accessToken && !refreshToken) return res.status(400).json({ error: 'Access or refresh token required' });

    const result = await emailService.syncUserEmails(req.user.userId, accessToken, maxResults, refreshToken);
    res.json({ success: true, syncedCount: result.syncedCount, emails: result.emails });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Get all emails
router.get('/', authenticate, async (req, res) => {
  const emails = await emailService.getUserEmails(req.user.userId);
  res.json({ success: true, emails });
});

// -------------------- GEMINI / GOOGLE GenAI ROUTES --------------------

// Sentiment analysis
router.post('/sentiment', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const sentiment = await Gemini.analyzeSentiment(text);
    res.json({ success: true, sentiment });
  } catch (err) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// Suggested reply
router.post('/suggest-reply', authenticate, async (req, res) => {
  try {
    const { text, tone = 'professional' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const prompt = `Generate a ${tone} email reply to the following text:\n\n"${text}"`;
    const suggestedReply = await geminiClient.generateText(prompt, 'gemini-2.5-flash');

    res.json({ success: true, suggestedReply, tone });
  } catch (err) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ error: 'Failed to generate suggested reply' });
  }
});

// Optional: Summarize text
router.post('/summarize', authenticate, async (req, res) => {
  try {
    const { text, maxLength = 500 } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const summary = await geminiClient.summarizeText(text, maxLength);
    res.json({ success: true, summary });
  } catch (err) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ error: 'Failed to summarize text' });
  }
});

export default router;
