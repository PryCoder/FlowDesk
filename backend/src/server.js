// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Now import everything else
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.route.js';
import chatbotRoutes from './routes/chatbot.route.js';
import calendarRoutes from './routes/calendar.route.js';
import knowledgeRoutes from './routes/knowledge.route.js';
import canvasRoutes from './routes/canvas.js';
import databaseService from './services/database.service.js';

const app = express();
const server = http.createServer(app);

// Setup CORS
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Make dbService available to routes using the imported singleton instance
app.set('dbService', databaseService);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/canvas', canvasRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('PrismAlly API is running');
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});