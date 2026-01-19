// src/chatbot/controllers/chatbot.controller.js
import chatbotService from '../services/chatbot.service.js'; // Use singleton service
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5 // Max 5 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, PPTX, DOCX, TXT, MD, CSV, JSON`), false);
    }
  }
});

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
};

ensureUploadsDir();

class ChatbotController {
  constructor() {
    // The service is a singleton, so we just reference it.
    this.chatbotService = chatbotService;
    // Binding is not necessary with arrow functions and a singleton export.
  }

  // Single file upload handler
  uploadDocument = (req, res) => {
    const uploadHandler = upload.single('file');

    uploadHandler(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: 'No file uploaded'
          });
        }
        
        const userId = req.user?.id || req.body.userId || req.query.userId;
        if (!userId) {
          return res.status(400).json({
            success: false,
            error: 'User ID is required'
          });
        }
        
        const options = {
          knowledgeBaseId: req.body.knowledgeBaseId,
          processImmediately: req.body.processImmediately !== 'false',
          storeInDatabase: req.body.storeInDatabase !== 'false',
          generateSummary: req.body.generateSummary !== 'false'
        };
        
        const result = await this.chatbotService.uploadDocument(
          req.file,
          userId,
          options
        );
        
        res.json({
          success: true,
          message: 'Document uploaded successfully',
          data: result
        });
        
      } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    });
  };

  // Multiple files upload handler
  uploadDocuments = (req, res) => {
    const uploadHandler = upload.array('files', 5);

    uploadHandler(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No files uploaded'
          });
        }
        
        const userId = req.user?.id || req.body.userId;
        if (!userId) {
          return res.status(400).json({
            success: false,
            error: 'User ID is required'
          });
        }
        
        const uploadPromises = req.files.map(file => 
          this.chatbotService.uploadDocument(file, userId, {
            knowledgeBaseId: req.body.knowledgeBaseId,
            processImmediately: false,
            storeInDatabase: true,
            generateSummary: true
          }).catch(error => ({
            success: false,
            filename: file.originalname,
            error: error.message
          }))
        );
        
        const results = await Promise.allSettled(uploadPromises);
        
        const successful = [];
        const failed = [];
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            successful.push({
              filename: req.files[index].originalname,
              ...result.value
            });
          } else {
            failed.push({
              filename: req.files[index].originalname,
              error: result.reason?.message || 'Unknown error'
            });
          }
        });
        
        res.json({
          success: true,
          message: `Uploaded ${successful.length} of ${req.files.length} files`,
          data: {
            successful,
            failed,
            total: req.files.length,
            successfulCount: successful.length,
            failedCount: failed.length
          }
        });
        
      } catch (error) {
        console.error('Multiple documents upload error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  };

  // Chat endpoint
  chat = async (req, res) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('\n=== CHAT REQUEST START ===');
    console.log(`📨 Request ID: ${requestId}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    try {
      const {
        message,
        userId,
        conversationId,
        knowledgeBaseId,
        stream = false,
        useRAG = false, // Changed default to false for speed
        includeProfile = false,
        includeHistory = true, // New option to control history
        fastMode = true, // NEW: Enable fast mode by default
        modelType = 'gemini',
        temperature = 0.3,
        maxTokens = 2000,
        contextWindow = 3 // Reduced from 10
      } = req.body;
      
      // Input validation (keep this fast)
      if (!message || !userId) {
        return res.status(400).json({
          success: false,
          error: !message ? 'Message is required' : 'User ID is required',
          code: !message ? 'MISSING_MESSAGE' : 'MISSING_USER_ID',
          requestId
        });
      }

      if (message.trim().length === 0 || message.length > 10000) {
        return res.status(400).json({
          success: false,
          error: message.trim().length === 0 ? 'Message cannot be empty' : 'Message too long',
          code: message.trim().length === 0 ? 'EMPTY_MESSAGE' : 'MESSAGE_TOO_LONG',
          requestId
        });
      }
      
      const options = {
        conversationId,
        knowledgeBaseId,
        stream,
        useRAG: fastMode ? false : useRAG, // Disable RAG in fast mode
        includeProfile: fastMode ? false : includeProfile, // Disable profile in fast mode
        includeHistory: fastMode ? includeHistory : true,
        modelType,
        temperature: parseFloat(temperature),
        maxTokens: parseInt(maxTokens),
        contextWindow: fastMode ? 3 : contextWindow, // Limit context in fast mode
        requestId,
        fastMode
      };
      
      // Regular response (optimized for speed)
      console.log(`⚡ [${requestId}] Processing in ${fastMode ? 'FAST' : 'NORMAL'} mode...`);
      const startTime = Date.now();
      
      const result = await this.chatbotService.getResponse(userId, message, options);
      const duration = Date.now() - startTime;
      
      console.log(`✅ [${requestId}] Response generated in ${duration}ms`);
      
      res.json({
        ...result,
        requestId,
        duration,
        fastMode
      });
      
      console.log(`=== CHAT REQUEST END [${requestId}] ===\n`);
      
    } catch (error) {
      console.error(`💥 [${requestId}] Error:`, error.message);

      let errorCode = 'SERVICE_ERROR';
      let statusCode = 500;
      let userMessage = 'An error occurred while processing your request';

      if (error.message.includes('API key')) {
        errorCode = 'API_KEY_ERROR';
        userMessage = 'AI service configuration error';
      } else if (error.message.includes('rate limit')) {
        errorCode = 'RATE_LIMIT_ERROR';
        statusCode = 429;
        userMessage = 'Too many requests. Please wait.';
      }

      res.status(statusCode).json({
        success: false,
        error: userMessage,
        code: errorCode,
        requestId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Document summarization
  summarize = async (req, res) => {
    try {
      const { content, documentType, documentName, userId } = req.body;
      
      if (!content || !documentType) {
        return res.status(400).json({
          success: false,
          error: 'Content and documentType are required'
        });
      }
      
      const summary = await this.chatbotService.summarizeDocument(
        content,
        documentType,
        documentName || 'Unnamed Document'
      );
      
      // Save to user's documents if userId provided
      if (userId) {
        // This would save the summary to the user's document history
      }
      
      res.json({
        success: true,
        summary,
        metadata: {
          documentType,
          documentName,
          contentLength: content.length,
          summaryLength: summary.length,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('Summarization error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Document Q&A
  documentQA = async (req, res) => {
    try {
      const { documentId, question, userId } = req.body;
      
      if (!documentId || !question) {
        return res.status(400).json({
          success: false,
          error: 'Document ID and question are required'
        });
      }
      
      const result = await this.chatbotService.analyzeDocumentQA(documentId, question);
      
      res.json(result);
      
    } catch (error) {
      console.error('Document Q&A error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Task extraction
  extractTasks = async (req, res) => {
    try {
      const { text, userId } = req.body;
      
      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required for task extraction'
        });
      }
      
      const tasks = await this.chatbotService.extractTasksFromText(text, userId);
      
      res.json({
        success: true,
        ...tasks,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Task extraction error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get chat history
  getChatHistory = async (req, res) => {
    try {
      const { userId } = req.params;
      const {
        conversationId,
        sessionId,
        limit = 50,
        offset = 0,
        startDate,
        endDate,
        includeMessages = true
      } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      const dbService = req.app.get('dbService');
      
      const chatHistory = await dbService.getChatHistory(userId, {
        conversationId,
        sessionId,
        limit: parseInt(limit),
        offset: parseInt(offset),
        startDate,
        endDate
      });
      
      let conversations = [];
      
      if (includeMessages) {
        // Group by conversation
        const conversationsMap = new Map();
        
        chatHistory.forEach(message => {
          if (!conversationsMap.has(message.conversation_id)) {
            conversationsMap.set(message.conversation_id, {
              conversationId: message.conversation_id,
              sessionId: message.session_id,
              userId: message.user_id,
              messages: [],
              messageCount: 0,
              createdAt: message.created_at,
              lastUpdated: message.updated_at || message.created_at
            });
          }
          
          const conv = conversationsMap.get(message.conversation_id);
          conv.messages.push({
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: message.created_at,
            metadata: message.metadata
          });
          conv.messageCount++;
          
          if (new Date(message.created_at) > new Date(conv.lastUpdated)) {
            conv.lastUpdated = message.created_at;
          }
        });
        
        conversations = Array.from(conversationsMap.values());
        
        // Sort conversations by last updated
        conversations.sort((a, b) => 
          new Date(b.lastUpdated) - new Date(a.lastUpdated)
        );
      }
      
      // Get user stats
      const userStats = await dbService.getUserStats(userId);
      
      res.json({
        success: true,
        data: {
          userId,
          totalMessages: chatHistory.length,
          conversations: includeMessages ? conversations : undefined,
          messages: !includeMessages ? chatHistory : undefined,
          userStats,
          query: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            startDate,
            endDate
          }
        }
      });
      
    } catch (error) {
      console.error('Chat history error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get conversation details
  getConversation = async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { includeAnalysis = false } = req.query;
      
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: 'Conversation ID is required'
        });
      }
      
      const dbService = req.app.get('dbService');
      
      const messages = await dbService.getConversation(conversationId);
      
      if (messages.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }
      
      let analysis = null;
      if (includeAnalysis) {
        analysis = await this.chatbotService.getConversationAnalysis(conversationId);
      }
      
      const conversation = {
        conversationId,
        userId: messages[0].user_id,
        sessionId: messages[0].session_id,
        messageCount: messages.length,
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
          metadata: msg.metadata
        })),
        createdAt: messages[0].created_at,
        lastUpdated: messages[messages.length - 1].created_at,
        analysis
      };
      
      res.json({
        success: true,
        data: conversation
      });
      
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get conversation analysis
  getConversationAnalysis = async (req, res) => {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: 'Conversation ID is required'
        });
      }
      
      const analysis = await this.chatbotService.getConversationAnalysis(conversationId);
      
      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found or no messages'
        });
      }
      
      res.json({
        success: true,
        data: analysis
      });
      
    } catch (error) {
      console.error('Get conversation analysis error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete conversation
  deleteConversation = async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { userId } = req.body;
      
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: 'Conversation ID is required'
        });
      }
      
      const dbService = req.app.get('dbService');
      
      const deleted = await dbService.deleteConversation(conversationId, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found or already deleted'
        });
      }
      
      res.json({
        success: true,
        message: 'Conversation deleted successfully',
        conversationId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get suggestions for conversation
  getSuggestions = async (req, res) => {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: 'Conversation ID is required'
        });
      }
      
      const dbService = req.app.get('dbService');
      
      const suggestions = await dbService.getSuggestions(conversationId);
      
      res.json({
        success: true,
        data: {
          conversationId,
          suggestions: suggestions.map(s => ({
            ...s,
            suggestions: typeof s.suggestions === 'string' 
              ? JSON.parse(s.suggestions) 
              : s.suggestions
          })),
          count: suggestions.length,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('Get suggestions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get user documents
  getUserDocuments = async (req, res) => {
    try {
      const { userId } = req.params;
      const {
        limit = 50,
        offset = 0,
        fileType,
        processedOnly = true
      } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      const dbService = req.app.get('dbService');
      
      const documents = await dbService.getUserDocuments(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        fileType
      });
      
      // Filter by processed status if requested
      const filteredDocuments = processedOnly
        ? documents.filter(doc => doc.is_processed)
        : documents;
      
      res.json({
        success: true,
        data: {
          userId,
          documents: filteredDocuments.map(doc => ({
            id: doc.id,
            filename: doc.filename,
            fileType: doc.file_type,
            fileSize: doc.file_size,
            isProcessed: doc.is_processed,
            processingError: doc.processing_error,
            summary: doc.summary,
            metadata: doc.metadata,
            createdAt: doc.created_at,
            updatedAt: doc.updated_at
          })),
          count: filteredDocuments.length,
          total: documents.length,
          query: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            fileType,
            processedOnly
          }
        }
      });
      
    } catch (error) {
      console.error('Get user documents error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // System stats
  systemStats = async (req, res) => {
    try {
      const stats = await this.chatbotService.getSystemStats();
      
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('System stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Health check
  health = async (req, res) => {
    try {
      const dbService = req.app.get('dbService');
      const dbHealth = await dbService.checkHealth();
      
      const stats = await this.chatbotService.getSystemStats();
      
      res.json({
        success: true,
        status: 'operational',
        services: {
          database: dbHealth ? 'connected' : 'disconnected',
          chatbot: 'running',
          vectorStore: 'running',
          documentProcessing: 'running'
        },
        stats: {
          activeSessions: stats.activeSessions,
          activeConversations: stats.activeConversations
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        status: 'degraded',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Detailed health check
  detailedHealth = async (req, res) => {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Chatbot API',
        checks: {}
      };

      // 1. Check database connection
      try {
        await databaseService.initialize();
        healthStatus.checks.database = {
          status: 'healthy',
          message: 'Database connection successful'
        };
      } catch (dbError) {
        healthStatus.checks.database = {
          status: 'unhealthy',
          message: `Database error: ${dbError.message}`
        };
        healthStatus.status = 'degraded';
      }

      // 2. Check Gemini API
      try {
        const testPrompt = "Say 'OK' if you can read this.";
        const testResponse = await chatbotService.llm.invoke(testPrompt);
        healthStatus.checks.geminiAI = {
          status: 'healthy',
          message: 'Gemini API responding',
          model: 'gemini-2.5-flash' // Updated to reflect actual model
        };
      } catch (aiError) {
        healthStatus.checks.geminiAI = {
          status: 'unhealthy',
          message: `Gemini API error: ${aiError.message}`
        };
        healthStatus.status = 'degraded';
      }

      // 3. Check session management
      try {
        const sessionCount = chatbotService.userSessions.size;
        healthStatus.checks.sessions = {
          status: 'healthy',
          message: `${sessionCount} active sessions`,
          activeCount: sessionCount
        };
      } catch (sessionError) {
        healthStatus.checks.sessions = {
          status: 'unhealthy',
          message: `Session error: ${sessionError.message}`
        };
        healthStatus.status = 'degraded';
      }

      // 4. Check vector store
      try {
        const vectorStoreInfo = await chatbotService.vectorStoreService.getAllStoresInfo();
        healthStatus.checks.vectorStore = {
          status: 'healthy',
          message: `Vector store operational`,
          stores: vectorStoreInfo.length
        };
      } catch (vectorError) {
        healthStatus.checks.vectorStore = {
          status: 'unhealthy',
          message: `Vector store error: ${vectorError.message}`
        };
        healthStatus.status = 'degraded';
      }

      // 5. Environment variables check
      const envVars = {
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
        JWT_SECRET: !!process.env.JWT_SECRET
      };
      
      const missingVars = Object.entries(envVars)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      healthStatus.checks.environment = {
        status: missingVars.length === 0 ? 'healthy' : 'unhealthy',
        message: missingVars.length === 0 
          ? 'All required environment variables present' 
          : `Missing: ${missingVars.join(', ')}`,
        configured: envVars
      };

      if (missingVars.length > 0) {
        healthStatus.status = 'degraded';
      }

      // Overall status code
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        success: healthStatus.status === 'healthy',
        ...healthStatus
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        checks: {}
      });
    }
  }
}

// Export a single, ready-to-use instance of the controller
export default new ChatbotController();