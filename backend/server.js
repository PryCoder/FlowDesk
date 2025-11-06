import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Routes
import authRoutes from './src/routes/auth.js';
import meetingRoutes from './src/routes/meeting.js';
import emailRoutes from './src/routes/email.js';
import taskRoutes from './src/routes/tasks.js';
import analyticsRoutes from './src/routes/analytics.js';
import geminiRoutes from './src/routes/gemini.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Dynamically allow requests from frontend (local or deployed)
const allowedOrigins = [
  'http://localhost:3000', // local frontend
  process.env.FRONTEND_URL // deployed frontend, e.g., https://flow-desk-eta.vercel.app
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_company', (companyId) => {
    socket.join(companyId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/gemini', geminiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Agentic Work Assistant API'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
