import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import DatabaseService  from './src/services/database.service.js';
import { RealtimeService } from './src/services/RealtimeServices.js';

// Routes
import authRoutes from './src/routes/auth.js';
import meetingRoutes from './src/routes/meeting.js';
import workspaceRoutes from './src/routes/workspace.js';
import taskRoutes from './src/routes/tasks.js';
import emailRoutes from './src/routes/email.js';
import calenderMeetRoutes from './src/routes/calenderMeetRoutes.js';
import chatbotRoutes from './src/routes/chatbot.route.js';
import knowledgeBaseRoutes from './src/routes/knowledge.route.js';
import canvasRoutes from './src/routes/canvas.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

console.log('🚀 Server starting with PostgreSQL/Supabase integration...');

// Initialize database connection
const dbService = DatabaseService; // Remove 'new DatabaseService()'
await dbService.initialize();

// CORS middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://flow-desk-eta.vercel.app",
    "https://flowdesk-1gqs.onrender.com"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security headers and body parsing
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://flow-desk-eta.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e8 // 100MB for file uploads via socket
});

// Make services available to routes
app.set('io', io);
app.set('dbService', dbService);

// API routes
console.log('📦 Mounting API routes...');

try {
  app.use('/api/chatbot', chatbotRoutes);
  console.log('✅ Chatbot routes mounted');
} catch (error) {
  console.log('❌ Failed to mount chatbot routes:', error.message);
}

try {
  app.use('/api/knowledge-base', knowledgeBaseRoutes);
  console.log('✅ Knowledge Base routes mounted');
} catch (error) {
  console.log('❌ Failed to mount knowledge base routes:', error.message);
}

try {
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes mounted');
} catch (error) {
  console.log('❌ Failed to mount auth routes:', error.message);
}

app.use('/api/emails', emailRoutes);
app.use('/api/calendar-meet', calenderMeetRoutes);

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

try {
  app.use('/api/canvas', canvasRoutes);
  console.log('✅ Canvas routes mounted');
} catch (error) {
  console.log('❌ Failed to mount canvas routes:', error.message);
}

// Initialize real-time service
const realtimeService = new RealtimeService(io);

// Database health check
app.get('/api/db/health', async (req, res) => {
  try {
    const isHealthy = await dbService.checkHealth();
    res.json({
      success: isHealthy,
      message: isHealthy ? 'Database connection healthy' : 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Real-time stats endpoint
app.get('/api/realtime/stats', async (req, res) => {
  try {
    const stats = realtimeService.getAllActiveRooms();
    const totalUsers = await dbService.getTotalUsers();
    const totalChats = await dbService.getTotalChatMessages();
    
    res.json({
      success: true,
      activeRooms: stats,
      totalActiveRooms: stats.length,
      databaseStats: {
        totalUsers,
        totalChats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await dbService.checkHealth();
    res.json({ 
      success: true,
      message: 'Server is running',
      database: dbHealth ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      services: [
        'Chatbot API: /api/chatbot',
        'Knowledge Base: /api/knowledge-base',
        'Database Health: /api/db/health'
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date(),
    availableRoutes: [
      'GET /health',
      'GET /api/db/health',
      'POST /api/chatbot/chat',
      'POST /api/chatbot/upload',
      'GET /api/knowledge-base/documents'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎯 Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🤖 Chatbot Health: http://localhost:${PORT}/api/chatbot/health`);
  console.log(`🤖 Chatbot Chat: http://localhost:${PORT}/api/chatbot/chat`);
  console.log(`🗄️ Database: http://localhost:${PORT}/api/db/health`);
  console.log(`📚 Knowledge Base: http://localhost:${PORT}/api/knowledge-base\n`);
});