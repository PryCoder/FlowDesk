// server.js - CORRECTED VERSION
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Routes
import authRoutes from './src/routes/auth.js';
import meetingRoutes from './src/routes/meeting.js';
import workspaceRoutes from './src/routes/workspace.js';
import taskRoutes from './src/routes/tasks.js';
import emailRoutes from './src/routes/email.js';

dotenv.config();

const app = express();
const server = createServer(app);

console.log('🚀 Server starting...');

// CORS middleware
app.use(cors({
  origin: [  "http://localhost:3000",
    "https://flow-desk-eta.vercel.app", // your frontend
    "https://flowdesk-1gqs.onrender.com" , 'http://127.0.0.1:3000'],
  credentials: true
}));

// Security headers and body parsing
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl}`);
  next();
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// API routes - FIXED: Make sure all route files exist
console.log('📦 Mounting API routes...');

try {
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes mounted');
} catch (error) {
  console.log('❌ Failed to mount auth routes:', error.message);
}
app.use('/api/emails',emailRoutes)
try {
  app.use('/api/meetings', meetingRoutes);
  console.log('✅ Meeting routes mounted');
} catch (error) {
  console.log('❌ Failed to mount meeting routes:', error.message);
}

try {
  app.use('/api/workspace', workspaceRoutes);
  console.log('✅ Workspace routes mounted');
} catch (error) {
  console.log('❌ Failed to mount workspace routes:', error.message);
}

try {
  app.use('/api/tasks', taskRoutes);
  console.log('✅ Task routes mounted');
} catch (error) {
  console.log('❌ Failed to mount task routes:', error.message);
}

console.log('✅ All routes mounted');

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    routes: [
      '/api/tasks/health',
      '/api/tasks',
      '/api/tasks/company/all'
    ]
  });
});

// FIXED: Proper 404 handler - remove the asterisk parameter
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date(),
    availableRoutes: [
      'GET /health',
      'GET /api/tasks/health',
      'GET /api/tasks',
      'GET /api/tasks/company/all',
      'POST /api/tasks'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎯 Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`📋 Tasks API: http://localhost:${PORT}/api/tasks/health`);
  console.log(`👤 User Tasks: http://localhost:${PORT}/api/tasks`);
  console.log(`🏢 Company Tasks: http://localhost:${PORT}/api/tasks/company/all\n`);
});